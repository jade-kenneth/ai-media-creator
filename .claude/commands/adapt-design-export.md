---
description: Adapt an existing Claude Design export to the locked platform-aware handoff contract without redesigning it
argument-hint: [project name]
---

# Adapt an existing Claude Design export

Project name: $ARGUMENTS

1. Confirm that screens already exist either in the current Claude Design
   project or under `design/prototypes/`. If they are still only in Claude
   Design, continue and prepare the compatibility prompt before the first export.
   If no design exists in either place, stop and use
   `/prepare-claude-design <project name>` instead.
2. Read `.skills-source/commands/adapt-design-export.md` in full. If the locked
   snapshot or command is missing, run `npm run sync-skills` first.
3. Execute that canonical command exactly, using the project name above wherever
   it refers to `$ARGUMENTS`.
4. Write `design/CLAUDE_DESIGN_ADAPTATION_PROMPT.md` as required. Do not directly
   rewrite, restyle, split, or move the existing prototypes and do not modify
   application code.
5. The prompt must preserve the current design, copy, flows, states, interactions,
   and assets while asking the existing Claude Design project to add one supported
   `data-prototype-surface`, exactly one `data-app-root`, and explicit
   preview/presentation-only boundaries per screen.
6. Require `design/design-release.json`, batch-aware screen inventory, and an
   early first buildable slice. Claude Design must never create or edit
   `design/design-sync.lock.json`.
7. Route each validated release to `/sync-build-docs <project name>` and reserve
   `/finalize-build-docs` for final completeness.
8. Never request or include passwords, connection strings, tokens, API keys,
   production data, or other secrets.

After Claude Design exports the corrected files for the first time—or re-exports
an older export—run `npm run design:validate`.
After validation, `/sync-build-docs <project name>` creates or updates the
verified root documents. Finalize only after the required MVP design is complete.
