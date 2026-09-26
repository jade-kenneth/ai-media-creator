# Design request: AI Creation Platform — Story episodes

**Mode:** prompt only. **Addressed to:** the implementer in this repository. Nothing is sent to Claude Design and no prototypes are exported. **Raised and carried out:** 2026-09-27 by `/generate-design-request`. Supersedes the carried-out short Story detail request from 2026-09-27; that scope remains in Design Reference §5.17 (R30).

This request continues the existing AI Creation Platform design. A story no longer stops at one 4–6 scene video: it continues as episodes, each its own story project and video, until the creator marks one final.

---

## Continuation contract

- The established design system (`design/system/`), tokens, voice, recorded UI skills and the [Design Reference](handoff/AI%20Creation%20Platform%20Design%20Reference.md) remain authoritative.
- Revise only `story-setup` (§5.17) and the story variants of `project-workflow` (§4), `dashboard` (§5.3), `script-studio` (§5.8), `creator-brief` (§5.9) and `scene-editor` (§5.14). Every Affiliate Studio screen, and Episode 1's prompts and outputs, stay unchanged.
- Reuse the existing card, list-row, number tile, badge, radio-card, Switch, autosave, paid-job, toast and banner patterns. Add no component or token.
- Every data-backed behavior maps to the repository's GraphQL + codegen + TanStack Query, autosave, text-generation job, assets and repository patterns. No mock data, fake persistence, placeholder handlers, credentials or production data.

## Requested designs

### Story step: episodes (revision)

- **Screen:** `story-setup` · responsive web at 390px and 1440px. **Section:** Design Reference §5.17 (“Episodes”). **Defined by:** Product Specification §3.25 and R31.
- **Blocked work:** Implementation Plan Phase 33 (web Story step, Fidelity QA).
- Episodes card (list, Show all, Next episode / Open episode N, four disabled reasons, creating, failed); Previously card (series premise, how the previous episode ended); Genre and Format locked on episode 2+; “What happens next” premise-card variant with three episode ideas or Write my own; Cast copy line; Ending card with the Final episode switch and its disabled rule; footer reason; keyboard order and 390px behavior; every episode state.

### Shared surfaces: episode variants (revision)

- **Screens:** `project-workflow` §4 (rail subject line “Comedy · Episode 2 of 3”), `dashboard` §5.3 (“Ep 2” badge; duplicating an episode makes a standalone story), `script-studio` §5.8 (Ending label and caption; stale-continuity note), `creator-brief` §5.9 (`Episode: 2 of 3`), `scene-editor` §5.14 (end line prefill “Episode N next”).
- **Blocked work:** Implementation Plan Phase 33 (web shared surfaces, brief, Fidelity QA).

## Product decisions

- **R31 (product owner, 2026-09-27, approved as recommended):** E1–E10 in Product Specification §3.25. Each episode is one project and one 30–60 s video; Next episode is free, linear and only from the latest approved episode; genre, format, cast and Keep consistent items are copied; continuity reaches the model through recaps written by the next episode's script job and the previous episode in full; a Final episode ends the story, and Episode 1 always ends on a cliffhanger; at most 50 episodes per series.
- Chosen defaults within the approved decisions: the Episodes card shows once a story has an approved version or its series has 2+ episodes, with up to 6 rows before Show all. Episode ideas use only the current cast. The end line prefill happens once, on the first switch-on.

## Specification requirements

- Revise Design Reference §4, §5.3, §5.8, §5.9, §5.14, §5.17, §5D, §9 and §10 with exact layout, copy, states, responsive and accessibility behavior.
- Add the five new `story.*` controls to `interaction-inventory.md`; add the episode navigation to `navigation-map.md` (no new route); mark the revisions specified in `screen-inventory.md`; update the Design Handoff Plan's coverage, flows and QA rows.
- Update `open-decisions.md` (R31, open 23 resolved, R29 amended), `product-scope.md`, `user-flows.md` (F18), `user-journeys.md`, `data-requirements.md`, `information-architecture.md` and `voice-content.md`. No token or component changes.
- Approve Product Specification §3.25 with its production mapping, and add Implementation Plan Phase 33 without altering Phases 29–32.
- Reconcile `TASK_ai-creation-platform.md` so the Phase 33 API, prompt, web, seed, test and Fidelity QA work is pending and immediately executable.

## Completion

Carried out in prompt-only mode on 2026-09-27. The documents above now specify Story episodes. No prototype, `design-release.json` or design validation artifact is created.
