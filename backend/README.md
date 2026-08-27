# 📦 Document Vault

A GraphQL API for organizing documents into collections. Built with **Bun**, **TypeScript**, **GraphQL Yoga**, **Prisma**, and **PostgreSQL**.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | [Bun](https://bun.sh) v1.4+ |
| Language | TypeScript (strict mode) |
| API | [GraphQL Yoga](https://the-guild.dev/graphql/yoga-server) (SDL-first) |
| Database | PostgreSQL 16 |
| ORM | [Prisma](https://www.prisma.io) v7 |
| Containerization | Docker & Docker Compose |

---

## Prerequisites

Make sure you have the following installed:

- [Bun](https://bun.sh) ≥ 1.4
- [Docker](https://www.docker.com/) & Docker Compose
- Git

---

## Quick Start

```bash
# 1. Clone the repository
git clone <repo-url>
cd document_vault/backend

# 2. Copy environment variables
cp .env.example .env

# 3. Update the port in .env to match docker-compose (5433)
# DATABASE_URL="postgresql://postgres:postgres@localhost:5433/document_vault?schema=public"

# 4. Start PostgreSQL, install dependencies, run migrations, and start the server
docker compose up -d && bun install && bun run gendb && bun run dev
```

The API will be available at **http://localhost:4000/graphql** with an interactive GraphiQL playground.

---

## Project Structure

```
backend/
├── docker-compose.yml          # PostgreSQL container
├── package.json                # Scripts & dependencies
├── prisma.config.ts            # Prisma configuration
├── tsconfig.json               # TypeScript configuration
├── prisma/
│   ├── schema.prisma           # Database models (Collection, Document)
│   └── migrations/             # Auto-generated SQL migrations
├── src/
│   ├── index.ts                # Server entrypoint (GraphQL Yoga on port 4000)
│   ├── schema.graphql          # GraphQL SDL schema
│   ├── lib/
│   │   └── prisma.ts           # Prisma client singleton
│   ├── resolvers/
│   │   ├── index.ts            # Resolver aggregator
│   │   ├── collection.ts       # Collection query & mutation resolvers
│   │   └── document.ts         # Document query & mutation resolvers
│   ├── validators/
│   │   └── index.ts            # Input validation helpers
│   └── generated/              # Prisma generated client (gitignored)
└── tests/
    ├── helpers/
    │   ├── mock.ts             # Prisma mock setup for unit tests
    │   └── integration-preload.ts
    ├── unit/
    │   ├── collection.test.ts  # Collection resolver unit tests
    │   └── document.test.ts    # Document resolver unit tests
    └── integration/
        └── api.test.ts         # End-to-end API integration test
```

---

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `bun run dev` | Start the server with hot-reload (`--watch`) |
| `start` | `bun run start` | Start the server (no watch) |
| `gendb` | `bun run gendb` | Run Prisma migrations and generate the client |
| `test` | `bun test` | Run all tests (unit + integration) |
| `test:unit` | `bun run test:unit` | Run unit tests only (with Prisma mock preload) |
| `test:integration` | `bun run test:integration` | Run integration tests only (requires running PostgreSQL) |
| `lint` | `bun run lint` | TypeScript type checking |
| `typecheck` | `bun run typecheck` | TypeScript type checking (alias for lint) |

---

## Data Model

```
┌─────────────┐       ┌──────────────┐
│  Collection │       │   Document   │
├─────────────┤       ├──────────────┤
│ id (cuid)   │──────<│ id (cuid)    │
│ name        │       │ title        │
│ slug (uniq) │       │ content      │
│ createdAt   │       │ tags[]       │
│ documents[] │       │ collectionId │
└─────────────┘       │ isArchived   │
                      │ createdAt    │
                      └──────────────┘
```

- **Collection → Document**: One-to-many relationship
- Deleting a collection cascades to all its documents
- Slugs must be unique and URL-safe (lowercase letters, numbers, hyphens)

---

## API Examples

### Create a Collection

```graphql
mutation {
  createCollection(input: { name: "Engineering", slug: "engineering" }) {
    id
    name
    slug
    createdAt
  }
}
```

### Create a Document

```graphql
mutation {
  createDocument(input: {
    title: "API Design Guide"
    content: "Best practices for designing RESTful and GraphQL APIs..."
    tags: ["api", "guide", "best-practices"]
    collectionId: "<collection-id>"
  }) {
    id
    title
    tags
    createdAt
  }
}
```

### Query Documents with Search & Pagination

```graphql
query {
  documents(search: "API", take: 5) {
    edges {
      cursor
      node {
        id
        title
        content
        tags
        isArchived
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}

# Fetch next page using the endCursor from the previous response
query {
  documents(search: "API", take: 5, cursor: "<endCursor>") {
    edges {
      cursor
      node { id title }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

### Move a Document Between Collections

```graphql
mutation {
  moveDocument(id: "<document-id>", collectionId: "<target-collection-id>") {
    id
    title
    collectionId
  }
}
```

### List All Collections with Nested Documents

```graphql
query {
  collections {
    id
    name
    slug
    documents {
      id
      title
      tags
    }
  }
}
```

---

## Filtering & Search

The `documents` query supports multiple filters that combine with AND logic:

| Argument | Type | Description |
|----------|------|-------------|
| `collectionId` | `ID` | Filter by collection |
| `search` | `String` | Case-insensitive search across `title` and `content` |
| `isArchived` | `Boolean` | Filter by archived status |
| `take` | `Int` | Number of results per page (default: 10) |
| `cursor` | `ID` | Cursor for pagination (pass `endCursor` from previous page) |

---

## Error Handling

All errors are returned as structured `GraphQLError` responses with extension codes:

| Code | When |
|------|------|
| `VALIDATION_ERROR` | Empty/whitespace-only title, content, or name; invalid slug format |
| `NOT_FOUND` | Document or collection ID doesn't exist |
| `CONFLICT` | Duplicate collection slug (Prisma P2002) |

Example error response:
```json
{
  "errors": [
    {
      "message": "title must not be empty",
      "extensions": {
        "code": "VALIDATION_ERROR"
      }
    }
  ]
}
```

---

## Running Tests

```bash
# Ensure PostgreSQL is running for integration tests
docker compose up -d

# Run all tests
bun test

# Run only unit tests (mocked Prisma, no DB needed)
bun run test:unit

# Run only integration tests (requires PostgreSQL)
bun run test:integration
```

### Test Coverage

**Unit tests** (~16 cases) cover:
- Collection CRUD operations and validation (empty name, invalid slug, duplicate slug)
- Document CRUD operations and validation (empty title/content, non-existent references)
- Search filtering (title and content, case-insensitive)
- Cursor-based pagination (take count, next page, hasNextPage)

**Integration tests** verify the full end-to-end flow against a real PostgreSQL instance:
1. Create collection → Create documents → Query nested data
2. Search → Filter → Paginate
3. Move document between collections → Verify ownership change
4. Delete document → Verify removal

---

## Extension Notes

### Authentication & Role-Based Access Control (RBAC)

The current API is unauthenticated, which is suitable for development and internal tooling. To add authentication:

- **JWT-based auth**: Add a middleware layer to GraphQL Yoga that extracts and verifies JWT tokens from the `Authorization` header. The decoded user payload can be attached to the GraphQL context object, making it available to all resolvers. Prisma queries would then be scoped by `userId`.
- **RBAC**: Introduce a `Role` enum (`VIEWER`, `EDITOR`, `ADMIN`) on a `User` model. Create a `checkPermission(context, requiredRole)` utility that throws a `FORBIDDEN` GraphQLError if the user lacks the required role. Apply this at the resolver level — e.g., only `EDITOR`+ can create/update documents, only `ADMIN` can delete collections.
- **Per-collection permissions**: For finer-grained access, add a `CollectionMember` join table with a `role` column, allowing different permission levels per collection.

### Full-Text Search Upgrade (PostgreSQL `tsvector`)

The current search implementation uses Prisma's `contains` with `mode: "insensitive"`, which performs a `ILIKE %query%` SQL query. This works for small datasets but won't scale. To upgrade:

- Add `tsvector` columns to the `Document` table using a Prisma migration with raw SQL: `ALTER TABLE "Document" ADD COLUMN "searchVector" tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))) STORED;`
- Create a GIN index: `CREATE INDEX document_search_idx ON "Document" USING GIN ("searchVector");`
- Replace the Prisma `contains` query with a raw SQL query using `@@` and `to_tsquery()` for full-text matching.
- This approach supports stemming (e.g., "running" matches "run"), ranking results by relevance with `ts_rank()`, and phrase queries. Performance improves from O(n) table scans to O(log n) index lookups.

### Caching Layer (Redis)

For high-read workloads, add a Redis caching layer to reduce database load:

- **Strategy**: Use a read-through cache with TTL-based invalidation. Cache the results of `collections` and `documents` queries, keyed by query parameters (e.g., `documents:collectionId:search:take:cursor`).
- **Implementation**: Install `ioredis`, create a Redis client singleton similar to the Prisma singleton, and add cache-check logic before Prisma calls in the resolvers. On mutations (create, update, delete, move), invalidate related cache keys.
- **Consideration**: For the `DocumentConnection` pagination responses, cache individual pages rather than the full result set. Use a short TTL (30–60 seconds) for frequently changing queries and a longer TTL (5–10 minutes) for collection-level metadata.
- **Alternative**: For simpler deployments, consider an in-memory LRU cache (e.g., `lru-cache`) if Redis is too much infrastructure. This works well for single-instance deployments but doesn't share state across multiple server instances.

---

## License

MIT
