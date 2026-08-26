// This file is loaded BEFORE mock.ts via the bunfig.toml preload chain
// It sets INTEGRATION=1 so mock.ts skips mocking Prisma
process.env["INTEGRATION"] = "1";
