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

const absolutePrismaPath = join(import.meta.dirname, "../../src/lib/prisma.ts");

mock.module(absolutePrismaPath, () => ({
  default: prismaMock,
}));
