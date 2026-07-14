# Claude Design handoff

Run this workflow in the product repository created from app-boilerplate, never in
the reusable boilerplate source repository.

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

Validation requires at least one supported screen prototype,
`design/planning/screen-inventory.md`, exactly one supported
`data-prototype-surface` and one `data-app-root` per screen, exactly one paired
handoff, and a valid release transition. It rejects replayed, skipped, mislabeled,
or falsely updated releases.

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

Finalization performs the completeness gate. It is not required before Codex
starts architecture or an earlier ready slice.

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
