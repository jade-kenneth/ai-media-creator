# NestJS GraphQL authentication pipeline

Authentication is implemented once at the platform boundary and reused by
feature resolvers.

## Login and session flow

1. `AuthResolver` accepts validated credentials.
2. `AuthService` normalizes the email and verifies the bcrypt password hash.
3. inactive users or tenants are rejected.
4. `SessionsService` persists the refresh-token session identifier (`jti`).
5. access and refresh JWTs are signed with role and tenant context.
6. clients keep the access token in memory and use the refresh endpoint/session
   flow when it expires.

## Protected GraphQL request

1. the client sends `Authorization: Bearer <access token>`.
2. the GraphQL context exposes Express request/response to Nest guards.
3. `GraphqlAuthGuard` runs the JWT strategy and attaches the authenticated user.
4. `RolesGuard` compares `@Roles(...)` metadata when a resolver is restricted.
5. `@CurrentUser()` and `@CurrentTenant()` expose trusted context to the resolver.
6. the resolver delegates to a service; the service applies tenant filters and
   business validation.

`@Public()` is reserved for operations such as login and registration. Omitting
`@Roles()` on an authenticated operation means any authenticated role may call
it; it does not make the operation public.

## Role model

| Role | Scope |
| --- | --- |
| `USER` | End-user operations within the assigned tenant |
| `ADMIN` | Tenant administration within the assigned tenant |
| `SUPER_ADMIN` | Cross-tenant platform administration |

## Security invariants

- Authorization comes from the verified token and database state, never from a
  role or tenant header supplied by the client.
- Every tenant-owned service query is constrained by the authenticated tenant.
- Refresh tokens are accepted only when their session `jti` is still valid.
- Logout/revocation removes the persisted session.
- GraphQL errors are sanitized by `src/graphql/format-error.ts`.
- Password hashes, tokens, and raw credentials never appear in logs or GraphQL
  response types.

The refresh-token sequence is illustrated in
`docs/refresh-token-architecture.drawio`; tenant resolution is illustrated in
`docs/multi-tenant-architecture.drawio`.
