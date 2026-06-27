# Enhancement Standards

Standards and patterns for building maintainable, performant, and SEO-friendly applications across the monorepo.

---

## Table of Contents

1. [Server State and Data Fetching](#1-server-state-and-data-fetching)
2. [Optimistic UI Updates](#2-optimistic-ui-updates)
3. [UX Patterns — Inline Editing Over Page Navigation](#3-ux-patterns--inline-editing-over-page-navigation)
4. [State Management](#4-state-management)
5. [Component Discovery and Reuse](#5-component-discovery-and-reuse)
6. [Styling Standards](#6-styling-standards)
7. [Next.js Rendering Strategies](#7-nextjs-rendering-strategies)
8. [SEO Standards](#8-seo-standards)
9. [Dependency Management](#9-dependency-management)
10. [Common Anti-Patterns](#10-common-anti-patterns)

---

## 1. Server State and Data Fetching

### Use Server State Libraries for All Data Fetching

Use TanStack Query, SWR, or Apollo Client for all server data fetching and mutations. Do not use raw `fetch`, `axios`, or manual `useEffect` + `useState` patterns for server state.

These libraries provide:

- Built-in caching and deduplication
- Background refetching and stale-while-revalidate
- Optimistic UI support
- Loading, error, and success state management
- Automatic retry and garbage collection

### Targeted Cache Invalidation

After mutations, invalidate only the affected cache entries — never reload the page or invalidate the entire cache.

| Mutation Type         | Invalidation Scope                                 |
| --------------------- | -------------------------------------------------- |
| Create                | All list queries for that entity type              |
| Update                | Entity detail + all related list queries           |
| Delete                | Remove entity from cache + invalidate list queries |
| Bulk operation        | All queries for that entity type                   |
| Cross-entity mutation | All affected entity types                          |

**Prefer direct cache updates** for deterministic, single-field changes (toggles, inline edits). **Prefer invalidation** when server-computed fields are involved or list membership/sort order changes.

---

## 2. Optimistic UI Updates

For create, update, and delete mutations, use optimistic updates to provide immediate visual feedback before server confirmation.

### How It Works

1. Snapshot the current cache state before the mutation.
2. Apply the expected change to the cache immediately.
3. If the server confirms, reconcile with the server response.
4. If the server rejects, roll back to the snapshot.

### When to Use

| Scenario                                       | Use Optimistic Updates? |
| ---------------------------------------------- | ----------------------- |
| Toggle (pin, favorite, archive, bookmark)      | ✅ Yes                  |
| Inline single-field edit (rename, status)      | ✅ Yes                  |
| Drag-and-drop reorder                          | ✅ Yes                  |
| Delete with confirmation                       | ✅ Yes                  |
| Complex form submission with server validation | ❌ No — wait for server |
| File upload                                    | ❌ No — wait for server |
| Payment or irreversible action                 | ❌ No — wait for server |

### Rollback Pattern (TanStack Query)

```ts
useMutation({
  mutationFn: togglePin,
  onMutate: async (id) => {
    await queryClient.cancelQueries({ queryKey: entityKeys.detail(id) });
    const previous = queryClient.getQueryData(entityKeys.detail(id));
    queryClient.setQueryData(entityKeys.detail(id), (old) => (old ? { ...old, isPinned: !old.isPinned } : old));
    return { previous };
  },
  onError: (_err, id, context) => {
    if (context?.previous) {
      queryClient.setQueryData(entityKeys.detail(id), context.previous);
    }
  },
  onSettled: (_data, _err, id) => {
    queryClient.invalidateQueries({ queryKey: entityKeys.detail(id) });
  },
});
```

---

## 3. UX Patterns — Inline Editing Over Page Navigation

Prefer modals, drawers, and inline editing for resource creation and editing. Do not navigate to a separate page for CRUD operations unless the form complexity justifies a dedicated view.

### Why

- Maintains user context and scroll position.
- Reduces navigation overhead and perceived latency.
- Improves conversion rates by streamlining the user journey.
- Keeps the user in the flow of the task.

### Requirements

- Modals and drawers must be responsive and accessible on all screen sizes.
- Include visible, tappable close controls.
- Lock body scroll when a modal/drawer is open.
- Support keyboard interaction (Escape to close, focus trapping).
- Fit within mobile viewport with internal scroll if content overflows.

### When a Separate Page Is Acceptable

- Multi-step forms with 4+ screens.
- Forms with heavy media uploads or embedded editors.
- Workflows that require deep URL sharing (e.g., `/settings/billing`).

---

## 4. State Management

### Avoid Prop Drilling

Do not pass props through 3+ levels of intermediate components that do not use them. Use Context providers, state management libraries, or composition patterns to deliver shared state to consumers directly.

### `useReducer` Over Multiple `useState` Calls

Use `useReducer` when:

- 3+ related `useState` calls update together in the same handler.
- The next state depends on the previous state.
- State transitions follow discrete, named actions.
- Multiple event handlers modify the same group of values.

Use `useState` when:

- A single toggle, flag, or independent value is sufficient.
- No conditional transition logic exists.

### Decision Spectrum

| Complexity                                         | Tool                      |
| -------------------------------------------------- | ------------------------- |
| Local, simple (1–2 values)                         | `useState`                |
| Local, complex (related values, many transitions)  | `useReducer`              |
| Shared, moderate (3–5 consumers, structured logic) | `useReducer` + Context    |
| Shared, high-frequency (10+ consumers)             | Zustand or external store |

### Do Not Call `setState` Inside `useEffect` Without Proper Dependencies

Calling `setState` inside `useEffect` without correct dependency management causes infinite re-render loops. The state update triggers a re-render, which re-runs the effect, which calls `setState` again — repeating indefinitely.

#### The Infinite Loop Pattern

```ts
// ❌ Bad — infinite re-render loop
// setState triggers re-render → re-render runs effect → effect calls setState → loop
const [data, setData] = useState([]);

useEffect(() => {
  setData([...data, newItem]); // 'data' changes → effect re-runs → setState → re-render → loop
}, [data]); // data is both read and written — circular dependency

// ❌ Bad — missing dependency array causes effect to run every render
const [count, setCount] = useState(0);

useEffect(() => {
  setCount(count + 1); // Runs every render → setState → re-render → runs again → loop
}); // No dependency array = runs on every render

// ❌ Bad — object/array reference changes on every render
const [items, setItems] = useState<string[]>([]);
const filters = { status: 'active', page: 1 }; // New object every render

useEffect(() => {
  fetchItems(filters).then(setItems);
}, [filters]); // filters is a new reference every render → effect runs every render
```

#### Correct Patterns

```ts
// ✅ Good — use functional updater to avoid depending on the state being updated
const [data, setData] = useState([]);

useEffect(() => {
  setData((prev) => [...prev, newItem]); // No dependency on 'data'
}, [newItem]); // Only re-runs when newItem changes

// ✅ Good — set state once with a stable trigger, not on every render
const [count, setCount] = useState(0);

useEffect(() => {
  setCount(initialCount);
}, [initialCount]); // Runs only when initialCount changes

// ✅ Good — stabilize object references with useMemo
const [items, setItems] = useState<string[]>([]);
const filters = useMemo(() => ({ status: 'active', page: 1 }), []);

useEffect(() => {
  fetchItems(filters).then(setItems);
}, [filters]); // Stable reference — effect runs only when filters actually change

// ✅ Good — use primitive dependencies instead of objects
const [items, setItems] = useState<string[]>([]);

useEffect(() => {
  fetchItems({ status, page }).then(setItems);
}, [status, page]); // Primitives compared by value, not reference
```

#### Common Causes of Infinite Loops

| Cause                                                         | Why It Loops                                                         | Fix                                                                           |
| ------------------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `setState(value)` in effect that depends on `value`           | Circular: read → write → re-render → read → write                    | Use functional updater `setState(prev => ...)` and remove the state from deps |
| Missing dependency array `useEffect(() => { setState(...) })` | Effect runs on every render, each `setState` triggers another render | Add a dependency array with the correct triggers                              |
| Unstable object/array in dependency array                     | New reference every render, effect always sees a "change"            | `useMemo`, `useRef`, or use primitive deps instead                            |
| Fetching + setting state without cleanup                      | Stale closures or race conditions cause repeated updates             | Use abort controller or ignore flag for async effects                         |

#### Rule of Thumb

If `useEffect` both **reads** and **writes** the same state variable, it will almost certainly loop. Use the functional updater pattern (`setState(prev => ...)`) to break the circular dependency, or restructure the logic so the effect only writes to state it does not depend on.

---

## 5. Component Discovery and Reuse

### Use MCP and Project Registries First

Before building custom components, check:

1. **Project component registries** — existing shared UI in `libs/ui/` or `components/`.
2. **MCP (Model Context Protocol)** — discover and implement components from maintained registries.

Build custom components only when no existing option fits the requirement. Creating redundant components leads to inconsistency and maintenance burden.

### When Custom Components Are Justified

- No existing component covers the interaction pattern.
- Existing components would require modification that breaks other consumers.
- The component is feature-specific and not intended for reuse.

---

## 6. Styling Standards

### No Arbitrary Values in Utility Classes

Do not use arbitrary values in Tailwind classes (e.g., `w-[347px]`, `mt-[13px]`) or inline styles for layout and spacing. Use design tokens and semantic class names.

**Why:**

- Arbitrary values break design consistency.
- They are harder to maintain and update across the application.
- Semantic tokens ensure spacing, sizing, and color stay aligned with the design system.

```tsx
// ❌ Bad — arbitrary values
<div className="w-[347px] mt-[13px] p-[22px]">

// ✅ Good — design tokens
<div className="w-full max-w-sm mt-3 p-5">
```

### When Arbitrary Values Are Acceptable

- One-off visual adjustments for pixel-perfect alignment with external assets.
- Values that genuinely do not map to any token (e.g., matching a third-party embed dimension).
- Always add a comment explaining why the arbitrary value is necessary.

---

## 7. Next.js Rendering Strategies

Choose the rendering strategy based on data freshness requirements and SEO needs.

### Strategy Selection

| Strategy                                  | When to Use                                                                                          | Configuration                                                 |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **SSG** (Static Site Generation)          | Content that rarely changes: documentation, blog posts, marketing pages, guides                      | `generateStaticParams` + no `revalidate` (or very long)       |
| **ISR** (Incremental Static Regeneration) | Content that changes periodically: product pages, content updated daily/hourly                       | `generateStaticParams` + `revalidate: N` (seconds)            |
| **SSR** (Server-Side Rendering)           | Content that must be fresh on every request: dashboards, user profiles, search results               | `export const dynamic = 'force-dynamic'` or no caching config |
| **CSR** (Client-Side Rendering)           | Interactive-only sections that do not need SEO: admin panels, authenticated dashboards, live editors | `'use client'` components, `next/dynamic({ ssr: false })`     |

### Decision Flowchart

```
Does the page need SEO indexing?
├── No → CSR (client component)
├── Yes
│   └── Does the data change per request or per user?
│       ├── Yes → SSR
│       └── No
│           └── Does the data change periodically (hours/days)?
│               ├── Yes → ISR (revalidate: N)
│               └── No → SSG (fully static)
```

### Revalidation Guidelines

| Content Type                      | Recommended `revalidate`           |
| --------------------------------- | ---------------------------------- |
| Marketing pages, legal pages      | `86400` (1 day) or no revalidation |
| Blog posts, guides, documentation | `3600` (1 hour)                    |
| Product listings, catalogs        | `300` (5 minutes)                  |
| User-generated content feeds      | `60` (1 minute)                    |
| Dashboards, real-time data        | No caching (SSR) or `0`            |

### Title Templates (Mandatory)

Configure a title template in the root layout for consistent, SEO-friendly page titles across all routes.

```tsx
// app/layout.tsx
export const metadata: Metadata = {
  title: {
    default: 'App Name',
    template: '%s | App Name',
  },
  description: 'Application description',
};
```

Every page and `generateMetadata` function then only needs to set the page-specific title:

```tsx
// app/guides/[slug]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getGuide(slug);
  return {
    title: guide.title, // Renders as "Guide Title | App Name"
    description: guide.description,
  };
}
```

---

## 8. SEO Standards

### Sitemap (`sitemap.xml`)

Generate a sitemap that reflects the actual site structure. Automate generation so it stays current with content changes.

```tsx
// app/sitemap.ts
import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
  const guides = await getAllGuides();

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/guides`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    ...guides.map((guide) => ({
      url: `${baseUrl}/guides/${guide.category}/${guide.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];
}
```

### Robots (`robots.txt`)

Allow crawlers to access public pages. Disallow sensitive, non-indexable, or internal routes.

```tsx
// app/robots.ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/admin/'] }],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```

### JSON-LD Structured Data

Add structured data to SEO-relevant pages to improve search engine understanding and rich result eligibility.

| Content Type       | Schema Type                |
| ------------------ | -------------------------- |
| Blog posts, guides | `Article` or `TechArticle` |
| How-to content     | `HowTo`                    |
| FAQ pages          | `FAQPage`                  |
| Product pages      | `Product`                  |
| Organization/about | `Organization`             |
| Breadcrumbs        | `BreadcrumbList`           |

```tsx
// Inside a guide detail page
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: guide.title,
      description: guide.description,
      author: { '@type': 'Organization', name: 'App Name' },
      datePublished: guide.createdAt,
      dateModified: guide.updatedAt,
    }),
  }}
/>
```

Validate structured data with [Google's Rich Results Test](https://search.google.com/test/rich-results) before deploying.

### Open Graph and Twitter Cards

Include Open Graph metadata on all public-facing pages for social sharing:

```tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const guide = await getGuide((await params).slug);
  return {
    title: guide.title,
    description: guide.description,
    openGraph: {
      title: guide.title,
      description: guide.description,
      type: 'article',
      url: `${baseUrl}/guides/${guide.category}/${guide.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: guide.title,
      description: guide.description,
    },
  };
}
```

---

## 9. Dependency Management

### Keep Dependencies Current

- Install the latest stable versions of all dependencies.
- Run `npm outdated` or `pnpm outdated` regularly to identify stale packages.
- Schedule regular maintenance sessions (weekly or biweekly) for dependency updates.
- Review changelogs for breaking changes before major version upgrades.
- Update lockfiles and verify builds after every dependency change.

### Why

- Latest versions include security patches, performance improvements, and bug fixes.
- Falling behind on updates creates compounding technical debt.
- Major version gaps become increasingly difficult and risky to bridge.

---

## 10. Common Anti-Patterns

| Anti-Pattern                                                 | Why It's Harmful                                                                   | What to Do Instead                                       |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Raw `fetch`/`axios` for server state                         | No caching, no deduplication, no background refresh, manual loading/error handling | Use TanStack Query, SWR, or Apollo Client                |
| Full page reload after mutations                             | Destroys client state, wastes bandwidth, poor UX                                   | Invalidate or directly update the affected cache entries |
| Navigating to a new page for CRUD forms                      | Loses user context, adds navigation overhead                                       | Use modals or drawers for inline editing                 |
| Prop drilling through 3+ levels                              | Tight coupling, hard to refactor, components become reuse-resistant                | Use Context, state management libraries, or composition  |
| Multiple `useState` for related values                       | Scattered state, inconsistent updates, hard to reason about                        | Use `useReducer` with typed actions                      |
| `useState` declared inside `useEffect`                       | Runtime errors or render loops                                                     | Declare state at component level                         |
| Arbitrary Tailwind values (`w-[347px]`)                      | Breaks design consistency, unmaintainable                                          | Use design tokens and semantic utility classes           |
| Building components from scratch without checking registries | Inconsistency, duplicated effort, maintenance burden                               | Check MCP and project registries first                   |
| Stale dependencies                                           | Security vulnerabilities, missing fixes, growing upgrade cost                      | Update regularly with `pnpm outdated`                    |
| Missing title template in root layout                        | Inconsistent page titles, poor SEO                                                 | Configure `title.template` in root `layout.tsx` metadata |
| Missing `sitemap.xml` / `robots.txt`                         | Search engines cannot discover or prioritize pages                                 | Generate both from actual site structure                 |
| Missing structured data (JSON-LD)                            | No rich result eligibility, reduced search visibility                              | Add schema markup to SEO-relevant pages                  |
| SSR for fully static content                                 | Unnecessary server computation on every request                                    | Use SSG or ISR with appropriate `revalidate`             |
| CSR for SEO-critical pages                                   | Content invisible to search engines on initial crawl                               | Use SSR, SSG, or ISR                                     |

---

## Quick Reference — Rendering Strategy

```
SSG ──────── ISR ──────── SSR ──────── CSR
(build time)  (periodic)   (per request)  (browser only)

Static content  Content that   Fresh data     Interactive-only
never changes   changes daily  per request    no SEO needed
                /hourly
```

Choose the strategy furthest left that meets your data freshness requirements.
