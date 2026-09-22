# Scripts guide

Every script in this directory is wired to an npm script in the root
`package.json` — always invoke them through npm so flags and defaults stay
consistent. Extra flags go after `--`, e.g.
`npm run boilerplate:port -- --dry-run --sha <sha>`.

The scripts fall into four domains: **project identity**, **skills
synchronization**, **boilerplate governance**, and the **design handoff**.
Each domain also has a regression test script that CI runs on every PR.

## Project identity

| npm script | File | Purpose |
| --- | --- | --- |
| `project:init` | `project-init.mjs` | One-time initializer after scaffolding a product: renames the workspace (`--name`, `--slug`, `--scope`, `--namespace`, `--domain`, `--database`) across app configs. `--dry-run` previews, `--non-interactive` fails instead of prompting, `--force` overwrites already-customized values. |
| `test:project-init` | `test-project-init.mjs` | Regression tests for the initializer. |

## Skills synchronization (conventions → AGENTS.md)

`skills-source.lock.json` pins the reviewed revision of the
[skills-source](https://github.com/jade-kenneth/skills-source) repo;
`AGENTS.md` is generated from it and must never be edited by hand.

| npm script | File | Purpose |
| --- | --- | --- |
| `sync-skills` | `sync-skills.mjs sync` | Hydrates `.skills-source/` at the locked revision and regenerates `AGENTS.md`. Run after cloning or when the lock changes. |
| `update-skills` | `sync-skills.mjs update` | Deliberately advances the lock to latest skills-source `main` (or `-- --sha <full-sha>`) and regenerates. |
| `check-skills` | `sync-skills.mjs check` | Verifies the committed `AGENTS.md` matches the lock; CI runs this — do not bypass it. |
| _(postinstall)_ | `sync-skills.mjs hydrate` | Hydrates the locked snapshot only; never advances the lock or touches tracked files. |
| `skills:contribution:validate` / `skills:contribution:render` | `skill-contribution.mjs` | Validates and renders a project-learning proposal (a candidate durable rule discovered in this project) for upstream submission to skills-source. |
| `test:skill-contribution` | `test-skill-contribution.mjs` | Regression tests for the proposal wrapper. Requires a hydrated `.skills-source/` (run `sync-skills` first). |

## Boilerplate governance (foundation surface)

`boilerplate-sync.config.json` declares the protected foundation surface
(`foundationPaths` vs `productPaths`; the most specific pattern wins).
`boilerplate.lock.json` records which upstream revision a product has
reviewed. The full workflow is documented in `docs/boilerplate-updates.md`.

| npm script | File | Purpose |
| --- | --- | --- |
| `boilerplate:setup` | `boilerplate-sync.mjs setup` | One-time in a new product: adds the `boilerplate` remote and records the source revision in the lock. |
| `boilerplate:check` | `boilerplate-sync.mjs check` | Lists unreviewed upstream commits, categorized (breaking/required/recommended/maintenance). Discovery only. |
| `boilerplate:port` | `boilerplate-sync.mjs port` | Cherry-picks explicitly selected upstream commits (`--sha`, repeatable; `--dry-run`) onto a product branch with provenance. Refuses merge commits, default branches, dirty worktrees, and already-applied commits. |
| `boilerplate:ack` | `boilerplate-sync.mjs acknowledge` | Records the review boundary (`--sha`) after every commit through it was applied or declined. Never copies code. |
| `boilerplate:contribute` | `boilerplate-sync.mjs contribute` | Ports foundation-only product commits upstream: cherry-picks them onto a worktree branched from `boilerplate/main` for a PR against app-boilerplate. Refuses mixed or merge commits. |
| `boilerplate:foundation-drift` | `boilerplate-sync.mjs foundation-drift` | Reports foundation files that differ from the reviewed upstream revision: ported updates pending acknowledgement vs local divergence. `--strict` exits non-zero on divergence. Runs weekly in CI. |
| `boilerplate:contributions` | `check-boilerplate-contributions.mjs` | PR gate: detects foundation-path changes in a diff. In product PR CI it fails until the change is classified via a `foundation:*` label or `Foundation-Change:` trailer; advisory elsewhere; self-skips inside app-boilerplate. |
| `test:sync-automation` | `test-sync-automation.mjs` | Regression tests for port/contribute/drift/classification and the skills lock commands. |

`lib/foundation-config.mjs` is the shared helper behind these: it loads
`boilerplate-sync.config.json` and classifies paths as foundation or product.
`lib/design-source.mjs` resolves `design.config.json` for the design scripts.

## Design handoff (Claude Design → build docs)

Claude Design is optional. `design.config.json` declares the product's design
source: `claude-design` (the `design/` export is the origin of product look,
behavior, and scope, and these scripts guard its integrity before build docs are
finalized) or `spec` (a written product brief; the validation scripts report the
source and pass, and acknowledgement is refused). See `docs/design-handoff.md`.

| npm script | File | Purpose |
| --- | --- | --- |
| `design:source` | `design-source.mjs` | Prints the resolved design source, or records it with `--set <claude-design\|spec> [--brief <path>]`. Without `design.config.json`, a committed `design/design-release.json` resolves to `claude-design`; with neither, the source is undecided. |
| `design:validate` | `validate-design-export.mjs` | Validates the imported design export against the handoff contract. Run before `/sync-build-docs`, and before `/finalize-build-docs`. |
| `design:validate-final` | `validate-design-export.mjs --allow-synced` | Same validation, plus it additionally accepts a final release already acknowledged into build docs. It does not reject an unsynchronized final release; `/finalize-build-docs` reconciles that case itself. |
| `design:validate-ci` | `validate-design-export.mjs --accept-acknowledged` | Same validation, plus it accepts the acknowledged steady state where the release already matches the lock. Used by the `design-gate` workflow, because a committed repository between releases is in exactly that state and plain `design:validate` rejects it by design. Prototype hashes are still enforced, so a changed prototype fails here too. |
| `design:ack` | `acknowledge-design-release.mjs` | Records that a design release was reviewed and synced into the build documents. Prunes prototypes that the release retired. |
| `test:design-handoff` | `test-design-handoff.mjs` | Regression tests for the design release flow. |

## Conventions for this directory

- Scripts are plain Node ESM (`.mjs`) with no runtime dependencies beyond git
  and Node itself, so they work before `npm install` completes.
- Shared logic lives in `lib/`; test fixtures copy scripts plus `lib/` into
  temporary repositories, so keep scripts self-contained apart from that.
- `scripts/**` is part of the foundation surface: changes here in a product
  repo must be classified in the PR, and reusable improvements go upstream via
  `npm run boilerplate:contribute`.
