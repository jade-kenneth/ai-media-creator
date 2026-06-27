# Copilot Instructions (Project Standard)

## Read First: TypeScript Standards (Applies to All Repositories)

Use these TypeScript standards by default in any TS codebase unless a repository explicitly overrides them.

- Standardize reusable helpers where relevant: `Prettify<T>`, `ValueOf<T>`, `NonEmptyArray<T>`, `Brand<T, Name>`.
- Prefer `unknown` at external boundaries (`network`, `storage`, `env`, user input, `JSON.parse`) and narrow with validators/type guards.
- Prefer discriminated unions for multi-state/result modeling and explicit handling.
- Enforce exhaustive switches with `assertNever` for union-driven logic.
- Prefer `satisfies` (over `as`) for object shape checks while preserving inference.
- Prefer `as const` + literal unions for UI/API contracts when runtime enum behavior is not required.
- Use branded types for critical identifiers (for example `UserId`, `OrderId`) to prevent accidental mixing.
- Reject unexpected input fields for DTO-like objects (`Exact`-style typing where appropriate).
- Keep generics minimal; generics must constrain (`extends`) or transform types meaningfully.
- Remove generics that do not appear in both input and output or that do not add type safety.
- Use mapped/modifier types deliberately (`Mutable`, `DeepPartial`, `RequiredFields`) and avoid `DeepPartial` as a default.
- Use typed registries/maps with `keyof`, `Parameters<>`, and `ReturnType<>` for command/handler systems.
- Use overloads only when call-site return precision is needed (max 3 overloads before refactoring).
- Use typed key helpers (`Array<keyof T>`) instead of raw `Object.keys` assumptions.
- Use template literal types for constrained route/string contracts when they stay readable (max 2 levels deep).
- Prefer assertion functions (`asserts`) for invariants (for example required GraphQL/API maybe fields).
- Avoid broad `as` casting except for validated boundaries, branding, or proven invariants.
- Do not use `!` (non-null assertion) to silence errors; use type guards, assertion functions, or `??` fallbacks.
- Avoid large undiscriminated unions and over-generic abstractions that reduce clarity.

For detailed examples, comparison tables (`satisfies` vs `as`, `as const` vs `enum`, type guard vs Zod), and pattern selection guide, follow `DOCUMENTATION/TYPESCRIPT_PATTERNS_DOCS.md`.

Important disclaimer:
The "read first" rules below are repository-specific defaults, not universal standards for every codebase.
Apply them only when the target repository has a matching setup and architecture.
If not applicable, ignore them and follow the target repository's own standards.

## Read First: Repository-Specific Setup Rules

- Ensure mobile responsiveness for user-facing interfaces.
- For frontend forms, use `useForm`; use `zod` for validation; use `useFieldArray` for array fields.
- Optimize for Lighthouse metrics: Performance, Accessibility, Best Practices, and SEO.
- Keep GraphQL operations in `libs/graphql/src/*.gql` (no inline `gql` templates in UI code).
- After GraphQL document changes, regenerate and use hooks/types from `~/graphql/generated`.
- For GraphQL data access in frontend code, prefer generated hooks or `apolloClient` from config over ad-hoc HTTP (`axios`/raw `fetch`).

Use these instructions as the default implementation standard for React work in this repository.

This project uses:

- React
- Next.js App Router
- Monorepo structure (`apps/*`, `libs/*`)
- GraphQL generated hooks (Apollo-style usage)

## Core Rule

Prefer simple, readable, feature-focused React code. Introduce abstraction only when repetition is real and the abstraction improves maintainability.

## React Patterns To Prefer (Default)

Follow `DOCUMENTATION/REACT_PATTERNS.md` for detailed examples, comparison tables, and decision frameworks for each pattern.

### 1. Custom Hooks for Reusable Logic

- Extract reusable behavior into hooks.
- Keep UI components focused on rendering and interaction.
- Place feature-specific hooks next to the feature that owns them.

Prefer:

- `features/<feature>/useX.ts`
- `libs/<module>/...` for shared hooks

Avoid:

- dumping unrelated hooks into a single global folder

### 2. Provider Pattern for App-Wide Services

Use providers for cross-app dependencies and services such as:

- auth/session
- API client/cache
- cart/global app state
- theme/config

Rules:

- Keep provider responsibilities narrow
- Compose providers at app boundaries (root/layout)
- Do not use providers for local component state

### 3. Feature Colocation (Primary Project Organization)

Organize files by feature/domain, not only by file type.

Prefer:

```txt
features/
  auth/
    AuthProvider.tsx
    useAuth.ts
    types.ts
    utils.ts
```

Avoid:

```txt
components/
hooks/
types/
utils/
```

when it separates files that belong to the same feature.

### 4. Server State via Data Hooks (GraphQL / Query Hooks)

Treat server state separately from client UI state.

Prefer:

- generated GraphQL hooks (e.g. `useProductsQuery`, `useMyOrdersQuery`)
- query/mutation abstractions with caching and invalidation

Avoid:

- repeating manual `useEffect` + `useState` fetch logic in multiple components
- mixing server state and local UI flags in the same ad-hoc structure

### 5. HOCs Only for Page-Level Cross-Cutting Concerns

Use Higher-Order Components for concerns like:

- auth gates
- role/permission checks
- layout wrappers
- page-level analytics/instrumentation

Prefer hooks for local reusable logic.

### 6. Suspense and App Router Boundaries

Use Suspense and App Router boundaries intentionally:

- define stable loading states
- keep server/client output consistent
- avoid hydration mismatches

### 7. Use `useCallback` / `useMemo` Only for Real Performance Needs

Follow `DOCUMENTATION/REACT_HOOKS_USAGE_DOCS.md` for detailed decision trees, profiling guidance (React DevTools Profiler, Chrome DevTools), and common mistakes.

Treat `useCallback` and `useMemo` as optimization tools, not default patterns.

Prefer:

- starting with simple code first, then optimizing only when re-render or compute cost is real
- `useCallback` when passing handlers to `React.memo` children
- `useCallback` when a function is used in a hook dependency array and needs a stable reference
- `useMemo` for expensive computations
- `useMemo` to stabilize object/array props passed to memoized children
- `useMemo` for derived values when recomputation is causing unnecessary work

Avoid:

- adding `useCallback` / `useMemo` "just in case"
- memoizing cheap calculations or simple expressions
- wrapping local handlers that are not passed to memoized children
- using these hooks without a clear performance reason or profiling evidence

Important:

- functions, objects, and arrays are recreated on each render by default
- React compares props by reference, not by value
- `React.memo` only helps when prop references are stable
- overusing memoization hooks adds complexity and runtime cost

Rule of thumb:

- for `useCallback`: ask whether the function is passed to a memoized child (or must stay stable for dependencies)
- for `useMemo`: ask whether the computation is expensive or the value reference stability prevents unnecessary re-renders

### 8. useReducer + Context API (When It Fits)

Follow `DOCUMENTATION/REDUCER_CONTEXT.md` for the architecture decision guide, implementation pattern, split context optimization, and scaling limits.

Use `useReducer` + Context API when:

- state is shared across multiple components
- the state logic is complex (many actions, related fields)
- updates happen through different actions
- state changes need to be predictable and traceable
- prop drilling is 3+ levels deep

Do not use it when:

- the state is only needed in one component
- the state is simple (a few `useState` calls suffice)
- the shared value changes very often and may cause unnecessary rerenders
- adding reducer + context would be more complicated than the problem itself

State management decision spectrum:

| Complexity                                         | Tool                      |
| -------------------------------------------------- | ------------------------- |
| Local, simple (1–2 values)                         | `useState`                |
| Local, complex (related values, many transitions)  | `useReducer`              |
| Shared, moderate (3–5 consumers, structured logic) | `useReducer` + Context    |
| Shared, high-frequency updates, 10+ consumers      | Zustand or external store |

When using Context, split into separate `StateContext` and `DispatchContext` to prevent unnecessary re-renders.

### 9. useReducer for Complex Local State

Follow `DOCUMENTATION/REDUCER.md` for practical code examples (async lifecycle, multi-step forms, filter panels), TypeScript patterns, and common mistakes.

Use `useReducer` when:

