# 11 — Assemble `index.html`

Combine everything into the single, self-contained learning guide. This runs last.

## Inputs

- `assets/index-template.html` — the skeleton + inline CSS + placeholder markers.
- The content produced by phases 01–19.
- `data/audit-findings.json` — drives the summary counts and the audit/strength cards.

## Section order (must match the template)

1. **Header** — project title + one-line mental-model analogy + generation date.
2. **Summary dashboard** — stat cards: files scanned, architecture, apps detected,
   tech stack, frontend/backend/database patterns found, P1/P2/P3/STRENGTH counts,
   top-5 learning concepts, top-5 risks to fix first. Numbers come from
   `audit-findings.json.summary`.
3. **Mental model** (§01)
4. **Architecture** (§02) — parts list + end-to-end narration + layout diagram.
5. **Tech stack** (§13) — overview table (technology · layer · where configured ·
   what it does · why · analogy · related files) **then** one per-technology
   deep-dive card per core tech (**each ends with its own per-card AI tutor box**)
   **then** a "how the stack connects" `.flow` strip.
6. **JavaScript fundamentals** (§14) — core-topics table (variables, objects,
   arrays, functions, async, etc.) + a few grouped explainer cards + **one**
   section-level AI tutor box (not inside a card). Core topics only.
7. **Frontend deep dive** (§03) — pattern cards. **Each card** ends with its own
   per-card AI tutor box (`.topic-chat` scoped to that card).
8. **Backend deep dive** (§04) — pattern cards. **Each card** ends with its own
   per-card AI tutor box.
9. **Database** (§05) — analogy + entities + relationships.
10. **Full-stack flows** (§06) — traces + embedded animated diagrams.
11. **Old vs modern** (§07) — red/green comparison blocks. **Each comparison card**
    ends with its own per-card AI tutor box.
12. **Optimization audit** (§15) — static bundle/API/database/caching/assets/build
    scorecard + cards. **Each optimization card** ends with its own per-card AI
    tutor box. Use no measured byte/latency numbers unless they exist in repo
    artifacts; otherwise include "how to confirm" commands.
13. **UI/UX audit** (§16) — interaction-safety (double-submit / spam clicks), loading
    and disabled states, error and empty states, feedback/confirmation, accessibility,
    forms, and responsiveness scorecard + cards. Lead with any double-submit finding.
    **Each UI/UX card** ends with its own per-card AI tutor box. No screenshots or
    measured numbers; include "how to confirm" manual checks.
