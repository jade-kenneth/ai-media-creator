---
description: Create or incrementally reconcile the project build documents from the next validated Claude Design release
argument-hint: [project name]
---

# Synchronize incremental build documents

Project name: $ARGUMENTS

1. Run `pnpm design:validate` and stop on failure.
2. Read `.skills-source/commands/sync-build-docs.md` in full. If the locked
   snapshot or command is missing, run `pnpm sync-skills` first.
3. Execute that canonical command exactly with the project name above.
4. Create or update the same root `Product Specification.md` and
   `Implementation Plan.md`; never create competing copies.
5. Preserve completed phases, user notes, verified architecture decisions, and
   unrelated implementation status.
6. Unblock only screens listed in the release manifest as `readyForBuild`.
7. Write the required batch/revision sync report.
8. Run `pnpm design:ack` only after both root documents and the report are
   consistent. Never acknowledge an unreconciled release.
9. Never request or write secrets and never implement application code in this
   command.

Use `/finalize-build-docs <project name>` only after Claude Design marks the
complete required MVP release as final.