- state has multiple related parts that should update together
- state updates follow clear events/actions (for example `OPEN_MODAL`, `FETCH_SUCCESS`, `RESET`)
- update logic is getting scattered across many handlers
- previous state heavily affects next state

| Signal                                                 | Prefer       |
| ------------------------------------------------------ | ------------ |
| 3+ related `useState` calls that update together       | `useReducer` |
| State transitions depend on previous state             | `useReducer` |
| You write `setA(); setB(); setC()` in the same handler | `useReducer` |
| State is a single toggle/value/flag                    | `useState`   |
| No conditional transition logic                        | `useState`   |

## Additional Patterns (Use When Appropriate)

### Compound Components

Use for flexible APIs in shared UI components and design systems.

Example:

```tsx
<Modal>
  <Modal.Header />
  <Modal.Body />
  <Modal.Footer />
</Modal>
```

### Controlled vs Uncontrolled Inputs

- Use controlled inputs for validation-heavy forms and synchronized UI state.
- Use uncontrolled inputs when performance or library integration requires it.
- Mixing both is acceptable when using form libraries.

### Headless Components

Prefer headless logic + custom UI for reusable, design-system-aligned interactions.

### State Machines / Explicit State Enums

Prefer explicit status values (or reducers/state machines) for complex async flows:

```ts
status: 'idle' | 'loading' | 'success' | 'error';
```

Avoid impossible combinations of multiple booleans.

### Inversion of Control

Pass behavior/rendering into reusable components when flexibility is needed:

- callbacks (`onClose`, `onSelect`)
- render functions (`renderItem`)

## Next.js App Router Standards

### Server vs Client Components

- Default to Server Components unless client interactivity is required.
- Add `'use client'` only when needed (hooks, browser APIs, event handlers, local state).
- Keep client components small and focused.

### Hydration Safety (Mandatory)

Do not render unstable values during SSR/client hydration without safeguards.

Avoid in initial render:

- `Date.now()`
- `Math.random()`
- direct `window`, `document`, `localStorage`, `navigator` usage
- pathname-dependent styling that differs before/after mount

If browser-only behavior is required:

- defer to `useEffect`
- use mount flags for client-only rendering differences
- keep server and first client render markup stable

### Loading / Empty / Error States

For data-driven UI, provide:

- loading state
- empty state
- error state

Make these responsive and consistent with the feature UI.

## Performance and Lighthouse Standards (Default)

Follow `DOCUMENTATION/LIGHTHOUSE_PATTERN.md` as the performance implementation and review standard for frontend work.
Apply `DOCUMENTATION/NEXTJS_PERFORMANCE_AND_SEO_PATTERNS_DOCS.md` as the default Next.js performance + SEO baseline for App Router work.
For creating or updating UI, follow `DESIGN_PATTERNS_DOCS.md` as the default design-system and visual implementation standard.

### Core Web Vitals Thresholds

| Metric    | Good    | Needs Improvement | Poor    |
| --------- | ------- | ----------------- | ------- |
| LCP       | ≤ 2.5s  | ≤ 4.0s            | > 4.0s  |
| INP       | ≤ 200ms | ≤ 500ms           | > 500ms |
| CLS       | ≤ 0.1   | ≤ 0.25            | > 0.25  |
| TBT (lab) | ≤ 200ms | ≤ 600ms           | > 600ms |

### Core Web Vitals Priority Order

Prioritize changes that improve:

- `LCP` (fast main content render)
- `INP` / `TBT` (responsive interaction / low main-thread blocking)
- `CLS` (stable layout with no jumping)

Prefer fixing the largest user-visible bottleneck first instead of making many low-impact tweaks.

### LCP (Largest Contentful Paint)

- Identify the LCP element first (Lighthouse → "Largest Contentful Paint element", or Chrome DevTools Performance panel)
- Optimize the likely LCP element first (usually hero image/hero section/main heading block)
- Use correctly sized images and modern formats when possible
- Do not lazy-load above-the-fold hero content
- Preload only critical hero assets/fonts
- Reduce render-blocking CSS/scripts before first paint
- In Next.js, use `next/image` and mark the hero image as high priority when it is the LCP candidate
- For `next/image` with `fill`, always provide a `sizes` prop that matches the real rendered width (fixed thumbnails use fixed sizes like `40px`/`64px`; responsive heroes use breakpoint-based `sizes`)

