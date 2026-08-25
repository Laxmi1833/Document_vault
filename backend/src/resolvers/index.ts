export const resolvers = {
  Query: {
    collections: () => [],
    collection: () => null,
    documents: () => ({
      edges: [],
      pageInfo: {
        hasNextPage: false,
        endCursor: null,
      },
    }),
  },
  Mutation: {
    createCollection: (_parent: any, { input }: any) => ({
      id: "stub-id",
      name: input.name,
      slug: input.slug,
      createdAt: new Date().toISOString(),
    }),
    createDocument: (_parent: any, { input }: any) => ({
      id: "stub-id",
      title: input.title,
      content: input.content,
      tags: input.tags || [],
      collectionId: input.collectionId,
      isArchived: false,
      createdAt: new Date().toISOString(),
    }),
    updateDocument: (_parent: any, { id, input }: any) => ({
      id,
      title: input.title || "stub-title",
      content: input.content || "stub-content",
      tags: input.tags || [],
      isArchived: input.isArchived ?? false,
      createdAt: new Date().toISOString(),
    }),
    deleteDocument: (_parent: any, { id }: any) => ({
      id,
      title: "deleted-title",
      content: "deleted-content",
      tags: [],
      collectionId: "stub-collection-id",
      isArchived: false,
      createdAt: new Date().toISOString(),
    }),
    moveDocument: (_parent: any, { id, collectionId }: any) => ({
      id,
      title: "moved-title",
      content: "moved-content",
      tags: [],
      collectionId,
      isArchived: false,
      createdAt: new Date().toISOString(),
    }),
  },
};
