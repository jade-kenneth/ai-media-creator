# Project Coding Instructions

## Core Principle

Write simple, readable, feature-focused code.

Prefer clarity over cleverness. Introduce abstraction only when repetition is real and the abstraction clearly improves maintainability.

## TypeScript Standards

Use strong, intentional typing by default.

- Prefer `unknown` at external boundaries such as network responses, storage, environment variables, user input, and `JSON.parse`.
- Narrow `unknown` with validators, type guards, or assertion functions.
- Prefer discriminated unions for multi-state and result modeling.
- Enforce exhaustive handling with `assertNever` for union-driven logic.
- Prefer `satisfies` over broad `as` casting when checking object shapes while preserving inference.
- Prefer `as const` with literal unions when runtime enum behavior is not required.
- Use branded types for critical identifiers such as `UserId`, `OrderId`, and similar domain IDs.
- Keep generics minimal and meaningful. Generics should constrain or transform types in a way that improves safety.
- Remove generics that do not improve type safety.
- Use mapped and modifier types deliberately. Do not default to `DeepPartial` unless it is clearly needed.
- Use typed registries and maps with `keyof`, `Parameters<>`, and `ReturnType<>` where appropriate.
- Use overloads only when return type precision at the call site is necessary.
- Prefer typed key helpers over unsafe `Object.keys` assumptions.
- Use template literal types for constrained string contracts only when they remain readable.
- Prefer assertion functions for important invariants.
- Avoid broad `as` casting except at validated boundaries, branding, or proven invariants.
- Do not use non-null assertions (`!`) to silence errors.
- Avoid overly generic abstractions and large undiscriminated unions that reduce clarity.

## React and Frontend Rules

Apply these defaults for frontend work:

- Keep user-facing interfaces responsive.
- Use `useForm` for frontend forms.
- Use `zod` for validation.
- Use `useFieldArray` for array-based form fields.
- If TanStack Query, Apollo Client, or any server-state management library is available, use it and avoid `fetch` and `axios`. Use them only when necessary.

## Preferred React Patterns

Use these patterns by default:

- Use custom hooks for reusable logic.
- Use providers for app-wide services such as auth, theme, API, cache, and configuration.
- Organize code by feature and colocate related files.
- Use data hooks or server-state libraries for server state.
- Use HOCs only for page-level cross-cutting concerns such as auth gates, layout wrappers, or instrumentation.
- Use Suspense and route boundaries intentionally.
- Use `useMemo` and `useCallback` only when there is a real performance reason.
- Use `useReducer` for complex local state.
- Use `useReducer` with Context for moderate shared structured state.
- Use Zustand or another external store only when shared state is high-frequency and widely consumed.

## State Management Rules

Keep state boundaries clear.

- Server state belongs in query or GraphQL caches.
- Client UI state belongs in components, hooks, or reducers.
- Session and auth state belongs in providers.
- Do not duplicate the same source of truth across multiple layers unless synchronization is explicit and necessary.

Use the following decision guide:

- Simple local state: `useState`
- Complex local state: `useReducer`
- Shared structured state across several components: `useReducer` + Context
- High-frequency shared state across many consumers: external store such as Zustand

## Next.js App Router Standards

Use App Router safely and intentionally.

- Default to Server Components.
- Add `'use client'` only when required for hooks, browser APIs, event handlers, or local state.
- Keep client components small and focused.
- Do not render hydration-unstable values during SSR or initial hydration.

Avoid using these directly in the initial render:

- `Date.now()`
- `Math.random()`
- `window`
- `document`
- `localStorage`
- `navigator`

When browser-only behavior is required:

- Defer it to `useEffect`
- Use mount guards when needed
- Keep server output and first client render stable

For async UI, always provide:

- loading state
- empty state
- error state

## Performance Standards

Protect Core Web Vitals by default.

Priority order:

1. LCP
2. INP / TBT
3. CLS

Rules:

- Optimize the largest visible content first.
- Use `next/image` where applicable.
- Do not lazy-load above-the-fold critical content.
- Code-split heavy optional UI.
- Keep route shells and layouts as server-rendered when possible.
- Lazy-load large non-critical features such as charts, maps, editors, and large modals only when needed.
- Avoid long synchronous tasks in render paths and event handlers.
- Reduce client-side JavaScript before applying micro-optimizations.
- Reserve layout space for images, embeds, banners, and other delayed content to avoid CLS.

When making a performance-focused change, state which metric is expected to improve and why.

## SEO and Metadata Standards

For user-facing pages:

