# Caching Patterns — TanStack Query & Apollo Client

> Reference guide for caching strategies used across apps in this monorepo.
> Covers TanStack Query (REST/server-state) and Apollo Client (GraphQL) patterns.

---

## Table of Contents

1. [Caching Mental Model](#1-caching-mental-model)
2. [TanStack Query Caching](#2-tanstack-query-caching)
   - [How the Cache Works](#21-how-the-cache-works)
   - [Query Keys](#22-query-keys)
   - [Stale Time vs Cache Time](#23-stale-time-vs-cache-time)
   - [Revalidation Strategies](#24-revalidation-strategies)
   - [Cache Invalidation](#25-cache-invalidation)
   - [Optimistic Updates](#26-optimistic-updates)
   - [Prefetching](#27-prefetching)
   - [Pagination & Infinite Queries](#28-pagination--infinite-queries)
   - [Common Pitfalls](#210-common-pitfalls)
3. [Apollo Client Caching](#3-apollo-client-caching)
   - [How the Normalized Cache Works](#31-how-the-normalized-cache-works)
   - [Cache IDs and `__typename`](#32-cache-ids-and-__typename)
   - [Type Policies](#33-type-policies)
   - [Fetch Policies](#34-fetch-policies)
   - [Cache Reads & Writes](#35-cache-reads--writes)
   - [Cache Invalidation & Eviction](#36-cache-invalidation--eviction)
   - [Optimistic Responses](#37-optimistic-responses)
   - [Refetch Strategies](#38-refetch-strategies)
   - [Pagination (Relay-style & Offset)](#39-pagination-relay-style--offset)
   - [Common Pitfalls](#311-common-pitfalls)
4. [TanStack Query vs Apollo Client — Comparison](#4-tanstack-query-vs-apollo-client--comparison)
5. [When to Use Which](#5-when-to-use-which)
6. [Shared Patterns & Best Practices](#6-shared-patterns--best-practices)
7. [Direct Cache Update vs Invalidation](#7-direct-cache-update-vs-invalidation)
8. [Common Mistakes — Decision Table](#8-common-mistakes--decision-table)
9. [Quick Reference](#quick-reference)

---

## 1. Caching Mental Model

Both TanStack Query and Apollo Client solve the same core problem:

> **Server state is not your state.** It lives on the server, can change at any time, and your UI holds a potentially stale snapshot of it.

A caching layer:

1. **Stores** fetched data so re-renders don't re-fetch
2. **Deduplicates** concurrent requests for the same data
3. **Revalidates** when data might be stale
4. **Invalidates** when mutations change server state
5. **Garbage-collects** entries no longer in use

```
┌─────────────┐     fetch      ┌──────────┐
│  Component   │ ◄──────────── │  Server  │
│  (UI layer)  │               └──────────┘
│              │                     ▲
│  useQuery()  │──── read ───► ┌────┴─────┐
│              │               │  Cache    │
│  useMutation │──── write ──► │  Layer    │
└─────────────┘               └──────────┘
```

**Key distinction:**

- **TanStack Query** = document cache (stores responses keyed by query key)
- **Apollo Client** = normalized cache (decomposes responses into individual entities)

---

## 2. TanStack Query Caching

### 2.1 How the Cache Works

TanStack Query uses a **document/key-value cache**. Each unique query key maps to a single cache entry containing the full response.

```
Cache Store (simplified):
─────────────────────────────────
Key: ['notes']           → { data: [...], dataUpdatedAt: 1710000000 }
Key: ['notes', 'abc123'] → { data: { id: 'abc123', ... }, dataUpdatedAt: 1710000001 }
Key: ['notes', { tag: 'css' }] → { data: [...], dataUpdatedAt: 1710000002 }
─────────────────────────────────
```

Each entry has its own lifecycle:

```
                    staleTime                gcTime
                    ────────►               ────────►
 ┌──────────┐    ┌──────────┐           ┌───────────┐
 │  FRESH    │───►│  STALE   │───────── │  INACTIVE  │───► garbage collected
 │ (no refetch)  │(refetch on│           │ (no observers,  │
 │           │    │ trigger)  │           │  countdown)│
 └──────────┘    └──────────┘           └───────────┘
```

### 2.2 Query Keys

Query keys are the **identity** of cached data. They must be serializable and deterministic.

#### Key Structure Convention

```ts
// Entity list
['notes'][('notes', { tag: 'css', status: 'published' })][
  // Entity detail
  ('notes', noteId)
][('notes', noteId, 'comments')][
  // Nested / scoped
  ('users', userId, 'notes')
][('users', userId, 'notes', { tag: 'react' })];
```

#### Key Factory Pattern (Recommended)

Centralize query keys to prevent typos and enable precise invalidation:

```ts
// filepath: features/notes/noteKeys.ts
export const noteKeys = {
  all: ['notes'] as const,
  lists: () => [...noteKeys.all, 'list'] as const,
  list: (filters: NoteFilters) => [...noteKeys.lists(), filters] as const,
  details: () => [...noteKeys.all, 'detail'] as const,
  detail: (id: string) => [...noteKeys.details(), id] as const,
} satisfies Record<string, unknown>;
```

Usage:

```ts
// In queries
useQuery({ queryKey: noteKeys.detail(noteId), queryFn: ... })

// In invalidation — invalidate all note lists but not details
queryClient.invalidateQueries({ queryKey: noteKeys.lists() })

// Invalidate everything related to notes
queryClient.invalidateQueries({ queryKey: noteKeys.all })
```

#### How Key Matching Works

TanStack Query uses **prefix matching** for invalidation:

```
invalidateQueries({ queryKey: ['notes'] })

Matches:
  ✅ ['notes']
  ✅ ['notes', 'list']
  ✅ ['notes', 'list', { tag: 'css' }]
  ✅ ['notes', 'detail', 'abc123']

Does NOT match:
  ❌ ['users']
  ❌ ['boilerplates']
```

### 2.3 Stale Time vs Cache Time

These two timers control completely different things:

| Timer       | Controls                                                      | Default                 | When it runs                               |
| ----------- | ------------------------------------------------------------- | ----------------------- | ------------------------------------------ |
| `staleTime` | How long data is considered **fresh** (no background refetch) | `0` (immediately stale) | From the moment data is fetched            |
| `gcTime`    | How long **unused** cache entries are kept in memory          | `5 minutes`             | From the moment the last observer unmounts |

#### Configuring Defaults

```ts
// filepath: lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is fresh for 60 seconds — no background refetch during this window
        staleTime: 60 * 1000,

        // Keep unused cache entries for 10 minutes before garbage collection
        gcTime: 10 * 60 * 1000,

        // Retry failed queries up to 2 times
        retry: 2,

        // Don't refetch when the browser tab regains focus (override per-query if needed)
        refetchOnWindowFocus: false,
      },
      mutations: {
        // Retry mutations once on network error
        retry: 1,
      },
    },
  });
}
```

#### Per-Query Override

```ts
// User profile — changes rarely, cache aggressively
useQuery({
  queryKey: ['user', 'profile'],
  queryFn: fetchProfile,
  staleTime: 5 * 60 * 1000, // fresh for 5 minutes
  gcTime: 30 * 60 * 1000, // keep in memory for 30 minutes
});

// Live dashboard data — always refetch
useQuery({
  queryKey: ['dashboard', 'stats'],
  queryFn: fetchDashboardStats,
  staleTime: 0, // always stale
  refetchInterval: 30 * 1000, // poll every 30 seconds
});
```

#### Stale Time Decision Guide

| Data Type                                | Suggested `staleTime`           | Reasoning                                 |
| ---------------------------------------- | ------------------------------- | ----------------------------------------- |
| User profile                             | `5–10 min`                      | Rarely changes within a session           |
| Note/document list                       | `30–60s`                        | Changes on user action, not externally    |
| Note detail                              | `60s–2 min`                     | Single-user editing, low conflict risk    |
| Search results                           | `0` (or `30s`)                  | Depends on query params, changes often    |
| Dashboard stats                          | `0` + polling                   | Must reflect latest state                 |
| Static reference data (categories, tags) | `10–30 min`                     | Rarely changes                            |
| Auth session                             | `Infinity` (managed separately) | Managed by auth provider, not query cache |

### 2.4 Revalidation Strategies

TanStack Query revalidates (background refetch) stale data on these triggers:

| Trigger                          | Default | Control                              |
| -------------------------------- | ------- | ------------------------------------ |
| Component mounts with stale data | ✅ On   | `refetchOnMount: false`              |
| Window regains focus             | ✅ On   | `refetchOnWindowFocus: false`        |
| Network reconnects               | ✅ On   | `refetchOnReconnect: false`          |
| Polling interval                 | ❌ Off  | `refetchInterval: 30000`             |
| Manual invalidation              | N/A     | `queryClient.invalidateQueries(...)` |

**How background refetch works:**

```
1. Component mounts
2. Cache has data for this key → render immediately (stale or fresh)
3. If stale → trigger background refetch
4. New data arrives → cache updates → component re-renders with fresh data
5. User sees no loading spinner (unless first fetch)
```

This is "stale-while-revalidate" — the user sees cached data instantly while fresh data loads in the background.

### 2.5 Cache Invalidation

Invalidation is the most critical caching operation. Get this wrong and users see stale data after mutations.

#### After Mutations

```ts
// filepath: features/notes/useCreateNote.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { noteKeys } from './noteKeys';

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createNote,
    onSuccess: () => {
      // Invalidate all note lists — they need to include the new note
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
    },
  });
}
```

#### After Update

```ts
export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateNote,
    onSuccess: (updatedNote) => {
      // Option A: Invalidate (triggers refetch)
      queryClient.invalidateQueries({ queryKey: noteKeys.detail(updatedNote.id) });
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });

      // Option B: Direct cache update (no refetch, instant)
      queryClient.setQueryData(noteKeys.detail(updatedNote.id), updatedNote);
      // Still invalidate lists since list shape may differ from detail
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
    },
  });
}
```

#### After Delete

```ts
export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNote,
    onSuccess: (_data, noteId) => {
      // Remove the detail entry entirely
      queryClient.removeQueries({ queryKey: noteKeys.detail(noteId) });
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
    },
  });
}
```

#### Invalidation Scope Guide

| Mutation              | Invalidate                           |
| --------------------- | ------------------------------------ |
| Create entity         | All lists for that entity type       |
| Update entity         | That entity's detail + all lists     |
| Delete entity         | Remove detail + invalidate all lists |
| Bulk operation        | All queries for that entity type     |
| Cross-entity mutation | All affected entity types            |

### 2.6 Optimistic Updates

Show the expected result immediately, then reconcile with the server response.

```ts
export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateNote,

    onMutate: async (variables) => {
      // 1. Cancel in-flight queries so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: noteKeys.detail(variables.id) });

      // 2. Snapshot the current value for rollback
      const previousNote = queryClient.getQueryData(noteKeys.detail(variables.id));

      // 3. Optimistically update the cache
      queryClient.setQueryData(noteKeys.detail(variables.id), (old: Note | undefined) => {
        if (!old) return old;
        return { ...old, ...variables };
      });

      // 4. Return snapshot for rollback in onError
      return { previousNote };
    },

    onError: (_error, variables, context) => {
      // Rollback to previous value
      if (context?.previousNote) {
        queryClient.setQueryData(noteKeys.detail(variables.id), context.previousNote);
      }
    },

    onSettled: (_data, _error, variables) => {
      // Always refetch after mutation to ensure server truth
      queryClient.invalidateQueries({ queryKey: noteKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
    },
  });
}
```

**When to use optimistic updates:**

- Toggle-like mutations (favorite, pin, archive)
- Inline edits where latency is noticeable
- Status changes

**When NOT to use optimistic updates:**

- Complex server-side transformations (slug generation, computed fields)
- Mutations where the server may reject (validation-dependent)
- File uploads

### 2.7 Prefetching

Load data before the user needs it for instant navigation.

```ts
// Prefetch on hover (link/card)
function NoteCard({ note }: { note: NoteSummary }) {
  const queryClient = useQueryClient();

  function handlePrefetch() {
    queryClient.prefetchQuery({
      queryKey: noteKeys.detail(note.id),
      queryFn: () => fetchNote(note.id),
      staleTime: 60 * 1000, // Don't re-prefetch if already fresh
    });
  }

  return (
    <Link
      href={`/notes/${note.slug}`}
      onMouseEnter={handlePrefetch}
      onFocus={handlePrefetch}
    >
      {note.title}
    </Link>
  );
}
```

```ts
// Prefetch on the server (App Router)
// filepath: app/notes/page.tsx
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { makeQueryClient } from '@/lib/queryClient';
import { noteKeys } from '@/features/notes/noteKeys';

export default async function NotesPage() {
  const queryClient = makeQueryClient();

  await queryClient.prefetchQuery({
    queryKey: noteKeys.lists(),
    queryFn: fetchNotes,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <NotesListClient />
    </HydrationBoundary>
  );
}
```

### 2.8 Pagination & Infinite Queries

#### Standard Pagination

```ts
function useNotesPaginated(page: number, filters: NoteFilters) {
  return useQuery({
    queryKey: noteKeys.list({ ...filters, page }),
    queryFn: () => fetchNotes({ ...filters, page }),
    placeholderData: keepPreviousData, // Keep old page visible while new page loads
  });
}
```

`keepPreviousData` prevents the UI from flashing to a loading state between page transitions. The previous page's data stays rendered while the next page loads.

#### Infinite Scroll

```ts
import { useInfiniteQuery } from '@tanstack/react-query';

function useNotesInfinite(filters: NoteFilters) {
  return useInfiniteQuery({
    queryKey: noteKeys.list({ ...filters, infinite: true }),
    queryFn: ({ pageParam }) => fetchNotes({ ...filters, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

// In component:
// const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useNotesInfinite(filters);
// data.pages.flatMap(page => page.items) gives all loaded items
```

### 2.10 Common Pitfalls

#### ❌ Forgetting to invalidate after mutations

```ts
// BAD — user creates a note but the list still shows old data
useMutation({ mutationFn: createNote });

// GOOD
useMutation({
  mutationFn: createNote,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
  },
});
```

#### ❌ Unstable query keys (new reference every render)

```ts
// BAD — creates a new object reference every render, triggers infinite refetches
useQuery({ queryKey: ['notes', { filters }], ... })
// where `filters` is computed inline without memoization

// GOOD — stable key via factory
const filters = useMemo(() => ({ tag, status }), [tag, status]);
useQuery({ queryKey: noteKeys.list(filters), ... })
```

#### ❌ Using staleTime: Infinity without invalidation

```ts
// BAD — data is never refreshed, even after mutations
useQuery({ queryKey: ['notes'], staleTime: Infinity, ... })

// GOOD — pair long staleTime with explicit invalidation on mutations
```

#### ❌ Relying on `staleTime` while a global `refetchOnMount: 'always'` overrides it

`refetchOnMount: 'always'` refetches on **every** mount regardless of `staleTime`. If
that is the QueryClient default, adding a per-query `staleTime` does nothing to stop the
cached data from flickering (background refetch → re-render) each time its screen mounts.

For **stable, read-only reference data** — data the user reads but never mutates and that
changes rarely (rosters, directories, catalogs, category/option lists) — pair a long
`staleTime` with `refetchOnMount: true` so mounts respect `staleTime` and render the cached
list instantly. It still refreshes on reconnect/focus once stale and on cold start, and
there is no stale-after-mutation risk because the client never mutates it.

```ts
// BAD — inherits the global `refetchOnMount: 'always'`, so it refetches and
// flickers on every mount even though the data almost never changes
useReferenceListQuery();

// BAD — staleTime is ignored while `refetchOnMount: 'always'` is the default
defineQuery({ /* ... */ staleTime: ONE_HOUR });

// GOOD — respect staleTime on mount so the cached list shows instantly
defineQuery({ /* ... */ staleTime: ONE_HOUR, refetchOnMount: true });
```

Share one `staleTime` constant across reference-list queries so the freshness policy lives
in one place instead of a magic number copied per file.

#### ❌ Over-invalidating (invalidating everything on every mutation)

```ts
// BAD — invalidates the entire cache, all queries refetch
queryClient.invalidateQueries(); // no key = everything

// GOOD — scope invalidation to affected queries
queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
```

#### ❌ Not handling the loading→success→error states

```ts
// BAD
const { data } = useQuery(...);
return <div>{data.title}</div>; // crashes when loading

// GOOD
const { data, isLoading, error } = useQuery(...);
if (isLoading) return <Skeleton />;
if (error) return <ErrorState error={error} />;
if (!data) return <EmptyState />;
return <div>{data.title}</div>;
```

---

## 3. Apollo Client Caching

### 3.1 How the Normalized Cache Works

Apollo Client's `InMemoryCache` is a **normalized cache**. Instead of storing full query responses, it:

1. **Decomposes** each response into individual entities
2. **Stores** each entity by its cache ID (`__typename:id`)
3. **References** entities from query results

```
GraphQL Response:                    Normalized Cache:
─────────────────                    ─────────────────
{                                    ROOT_QUERY
  notes: [                             .notes → [ref(Note:1), ref(Note:2)]
    { id: 1, title: "CSS Grid" },
    { id: 2, title: "Flexbox" }      Note:1 { id: 1, title: "CSS Grid" }
  ]                                  Note:2 { id: 2, title: "Flexbox" }
}
```

**Why normalization matters:**

When you update `Note:1` via a mutation, **every query that references `Note:1` automatically updates** — no manual invalidation needed for field-level changes.

```
Before mutation:
  ROOT_QUERY.notes → [ref(Note:1), ref(Note:2)]
  Note:1 { id: 1, title: "CSS Grid" }

After updateNote(id: 1, title: "CSS Grid Mastery"):
  Note:1 { id: 1, title: "CSS Grid Mastery" }  ← updated in place

  Every component reading Note:1 re-renders automatically ✅
```

### 3.2 Cache IDs and `__typename`

Apollo generates cache IDs using `__typename` + `id` (or `_id`) by default:

```
{ __typename: "Note", id: "abc123" }  →  cache key: "Note:abc123"
{ __typename: "User", id: "user-1" }  →  cache key: "User:user-1"
```

#### Custom Cache IDs

For entities that don't use `id`:

```ts
const cache = new InMemoryCache({
  typePolicies: {
    PackageGuide: {
      keyFields: ['slug'], // Use slug instead of id
      // cache key: "PackageGuide:react-hook-form"
    },
    IssueLogComment: {
      keyFields: ['issueId', 'commentIndex'],
      // cache key: "IssueLogComment:123:0"
    },
    DashboardStats: {
      keyFields: [], // Singleton — only one instance exists
      // cache key: "DashboardStats:{}"
    },
  },
});
```

#### Ensuring `__typename` and `id` Are Always Queried

```graphql
# BAD — missing id, Apollo can't normalize
query GetNotes {
  notes {
    title
    content
  }
}

# GOOD — always include id (and __typename is automatic)
query GetNotes {
  notes {
    id
    title
    content
  }
}
```

### 3.3 Type Policies

Type policies customize how Apollo reads, writes, and merges cache entries.

```ts
// filepath: lib/apolloClient.ts
import { InMemoryCache } from '@apollo/client';

const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        // Merge paginated note lists instead of replacing
        notes: {
          keyArgs: ['filter', 'sortBy'], // These args create separate cache entries
          merge(existing = [], incoming, { args }) {
            if (args?.offset === 0) return incoming; // Reset on first page
            return [...existing, ...incoming]; // Append on subsequent pages
          },
        },
      },
    },
    Note: {
      keyFields: ['id'],
      fields: {
        // Provide a default for a field that might not always be fetched
        tags: {
          read(existing) {
            return existing ?? [];
          },
        },
      },
    },
  },
});
```

#### `keyArgs` — Controlling Cache Separation

`keyArgs` determines which arguments create **separate cache entries** vs which are "pagination" arguments:

```ts
notes: {
  // filter and sortBy create separate entries
  // offset and limit are pagination — same logical list
  keyArgs: ['filter', 'sortBy'],
  // Result:
  // notes({"filter":"css","sortBy":"date"}) → one cache entry
  // notes({"filter":"grid","sortBy":"date"}) → different cache entry
  // notes({"filter":"css","sortBy":"date"}, offset: 0) → same as first
  // notes({"filter":"css","sortBy":"date"}, offset: 10) → merged into first
}
```

### 3.4 Fetch Policies

Fetch policies control the trade-off between cache speed and data freshness:

| Policy                  | Cache Read        | Network Request           | Use Case                                   |
| ----------------------- | ----------------- | ------------------------- | ------------------------------------------ |
| `cache-first` (default) | ✅ Yes, if exists | Only if cache miss        | Most queries — fast, low bandwidth         |
| `network-only`          | ❌ No             | ✅ Always                 | Must-be-fresh data (dashboard, real-time)  |
| `cache-and-network`     | ✅ Yes (instant)  | ✅ Also fetches (updates) | Show cached then refresh — good UX balance |
| `no-cache`              | ❌ No             | ✅ Always                 | Doesn't write to cache either — rare       |
| `cache-only`            | ✅ Yes            | ❌ Never                  | Offline mode, read-only from cache         |

```ts
// Per-query fetch policy
const { data } = useQuery(GET_NOTES, {
  fetchPolicy: 'cache-and-network',
});

// Per-query, only for the next fetch (useful after mutation)
const { data, refetch } = useQuery(GET_NOTES);
// later:
refetch(); // uses the default fetch policy

// Override fetch policy on refetch
const { data } = useQuery(GET_NOTES, {
  fetchPolicy: 'cache-first',
  nextFetchPolicy: 'cache-and-network', // After initial load, subsequent fetches also check network
});
```

#### Fetch Policy Decision Guide

| Scenario                                   | Recommended Policy                              |
| ------------------------------------------ | ----------------------------------------------- |
| Static reference data (categories, config) | `cache-first` with long TTL                     |
| Note detail (single user, rarely stale)    | `cache-first`                                   |
| Note list after navigation back            | `cache-and-network`                             |
| Dashboard with live stats                  | `network-only` or `cache-and-network` + polling |
| Search results                             | `network-only` (unique per query string)        |
| Data after a known mutation                | `refetch()` or `cache-and-network`              |

### 3.5 Cache Reads & Writes

#### Reading from Cache Directly

```ts
// Read a full query result from cache
const data = client.readQuery({
  query: GET_NOTE,
  variables: { id: 'abc123' },
});

// Read a single entity fragment from cache
const note = client.readFragment({
  id: 'Note:abc123', // cache ID
  fragment: gql`
    fragment NoteFields on Note {
      id
      title
      status
    }
  `,
});
```

#### Writing to Cache Directly

```ts
// Write a full query result
client.writeQuery({
  query: GET_NOTES,
  data: {
    notes: [...existingNotes, newNote],
  },
});

// Write/update a single entity
client.writeFragment({
  id: 'Note:abc123',
  fragment: gql`
    fragment UpdateNoteStatus on Note {
      status
    }
  `,
  data: {
    status: 'published',
  },
});
```

### 3.6 Cache Invalidation & Eviction

#### `refetchQueries` — Refetch After Mutation

```ts
// filepath: features/notes/useCreateNoteMutation.ts
const [createNote] = useMutation(CREATE_NOTE, {
  // Option A: Refetch specific queries
  refetchQueries: [{ query: GET_NOTES }, { query: GET_DASHBOARD_STATS }],

  // Option B: Refetch queries by name (matches any variables)
  refetchQueries: ['GetNotes', 'GetDashboardStats'],

  // Option C: Refetch all active (mounted) queries
  refetchQueries: 'active',

  // Option D: Refetch ALL queries (including inactive)
  refetchQueries: 'all',
});
```

#### `cache.modify` — Surgical Cache Update

```ts
// Add a newly created note to the cached list without refetching
const [createNote] = useMutation(CREATE_NOTE, {
  update(cache, { data: { createNote: newNote } }) {
    cache.modify({
      fields: {
        notes(existingNotes = []) {
          const newNoteRef = cache.writeFragment({
            fragment: gql`
              fragment NewNote on Note {
                id
                title
                slug
                status
              }
            `,
            data: newNote,
          });
          return [...existingNotes, newNoteRef];
        },
      },
    });
  },
});
```

#### `cache.evict` — Remove an Entity

```ts
const [deleteNote] = useMutation(DELETE_NOTE, {
  update(cache, { data: { deleteNote: deletedNote } }) {
    // Remove the entity from the normalized cache
    cache.evict({ id: `Note:${deletedNote.id}` });
    // Clean up dangling references
    cache.gc();
  },
});
```

#### When to Use Each Strategy

| Strategy             | Pros                        | Cons                               | Use When                          |
| -------------------- | --------------------------- | ---------------------------------- | --------------------------------- |
| `refetchQueries`     | Simple, always correct      | Extra network request              | Default choice, simple CRUD       |
| `cache.modify`       | No network request, instant | Complex, fragile if schema changes | Performance-critical updates      |
| `cache.evict` + `gc` | Clean removal               | Doesn't update lists automatically | Deleting entities                 |
| `update` function    | Full control                | Most complex                       | Adding to lists, computed updates |

### 3.7 Optimistic Responses

```ts
const [updateNote] = useMutation(UPDATE_NOTE, {
  optimisticResponse: {
    __typename: 'Mutation',
    updateNote: {
      __typename: 'Note',
      id: noteId,
      title: newTitle,
      updatedAt: new Date().toISOString(), // Approximate
    },
  },
  // Apollo automatically:
  // 1. Writes optimistic data to cache → UI updates instantly
  // 2. Waits for server response
  // 3. Replaces optimistic data with real server data
  // 4. If error → rolls back optimistic data automatically
});
```

**Important:** The optimistic response must include `__typename` and all fields that the UI reads, or components reading those fields will see `undefined` during the optimistic window.

### 3.8 Refetch Strategies

```ts
// Manual refetch
const { data, refetch } = useQuery(GET_NOTES);
// later: refetch();

// Poll
const { data } = useQuery(GET_DASHBOARD_STATS, {
  pollInterval: 30_000, // Refetch every 30 seconds
});

// Refetch on variable change (automatic)
const { data } = useQuery(GET_NOTES, {
  variables: { filter: activeFilter }, // Refetches when activeFilter changes
});
```

### 3.9 Pagination (Relay-style & Offset)

#### Offset Pagination

```ts
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        notes: {
          keyArgs: ['filter'],
          merge(existing = [], incoming, { args }) {
            const merged = existing.slice(0);
            const offset = args?.offset ?? 0;
            for (let i = 0; i < incoming.length; i++) {
              merged[offset + i] = incoming[i];
            }
            return merged;
          },
          read(existing, { args }) {
            const offset = args?.offset ?? 0;
            const limit = args?.limit ?? existing?.length;
            return existing?.slice(offset, offset + limit);
          },
        },
      },
    },
  },
});
```

#### Relay-style Cursor Pagination

```ts
import { relayStylePagination } from '@apollo/client/utilities';

const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        notes: relayStylePagination(['filter', 'sortBy']),
        // Automatically handles edges/nodes/pageInfo/cursor merging
      },
    },
  },
});
```

### 3.11 Common Pitfalls

#### ❌ Missing `id` in query selections

```graphql
# BAD — Apollo can't normalize, treats as anonymous data
query GetNotes {
  notes {
    title
  }
}

# GOOD
query GetNotes {
  notes {
    id
    title
  }
}
```

#### ❌ Mutation response doesn't return updated fields

```graphql
# BAD — cache doesn't update because title isn't returned
mutation UpdateNote($id: ID!, $title: String!) {
  updateNote(id: $id, title: $title) {
    id
  }
}

# GOOD — return all fields the UI reads
mutation UpdateNote($id: ID!, $title: String!) {
  updateNote(id: $id, title: $title) {
    id
    title
    slug
    updatedAt
  }
}
```

#### ❌ Forgetting to handle list updates after create/delete

```ts
// BAD — new note exists in cache as Note:123 but no list includes it
const [createNote] = useMutation(CREATE_NOTE);

// GOOD — explicitly update the list or refetch
const [createNote] = useMutation(CREATE_NOTE, {
  refetchQueries: ['GetNotes'],
});
```

#### ❌ Using `no-cache` everywhere

```ts
// BAD — defeats the purpose of Apollo's normalized cache
const { data } = useQuery(GET_NOTES, { fetchPolicy: 'no-cache' });

// GOOD — use cache-and-network if you want freshness + cache
const { data } = useQuery(GET_NOTES, { fetchPolicy: 'cache-and-network' });
```

#### ❌ Stale closure in `update` functions

```ts
// BAD — captures stale variable from render
const [createNote] = useMutation(CREATE_NOTE, {
  update(cache) {
    // `someStateVar` may be stale here
  },
});

// GOOD — read what you need from the cache or mutation result
const [createNote] = useMutation(CREATE_NOTE, {
  update(cache, { data }) {
    // Use data from mutation result, not component state
  },
});
```

---

## 4. TanStack Query vs Apollo Client — Comparison

| Aspect                          | TanStack Query                         | Apollo Client                                       |
| ------------------------------- | -------------------------------------- | --------------------------------------------------- |
| **Cache type**                  | Document (key-value)                   | Normalized (entity-based)                           |
| **Data protocol**               | Any (REST, GraphQL, etc.)              | GraphQL-first                                       |
| **Cache key**                   | Array-based query keys                 | `__typename` + `id`                                 |
| **Auto-updates across queries** | ❌ No (must invalidate)                | ✅ Yes (same entity, same cache entry)              |
| **List updates after create**   | Manual invalidation or `setQueryData`  | Manual (`update`, `refetchQueries`, `cache.modify`) |
| **Optimistic updates**          | Manual (`onMutate` + rollback)         | Built-in (`optimisticResponse`)                     |
| **Garbage collection**          | Timer-based (`gcTime`)                 | Reference counting + `cache.gc()`                   |
| **DevTools**                    | React Query DevTools                   | Apollo DevTools (browser extension)                 |
| **Bundle size**                 | ~13KB gzipped                          | ~33KB gzipped                                       |
| **Learning curve**              | Lower                                  | Higher (normalized cache concepts)                  |
| **SSR / App Router**            | `HydrationBoundary` + `dehydrate`      | `@apollo/experimental-nextjs-app-support`           |
| **Pagination**                  | `keepPreviousData`, `useInfiniteQuery` | Type policies (`relayStylePagination`)              |
| **Polling**                     | `refetchInterval`                      | `pollInterval`                                      |
| **Offline support**             | Via `persistQueryClient` plugin        | Via `apollo3-cache-persist`                         |

### Cache Behavior Comparison

```
TanStack Query:
  ['notes', { tag: 'css' }] → [Note1, Note2, Note3]  (full list stored)
  ['notes', { tag: 'grid' }] → [Note2, Note4]         (separate full list)

  Update Note2's title:
  → ['notes', { tag: 'css' }] still has OLD title ❌ (must invalidate)
  → ['notes', { tag: 'grid' }] still has OLD title ❌ (must invalidate)

Apollo Client:
  Query: notes(tag: "css") → [ref(Note:1), ref(Note:2), ref(Note:3)]
  Query: notes(tag: "grid") → [ref(Note:2), ref(Note:4)]

  Note:1 { id: 1, title: "CSS Grid" }
  Note:2 { id: 2, title: "Flexbox" }   ← single source of truth

  Update Note2's title via mutation:
  → Note:2 { id: 2, title: "Flexbox Mastery" }
  → BOTH queries automatically reflect the new title ✅
```

---

## 5. When to Use Which

### Use TanStack Query When:

- Your API is **REST** or non-GraphQL
- You want a **simpler mental model** (key-value cache)
- Your data relationships are **flat** (lists and details, not deeply nested graphs)
- You prefer **explicit invalidation** over automatic normalization
- You want a **smaller bundle**
- You're building a CRUD app with standard list/detail patterns
- **Frontend Vault uses this approach** — REST-like server actions with Prisma

### Use Apollo Client When:

- Your API is **GraphQL**
- Your data is **highly relational** (entities reference each other deeply)
- You need **automatic cross-query updates** when entities change
- You're working with a **complex graph** of interconnected types
- You need **fine-grained cache control** (type policies, field policies)
- Your team is already invested in the **GraphQL ecosystem**

### Use Both When:

- Your app has both GraphQL and REST endpoints
- Keep TanStack Query for REST and Apollo for GraphQL
- Don't mix them for the same data source

---

## 6. Shared Patterns & Best Practices

### 6.1 Separate Server State from Client State

```ts
// ❌ BAD — mixing server data and UI state
const [notes, setNotes] = useState<Note[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

useEffect(() => {
  fetchNotes().then((data) => {
    setNotes(data);
    setIsLoading(false);
  });
}, []);

// ✅ GOOD — server state in query, UI state separate
const { data: notes, isLoading } = useQuery({
  queryKey: noteKeys.lists(),
  queryFn: fetchNotes,
});
const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
```

### 6.2 Colocate Cache Logic with Features

```
features/
  notes/
    noteKeys.ts          ← query key factory
    useNotes.ts          ← useQuery wrapper
    useCreateNote.ts     ← useMutation with invalidation
    useUpdateNote.ts     ← useMutation with optimistic update
    useDeleteNote.ts     ← useMutation with cache removal
    types.ts
```

### 6.3 Always Handle All Query States

```tsx
function NotesList() {
  const { data, isLoading, error } = useNotes();

  if (isLoading) return <NotesListSkeleton />;
  if (error) return <ErrorState message="Failed to load notes" />;
  if (!data?.length) return <EmptyState message="No notes yet" />;

  return (
    <div className="grid gap-4">
      {data.map((note) => (
        <NoteCard key={note.id} note={note} />
      ))}
    </div>
  );
}
```

### 6.4 Toast on Mutation Outcomes

```ts
import { toast } from 'sonner';

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createNote,
    onSuccess: () => {
      toast.success('Note created');
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
    },
    onError: (error) => {
      toast.error('Failed to create note', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}
```

### 6.5 Don't Cache Auth State in Query Cache

Auth/session state should be managed by your auth provider (Supabase Auth, NextAuth, etc.), not stored in the query cache. The query cache is for **server data**, not **session identity**.

### 6.6 DevTools Are Essential

- **TanStack Query DevTools:** Shows all cached queries, their status, data, and timing. Add `<ReactQueryDevtools />` in development.
- **Apollo DevTools:** Browser extension showing the normalized cache, active queries, and mutations. Install from Chrome/Firefox extension store.

Both DevTools help you answer:

- Is the data in the cache?
- Is it stale?
- When was it last fetched?
- What queries are currently active?
- What does the cache look like after this mutation?

---

## 8. Common Mistakes — Decision Table

A consolidated reference for the most common caching mistakes across both TanStack Query and Apollo Client.

| # | Mistake | Client | Risk | Fix |
| --- | --- | --- | --- | --- |
| 1 | Not invalidating after mutations | TQ | Users see stale data after create/update/delete | Add `invalidateQueries` in `onSuccess` scoped to affected query keys |
| 2 | Unstable query keys (new object reference every render) | TQ | Infinite refetches, wasted bandwidth, potential loops | Memoize filter objects or use a key factory with stable references |
| 3 | `staleTime: Infinity` without matching invalidation on every mutation path | TQ | Data never refreshes; silent staleness | Either reduce `staleTime` or ensure every mutation that affects the data invalidates it |
| 4 | Over-invalidating (no query key = invalidate everything) | TQ | All queries refetch on every mutation — performance hit | Scope invalidation to the affected entity type: `queryClient.invalidateQueries({ queryKey: entityKeys.lists() })` |
| 5 | Not handling loading/error/empty states | Both | Runtime crash on `data.field` when data is undefined | Always destructure `{ data, isLoading, error }` and handle all three before accessing data |
| 6 | Missing `id` in GraphQL query selections | Apollo | Apollo can't normalize; entities become anonymous; cache updates don't propagate | Always select `id` (and `__typename` is automatic) in every query/fragment |
| 7 | Mutation response doesn't return all UI-read fields | Apollo | Cache has stale fields for the updated entity; UI shows mix of old/new values | Return all fields the UI reads in the mutation response selection set |
| 8 | Forgetting list updates after create/delete | Apollo | New entity exists in cache but no list query references it; deleted entity still appears | Use `refetchQueries`, `cache.modify`, or `update` function to sync lists |
| 9 | Using `no-cache` everywhere | Apollo | Defeats normalized cache; every mount triggers a network request; no deduplication | Use `cache-and-network` for freshness with cache, or `cache-first` for stable data |
| 10 | Stale closure in `update` functions | Apollo | Component state captured at mutation creation time may be outdated | Read values from the mutation `data` result or the cache, not component state |
| 11 | Optimistic update without rollback handling | TQ | If mutation fails, UI shows phantom data with no recovery | Always return `{ previous }` from `onMutate` and restore in `onError` |
| 12 | Optimistic response missing `__typename` or UI-read fields | Apollo | Components reading those fields see `undefined` during the optimistic window | Include `__typename` and every field the UI reads in `optimisticResponse` |
| 13 | Mixing TanStack Query and Apollo for the same data source | Both | Two caches holding different versions of the same data; inconsistent UI | Pick one client per data source: TQ for REST, Apollo for GraphQL |
| 14 | Caching auth/session state in the query cache | Both | Auth state lifecycle differs from server data; logout doesn't clear properly | Keep auth in a dedicated provider (Supabase Auth, NextAuth); query cache is for server data |
| 15 | Direct cache write with incomplete data (missing server-computed fields) | Both | Cache entry has stale/missing fields (slug, sanitized content, timestamps) | Use invalidation when server computes fields not available client-side |
| 16 | No `gcTime` consideration — unused cache entries persist | TQ | Memory grows unbounded in long-running SPAs | Set `gcTime` intentionally; default 5 min is reasonable for most cases |
| 17 | Missing `keyFields` for entities without `id` | Apollo | Cache collisions; different entities overwrite each other | Define `keyFields` in type policies for entities keyed by `slug`, `code`, composite keys, or singletons (`keyFields: []`) |
| 18 | Polling on a page that is not visible | Both | Wasted bandwidth and server load when user is on another tab | Use `refetchIntervalInBackground: false` (TQ) or pause polling with `skipPollAttempt` / visibility checks (Apollo) |

### Risk Legend

| Risk Level | Meaning |
| --- | --- |
| Users see stale data | Functional bug — user sees outdated information after an action |
| Runtime crash | Error boundary triggered or white screen |
| Performance hit | Unnecessary network requests, wasted bandwidth, slower UX |
| Silent staleness | Data appears correct but is outdated — hardest to detect |
| Memory grows | Long-running SPA accumulates unused cache entries |

---

## Server State and Data Fetching Rules

Treat server state as its own concern and manage it with dedicated tools.

- Use TanStack Query, SWR, Apollo Client, or another appropriate server-state library for data fetching and mutations.
- Avoid raw `fetch`, `axios`, or manual `useEffect` + `useState` patterns for server state unless there is no suitable server-state tool available.
- Keep server state separate from local UI state and session state.
- Prefer caching, deduplication, stale-while-revalidate behavior, and background refresh over ad hoc request orchestration.
- Do not reload the app or remount navigation flows after create, update, or delete operations when a targeted cache update or refetch can keep the UI in sync.
- Never invalidate the entire cache by default.
- Prefer direct cache updates for deterministic, single-entity changes.
- Prefer targeted invalidation when server-computed fields, list membership, ordering, or cross-entity side effects are involved.
- For API-backed search inputs, debounce the raw search text before passing it to query variables or request triggers.
- Reset page or filter state when search terms or filters change.
- Verify the backend contract before building search, filter, create, edit, or status flows.

### Invalidation Guide

| Operation | Strategy |
| --- | --- |
| Create | Invalidate affected list queries for that entity type |
| Update | Update or refetch the entity detail and invalidate affected list queries |
| Delete | Remove the entity from cache and invalidate affected lists |
| Bulk operations | Invalidate all queries for the affected entity type |
| Cross-entity mutations | Invalidate every affected entity scope, not the whole cache |

---

## Optimistic UI Rules

Use optimistic UI when it improves responsiveness and rollback is safe.

- Prefer optimistic updates for toggles, inline edits, reorder actions, archive flows, and low-risk deletes with confirmation.
- Snapshot current cache state before the optimistic write.
- Roll back on error.
- Reconcile with the server response on success or settlement.
- Avoid optimistic updates for payments, uploads, irreversible actions, or complex server-validated forms unless the workflow explicitly supports it.

---

## Caching Standards

- Use TanStack Query or SWR for REST or non-GraphQL server state.
- Use Apollo Client for GraphQL server state.
- Do not mix caching clients for the same data source in the same feature.
- Centralize query keys.
- Use stable and serializable cache identities.
- Invalidate only affected scopes.
- Avoid global invalidation by default.
- Prefer direct cache updates only when the updated value is complete and deterministic.
- Prefer hybrid mutation handling for many updates: update detail cache directly, then invalidate related lists.
- Use optimistic updates only for deterministic, low-risk interactions.
- Always include rollback handling for optimistic updates.
- Do not use `staleTime: Infinity` unless every mutation path has explicit invalidation coverage.
- Always handle loading, empty, and error states when reading cached query data.

---

## Quick Reference

### TanStack Query Cheat Sheet

```ts
// Fetch
useQuery({ queryKey, queryFn, staleTime, gcTime });

// Mutate
useMutation({ mutationFn, onSuccess, onError, onMutate, onSettled });

// Invalidate
queryClient.invalidateQueries({ queryKey });

// Direct cache write
queryClient.setQueryData(queryKey, data);

// Remove
queryClient.removeQueries({ queryKey });

// Prefetch
queryClient.prefetchQuery({ queryKey, queryFn });

// Infinite
useInfiniteQuery({ queryKey, queryFn, getNextPageParam, initialPageParam });
```

### Apollo Client Cheat Sheet

```ts
// Fetch
useQuery(QUERY, { variables, fetchPolicy, pollInterval });

// Mutate
useMutation(MUTATION, { variables, refetchQueries, update, optimisticResponse });

// Read cache
client.readQuery({ query, variables });
client.readFragment({ id, fragment });

// Write cache
client.writeQuery({ query, data });
client.writeFragment({ id, fragment, data });

// Modify cache
cache.modify({
  id,
  fields: {
    fieldName(existing) {
      return newValue;
    },
  },
});

// Evict
cache.evict({ id: 'Type:id' });
cache.gc();

// Refetch
refetch();
client.refetchQueries({ include: ['QueryName'] });
```

## 7. Direct Cache Update vs Invalidation

### 7.1 The Two Strategies

| Strategy                                                  | Mechanism                                          | Network Request | Speed                          |
| --------------------------------------------------------- | -------------------------------------------------- | --------------- | ------------------------------ |
| **Invalidation** (`invalidateQueries` / `refetchQueries`) | Marks cache as stale → triggers background refetch | ✅ Yes          | ~200–500ms (network dependent) |
| **Direct cache update** (`setQueryData` / `cache.modify`) | Writes new data directly into the cache            | ❌ No           | Instant                        |

### 7.2 When to Use Direct Cache Update

Use direct cache writes when **all** of these are true:

1. **The mutation response (or client state) contains the complete data** needed for the cache entry.
2. **The new value is deterministic** — you know exactly what the cache should contain without asking the server.
3. **No server-computed fields are missing** (slug, sanitized content, computed timestamps, word counts).

#### Specific Scenarios for Direct Cache Update

| Scenario                                                                | Why Direct Cache Works                              |
| ----------------------------------------------------------------------- | --------------------------------------------------- |
| Toggle mutations (pin, favorite, archive, bookmark)                     | Single boolean flip, result is deterministic        |
| Inline single-field edits (rename, status change)                       | One field changes, you know the new value           |
| Drag-and-drop reorder                                                   | Order array is known client-side                    |
| Seeding detail cache from list data                                     | You already have the data, avoid redundant fetch    |
| Removing an entity after delete                                         | No point refetching something that no longer exists |
| High-frequency interactions (real-time counters, multi-select bulk ops) | Network latency would degrade UX                    |

#### TanStack Query — Direct Cache Examples

```ts
// Toggle pin — deterministic, single field
onMutate: (async (noteId) => {
  await queryClient.cancelQueries({ queryKey: noteKeys.detail(noteId) });
  const previous = queryClient.getQueryData(noteKeys.detail(noteId));
  queryClient.setQueryData(noteKeys.detail(noteId), (old: Note | undefined) => {
    if (!old) return old;
    return { ...old, isPinned: !old.isPinned };
  });
  return { previous };
},
  // Seed detail cache from list item (prefill before navigation)
  queryClient.setQueryData(noteKeys.detail(note.id), note));

// Remove after delete (entity no longer exists)
queryClient.removeQueries({ queryKey: noteKeys.detail(noteId) });
```

#### Apollo Client — Direct Cache Examples

```ts
// Single field update via writeFragment
client.writeFragment({
  id: `Note:${noteId}`,
  fragment: gql`
    fragment PinNote on Note {
      isPinned
    }
  `,
  data: { isPinned: true },
});

// Add to list via cache.modify
cache.modify({
  fields: {
    notes(existing = []) {
      const ref = cache.writeFragment({ fragment: NOTE_FRAGMENT, data: newNote });
      return [...existing, ref];
    },
  },
});

// Remove entity
cache.evict({ id: `Note:${noteId}` });
cache.gc();
```

### 7.3 When to Use Invalidation (NOT Direct Cache)

Use invalidation when **any** of these are true:

| Condition                                                                     | Why Invalidation Is Safer                                         |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Server computes derived fields (slug, timestamps, sanitized HTML, word count) | Client doesn't have the computed values                           |
| Mutation affects list membership, sort order, or pagination cursors           | Replicating server sorting/filtering logic client-side is fragile |
| Mutation response is partial (doesn't return all cached fields)               | Direct write would leave other fields stale                       |
| Multiple cache entries across different query keys need updating              | Manually updating every affected key is error-prone               |
| Server may reject or transform the input (validation-dependent)               | Optimistic write could be wrong                                   |
| Data shape differs between list and detail queries                            | Can't safely write list item into detail cache or vice versa      |
| Concurrent edits from other users/tabs are possible                           | Server is the source of truth                                     |

### 7.4 Decision Flowchart

```
Does the mutation response contain the COMPLETE updated entity?
├── No → INVALIDATE
├── Yes
│   └── Does the update affect list membership, order, or counts?
│       ├── Yes → Direct update DETAIL + INVALIDATE LISTS (hybrid)
│       └── No
│           └── Is the update a simple, deterministic field change?
│               ├── Yes → DIRECT CACHE UPDATE
│               └── No  → INVALIDATE
```

### 7.5 The Hybrid Pattern (Recommended Default for Updates)

For most update mutations, combine both strategies:

- **Direct cache update** for the detail entry (instant UI feedback)
- **Invalidation** for list queries (server handles sorting, filtering, pagination)

```ts
// TanStack Query — hybrid pattern
export function useUpdateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateNote,
    onSuccess: (updatedNote) => {
      // Instant — detail page reflects changes immediately
      queryClient.setQueryData(noteKeys.detail(updatedNote.id), updatedNote);
      // Correct — lists refetch with proper sort/filter from server
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
    },
  });
}
```

```ts
// Apollo Client — hybrid pattern
const [updateNote] = useMutation(UPDATE_NOTE, {
  // Detail updates automatically via normalized cache (if response includes all fields)
  // Lists may need refetch if membership/order changed
  refetchQueries: ['GetNotes'],
});
```

### 7.6 Strategy Selection Summary

| Mutation Type                              | Detail Cache                 | List Cache                 |
| ------------------------------------------ | ---------------------------- | -------------------------- |
| **Toggle / pin / favorite**                | Direct cache (optimistic)    | Invalidate                 |
| **Inline single-field edit**               | Direct cache (optimistic)    | Invalidate                 |
| **Drag-and-drop reorder**                  | Direct cache (optimistic)    | Direct cache (order array) |
| **Full entity update**                     | Direct cache (from response) | Invalidate                 |
| **Create**                                 | N/A                          | Invalidate                 |
| **Delete**                                 | `removeQueries` / `evict`    | Invalidate                 |
| **Update with server-computed fields**     | Invalidate                   | Invalidate                 |
| **Update affecting multiple entity types** | Invalidate all affected      | Invalidate all affected    |
| **Seed cache from existing data**          | Direct cache write           | N/A                        |

---

## Quick Reference
