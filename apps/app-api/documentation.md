# GraphQL Generated Types Setup

This document explains how GraphQL SDL files are used to generate TypeScript types in `app-api`.

## Current Structure

- SDL source files: `src/graphql/schemas/*.gql`
- Generator script: `src/graphql/generate-types.ts`
- Generated output: `src/graphql/generated/graphql.ts`
- Runtime GraphQL config: `src/app.module.ts`

## How It Works

1. You define or update GraphQL schema in `src/graphql/schemas/*.gql`.
2. Run the type generator script.
3. Types are emitted into `src/graphql/generated/graphql.ts`.
4. `GraphQLModule` is configured to use the same schema path and generated output path.

## Prerequisites

Install dependencies from the workspace root:

```bash
npm install
```

Required GraphQL packages are already declared in `apps/app-api/package.json`.

## Required Packages For GraphQL Generate Setup

If you are setting up GraphQL type generation from scratch, install these packages in `app-api`:

- `@nestjs/graphql`
- `graphql`
- `ts-morph`
- `ts-node`

If this API also needs to run GraphQL at runtime, include:

- `@nestjs/apollo`
- `@apollo/server`
- `@as-integrations/express5`

Install commands (from workspace root):

```bash
pnpm --filter app-api add @nestjs/graphql graphql ts-morph
pnpm --filter app-api add -D ts-node
pnpm --filter app-api add @nestjs/apollo @apollo/server @as-integrations/express5
```

## Generate GraphQL Types

Run from workspace root with Nx:

```bash
npm exec -- nx run app-api:generate-graphql-types
```

Or run the workspace script directly:

```bash
npm run -w app-api generate-graphql-types
```

## Typical Workflow

1. Edit a schema file in `src/graphql/schemas/`.
2. Regenerate types:

```bash
npm exec -- nx run app-api:generate-graphql-types
```

3. Verify compile:

```bash
npm exec -- nx run app-api:build
```

## Runtime Notes

- API default port is `3001` (override with `PORT` env var).
- GraphQL endpoint is `/graphql`.

Start API in dev mode:

```bash
npm run -w app-api start:dev
```

## Troubleshooting

### `@as-integrations/express5` missing

If you see:

`The "@as-integrations/express5" package is missing`

Run install at workspace root:

```bash
npm install
```

### Generated file not updating

- Confirm schema files are under `src/graphql/schemas/`.
- Re-run:

```bash
npm exec -- nx run app-api:generate-graphql-types
```

### Type errors after schema changes

Regenerate and rebuild:

```bash
npm exec -- nx run app-api:generate-graphql-types
npm exec -- nx run app-api:build
```

# `app-api` Phase 1 Setup

This document covers the Phase 1 core infrastructure for the NestJS GraphQL API: environment loading, MongoDB bootstrap, GraphQL error formatting, and the `DateTime` scalar.

## Implemented In Phase 1

- `@nestjs/config` is registered globally in [src/app.module.ts](/Users/jadekennethdarunday/personal/org-system/apps/app-api/src/app.module.ts).
- Environment variables are validated with Zod in [src/config/env.schema.ts](/Users/jadekennethdarunday/personal/org-system/apps/app-api/src/config/env.schema.ts).
- `@nestjs/mongoose` is configured with `forRootAsync()` and reads `MONGODB_URI` from the app env file.
- Startup now reads `PORT` from `ConfigService` in [src/main.ts](/Users/jadekennethdarunday/personal/org-system/apps/app-api/src/main.ts).
- MongoDB connection lifecycle logs are registered for connect, disconnect, and error events.
- GraphQL now uses a centralized formatter in [src/graphql/format-error.ts](/Users/jadekennethdarunday/personal/org-system/apps/app-api/src/graphql/format-error.ts).
- Custom application errors live in [src/common/errors/app.error.ts](/Users/jadekennethdarunday/personal/org-system/apps/app-api/src/common/errors/app.error.ts).
- The schema-first `DateTime` scalar is mapped to `graphql-scalars` from [src/app.module.ts](/Users/jadekennethdarunday/personal/org-system/apps/app-api/src/app.module.ts).

