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

## 3. Hydrate and validate

```bash
npm run sync-skills
npm run check-skills
npm run design:validate
```

Validation requires at least one supported prototype contract and exactly one
`design/handoff/` Design Reference and Design Handoff Plan. A missing design system or planning export
produces a warning because `/finalize-build-docs` has explicit fallback behavior for
both.

## 4. Generate the paired build documents

Open Claude Code in the product repository and run:

```text
/finalize-build-docs <project name>
```

The project-level command delegates to the canonical locked instructions at
`.skills-source/commands/finalize-build-docs.md`. It starts from Claude Design's
Design Reference and Design Handoff Plan, verifies them against every design file, scans the
actual boilerplate, resolves `VERIFY IN REPO` assumptions, creates the trim audit,
and writes reconciled canonical copies to the repository root with bidirectional
section/phase links and Fidelity QA. The untouched files under `design/handoff/` remain the original Claude Design
handoff. The repository-root `[PROJECT]Reference.md` and
`[PROJECT] Task Plan.md` are the finalized engineering documents.

Be ready to confirm:

- the project name;
- the database environment-variable name, sanitized database name, and whether it
  is configured — never paste the secret connection string;
- the mapping of boilerplate apps to product surfaces, including intentional
  renames or removals;
- stack overrides, or that the existing boilerplate stack wins.

The command must stop for missing prototypes, unexplained planned screens, an
ambiguous app mapping, or a material stack conflict instead of inventing an answer.

## 5. Review and commit the handoff

Verify that every prototype has a Reference section, every planned-but-unprototyped
surface is marked `⚠ needs design`, and the Task Plan reuses retained architecture.
Commit the untouched design export and generated documents so implementation PRs
can be reviewed against the same source of truth.

Codex then executes one Task Plan phase at a time. Generated `AGENTS.md`
automatically locates and reads the repository-root Reference and Task Plan before
application work, so the user can simply request the feature, fix, named phase, or
“next phase” without repeating document-loading instructions. `AGENTS.md` governs
code structure; the Reference wins on look and interaction; the Task Plan wins on
build order and approach.
