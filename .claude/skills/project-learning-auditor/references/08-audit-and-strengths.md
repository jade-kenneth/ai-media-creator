# 08 — Audit & strengths

Audit the project for best practices and risks, and call out strengths worth
copying. This phase writes `data/audit-findings.json` (which drives the audit and
strengths sections of `index.html`) plus the markdown companions.

## Priority vocabulary (exact labels)

| Label | Meaning |
|---|---|
| `P1 HIGH` | Security issues, data leaks, duplicate actions, broken core flows, serious production bugs. |
| `P2 MEDIUM` | Maintainability, performance, UX, reliability, or scaling issues. |
| `P3 LOW` | Small cleanup, consistency, readability, or learning improvement. |
| `STRENGTH` | Good implementation worth copying elsewhere. |
| `INITIATIVE` | A safe, non-breaking, low-complexity opportunity. Feature initiatives use `INI-###`, category `feature`, and render in `#initiatives` (§17). Engineering initiatives use `ENG-###`, category `engineering`, a `track`, and render in `#eng-initiatives` (§19). Both are ranked by value vs effort, not severity, and never render in the risk audit. |

Priority is the **severity**; it never changes once assigned. Whether a finding is
still open is a separate **status** (`open` / `fixed`). A resolved finding keeps its
original priority and stays on the page marked **FIXED** — see "Fixed findings stay
visible" below. Never delete or hide a fixed finding.

## What to check (cross-reference `manifest.audit_signals`, then confirm in-file)

- Missing authorization checks (`resolver_no_guard` — confirm no global guard)
- Tenant boundary leaks (queries without `barangayId`/`tenantId` scope)
- Duplicate background jobs / schedulers without locking
- Unsafe `setInterval`/`setTimeout` (`timer_no_cleanup`)
- Missing cleanup in effects/listeners/timers (`effect_no_cleanup`)
- N+1 queries (`possible_n1_query`)
- Missing validation (`possible_missing_validation`)
- Weak error handling
- Missing loading / error states in the UI (cross-reference `references/16-uiux-audit.md`)
- In-flight action safety: submit/auth/pay/delete buttons that show a spinner but are
  not `disabled` while pending, allowing double-submit / spam clicks
  (`button_no_pending_disable`; cross-reference `references/16-uiux-audit.md`)
- Accessibility gaps: icon-only controls with no `aria-label`/`accessibilityLabel`
  (`interactive_no_a11y_label`; cross-reference `references/16-uiux-audit.md`)
- Hardcoded secrets (`hardcoded_secret_shape` — cite location + kind, never value)
- State-reset bugs (stale state across mount/unmount)
- Overfetching
- Unnecessary rerenders
- Bundle-size and startup risks (cross-reference `references/15-optimization-audit.md`)
- API/GraphQL/database optimization risks (pagination, N+1, unbounded queries,
  await waterfalls; cross-reference `references/15-optimization-audit.md`)
- Unsafe file upload handling
- Missing rate limits
- Missing indexes
- Poor caching strategy
- Production deployment risks

**Every heuristic must be confirmed by opening the cited file.** If the guard is
applied globally, downgrade or drop the finding. Confidence is `low` when the
finding rests on a heuristic you could not fully confirm.

## `data/audit-findings.json` schema

