import prisma from "../lib/prisma.ts";

export const collectionResolvers = {
  Query: {
    collections: async () => {
      return prisma.collection.findMany();
    },
    collection: async (_parent: any, { id }: { id: string }) => {
      return prisma.collection.findUnique({
        where: { id },
      });
    },
  },
  Mutation: {
    createCollection: async (
      _parent: any,
      { input }: { input: { name: string; slug: string } }
    ) => {
      return prisma.collection.create({
        data: {
          name: input.name,
          slug: input.slug,
        },
      });
    },
  },
  Collection: {
    documents: async (parent: { id: string }) => {
      return prisma.document.findMany({
        where: { collectionId: parent.id },
      });
    },
    createdAt: (parent: { createdAt: Date }) => {
      return parent.createdAt.toISOString();
    },
  },
};
