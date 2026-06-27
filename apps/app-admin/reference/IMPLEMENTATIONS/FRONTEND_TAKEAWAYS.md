# Frontend Takeaways (From `task.md`)

This is a plain-language summary of what we learned from the fixes and improvements listed in `task.md`.

## 1. Login and Access Screens Need to Feel Stable

- Users should not briefly see admin content before the app finishes checking login/access.
- Loading, unauthorized, and allowed states should be clear and consistent.
- If access rules are configurable (like roles), the UI should actually follow those rules.

### Takeaway

Build access checks so they wait for the real session result and do not rely on temporary local guesses.

### Technical Note

- Derive auth guard UI from one source of truth (for example `useSession()`), instead of copying `loading/error` into local state.
- Keep render branches explicit: `loading`, `unauthenticated`, `unauthorized`, `authorized`.

## 2. Error States Should Always End Cleanly

- If a session check fails, the app should move to a clear fallback state.
- It should never stay stuck in a loading state forever.
- Shared auth state and UI state should stay in sync when something goes wrong.

### Takeaway

Every async flow needs a clear success path and a clear failure path.

### Technical Note

- In `catch` blocks, always set a final state (`error` or `unauthenticated`) so the UI can stop loading.
- Keep provider/store state updates in sync with that fallback state.

## 3. Fake IDs Cause Real Problems

- Placeholder values like `FIXME` can break create flows and list updates.
- Even temporary/optimistic items need valid IDs so the UI can track them safely.

### Takeaway

Use real IDs when possible. If you need a temporary one, make it valid and replace it correctly.

### Technical Note

- Optimistic UI items should use valid temporary IDs, not placeholders like `FIXME`.
- Reconcile optimistic rows with server data after mutation success (cache update + refetch if needed).

## 4. Small UI Mismatches Create Big Warnings

- A sidebar can look fine but still trigger hydration warnings if server and client render different styles at first.
- Invalid utility classes can silently break visuals.

### Takeaway

Keep the first render stable, and fix the root cause instead of hiding the warning.

### Technical Note

- Delay browser/pathname-based styling until after mount if it can differ between server and client.
- Validate utility classes (for example Tailwind gradient classes) to avoid silent visual failures.

## 5. Simple Content Should Be Rendered Simply

- Category names did not need raw HTML rendering.
- Broken text formatting and broken images should fail gracefully.

### Takeaway

If content is just text, render it as text. Add a friendly fallback for bad data and missing images.

### Technical Note

- Prefer normal text rendering over `dangerouslySetInnerHTML` for labels.
- Normalize malformed label strings before render and use image `onError` fallbacks for broken assets.

## 6. Third-Party Scripts Must Be Treated as Optional

- Payment SDKs and external scripts can fail to load.
- Environment variables can be missing.
- Apps should not crash just because a third-party service is unavailable.

### Takeaway

Guard script loading and setup. Show a clear message and fail safely.

### Technical Note

- Treat external SDKs as optional runtime dependencies: check the global object, methods, and env vars before use.
- Use script `onLoad`/`onError` handlers and wrap initialization in `try/catch`.

## 7. Mobile Support Should Be Built In, Not Added Later

- Desktop-only layouts break quickly on phones.
- Admin pages need usable navigation on smaller screens too.

### Takeaway

Design key layouts to work on mobile first (or at least mobile early), especially admin tools.

### Technical Note

- Replace fixed percentage layouts with responsive widths/flex/grid breakpoints.
- Use a mobile drawer pattern with keyboard close support, overlay, and body scroll lock.

## 8. Avoid Full Page Reloads After Simple Actions

- Reloading the whole page after submitting a form feels heavy and resets useful UI state.
- Most of the time, only one part of the screen needs to update.

### Takeaway

Prefer updating local/shared state and keeping the user in place.

### Technical Note

- Replace `window.location.reload()` with provider/store updates and targeted refetch/invalidation.
- Keep success feedback (toast/modal close) separate from data refresh logic.

## 9. Background Listeners Can Quietly Add Noise

- Repeated visibility checks and listeners in different providers can drift over time.
- Duplicate refresh work adds extra load and can cause confusing behavior.

### Takeaway

Use one clean pattern for browser listeners (setup, cleanup, and duplicate prevention).

### Technical Note

- Standardize `visibilitychange` listeners to run only when the page becomes visible.
- Add in-flight guards and mounted guards to prevent duplicate requests and stale updates after unmount.

## 10. Clean Structure Makes Future Changes Safer

- Export paths become confusing when files move around.
- A clear public import path makes the codebase easier to use and maintain.

### Takeaway

Decide where shared UI belongs and keep exports consistent.

### Technical Note

- Keep barrel exports aligned with actual file ownership.
- Choose one public import path (for example `~/admin`) and use it consistently.

## 11. Important UI Rules Should Be Easy to Understand

- Guard logic becomes harder to maintain when the rules only exist inside long component branches.
- Even without tests, a small documented state flow makes regressions less likely.

### Takeaway

Make important UI decision rules explicit and easy to read.

### Technical Note

- Move complex guard/decision logic into a small pure resolver function.
- Use explicit state names/types so the branching logic is testable and easier to review.

## 12. Performance: Biggest Wins Came From Reducing Work Early

- Smaller client boundaries helped pages load more smoothly.
- Moving only the necessary parts to the client reduced overall page work.
- Deferring heavy UI (like modals) helped keep the page responsive.

### Takeaway

The best performance fixes often come from doing less on first load.

### Technical Note

- Keep App Router route shells/layouts server-rendered where possible.
- Move browser-only behavior into small client-only bridge/components instead of marking whole routes as client.

