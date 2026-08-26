import { describe, test, expect, beforeEach } from "bun:test";
import { prismaMock } from "../helpers/mock.ts";
import { documentResolvers } from "../../src/resolvers/document.ts";

beforeEach(() => {
  prismaMock.collection.findUnique.mockClear();
  prismaMock.document.findUnique.mockClear();
  prismaMock.document.findMany.mockClear();
  prismaMock.document.create.mockClear();
  prismaMock.document.update.mockClear();
  prismaMock.document.delete.mockClear();
});

describe("Document Resolvers", () => {
  // 1. Creates document with valid input
  test("creates document with valid input", async () => {
    prismaMock.collection.findUnique.mockResolvedValue({ id: "col1", name: "Col" } as any);
    const mockDoc = { id: "doc1", title: "Doc", content: "Body", tags: ["ts"], collectionId: "col1", createdAt: new Date() };
    prismaMock.document.create.mockResolvedValue(mockDoc as any);

    const result = await documentResolvers.Mutation.createDocument(null, {
      input: { title: "Doc", content: "Body", tags: ["ts"], collectionId: "col1" },
    });

    expect(result.title).toBe("Doc");
    expect(prismaMock.document.create).toHaveBeenCalled();
  });

  // 2. Rejects empty title
  test("rejects empty title", async () => {
    expect(
      documentResolvers.Mutation.createDocument(null, {
        input: { title: "  ", content: "Body", collectionId: "col1" },
      })
    ).rejects.toThrow("title must not be empty or whitespace-only");
  });

  // 3. Rejects empty content
  test("rejects empty content", async () => {
    expect(
      documentResolvers.Mutation.createDocument(null, {
        input: { title: "Doc", content: "", collectionId: "col1" },
      })
    ).rejects.toThrow("content must not be empty or whitespace-only");
  });

  // 4. Rejects non-existent collectionId
  test("rejects non-existent collectionId", async () => {
    prismaMock.collection.findUnique.mockResolvedValue(null);

    expect(
      documentResolvers.Mutation.createDocument(null, {
        input: { title: "Doc", content: "Body", collectionId: "nonexistent" },
      })
    ).rejects.toThrow('Collection with ID "nonexistent" not found');
  });

  // 5. Updates document fields
  test("updates document fields", async () => {
    prismaMock.document.findUnique.mockResolvedValue({ id: "doc1" } as any);
    prismaMock.document.update.mockResolvedValue({ id: "doc1", title: "Updated" } as any);

    const result = await documentResolvers.Mutation.updateDocument(null, {
      id: "doc1",
      input: { title: "Updated" },
    });

    expect(result.title).toBe("Updated");
  });

  // 6. Rejects update on non-existent document
  test("rejects update on non-existent document", async () => {
    prismaMock.document.findUnique.mockResolvedValue(null);

    expect(
      documentResolvers.Mutation.updateDocument(null, {
        id: "nonexistent",
        input: { title: "Updated" },
      })
    ).rejects.toThrow('Document with ID "nonexistent" not found');
  });

  // 7. Deletes document
  test("deletes document", async () => {
    prismaMock.document.findUnique.mockResolvedValue({ id: "doc1" } as any);
    prismaMock.document.delete.mockResolvedValue({ id: "doc1" } as any);

    const result = await documentResolvers.Mutation.deleteDocument(null, { id: "doc1" });
    expect(result.id).toBe("doc1");
  });

  // 8. Rejects delete on non-existent document
  test("rejects delete on non-existent document", async () => {
    prismaMock.document.findUnique.mockResolvedValue(null);

    expect(
      documentResolvers.Mutation.deleteDocument(null, { id: "nonexistent" })
    ).rejects.toThrow('Document with ID "nonexistent" not found');
  });

  // 9. Moves document to valid collection
  test("moves document to valid collection", async () => {
    prismaMock.document.findUnique.mockResolvedValue({ id: "doc1" } as any);
    prismaMock.collection.findUnique.mockResolvedValue({ id: "col2" } as any);
    prismaMock.document.update.mockResolvedValue({ id: "doc1", collectionId: "col2" } as any);

    const result = await documentResolvers.Mutation.moveDocument(null, { id: "doc1", collectionId: "col2" });
    expect(result.collectionId).toBe("col2");
  });

  // 10. Rejects move to non-existent collection
  test("rejects move to non-existent collection", async () => {
    prismaMock.document.findUnique.mockResolvedValue({ id: "doc1" } as any);
    prismaMock.collection.findUnique.mockResolvedValue(null);

    expect(
      documentResolvers.Mutation.moveDocument(null, { id: "doc1", collectionId: "nonexistent" })
    ).rejects.toThrow('Collection with ID "nonexistent" not found');
  });

  // 11. Filters by collectionId
  test("filters by collectionId", async () => {
    prismaMock.document.findMany.mockResolvedValue([]);
    await documentResolvers.Query.documents(null, { collectionId: "col1" });
    expect(prismaMock.document.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ collectionId: "col1" }),
      })
    );
  });

  // 12. Search matches title substring
  test("search matches title or content substring", async () => {
    prismaMock.document.findMany.mockResolvedValue([]);
    await documentResolvers.Query.documents(null, { search: "searchterm" });
    expect(prismaMock.document.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { title: { contains: "searchterm", mode: "insensitive" } },
            { content: { contains: "searchterm", mode: "insensitive" } },
          ],
        }),
      })
    );
  });

  // 13. Filters by isArchived
  test("filters by isArchived", async () => {
    prismaMock.document.findMany.mockResolvedValue([]);
    await documentResolvers.Query.documents(null, { isArchived: true });
    expect(prismaMock.document.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isArchived: true }),
      })
    );
  });

  // 14. Pagination returns correct take count
  test("pagination requests limit + 1 items", async () => {
    prismaMock.document.findMany.mockResolvedValue([]);
    await documentResolvers.Query.documents(null, { take: 5 });
    expect(prismaMock.document.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 6,
      })
    );
  });

  // 15. Cursor returns next page
  test("pagination applies cursor and skip", async () => {
    prismaMock.document.findMany.mockResolvedValue([]);
    await documentResolvers.Query.documents(null, { take: 5, cursor: "last-doc-id" });
    expect(prismaMock.document.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        cursor: { id: "last-doc-id" },
        skip: 1,
      })
    );
  });
});
