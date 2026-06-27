# Copilot Instructions

Use these instructions as the default implementation standard for this repository.
When local project patterns are already established, follow them first.
When a stack-specific rule does not apply to the current repository, keep the general engineering rule and ignore the non-applicable stack detail.

## Core Principle

- Write simple, readable, feature-focused code.
- Prefer clarity over cleverness.
- Introduce abstraction only when it clearly improves maintainability.

## TypeScript

- Prefer `unknown` at external boundaries and narrow it safely.
- Standardize reusable helpers where relevant: `Prettify<T>`, `ValueOf<T>`, `NonEmptyArray<T>`, `Brand<T, Name>`.
- Use discriminated unions for multi-state logic.
- Enforce exhaustive handling with `assertNever`.
- Prefer `satisfies` over broad `as`.
- Prefer `as const` + literal unions over enums when runtime enums are unnecessary.
- Use branded types for critical identifiers.
- Keep generics minimal and meaningful.
- Avoid broad `as` casting and avoid non-null assertions (`!`).

## React

- Keep user-facing UI responsive.
- Use `useForm` for forms.
- Use `zod` for validation.
- Use `useFieldArray` for array fields.
- Use custom hooks for reusable logic.
- Use providers for app-wide services.
- Prefer feature colocation.
- Use `useReducer` for complex local state.
- Use `useReducer` + Context for moderate shared state.
- Use `useMemo` and `useCallback` only for real performance needs.
- Add loading, empty, and error states for async UI.
- Prefer modals, drawers, or inline editing for create and edit flows instead of navigating to separate CRUD pages when a dedicated page is not necessary.
- Keep overlays responsive and accessible.

## Server State and Data Access

- Use TanStack Query, SWR, Apollo Client, or another appropriate server-state library for data fetching and mutations.
- Avoid `fetch`, `axios`, and manual `useEffect` + `useState` server-state patterns unless necessary.
- Keep server state separate from local UI state.
- Centralize query keys and cache identity.
- Invalidate cache narrowly and intentionally.
- Avoid global invalidation by default.
- Prefer targeted cache updates and client-side cache management over page reloads.
- Use optimistic updates when the action is deterministic and rollback is safe.
- Snapshot before optimistic writes and roll back on error.

## State Management

- Avoid prop drilling through multiple intermediate components.
- Use context, composition, or a state-management library for shared state.
- Prefer `useReducer` over many related `useState` calls when updates are coordinated or depend on previous state.
- Do not create effect loops by reading and writing the same state in one `useEffect`.
- Stabilize object and array effect dependencies when needed.

## Component Discovery and Styling

- Check project registries first for reusable components.
- If the project registry does not have the component, use MCP to discover maintained components before building custom UI.
- Avoid custom components when a maintained shared component already fits.
- Avoid arbitrary utility values and ad hoc inline styles when canonical classes or design tokens exist.
- Use utilities such as `suggestCanonicalClasses` when the project provides them.

## SSR, Hydration, and Framework Safety

- Default to server-rendered output unless client interactivity is required.
- Add `'use client'` only when needed.
- Keep client components small.
- Avoid hydration-unstable values during SSR or initial render.
- Do not use `Date.now()`, `Math.random()`, `window`, `document`, `localStorage`, or `navigator` in initial server/client markup.
- For browser-only behavior, defer to `useEffect` or a mount guard.
- Use SSG for mostly static SEO pages.
- Use ISR for SEO pages that need periodic refresh.
- Use SSR for SEO pages or request-time data that must be fresh per request.
- Configure a title template in the root layout metadata.

## Performance

- Protect Core Web Vitals: LCP, INP/TBT, and CLS.
- Do not lazy-load above-the-fold critical content.
- Use code splitting for heavy optional UI.
- Reduce client-side JavaScript before micro-optimizing.
- Reserve layout space to avoid CLS.
- When making a performance fix, state which metric is expected to improve and why.

## SEO and Accessibility

- Add metadata where relevant.
- Keep canonical URLs accurate.
- Use semantic HTML and proper heading structure.
- Add JSON-LD structured data when it is relevant to the page type and SEO goals.
- Keep important content server-rendered.
- Generate and maintain `sitemap.xml` and `robots.txt` based on the real site structure.
- Use a root title template for consistent page titles.
- Ensure public pages are crawlable and sensitive routes are blocked appropriately.
- Keep accessible labels, focus states, keyboard interaction, and overlay accessibility intact.

