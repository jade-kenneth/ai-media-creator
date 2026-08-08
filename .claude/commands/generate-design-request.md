---
description: Scan the project task tracker for design gaps and produce the copy-ready Claude Design request prompt
argument-hint: [project name]
---

# Generate design request

Project name: $ARGUMENTS

1. Read the repository-root `TASK_<project-slug>.md` for the project name
   above. If it does not exist, stop and direct the user to
   `/generate-project-tasks <project name>` first.
2. Read `.skills-source/commands/generate-design-request.md` in full. If the
   locked snapshot is missing, run `pnpm sync-skills` first.
3. Execute that canonical command exactly with the project name above.
4. Verify every candidate gap against `Product Specification.md`,
   `design/planning/screen-inventory.md`, and the actual files under
   `design/prototypes/`. Never request a screen that no canonical document
   plans; record it as an open decision instead.
5. Write the result to `design/CLAUDE_DESIGN_REQUEST.md` as a self-contained
   continuation prompt for the existing Claude Design project: stable
   prototype filenames, one `data-prototype-surface` and exactly one
   `data-app-root` per delivered screen, and the incremental release contract
   (`design/design-release.json` batch advance and screen-inventory updates).
   Claude Design must never create or edit `design/design-sync.lock.json`.
6. Never request or include passwords, connection strings, tokens, API keys,
   production data, or other secrets.

Do not design screens, edit prototypes, or modify the task tracker in this
command. After Claude Design exports the requested batch, run
`pnpm design:validate`, then `/sync-build-docs <project name>`, then re-run
`/generate-project-tasks <project name>` to unblock the waiting tasks.
