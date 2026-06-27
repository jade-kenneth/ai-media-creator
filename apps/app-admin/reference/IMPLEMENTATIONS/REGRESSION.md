# Regression Prevention Standards

Use this document as a reusable engineering standard to prevent common regressions in React/Next.js apps. These rules are framework-aware but not feature-specific.

## Purpose

- Reduce repeat bugs caused by unstable rendering, duplicated state, and unsafe integrations
- Standardize implementation patterns across features and providers
- Make code easier to review for regression risk

## How To Use

- Reference this during implementation and code review
- Apply the rules when introducing new features, refactors, or integrations
- Prefer the smallest change that removes the regression class, not just the visible symptom

## Standards

### 1. Auth Guard and Route Wrapper State

- Do not duplicate provider/session state into local wrapper state unless required.
- Derive guard behavior directly from the source session state (`loading`, `authenticated`, `unauthenticated`, `error`) to avoid stale or conflicting UI.
- Never render protected content while auth/session state is unresolved.
- Keep guard branching explicit and deterministic.
- If redirecting, perform redirects in effects and keep render output stable while redirect is pending.

Recommended pattern:

- Use a small pure resolver/state machine for guard outcomes (for example `loading`, `unauthenticated`, `unauthorized`, `authorized`).

### 2. Provider Async State and Failure Handling

- Provider hooks must always resolve async failures into a deterministic state (`error`, `unauthenticated`, etc.).
- Do not leave provider state stuck in `loading` after a failed request.
- Keep shared/global store state synchronized with provider state on success and failure.
- Protect async callbacks from updating state after unmount.

Recommended pattern:

- Explicit async status enums and mounted guards (`isMountedRef`) where needed.

### 3. Browser Event Listener Consistency

- Centralize listener setup/cleanup inside `useEffect`.
- Always remove listeners with the exact same handler reference.
- Gate expensive refresh/revalidation logic behind event conditions (for example only act when document becomes visible).
- Deduplicate in-flight async refresh work triggered by repeated browser events.

Recommended pattern:

- Visible-only `visibilitychange` handlers + in-flight request guards.

### 4. Hydration-Safe Rendering (Next.js / SSR)

- Keep server-rendered output and the first client render structurally stable.
- Do not render browser-dependent values (`window`, `document`, `localStorage`, `navigator`) during SSR output.
- Do not render pathname/time/random-dependent class names without a hydration-safe strategy.
- Prefer mount guards for client-only visual differences when SSR markup may differ.
- Treat `dynamic(..., { ssr: false })` as a fallback workaround, not the default fix for unstable render logic.

### 5. Optimistic Updates and Temporary IDs

- Never use placeholder runtime IDs (for example `'FIXME'`) in payloads, cache entries, or optimistic rows.
- If optimistic UI is required and the backend does not return the created entity, generate valid temporary IDs (UUID/ObjectId/etc.).
- Reconcile optimistic entries with server truth via refetch or cache invalidation after mutation completion.
- Keep the server response/query cache as the long-term source of truth.

### 6. Safe Text and Rich Content Rendering

- Do not use `dangerouslySetInnerHTML` for simple labels, titles, or text content.
- Normalize malformed text inputs before rendering (stray tags, invalid line-break tokens, partial markup).
- Use explicit rendering rules for line breaks, formatting, and fallback states.
- Provide graceful fallback UI for media (images/icons) that may fail to load.

### 7. External Script / SDK Integration Safety

- Treat external SDK globals as optional at runtime.
- Guard required env vars/config before initialization.
- Wrap SDK initialization in `try/catch` where runtime failures are possible.
- Handle script load failures explicitly (for example `onError`) and fail gracefully.
- Prefer user-facing recovery feedback (toast/message) over hard crashes.

### 8. Post-Submit and Mutation UX Updates

- Do not use full page reloads (`window.location.reload()`) to sync UI after local actions unless explicitly required.
- Prefer local state updates, provider updates, or server-state invalidation/refetch.
- Preserve success feedback and avoid resetting unrelated UI state.
- Keep submit success paths focused on the minimum required UI changes.

### 9. Responsive Shell and Navigation Layouts

- Avoid fixed percentage layouts for app shells and dashboards unless they are validated for all breakpoints.
- Use mobile-first responsive sizing utilities and adaptive navigation patterns (drawer, collapsible sidebar, stacked layout).
- Preserve keyboard navigation and focus behavior in overlays/drawers.
- Ensure navigation remains accessible and usable on small screens.

### 10. Public API and Barrel Export Consistency

- Keep barrel exports aligned with actual file ownership after moves/splits/refactors.
- Prefer a clear public import path for shared modules and document when internal imports are allowed.
- Update exports as part of the same change when relocating components/utilities.
- Avoid export drift that causes mixed import conventions across the app.

### 11. State Machine Documentation for Critical Flows

- Document expected states and render priority for auth guards, async workflows, and route wrappers.
- Prefer small pure helpers/resolvers for critical branching logic so they can be unit tested independently.
- Keep behavior comments close to the branching code they describe.
- Use explicit state names instead of implicit boolean combinations where possible.

## Review Checklist (Quick)

- Is async state deterministic on success and failure?
- Is SSR/client markup stable on first render?
- Are browser listeners cleaned up and deduplicated?
- Are optimistic records using valid IDs and reconciled?
- Are external scripts/env/globals guarded?
- Is the UI updated without unnecessary full-page reload?
- Is the shell/navigation responsive and keyboard-accessible?
- Are exports/import paths consistent after refactor?
- Is the critical branching logic documented and testable?
