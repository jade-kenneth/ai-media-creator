---
description: Verify the whole agent stack is wired correctly — skills, commands, MCP servers, boilerplate consumer files, Notion state layer, design pipeline. Read-only; fixes nothing without asking.
---

# Diagnose the agent stack

1. Read `.skills-source/commands/stack-doctor.md` in full. If the locked
   snapshot or command is missing, run `pnpm sync-skills` first.
2. Execute that canonical command exactly. Every check is read-only: report
   problems and the exact fix command, but change nothing unless I approve
   after seeing the report.
3. End with the canonical checklist, the ordered fix queue, and the one-line
   verdict the canonical command requires.
