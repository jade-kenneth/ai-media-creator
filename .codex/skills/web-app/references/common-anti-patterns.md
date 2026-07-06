# Common Anti-Patterns

## Common Anti-Patterns to Avoid

Do not:

- Over-abstract early
- Repeat fetch logic across multiple components
- Dump feature-specific logic into global utilities
- Use HOCs for logic that should be a hook
- Use browser-only APIs during SSR render
- Create mismatched server and client output
- Lazy-load critical above-the-fold content
- Force full page reloads after local mutations when cache update or refetch is sufficient
- Invalidate the entire cache when only a small set of queries is affected
- Silence type errors with broad `as`
- Suppress null checks with non-null assertions
- Scatter raw analytics calls across the codebase
- Treat responsive issues as optional polish
- Navigate to a separate page for simple CRUD flows that fit an accessible modal or drawer
- Drill props through many intermediate components instead of using context or better state boundaries
- Create effect loops by reading and writing the same state in one effect
- Use arbitrary utility values or ad hoc inline styles when canonical classes or tokens exist
- Build custom components before checking project registries and MCP
- Re-implement a shared field/upload component's picker, preview, validation, or upload flow inline in a new form
- Leave page titles, sitemap, robots, or structured data inconsistent with the actual site structure
- Use CSR alone for SEO-critical pages when SSG, ISR, or SSR is the better fit
- Use SSR for content that is fully static and better served with SSG or ISR

---

Patterns to avoid across `apps/*-admin`. Each entry names the anti-pattern, explains the harm, and points to the correct alternative.

---

## Tailwind — No Arbitrary Values

Do not use arbitrary values in Tailwind classes (e.g., `w-[347px]`, `mt-[13px]`) or inline styles for layout and spacing when a canonical equivalent exists.

```tsx
// ❌ arbitrary values
<div className="w-[347px] mt-[13px] p-[22px]">

// ✅ design tokens
<div className="w-full max-w-sm mt-3 p-5">
```

**Why:** Arbitrary values break design consistency and are harder to maintain across the codebase.

**When arbitrary values are acceptable:**

- One-off pixel-perfect alignment with an external asset that has no token equivalent.
- Matching a third-party embed dimension.
- Always add a comment explaining why.

---

## Query Over-Fetching for Count-Only Operations

Never reuse a full list query with `first: 1` just to read `totalCount`. The server still resolves the full entity fragment for that 1 node — all fields are fetched and transmitted even though you discard them.

```ts
// ❌ reuses the full list query just to steal totalCount
const activeCountQuery = useAdminResidentsQuery({ filter: { isActive: true }, first: 1 });
const count = activeCountQuery.data?.pages[0]?.adminResidents.totalCount;

// ✅ dedicated count-only query — no edges, no fragment, no wasted fields
const activeCountQuery = useAdminResidentsCountQuery({ filter: { isActive: true } });
const count = activeCountQuery.data?.adminResidents.totalCount;
```

**GraphQL query shape for count-only:**

```graphql
# ✅ omit edges entirely — server returns only the integer
query AdminResidentsCount($filter: AdminResidentsActiveFilterInput) {
  adminResidents(filter: $filter) {
    totalCount
  }
}
```

**When it's NOT a violation:** reading `listQuery.data?.pages[0]?.foo.totalCount` from a query that already powers a table or list is fine — no extra query needed, `totalCount` is a free rider.

**Trigger:** any time you see a variable named `*CountQuery` or `*countQuery` that uses `first: 1` against a query whose fragment fetches multiple fields.

---

## Redundant State Indicators

Do not pile multiple status treatments onto the same element when they all communicate the same thing.

```tsx
// ❌ redundant selected state
<Button className="border-primary bg-primary/10 text-primary">
  <CheckIcon />
  <Badge>Selected</Badge>
  <span>Currently selected</span>
</Button>

// ✅ one primary state treatment, optional secondary detail only if different
<Button className="border-primary bg-primary/10">
  <Badge>Selected</Badge>
</Button>
```

**Why:** redundant state signals create noisy dashboards, weaken hierarchy, and make tables and forms harder to scan.

**Allowed:** multiple treatments when they communicate different layers, such as `Failed` plus a retry affordance, or color + text for accessibility.

---

## Re-Implementing a Shared Field Component Inline

When a shared field wrapper already exists for an input type (file/image upload, rich text, date picker, tag input, etc.), consume it through a form `Controller` instead of hand-rolling its picker, preview, validation, and side effects again inside the new form.

