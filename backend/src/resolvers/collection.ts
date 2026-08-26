import prisma from "../lib/prisma.ts";
import { validateNonEmpty, validateSlug } from "../validators/index.ts";
import { GraphQLError } from "graphql";

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
      const validatedName = validateNonEmpty(input.name, "name");
      const validatedSlug = validateSlug(input.slug);

      try {
        return await prisma.collection.create({
          data: {
            name: validatedName,
            slug: validatedSlug,
          },
        });
      } catch (error: any) {
        if (error.code === "P2002") {
          throw new GraphQLError(`Collection with slug "${validatedSlug}" already exists`, {
            extensions: { code: "CONFLICT" },
          });
        }
        throw error;
      }
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
