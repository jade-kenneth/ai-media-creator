---
description: Finalize the project Product Specification and Implementation Plan from the locked Claude Design handoff and actual repository
argument-hint: [project name]
---

# Finalize build documents

Project name: $ARGUMENTS

This is the final completeness gate. For Batch 1 or any partial release, stop and
run `/sync-build-docs <project name>` instead.

1. Run `pnpm design:validate-final` from the repository root and stop if it fails. This mode additionally accepts an unchanged, already synchronized final release; it does not by itself prove the release was synchronized, so verify `design/design-sync.lock.json` yourself and reconcile the release first when it is newer than the lock. Require `design/design-release.json` status `final` with no unfinished required MVP scope. If existing prototypes fail because their surface, production boundary, or paired handoff is missing or ambiguous, run `/adapt-design-export <project name>` and return the generated prompt to the existing Claude Design project.
2. Read `.skills-source/commands/finalize-build-docs.md` in full. If the locked snapshot
   is missing, run `pnpm sync-skills` first.
3. Execute that canonical command exactly, using the project name above wherever
   the canonical command refers to `$ARGUMENTS`. Start from the Design Reference
   and Design Handoff Plan under `design/handoff/`; do not invent independent
   replacement source documents. Treat only each prototype's `data-app-root` as
   production UI and translate mobile HTML to native Expo/React Native primitives;
   never ship preview shells or prototype HTML in a WebView.
4. Preserve all previously synchronized phase history and engineering decisions. Run `pnpm design:ack` only after the final reconciliation succeeds.
5. Never ask the user to paste a connection string, password, token, or credential.
   Confirm only the environment-variable name, its configured/unconfigured status,
   and sanitized non-secret identifiers.

Do not create a competing Product Specification or Implementation Plan format in this wrapper. Their
contents, cross-links, trim audit, phase structure, and Fidelity QA gate are owned
by the locked canonical command.
