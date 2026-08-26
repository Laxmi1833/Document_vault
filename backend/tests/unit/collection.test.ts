import { describe, test, expect, beforeEach } from "bun:test";
import { prismaMock } from "../helpers/mock.ts";
import { collectionResolvers } from "../../src/resolvers/collection.ts";

beforeEach(() => {
  prismaMock.collection.create.mockClear();
  prismaMock.collection.findMany.mockClear();
  prismaMock.collection.findUnique.mockClear();
});

describe("Collection Resolvers", () => {
  // 1. Creates collection with valid input
  test("creates collection with valid input", async () => {
    const mockCreated = {
      id: "cuid1",
      name: "Engineering",
      slug: "engineering",
      createdAt: new Date(),
    };
    prismaMock.collection.create.mockResolvedValue(mockCreated as any);

    const result = await collectionResolvers.Mutation.createCollection(null, {
      input: { name: "Engineering", slug: "engineering" },
    });

    expect(result.name).toBe("Engineering");
    expect(result.slug).toBe("engineering");
    expect(prismaMock.collection.create).toHaveBeenCalledTimes(1);
  });

  // 2. Rejects empty name
  test("rejects empty name", async () => {
    expect(
      collectionResolvers.Mutation.createCollection(null, {
        input: { name: "   ", slug: "engineering" },
      })
    ).rejects.toThrow("name must not be empty or whitespace-only");
  });

  // 3. Rejects malformed slug (spaces, uppercase, special chars)
  test("rejects malformed slug", async () => {
    expect(
      collectionResolvers.Mutation.createCollection(null, {
        input: { name: "Engineering", slug: "Engineering Slug!" },
      })
    ).rejects.toThrow("Slug must contain only lowercase letters");
  });

  // 4. Rejects duplicate slug
  test("rejects duplicate slug (conflict)", async () => {
    const error: any = new Error("Unique constraint violation");
    error.code = "P2002";
    prismaMock.collection.create.mockRejectedValue(error);

    expect(
      collectionResolvers.Mutation.createCollection(null, {
        input: { name: "Engineering", slug: "engineering" },
      })
    ).rejects.toThrow('Collection with slug "engineering" already exists');
  });

  // 5. Returns all collections
  test("returns all collections", async () => {
    const mockList = [
      { id: "1", name: "Col 1", slug: "col-1", createdAt: new Date() },
      { id: "2", name: "Col 2", slug: "col-2", createdAt: new Date() },
    ];
    prismaMock.collection.findMany.mockResolvedValue(mockList as any);

    const result = await collectionResolvers.Query.collections();
    expect(result).toHaveLength(2);
    expect(prismaMock.collection.findMany).toHaveBeenCalledTimes(1);
  });

  // 6. Returns single collection by ID
  test("returns single collection by ID", async () => {
    const mockCol = { id: "1", name: "Col 1", slug: "col-1", createdAt: new Date() };
    prismaMock.collection.findUnique.mockResolvedValue(mockCol as any);

    const result = await collectionResolvers.Query.collection(null, { id: "1" });
    expect(result).not.toBeNull();
    expect(result!.id).toBe("1");
    expect(prismaMock.collection.findUnique).toHaveBeenCalledWith({
      where: { id: "1" },
    });
  });
});