## Environment Files

Create or update `apps/app-api/.env` with:

```bash
MONGODB_URI=mongodb://127.0.0.1:27017/app-api
JWT_SECRET=change-this-secret
JWT_EXPIRATION=7d
PORT=3001
TRUST_PROXY=false
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:19006,http://127.0.0.1:19006
CORS_METHODS=GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS
CORS_ALLOWED_HEADERS=Content-Type,Authorization
CORS_EXPOSED_HEADERS=
CORS_MAX_AGE_SECONDS=86400
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_SECONDS=60
RATE_LIMIT_MAX_REQUESTS=100
REQUEST_LOGGING_ENABLED=true
REQUEST_LOGGING_INCLUDE_HEALTH=false
SLOW_REQUEST_WARN_THRESHOLD_MS=1000
SECURITY_HEADERS_ENABLED=true
HSTS_MAX_AGE_SECONDS=31536000
DEFAULT_ADMIN_EMAIL=admin@organization.local
DEFAULT_ADMIN_PASSWORD=ChangeMe123!
```

Reference values are also provided in `apps/app-api/.env.example`.

Notes:

- The repository already ignores `.env`, so the app-specific env file stays local.
- The app loads `apps/app-api/.env` first and falls back to `.env` when the process is started from the package directory.
- `TRUST_PROXY=true` should be set when the API runs behind a reverse proxy so HTTPS detection and IP-based rate limiting use forwarded headers correctly.
- `CORS_ORIGINS` accepts a comma-separated list of allowed browser origins. If omitted, the API falls back to local development defaults for the admin app and Expo web.
- `CORS_METHODS`, `CORS_ALLOWED_HEADERS`, `CORS_EXPOSED_HEADERS`, and `CORS_MAX_AGE_SECONDS` let you tighten cross-origin access without code changes.
- `RATE_LIMIT_ENABLED`, `RATE_LIMIT_WINDOW_SECONDS`, and `RATE_LIMIT_MAX_REQUESTS` control the API's fixed-window request throttling.
- `REQUEST_LOGGING_ENABLED`, `REQUEST_LOGGING_INCLUDE_HEALTH`, and `SLOW_REQUEST_WARN_THRESHOLD_MS` control request-level HTTP logging and when slow requests are promoted to warnings.
- `SECURITY_HEADERS_ENABLED` and `HSTS_MAX_AGE_SECONDS` control the production-only response headers.
- `DEFAULT_ADMIN_EMAIL` and `DEFAULT_ADMIN_PASSWORD` are used by `seed:default-admin`, `seed:local-dev`, and `reset:local-dev`.
- `LOCAL_DEV_RESET_CONFIRM` is intentionally not stored by default. Pass `LOCAL_DEV_RESET_CONFIRM=RESET_LOCAL_DATA` only when you intentionally want to clear local API data.

### Local Development Seed Data

`npm run seed:local-dev --workspace app-api` now seeds a fuller baseline dataset for development:

- default admin account
- 2 member accounts and profiles
- published and draft announcements
- upcoming schedules
- emergency contacts
- document requests across multiple statuses
- notifications tied to announcements and requests

Default member logins created by the local-dev seed:

- `member.one@organization.local` / `Member123!`
- `member.two@organization.local` / `Member123!`

To fully reset and rebuild that dataset:

```bash
LOCAL_DEV_RESET_CONFIRM=RESET_LOCAL_DATA npm run reset:local-dev --workspace app-api
```

### Why `CORS_ORIGINS` Exists

`CORS_ORIGINS` controls which browser frontends are allowed to call the API from a different origin.

Examples:

- `http://localhost:3000` can be used for the admin app in local development.
- `http://localhost:19006` can be used for Expo web in local development.

If a browser app is running on one of the listed origins, the browser will allow requests to this API. If a browser app is running on an origin that is not listed, the browser will block the cross-origin request.

Important notes:

- This does not turn the API on or off. The server can still be running and reachable even when a browser origin is not allowed.
- This is not authentication or authorization. It only controls browser cross-origin access.
- Requests without an `Origin` header, such as `curl`, Postman, server-to-server traffic, and many native app requests, are still allowed because they are not subject to browser CORS enforcement in the same way.

