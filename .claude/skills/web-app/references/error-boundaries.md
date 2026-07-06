# Error Boundaries — Next.js App Router

## Three Levels

| Level | File | Scope |
|---|---|---|
| Route segment | `app/**/error.tsx` | Catches render errors in that segment and its children |
| Root layout | `app/global-error.tsx` | Catches errors in the root layout itself |
| Inline (feature) | Conditional rendering with retry | Handles query errors within a page section |

---

## Route-Level Error Boundary (`error.tsx`)

Must be a `'use client'` component. Next.js App Router requires this.

```tsx
// app/error.tsx
'use client';

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <div className="flex max-w-lg flex-col items-center gap-5 text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">
          {error.message || 'An unexpected error occurred.'}
        </p>
        <div className="flex gap-3">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" asChild>
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
```

- `reset()` re-renders the route segment — use it for the "Try again" button.
- `error.digest` is the server-generated error ID — log it for server-side correlation.
- One root `error.tsx` covers the whole app unless route segments need different recovery UX.

---

## Global Error Boundary (`global-error.tsx`)

Catches errors thrown in the root `layout.tsx`. Must render a complete `<html>` and `<body>` because the layout is unavailable.

```tsx
// app/global-error.tsx
'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <main className="flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <h1 className="text-xl font-semibold">App failed to load</h1>
            <button onClick={reset}>Try again</button>
          </div>
        </main>
      </body>
    </html>
  );
}
```

---

## Nested Route Segments

Add a nested `error.tsx` only when recovery must differ from the root error page:

```
app/
├── error.tsx              ← global fallback
└── admin/
    ├── layout.tsx
    └── residents/
        ├── error.tsx      ← residents-specific recovery UX
        └── page.tsx
```

---

## Inline Feature Error State

For query errors within a page section (not full-page crashes), render an inline error with a retry action:

```tsx
const { data, isLoading, isError, refetch } = useMyQuery();

if (isError) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/70 bg-card px-5 py-4">
      <div className="space-y-1">
        <p className="font-medium">Could not load data</p>
        <p className="text-sm text-muted-foreground">
          There was a problem fetching this list.
        </p>
      </div>
      <Button variant="outline" onClick={() => refetch()}>
        Retry
      </Button>
    </div>
  );
}
```

This pattern keeps the rest of the page functional while surfacing the specific section's failure.

---

## What Error Boundaries Do NOT Catch

- Errors in event handlers — handle with try/catch and `toast.error()`.
- Errors in async functions not directly in render (mutation callbacks, timeouts) — handle with try/catch.
- Errors during data fetching in Server Components — these surface as route errors and are caught by `error.tsx`.

---

## Adding Error Reporting

Call a reporting service inside `error.tsx` to capture production errors:

```tsx
useEffect(() => {
  reportError(error); // e.g., Sentry.captureException(error)
}, [error]);
```

---

## Anti-Patterns

- Do not add `'use client'` React `ErrorBoundary` class components — use `error.tsx` files instead.
- Do not leave `isError` states unhandled in query-driven components — always render an inline error with a retry.
- Do not use `error.tsx` for expected empty states — those are `EmptyState` territory.
- Do not omit `'use client'` from `error.tsx` — it is always required.
- Do not add a nested `error.tsx` for every route segment — one root fallback is usually enough.

---

## Related References

- `references/notifications-toast.md` — toast vs boundary: transient action errors vs render failures
- `references/caching.md` — query error states that should render inline instead of throwing
- `references/graphql-patterns.md` — the error names the client returns and boundaries may need to interpret
