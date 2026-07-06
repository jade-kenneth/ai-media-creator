# GraphQL Patterns — Custom GraphQL Client + TanStack Query

## Overview

The project wraps `graphql-request` in a custom `GraphQLClient` class. **Never import `GraphQLClient` from `graphql-request` directly** — always use the project's own class.

The key difference: the custom class never throws on API or GraphQL errors. It returns a typed discriminated union, so every call site explicitly handles both success and failure.

---

## GraphqlRequestResult — The Return Contract

Every `client.request()` call returns `GraphqlRequestResult<Data>`:

```ts
type GraphqlRequestResult<Data> =
  | { ok: true; data: Data; error?: never }
  | { ok: false; data?: Data; error: GraphqlRequestError };

type GraphqlRequestError = {
  name: GraphqlRequestErrorName;
  message: string;
};
```

Check `result.ok` before accessing data. Never assume a successful response.

---

## Error Names

```ts
type GraphqlRequestErrorName =
  | 'BadRequestError'
  | 'ForbiddenError'
  | 'UnauthorizedError'
  | 'NotFoundError'
  | 'InternalServerError'
  | 'ServiceUnavailableError'
  | 'ConflictError'
  | 'DuplicateSessionError'
  | 'SessionTimeoutError'
  | 'InvalidCredentialsError'
  | 'UnknownError';
```

---

## Custom GraphQLClient Class

```ts
// lib/graphql-client.ts
import { GraphQLClient as BaseGraphQLClient } from 'graphql-request';

export class GraphQLClient {
  private readonly url: string;
  private readonly options?: GraphqlRequestOptions;

  constructor(url: string, options?: GraphqlRequestOptions) {
    this.url = url;
    this.options = options;
  }

  async request<Data, Variables extends object = Record<string, never>>(
    document: GraphqlDocument,
    variables?: Variables,
    options?: GraphqlRequestOptions,
  ): Promise<GraphqlRequestResult<Data>> {
    // Merges middleware, headers, and options — then calls BaseGraphQLClient.rawRequest()
    // Maps HTTP status codes and GQL extension codes to GraphqlRequestErrorName
    // Handles 401 with a silent token refresh + single retry
    return this.execute<Data, Variables>(document, variables, options);
  }

  async upload<Data, Variables extends object = Record<string, never>>(
    document: GraphqlDocument,
    variables?: Variables,
    options?: GraphqlRequestOptions,
  ): Promise<GraphqlRequestResult<Data>> {
    return this.execute<Data, Variables>(document, variables, options);
  }

  private async execute<Data, Variables extends object>(
    document: GraphqlDocument,
    variables?: Variables,
    options?: GraphqlRequestOptions,
    allowSilentRefresh = true,
  ): Promise<GraphqlRequestResult<Data>> {
    // Normalizes document, merges options/middleware, calls BaseGraphQLClient
    // Maps all error cases to GraphqlRequestResult<Data> — never throws
  }
}
```

The internal `execute` method uses `rawRequest` from `graphql-request`, inspects the HTTP status and `extensions.code` on GQL errors, and maps everything to the typed error union. It does not throw.

---

## Auth Middleware

Inject the access token as a request middleware, not inline in each hook:

```ts
export const authMiddleware = defineGraphQLMiddleware(async (request) => {
  const headers = new Headers(request.headers);

  // Skip on server (no localStorage)
  if (typeof window === 'undefined') {
    headers.delete('Authorization');
    return { ...request, headers };
  }

  const { accessToken } = await store.get();
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  } else {
    headers.delete('Authorization');
  }

  return { ...request, headers };
});
```

---

## Client Singleton

Export a single `client` instance with auth middleware applied:

```ts
export const client = new GraphQLClient(
  process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'http://localhost:3001/graphql',
  { middleware: [authMiddleware] },
);
```

All hooks use this singleton. Never create a `new GraphQLClient` inside a hook or component.

---