## Installed Dependencies

Phase 1 adds these runtime packages to `app-api`:

- `@nestjs/mongoose`
- `@nestjs/config`
- `@nestjs/jwt`
- `@nestjs/passport`
- `@nestjs/throttler`
- `passport`
- `passport-jwt`
- `bcrypt`
- `graphql-scalars`
- `zod`
- `@types/bcrypt`

Install from the workspace root if you need to recreate the setup:

```bash
npm install -w app-api @nestjs/mongoose @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt graphql-scalars zod @types/bcrypt
```

## Runtime Behavior

### Startup

- If `MONGODB_URI` is missing, application bootstrap fails immediately.
- If required env vars are missing or malformed, Zod validation fails before Nest finishes bootstrapping.
- If MongoDB is unreachable, Nest startup fails, the error is logged, and the process exits with status `1`.
- Default HTTP port is `3001`.
- GraphQL endpoint is `/graphql`.
- Browser requests are limited to origins listed in `CORS_ORIGINS`, while requests without an `Origin` header remain allowed.
- REST health endpoints are available at `GET /` and `GET /health`.
- The GraphQL `_health` query returns `ok` when MongoDB is connected and `degraded` otherwise.
- HTTP requests now emit structured completion logs with request IDs, status codes, durations, and GraphQL operation names when available.

### Health Endpoints

The API now exposes both REST and GraphQL health checks backed by the active MongoDB connection.

REST:

- `GET /`
- `GET /health`

Example response:

```json
{
  "environment": "development",
  "runtime": {
    "memoryUsage": {
      "arrayBuffersBytes": 12345,
      "externalBytes": 45678,
      "heapTotalBytes": 12345678,
      "heapUsedBytes": 8765432,
      "rssBytes": 23456789
    },
    "nodeVersion": "v22.15.0",
    "pid": 12345,
    "service": "app-api",
    "uptimeSeconds": 12.345
  },
  "status": "ok",
  "timestamp": "2026-03-31T00:00:00.000Z",
  "database": {
    "status": "connected",
    "readyState": 1
  }
}
```

GraphQL:

```gql
query {
  _health
}
```

Typical GraphQL response:

```json
{
  "data": {
    "_health": "ok"
  }
}
```

The MongoDB connection state is mapped from Mongoose `readyState` values:

- `1` -> `connected`
- `0` -> `disconnected`
- `2` -> `connecting`
- `3` -> `disconnecting`

This is currently a MongoDB-backed health check with lightweight runtime diagnostics, not a full system health check. It answers whether the API is running, whether the active MongoDB connection is usable, and gives a quick snapshot of process uptime and memory.

Possible future upgrades for a broader health check:

- verify GraphQL readiness separately from raw HTTP startup
- verify critical configuration is present and valid at runtime
- check external services if the API starts depending on them
- distinguish readiness checks from liveness checks

### GraphQL Error Formatting

The formatter strips internal stack traces and maps known application errors to consistent GraphQL extensions:

- `NotFoundError` → `NOT_FOUND`
- `ForbiddenError` → `FORBIDDEN`
- `ValidationError` → `BAD_USER_INPUT`
- `ConflictError` → `CONFLICT`
- `InvalidStatusTransitionError` → `INVALID_STATUS_TRANSITION`

Each formatted business error includes:

- `extensions.code`
- `extensions.http.status`
- `extensions.details` when provided

Apollo and schema validation errors keep their validation details. In production, unexpected internal errors are returned as `Internal server error.` without stack traces.

### `DateTime` Scalar

The `DateTime` scalar now uses `DateTimeISOResolver` from `graphql-scalars`. Existing JavaScript `Date` instances returned by services or future Mongoose models are serialized as ISO strings for GraphQL responses.

## GraphQL Type Generation

The API still uses schema-first GraphQL:

- SDL source files: `src/graphql/schemas/*.gql`
- Generator script: `src/graphql/generate-types.ts`
- Generated output: `src/graphql/generated/graphql.ts`

Regenerate types from the workspace root:

