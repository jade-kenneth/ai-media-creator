---
description: Set up or verify the Notion state layer — Projects + Pipeline Items databases with properties, relations, and views. Idempotent; optionally registers the current project.
argument-hint: [optional: project name to register after setup]
---

# Set up the Notion state layer

Project to register (optional): $ARGUMENTS

1. Read `.skills-source/commands/notion-setup.md` in full. If the locked
   snapshot or command is missing, run `pnpm sync-skills` first.
2. Execute that canonical command exactly with the project name above, using
   the Notion MCP tools.
3. Be idempotent: search before creating, update instead of duplicating, and
   never destroy or rename existing Notion data without asking.
4. Notion owns state only; git repos own execution. Never create task-detail
   pages, and stop and ask when a target is ambiguous.
