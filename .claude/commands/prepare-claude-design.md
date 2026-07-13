---
description: Prepare the reusable copy-ready prompt that starts a product in Claude Design
argument-hint: [project name]
---

# Prepare Claude Design

Project name: $ARGUMENTS

1. Read `.skills-source/commands/prepare-claude-design.md` in full. If the locked
   snapshot is missing, run `npm run sync-skills` first.
2. Execute that canonical command exactly, using the project name above wherever
   the canonical command refers to `$ARGUMENTS`.
3. Write the result to `design/CLAUDE_DESIGN_PROMPT.md` as required by the
   canonical command. The prompt must require Claude Design's export to include
   `design/handoff/[PROJECT] Design Reference.md` and
   `design/handoff/[PROJECT] Design Handoff Plan.md`.
4. Never request or include passwords, connection strings, tokens, API keys,
   production data, or other secrets.

Do not design the screens or generate the engineering Reference and Task Plan in
this wrapper. Claude Design creates the design export; `/gen-build-docs` consumes
that completed export afterward.