## defineQuery / defineMutation / defineInfiniteQuery

Use these factory functions — never call `useQuery`/`useMutation` from TanStack directly.

```ts
// Using defineQuery
export const useMyEntityQuery = defineQuery<MyQuery, MyQueryVariables>({
  queryKey: (input) => ['my-entity', 'detail', input],
  queryFn: async (input) => {
    const res = await client.request<MyQuery, MyQueryVariables>(MY_QUERY, input);
    if (!res.ok) throw Object.assign(new Error(res.error.message), { name: res.error.name });
    return res.data;
  },
});

// Usage in a component
const { data, isLoading, error } = useMyEntityQuery({ id: '123' });
```

```ts
// Using defineMutation
export const useCreateMyEntityMutation = defineMutation<
  CreateMyEntityMutation,
  CreateMyEntityMutationVariables
>({
  mutationKey: ['my-entity', 'create'],
  mutationFn: async (variables) => {
    if (!variables) throw new Error('Variables required');
    const res = await client.request<CreateMyEntityMutation, CreateMyEntityMutationVariables>(
      CREATE_MY_ENTITY_MUTATION,
      variables,
    );
    if (!res.ok) throw Object.assign(new Error(res.error.message), { name: res.error.name });
    return res.data;
  },
});
```

The `ok` check + `throw Object.assign(new Error(...), { name })` is the standard bridge from the discriminated union to TanStack Query's error model.

---

## GQL Documents

```ts
import { gql } from 'graphql-request';

export const MY_QUERY = gql`
  query MyQuery($id: ID!) {
    myEntity(id: $id) {
      id
      name
    }
  }
`;
```

Always use named operations — the client appends `?_q=OperationName` to the URL for debuggability.

---

## Query Key Conventions

```ts
export const myEntityQueryKeys = {
  all: ['my-entity'] as const,
  list: (filter?: MyFilter) => ['my-entity', 'list', filter] as const,
  detail: (id: string) => ['my-entity', 'detail', id] as const,
};
```

- Use `queryKeys.all` with `invalidateQueries` after creates.
- Use `queryKeys.detail(id)` for targeted cache updates after edits.
- Keep query keys in the same file as the hooks that use them.

---

## Error Handling in Mutation Submit Handlers

```ts
import { explainGraphqlErrorMessage } from '@/react-query/graphql-error';

async function onSubmit(values: FormValues) {
  try {
    await mutation.mutateAsync(values);
    toast.success('Saved successfully');
  } catch (error) {
    toast.error(
      explainGraphqlErrorMessage(
        error instanceof Error ? error : undefined,
        'Unable to save. Try again.',
      ),
    );
  }
}
```

---

## File Structure

```
react-query/
├── graphql-client.ts          ← GraphQLClient class, authMiddleware, client singleton
├── graphql-error.ts           ← explainGraphqlErrorMessage, handleUnauthenticatedError
├── utils.ts                   ← defineQuery, defineMutation, defineInfiniteQuery
└── my-domain/
    ├── my-domain-operations.ts ← hooks + queryKeys
    └── index.ts
```

---

## Anti-Patterns

- Do not import `GraphQLClient` from `graphql-request` directly — always use the project's custom class.
- Do not call `useQuery`/`useMutation` from TanStack directly — use `defineQuery`/`defineMutation`.
- Do not access `result.data` without checking `result.ok` first.
- Do not throw raw strings — always throw `Error` objects with `.name` set to the `GraphqlRequestErrorName`.
- Do not create a new client instance in a hook or component — use the exported singleton.
- Do not inline query keys as strings — use the domain's `queryKeys` object.

---

## Related References

- `references/caching.md` — invalidation, optimistic UI, and pagination rules for the hooks defined here
- `references/auth-patterns.md` — the session/token source consumed by the auth middleware
- `references/error-boundaries.md` — where returned errors surface in the UI
- `references/typescript-patterns.md` — § 12 utilities for nullable API/GraphQL fields
