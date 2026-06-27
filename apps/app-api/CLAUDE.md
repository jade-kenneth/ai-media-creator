# API Standards

## Pattern Consistency

- Follow the existing codebase structure, naming, data-flow, and module/resolver/service/repository patterns.
- Deviate only when truly necessary; keep changes minimal and document the rationale.
- Do not keep deprecated APIs or libraries when a maintained alternative exists.

## SDL Contract

- SDL files are the source of truth for the GraphQL API contract.
- Shared scalars and interfaces go in a shared schema file. Feature schemas use `extend type Query` and `extend type Mutation`.
- GraphQL types describe API meaning, not database storage. Do not encode ORM/ODM naming into the public schema.
- Do not hand-edit generated GraphQL types. Change SDL first, then regenerate.

## ID Rules

- Use `id: ID!` for entity identifiers. Never expose `_id` or other database-specific identifiers.
- Use `ID` for relation fields. Map persistence identifiers to `id` at the API boundary.

## Type Design

- Entity types implement `Node` when the schema uses it. Summary/aggregate types do not.
- Use concrete edge and connection types, not abstract `Edge` or `Connection` directly.
- `[Type!]!` for lists that are always present. Only nullable when a value can genuinely be absent.

## Nullability Contract

- SDL query output is the source of truth. If a query returns `field: Type!`, the corresponding input must also be `field: Type!`.
- Nullable inputs are only allowed when the output is nullable or the field is genuinely optional at write time (e.g. `UpdateXInput`).

## Naming Standards

- PascalCase: type names, input names, enum names, edge/connection names.
- UPPER_SNAKE_CASE: enum values.
- Singular entity types, plural collection queries.
- `CreateXInput` / `UpdateXInput` for mutation inputs.
- `XFilterInput` for top-level filters, `XFieldFilterInput` for reusable field-level filters.
- `searchByX` for dedicated search queries.

## SDL File Layout

Top-level declarations in this order:

1. Enums
2. Reusable filter/scalar input types
3. Main object types
4. Edge types
5. Connection types
6. Top-level filter inputs
7. Mutation input types
8. `extend type Query`
9. `extend type Mutation`

One field per line. One blank line between top-level declarations.

## Filter Rules

SDL `filter` arguments must be structurally compatible with `RepositoryFilter<XRecord>` from `src/libs/repository.ts`. Pass the filter through directly — no `normalizedFilter` variables, no mapping logic.

**Required signature in both layers:**

`<y>.resolver.ts`:
```ts
async xs(
  @Args('filter') filter?: RepositoryFilter<XRecord>,
  @Args('first') first?: number,
  @Args('after') after?: string,
): Promise<XConnection> {
  return this.xService.listXs(filter, first, after);
}
```

`<y>.service.ts`:
```ts
async listXs(
  filter?: RepositoryFilter<XRecord>,
  first?: number,
  after?: string,
): Promise<XConnection> {}
```

- Never use `XFilterInput` as a TypeScript parameter type in resolver or service.
- Always apply `RepositoryFilter` to the record type (`XRecord`), not the GraphQL output type (`X`).
- Non-filter controls (sort, search, pagination) are separate top-level arguments, not inside `filter`.

## Enum Filter Rules

Every filterable enum field gets a dedicated `XEnumFilterInput`:

```gql
input XEnumFilterInput {
  equal: XEnum
  notEqual: XEnum
  in: [XEnum!]
  notIn: [XEnum!]
}

input XFilterInput {
  xField: XEnumFilterInput
}
```

## Sorting Rules

SDL `sort` arguments must be structurally compatible with `RepositorySort<XRecord>`. Pass through directly — no `normalizedSort` variables.

```gql
x(filter: XFilterInput, sort: XSortInput, first: Int, after: Cursor): XConnection!

input XSortInput {
  createdAt: SortDirection
  title: SortDirection
}
```

## Search Rules

