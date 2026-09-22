# Claude Design handoff

Run this workflow in the product repository created from app-boilerplate, never in
the reusable boilerplate source repository.

## 0. Choose a design source

Claude Design is optional. The repository-root `design.config.json` records where
the product's UI and behavior come from:

```bash
npm run design:source                                               # show the current source
npm run design:source -- --set claude-design                        # design in Claude Design
npm run design:source -- --set spec --brief docs/product-brief.md   # build from a written brief
```

Without the file, a committed `design/design-release.json` means
`claude-design`, so products that already use Claude Design need no change. With
neither, `/sync-build-docs` asks once and records the answer. Sections 1–6 below
describe the Claude Design path; for the spec path, skip to
[Building without Claude Design](#building-without-claude-design).

## 1. Prepare the Claude Design prompt

Open Claude Code in the new product repository and run:

```text
/prepare-claude-design <project name>
```

The project command delegates to the canonical locked instructions and asks only
for missing product, user, surface, flow, brand, platform, accessibility, and scope
decisions. It writes `design/CLAUDE_DESIGN_PROMPT.md`. Review that file and paste
its complete contents into Claude Design.

Claude Design then creates the actual screen contracts, design system, planning
documents, interactions, responsive behavior, states, export report, and the
design-authored `[PROJECT] Design Reference.md` and
`[PROJECT] Design Handoff Plan.md`. This
preparation command does not generate UI or engineering build documents itself.

## 1A. Adapt screens that were already designed

If usable screens already exist in Claude Design—even when nothing has been
exported yet—do not restart the design or overwrite it with a new preparation
prompt. Run:

```text
/adapt-design-export <project name>
```

The command writes `design/CLAUDE_DESIGN_ADAPTATION_PROMPT.md`. If the design is
still only in Claude Design, the prompt makes Claude Design inventory its live
screens, states, flows, assets, and target platforms before correcting the export
contract. If an older export exists, the command also inventories those files.
Paste the prompt into the existing Claude Design project. Claude Design preserves
the design, copy, flows, states, interactions, and assets while adding the
supported surface, `data-app-root`, preview-shell, presentation-only, and paired
handoff metadata. Export the adapted files into `design/`; the command does not
edit prototype source or application code itself.

## 2. Import the export

Copy the Claude Design output into these authority-separated folders:

```text
design/
├── prototypes/              # screen--*.html, logo--*.html, *.dc.html contracts
├── system/                  # tokens, typography, color, motion, and voice
├── planning/                # flows, IA, journeys, scope, PRD fragments
└── handoff/
    ├── [PROJECT] Design Reference.md
    └── [PROJECT] Design Handoff Plan.md
```

Do not rename or rewrite prototype files merely to satisfy a convention. The
canonical command supports both named screen exports and `*.dc.html` Design
Component exports.

Every screen prototype must identify its target and production boundary:

```html
<body data-prototype-surface="mobile">
  <div data-preview-shell>
    <main data-app-root>
      <!-- Actual application screen -->
    </main>
  </div>
</body>
```

Use `web`, `mobile`, `tablet`, or `desktop` as the surface. Device frames,
desktop centering canvases, browser chrome, labels, and annotations stay outside
`data-app-root`; mark presentation annotations
`data-handoff="presentation-only"`. A reference phone size is only a comparison
viewport. Expo/React Native implementation uses native primitives, navigation,
safe areas, scrolling, keyboard behavior, gestures, and sheets—not a WebView or
copied DOM/CSS.

## 3. Declare and validate a design release

```bash
npm run sync-skills
npm run check-skills
npm run design:validate
```

Every export must include `design/design-release.json`. Batch 1 is the first
coherent buildable slice. New ready scope increments `batch`; corrections to the
same scope increment `revision`. The repository-owned
`design/design-sync.lock.json` records the last successfully reconciled release
and prototype hashes. Claude Design must never create or edit that lock.

Validation requires at least one supported screen prototype, a non-empty
`design/system/`, `design/planning/screen-inventory.md`, exactly one supported
`data-prototype-surface` and one `data-app-root` per screen, exactly one paired
handoff, and a valid release transition. It rejects replayed, skipped, mislabeled,
or falsely updated releases.

Validation also holds every prototype the repository has already synchronized to
its recorded hash, whether or not the current release mentions it. Changing an
already-built screen without declaring it fails with `changed since it was
synchronized but is not listed in readyForBuild`; deleting one fails unless the
release retires that screen in `removedOrSuperseded`. Logo contracts
(`logo--*.html`) may appear in `readyForBuild` and are exempt from the
`data-app-root` requirement, since they are not screens.

The `design-gate` workflow runs `npm run design:validate-ci` on every pull request,
and no-ops in repositories that have no `design/design-release.json` yet or whose
design source is `spec`. That mode
also accepts the acknowledged steady state, because between releases a committed
repository has `design-release.json` matching `design-sync.lock.json`, which the
ordinary transition rules reject on purpose. Prototype hashes are still enforced in
that mode, so a prototype edited after synchronization fails the gate.

## 4. Synchronize each buildable design release

Open Claude Code in the product repository and run:

```text
/sync-build-docs <project name>
```

The project-level command delegates to
`.skills-source/commands/sync-build-docs.md`. On Batch 1 it creates the root
`Product Specification.md` and `Implementation Plan.md`; later batches update
those same files without resetting unrelated phase history. Only
`readyForBuild` screens become unblocked. It writes a batch/revision sync report
and runs `npm run design:ack` only after reconciliation succeeds.

Be ready to confirm:

- the project name;
- the database environment-variable name, sanitized database name, and whether it
  is configured — never paste the secret connection string;
- the mapping of boilerplate apps to product surfaces, including intentional
  renames or removals;
- stack overrides, or that the existing boilerplate stack wins.

The command must stop for missing prototypes, missing or duplicate production
boundaries, unexplained planned screens, an ambiguous app mapping, or a material
stack conflict instead of inventing an answer. For existing prototypes that fail
the boundary or paired-handoff checks, run
`/adapt-design-export <project name>` and return the generated prompt to Claude
Design before finalizing.

## 5. Finalize the complete MVP design

When Claude Design sets `"status": "final"`, required MVP scope has no planned or
in-design items, and the final release has been synchronized, run:

```text
/finalize-build-docs <project name>
```

Finalization runs `npm run design:validate-final` and performs the completeness
gate against the unchanged synchronized final release. It is not required before
Codex starts architecture or an earlier ready slice.

## 6. Review and commit the handoff

Verify that every prototype has a Product Specification section, every planned-but-unprototyped
surface is marked `⚠ needs design`, and the Implementation Plan reuses retained architecture.
Commit the untouched design export and generated documents so implementation PRs
can be reviewed against the same source of truth.

Codex then executes one Implementation Plan phase at a time. Generated `AGENTS.md`
automatically locates and reads the repository-root `Product Specification.md` and `Implementation Plan.md` before
application work, so the user can simply request the feature, fix, named phase, or
“next phase” without repeating document-loading instructions. `AGENTS.md` governs
code structure; the Product Specification wins on look and interaction; the Implementation Plan wins on
build order and approach.

## Building without Claude Design

With `designSource` set to `spec`, a written product brief replaces the design
export. There is no `design/` folder to import, no release manifest, and no
`design:ack`; `npm run design:validate` reports the spec source and passes.

1. Write or point to the brief: purpose, users and roles, surfaces, core flows,
   screens, data, and brand identity. `/sync-build-docs` gathers anything missing
   and can write `docs/product-brief.md` for you.
2. Run `/sync-build-docs <project name>`. Claude Code drafts the root
   `Product Specification.md` and `Implementation Plan.md` from the brief and the
   repository's own design system: a text wireframe per screen built from the
   existing components, verbatim copy, every state, routes, and a production
   mapping. Anything the brief does not settle is marked `⚠ decision`; screens it
   only names are `⚠ needs spec`.
3. Review each screen section and approve it. A screen becomes buildable only
   when it records `Approved: <date>` and has no open decision. Re-run
   `/sync-build-docs` whenever the brief changes; the `Spec sync log` at the end
   of the Implementation Plan tracks the brief's fingerprint.
4. Codex builds approved screens with the boilerplate's component library and
   tokens, re-branded per the Product Specification. Boilerplate demo screens are
   still removed.
5. Each screen passes the Spec QA checklist — copy, layout, design-system
   conformance, states, routing, architecture mapping, accessibility, and a
   screenshot review against its spec section — before it is marked done.
6. Run `/finalize-build-docs <project name>` once every MVP screen in the brief is
   approved.

To adopt Claude Design later, run `/prepare-claude-design <project name>`. It
switches the source to `claude-design`, and each screen that gains a released
prototype moves from Spec QA to Fidelity QA; only screens whose prototype differs
from what was built reopen.
