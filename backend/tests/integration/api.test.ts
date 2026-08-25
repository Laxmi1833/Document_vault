import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { createServer, type Server } from "node:http";
import { createSchema, createYoga } from "graphql-yoga";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { resolvers } from "../../src/resolvers/index.ts";
import prisma from "../../src/lib/prisma.ts";

const typeDefs = readFileSync(
  join(import.meta.dirname, "../../src/schema.graphql"),
  "utf-8"
);

const schema = createSchema({ typeDefs, resolvers });
const yoga = createYoga({ schema });

let server: Server;
const PORT = 4444; // Use a non-conflicting port for integration tests
const BASE_URL = `http://localhost:${PORT}/graphql`;

async function gql(query: string) {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  return res.json();
}

beforeAll(async () => {
  server = createServer(yoga);
  await new Promise<void>((resolve) => server.listen(PORT, resolve));

  // Clean up test data from previous runs
  await prisma.document.deleteMany({});
  await prisma.collection.deleteMany({});
});

afterAll(async () => {
  // Clean up test data
  await prisma.document.deleteMany({});
  await prisma.collection.deleteMany({});

  server.close();
});

describe("Integration: Collections", () => {
  let collectionId: string;

  test("creates a collection", async () => {
    const data: any = await gql(`
      mutation {
        createCollection(input: { name: "Integration Test", slug: "integration-test" }) {
          id name slug createdAt
        }
      }
    `);

    expect(data.errors).toBeUndefined();
    expect(data.data.createCollection.name).toBe("Integration Test");
    expect(data.data.createCollection.slug).toBe("integration-test");
    expect(data.data.createCollection.createdAt).toBeDefined();
    collectionId = data.data.createCollection.id;
  });

  test("rejects duplicate slug", async () => {
    const data: any = await gql(`
      mutation {
        createCollection(input: { name: "Duplicate", slug: "integration-test" }) {
          id
        }
      }
    `);

    expect(data.errors).toBeDefined();
    expect(data.errors[0].extensions.code).toBe("CONFLICT");
  });

  test("lists all collections", async () => {
    const data: any = await gql(`
      query { collections { id name slug } }
    `);

    expect(data.errors).toBeUndefined();
    expect(data.data.collections.length).toBeGreaterThanOrEqual(1);
    const found = data.data.collections.find((c: any) => c.slug === "integration-test");
    expect(found).toBeDefined();
  });

  test("fetches single collection by ID", async () => {
    const data: any = await gql(`
      query { collection(id: "${collectionId}") { id name slug } }
    `);

    expect(data.errors).toBeUndefined();
    expect(data.data.collection.id).toBe(collectionId);
  });

  test("returns null for non-existent collection", async () => {
    const data: any = await gql(`
      query { collection(id: "nonexistent-id") { id } }
    `);

    expect(data.errors).toBeUndefined();
    expect(data.data.collection).toBeNull();
  });
});