```bash
npm exec -- nx run app-api:generate-graphql-types
```

Verify the API after schema or infrastructure changes:

```bash
npm exec -- nx run app-api:typecheck
npm exec -- nx run app-api:build
```

## Running The API

From the workspace root:

```bash
npm exec -- nx run app-api:start:dev
```

The app will start only after the MongoDB connection succeeds.

## Using `ConfigModule`

`ConfigModule` is the API's configuration entrypoint. In this project it is registered once in `src/app.module.ts`, validated through `src/config/env.schema.ts`, and then consumed through `ConfigService`.

### How It Is Used Here

- `ConfigModule.forRoot(...)` loads config from environment variables and the configured `.env` files.
- `validate: validateEnv` runs the Zod schema before Nest finishes bootstrapping.
- `isGlobal: true` makes `ConfigService` available across the app without importing `ConfigModule` in every module.

Current usage examples:

- `MongooseModule.forRootAsync(...)` reads `MONGODB_URI`
- GraphQL setup reads `NODE_ENV` to toggle playground and stack traces
- `main.ts` reads `PORT` before starting the HTTP server

Typical usage pattern:

```ts
constructor(private readonly configService: ConfigService) {}

const mongodbUri = this.configService.get<string>('MONGODB_URI');
```

### Production Use Case

In production, `ConfigModule` is mainly for centralizing runtime configuration and failing fast when required values are missing or invalid.

Common production values include:

- database connection strings
- JWT secrets
- token expiration settings
- ports
- feature flags
- third-party API keys

Recommended production approach:

- keep `.env` files for local development only
- provide real values through deployment environment variables or a secret manager
- keep startup validation enabled so bad config stops the app immediately

Typical production variant:

```ts
ConfigModule.forRoot({
  isGlobal: true,
  ignoreEnvFile: process.env.NODE_ENV === 'production',
  validate: validateEnv,
});
```

`ConfigModule` does not store or rotate secrets by itself. It reads from `process.env` and optional env files; secret storage and rotation remain the responsibility of your hosting platform or secret manager.

## Why `forwardRef()` Is Used Here

`forwardRef()` is used when two Nest modules depend on each other and Nest needs to delay resolving one side of that relationship.

In this API, the circular relationship is:

- `UsersModule` needs `MembersModule`
- `MembersModule` needs `UsersModule`

That happens because:

- `src/modules/users/users.resolver.ts` injects `MembersService` to resolve `User.memberProfile`
- `src/modules/members/members.service.ts` injects `UsersService` to resolve member-to-user lookups

Current module wiring:

- `src/modules/users/users.module.ts` imports `forwardRef(() => MembersModule)`
- `src/modules/members/members.module.ts` imports `forwardRef(() => UsersModule)`

### What problem this solves

Without `forwardRef()`, Nest tries to fully resolve one module immediately, but that module asks for the other one first.

That creates a loop:

```text
UsersModule -> MembersModule -> UsersModule -> MembersModule -> ...
```

At that point Nest can hit a circular dependency error during module resolution.

### Simple analogy

Think of two folders that each contain a note saying "read the other folder first."

Without `forwardRef()`:

- Nest opens folder A
- folder A says "go read folder B first"
- Nest opens folder B
- folder B says "go read folder A first"
- resolution gets stuck in the loop

With `forwardRef()`:

- Nest is allowed to register the reference first
- finish creating both folders
- then connect them after both exist

### In this project, why the cycle exists

`UsersResolver` needs `MembersService`:

```ts
@ResolveField('memberProfile')
async memberProfile(@Parent() user: User) {
  return this.membersService.findByUserId(user.id);
}
```

That means `UsersModule` must be able to provide `MembersService`, so it needs `MembersModule`.

`MembersService` needs `UsersService`:

```ts
async findUserByMemberId(id: string): Promise<User | null> {
  // ...
  return this.usersService.findById(member.userId);
}
```

That means `MembersModule` must be able to provide `UsersService`, so it needs `UsersModule`.

### Without `forwardRef()` -> what happens

Example:

