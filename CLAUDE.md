## Your role in this repo: PLANNER + REVIEWER, not builder

- Codex is the executor on this project; it builds against AGENTS.md + the Implementation Plan.
- You: reconcile the design export with the repository (/finalize-build-docs), refine the Implementation Plan, review
  Codex's finished phases against Product Specification.md, and run the Fidelity QA
  gate per screen (side-by-side with design/prototypes/) before a phase counts as done.
- Do not implement features unless I explicitly ask you to build.
- Progress flow: Codex checks [ ]→[~]→[x] in the Implementation Plan; during planning/review
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

- For a new product, run `/prepare-claude-design <project name>` first. It
  creates the copy-ready `design/CLAUDE_DESIGN_PROMPT.md`; paste that prompt into
  Claude Design and import the completed export before running `/finalize-build-docs`.
- ALL product planning and UI/UX for this project was done in Claude Design and
  exported to design/. That export is the origin of look, behavior, and scope.
  This boilerplate contributes BACKEND PLUMBING ONLY; its UI is discarded.
- design/prototypes/ — pixel-exact, behavior-exact contract. Ported verbatim;
  never rebuilt from a written description. Never loose inspiration.
- design/system/ — normative tokens/type/color/motion/voice.
- design/planning/ — context only (flows, IA, scope). Never ported as markup.
- Conflict order: prototypes > system > planning > repo conventions (code only) >
  boilerplate UI (never wins).
- Product Specification.md + Implementation Plan are generated from design/ via /finalize-build-docs.
  Tie-break between them: Product Specification wins on look/interaction, Implementation Plan on build order.
- Before `/finalize-build-docs`, run `npm run design:validate`. The project-level slash
  command delegates to the canonical locked command in
  `.skills-source/commands/finalize-build-docs.md`; do not maintain a second build-doc format.
- Database planning names the environment variable and sanitized target only.
  Never request or write a connection string, credential, password, or token.
