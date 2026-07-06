# API Standards

There is currently no dedicated `api-app` skill. Until one exists, this file and `apps/app-api/CLAUDE.md` are the API implementation standard and the place to capture reusable API/NestJS/GraphQL lessons.

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

## Pagination Rules

- Root GraphQL `Query` fields that can grow with tenant or user data must return a concrete `XConnection!`, not an unbounded `[X!]!`.
- Every cursor or offset paginated repository read must use the shared page-size policy from `src/libs/repository.ts` (`DEFAULT_PAGE_SIZE`, `MAX_PAGE_SIZE`, `clampPageSize`). Do not hand-roll local max/min page-size logic.
- Dedicated `searchByX` queries may keep their flat list shape, but their `first` argument must be clamped with `clampPageSize(first, DEFAULT_SEARCH_LIMIT)` before reaching repository search.
- Flat `[X!]!` root lists are allowed only when they are domain-bounded by a small enum/config set or are intentionally capped in the service. Add a short code comment explaining the bound.

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
- When multiple entry points share request/body or write-model rules, centralize those rules in a feature validation module or common pipe and pass the parsed result into persistence. Do not leave unused validation helpers beside write paths, and do not rely on ad-hoc controller defaults for required body fields.
- GraphQL resolver `input` arguments must use the service-validated args decorator when SDL handles shape/nullability and the service owns business-rule validation. This keeps resolvers thin while making validation ownership visible to readers and static audits.
- For presigned upload or file-ingest endpoints, validate more than presence: require an allowed storage namespace, reject traversal or absolute keys, and enforce a MIME/type allowlist before signing any write. Do not accept caller-supplied final object keys for shared folders; clients may provide upload intent such as namespace and content type, but the service must generate the final unique storage key and extension.
- REST endpoints that perform side effects must declare authentication intent at the method boundary. For admin-only writes, pair `JwtAuthGuard` with `RolesGuard` and `@Roles(UserRole.ADMIN)`; do not rely on request-body validation as an authorization control.
- In multi-step workflows with side effects, perform the side effect first and only persist terminal state after it succeeds. Handle rollback or transactional boundaries explicitly when ordering cannot change.

## Scheduled Work

- Recurring jobs must use the shared scheduler lock service and honor the runtime scheduler-enabled flag before doing work.
- Once-only reminders or sweeps must persist a dedicated timestamp field so retries and multiple replicas do not re-send the same side effect indefinitely.
- Stamp reminder timestamps only after the notification or side-effect path has been attempted successfully enough for the user-visible record to exist; log per-record failures and continue the sweep.

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

---

## Fix & Enhancement Workflow Standard

When the user invokes a **fix or an enhancement** (any "fix", "fix this", "enhance", "improve", "add", feature-request, or similar change request), follow this three-step loop every time:

1. **Pull from Notion first.** Before touching code, use the **Notion MCP** to find the matching item in the project's task/bug tracker (the project's tracker database in Notion). Read its **Description**, **Root cause**, and **Fix** notes and treat them as the source of truth for scope. If the user names a symptom rather than a task, search the tracker to locate the item. **If no matching item exists, create one first** — a new task with the fitting `Task type` (🐞 Bug / 💬 Feature request / 💅 Polish), a clear **Task name**, a **Description** of the problem, an **Expected output / behavior** section that states what should be true after the bug or enhancement is done, and **Status** `In progress` — so every fix is tracked before any code changes.
2. **Apply the fix** in the owning app only, following that app's established patterns. When it lands, update the Notion item's **Status** to `Done` (and add a short root-cause + fix note in the page body if one isn't there).
3. **Enhance the relevant standard source.** After the fix is applied, capture the reusable lesson in the matching in-repo standard — `web-app` for admin/Next.js fixes, `mobile-app` for Expo/React Native fixes, and this file plus `apps/app-api/CLAUDE.md` for API/NestJS/GraphQL fixes until an API skill exists. **Then sync any cross-surface lesson to the matching standard.** `web-app` and `mobile-app` carry parallel reference files (e.g. `references/caching.md`, `graphql-patterns.md`, `react-patterns.md`, `typescript-patterns.md`). If the lesson is client-agnostic — it holds for both admin and mobile — add it to the matching reference in **both** skills, placing it in the equivalent section of each. If the lesson affects the GraphQL/API contract, validation, pagination, resolver/service/repository flow, generated types, or client operations, update the API docs and any affected client GraphQL/cache reference. The standard copies have diverged over time, so insert the guidance to match each file's structure rather than copy-pasting one over the other. Skip a sibling/surface only when the lesson is genuinely platform-bound (Expo/native-only, Next.js/SSR-only, or API-only), or when that surface has no parallel location.

**Why:** The tracker already holds the diagnosed root cause and intended fix, so starting there avoids re-investigating and keeps scope tight. Feeding each fix back into the relevant standard turns one-off fixes into durable guidance — but only when written generically; otherwise the standard fills up with project trivia instead of transferable rules. Most caching, data-fetching, React, and TypeScript lessons apply to both clients, while API contract and validation lessons belong in the API docs until a dedicated API skill exists.

**How to apply:** Notion → code → standard update, in that order, for every fix or enhancement. Write guidance **generically** — the rule or pattern itself, never this fix's domain, routes, filenames, or project labels — so it applies to *all* future cases, not just the one just fixed. Concrete/project-specific values stay in app source. Keep edits minimal and in the right place (`SKILL.md` non-negotiables + `references/*.md` for client skills; this file and `CLAUDE.md` for API standards). Before finishing, check whether another surface has a matching reference and mirror any cross-surface lesson there too.
