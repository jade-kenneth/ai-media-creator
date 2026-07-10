# API application

NestJS GraphQL API for the reusable application platform.

## Included platform capabilities

- JWT access and refresh tokens with persisted sessions
- organization-based multi-tenancy and role guards
- user, tenant admin, and super-admin account management
- account-deletion request workflow
- in-app notifications, Expo push tokens, and push delivery
- S3 presigned image uploads
- generic transactional email delivery through Brevo
- MongoDB repositories, health checks, rate limiting, security headers, logging, and optional Kafka async events

Product-specific domain modules should live outside these platform capabilities and be added by the consuming project.

## Local setup

Copy `.env.example` to `.env`, replace placeholder credentials, then install dependencies from the workspace root:

```bash
npm install
```

Start the API:

```bash
npm run -w app-api start:dev
```

The GraphQL endpoint is available at `http://localhost:3001/graphql` by default. REST health endpoints are available at `/` and `/health`.

## GraphQL schema and types

Schema source files live in `src/graphql/schemas`. After changing SDL, regenerate the committed TypeScript definitions:

```bash
npm run -w app-api generate-graphql-types
```

The generated file is `src/graphql/generated/graphql.ts` and should not be edited by hand.

## Validation

Run the smallest API checks from the workspace root:

```bash
npm run -w app-api generate-graphql-types
npm run -w app-api test
npm run -w app-api build
```

Additional commands:

```bash
npm run -w app-api test:e2e
npm run -w app-api seed:default-admin
LOCAL_DEV_RESET_CONFIRM=RESET_LOCAL_DATA npm run -w app-api reset:local-dev
```

The reset command deletes every collection in the configured database. Use it only with a disposable local database.
