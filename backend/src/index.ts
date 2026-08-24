import { createServer } from "node:http";
import { createYoga } from "graphql-yoga";

// Placeholder — will be wired up in Phase 5
const yoga = createYoga({});

const server = createServer(yoga);

const PORT = 4000;

server.listen(PORT, () => {
  console.log(`🚀 Document Vault API running at http://localhost:${PORT}/graphql`);
});