```text
Nest starts building UsersModule.
UsersModule imports MembersModule.
MembersModule imports UsersModule.
Nest tries to resolve UsersModule again before the first resolution is complete.
```

Result:

- Nest may fail during startup with a circular dependency/module resolution error
- the app does not finish bootstrapping cleanly

### With `forwardRef()` -> what happens

Example:

```text
Nest starts building UsersModule.
It sees "MembersModule will be resolved later".
Nest starts building MembersModule.
It sees "UsersModule will be resolved later".
Nest finishes registering both modules.
Nest links the references after both module definitions exist.
```

Result:

- both modules can coexist
- `UsersResolver` can use `MembersService`
- `MembersService` can use `UsersService`

### Important limitation

`forwardRef()` solves the module reference timing problem. It does not automatically make circular design ideal.

Use it when the dependency is real and small, but avoid turning it into a habit for every cross-module call.

If the cycle grows more complex later, better refactors may include:

- moving shared lookup logic into a separate module
- extracting shared read helpers
- reducing direct cross-feature service dependencies

## Why Concrete `...Connection` Types Work Better

GraphQL only needs `__resolveType` when a field returns an abstract type such as an `interface` or `union`.

That means this schema shape needs runtime type resolution:

```gql
interface Connection {
  totalCount: Int!
  edges: [Edge!]!
  pageInfo: CursorPageInfo!
}

type Query {
  announcements(first: Int, after: Cursor): Connection!
}
```

When a resolver returns:

```ts
{
  totalCount,
  edges,
  pageInfo,
}
```

GraphQL knows the value satisfies the `Connection` interface, but it does not know the concrete runtime type. It still has to decide whether the object is:

- `AnnouncementConnection`
- `DocumentRequestConnection`
- `EmergencyContactConnection`
- `NotificationConnection`
- `MemberProfileConnection`
- `ScheduleConnection`

Because of that, the server needs extra runtime logic to resolve the interface type. If that logic depends on checking arbitrary object fields, it becomes fragile when object shapes change.

This schema shape is safer:

```gql
type AnnouncementConnection implements Connection {
  totalCount: Int!
  edges: [AnnouncementEdge!]!
  pageInfo: CursorPageInfo!
}

type Query {
  announcements(first: Int, after: Cursor): AnnouncementConnection!
}
```

Why this works:

- `AnnouncementConnection` is a concrete GraphQL type.
- GraphQL already knows the exact return type of `announcements`.
- No `ConnectionResolver` or `EdgeResolver` is needed for that field.
- `implements Connection` still keeps a shared pagination contract.

In short:

- Use `Connection!` only when you intentionally want an abstract interface return and are prepared to resolve its runtime type.
- Use `AnnouncementConnection!`, `NotificationConnection!`, and similar concrete types when the query already knows what it returns.

`NodeResolver` is still useful only when a field actually returns the abstract `Node` interface. If a field returns `Announcement`, `MemberProfile`, or another concrete type directly, GraphQL does not need `__resolveType` for that field.

## Why Prefer `id: ID!` In GraphQL Schemas

For public GraphQL types, `id: ID!` is usually a better contract than `id: ObjectId!` or `_id: ObjectId!`.

Why:

- `ID` is GraphQL's built-in scalar for identifiers. It tells clients "this is an opaque identity value", not a database-specific format.
- It keeps the API decoupled from MongoDB internals. `_id` and `ObjectId` are persistence details; `id` is the API field clients should depend on.
- It works better with GraphQL tooling such as client caches, code generators, and common Node-style conventions, which usually expect an `id` field.
- `!` means the field is non-null, so every returned object must have an identifier.

Recommended boundary:

- GraphQL schema: `id: ID!`
- MongoDB model: `_id`
- Mapping layer: convert `_id` to `id` before returning GraphQL objects

Example:

```gql
type User implements Node {
  id: ID!
  email: String!
}
```

Use a custom `ObjectId` scalar only when you intentionally want the schema itself to expose MongoDB-specific semantics or enforce ObjectId-shaped input at the GraphQL scalar level. For most application schemas, `ID!` is the cleaner default and leaves validation or conversion to the resolver or service layer.
