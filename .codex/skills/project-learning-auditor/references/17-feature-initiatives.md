# 17 — Feature enhancement initiatives (non-breaking, low-complexity wins)

Produce a static, evidence-grounded **initiative backlog**: for features that already
exist and work, propose small, safe enhancements that make them **more effective,
more useful, or better at retaining users** — *without* a breaking change and
*without* large complexity. This is not a redesign and not a risk audit: it is the
"safe wins" lens.

This section sits beside the optimization and UI/UX audits and answers a different
question:

- Optimization (§15) — "is it fast?"
- UI/UX (§16) — "does it feel safe and clear while I interact?"
- Best-practices audit (§08) — "is it wrong or risky?"
- **Feature initiatives (this phase) — "this feature works; how do we make it more
  useful, more effective, or stickier — cheaply and without breaking anything?"**

Do **not** run the app, build, deploy, or install. Infer only from scanned files,
config, dependencies, and confirmed source reads. When evidence is absent, write
`Not detected from current files.`

## The three hard constraints (every initiative MUST satisfy all three)

An item only belongs in this section if it is:

1. **Non-breaking — additive only.** No removed or renamed public fields/routes/
   GraphQL types, no changed function/resolver signatures, no new *required* inputs,
   no data migration that invalidates existing data, no behavior change for existing
   callers. New *optional* inputs, new screens/columns/filters, new derived views,
   new side-effects that reuse existing infra — all fine. If shipping it would force
   any current client (mobile, admin, super-admin) to change to keep working, it is
   **not** an initiative.
2. **Low complexity — builds on what exists.** It extends an existing implementation
   and follows the existing pattern in that layer/feature; small surface area; sized
   **S** (a few hours) or **M** (a day or two). Anything **L** — a new subsystem,
   schema/contract change, migration, new auth model, framework swap, or broad
   refactor — is **out of scope**. List those briefly under "Out of scope (bigger
   bets)" and move on; never dress a large/breaking change up as an initiative.
3. **Grounded in an existing feature.** Cite the real `path:line` of the feature you
   are enhancing. This is an *enhancement*, not a greenfield proposal — there must be
   a working implementation to point at. If nothing comparable exists, say
   `Not detected from current files.` and do not invent a feature.

If an idea is valuable but fails (1) or (2), it is a roadmap item, not an initiative.
Record it in one line under "Out of scope (bigger bets)" so the value is captured
without polluting the safe-wins list.

If an idea fails this section because it is platform work — CI/CD, migration
discipline, automation, AI, or third-party integration — route it to §19 Engineering
initiatives instead of burying it here. Keep this section's bigger-bets list for
genuinely `L`/breaking feature items.

## Goal of each initiative (tag exactly one primary goal)

| Goal | What it improves | Examples |
|---|---|---|
| `effectiveness` | The feature does its existing job better/more reliably | sensible default sort, remembered last filter, debounced search, optimistic update so a result feels instant |
| `usefulness` | The feature delivers more value from data/capability it already has | add a filter/column/search to a list that already paginates, export/share what's already shown, a count/summary badge, surface an existing admin datum read-only to residents |
| `retention` | Brings users back / keeps them engaged / reduces silent drop-off | re-engagement push reusing the existing push module, reminder/digest email reusing the existing mail module, profile/onboarding-completion nudge, empty-state CTA that pulls the user toward value, notification preferences so users stay opted in |
| `adoption` | Lowers the barrier to start using the feature | prefilled tenant/context, inline first-run hint, i18n string coverage so a feature works in `tl` as well as `en` |

`retention` is a first-class goal here, especially for the resident **mobile app**:
the platform already has Expo push notifications (`modules/push-notifications`),
Brevo email (`modules/mail`), and scheduled jobs (`@nestjs/schedule` +
`scheduler-locks`). Most retention wins are **reuse**, not new infra — fire an
existing channel on an event that currently goes unnoticed, or add a gentle reminder
through a scheduler that already exists. Always keep it opt-in/respectful (honor
existing notification preferences; never propose spam) and non-breaking.

## Inputs

