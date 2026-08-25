import { createServer } from "node:http";
import { createSchema, createYoga } from "graphql-yoga";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { resolvers } from "./resolvers/index.ts";

// Read GraphQL Schema SDL
const typeDefs = readFileSync(join(import.meta.dirname, "schema.graphql"), "utf-8");

const schema = createSchema({
  typeDefs,
  resolvers,
});

const yoga = createYoga({ schema });

const server = createServer(yoga);

const PORT = 4000;

server.listen(PORT, () => {
  console.log(`🚀 Document Vault API running at http://localhost:${PORT}/graphql`);
});
