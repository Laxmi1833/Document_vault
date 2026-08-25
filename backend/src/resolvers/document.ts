import prisma from "../lib/prisma.ts";

interface DocumentsArgs {
  collectionId?: string;
  search?: string;
  isArchived?: boolean;
  take?: number;
  cursor?: string;
}

export const documentResolvers = {
  Query: {
    documents: async (_parent: any, { collectionId, search, isArchived, take, cursor }: DocumentsArgs) => {
      const limit = take !== undefined && take !== null ? take : 10;
      
      const where: any = {};
      
      if (collectionId) {
        where.collectionId = collectionId;
      }
      
      if (isArchived !== undefined && isArchived !== null) {
        where.isArchived = isArchived;
      }
      
      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { content: { contains: search, mode: "insensitive" } },
        ];
      }
      
      const prismaQuery: any = {
        where,
        take: limit + 1,
        orderBy: { id: "asc" },
      };
      
      if (cursor) {
        prismaQuery.cursor = { id: cursor };
        prismaQuery.skip = 1;
      }
      
      const documents = await prisma.document.findMany(prismaQuery);
      
      const hasNextPage = documents.length > limit;
      const items = hasNextPage ? documents.slice(0, limit) : documents;
      const lastItem = items[items.length - 1];
      const endCursor = lastItem ? lastItem.id : null;
      
      return {
        edges: items.map(doc => ({
          cursor: doc.id,
          node: doc,
        })),
        pageInfo: {
          hasNextPage,
          endCursor,
        },
      };
    },
  },
  Mutation: {
    createDocument: async (
      _parent: any,
      { input }: { input: { title: string; content: string; tags?: string[]; collectionId: string } }
    ) => {
      return prisma.document.create({
        data: {
          title: input.title,
          content: input.content,
          tags: input.tags || [],
          collectionId: input.collectionId,
        },
      });
    },
    updateDocument: async (
      _parent: any,
      { id, input }: { id: string; input: { title?: string; content?: string; tags?: string[]; isArchived?: boolean } }
    ) => {
      const data: any = {};
      
      if (input.title !== undefined) data.title = input.title;
      if (input.content !== undefined) data.content = input.content;
      if (input.tags !== undefined) data.tags = input.tags;
      if (input.isArchived !== undefined) data.isArchived = input.isArchived;
      
      return prisma.document.update({
        where: { id },
        data,
      });
    },
    deleteDocument: async (_parent: any, { id }: { id: string }) => {
      return prisma.document.delete({
        where: { id },
      });
    },
    moveDocument: async (_parent: any, { id, collectionId }: { id: string; collectionId: string }) => {
      return prisma.document.update({
        where: { id },
        data: {
          collectionId,
        },
      });
    },
  },
  Document: {
    collection: async (parent: { collectionId: string }) => {
      return prisma.collection.findUnique({
        where: { id: parent.collectionId },
      });
    },
    createdAt: (parent: { createdAt: Date }) => {
      return parent.createdAt.toISOString();
    },
  },
};