### INP / TBT (Responsiveness)

- Reduce client-side JavaScript before adding micro-optimizations
- Code-split by route and lazy-load heavy components (charts, editors, large modals, maps)
- Keep `use client` surfaces small in App Router
- Avoid long synchronous tasks in render/event handlers
- Prefer server-rendered output when interactivity is not needed immediately
- Do not mount heavy hidden UI (forms/modals/editors) by default; lazy-load and conditionally mount them when opened
- Avoid continuous polling in always-visible UI; prefer event-driven sync (`visibilitychange`, `storage`, subscriptions) and adaptive intervals when polling is necessary

### Code Splitting and Lazy Loading Strategy

Follow `DOCUMENTATION/CODE_SPLITTING_DOCS.md` as the code-splitting implementation standard when reducing client-side JavaScript.

Use code splitting when:

- a component/feature is not needed for first paint
- a feature is optional, conditional, below-the-fold, or rarely used
- a dependency is large (charts: ~200kb, maps: ~150kb, editors: ~500kb+)
- a feature is role-based (for example admin-only UI)

Prefer these split types:

- route-level splitting first (Next.js route segments/pages)
- component-level splitting for heavy optional UI (charts, maps, rich editors, large widgets)
- user-triggered/on-demand splitting for modals, drawers, wizards, advanced filters, and checkout-only flows
- library-level dynamic imports for heavy dependencies (`monaco-editor`, `chart.js`, `three.js`, map/PDF libs)

Implementation guidance:

- in Next.js, prefer `dynamic()` for client-only or heavy components with clear loading states
- use `React.lazy` + `Suspense` in non-Next or shared React surfaces where appropriate
- provide stable loading fallbacks and reserve space when needed to avoid CLS
- lazy-load hidden UI only when opened instead of mounting it offscreen by default

Avoid splitting:

- header/navigation
- hero section / likely LCP content
- primary CTA
- tiny components
- frequently reused shared UI

Avoid over-splitting because it can cause:

- too many network requests
- flashing/loading-state churn
- worse UX despite smaller bundles

Prioritization model:

- Layer 1: immediately visible UI -> keep in main bundle
- Layer 2: likely interaction UI -> lazy load
- Layer 3: rare/advanced features -> on-demand load

Measurement requirements:

- measure before/after with Lighthouse, DevTools Network, and bundle analyzers
- prefer code splitting when bundle size/client JS is meaningfully large (for example `> 200-300kb` JS) or heavy libraries dominate the cost
- state which metric is expected to improve (`LCP`, `INP`/`TBT`) and why
  - code splitting usually helps `INP`/`TBT` first by reducing initial JS parse/execute cost
  - it can help `LCP` when deferred JS was blocking critical rendering
  - it can hurt `CLS` if loading fallbacks/layout reservation are not handled correctly

### CLS (Layout Stability)

- Always define dimensions or `aspect-ratio` for media (images/videos/embeds)
- Reserve space for UI that appears after load (banners, alerts, notices)
- Use font loading strategies that reduce reflow (for example `font-display: swap`)
- Do not inject content above existing content without reserved space

### Network and Script Loading

- Use cache-friendly static asset delivery (CDN + immutable caching where applicable)
- Prefetch selectively (likely next routes only)
- Treat external scripts/SDKs as optional at runtime and guard initialization
- Load analytics/tag scripts with non-blocking strategies (`afterInteractive` or `lazyOnload`) unless there is a strict requirement for earlier execution
- Avoid turning many tiny assets into unnecessary network requests
- Avoid duplicate analytics/tag bootstraps (for example, initializing both a tag manager and direct analytics runtime globally unless there is a verified requirement)
- Keep route-specific tracking dependencies local to the route/component when possible instead of loading extra global scripts for a narrow use case

### App Router Performance Defaults

