# 11 — Assemble `index.html`

Combine everything into the single, self-contained learning guide. This runs last.

## Inputs

- `assets/index-template.html` — the skeleton + inline CSS + placeholder markers.
- The content produced by phases 01–10.
- `data/audit-findings.json` — drives the summary counts and the audit/strength cards.

## Section order (must match the template)

1. **Header** — project title + one-line mental-model analogy + generation date.
2. **Summary dashboard** — stat cards: files scanned, architecture, apps detected,
   tech stack, frontend/backend/database patterns found, P1/P2/P3/STRENGTH counts,
   top-5 learning concepts, top-5 risks to fix first. Numbers come from
   `audit-findings.json.summary`.
3. **Mental model** (§01)
4. **Architecture** (§02) — parts list + end-to-end narration + layout diagram.
5. **Tech stack** (table: technology · where · what it does · why · analogy · related files)
6. **Frontend deep dive** (§03) — pattern cards. **Each card** ends with its own
   per-card AI tutor box (`.topic-chat` scoped to that card).
7. **Backend deep dive** (§04) — pattern cards. **Each card** ends with its own
   per-card AI tutor box.
8. **Database** (§05) — analogy + entities + relationships.
9. **Full-stack flows** (§06) — traces + embedded animated diagrams.
10. **Old vs modern** (§07) — red/green comparison blocks. **Each comparison card**
    ends with its own per-card AI tutor box.
11. **Best-practices audit** (§08) — filter chips + audit cards. **Each finding
    card** ends with its own per-card AI tutor box (strength cards don't need one).
12. **Strengths** (§08) — green strength cards. **Each strength card** ends with its
    own per-card AI tutor box.
13. **Comprehension test** (§10) — `<details>` answers + the AI "generate from this
    repo" control (`.test-gen`, wired to the proxy's `POST /generate`).
14. **Learning path** (§10) — ordered list.
15. **Topic deep dives** (§13 in the template) — leave the `<!-- PLA:TOPICS:* -->`
    region with its `.topics-empty` placeholder on a fresh full build. Topic
    sections are added later by append mode (`references/12-topic-deepdive.md`),
    not during full assembly.
16. **Footer** — generation date + "regenerate with the project-learning-auditor skill."

## Placeholder convention

The template uses HTML comment markers, one per section:

```html
<!-- PLA:SUMMARY -->        <!-- PLA:MENTAL_MODEL -->   <!-- PLA:ARCHITECTURE -->
<!-- PLA:TECH_STACK -->     <!-- PLA:FRONTEND -->        <!-- PLA:BACKEND -->
<!-- PLA:DATABASE -->       <!-- PLA:FLOWS -->           <!-- PLA:OLD_VS_NEW -->
<!-- PLA:AUDIT -->          <!-- PLA:STRENGTHS -->        <!-- PLA:TEST -->
<!-- PLA:LEARNING_PATH -->  <!-- PLA:DATE -->            <!-- PLA:TITLE -->
<!-- PLA:ANALOGY_ONELINE -->
```

Replace each marker with the generated HTML for that section. Leave the surrounding
template (CSS, layout, nav) untouched.

**Append-mode anchors (do not fill during full assembly):** the template also has
`<!-- PLA:TOPICS:start -->` / `<!-- PLA:TOPICS:end -->` (in §13) and
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
- [ ] Every Frontend/Backend pattern card, Old-vs-modern comparison, Best-practices
      finding card, and Strength card ends with its own per-card `.topic-chat` AI
      tutor box (unique slug, placed as the card's last child).
- [ ] The Test-yourself section keeps the `.test-gen` "generate from this repo"
      control after the static questions (wired to the proxy's `POST /generate`).
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
- `reference/project-learning-audit/tutor-server/` scaffolded from
  `assets/tutor-server/` (no `.env`, no key) — powers the section-scoped AI tutor
  boxes in the Frontend, Backend, and Best-practices-audit sections.