## Responsive Design

- Prevent horizontal overflow.
- Use fluid layouts and responsive spacing.
- Stack layouts appropriately on smaller screens.
- Ensure touch-friendly targets and readable typography.
- Provide a mobile strategy for tables, modals, and dense layouts.

## Dependency Management

- Prefer the latest stable dependency versions unless the repository intentionally pins versions.
- Review changelogs before major upgrades.
- Keep lockfiles updated and verify the build after dependency changes.

## Security and Compatibility

- Follow the project security guide for sensitive work.
- Validate untrusted input and protect secrets.
- Check browser support before using niche CSS or browser APIs.

## Code Organization

- Organize by feature or domain.
- Colocate related files.
- Share code only when it is truly reused.
- Prefer registry components first, then MCP-discovered components, then custom implementations.

## Audit Rule

- Use the repo audit format when available.
- Otherwise report severity, impact, evidence, and fix.
- Prioritize correctness, security, accessibility, performance, caching correctness, SEO, and responsiveness.

## Avoid

- over-abstraction
- repeated fetch logic
- browser APIs during SSR
- server/client render mismatches
- broad `as` casts
- non-null assertions
- global cache invalidation without reason
- page reloads after mutations when cache updates or targeted invalidation are enough
- scattered analytics calls
- prop drilling through many intermediate components
- arbitrary class values when canonical classes or tokens exist
- custom components before checking project registries and MCP
- dedicated CRUD pages when a responsive accessible modal or drawer is the better UX
- effect loops caused by reading and writing the same state in one effect
- CSR-only rendering for SEO-critical pages that should use SSG, ISR, or SSR

## Full Guide Reference Map

Use the following docs as the full guide for deeper implementation details:

- `DOCUMENTATION/README_FIRST_DOCS.md` — onboarding summary, default rules, and starting point for the documentation set
- `DOCUMENTATION/ENHANCEMENTS.md` — additional project standards, UX preferences, and implementation enhancements layered on top of the core rules
- `DOCUMENTATION/TYPESCRIPT_PATTERNS_DOCS.md` — advanced TypeScript patterns, type helpers, exact typing, guards, and generics
- `DOCUMENTATION/REACT_PATTERNS.md` — React architecture patterns, colocation, composition, and reusable logic guidance
- `DOCUMENTATION/REACT_HOOKS_USAGE_DOCS.md` — `useCallback` and `useMemo` decision rules, profiling guidance, and anti-patterns
- `DOCUMENTATION/REDUCER.md` — `useReducer` usage guide for complex local state and state transitions
- `DOCUMENTATION/REDUCER_CONTEXT.md` — `useReducer` + Context guidance, split context pattern, and scaling limits
- `DOCUMENTATION/CACHING.md` — TanStack Query, SWR, and Apollo-style caching, invalidation, optimistic UI, and mutation handling
- `DOCUMENTATION/LIGHTHOUSE_PATTERN.md` — Lighthouse and Core Web Vitals review guidance, priorities, and optimization checklist
- `DOCUMENTATION/NEXTJS_PERFORMANCE_AND_SEO_PATTERNS_DOCS.md` — Next.js App Router performance, metadata, title templates, robots, sitemap, JSON-LD, and SEO patterns
- `DOCUMENTATION/CODE_SPLITTING_DOCS.md` — code splitting strategy, lazy-loading decisions, and performance tradeoffs
- `DOCUMENTATION/RESPONSIVE_DESIGN_PATTERNS.md` — responsive layout, mobile UI patterns, touch targets, and overflow prevention
- `DOCUMENTATION/RESPONSIVENESS_DOCS.md` — project responsiveness baselines, breakpoint behavior, and component-level responsive expectations
- `DOCUMENTATION/SECURITY.md` — practical application security checklist, sensitive change review, and release checks
- `DOCUMENTATION/BROWSER_COMPATIBILITY.md` — browser-specific watchouts, API support considerations, and cross-browser testing guidance
- `DOCUMENTATION/FOLDER_STRUCTURE.md` — folder structure, colocation, shared placement, and naming rules
- `DOCUMENTATION/ESLINT_PRETTIER.md` — formatting, linting baseline, and consistency rules
- `DOCUMENTATION/GA4_GTM_DOCS.md` — analytics, GTM/GA4 implementation, route tracking, and event naming guidance
- `DOCUMENTATION/AUDIT_FORMAT.md` — default audit output format, severity model, and reporting structure