## 13. Performance: Images Need Better Hints

- Large images and thumbnails can download bigger files than needed without size hints.
- Giving the browser better image hints improved loading behavior.

### Takeaway

Tell the browser how large images actually render (especially for responsive layouts).

### Technical Note

- For `next/image` with `fill`, always provide a `sizes` prop.
- Mark the likely hero/LCP image as `priority` and use responsive `sizes` for large media.

## 14. Performance: Background Work Matters Too

- Timers and repeated checks can keep doing work even when the user does not need updates that often.
- Slowing down or event-triggering background checks reduces page pressure.

### Takeaway

If something runs often, make sure it really needs to.

### Technical Note

- Replace frequent polling with event-driven refresh (`storage`, `visibilitychange`) where possible.
- If polling is required, use adaptive intervals (faster near expiry, slower otherwise).

## 15. Performance: Fewer Global Scripts Is Better

- Loading multiple analytics setups can add extra first-load work.
- A single clear analytics path is easier to maintain and lighter to run.

### Takeaway

Avoid duplicate tracking bootstraps unless there is a proven need.

### Technical Note

- Avoid initializing both a tag manager and a direct analytics runtime globally unless required.
- Keep route-specific tracking needs local (for example reading a cookie/client ID in the checkout flow).

## 16. Performance + SEO: Small Setup Changes Add Up

- Route metadata improves page titles and page quality signals.
- Better font loading helps reduce layout shifting.

### Takeaway

Polish in app setup (metadata/fonts) improves both user experience and quality checks.

### Technical Note

- Add App Router `metadata` / `generateMetadata` for core pages.
- Use `next/font` for better font loading behavior and reduced layout shift risk.
- For client-only pages, use segment `layout.tsx` metadata exports.

## 17. Documentation Helps Keep Fixes From Coming Back

- Writing down root causes and fixes made the work easier to review and repeat.
- Adding standards to Copilot instructions helps avoid repeating the same mistakes.

### Takeaway

Document the lesson, not just the fix.

### Technical Note

- Record the root cause, the fix, and the expected behavior (not only the code change).
- Add reusable standards to project docs/Copilot instructions to reduce repeat regressions.

## 18. SEO Metadata Should Use Next.js Metadata APIs First

- Verification tags and site icons are easier to keep correct when defined in App Router metadata.
- Manually scattered `<head>` tags are harder to maintain and easier to duplicate.

### Takeaway

Use Next.js metadata fields as the default source of truth for SEO basics.

### Technical Note

- Use `metadata.verification.google` for Google site verification.
- Use `metadata.icons` for favicon/shortcut/apple icons (for example `Logo.png`).
- Keep metadata centralized in layout/route metadata exports.

## 19. Product SEO Data Must Match the Real Route and Real Data

- Canonical and structured-data URLs must match the actual route shape.
- Product metadata quality drops if the query does not actually filter by `productId`.
- Stock availability should treat `0` quantity as out of stock.

### Takeaway

SEO fields are only useful when they reflect the real page URL and real product state.

### Technical Note

- Keep canonical and JSON-LD product URLs aligned with `/product/[productId]`.
- Ensure GraphQL product queries include and use the `filter` variable.
- Use `pieces <= 0` for `OutOfStock` in product schema output.

## 20. Use One Data-Access Standard for GraphQL in Frontend Routes

- Mixing raw `axios` GraphQL calls with Apollo patterns adds duplication and inconsistency.
- Shared query behavior is easier to reason about when using one client path.

### Takeaway

Prefer the shared `apolloClient` for route-level GraphQL reads instead of ad-hoc HTTP calls.

### Technical Note

- Use `apolloClient.query(...)` with generated documents/types in route data helpers.
- Keep fetch policy explicit for metadata-sensitive reads (for example `no-cache` when needed).

## 21. Shared Clients Must Be Safe in Both Browser and Server Contexts

- App Router page metadata and server components can execute on the server.
- Browser-only auth/session helpers can break server-side query execution if not guarded.

### Takeaway

Any shared frontend infrastructure used by server-rendered routes must handle SSR safely.

### Technical Note

- Guard browser-only auth link work with `typeof window !== 'undefined'`.
- Return request context unchanged when running on the server in Apollo context links.

## 22. JSON-LD Is Still Applicable Without Prefetching, but SSR Is Stronger

- Structured data can still be added even if product/category data is fetched client-side.
- Client-injected JSON-LD is less reliable for SEO than server-rendered JSON-LD.
- The strongest setup is to render JSON-LD in server routes (`page.tsx`/layout) with stable data.

### Takeaway

Do not skip JSON-LD just because there is no prefetch yet, but prioritize server-rendered JSON-LD whenever possible.

### Technical Note

- Use schema that can be generated safely from available server data (`CollectionPage`, `BreadcrumbList`, `Product`, `ItemList` as applicable).
- If data is only available in client hooks, treat JSON-LD as temporary/partial and plan to move data fetch to server route helpers for more reliable indexing.

## Quick Summary (What We Should Keep Doing)

- Make the first render stable and predictable
- Fail gracefully when data/scripts are missing
- Prefer local updates over full page reloads
- Keep layouts mobile-friendly
- Reduce unnecessary work on first load
- Give images and fonts proper loading hints
- Use consistent patterns for listeners, guards, and exports
- Keep metadata, canonical URLs, and structured data aligned with real routes
- Prefer server-rendered JSON-LD when schema depends on dynamic product/category data
- Use the shared GraphQL client pattern instead of per-page ad-hoc fetch logic
- Write down the reason behind fixes so they stay fixed