- Default to server components for route shells and layouts; isolate browser-only logic into small client bridge/components
- Do not mark an entire route/page as `'use client'` just because one section needs client hooks; move the interactive portion into a colocated client child
- Use `dynamic(..., { ssr: false })` only for truly browser-only widgets after attempting a hydration-stable render
- For client-only pages that still need metadata, add segment `layout.tsx` metadata exports instead of skipping route metadata entirely
- For param-driven sibling routes in the same segment, keep shared chrome (`Sticky`, `Highlight`, `Navbar`, `Footer`, persistent wrappers) in the parent segment `layout.tsx` so it stays mounted during in-segment navigation
- Keep page-level components focused on the changing content only; avoid remounting full shells on param-only route changes
- Keep likely LCP content (hero, main heading, primary CTA) in the initial render; do not lazy-load above-the-fold core content
- Avoid server fetch waterfalls for independent data sources; fetch in parallel with `Promise.all`
- Prefer streaming sections with `Suspense` fallbacks for slower server-rendered regions

### Metadata and Font Loading Standards

- Add App Router `metadata` / `generateMetadata` for core user-facing routes
- Prefer `next/font` for app typography and apply it at the root layout unless the project already uses another optimized strategy
- Use a root title template (`default` + `template`) so route titles stay consistent
- Use dynamic metadata per slug/entity routes and include Open Graph data where sharing is relevant
- Keep canonical URLs aligned with the real route path structure (no stale/legacy paths)
- Use `robots` metadata rules for non-indexable routes (admin/internal search/account-only pages)

### SEO and Crawlability Standards

- Add structured data (JSON-LD) for relevant page types
- Keep `sitemap.xml` and `robots.txt` current for public routes and crawl directives
- Preserve semantic HTML and heading hierarchy (`main`, `article`, `nav`, single meaningful `h1`)
- Ensure key pages are internally linked and not orphaned from navigation/sitemap
- Keep primary SEO content server-rendered; do not require client-side JS for core page text

### Lighthouse-Related Quality Gates

For page-level UI changes, Copilot should preserve or improve:

- Accessibility basics (labels, semantics, focus states, contrast)
- Best Practices (no console/runtime warnings from the change)
- SEO basics (page title/metadata/heading structure where relevant)

When making performance-focused changes, explicitly state which metric is expected to improve (`LCP`, `INP`/`TBT`, `CLS`) and why.

## Analytics Standards (GA4 + GTM)

Follow `DOCUMENTATION/GA4_GTM_DOCS.md` for the full analytics implementation guide, utility function reference, and recommended events tables.

### Analytics policy

- Use Google Tag Manager (GTM) as the primary tag management layer; use GA4 as the analytics destination.
- Load GTM via `next/script` with `afterInteractive` strategy — never `beforeInteractive` for analytics.
- Do not initialize both GTM and standalone GA4 (`gtag.js`) globally unless there is a verified requirement.
- Track SPA route changes via `usePathname` + `useEffect` sending `page_view` events to the GTM data layer.
- Use a centralized analytics utility module for all event tracking (do not scatter inline `window.dataLayer.push` calls).
- Include environment guards (`typeof window !== 'undefined'`, `window.dataLayer` existence check) in all analytics utility functions.
- Use GA4 recommended event names where applicable (`add_to_cart`, `purchase`, `sign_up`, `login`, etc.).
- Respect user consent before firing tracking events when privacy/consent integration is required.

## Caching Standards (TanStack Query + Apollo Client)

Follow `DOCUMENTATION/CACHING.md` as the caching implementation and review standard for frontend/server-state data flows.

### Tool Selection

- Use TanStack Query for REST/non-GraphQL server state.
- Use Apollo Client for GraphQL server state.
- Do not mix caching clients for the same data source in one feature.

### Query Key and Cache Identity Rules

- Centralize TanStack Query keys with key-factory modules (for example `featureKeys.ts`) using the key factory pattern and use stable, serializable keys.
- Use prefix matching for invalidation (invalidating `['notes']` matches `['notes', 'list']`, `['notes', 'detail', id]`, etc.).
- Do not use ad-hoc inline query keys that can change by reference between renders.
- For Apollo, ensure GraphQL selections include `id` and rely on `__typename` for normalization.
- Define Apollo `keyFields` when an entity key is not `id`.
- Define Apollo `keyFields: []` for singleton types (e.g., `DashboardStats`).

### Freshness, Invalidation, and Mutation Strategy

