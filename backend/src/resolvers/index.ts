import { collectionResolvers } from "./collection.ts";
import { documentResolvers } from "./document.ts";

export const resolvers = {
  Query: {
    ...collectionResolvers.Query,
    ...documentResolvers.Query,
  },
  Mutation: {
    ...collectionResolvers.Mutation,
    ...documentResolvers.Mutation,
  },
  Collection: {
    ...collectionResolvers.Collection,
  },
  Document: {
    ...documentResolvers.Document,
  },
};
