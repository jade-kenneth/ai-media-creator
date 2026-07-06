# 15 — Optimization audit

Produce a static, evidence-grounded optimization audit. This is not a runtime
benchmark: do **not** run builds, profilers, load tests, Lighthouse, app servers,
or package installs unless the user explicitly asks outside the normal auditor run.
Infer only from scanned files, config, dependencies, scripts, and confirmed source
patterns. When evidence is absent, write `Not detected from current files.`

## Inputs

- `data/manifest.json`, especially `signals.dependencies`, `signals.scripts`,
  `signals.markers`, file sizes, and `audit_signals`.
- Confirmed source reads for every optimization claim.
- Existing generated content from tech-stack, frontend, backend, database, and
  full-stack-flow phases.

## Required categories

Render one compact scorecard/table plus focused cards for the categories that have
evidence:

| Category | What to inspect | Typical signals |
|---|---|---|
| Web bundle | Next.js admin routes, client boundaries, heavy UI imports, PDF/chart/editor libs, dynamic import/code splitting | `next_client_route_boundary`, `possible_heavy_client_import`, broad `'use client'`, missing `next/dynamic`, no bundle-analyzer script |
| Mobile bundle/startup | Expo assets, local image sizes, global providers, eager screen imports, heavyweight dependencies | `large_asset`, large `assets/`, many top-level providers, non-lazy route groups |
| API/GraphQL | pagination, N+1 risk, field resolvers, query complexity/depth limits, overfetching, serial awaits | `possible_n1_query`, `graphql_list_without_pagination`, `possible_await_waterfall`, resolvers returning raw lists |
| Database | indexes for filter/sort fields, projection/lean, pagination, aggregate cost, tenant filters on indexed fields | `possible_unbounded_query`, missing index definitions, repository sort/filter fields |
| Caching/network | TanStack Query keys, stale time/refetch behavior, mutation invalidation, request dedupe, server cache headers | missing staleTime where data is stable, duplicate queries, manual fetch state |
| Assets/media | image dimensions/weight, SVG vs PNG choice, app icon/splash weight, remote image delivery | `large_asset`, oversized local assets, repeated unoptimized media |
| Build/CI | Nx targets, typecheck/build scripts, analyzer scripts, CI caching, remote cache, affected commands | scripts/targets present or missing in root/app package files, `.github/workflows` |

## Finding format

For each optimization card, include:

- **Area** — one of `web-bundle`, `mobile-startup`, `api-graphql`, `database`,
  `cache-network`, `assets`, `build-ci`.
- **Priority** — use existing `P1 HIGH`, `P2 MEDIUM`, `P3 LOW` labels.
  Most optimization findings are P2 or P3. Use P1 only when the code clearly risks
  production instability, severe data load, or broken core flows.
- **Evidence** — real `path:line` plus the exact pattern observed.
- **Impact** — what gets slower or larger: first load, interaction latency, API
  latency, database load, mobile startup, bandwidth, CI time.
- **How to confirm** — the smallest command or measurement the developer can run
  later (for example `npx nx build brgy-system-admin --configuration=production`,
  a bundle analyzer, API timing, Mongo explain plan). Do not run it yourself by
  default.
- **Suggested fix** — concrete next step, scoped to the owning app/layer.
- **Confidence** — `high`, `medium`, or `low`.

## What to look for

- Web/admin:
  - Route-level files under `apps/brgy-system-admin/app/**/(page|layout).tsx` marked
    `'use client'`. Prefer moving client boundaries into the smallest interactive
    feature component.
  - Heavy dependencies imported by client components (PDF generation, charting,
    editors, maps, 3D/canvas, large utility libraries). Suggest `next/dynamic`,
    lazy routes, or server-side generation when appropriate.
  - Large generated GraphQL files or broad imports pulled into interactive views.

- Mobile:
  - Image assets over ~300 KB or many large onboarding/announcement assets loaded
    at startup.
  - Top-level providers doing network work eagerly on launch.
  - Feature screens imported eagerly when Expo Router can load by route.

- API/GraphQL:
  - List queries without cursor/limit arguments.
  - Resolver/service code that loops and awaits database/API work serially.
  - Per-item relation fetches without batch loaders.
  - Missing query complexity/depth/rate-limit controls for expensive GraphQL paths.
  - Overfetching from admin/mobile operations where a list view requests detail-only
    fields.

- Database:
  - Repository filters/sorts without matching index declarations.
  - `.find()`/`aggregate()` without nearby limit, cursor pagination, projection, or
    `lean()` where documents are read-only.
  - Tenant-scoped queries where `barangayId`/`tenantId` is not part of the filter or
    an index candidate.

- Caching/network:
  - TanStack Query hooks for stable reference data without clear `staleTime`.
  - Mutations that do not invalidate the list/detail query keys they affect.
  - Multiple hooks fetching the same entity separately on one screen.

- Build/CI:
  - Missing app-specific `build`/`typecheck`/`lint` targets.
  - No analyzer script for web bundle investigation.
  - CI that runs all projects when Nx affected/project targets would be enough.

## HTML output

Add an `#optimization` section before the general best-practices audit. Use existing
`.card`, `.grid`, `.stat`, `.code-old`, `.code-new`, and `.topic-chat` classes.
Do not add new scripts.

Suggested shape:

```html
<section id="optimization">
  <h2><span class="num">§10</span> Optimization audit</h2>
  <p class="lede">Static performance signals for bundle size, API/database cost,
  caching, assets, and build speed. These are evidence-based leads, not runtime
  measurements.</p>
  <!-- PLA:OPTIMIZATION -->
</section>
```

Each optimization card should end with a `.topic-chat` box scoped to that card so
the learner can ask how to measure or fix that specific bottleneck.

## Markdown output

Write `optimization-report.md` with auto markers:

```markdown
<!-- pla:auto:start -->
## Optimization scorecard
...
## Findings
...
## How to measure next
...
<!-- pla:auto:end -->
```

Keep the report actionable: list the top 5 optimization wins first, then grouped
findings by category.

## Integration with `audit-findings.json`

Optimization findings may also be included in `data/audit-findings.json.findings`
so they appear in the general audit filters. Add optional fields when useful:

```jsonc
{
  "category": "optimization",
  "optimization_area": "web-bundle | mobile-startup | api-graphql | database | cache-network | assets | build-ci",
  "how_to_confirm": "smallest measurement command or manual check"
}
```

Do not fabricate byte counts, timings, Lighthouse scores, query latency, or bundle
sizes. If no measured number exists in the repo, describe the static signal and the
measurement command to run later.

## Output of this phase

- Optimization section HTML for `index.html`.
- `optimization-report.md`.
- Optional optimization entries folded into `data/audit-findings.json.findings`.
