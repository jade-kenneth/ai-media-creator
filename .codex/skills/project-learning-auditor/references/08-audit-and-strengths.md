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

## What to check (cross-reference `manifest.audit_signals`, then confirm in-file)

- Missing authorization checks (`resolver_no_guard` — confirm no global guard)
- Tenant boundary leaks (queries without `barangayId`/`tenantId` scope)
- Duplicate background jobs / schedulers without locking
- Unsafe `setInterval`/`setTimeout` (`timer_no_cleanup`)
- Missing cleanup in effects/listeners/timers (`effect_no_cleanup`)
- N+1 queries (`possible_n1_query`)
- Missing validation (`possible_missing_validation`)
- Weak error handling
- Missing loading / error states in the UI
- Hardcoded secrets (`hardcoded_secret_shape` — cite location + kind, never value)
- State-reset bugs (stale state across mount/unmount)
- Overfetching
- Unnecessary rerenders
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
    "counts": { "P1": 0, "P2": 0, "P3": 0, "strength": 0 },
    "top_concepts": ["...five learning concepts..."],
    "top_risks": ["...five risks to fix first..."]
  },
  "findings": [
    {
      "id": "AUD-001",
      "priority": "P1 HIGH | P2 MEDIUM | P3 LOW | STRENGTH",
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
      "confidence": "high | medium | low"
    }
  ]
}
```

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
