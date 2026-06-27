---
name: web-app
description: "Web app implementation standards for apps/brgy-system-admin (Next.js App Router + React + TypeScript + TanStack Query + Tailwind + shadcn/ui). USE when writing, reviewing, or refactoring any code in apps/brgy-system-admin. TRIGGERS: creating components, hooks, providers, features, data fetching, forms, routing, SSR/SSG, performance work, SEO, accessibility, analytics, caching, state management, folder structure decisions. EXAMPLES: 'add a feature', 'build a page', 'create a hook', 'audit this component', 'where should this go?', 'set up a query', 'add a mutation', 'fix a hydration error', 'improve LCP', 'add SEO metadata'."
---

# Web App Skill

This skill enforces the implementation standard for the `apps/brgy-system-admin` Next.js application. Read it fully before writing or reviewing any code in this app.

The full standard lives in `apps/brgy-system-admin/CLAUDE.md`. The reference docs in `.claude/skills/web-app/references/` extend it with deep implementation guides.

---

## How to use this skill

1. **Read `apps/brgy-system-admin/CLAUDE.md`** — the primary standard. Every rule in this skill is derived from it.
2. **Consult the relevant reference doc(s)** from the map below based on what you are doing.
3. **Match existing project patterns first** before introducing anything new.
4. For any UI work, invoke **`web-ui-design`** — apply web execution rules (semantic HTML, responsive layout, dark mode, accessibility, motion, performance).

---

## Quick reference map

Use the doc that matches your task:

| Task                                             | Reference                                     |
| ------------------------------------------------ | --------------------------------------------- |
| Onboarding / starting point                      | `apps/brgy-system-admin/CLAUDE.md`            |
| Core principles, instruction priority, workflow  | `references/core-principles.md`               |
| TypeScript patterns, helpers, guards, generics   | `references/typescript-patterns.md`           |
| React architecture, colocation, composition      | `references/react-patterns.md`                |
| `useCallback` / `useMemo` decisions, profiling   | `references/react-hooks.md`                   |
| `useReducer` for complex local state             | `references/reducer.md`                       |
| `useReducer` + Context, split context, scaling   | `references/reducer-context.md`               |
| State management decision guide                  | `references/state-management.md`              |
| TanStack Query / SWR / Apollo caching, mutations | `references/caching.md`                       |
| Optimistic UI, rollback                          | `references/caching.md` § Optimistic UI Rules |
| Lighthouse, Core Web Vitals checklist            | `references/core-web-vitals.md`               |
| Next.js SSR/hydration, rendering strategy        | `references/nextjs-performance-seo.md`        |
| SEO, metadata, sitemap, JSON-LD                  | `references/nextjs-performance-seo.md`        |
| Code splitting, lazy-loading decisions           | `references/code-splitting.md`                |
| Responsive layout, theme, styling, design system | `references/responsive-design.md`             |
| Accessibility                                    | `references/accessibility.md`                 |
| Security checklist, sensitive change review      | `references/security.md`                      |
| Browser API support, cross-browser watchouts     | `references/browser-compatibility.md`         |
| Folder structure, colocation, naming             | `references/folder-structure.md`              |
| ESLint, Prettier, formatting baseline            | `references/eslint-prettier.md`               |
| GTM / GA4, analytics, event naming               | `references/analytics-ga4-gtm.md`             |
| Common anti-patterns and what to do instead      | `references/common-anti-patterns.md`          |
| Dependency versioning, upgrade workflow          | `references/dependency-management.md`         |
| Project discussion, Q&A, response format         | `references/project-discussion.md`            |
| GraphQL client, defineQuery/defineMutation, keys | `references/graphql-patterns.md`              |
| Auth session, withAuthGuard, store, useSession   | `references/auth-patterns.md`                 |
| Toast / notifications (Sonner)                   | `references/notifications-toast.md`           |
| Date formatting, date-fns, timezone              | `references/date-handling.md`                 |
| Zustand global store, slices, selectors          | `references/zustand-patterns.md`              |
| Rich text editor (Tiptap / RichTextField)        | `references/tiptap-richtext.md`               |
| Drag and drop (dnd-kit, sortable lists)          | `references/dnd-patterns.md`                  |
| Charts (Recharts, ChartContainer, ChartConfig)   | `references/charts-recharts.md`               |
| Error boundaries (route error.tsx, inline state) | `references/error-boundaries.md`              |
| Audit output format, severity model              | invoke `audit` skill                          |

