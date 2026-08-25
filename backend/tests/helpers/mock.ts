import { mock, type Mock } from "bun:test";
import { join } from "node:path";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMock = Mock<(...args: any[]) => any>;

export const prismaMock = {
  collection: {
    findMany: mock(() => Promise.resolve([])) as AnyMock,
    findUnique: mock(() => Promise.resolve(null)) as AnyMock,
    create: mock(() => Promise.resolve({})) as AnyMock,
  },
  document: {
    findMany: mock(() => Promise.resolve([])) as AnyMock,
    findUnique: mock(() => Promise.resolve(null)) as AnyMock,
    create: mock(() => Promise.resolve({})) as AnyMock,
    update: mock(() => Promise.resolve({})) as AnyMock,
    delete: mock(() => Promise.resolve({})) as AnyMock,
  },
};

// Only mock the Prisma module for unit tests (not integration tests)
if (!process.env["INTEGRATION"]) {
  const absolutePrismaPath = join(import.meta.dirname, "../../src/lib/prisma.ts");

  mock.module(absolutePrismaPath, () => ({
    default: prismaMock,
  }));
}
