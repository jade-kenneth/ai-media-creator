---
name: web-app
description: "Web app implementation standards for apps/*-admin (Next.js App Router + React + TypeScript + TanStack Query + Tailwind + shadcn/ui). USE when writing, reviewing, or refactoring any code in apps/*-admin. TRIGGERS: creating components, hooks, providers, features, data fetching, forms, routing, SSR/SSG, performance work, SEO, accessibility, analytics, caching, state management, folder structure decisions. EXAMPLES: 'add a feature', 'build a page', 'create a hook', 'audit this component', 'where should this go?', 'set up a query', 'add a mutation', 'fix a hydration error', 'improve LCP', 'add SEO metadata'."
---

# Web App Skill

This skill enforces the implementation standard for the `apps/*-admin` Next.js application. Read it fully before writing or reviewing any code in this app.

The full standard lives in `apps/*-admin/CLAUDE.md`. The reference docs in `.claude/skills/web-app/references/` extend it with deep implementation guides. **This file is the hub**: the non-negotiables, pattern selection guide, and implementation workflow below are the canonical versions — reference docs that summarize them defer to this file, and each reference doc ends with a *Related References* section linking the docs it depends on.

> **Portability — `apps/*-admin`.** This skill targets the workspace under `apps/` whose folder name ends in `-admin` (or `-web` in some repos — the reliable cross-repo convention, alongside `*-mobile` and `*-api`). Paths below are written as `apps/*-admin/…`; substitute the actual folder name for the repo you are in. Do not hardcode a project-specific app name back into this skill — keep it suffix-based so it stays reusable.

---

## How to use this skill

1. **Read `apps/*-admin/CLAUDE.md`** — the primary standard. Every rule in this skill is derived from it.
2. **Consult the relevant reference doc(s)** from the map below based on what you are doing. When a task spans concerns (e.g. a mutation that needs cache updates, a toast, and an error state), follow the *Related References* links at the end of each doc rather than guessing.
3. **Match existing project patterns first** before introducing anything new.
4. For any UI work, invoke **`web-ui-design`** — apply web execution rules (semantic HTML, responsive layout, dark mode, accessibility, motion, performance).
5. **Before finishing, re-check the Non-negotiables** below — they apply to every change, not only the ones your reference doc mentions.

---

## Quick reference map

Use the doc that matches your task. Docs are grouped by concern; where a group has a decision entry point, start there and follow its links into the deep dives.

### Foundations

| Task                                            | Reference                            |
| ----------------------------------------------- | ------------------------------------ |
| Onboarding / starting point                     | `apps/*-admin/CLAUDE.md`   |
| Core principles, instruction priority, workflow | `references/core-principles.md`      |
| Folder structure, colocation, naming            | `references/folder-structure.md`     |
| Common anti-patterns and what to do instead     | `references/common-anti-patterns.md` |
| Project discussion, Q&A, response format        | `references/project-discussion.md`   |

### Language & React

| Task                                             | Reference                            |
| ------------------------------------------------ | ------------------------------------ |
| TypeScript patterns, helpers, guards, generics   | `references/typescript-patterns.md`  |
| React architecture, colocation, composition      | `references/react-patterns.md`       |
| `useCallback` / `useMemo` decisions, profiling   | `references/react-hooks.md`          |
| Error boundaries (route error.tsx, inline state) | `references/error-boundaries.md`     |
| Pure TypeScript tests with Node's test runner    | `references/testing.md`              |

### State

Entry point: `state-management.md` decides **which** state tool fits; the others are per-tool deep dives.

| Task                                           | Reference                          |
| ---------------------------------------------- | ---------------------------------- |
| State management decision guide                | `references/state-management.md`   |
| `useReducer` for complex local state           | `references/reducer.md`            |
| `useReducer` + Context, split context, scaling | `references/reducer-context.md`    |
| Zustand global store, slices, selectors        | `references/zustand-patterns.md`   |

### Server state & data

Entry point: `graphql-patterns.md` defines how operations are written; `caching.md` defines how their cache behaves.

| Task                                             | Reference                                     |
| ------------------------------------------------ | --------------------------------------------- |
| GraphQL client, defineQuery/defineMutation, keys | `references/graphql-patterns.md`              |
| TanStack Query / SWR / Apollo caching, mutations | `references/caching.md`                       |
| Optimistic UI, rollback                          | `references/caching.md` § Optimistic UI Rules |
| Auth session, AuthGuard, store, useSession       | `references/auth-patterns.md`                 |

### Next.js, performance & SEO

| Task                                           | Reference                                   |
| ---------------------------------------------- | ------------------------------------------- |
| Next.js SSR/hydration, rendering strategy      | `references/nextjs-performance-seo.md`      |
| SEO, metadata, sitemap, JSON-LD                | `references/nextjs-performance-seo.md`      |
| Social sharing previews (Open Graph / Twitter) | `references/nextjs-performance-seo.md` § 2a |
| Lighthouse, Core Web Vitals checklist          | `references/core-web-vitals.md`             |
| Code splitting, lazy-loading decisions         | `references/code-splitting.md`              |

