# GraphQL Patterns

## Custom GraphQLClient

Wrap `graphql-request`'s base client in a project-level `GraphQLClient` class. The class owns middleware composition, error mapping, and silent token refresh. Never import from `graphql-request` directly in feature code.

```ts
export class GraphQLClient {
  constructor(url: string, options?: GraphqlRequestOptions) {}

  async request<Data, Variables>(
    document: GraphqlDocument,
    variables?: Variables,
    options?: GraphqlRequestOptions,
  ): Promise<GraphqlRequestResult<Data>>

  async upload<Data, Variables>(
    document: GraphqlDocument,
    variables?: Variables,
    options?: GraphqlRequestOptions,
  ): Promise<GraphqlRequestResult<Data>>
}
```

The client **never throws** — all outcomes are encoded in the return type.

---

## Return Type — Discriminated Union

```ts
export type GraphqlRequestResult<Data> =
  | { ok: true; data: Data; error?: never }
  | { ok: false; data?: Data; error: GraphqlRequestError };

export interface GraphqlRequestError {
  name: GraphqlRequestErrorName;
  message: string;
  details?: Record<string, unknown>;
}
```

Always check `result.ok` before reading `result.data`. Never assume success.

---

## Error Names

```ts
export type GraphqlRequestErrorName =
  | 'BadRequestError'
  | 'ForbiddenError'
  | 'UnauthorizedError'
  | 'NotFoundError'
  | 'InternalServerError'
  | 'ServiceUnavailableError'
  | 'UnknownError'
  | 'DuplicateSessionError'
  | 'SessionTimeoutError'
  | 'InvalidCredentialsError'
  | 'ConflictError'
  | 'RegistrationPendingError'
  | 'RegistrationRejectedError'
  | 'NotAffiliatedResidentError';
```

---

## Middleware

Define middleware with `defineGraphQLMiddleware`. The auth middleware reads the access token from the token store and sets the `Authorization` header:

```ts
export const authMiddleware = defineGraphQLMiddleware(async (request) => {
  const headers = mergeHeaders(request.headers);
  const { accessToken } = await store.get();

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  } else {
    headers.delete('Authorization');
  }

  return { ...request, headers };
});
```

Multiple middleware compose left-to-right; headers merge across each step.

---

## Client Singleton

Create one singleton per app entry point using the auth middleware:

```ts
export const client = new GraphQLClient(
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/graphql',
  { middleware: [authMiddleware] },
);
```

Import this singleton in operation files. Never construct a new client per request.

---

## Silent Refresh

When the client receives a 401 or an `UNAUTHORIZED` / `ACCESS_TOKEN_EXPIRED` extension code it calls `silentRefreshSession()` once before retrying. On retry failure it clears the session and returns the unauthorized result. This is internal to the client — feature code sees only `ok: false` with `name: 'UnauthorizedError'`.

`silentRefreshSession` uses `axios.post` (not the GraphQL client) to call the REST token refresh endpoint, then updates the store.

---

## Operation Factories

Use `defineQuery`, `defineMutation`, and `defineInfiniteQuery` from the project's `react-query/utils.ts`. These wrap TanStack Query with typed query keys and a cleaned key utility.

### defineQuery

```ts
const useMyQuery = defineQuery<ResponseData, InputType>({
  queryKey: (input) => ['domain', 'myQuery', input],
  queryFn: async (input, context) => {
    const result = await client.request(MY_QUERY, input, {
      signal: context?.signal,
    });
    if (!result.ok) throw Object.assign(new Error(result.error.message), { name: result.error.name });
    return result.data;
  },
  staleTime: 30_000,
});

// Usage in a component:
const { data, isLoading, error } = useMyQuery(input);
```

### defineMutation

```ts
const useMyMutation = defineMutation<ResponseData, InputType>({
  mutationKey: ['domain', 'myMutation'],
  mutationFn: async (input) => {
    const result = await client.request(MY_MUTATION, input);
    if (!result.ok) throw Object.assign(new Error(result.error.message), { name: result.error.name });
    return result.data;
  },
});

// Usage:
const mutation = useMyMutation({
  onSuccess: (data) => { /* invalidate / navigate */ },
  onError: (error) => { /* handle */ },
});
mutation.mutate(input);
```

`suppressGlobalErrorToast: true` on `defineMutation` opts out of automatic error toasting for that mutation.

### defineInfiniteQuery

```ts
const useMyInfiniteQuery = defineInfiniteQuery<PageData, InputType>({
  queryKey: (input) => ['domain', 'list', input],
  queryFn: async (input, context) => {
    const result = await client.request(MY_QUERY, {
      ...input,
      after: context?.pageParam,
    });
    if (!result.ok) throw Object.assign(new Error(result.error.message), { name: result.error.name });
    return result.data;
  },
  getNextPageParam: (page) => page.connection.pageInfo.endCursor ?? null,
});
```

---

## Named GQL Documents

Define queries and mutations as named string constants. Pass an object with `operationName` to enable operation name tagging in network requests:

```ts
export const MY_QUERY: GraphqlOperation = {
  operationName: 'MyQuery',
  query: /* GraphQL */ `
    query MyQuery($id: ID!) {
      myEntity(id: $id) { id name }
    }
  `,
};
```

The client appends `?_q=OperationName` to the request URL for easier debugging in devtools.

---

## Query Key Conventions

```ts
export const myQueryKeys = {
  all: ['domain'] as const,
  list: (input?: ListInput) => ['domain', 'list', input] as const,
  detail: (id: string) => ['domain', 'detail', id] as const,
};
```

Use `queryClient.invalidateQueries({ queryKey: myQueryKeys.all })` to invalidate the full domain, or target specific keys for precision.

---

## Error Message Utility

Use `explainGraphqlErrorMessage(error)` to convert a `GraphqlRequestError` into a human-readable message. Always pass a fallback message as the second argument for unexpected errors.

```ts
onError: (error) => {
  showToast({ type: 'error', message: explainGraphqlErrorMessage(error, 'Something went wrong') });
},
```

---

## Rules

- Never call `client.request()` directly inside a component — always go through a `defineQuery` / `defineMutation` wrapper
- Always bridge `ok: false` to a thrown error in `queryFn` / `mutationFn` so TanStack Query's error state works
- Use `context?.signal` in `queryFn` for cancellation support
- Prefer targeted `invalidateQueries` over invalidating the full cache
- Use `getQueryKey` and `getMutationKey` helpers on the factory return value when you need the key outside the hook
