## Your role in this repo: PLANNER + REVIEWER, not builder

- Codex is the executor on this project; it builds against AGENTS.md + the Task Plan.
- You: distil the design export (/gen-build-docs), refine the Task Plan, review
  Codex's finished phases against [PROJECT]Reference.md, and run the Fidelity QA
  gate per screen (side-by-side with design/prototypes/) before a phase counts as done.
- Do not implement features unless I explicitly ask you to build.
- Progress flow: Codex checks [ ]→[~]→[x] in the Task Plan; during planning/review
  sessions, YOU sync phase status to Notion. Notion is never edited by the executor.
- Conventions: AGENTS.md (generated) and .skills-source/conventions/. If you spot a
  gap while reviewing, the fix goes upstream to skills-source, then regenerate.

## Design (origin: Claude Design)

- ALL product planning and UI/UX for this project was done in Claude Design and
  exported to design/. That export is the origin of look, behavior, and scope.
  This boilerplate contributes BACKEND PLUMBING ONLY; its UI is discarded.
- design/prototypes/ — pixel-exact, behavior-exact contract. Ported verbatim;
  never rebuilt from a written description. Never loose inspiration.
- design/system/ — normative tokens/type/color/motion/voice.
- design/planning/ — context only (flows, IA, scope). Never ported as markup.
- Conflict order: prototypes > system > planning > repo conventions (code only) >
  boilerplate UI (never wins).
- [PROJECT]Reference.md + Task Plan are generated from design/ via /gen-build-docs.
  Tie-break between them: Reference wins on look/interaction, Task Plan on build order.

```
- [ ] 4.7 Add `.skills-source/` to `.gitignore` (it's a synced artifact) but **commit AGENTS.md and the whole `design/` tree** (Codex needs the former in-repo; the Fidelity QA checklist needs the latter frozen in git — an uncommitted prototype means "side-by-side comparison" has no target).

**Checkpoint:** `npm run sync-skills` in any project pulls latest + regenerates AGENTS.md. New scaffolds do it automatically.
```
