## Your role in this repo: PLANNER + REVIEWER, not builder

- Codex is the executor on this project; it builds against AGENTS.md + the Implementation Plan.
- You: reconcile the design source with the repository (/sync-build-docs per batch
  or brief change, /finalize-build-docs at the end), refine the Implementation Plan,
  review Codex's finished phases against Product Specification.md, and run the UI QA
  gate per screen before a phase counts as done: Fidelity QA (side-by-side with
  design/prototypes/) for `claude-design`, Spec QA (screenshot review against the
  approved spec section) for `spec`.
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

## Design source (Claude Design is optional)

- `design.config.json` declares the source; `npm run design:source` prints it and
  `npm run design:source -- --set <claude-design|spec> [--brief <path>]` records it.
  Without the file, a committed `design/design-release.json` means `claude-design`;
  with neither, ask the user once and record the answer. Never infer `spec` from an
  empty design/ folder.
- Product Specification.md + Implementation Plan are generated via /sync-build-docs,
  which creates them on the first batch or brief and reconciles every later change
  without resetting phase history. /finalize-build-docs is the closing completeness
  gate, not the starting one — do not wait for it to begin building ready slices.
  Tie-break between the documents: Product Specification wins on look/interaction,
  Implementation Plan on build order.
- The project-level slash commands delegate to the canonical locked commands in
  `.skills-source/commands/`; do not maintain a second build-doc format.
- Database planning names the environment variable and sanitized target only.
  Never request or write a connection string, credential, password, or token.

### `claude-design` — built from the Claude Design export

- For a new product, run `/prepare-claude-design <project name>` first. It
  creates the copy-ready `design/CLAUDE_DESIGN_PROMPT.md`; paste that prompt into
  Claude Design and import the completed export before running `/sync-build-docs`.
- The design/ export is the origin of look, behavior, and scope. This boilerplate
  contributes BACKEND PLUMBING ONLY; its UI is discarded.
- design/prototypes/ — pixel-exact, behavior-exact contract inside each screen's
  `data-app-root`. Exclude device frames, preview shells, desktop canvases, and
  presentation-only annotations. Preserve outcomes exactly, but translate mobile
  HTML into native Expo/React Native primitives rather than WebView or copied DOM/CSS.
- design/system/ — normative tokens/type/color/motion/voice.
- design/planning/ — context only (flows, IA, scope). Never ported as markup.
- Conflict order: prototypes > system > planning > repo conventions (code only) >
  boilerplate UI (never wins).
- Before either build-doc command, run `npm run design:validate`.

### `spec` — built from a written product brief

- The brief (`brief` in design.config.json) is the origin of scope. You draft each
  screen's Product Specification section from it — text wireframe built from the
  existing components, verbatim copy, every state, route, production mapping — and
  mark anything the brief does not settle `⚠ decision`. A screen is buildable only
  once the user approves it (`Approved: <date>`).
- The boilerplate's component library and tokens are the design system, re-branded
  per the brief; its demo screens are still removed. Visual decisions follow the
  routed UI design skill (`web-ui-design`, `mobile-native-ui-design`).
- Conflict order: Product Specification > project design system > routed UI design
  skill > repo conventions (code only) > boilerplate demo screens (never win).
- A screen the brief only names is `⚠ needs spec`; never design it silently or
  turn it into a Claude Design request unless the user switches sources.