- `data/manifest.json` — the file/module/route/screen inventory,
  `signals.dependencies`, `signals.markers`, `signals.scripts`, and `audit_signals`.
  Use it to enumerate what features already exist (API modules under
  `modules/*`, admin routes under `app/**`, mobile screens under `app/(main)/**`,
  i18n locale files, the push/mail/scheduler modules).
- Confirmed source reads for every initiative — open the cited file before proposing.
- Content already generated by the architecture, frontend, backend, database, and
  full-stack-flow phases (so initiatives line up with how the app really works).

## What to look for (grounded in this repo's domain)

- **Surface existing data better (`usefulness`).** A list/table that already does
  cursor pagination but has no filter/sort/search or a useful column; a detail view
  that hides a field the operator needs; data the admin sees that residents could
  safely see read-only. The repo recently added pagination + sorting for admin
  accounts/barangays — extending that to other already-paginated lists is the
  canonical S-sized, non-breaking win.
- **Reuse an existing channel for retention (`retention`).** An event that fires an
  in-process/Kafka event or writes a record but sends **no** push/email, where a
  notification would bring the resident back (e.g. a new announcement, a poll opening
  or closing soon, a request status change). Reuse `modules/push-notifications` /
  `modules/mail`; gate behind existing preferences; make it additive.
- **Gentle reminders via an existing scheduler (`retention`).** A time-bound feature
  (poll deadline, document/request follow-up) where a `@nestjs/schedule` reminder —
  coordinated through the existing `scheduler-locks` so only one instance fires —
  would re-engage users. Only if a scheduler pattern already exists to copy.
- **Additive form field (`usefulness`/`effectiveness`).** An *optional* field on an
  existing form + schema (Zod/class-validator) that captures something useful, with no
  change to required inputs and no migration of existing rows.
- **Derived convenience (`effectiveness`).** A computed badge/summary/last-updated/
  unread-count from data already loaded — no new query needed, or a cheap one.
- **Sensible defaults & remembered choices (`effectiveness`/`adoption`).** Default
  sort, remembered last filter, prefilled current tenant, remember-me — additive,
  improves day-to-day use.
- **Caching/freshness that makes a feature feel alive (`effectiveness`).** Add
  `staleTime`/invalidation to a TanStack Query hook so the feature reflects changes
  immediately after a mutation (overlaps optimization §15, but framed as
  "the feature feels more responsive/trustworthy"). Cross-reference, don't duplicate.
- **i18n coverage (`adoption`).** A feature shipped with `en` strings but missing the
  `tl` equivalents (admin `next-intl`, mobile `i18next`) — additive, widens reach.
- **Safety/undo affordance that makes a feature nicer (`usefulness`).** A confirm +
  brief undo, or a non-destructive dry-run, on a feature people hesitate to use.
- **Export/share (`usefulness`).** CSV/print/share of a list the feature already
  renders, when the data is already on the client.

**Every idea must be confirmed by opening the cited file.** If the enhancement
already exists, drop it (or move it to Strengths §08). If achieving it would require
a contract change or migration, move it to "Out of scope (bigger bets)".

## Finding format

For each initiative card, include:

- **Feature** — the existing feature being enhanced, with its real `path:line`.
- **Current capability** — what the feature does today (one line, grounded).
- **Initiative** — the additive enhancement, in one imperative sentence.
- **Goal** — one of `effectiveness`, `usefulness`, `retention`, `adoption`.
- **Why more useful / why it retains** — the concrete user or operator benefit. For
  `retention`, name *who* comes back and *what pulls them back*.
- **Why it is non-breaking** — the one sentence proving constraint (1): what stays
  unchanged for existing clients/data.