- Add metadata where relevant.
- Keep canonical URLs accurate.
- Add `robots` rules for non-indexable pages when needed.
- Keep semantic HTML and heading structure correct.
- Use structured data where it meaningfully helps SEO.
- Keep primary SEO content server-rendered.
- Keep crawlable pages internally linked.

## Analytics Standards

Use a centralized analytics approach.

- Use GTM as the primary tag management layer.
- Use GA4 as the analytics destination where applicable.
- Load analytics with non-blocking strategies such as `afterInteractive`.
- Do not scatter inline `window.dataLayer.push` calls.
- Use a centralized analytics utility instead.
- Guard analytics code for browser-only execution.
- Respect consent requirements where applicable.

## Caching Standards

Use the correct server-state tool for the data source.

- Use TanStack Query for REST or non-GraphQL server state.
- Use Apollo Client for GraphQL server state.
- Do not mix caching clients for the same data source in the same feature.

Rules:

- Centralize query keys.
- Use stable and serializable cache identities.
- Invalidate only affected scopes.
- Avoid global invalidation by default.
- Prefer direct cache updates only when the updated value is complete and deterministic.
- Prefer hybrid mutation handling for many updates: update detail cache directly, then invalidate related lists.
- Use optimistic updates only for deterministic, low-risk interactions.
- Always include rollback handling for optimistic updates.
- Do not use `staleTime: Infinity` unless every mutation path has explicit invalidation coverage.

## Responsive Design Standards

Responsive behavior is mandatory for user-facing UI.

- Do not rely on fixed page widths.
- Prefer `max-width`, fluid width, and responsive padding.
- Collapse multi-column layouts appropriately on smaller screens.
- Prevent horizontal overflow.
- Scale typography for mobile readability.
- Keep tap targets large enough for touch interaction.
- Stack or wrap button groups when horizontal space is limited.
- Make forms mobile-friendly and full-width where appropriate.
- Provide a mobile strategy for tables and dense content.
- Ensure modals and drawers fit within the viewport and allow internal scrolling when necessary.
- Ensure images and media scale correctly without distortion.

Responsive regressions should be treated as bugs.

## Component Design Rules

Keep components focused and predictable.

- A component should do one thing well.
- Prefer composition over deeply nested conditionals.
- Use clear, explicit prop names.
- Avoid prop APIs that rely on multiple ambiguous booleans.
- Extract hooks or helpers before a component becomes hard to read.
- Follow existing UI and design patterns before introducing new ones.

## Accessibility Rules

Always consider accessibility.

- Use semantic HTML.
- Preserve keyboard interaction.
- Preserve visible focus states.
- Use proper labels for controls.
- Add `aria-*` attributes where appropriate.
- Ensure interactive elements are usable on touch and keyboard.
- Maintain readable contrast and accessible structure.

## Code Organization Rules

Organize code by feature or domain.

- Keep related components, hooks, types, and utilities close to the feature that owns them.
- Move logic into shared modules only when it is truly reused or intentionally shared.
- Avoid dumping unrelated code into global folders.
- Prefer feature colocation over separating files purely by type.

## Implementation Workflow

When generating or modifying code:

1. Match existing project patterns first.
2. Choose the simplest implementation that fits.
3. Keep code colocated by feature.
4. Use hooks, providers, and server-state tools consistently.
5. Add loading, empty, and error states for async flows.
6. Avoid hydration-unstable rendering.
7. Prefer choices that protect Core Web Vitals.
8. For performance changes, document the target metric and the reason.
9. For security-sensitive work, verify against the project security guidance.
10. For user-facing UI, verify responsiveness and accessibility.

## Common Anti-Patterns to Avoid

Do not:

- over-abstract early
- repeat fetch logic across multiple components
- dump feature-specific logic into global utilities
- use HOCs for logic that should be a hook
- use browser-only APIs during SSR render
- create mismatched server and client output
- lazy-load critical above-the-fold content
- force full page reloads after local mutations when cache update or refetch is sufficient
- silence type errors with broad `as`
- suppress null checks with non-null assertions
- over-invalidate caches on every mutation
- scatter raw analytics calls across the codebase

## Quick Pattern Selection Guide

- Reusable component logic -> custom hook
- App-wide dependency or service -> provider
- Page wrapper or auth/layout concern -> HOC
- Flexible shared UI API -> compound component
- Complex local state transitions -> `useReducer`
- Shared structured state -> `useReducer` + Context
- High-frequency shared global state -> Zustand or another external store

## Final Principle

Patterns are tools, not goals.

Choose the pattern that improves clarity, preserves consistency, supports maintainability, and avoids unnecessary complexity.
