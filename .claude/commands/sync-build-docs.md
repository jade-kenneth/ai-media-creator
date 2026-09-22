---
description: Create or incrementally reconcile the project build documents from the next validated Claude Design release, or from the product brief when Claude Design is not used
argument-hint: [project name]
---

# Synchronize incremental build documents

Project name: $ARGUMENTS

1. Run `npm run design:source`. Claude Design is optional: when the source is
   undecided, ask whether this product is designed in Claude Design or built
   from a written product brief, and record the answer with
   `npm run design:source -- --set <claude-design|spec> [--brief <path>]`.
2. For `claude-design`, run `npm run design:validate` and stop on failure. For
   `spec`, there is no release to validate; follow the canonical Spec mode.
3. Read `.skills-source/commands/sync-build-docs.md` in full. If the locked
   snapshot or command is missing, run `npm run sync-skills` first.
4. Execute that canonical command exactly with the project name above.
5. Create or update the same root `Product Specification.md` and
   `Implementation Plan.md`; never create competing copies.
6. Preserve completed phases, user notes, verified architecture decisions, and
   unrelated implementation status.
7. Unblock only screens listed in the release manifest as `readyForBuild`, or,
   in spec mode, screens whose spec section is approved with no open decision.
8. Write the required batch/revision sync report, or, in spec mode, the dated
   `Spec sync log` entry.
9. In `claude-design` mode, run `npm run design:ack` only after both root
   documents and the report are consistent. Never acknowledge an unreconciled
   release, and never run it in spec mode.
10. Never request or write secrets and never implement application code in this
    command.

Use `/finalize-build-docs <project name>` only after Claude Design marks the
complete required MVP release as final, or, in spec mode, once every MVP screen
in the brief is approved.