No generic `search` field inside filter inputs. Implement search via the repository `search(...)` method and expose it as a dedicated query:

```gql
searchByX(search: String!, first: Int, after: Cursor): [X!]
```

## Repository Convention

Repository files follow a strict factory pattern. Never deviate from this shape:

```ts
import { Connection, Types } from 'mongoose';
import { type XRecord } from 'src/graphql/generated/graphql'; // or define inline
import { MongooseRepository } from 'src/libs/moongose-repository';
import { Repository } from 'src/libs/repository';

export type XRecord = { /* fields */ };

export type XRepository = Repository<XRecord>;

export async function XRepositoryFactory(
  connection: Connection,
): Promise<XRepository> {
  return new MongooseRepository<XRecord>(
    connection,
    'CollectionName',
    { /* schema fields */ },
    [ /* indexes */ ],
  );
}
```

**Rules:**
- `XRepository` is always a `type` alias for `Repository<XRecord>` — never a custom `interface` with re-declared methods.
- The factory returns the `MongooseRepository` instance directly — never wrap it in a manual object literal that re-delegates each method.
- Do not import or re-export `RepositoryFilter`, `RepositoryList`, or `RepositoryQueryOptions` from the repository file; consumers import them from `src/libs/repository` directly.

## Module Structure

Each domain module lives at `src/modules/<domain>/` with:

```
<domain>.module.ts
<domain>.resolver.ts
<domain>.service.ts
repositories/
  <domain>.repository.ts       ← exactly one RepositoryFactory per file
  <domain>.repository.module.ts
```

- One `RepositoryFactory` per `.repository.ts` file. Never add a second; create a new file instead.
- Names align across module / resolver / service / repository.
- The module imports its repository module, provides its service and resolver, and exports the service when other modules depend on it.
- Resolvers stay thin — delegate all business logic to the service.
- Repository access goes through the repository abstraction; never call Mongoose directly from resolvers or services.
- Use the DI token pattern from `src/types/tokens.ts`.

```ts
// module
@Module({
  imports: [DomainRepositoryModule],
  providers: [DomainService, DomainResolver],
  exports: [DomainService],
})
export class DomainModule {}

// repository module
@Module({
  providers: [{
    provide: TOKENS.DOMAIN_REPOSITORY,
    useFactory: DomainRepositoryFactory,
    inject: [getConnectionToken()],
  }],
  exports: [TOKENS.DOMAIN_REPOSITORY],
})
export class DomainRepositoryModule {}

// service injection
@Injectable()
export class DomainService {
  constructor(
    @Inject(TOKENS.DOMAIN_REPOSITORY)
    private readonly repository: DomainRepository,
  ) {}
}
```

## Service Implementation

- Inline small validation and normalization logic; do not create tiny helpers like `normalizeRequiredString`.
- In multi-step workflows with side effects, perform the side effect first and only persist terminal state after it succeeds. Handle rollback or transactional boundaries explicitly when ordering cannot change.

## Authentication

Treat auth as a dedicated module boundary with clear role separation:

- **module** — wires imports, providers, exports, and runtime config
- **service** — registration, login, logout, current-user lookup, password verification, token generation
- **resolver/controller** — thin; delegates to service
- **strategy** — validates credentials/tokens and loads the authenticated user
- **guards** — enforce authentication and authorization at the transport boundary
- **decorators** — expose current user, public endpoints, role/permission metadata

Rules:
- Typed token payloads and current-user objects; no `any`.
- Load secrets and token expiration from validated runtime config; fail fast on startup.
- Password hashing and token signing stay in the service layer, not resolvers.
- For GraphQL, bridge the request into the execution context so guards and decorators work.
- Export only what other modules genuinely need (guards, service, token utilities).

## Health Check

- Expose `GET /health` (REST) and `_health` query (GraphQL) backed by real runtime state.
- Reflect MongoDB connection readiness: `ok` when connected, `degraded` otherwise.
