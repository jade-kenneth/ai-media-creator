---
description: Prepare the reusable copy-ready prompt that starts a product in Claude Design
argument-hint: [project name]
---

# Prepare Claude Design

Project name: $ARGUMENTS

If usable screens already exist under `design/prototypes/`, do not overwrite or
replace them. Stop this workflow and run
`/adapt-design-export <project name>` instead.

1. Read `.skills-source/commands/prepare-claude-design.md` in full. If the locked
   snapshot is missing, run `npm run sync-skills` first.
2. Execute that canonical command exactly, using the project name above wherever
   the canonical command refers to `$ARGUMENTS`.
3. Write the result to `design/CLAUDE_DESIGN_PROMPT.md` as required by the
   canonical command. The prompt must require Claude Design's export to include
   `design/handoff/[PROJECT] Design Reference.md` and
   `design/handoff/[PROJECT] Design Handoff Plan.md`. Every screen prototype must
   also declare one supported `data-prototype-surface` and exactly one
   `data-app-root`; preview/device shells remain outside that boundary. Claude
   Design must never create or edit `design/design-sync.lock.json`.
4. Require the first coherent vertical slice to export without waiting for the
   whole app, with `design/design-release.json` and the batch-aware
   `design/planning/screen-inventory.md`.
5. Route every validated release to `/sync-build-docs <project name>` and reserve
   `/finalize-build-docs` for final completeness.
6. Never request or include passwords, connection strings, tokens, API keys,
   production data, or other secrets.

Do not design the screens or generate the engineering Product Specification or Implementation Plan in
this wrapper. Claude Design creates the design export; `/finalize-build-docs` consumes
that completed export afterward.