describe("Integration: Documents", () => {
  let collectionId: string;
  let doc1Id: string;
  let doc2Id: string;

  beforeAll(async () => {
    // Create a fresh collection for document tests
    const col = await prisma.collection.create({
      data: { name: "Doc Test Col", slug: "doc-test-col-" + Date.now() },
    });
    collectionId = col.id;
  });

  test("creates a document", async () => {
    const data: any = await gql(`
      mutation {
        createDocument(input: {
          title: "Test Doc 1"
          content: "Hello world"
          tags: ["test", "integration"]
          collectionId: "${collectionId}"
        }) {
          id title content tags isArchived createdAt
          collection { name }
        }
      }
    `);

    expect(data.errors).toBeUndefined();
    const doc = data.data.createDocument;
    expect(doc.title).toBe("Test Doc 1");
    expect(doc.content).toBe("Hello world");
    expect(doc.tags).toEqual(["test", "integration"]);
    expect(doc.isArchived).toBe(false);
    expect(doc.collection.name).toBe("Doc Test Col");
    doc1Id = doc.id;
  });

  test("creates a second document", async () => {
    const data: any = await gql(`
      mutation {
        createDocument(input: {
          title: "Yoga Tutorial"
          content: "Learn GraphQL Yoga server"
          tags: ["graphql"]
          collectionId: "${collectionId}"
        }) {
          id title
        }
      }
    `);

    expect(data.errors).toBeUndefined();
    doc2Id = data.data.createDocument.id;
  });

  test("rejects document with non-existent collectionId", async () => {
    const data: any = await gql(`
      mutation {
        createDocument(input: {
          title: "Orphan"
          content: "No collection"
          collectionId: "nonexistent"
        }) { id }
      }
    `);

    expect(data.errors).toBeDefined();
    expect(data.errors[0].extensions.code).toBe("NOT_FOUND");
  });

  test("searches documents by content", async () => {
    const data: any = await gql(`
      query { documents(search: "Yoga") { edges { node { id title } } } }
    `);

    expect(data.errors).toBeUndefined();
    const titles = data.data.documents.edges.map((e: any) => e.node.title);
    expect(titles).toContain("Yoga Tutorial");
    expect(titles).not.toContain("Test Doc 1");
  });

  test("filters documents by collectionId", async () => {
    const data: any = await gql(`
      query { documents(collectionId: "${collectionId}") { edges { node { id } } } }
    `);

    expect(data.errors).toBeUndefined();
    expect(data.data.documents.edges.length).toBe(2);
  });

  test("paginates documents with cursor", async () => {
    // Page 1: take 1
    const page1: any = await gql(`
      query { documents(collectionId: "${collectionId}", take: 1) {
        edges { cursor node { title } }
        pageInfo { hasNextPage endCursor }
      }}
    `);

    expect(page1.errors).toBeUndefined();
    expect(page1.data.documents.edges).toHaveLength(1);
    expect(page1.data.documents.pageInfo.hasNextPage).toBe(true);

    const cursor = page1.data.documents.pageInfo.endCursor;

    // Page 2: take 1 after cursor
    const page2: any = await gql(`
      query { documents(collectionId: "${collectionId}", take: 1, cursor: "${cursor}") {
        edges { node { title } }
        pageInfo { hasNextPage }
      }}
    `);

    expect(page2.errors).toBeUndefined();
    expect(page2.data.documents.edges).toHaveLength(1);
    expect(page2.data.documents.pageInfo.hasNextPage).toBe(false);

    // Page 1 and Page 2 should have different documents
    const title1 = page1.data.documents.edges[0].node.title;
    const title2 = page2.data.documents.edges[0].node.title;
    expect(title1).not.toBe(title2);
  });

  test("updates a document", async () => {
    const data: any = await gql(`
      mutation {
        updateDocument(id: "${doc1Id}", input: { title: "Updated Title", isArchived: true }) {
          id title isArchived
        }
      }
    `);

    expect(data.errors).toBeUndefined();
    expect(data.data.updateDocument.title).toBe("Updated Title");
    expect(data.data.updateDocument.isArchived).toBe(true);
  });

  test("filters archived documents", async () => {
    const data: any = await gql(`
      query { documents(isArchived: true) { edges { node { id title } } } }
    `);

    expect(data.errors).toBeUndefined();
    const titles = data.data.documents.edges.map((e: any) => e.node.title);
    expect(titles).toContain("Updated Title");
  });

  test("moves a document to another collection", async () => {
    // Create a second collection
    const col2 = await prisma.collection.create({
      data: { name: "Target Col", slug: "target-col-" + Date.now() },
    });

    const data: any = await gql(`
      mutation {
        moveDocument(id: "${doc2Id}", collectionId: "${col2.id}") {
          id collectionId
          collection { name }
        }
      }
    `);

    expect(data.errors).toBeUndefined();
    expect(data.data.moveDocument.collectionId).toBe(col2.id);
    expect(data.data.moveDocument.collection.name).toBe("Target Col");
  });

  test("deletes a document", async () => {
    const data: any = await gql(`
      mutation { deleteDocument(id: "${doc1Id}") { id title } }
    `);

    expect(data.errors).toBeUndefined();
    expect(data.data.deleteDocument.id).toBe(doc1Id);

    // Verify it's gone
    const check: any = await gql(`
      mutation { deleteDocument(id: "${doc1Id}") { id } }
    `);
    expect(check.errors).toBeDefined();
    expect(check.errors[0].extensions.code).toBe("NOT_FOUND");
  });
});
