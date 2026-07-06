# 19 — Engineering & platform initiatives

Produce a static, evidence-grounded **engineering initiative backlog**: CI/CD,
migrations, automation, AI integrations, and third-party integrations that would let
the team ship faster, operate more safely, or reach further — cheaply and without
breaking existing clients, data, or developer workflows.

This section answers a different question from its neighbors:

- Optimization (§15) — "is it fast?"
- UI/UX (§16) — "does it feel safe and clear while I interact?"
- Best-practices audit (§08) — "is it wrong or risky?"
- Feature initiatives (§17) — "how does an existing feature get more useful?"
- **Engineering initiatives (this phase) — "what platform capability would let the
  team ship faster, operate more safely, or reach further — cheaply and without
  breaking anything?"**

Do **not** run the app, build, deploy, install, or modify app source. Infer only from
`data/manifest.json`, especially `signals.initiative_surfaces`, plus confirmed source
reads. When evidence is absent, write `Not detected from current files.`

## The three hard constraints (every initiative MUST satisfy all three)

1. **Evidence-motivated.** The proposal cites the `path:line` it builds on or
   replaces, or the documented project objective in the repo's own README/
   requirements docs. An initiative may propose something that does not exist yet,
   but the *motivation* must be real. Current-state claims still obey "No invention":
   cite what exists; for what does not exist, write `Not detected from current files.`
2. **Additive & non-breaking.** No removed/renamed public fields, routes, GraphQL
   types, scripts, files, or required workflow steps; no data rewrite that invalidates
   existing records; no mandatory provider cutover. New optional scripts, CI checks,
   dry-run flags, version tracking, opt-in integrations, or additive delivery
   channels are fine.
3. **Incrementally shippable.** The overall idea may point toward a larger platform
   capability, but every listed step is `S`/`M` and independently shippable. Anything
   requiring a big-bang cutover, provider migration, broad rewrite, or `L` effort is
   parked under "Out of scope (bigger bets)".

## Goal of each initiative (tag exactly one primary goal)

| Goal | What it improves | Examples |
|---|---|---|
| `velocity` | The team ships faster | CI running the checks developers already run locally, one root codegen script, pre-commit hooks, generated-artifact drift checks |
| `reliability` | Fewer production surprises | PR gates, deploy checks, scheduler drift checks, generated schema checks, tracked job health |
| `safety` | Data integrity and recoverability | Versioned/reversible migrations, dry-run flags, seed/reset order, backup/restore checks |
| `reach` | New capability for users/operators | Small AI assist, a new third-party channel, or a provider integration clearly implied by the documented objective |

## Inputs

- `data/manifest.json` and `data/manifest-summary.json`, especially
  `signals.initiative_surfaces`:
  `cicd`, `migrations`, `automation`, `ai`, and `third_party`.
- Confirmed source/config reads for every cited `path:line`.
- Project objective statements from README/requirements docs when proposing a new
  integration that is not yet implemented.
- Existing generated architecture, flow, and audit content, so platform initiatives
  fit how the project already works.

## What to look for by track

### `cicd`

Key evidence: `initiative_surfaces.cicd.workflows`, workflow `triggers`,
`step_keywords`, `dockerfiles`, `docker_compose`, and `mobile_build`.

- Workflow exists but is manual-only, or does not run on pull requests/pushes.
- Workflow misses a check the repo already runs locally: lint, typecheck, test, or
  build scripts exist, but the CI step keywords do not show them.
- Monorepo with broad all-project commands where an affected-only CI path could reuse
  the existing task runner without changing app behavior.
- Generated artifacts are committed, but there is no drift check that regenerates and
  fails when the working tree changes.
- No staging/deploy pipeline despite deploy/build scripts or container config.
- Mobile app with `eas.json` or mobile build scripts but no build pipeline.

### `migration`

Key evidence: `initiative_surfaces.migrations.package_scripts`, `files`, and
`framework_dependencies`.

- One-off migration scripts with no versioning/tracking of which ran where.
- Seed/reset scripts with no documented order or safety boundary.
- Schema-bearing app with no migration framework detected.
- Irreversible scripts with no dry-run flag or rollback/restore note.
- Scripts that connect to production-capable storage but do not record an applied
  migration id.

### `automation`

Key evidence: `initiative_surfaces.automation.codegen_scripts`,
`codegen_script_count`, `scheduler`, `event_queue_dependencies`, and
`git_hook_tooling`.

- A multi-step manual chain that docs or scripts imply developers run by hand. Codegen
  across multiple workspaces is the canonical case: propose one root script plus a CI
  drift check.
- Scheduled-job infrastructure exists but an obvious recurring operator task is still
  manual. Reuse the scheduler/lock/job pattern already present.
- Lint/format scripts exist, but no git-hook tooling is detected.
- Repetitive operator tasks could be absorbed by existing event/queue infrastructure
  without changing user-facing contracts.

### `ai`

Key evidence: `initiative_surfaces.ai.dependencies_by_workspace` and
`dependency_names`.

- No AI dependency detected: propose the *smallest* objective-grounded integration,
  such as draft, summarize, triage, or translate on data the platform already holds.
  Reuse existing delivery modules such as mail, notification, job, or queue channels
  if the scan shows them.