- **Effort** — `S` or `M` (never `L`; an `L` idea belongs in "Out of scope").
- **Value** — `high` · `medium` · `low` (expected user/operator impact).
- **Pattern to reuse** — the existing pattern/module this copies (e.g. "the
  pagination+sort pattern in the admin-accounts repository", "`modules/push-
  notifications` send path"), with `path:line`.
- **How to ship it incrementally** — 2–4 small steps, each shippable, scoped to the
  owning app/layer.
- **Confidence** — `high` · `medium` · `low`.

Rank initiatives by **value vs effort** — high-value/S first (the quick wins) — not
by severity. These are opportunities, not defects, so do **not** use P1/P2/P3 (those
mean problem-severity). Use the `INITIATIVE` label for all of them.

## HTML output

Add an `#initiatives` section **after** `#strengths` and **before** `#test`. Reuse
existing `.card`, `.grid`, `.stat`, `.code-old`, `.code-new`, and `.topic-chat`
classes, plus the badges added to the template for this section
(`.badge-initiative` for the headline label and `.badge-meta` for the goal/effort/
value/non-breaking chips). Do **not** add new scripts.

Suggested shape:

```html
<section id="initiatives">
  <h2><span class="num">§14</span> Feature enhancement initiatives</h2>
  <p class="lede">Safe wins for features that already work: small, non-breaking,
  low-complexity ways to make them more useful, more effective, or better at
  retaining users. Ranked by value vs effort — quick wins first. Each builds on an
  existing implementation; nothing here changes a contract or needs a migration.</p>
  <!-- PLA:INITIATIVES -->
</section>
```

Within a card, use a red **Current** panel (today's behavior) beside a green
**Enhanced** panel (the additive version) when a code sketch helps — keep the
"Enhanced" panel additive so the diff visibly preserves the old path. Show the
goal/effort/value/non-breaking as small `.badge-meta` chips in the card head, e.g.
`Goal: retention · Effort: S · Value: high · Non-breaking ✓`. Each initiative card
ends with its own `.topic-chat` box scoped to that card so the learner can ask how to
build that specific enhancement safely.

Lead the section with the highest-value, smallest-effort initiatives. If at least one
`retention` initiative exists, surface it prominently — retention wins are the easiest
to overlook and often the highest leverage on the resident mobile app.

## Markdown output

Write `feature-initiatives.md` with auto markers:

```markdown
<!-- pla:auto:start -->
## Quick wins (do first)
...top value-vs-effort initiatives, S-sized...
## Initiatives by goal
### Retention
### Usefulness
### Effectiveness
### Adoption
## Out of scope (bigger bets)
...one line each: valuable but breaking or L-sized; why it's parked...
<!-- pla:auto:end -->
```

Keep it actionable: quick wins first, then grouped by goal, then the parked
bigger-bets list so nothing valuable is lost.

## Integration with `audit-findings.json`

Fold initiatives into `data/audit-findings.json.findings` so they share the data file
(they render in `#initiatives`, not in the `#audit` filter list — like strengths).
Use `"priority": "INITIATIVE"`, `"category": "feature"`, and the optional initiative
fields:

```jsonc
{
  "id": "INI-001",
  "priority": "INITIATIVE",
  "category": "feature",
  "title": "Short imperative initiative title",
  "file": "apps/.../the-existing-feature.ts",
  "lines": "40-72",
  "goal": "effectiveness | usefulness | retention | adoption",
  "current": "what the feature does today (or a trimmed snippet, <>& escaped)",
  "enhancement": "the additive change in one sentence",
  "better": "trimmed additive snippet (optional)",
  "why_it_helps": "concrete user/operator benefit; for retention, who returns and why",
  "non_breaking_reason": "what stays unchanged for existing clients/data",
  "effort": "S | M",
  "value": "high | medium | low",
  "reuse_pattern": "existing pattern/module this copies, with path:line",
  "incremental_steps": ["step 1", "step 2", "step 3"],
  "breaking": false,
  "confidence": "high | medium | low"
}
```

Add an `initiative` count to `summary.counts` (so the dashboard can show
`💡 N initiatives`). `breaking` must always be `false` for items in this section; a
`true` would mean it does not belong here.

Do not fabricate usage numbers, churn rates, engagement metrics, or timings. If no
measured number exists in the repo, describe the qualitative benefit only.

## Output of this phase

- Feature-initiatives section HTML for `index.html`.
- `feature-initiatives.md` (quick wins, initiatives by goal, out-of-scope list).
- Initiative entries folded into `data/audit-findings.json.findings`
  (`priority: "INITIATIVE"`, `category: "feature"`, `breaking: false`).
