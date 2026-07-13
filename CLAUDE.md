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
- Skills-source repo (for durable rule updates): https://github.com/jade-kenneth/skills-source

## Skills synchronization

- `skills-source.lock.json` is the reviewed source revision for this project.
- `npm run sync-skills` hydrates that exact revision and regenerates `AGENTS.md`.
- `npm run update-skills` intentionally advances the lock to latest `main` and
  regenerates `AGENTS.md`; use `-- --sha <full-sha>` for a specific revision.
- `npm run check-skills` verifies that committed generated instructions match the
  lock. Do not bypass this check and do not edit generated `AGENTS.md` directly.
- Normal installation only hydrates the locked `.skills-source/` snapshot. It does
  not silently advance the lock or modify tracked files.

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
- Before `/gen-build-docs`, run `npm run design:validate`. The project-level slash
  command delegates to the canonical locked command in
  `.skills-source/commands/gen-build-docs.md`; do not maintain a second build-doc format.
- Database planning names the environment variable and sanitized target only.
  Never request or write a connection string, credential, password, or token.