### UI, styling & UX

| Task                                             | Reference                             |
| ------------------------------------------------ | ------------------------------------- |
| Responsive layout, theme, styling, design system | `references/responsive-design.md`     |
| Accessibility                                    | `references/accessibility.md`         |
| Forms with react-hook-form + zod                 | `references/forms.md`                 |
| Browser API support, cross-browser watchouts     | `references/browser-compatibility.md` |

### Feature recipes

| Task                                            | Reference                            |
| ----------------------------------------------- | ------------------------------------ |
| Toast / notifications (Sonner)                  | `references/notifications-toast.md`  |
| Date formatting, date-fns, timezone             | `references/date-handling.md`        |
| Rich text editor (Tiptap / RichTextField)       | `references/tiptap-richtext.md`      |
| File/image upload fields with presigned URLs    | `references/upload-fields.md`        |
| Drag and drop (dnd-kit, sortable lists)         | `references/dnd-patterns.md`         |
| Charts (Recharts, ChartContainer, ChartConfig)  | `references/charts-recharts.md`      |

### Quality, security & tooling

| Task                                        | Reference                              |
| ------------------------------------------- | -------------------------------------- |
| Security checklist, sensitive change review | `references/security.md`               |
| ESLint, Prettier, formatting baseline       | `references/eslint-prettier.md`        |
| GTM / GA4, analytics, event naming          | `references/analytics-ga4-gtm.md`      |
| Dependency versioning, upgrade workflow     | `references/dependency-management.md`  |
| Audit output format, severity model         | invoke `audit` skill                   |

---

## Non-negotiables (apply every time)

These override any default behavior. Grouped by concern — every group applies to any change that touches it.

### Data & mutations

- **Server state** → use TanStack Query, SWR, or Apollo. No raw `fetch`/`useEffect` for server state.
- **Cache invalidation** → invalidate only affected scopes; never the whole cache by default. See `references/caching.md` § Invalidation Guide.
- **Mutation actions** → every control that triggers a mutation (button, menu item, submit, row action) must be disabled on `mutation.isPending` **and** the handler guarded with `if (mutation.isPending) return;`. Never leave a mutation action clickable while it is in flight — it double-fires. See `references/react-patterns.md` § Mutation Safety.
- **Search inputs** → always debounce with `useDebounce` (300ms) before triggering API calls. See `references/caching.md`.
- **Forms** → `useForm` + `zod` + `useFieldArray` for array fields. See `references/forms.md`.

### Rendering, SSR & performance

- **SSR** → no hydration-unstable values (`Date.now()`, `Math.random()`, `window`, `document`, `localStorage`) in render; defer to `useEffect`. See `references/nextjs-performance-seo.md`.
- **Route layouts** → keep App Router `layout.tsx` files as Server Components by default. Do not add `'use client'` just to apply auth, role gates, shell interactivity, or providers; move that logic into the smallest child client wrapper. See `references/auth-patterns.md` § AuthGuard Wrapper.
- **Heavy client imports** → do not statically import browser-heavy libraries (`@tiptap/*`, `recharts`, `@react-pdf/renderer`, PDF/export tools, editors, charts, maps, data grids) from route shells, shared field wrappers, dialogs, or common UI surfaces. Put the heavy imports in a colocated child component or feature subtree and load it with `next/dynamic` using a dimension-matched skeleton. See `references/code-splitting.md`.
- **Effect cleanup** → any hook/component that creates timers, intervals, animation frames, object URLs, observers, subscriptions, event listeners, or abortable async work must store the handle and clean it up on unmount or dependency change. See `references/react-hooks.md` § Effect Cleanup for Browser Resources.

### SEO & crawlability

- **Social sharing metadata** → when a page is publicly shareable or indexable (landing, marketing, legal, public content), it must set `metadataBase` (root layout, once) + `openGraph` + `twitter` with a 1200×630 image and audience-appropriate `description`. Scope `robots: noindex` to the private **segment** layouts (`/admin`, `/login`, super-admin) — never the root layout, which would silently de-index public pages and suppress link previews. Don't reuse a heavy logo as the favicon/OG image; use small file-based `app/icon.png` / `app/apple-icon.png`. See `references/nextjs-performance-seo.md` § 2a. Social Sharing.
- **Sitemap + robots** → keep `app/sitemap.ts` and `app/robots.ts` as the source of truth for crawlability. `sitemap.ts` lists **only public, indexable routes** — never authenticated areas, thin utility pages, or routes removed from the public surface. `robots.ts` allows `/`, disallows the private/authenticated segments, and points `sitemap` at the absolute `/sitemap.xml`. Both derive the base URL from the same env value used for `metadataBase` — don't hardcode the domain in more than one place. `robots.txt` disallow is crawl-budget hygiene, **not** de-indexing — keep `robots: noindex` on the private segment layouts as the real protection. When you add or remove a public page, update `sitemap.ts` in the same change. See `references/nextjs-performance-seo.md` § 5b. Sitemap & Robots.

