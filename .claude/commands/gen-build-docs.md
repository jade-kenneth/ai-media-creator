---
description: Generate the paired project Reference and Task Plan from the locked Claude Design handoff command
argument-hint: [project name]
---

# Generate build documents

Project name: $ARGUMENTS

1. Run `npm run design:validate` from the repository root and stop if it fails.
2. Read `.skills-source/commands/gen-build-docs.md` in full. If the locked snapshot
   is missing, run `npm run sync-skills` first.
3. Execute that canonical command exactly, using the project name above wherever
   the canonical command refers to `$ARGUMENTS`. Start from the paired documents
   exported at the design root; do not invent an independent replacement pair.
4. Never ask the user to paste a connection string, password, token, or credential.
   Confirm only the environment-variable name, its configured/unconfigured status,
   and sanitized non-secret identifiers.

Do not create a competing Reference or Task Plan format in this wrapper. Their
contents, cross-links, trim audit, phase structure, and Fidelity QA gate are owned
by the locked canonical command.