---

## Non-negotiables (apply every time)

These override any default behavior:

- **UI work** → invoke `web-ui-design` for palette, typography, UX patterns, and web execution rules.
- **Folder placement** → follow `references/folder-structure.md`; keep route files thin, push logic into `features/`.
- **Server state** → use TanStack Query, SWR, or Apollo. No raw `fetch`/`useEffect` for server state.
- **Cache invalidation** → invalidate only affected scopes; never the whole cache by default.
- **Forms** → `useForm` + `zod` + `useFieldArray` for array fields.
- **Tailwind** → use canonical utility classes; no arbitrary `[]` values when a canonical equivalent exists.
- **TypeScript** → no `as` casts at non-boundary sites, no `!` non-null assertions to silence errors.
- **SSR** → no hydration-unstable values (`Date.now()`, `Math.random()`, `window`, `document`, `localStorage`) in render; defer to `useEffect`.
- **Responsive** → treat responsive regressions as bugs.
- **State communication** → prefer one clear state treatment over multiple redundant ones. Do not stack icon, badge, color, helper text, and label treatments that all say the same thing.
- **Search inputs** → always debounce with `useDebounce` (300ms) before triggering API calls.
- **Inline flows** → prefer modals/drawers for create/edit over navigating to a separate CRUD page.
- **Theme** → if a requirement includes light + dark mode, implement both from the start.
- **Analytics** → use the centralized analytics utility; never scatter raw `window.dataLayer.push` calls.

---

## Pattern selection guide

| Situation                                 | Pattern                         |
| ----------------------------------------- | ------------------------------- |
| Reusable component logic                  | custom hook                     |
| App-wide service or dependency            | provider                        |
| Page wrapper, auth gate, layout concern   | HOC                             |
| Flexible shared UI API                    | compound component              |
| Complex local state transitions           | `useReducer`                    |
| Shared structured state across components | `useReducer` + Context          |
| High-frequency shared global state        | Zustand or external store       |
| Server state fetching and mutations       | TanStack Query / SWR / Apollo   |
| Simple create/edit in an existing flow    | modal, drawer, or inline editor |
| Static SEO-critical page                  | SSG                             |
| Periodically refreshed SEO-critical page  | ISR                             |
| Per-request SEO-critical page             | SSR                             |
| Interactive-only, no SEO needed           | CSR                             |

---

## Implementation workflow

When generating or modifying code, always follow this order:

1. Match existing project patterns first.
2. Choose the simplest implementation that fits.
3. Follow `references/folder-structure.md` for placement.
4. Colocate code by feature unless clearly shared.
5. Keep route entry files thin.
6. Use hooks, providers, and server-state tools consistently.
7. Invoke `web-ui-design` for palette, typography, product patterns, UX guidelines, anti-patterns, and web execution rules (semantic HTML, responsive layout, dark mode, accessibility, motion, performance). Adapt or reject any output that conflicts with app rules.
9. Check project registries and MCP before building custom components.
10. Add loading, empty, and error states for async flows.
11. Avoid hydration-unstable rendering.
12. Protect Core Web Vitals — LCP first, then INP/TBT, then CLS.
13. Prefer inline modals or drawers for create/edit flows.
14. For performance changes, name the metric and explain why.
15. For security-sensitive work, verify against `references/security.md`.
16. For user-facing UI, verify responsiveness and accessibility.
17. For server mutations, prefer targeted cache updates over page reloads.