- AI dependency detected: extend the established pattern; do not propose a second
  parallel AI stack.
- Every AI proposal names guardrails: opt-in use, human review before publication or
  action, tenant scoping, prompt/output logging policy, rate limits, and no PII sent
  to third parties without a documented basis.
- If the current AI stack is absent, say `Not detected from current files.` for the
  current state; do not imply an SDK or model is already wired.

### `third-party`

Key evidence: `initiative_surfaces.third_party.matches` and
`integration_names`, plus objective lines in README/requirements docs.

- Integrations that already exist become **reuse anchors**. Cite the dependency or
  module `path:line` and explain how the proposal plugs into that anchor.
- Propose only integrations the documented project objective implies. Cite the
  objective line that motivates it.
- For anything new, explicitly mark the current state as
  `proposal — Not detected from current files.`
- Each proposal names the existing module/pattern it would plug into and why that
  keeps the change additive.

## Finding format

For each engineering initiative card, include:

- **Track** — one of `cicd`, `migration`, `automation`, `ai`, `third-party`.
- **Goal** — one of `velocity`, `reliability`, `safety`, `reach`.
- **Evidence** — what exists today, with `path:line`; if absent, write
  `Not detected from current files.` and cite the objective line that motivates the
  proposal.
- **Initiative** — one imperative sentence.
- **Why it helps** — qualitative team/operator/user benefit. Do not invent metrics.
- **Why non-breaking** — what stays unchanged for existing clients, data, and
  developer workflows.
- **Effort** — `S` or `M` only; never `L`.
- **Value** — `high` · `medium` · `low`.
- **Pattern/module to reuse** — existing config/script/module with `path:line`.
- **Incremental steps** — 2–5 independently shippable steps.
- **Confidence** — `high` · `medium` · `low`.

Rank by **value vs effort** — high-value/S first — not by severity. Group by track
and lead each track with its quick win.

## HTML output

Add an `#eng-initiatives` section **after** `#initiatives` and **before** `#test`.
Fill the `PLA:ENG_INITIATIVES` marker in `assets/index-template.html`. Reuse
existing `.card`, `.badge-initiative`, `.badge-meta`, `.compare`, `.code-old`,
`.code-new`, `.file-ref`, and `.topic-chat` classes. Do **not** add new scripts or a
new `<style>` block.

Suggested shape:

```html
<section id="eng-initiatives">
  <h2><span class="num">§15</span> Engineering & platform initiatives</h2>
  <p class="lede">Safe platform wins derived from the project's objective and what
  already exists: CI/CD, migrations, automation, AI, and third-party integrations.
  Quick wins first.</p>
  <!-- PLA:ENG_INITIATIVES -->
</section>
```

Within each card, show the `INITIATIVE` badge and `.badge-meta` chips for
track/goal/effort/value/non-breaking. Use optional red **Current** and green
**Proposed** panels when a before/after config sketch helps; the Proposed panel must
be visibly additive. Each initiative card ends with its own `.topic-chat` box scoped
to that card.

## Markdown output

Write `engineering-initiatives.md` with auto markers:

```markdown
<!-- pla:auto:start -->
## Quick wins (do first)
...top value-vs-effort initiatives...
## Initiatives by track
### CI/CD
### Migrations
### Automation
### AI integrations
### Third-party integrations
## Out of scope (bigger bets)
...one line each: valuable but breaking or L-sized; why it is parked...
<!-- pla:auto:end -->
```

Keep it actionable: quick wins first, then grouped by track, then parked bigger bets
so valuable ideas do not pollute the safe initiative list.

## Integration with `audit-findings.json`

Fold engineering initiatives into `data/audit-findings.json.findings` so they share
history with audit, strengths, and feature initiatives. They render in
`#eng-initiatives`, not in the `#audit` filter list.

Use this JSON shape:

```jsonc
{
  "id": "ENG-001",
  "priority": "INITIATIVE",
  "category": "engineering",
  "track": "cicd | migration | automation | ai | third-party",
  "goal": "velocity | reliability | safety | reach",
  "evidence": "what exists today, with path:line",
  "enhancement": "the additive initiative in one sentence",
  "why_it_helps": "qualitative benefit",
  "non_breaking_reason": "what stays unchanged",
  "effort": "S | M",
  "value": "high | medium | low",
  "reuse_pattern": "existing pattern/module to copy, with path:line",
  "incremental_steps": ["small shippable step", "small shippable step"],
  "breaking": false,
  "confidence": "high | medium | low"
}
```

Add `summary.counts.engineering_initiative`. Feature initiatives keep
`summary.counts.initiative`; both flavors share `priority: "INITIATIVE"`. Do not
fabricate usage, latency, incident, engagement, or cost numbers. If a measured number
does not exist in the repo, describe only qualitative benefit.

## Output of this phase

- Engineering-initiatives section HTML for `index.html`.
- `engineering-initiatives.md` (quick wins, initiatives by track, out-of-scope list).
- Engineering initiative entries folded into `data/audit-findings.json.findings`
  (`priority: "INITIATIVE"`, `category: "engineering"`, `breaking: false`, IDs
  `ENG-###`).