```jsonc
{
  "generated_at": "ISO-8601",
  "summary": {
    "files_scanned": 1171,
    "apps_detected": ["mobile", "admin", "api"],
    "tech_stack": ["NestJS", "GraphQL", "Mongoose", "Next.js", "React Native", "Expo", "TanStack Query", "Tailwind/NativeWind"],
    "frontend_patterns_found": 0,
    "backend_patterns_found": 0,
    "database_patterns_found": 0,
    "counts": { "P1": 0, "P2": 0, "P3": 0, "strength": 0, "initiative": 0, "engineering_initiative": 0, "fixed": 0 },
    "top_concepts": ["...five learning concepts..."],
    "top_risks": ["...five risks to fix first..."]
  },
  "findings": [
    {
      "id": "AUD-001",
      "priority": "P1 HIGH | P2 MEDIUM | P3 LOW | STRENGTH | INITIATIVE",
      "title": "Short imperative title",
      "file": "apps/brgy-system-api/src/modules/x/x.resolver.ts",
      "lines": "120-138",
      "why_it_matters": "plain-English impact",
      "analogy": "real-world analogy",
      "current": "trimmed code snippet, secrets stripped, <>& escaped when rendered",
      "better": "trimmed improved snippet",
      "risk_if_ignored": "what breaks / leaks",
      "suggested_fix": "concrete next step",
      "related_best_practice": "the rule this reinforces",
      "category": "security | reliability | maintainability | optimization | ux | data-integrity | feature",
      "track": "cicd | migration | automation | ai | third-party (engineering INITIATIVE only)",
      "optimization_area": "web-bundle | mobile-startup | api-graphql | database | cache-network | assets | build-ci",
      "uiux_area": "interaction-safety | loading-states | error-empty-states | feedback-confirmation | accessibility | forms-validation | responsiveness",
      "how_to_confirm": "for optimization/ux findings: smallest measurement command or manual check",
      "status": "open | fixed",
      "fixed_at": "ISO date the fix was confirmed (only when status=fixed)",
      "fixed_evidence": "path:line proving the fix (only when status=fixed)",
      "fixed_note": "one line: what changed (only when status=fixed)",
      "became_strength_id": "STR-xxx if the fix is now a strength worth copying (optional)",
      "goal": "effectiveness | usefulness | retention | adoption (feature INITIATIVE only) OR velocity | reliability | safety | reach (engineering INITIATIVE only)",
      "evidence": "current evidence with path:line (engineering INITIATIVE only)",
      "effort": "S | M (INITIATIVE only — never L)",
      "value": "high | medium | low (INITIATIVE only)",
      "breaking": "false (INITIATIVE only — must always be false)",
      "enhancement": "the additive change in one sentence (INITIATIVE only)",
      "non_breaking_reason": "what stays unchanged for existing clients/data (INITIATIVE only)",
      "reuse_pattern": "existing pattern/module this copies, with path:line (INITIATIVE only)",
      "incremental_steps": ["small shippable steps (INITIATIVE only)"],
      "confidence": "high | medium | low"
    }
  ]
}
```

`category`, `optimization_area`, `uiux_area`, and `how_to_confirm` are optional for
older findings, but use `optimization_area` for new optimization findings and
`uiux_area` (with `category: "ux"`) for new UI/UX findings. Do not invent measured
bundle sizes, API latency, database latency, or Lighthouse scores.

Feature `INITIATIVE` findings use IDs `INI-###`, `category: "feature"`,
`breaking: false`, and the initiative fields
(`goal`/`effort`/`value`/`enhancement`/`non_breaking_reason`/`reuse_pattern`/
`incremental_steps`). They are produced by the feature-initiatives phase
(`references/17-feature-initiatives.md`) and render in the `#initiatives` section,
not the `#audit` filter list — they never appear under a P1/P2/P3 chip.

Engineering `INITIATIVE` findings use IDs `ENG-###`, `category: "engineering"`,
`track`, engineering `goal`, `evidence`, and the same shared fields. They are
produced by `references/19-engineering-initiatives.md` and render in
`#eng-initiatives`, not the `#audit` filter list. They share the same findings and
history file. When a shipped engineering initiative is confirmed, follow the same
FIXED mechanics below: keep the card visible, add the green badge and `.fix-note`,
and cite the proving `path:line`; for initiative cards, read **FIXED** as
**SHIPPED**.

## Audit card (rendered in `index.html` from each finding)

Each card shows: priority badge · title · `file:lines` · why it matters · analogy
· red **Current** panel vs green **Better** panel · risk if ignored · suggested fix
· related best practice · confidence. Use the template classes
`.badge-p1/.badge-p2/.badge-p3/.badge-strength`, `.code-old`, `.code-new`.

Each finding card (`.card.audit.<p1|p2|p3>`) ends with its **own** AI tutor box,
scoped to that single finding, so the learner can interrogate *this exact risk* in a
continuous conversation. Add it as the **last child inside** the finding's
`.card.audit` div (so `box.closest('.card')` grounds the tutor in that one finding).
Reuse existing classes — no new CSS/script. See `references/12-topic-deepdive.md`.

```html
<div class="topic-chat" data-topic-slug="<finding-slug>" data-topic-title="<Finding title>">
  <div class="chat-head"><h3>Ask the AI tutor about this</h3><span class="ai-status">tutor offline</span></div>
  <div class="chat-log" aria-live="polite"></div>
  <form class="chat-form">
    <input class="chat-input" type="text" autocomplete="off" aria-label="Ask the AI tutor about <Finding title>" placeholder="Ask about “<Finding title>”…" />
    <button class="chat-send" type="submit">Send</button>
  </form>
  <p class="chat-hint">Topic-scoped chat (OpenCode Zen). Needs the local tutor: <code>cd reference/project-learning-audit/tutor-server &amp;&amp; npm start</code>.</p>
  <noscript>The AI tutor needs JavaScript.</noscript>
</div>
```