- Configure `staleTime` and `gcTime` intentionally based on data volatility.
- Avoid `staleTime: Infinity` unless explicit invalidation exists for every relevant mutation path.
- After mutations, invalidate only affected scopes; avoid global invalidation by default.
- Use direct cache writes only when the updated value is complete and deterministic.
- Default to the hybrid update pattern for entity updates: direct detail-cache update + list invalidation.
- Prefer invalidation/refetch when server-computed fields, list membership/order changes, or partial mutation payloads are involved.

#### Stale time guidelines

| Data Type             | Suggested `staleTime` | Reasoning                       |
| --------------------- | --------------------- | ------------------------------- |
| User profile          | 5–10 min              | Rarely changes within a session |
| Entity lists          | 30–60s                | Changes on user action          |
| Entity detail         | 60s–2 min             | Low conflict risk               |
| Search results        | 0 (or 30s)            | Changes often                   |
| Dashboard stats       | 0 + polling           | Must reflect latest             |
| Static reference data | 10–30 min             | Rarely changes                  |

#### Invalidation scope guide

| Mutation              | Invalidate                           |
| --------------------- | ------------------------------------ |
| Create entity         | All lists for that entity type       |
| Update entity         | That entity's detail + all lists     |
| Delete entity         | Remove detail + invalidate all lists |
| Bulk operation        | All queries for that entity type     |
| Cross-entity mutation | All affected entity types            |

### Optimistic Updates and Safety

- Use optimistic updates for deterministic, low-risk interactions (for example toggles and simple inline edits).
- Always provide rollback handling for optimistic updates (snapshot → optimistic write → rollback on error → refetch on settle).
- Avoid optimistic updates for complex server transformations, validation-heavy writes, or uploads.
- For Apollo optimistic responses, include `__typename` and all UI-read fields.

### SSR, Hydration, and State Boundaries

- In Next.js App Router, prefetch on the server and hydrate client caches (`HydrationBoundary` / Apollo App Router integration).
- Keep server state in query caches, client UI state in component/reducer state, and auth/session state in auth providers.
- For cached query UIs, always provide loading, empty, and error states.

### Apollo Fetch Policy Guide

| Scenario                    | Recommended Policy                              |
| --------------------------- | ----------------------------------------------- |
| Static reference data       | `cache-first`                                   |
| Entity detail               | `cache-first`                                   |
| List after navigation back  | `cache-and-network`                             |
| Dashboard with live stats   | `network-only` or `cache-and-network` + polling |
| Search results              | `network-only`                                  |
| Data after a known mutation | `refetch()`                                     |

## Responsive Design Standards (Default)

Follow `DOCUMENTATION/RESPONSIVE_DESIGN_PATTERNS.md` as the responsive implementation and review standard for frontend work.
Follow `DOCUMENTATION/RESPONSIVENESS_DOCS.md` for project-specific component responsiveness rules and breakpoint definitions.

### Breakpoints

| Token | Width  | Target                            |
| ----- | ------ | --------------------------------- |
| `sm`  | 640px  | Large phones (landscape)          |
| `md`  | 768px  | Tablets                           |
| `lg`  | 1024px | Small laptops / landscape tablets |
| `xl`  | 1280px | Desktops                          |
| `2xl` | 1536px | Large desktops                    |

### Layout and Containers

- Do not use fixed container widths for page wrappers (avoid patterns like `width: 1200px`)
- Prefer `max-width` + `width: 100%` + responsive padding
- Scale padding/margins down on mobile
- Avoid excessive whitespace that creates unnecessary mobile scrolling
- Stack desktop side-by-side sections vertically on mobile in the correct reading order

### Grid and Flex Behavior

- Collapse desktop grids (`3-4` columns) to `1-2` columns on mobile based on content density
- Watch for card shrinkage, overflow, and uneven heights in responsive grids
- Convert horizontal flex layouts to `flex-col` or wrapping layouts on mobile
- Avoid `flex-wrap: nowrap` when it causes squeezed content
- Ensure chips/tags/button groups wrap instead of overflowing
- Intentionally reorder content on mobile when needed (for example image before text)

### Typography and Text

- Scale headings down for smaller screens (avoid oversized H1s that push content below the fold)
- Keep body text readable on mobile (typically `14-16px` minimum)
- Prevent long unbroken lines from breaking mobile layouts
- Use readable line-height on mobile
- Ensure long titles/usernames wrap or truncate cleanly (`ellipsis` where appropriate)

