---
description: Scan the project task tracker for design gaps and produce the Claude Design request, or, in prompt-only mode, specify the missing designs locally and unblock the tasks
argument-hint: [project name] [--prompt-only | --claude-design]
---

# Generate design request

Arguments: $ARGUMENTS

1. Run `pnpm design:source`. For `spec`, write no design request: list each
   design gap as a `⚠ needs spec` or `⚠ decision` item for the user to settle
   in the brief and direct them to `/sync-build-docs <project name>`.
2. Read the repository-root `TASK_<project-slug>.md` for the project. If it
   does not exist, stop and direct the user to
   `/generate-project-tasks <project name>` first.
3. Read `.skills-source/commands/generate-design-request.md` in full. If the
   locked snapshot is missing, run `pnpm sync-skills` first.
4. Execute that canonical command exactly with the arguments above. It is the
   source of truth: it resolves the design mode (Claude Design or prompt only),
   what the request contains, and whether the request is handed to Claude
   Design or carried out in this session. Where this file and the canonical
   command differ, the canonical command wins.
5. Never request or include passwords, connection strings, tokens, API keys,
   production data, or other secrets.
