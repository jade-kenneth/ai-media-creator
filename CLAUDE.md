## Your role in this repo: PLANNER + REVIEWER, not builder

- Codex is the executor on this project; it builds against AGENTS.md + the Implementation Plan.
- You: reconcile the design export with the repository (/sync-build-docs per batch,
  /finalize-build-docs at the end), refine the Implementation Plan, review
  Codex's finished phases against Product Specification.md, and run the Fidelity QA
  gate per screen (side-by-side with design/prototypes/) before a phase counts as done.
- Do not implement features unless I explicitly ask you to build.
- Progress flow: Codex checks [ ]→[~]→[x] in the Implementation Plan; during planning/review
  sessions, YOU sync phase status to Notion. Notion is never edited by the executor.
- Conventions: AGENTS.md (generated) and .skills-source/conventions/. If you spot a
  gap while reviewing, the fix goes upstream to skills-source, then regenerate.
- Skills-source repo (for durable rule updates): https://github.com/jade-kenneth/skills-source

## Package manager

- Use pnpm 11.16.0 for installs, workspace scripts, and Nx commands. The pinned
  version in `package.json` and `pnpm-lock.yaml` is the executable repository
  contract.
- Generated `AGENTS.md` may still contain npm examples from the locked upstream
  skills snapshot. Translate those examples to pnpm in this repository; do not
  edit the generated file or bypass `pnpm check-skills`.

## Skills synchronization

- `skills-source.lock.json` is the reviewed source revision for this project.
- `pnpm sync-skills` hydrates that exact revision and regenerates `AGENTS.md`.
- `pnpm update-skills` intentionally advances the lock to latest `main` and
  regenerates `AGENTS.md`; use `-- --sha <full-sha>` for a specific revision.
- `pnpm check-skills` verifies that committed generated instructions match the
  lock. Do not bypass this check and do not edit generated `AGENTS.md` directly.
- Normal installation only hydrates the locked `.skills-source/` snapshot. It does
  not silently advance the lock or modify tracked files.

## Design (origin: Claude Design)

- For a new product, run `/prepare-claude-design <project name>` first. It
  creates the copy-ready `design/CLAUDE_DESIGN_PROMPT.md`; paste that prompt into
  Claude Design and import the completed export before running `/sync-build-docs`.
- ALL product planning and UI/UX for this project was done in Claude Design and
  exported to design/. That export is the origin of look, behavior, and scope.
  This boilerplate contributes BACKEND PLUMBING ONLY; its UI is discarded.
- design/prototypes/ — pixel-exact, behavior-exact contract inside each screen's
  `data-app-root`. Exclude device frames, preview shells, desktop canvases, and
  presentation-only annotations. Preserve outcomes exactly, but translate mobile
  HTML into native Expo/React Native primitives rather than WebView or copied DOM/CSS.
- design/system/ — normative tokens/type/color/motion/voice.
- design/planning/ — context only (flows, IA, scope). Never ported as markup.
- Conflict order: prototypes > system > planning > repo conventions (code only) >
  boilerplate UI (never wins).
- Product Specification.md + Implementation Plan are generated from design/ via
  /sync-build-docs, which creates them on Batch 1 and reconciles every later batch
  without resetting phase history. /finalize-build-docs is the closing completeness
  gate, not the starting one — do not wait for it to begin building ready slices.
  Tie-break between the documents: Product Specification wins on look/interaction,
  Implementation Plan on build order.
- Before either command, run `pnpm design:validate`. The project-level slash
  commands delegate to the canonical locked commands in
  `.skills-source/commands/`; do not maintain a second build-doc format.
- Database planning names the environment variable and sanitized target only.
  Never request or write a connection string, credential, password, or token.
