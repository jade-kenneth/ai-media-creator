# Claude Design handoff

Run this workflow in the product repository created from app-boilerplate, never in
the reusable boilerplate source repository.

## 1. Import the export

Copy the Claude Design output into these authority-separated folders:

```text
design/
├── prototypes/  # screen--*.html, logo--*.html, and *.dc.html contracts
├── system/      # tokens, typography, color, motion, and voice
└── planning/    # flows, IA, journeys, scope, and PRD fragments
```

Do not rename or rewrite prototype files merely to satisfy a convention. The
canonical command supports both named screen exports and `*.dc.html` Design
Component exports.

## 2. Hydrate and validate

```bash
npm run sync-skills
npm run check-skills
npm run design:validate
```

Validation requires at least one supported prototype contract. A missing design
system or planning export produces a warning because `/gen-build-docs` has explicit
fallback behavior for both.

## 3. Generate the paired build documents

Open Claude Code in the product repository and run:

```text
/gen-build-docs <project name>
```

The project-level command delegates to the canonical locked instructions at
`.skills-source/commands/gen-build-docs.md`. It inventories every design file,
checks prototype completeness, scans the actual boilerplate, creates the trim
audit, and writes the paired `[PROJECT]Reference.md` and
`[PROJECT] Task Plan.md` with bidirectional section/phase links and Fidelity QA.

Be ready to confirm:

- the project name;
- the database environment-variable name, sanitized database name, and whether it
  is configured — never paste the secret connection string;
- the mapping of boilerplate apps to product surfaces, including intentional
  renames or removals;
- stack overrides, or that the existing boilerplate stack wins.

The command must stop for missing prototypes, unexplained planned screens, an
ambiguous app mapping, or a material stack conflict instead of inventing an answer.

## 4. Review and commit the handoff

Verify that every prototype has a Reference section, every planned-but-unprototyped
surface is marked `⚠ needs design`, and the Task Plan reuses retained architecture.
Commit the untouched design export and generated documents so implementation PRs
can be reviewed against the same source of truth.

Codex then executes one Task Plan phase at a time. `AGENTS.md` governs code
structure; the Reference wins on look and interaction; the Task Plan wins on build
order and approach.
