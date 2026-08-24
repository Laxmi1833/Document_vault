// Prisma client singleton
// Note: Run `bunx prisma generate` after creating the schema to generate the client.
// This file will be fully functional after Phase 3 (Prisma migration).

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default prisma;
