import prisma from "../lib/prisma.ts";
import { validateNonEmpty } from "../validators/index.ts";
import { GraphQLError } from "graphql";

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
      const title = validateNonEmpty(input.title, "title");
      const content = validateNonEmpty(input.content, "content");
      
      const collection = await prisma.collection.findUnique({
        where: { id: input.collectionId },
      });
      if (!collection) {
        throw new GraphQLError(`Collection with ID "${input.collectionId}" not found`, {
          extensions: { code: "NOT_FOUND" },
        });
      }
      
      return prisma.document.create({
        data: {
          title,
          content,
          tags: input.tags || [],
          collectionId: input.collectionId,
        },
      });
    },
    updateDocument: async (
      _parent: any,
      { id, input }: { id: string; input: { title?: string; content?: string; tags?: string[]; isArchived?: boolean } }
    ) => {
      const doc = await prisma.document.findUnique({ where: { id } });
      if (!doc) {
        throw new GraphQLError(`Document with ID "${id}" not found`, {
          extensions: { code: "NOT_FOUND" },
        });
      }
      
      const data: any = {};
      
      if (input.title !== undefined) {
        data.title = validateNonEmpty(input.title, "title");
      }
      if (input.content !== undefined) {
        data.content = validateNonEmpty(input.content, "content");
      }
      if (input.tags !== undefined) data.tags = input.tags;
      if (input.isArchived !== undefined) data.isArchived = input.isArchived;
      
      return prisma.document.update({
        where: { id },
        data,
      });
    },
    deleteDocument: async (_parent: any, { id }: { id: string }) => {
      const doc = await prisma.document.findUnique({ where: { id } });
      if (!doc) {
        throw new GraphQLError(`Document with ID "${id}" not found`, {
          extensions: { code: "NOT_FOUND" },
        });
      }
      
      return prisma.document.delete({
        where: { id },
      });
    },
    moveDocument: async (_parent: any, { id, collectionId }: { id: string; collectionId: string }) => {
      const doc = await prisma.document.findUnique({ where: { id } });
      if (!doc) {
        throw new GraphQLError(`Document with ID "${id}" not found`, {
          extensions: { code: "NOT_FOUND" },
        });
      }
      
      const collection = await prisma.collection.findUnique({
        where: { id: collectionId },
      });
      if (!collection) {
        throw new GraphQLError(`Collection with ID "${collectionId}" not found`, {
          extensions: { code: "NOT_FOUND" },
        });
      }
      
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