14. **Best-practices audit** (§08) — filter chips + audit cards. **Each finding
    card** ends with its own per-card AI tutor box (strength cards don't need one).
15. **Strengths** (§08) — green strength cards. **Each strength card** ends with its
    own per-card AI tutor box.
16. **Feature enhancement initiatives** (§17) — safe, non-breaking, low-complexity
    enhancements to existing features (goal: effectiveness / usefulness / retention /
    adoption), ranked by value vs effort with quick wins first; surface any retention
    initiative prominently. `.badge-initiative` + `.badge-meta` chips; optional
    Current/Enhanced (additive) panels. **Each initiative card** ends with its own
    per-card AI tutor box. No fabricated usage/engagement numbers.
17. **Engineering & platform initiatives** (§19) — safe, non-breaking, low-complexity
    platform initiatives across CI/CD, migrations, automation, AI, and third-party
    integrations. Group by track, lead with quick wins, cite evidence `path:line`,
    show track/goal/effort/value/non-breaking chips, park bigger bets, and give each
    card a per-card AI tutor box. No fabricated metrics.
18. **Comprehension test** (§10) — `<details>` answers + the AI "generate from this
    repo" control (`.test-gen`, wired to the proxy's `POST /generate`).
19. **Learning path** (§10) — ordered list.
20. **Topic deep dives** (§18 in the template) — leave the `<!-- PLA:TOPICS:* -->`
    region with its `.topics-empty` placeholder on a fresh full build. Topic
    sections are added later by append mode (`references/12-topic-deepdive.md`),
    not during full assembly.
21. **Footer** — generation date + "regenerate with the project-learning-auditor skill."

## Placeholder convention

The template uses HTML comment markers, one per section:

```html
<!-- PLA:SUMMARY -->        <!-- PLA:MENTAL_MODEL -->   <!-- PLA:ARCHITECTURE -->
<!-- PLA:TECH_STACK -->     <!-- PLA:JS_FUNDAMENTALS --> <!-- PLA:FRONTEND -->
<!-- PLA:BACKEND -->        <!-- PLA:DATABASE -->        <!-- PLA:FLOWS -->
<!-- PLA:OLD_VS_NEW -->     <!-- PLA:OPTIMIZATION -->    <!-- PLA:UIUX -->
<!-- PLA:AUDIT -->          <!-- PLA:STRENGTHS -->       <!-- PLA:INITIATIVES -->
<!-- PLA:ENG_INITIATIVES --> <!-- PLA:TEST -->           <!-- PLA:LEARNING_PATH -->
<!-- PLA:DATE -->           <!-- PLA:TITLE -->           <!-- PLA:ANALOGY_ONELINE -->
```

Replace each marker with the generated HTML for that section. Leave the surrounding
template (CSS, layout, nav) untouched.

**Append-mode anchors (do not fill during full assembly):** the template also has
`<!-- PLA:TOPICS:start -->` / `<!-- PLA:TOPICS:end -->` (in the §18 Topic deep dives
section) and
`<!-- PLA:TOPIC_NAV:start -->` / `<!-- PLA:TOPIC_NAV:end -->` (in the nav). These
are insertion points for topic deep dives added later (see
`references/12-topic-deepdive.md`). On a full build, leave them with their
placeholder content intact.

## Self-contained checklist (verify before finishing)

- [ ] Exactly one `<style>` block in `<head>`; no `<link rel=stylesheet>`, no CDN.
- [ ] No external scripts; at most one tiny inline `<script>` for audit filter chips.
- [ ] Page is fully readable with JavaScript disabled.
- [ ] System font stack only (no network font).
- [ ] All diagrams animate via CSS `@keyframes`.
- [ ] Comprehension answers use `<details>/<summary>`.
- [ ] The Tech-stack section has an overview table + a per-technology deep-dive card
      per core tech (each ending in its own per-card `.topic-chat`) + a "how the
      stack connects" `.flow` strip. (`references/13-tech-stack.md`.)
- [ ] The JavaScript-fundamentals section covers the core topics (variables,
      objects, arrays, functions, async, etc.) grounded in real `path:line`, and
      ends with ONE section-level `.topic-chat` (not inside a card).
      (`references/14-js-fundamentals.md`.)
- [ ] Every Frontend/Backend pattern card, Tech-stack deep-dive card, Old-vs-modern
      comparison, Best-practices finding card, Strength card, and Feature-initiative
      card ends with its own per-card `.topic-chat` AI tutor box (unique slug, placed
      as the card's last child).
- [ ] The Optimization-audit section exists before Best-practices audit, covers
      bundle size, mobile startup, API/GraphQL, database, caching/network, assets,
      and build/CI where detected, and every claim cites a real `path:line` or says
      `Not detected from current files.` (`references/15-optimization-audit.md`.)
- [ ] The UI/UX-audit section exists after Optimization and before Best-practices,
      covers interaction safety (double-submit / spam clicks), loading and disabled
      states, error and empty states, feedback, accessibility, and forms where
      detected, leads with any double-submit finding, and every claim cites a real
      `path:line` or says `Not detected from current files.`
      (`references/16-uiux-audit.md`.)
- [ ] The Feature-enhancement-initiatives section (`#initiatives`) exists after
      Strengths and before Test yourself, and every item is **non-breaking**
      (`breaking: false`), **low-complexity** (effort `S`/`M`, never `L`), and
      grounded in an existing feature's real `path:line` (no greenfield proposals).
      Items are ranked by value vs effort (quick wins first) with goal/effort/value/
      non-breaking shown as `.badge-meta` chips, and at least one `retention`
      initiative is surfaced when one exists. Anything breaking or `L`-sized is parked
      under "Out of scope (bigger bets)", not listed as an initiative. Each card cites
      a real `path:line` or says `Not detected from current files.`
      (`references/17-feature-initiatives.md`.)
- [ ] The Engineering & platform initiatives section (`#eng-initiatives`) exists
      after `#initiatives` and before Test yourself. Cards carry track/goal/effort/
      value/non-breaking `.badge-meta` chips, cite real `path:line` evidence or say
      `Not detected from current files.`, park breaking/`L` work under bigger bets,
      and end with per-card `.topic-chat` boxes. Counts match
      `audit-findings.json.summary.counts.engineering_initiative`.
      (`references/19-engineering-initiatives.md`.)
- [ ] Fixed findings are **shown, not hidden**: every resolved finding keeps its
      `.card.audit.<priority>.fixed` card (no deletion, no "Resolved" summary box),
      with a green FIXED badge beside its struck-through original priority badge and a
      `.fix-note` citing the `path:line` of the fix. The audit filter chips include a
      ✅ Fixed chip. (`references/08-audit-and-strengths.md`.)
- [ ] The Test-yourself section keeps the `.test-gen` "generate from this repo"
      control after the static questions (wired to the proxy's `POST /generate`).
- [ ] If the guide includes a repo-wide voice-output assistant (for example
      J.A.R.V.I.S. using browser speech synthesis), its default voice is UK English
      male when available. Rank `en-GB` / UK / British voices first, prefer likely
      male names (Daniel, Arthur, George, Ryan, Oliver, Jamie, Thomas, Guy, or
      "male"), fall back to high-quality neural/natural English voices, and do not
      override the user's manual voice choice after they select one.
- [ ] If the guide includes browser speech recognition, the microphone button's
      active state follows the user's listening session, not raw
      `SpeechRecognition.onstart` / `onend` callbacks. Browser-internal recognition
      restarts must not make the button or laptop mic/privacy indicator flicker
      on/off nonstop. Do not auto-reopen recognition after `onend`; use one browser
      recognition session per click, with `continuous = true` so a short pause does
      not end the user's turn. When the session ends with text, wait about 3 seconds
      before submitting so the assistant does not interrupt a continuing thought; if
      the user taps the mic again during that grace period, cancel the pending answer
      and preserve the transcript. Browser `onend` and silence timeout paths both
      use the grace delay; only an explicit second mic click may submit immediately.
      Clear the active UI immediately on explicit stop.
- [ ] If the guide includes a repo-wide technical interview mode, every post-answer
      feedback card includes a compact on-screen visual map of the model answer
      (3-7 lines of ASCII flow/layer/responsibility mapping grounded in repo files
      and patterns). Do not read diagrams aloud in the spoken answer.
- [ ] `reference/project-learning-audit/tutor-server/` is scaffolded from
      `assets/tutor-server/` (server + `package.json` + `.env.example` + `.gitignore`
      + `README.md`) — and **no `.env` / key was written**. An existing one is left
      untouched.
- [ ] Every audit card, pattern card, and flow step cites a real `path:line`
      (or says `Not detected from current files.`).
- [ ] Code samples escape `<`, `>`, `&`; no secret values present.
- [ ] Summary counts equal the counts in `data/audit-findings.json`.
- [ ] Generation date stamped in header + footer.

## Idempotency

`index.html` is fully regenerated each run (no user-edited regions inside it).
The markdown companions keep user notes via `<!-- pla:auto:start -->` /
`<!-- pla:auto:end -->` markers — refresh only between them.

## Final report (to the user, after writing)

State: files scanned, apps/stack detected, counts (P1/P2/P3/strength), what was
`Not detected from current files.`, and how many files were skipped as sensitive
(by count, never by value). Point them at `reference/project-learning-audit/index.html`.

## Output of this phase

- `reference/project-learning-audit/index.html` (the required deliverable).
- `reference/project-learning-audit/optimization-report.md` (optimization scorecard,
  findings, and how-to-measure-next notes).
- `reference/project-learning-audit/uiux-report.md` (UI/UX scorecard, findings, and
  how-to-verify-next notes).
- `reference/project-learning-audit/feature-initiatives.md` (quick wins, initiatives
  grouped by goal, and the parked "Out of scope (bigger bets)" list).
- `reference/project-learning-audit/engineering-initiatives.md` (quick wins,
  initiatives grouped by track, and the parked "Out of scope (bigger bets)" list).
- `reference/project-learning-audit/tutor-server/` scaffolded from
  `assets/tutor-server/` (no `.env`, no key) — powers the section-scoped AI tutor
  boxes in the Frontend, Backend, and Best-practices-audit sections.