### UI & UX

- **UI work** → invoke `web-ui-design` for palette, typography, UX patterns, and web execution rules.
- **Responsive** → treat responsive regressions as bugs. See `references/responsive-design.md`.
- **Theme** → if a requirement includes light + dark mode, implement both from the start. See `references/responsive-design.md` § Theme Support Rules.
- **State communication** → prefer one clear state treatment over multiple redundant ones. Do not stack icon, badge, color, helper text, and label treatments that all say the same thing. See `references/common-anti-patterns.md` § Redundant State Indicators.
- **Inline flows** → prefer modals/drawers for create/edit over navigating to a separate CRUD page.
- **Tailwind** → use canonical utility classes; no arbitrary `[]` values when a canonical equivalent exists. See `references/common-anti-patterns.md` § Tailwind — No Arbitrary Values.

### Code quality & placement

- **Folder placement** → follow `references/folder-structure.md`; keep route files thin, push logic into `features/`.
- **TypeScript** → no `as` casts at non-boundary sites, no `!` non-null assertions to silence errors. See `references/typescript-patterns.md`.
- **Analytics** → use the centralized analytics utility; never scatter raw `window.dataLayer.push` calls. See `references/analytics-ga4-gtm.md`.

---

## Pattern selection guide

This is the canonical version of this table; `references/core-principles.md` defers to it.

| Situation                                 | Pattern                         | Deep dive                                            |
| ----------------------------------------- | ------------------------------- | ---------------------------------------------------- |
| Reusable component logic                  | custom hook                     | `references/react-patterns.md` § Custom Hooks        |
| App-wide service or dependency            | provider                        | `references/react-patterns.md` § Provider Pattern    |
| Route layout auth gate or role gate       | client wrapper with `children`  | `references/auth-patterns.md`                        |
| Non-route component wrapper               | HOC                             | `references/react-patterns.md` § HOC                 |
| Flexible shared UI API                    | compound component              | `references/react-patterns.md` § Compound Component  |
| Complex local state transitions           | `useReducer`                    | `references/reducer.md`                              |
| Shared structured state across components | `useReducer` + Context          | `references/reducer-context.md`                      |
| High-frequency shared global state        | Zustand or external store       | `references/zustand-patterns.md`                     |
| Server state fetching and mutations       | TanStack Query / SWR / Apollo   | `references/caching.md`, `references/graphql-patterns.md` |
| Simple create/edit in an existing flow    | modal, drawer, or inline editor | invoke `web-ui-design`                               |
| Static SEO-critical page                  | SSG                             | `references/nextjs-performance-seo.md` § Rendering Strategy |
| Periodically refreshed SEO-critical page  | ISR                             | `references/nextjs-performance-seo.md` § Rendering Strategy |
| Per-request SEO-critical page             | SSR                             | `references/nextjs-performance-seo.md` § Rendering Strategy |
| Interactive-only, no SEO needed           | CSR                             | `references/nextjs-performance-seo.md` § Rendering Strategy |

---

## Implementation workflow

When generating or modifying code, always follow this order. This is the canonical version of the workflow; `references/core-principles.md` defers to it.

**Understand & place**

1. Match existing project patterns first.
2. Choose the simplest implementation that fits.
3. Follow `references/folder-structure.md` for placement.
4. Colocate code by feature unless clearly shared.
5. Keep route entry files thin.

**Architect**

6. Preserve Server Component route boundaries; put browser hooks in leaf client components or child wrappers.
7. Use hooks, providers, and server-state tools consistently — pick via the pattern selection guide above.
8. Before adding or moving heavy client libraries, consult `references/code-splitting.md`; keep chart/editor/PDF imports inside lazy-loaded feature children unless they are required for first paint.

**Build UI**

9. Invoke `web-ui-design` for palette, typography, product patterns, UX guidelines, anti-patterns, and web execution rules (semantic HTML, responsive layout, dark mode, accessibility, motion, performance). Adapt or reject any output that conflicts with app rules.
10. Check project registries first, then MCP-discovered components, before building custom components.
11. Add loading, empty, and error states for async flows. See `references/error-boundaries.md`.
12. Avoid hydration-unstable rendering. See `references/nextjs-performance-seo.md`.

**Verify**

13. Protect Core Web Vitals — LCP first, then INP/TBT, then CLS. See `references/core-web-vitals.md`.
14. Prefer inline modals or drawers for create/edit flows.
15. For performance changes, name the metric and explain why.
16. For security-sensitive work, verify against `references/security.md`.
17. For user-facing UI, verify responsiveness and accessibility. See `references/responsive-design.md` and `references/accessibility.md`.
18. For server mutations, prefer targeted cache updates over page reloads. See `references/caching.md`.