`<finding-slug>` = kebab-case of the finding title, unique on the page. Escape `<`,
`>`, `&`, `"` in the title attribute.

## Fixed findings stay visible — never hide them

When a prior finding has been resolved in the code (`status: "fixed"`), **keep its
card in the audit list**. Do **not** delete it and do **not** collapse it into a
single "Resolved since …" summary box — a learner should still see what the problem
was, and that it is now handled. Mark it fixed instead of hiding it:

- Give the card the extra `fixed` class: `class="card audit <p1|p2|p3> fixed"`
  (keep the original priority class so the priority filter still finds it).
- In the `.head`, show a green **FIXED** badge **before** the original priority badge,
  and add the `badge-was` class to the original priority badge so it renders
  struck-through: it reads "this *was* a P2, now fixed".
- Keep the original body (why it matters, Current/Better, etc.) so the lesson
  survives, and add a `.fix-note` line: **what changed**, the `path:line` that proves
  it (`fixed_evidence`), the date (`fixed_at`), and a link to the resulting strength
  (`#strengths`) if `became_strength_id` is set.
- Keep the per-finding AI tutor box.

```html
<div class="card audit p2 fixed">
  <div class="head">
    <span class="badge badge-fixed">✅ Fixed</span>
    <span class="badge badge-p2 badge-was">P2 MEDIUM</span>
    <h3>Original finding title</h3>
    <span class="conf">confidence: high</span>
  </div>
  <p class="file-ref">apps/.../where-it-was.ts:120-138</p>
  <!-- original why/analogy/Current/Better body stays here -->
  <p class="fix-note"><strong>✅ Fixed 2026-06-28:</strong> what changed, proven at
    <span class="file-ref">apps/.../the-fix.ts:28-29</span>. Now copied as
    <a href="#strengths">STR-006</a>.</p>
  <!-- per-finding .topic-chat box stays here -->
</div>
```

The `.badge-fixed`, `.badge-was`, `.card.audit.fixed`, and `.fix-note` styles already
ship in `assets/index-template.html` — reuse them, add no new CSS/script. The audit
section's filter chips include a **✅ Fixed** chip (`data-filter="fixed"`) that the
existing class-based filter script already drives, so learners can isolate fixed
findings; the priority chips still include them under their original priority.

In `summary.counts`, the P1/P2/P3 badges count **open** findings (so the dashboard
shows current severity, not a misleading "P1 · 1" for something already resolved).
Fixed findings are surfaced as a **separate tally** — the summary's "✅ N fixed" line
— and still appear as cards in the list, tagged FIXED. Never drop a fixed finding off
the page; it just moves from a priority count to the fixed tally. `INITIATIVE`
findings are likewise their **own tally** — the summary's "💡 N initiatives" line
(`counts.initiative`) — and engineering initiatives get their own separate tally
(`counts.engineering_initiative`). Neither is counted under P1/P2/P3 because they
are opportunities, not severities. See `references/17-feature-initiatives.md` and
`references/19-engineering-initiatives.md`.

The **strength cards** (§10) get the same per-card tutor box (as the last child
inside each `.card.audit.strength`), titled from the strength's heading — so a
learner can ask "why is this good, and where else should I copy it?".

## Strength cards

For `STRENGTH` findings, frame positively: what is good · why it is good · where it
appears · what beginner concept it teaches · when to copy this pattern. Look for
genuine strengths the scan supports, e.g.:
- Schema validation before submit (`Recommended` pattern done right)
- Generated GraphQL types/hooks (type safety end to end)
- Batch loading to avoid N+1 (the repo's batch-loading work)
- Scheduler lock service (if present) preventing duplicate jobs

## Markdown companions

- `audit-report.md` — all findings grouped by priority (auto-region markers).
- `best-practices.md` — the reference table of best-practice rules + where the
  project follows them (link to STRENGTH findings).
- `risky-patterns.md` — the P1/P2 risks with fixes.

## Rules

- No finding without a real `path:line`.
- Never paste a secret value; for `hardcoded_secret_shape`, describe the kind and
  location and recommend moving it to env/secret storage.
- Balance the report: include real strengths, not only problems.

## Output of this phase

- `data/audit-findings.json` (drives the HTML).
- `audit-report.md`, `best-practices.md`, `risky-patterns.md`.