### Images and Media

- Make images responsive (`max-width: 100%; height: auto`)
- Preserve aspect ratio and avoid stretching (`object-fit: cover/contain` as needed)
- Verify hero/banner crops still preserve focal points on mobile
- Make carousels swipe-friendly and keep pagination indicators visible
- Ensure embedded video/iframes are responsive (no fixed-width embeds)

### Buttons and Tap Targets

- Keep buttons/links easy to tap (minimum 44×44px per WCAG, 48×48dp per Material)
- Keep primary CTAs visible without excessive scrolling
- Stack or wrap button groups on mobile when horizontal layouts no longer fit
- Preserve spacing between actions to reduce mis-taps

### Navigation

- Switch navbars to hamburger/drawer patterns when space is constrained
- Prevent logo and navigation controls from colliding
- Ensure dropdowns open within the viewport
- Do not rely on hover-only interactions for mobile navigation
- Sticky headers must not cover content or block form inputs

### Forms

- Use `width: 100%` inputs on mobile
- Convert label/input side-by-side layouts into vertical layouts on mobile
- Use correct mobile-friendly input types (`email`, `number`, `tel`, etc.)
- Ensure validation/error messages wrap without breaking layout
- Collapse multi-column forms to a single column on mobile

### Tables and Dense Content

- Always provide a mobile strategy for tables:
  - horizontal scroll container, or
  - stacked card representation, or
  - hidden lower-priority columns
- Prevent data grids from overflowing the viewport

### Cards and Content Blocks

- Ensure cards shrink cleanly without text or image overflow
- Collapse card grids from desktop multi-column layouts to mobile `1-2` columns
- Do not assume equal content heights; layouts must tolerate longer text

### Overflows and Breakpoints

- Treat horizontal page scrolling as a bug unless intentionally required
- Handle long words/URLs with wrapping (`word-break`, `overflow-wrap`)
- Check absolute-positioned badges/floating UI/decorations for mobile overlap issues

### Modals, Drawers, and Popups

- Fit modal dimensions to the mobile viewport and allow internal scrolling when needed
- Keep close controls visible and easy to tap
- Prevent background scroll while overlays are open when expected (`body` scroll lock)

### Mobile UX and Performance (Responsive Behavior)

- Do not send oversized desktop images to mobile devices when smaller assets are sufficient
- Use lazy loading for below-the-fold images and large content lists where appropriate

### Responsive Review Requirement

For user-facing UI changes, Copilot should verify or preserve:

- no horizontal overflow at common mobile widths
- readable typography and tap targets
- correct stacking/order of core content and actions
- responsive media behavior (images/video/hero crops)
- form/navigation usability on touch devices

## Component Design Rules

### Keep Components Focused

- One component should ideally do one thing well.
- Extract helpers/hooks before a component becomes hard to read.
- Prefer composition over deeply nested conditionals.

### API Design

- Prefer declarative props and composition
- Avoid prop overload and ambiguous booleans
- Use explicit prop names for behavior and state

### Accessibility

Always consider:

- semantic HTML
- keyboard interaction
- focus states
- `aria-*` attributes where needed
- accessible labels for controls and images

## Styling and UI Consistency

- Follow existing project UI patterns before introducing new visual systems.
- Keep responsive behavior explicit (mobile-first).
- Use intentional loading and unauthorized/empty states.
- Avoid visual changes that break existing layout conventions unless requested.

## Data and State Boundaries

Separate clearly:

- server state (API data, cached query results)
- client state (UI toggles, local form inputs)
- session/auth state (provider-managed)

Do not duplicate the same source of truth across multiple layers unless there is a clear synchronization strategy.

## Monorepo Conventions

- `apps/*`: application entrypoints and route composition
- `libs/*`: shared features, providers, UI, hooks, utilities
- Prefer adding shared logic to `libs/*` only when actually reused or intended for reuse
- Keep feature-specific code in the owning module

## Documentation Reference Map

All enhanced documentation lives in `DOCUMENTATION/`. Use the appropriate doc for detailed guidance:

| Doc                                           | Purpose                                                                    |
| --------------------------------------------- | -------------------------------------------------------------------------- |
| `TYPESCRIPT_PATTERNS_DOCS.md`                 | TypeScript patterns, type helpers, comparison tables, decision guides      |
| `REACT_PATTERNS.md`                           | React patterns with priority table, examples, and decision framework       |
| `REACT_HOOKS_USAGE_DOCS.md`                   | `useCallback`/`useMemo` decision trees, profiling, common mistakes         |
| `REDUCER.md`                                  | `useReducer` patterns, TypeScript integration, useState vs useReducer      |
| `REDUCER_CONTEXT.md`                          | useReducer + Context architecture, split contexts, scaling limits          |
| `CACHING.md`                                  | TanStack Query + Apollo Client caching patterns, comparison, SSR hydration |
| `LIGHTHOUSE_PATTERN.md`                       | Core Web Vitals optimization, metric thresholds, PR review checklist       |
| `NEXTJS_PERFORMANCE_AND_SEO_PATTERNS_DOCS.md` | Next.js App Router performance + SEO, metadata, structured data            |
| `CODE_SPLITTING_DOCS.md`                      | Code splitting strategy, layered model, measurement requirements           |
| `RESPONSIVE_DESIGN_PATTERNS.md`               | Responsive design rules with specific values, Tailwind examples            |
| `RESPONSIVENESS_DOCS.md`                      | Project-specific component responsiveness and breakpoints                  |
| `SECURITY.md`                                 | Security checklist with severity ratings, headers, implementation code     |
| `BROWSER_COMPATIBILITY.md`                    | Browser support matrix, CSS/API compatibility, approval checklist          |
| `FOLDER_STRUCTURE.md`                         | Project structure templates, naming conventions, dependency rules          |
| `ESLINT_PRETTIER.md`                          | ESLint + Prettier configuration, type-aware linting, monorepo setup        |
| `AUDIT_FORMAT.md`                             | Audit output format, priority legend with SLAs, root cause analysis        |
| `GA4_GTM_DOCS.md`                             | GA4 + GTM analytics implementation, event tracking, debugging              |

## Implementation Workflow (Copilot Behavior)

When generating code:

1. Match existing file/module patterns first.
2. Prefer the simplest pattern that fits.
3. Use feature colocation.
4. Use hooks/providers/query hooks consistently with current code.
5. Add loading/error/empty states when async data is involved.
6. Avoid hydration-unstable output in App Router.
7. Prefer choices that protect Core Web Vitals (LCP/INP/CLS) for user-facing pages.
8. For performance fixes, document the targeted Core Web Vital(s) and the mechanism (image sizing, reduced JS, layout stability, etc.).
9. For security-sensitive changes, verify against `DOCUMENTATION/SECURITY.md` severity levels.
10. For responsive UI, verify against the responsive review requirement checklist.

## Avoid (Common Anti-Patterns)

- Over-abstracting early
- Repeating fetch logic across components
- Global utility dumping for feature-specific code
- HOCs for local logic that should be a hook
- Browser-only APIs during SSR render
- UI that renders differently on server and initial client render
- Lazy-loading critical above-the-fold content
- Full page reloads after local mutations when state updates/refetch will do
- Fixing hydration warnings by disabling SSR instead of stabilizing render logic
- Using `as` to silence type errors instead of validating data
- Using `!` (non-null assertion) to suppress null checks
- Using `staleTime: Infinity` without corresponding invalidation on every mutation path
- Over-invalidating cache (invalidating everything on every mutation)
- Scattering inline `window.dataLayer.push` calls instead of using centralized analytics utilities

## Quick Pattern Selection Guide

- Reusable logic inside components -> custom hook
- App-wide dependency/service -> provider
- Page wrapper/auth/layout concern -> HOC
- Flexible subcomponent API -> compound component
- Complex state transitions -> reducer/state machine
- Shared structured state (3+ consumers) -> useReducer + Context
- High-frequency shared state (10+ consumers) -> Zustand or external store
- Reusable logic with custom UI -> headless component pattern

## Final Principle

Patterns are tools, not goals. Choose the pattern that improves clarity, maintains consistency with this repo, and reduces future maintenance cost.
