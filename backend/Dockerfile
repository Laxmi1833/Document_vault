# Stage 1: Base & Build
FROM oven/bun:1.1.20-alpine AS builder
WORKDIR /app

# Copy package files and lockfile
COPY package.json bun.lock ./

# Install dependencies (including devDependencies for prisma client generation)
RUN bun install --frozen-lockfile

# Copy schema and generate Prisma client
COPY prisma ./prisma/
RUN bunx prisma generate

# Copy source code and config files
COPY tsconfig.json ./
COPY src ./src/

# Stage 2: Production Runner
FROM oven/bun:1.1.20-alpine AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy built node_modules, generated Prisma client, package.json and source files
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src

# Expose port
EXPOSE 4000

# Start server
CMD ["bun", "run", "src/index.ts"]
