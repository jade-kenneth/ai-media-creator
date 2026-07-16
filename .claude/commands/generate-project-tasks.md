---
description: Generate or reconcile the detailed project engineering task tracker from the canonical build documents
argument-hint: [project name]
---

# Generate project tasks

Project name: $ARGUMENTS

1. Read the repository-root `AGENTS.md`, `Product Specification.md`, and
   `Implementation Plan.md`. These are automatically required context; never
   use similarly named files under `design/handoff/` as substitutes.
2. Read `.skills-source/commands/generate-project-tasks.md` in full. If the
   locked snapshot is missing, run `npm run sync-skills` first.
3. Execute that canonical command exactly with the project name above.
4. Write or reconcile one root file named `TASK_<project-slug>.md`, using the
   lowercase kebab-case project name (for example, `TASK_dala.md`).
5. Preserve completed checkboxes, validation evidence, decisions, notes, and
   unaffected task history when the file already exists.
6. Keep the Product Specification authoritative for product/UI behavior, the
   Implementation Plan authoritative for scope/order/status, and AGENTS.md
   authoritative for architecture. The task file is only the detailed execution
   breakdown.
7. Protect boilerplate architecture. Create `[BP] verify & reuse` tasks for
   GraphQL clients/server/codegen, TanStack Query, authentication, errors,
   repositories, common libraries, integrations, security, CI, and tests.
   Remove only feature-specific vertical slices that have no product counterpart.
8. Never request or write passwords, connection strings, tokens, API keys, or
   other secret values.

Do not implement application code in this command. Open the generated task file
and summarize the current phase, ready work, blockers, and reused architecture.
