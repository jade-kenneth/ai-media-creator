# MongoDB repository and indexing

The API keeps database access behind repository interfaces. Feature services
depend on injected repositories and own business rules; GraphQL resolvers do not
query Mongoose directly.

## Layers

```text
resolver -> feature service -> repository interface -> MongooseRepository -> MongoDB
```

- `src/libs/repository.ts` defines filters, sorting, pagination, and CRUD shapes.
- `src/libs/moongose-repository.ts` implements those shapes for MongoDB.
- each feature's `repositories/` directory defines its record schema, indexes,
  provider token, and repository module.
- request-scoped batch loaders prevent repeated user/organization lookups.

## Tenant safety

Tenant-owned records must include the tenant/organization identifier in every
read, update, delete, count, and uniqueness decision. Prefer the shared tenant
filter utilities and pass tenant context from guards/decorators into services.
Never accept a client-provided tenant ID as authorization by itself.

## Index rules

Create indexes from observed query shapes, not from every field:

- unique normalized identity fields such as email or organization slug;
- tenant ID first for tenant-scoped lists;
- equality fields before sort fields in compound indexes;
- matching compound indexes for cursor pagination order;
- TTL indexes only where automatic deletion is intentional.

Every added index increases write cost and storage. Verify plans with
`explain('executionStats')`, test both selective and worst-case filters, and
document migrations for production collections.

## Adding a repository

1. Define a record type separate from the GraphQL transport type.
2. create the factory with schema fields and only required indexes.
3. expose it through a repository module and injection token.
4. inject the interface into the owning service.
5. add tests for tenant isolation, unique constraints, filters, and pagination.

The retained repositories for users, organizations, sessions, notifications,
push tokens, scheduler locks, and account-deletion requests are reference
implementations.