```tsx
// ❌ dialog re-implements the whole file-upload flow inline
const [file, setFile] = useState<File | null>(null);
const [previewUrl, setPreviewUrl] = useState<string | null>(null);
async function uploadToStorage(f: File) { /* signed URL + PUT, duplicated */ }
<input type="file" ref={inputRef} hidden onChange={/* size/type checks */} />
// ...bespoke preview + remove button + on-submit upload

// ✅ reuse the shared field; hold its output value in the form
<Controller
  control={form.control}
  name="imageUrl"
  render={({ field }) => (
    <SharedUploadField
      value={field.value ?? ''}
      onChange={field.onChange}
      errorMessage={form.formState.errors.imageUrl?.message}
      disabled={isBusy}
    />
  )}
/>
```

**Why:** The bespoke copy drifts from the shared component — it misses later fixes (auth handling, path/prefix sanitization, size/type limits, accessible states) and re-introduces bugs the shared one already solved. It also duplicates the upload/side-effect logic the wrapper owns.

**How to apply:** Store the field's resolved output (e.g. the uploaded URL) in the form via `Controller`, validate that value in the zod schema, and gate submit on it with `useWatch({ control, name })` (never `form.watch`, which bails out React Compiler memoization). Only build a new inline implementation when no shared wrapper covers the input type. See `references/upload-fields.md` for the full presigned-URL upload field recipe.

---

## Anti-Pattern Reference

| Anti-Pattern                                       | Why It's Harmful                                            | What to Do Instead                                           |
| -------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------ |
| Raw `fetch`/`axios` for server state               | No caching, no deduplication, manual loading/error handling | Use TanStack Query, SWR, or Apollo Client                    |
| Full page reload after mutations                   | Destroys client state, wastes bandwidth, poor UX            | Invalidate or directly update affected cache entries         |
| Navigating to a new page for CRUD forms            | Loses user context, adds navigation overhead                | Use modals or drawers for inline editing                     |
| Prop drilling through 3+ levels                    | Tight coupling, hard to refactor                            | Use Context, state management, or composition                |
| Multiple `useState` for related values             | Impossible state combinations, inconsistent updates         | `useReducer` with typed actions                              |
| `setState` inside `useEffect` on the same value    | Infinite re-render loop                                     | Use functional updater; see `react-hooks.md`                 |
| Arbitrary Tailwind values (`w-[347px]`)            | Breaks design consistency                                   | Use canonical utility classes                                |
| Building components without checking registries    | Inconsistency, duplicated effort                            | Check MCP and project registries first                       |
| Missing title template in root layout              | Inconsistent page titles, poor SEO                          | Configure `title.template` in root `layout.tsx`              |
| Missing `sitemap.xml` / `robots.txt`               | Search engines cannot discover pages                        | Generate both from actual site structure                     |
| Missing structured data (JSON-LD)                  | No rich result eligibility, reduced search visibility       | Add schema markup to SEO-relevant pages                      |
| SSR for fully static content                       | Unnecessary server computation on every request             | Use SSG or ISR with appropriate `revalidate`                 |
| CSR for SEO-critical pages                         | Content invisible to search engines on initial crawl        | Use SSR, SSG, or ISR                                         |
| Stale dependencies                                 | Security vulnerabilities, growing upgrade cost              | Update regularly; see `dependency-management.md`             |
| Hydration-unstable values in render                | Console errors, visual flicker, SEO issues                  | Defer `Date.now()`, `Math.random()`, `window` to `useEffect` |
| `as` casts or `!` assertions to silence TypeScript | Masks real type errors, hides bugs                          | Fix the type; narrow properly                                |
| Icon + badge + helper copy all repeat one state    | Visual noise, weaker hierarchy, harder scanning             | Keep one primary indicator; add others only for new meaning  |
| Prop drilling through 3+ intermediate components   | Tight coupling, refactor-resistant                          | Context, composition, or co-location                         |
| `useXxxQuery({ first: 1 })` to read `totalCount`  | Server resolves full entity fragment for 1 node; wasted I/O | Create a dedicated count-only query with no `edges` selector |
| Re-implementing a shared field/upload flow inline  | Drifts from the shared component; misses its fixes, dupes logic | Reuse the shared field via `Controller`; store its output value |

---

## Related References

- `references/caching.md` — correct invalidation and server-state patterns behind the fetch/reload entries
- `references/upload-fields.md` — shared presigned-URL upload field recipe for the upload anti-pattern
- `references/react-hooks.md` — effect-loop prevention details
- `references/typescript-patterns.md` — fixing types properly instead of `as` / `!`
- `references/folder-structure.md` — where feature logic belongs instead of global utilities
