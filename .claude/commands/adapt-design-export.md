---
description: Audit, rehabilitate, and adapt an existing Claude Design project to the locked handoff contract
argument-hint: [project name]
---

# Rehabilitate an existing Claude Design project

Project name: $ARGUMENTS

1. Confirm that screens already exist in the current Claude Design project or
   under `design/prototypes/`. If no design exists, stop and use
   `/prepare-claude-design <project name>`.
2. Run `pnpm design:source`; when it reports `spec`, confirm with the user
   that the product is switching to Claude Design, and record
   `pnpm design:source --set claude-design` once the prompt is written.
   Then read `.skills-source/commands/adapt-design-export.md` in full. If the locked
   snapshot is missing, run `pnpm sync-skills` first.
3. Execute the canonical command exactly with the project name above.
4. Write `design/CLAUDE_DESIGN_ADAPTATION_PROMPT.md`. Do not directly rewrite
   prototypes or application code.
5. Require Claude Design to audit screens, flows, required states, responsive or
   native platform behavior, design-system consistency, and accessibility before
   releasing anything.
6. Require `design/planning/design-gap-audit.md` and classify every item as
   `ready`, `needs-correction`, `missing-defined`, `ambiguous`,
   `planned`, or `superseded`.
7. Preserve valid existing decisions. Require Claude Design to repair known
   deficiencies and create missing screens whose behavior is already defined by
   approved requirements. It must ask the user before inventing an undefined
   product or business rule.
8. Require one supported `data-prototype-surface`, exactly one `data-app-root`,
   and explicit preview/presentation-only boundaries per screen.
9. Require `design/design-release.json`, the batch-aware screen inventory, and
   the first coherent buildable slice. Only audited `ready` screens may enter
   `readyForBuild`. Claude Design must never edit
   `design/design-sync.lock.json`.
10. Route every validated release to `/sync-build-docs <project name>` and
    reserve `/finalize-build-docs` for final MVP completeness.
11. Never request or include passwords, connection strings, tokens, API keys,
    production data, or other secrets.

Paste the generated adaptation prompt into the same existing Claude Design
project. After Claude Design audits, repairs, completes defined gaps, and exports
the first ready batch, run `pnpm design:validate`, then
`/sync-build-docs <project name>`. Do not wait for later batches before
implementing the released slice.
