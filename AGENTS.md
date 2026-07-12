# AGENTS.md — execution contract (generated from skills-source; do not edit)

You are the EXECUTOR on this project. Claude Design produced the UI/UX and plan;
Claude Code distilled them into the two docs below. Your job is to build, faithfully.

## Read these first, in this order
1. [PROJECT]Reference.md — UI & behavior source of truth. Screens are PORTED
   VERBATIM from design/prototypes/, never rebuilt from a written description.
2. [PROJECT] Task Plan.md — dependency-ordered phases. Work ONE phase at a time,
   top to bottom. Check off [ ] → [~] (in progress) → [x] (done, QA passed).
3. This file — code structure, naming, stack patterns, and the skill index below.

## Non-negotiables
- Conflict order: design/prototypes > design/system > design/planning >
  this file (code structure ONLY) > boilerplate UI (never wins, always discarded).
- Fidelity: a screen is done only when it passes every row of the Fidelity QA
  checklist at the end of the Task Plan. "Close enough" is a failure.
- Reuse-not-rebuild: auth, authz, GraphQL client/server, codegen, S3, CI are
  provided ([BP]) — extend the existing primitive, never re-implement it.
- Do not mark a phase [x] without running its QA rows. Do not skip ahead.
- If the Reference and this file disagree on anything visual, the Reference wins.
- If something is genuinely ambiguous, stop and ask instead of inventing.

## How to use the skill index
Each skill below lists WHEN it applies and WHERE its full instructions live
(inside .skills-source/, which is synced into this repo on npm install).
Before working on a surface or component a skill covers, OPEN and READ its
full instructions at the listed path. The one-line description is a router,
not the rule set. If .skills-source/ is missing, run: npm run sync-skills

## Conventions

# Code Style

> Reach for this document when writing or reviewing application code, naming APIs and types, handling errors, validating input, or deciding the shape of GraphQL and REST responses.

## General rules

- Use strict TypeScript and preserve the root compiler guarantees: no implicit returns, no unused locals, no fallthrough, and no unchecked overrides.
- Prefer focused, readable components and functions over clever abstractions.
- Follow the nearest established pattern before introducing a new one.
- Keep a deviation minimal and explain why it is necessary.
- Use maintained APIs and libraries; do not add or preserve deprecated approaches.
- Inline simple trim or required-field checks. Do not create tiny one-use helpers such as `normalizeRequiredString`.
- Use explicit loading, error, success, and empty states in user-facing flows.
- Keep UI copy simple and direct.

## Naming

### TypeScript and files

- `PascalCase`: classes, React components, GraphQL object/input/enum types.
- `camelCase`: variables, functions, hooks, methods, and object properties.
- `UPPER_SNAKE_CASE`: constants that represent fixed sets and GraphQL enum values.
- `kebab-case`: feature directories and general filenames.
- Use framework suffixes consistently: `*.module.ts`, `*.resolver.ts`, `*.service.ts`, `*.controller.ts`, `*.repository.ts`, `*.validation.ts`, and `*.spec.ts`.
- Use `useX` for React hooks and `XProvider` for context providers.
- Prefer descriptive domain names over generic names such as `data`, `item`, or `handler` when the meaning is not obvious.

### GraphQL

- Use singular entity type names and plural collection query names.
- Use `CreateXInput` and `UpdateXInput` for mutation inputs.
- Use `XFilterInput` for top-level filters and `XFieldFilterInput` for reusable field filters.
- Use `searchByX` for dedicated search queries.
- Expose entity identifiers as `id: ID!`; never leak MongoDB `_id`.
- Use concrete `XEdge` and `XConnection` types for paginated collections.
- Use `[Type!]!` for lists that are always present; make fields nullable only when absence is meaningful.

## Shared code

- Export from `packages/shared-constants` only when a type, constant, schema, or pure helper is product-neutral and used by at least two applications.
- Keep web-only, mobile-only, and API-only values in their owning app.
- Do not leave placeholder domain exports in the shared package; an empty package should use an explicit `export {};`.

## Imports and formatting

- Use type-only imports when a value is not required at runtime.
- Keep imports deterministic and avoid duplicates.
- Let the repository formatter own spacing, quotes, semicolons, and wrapping.
- Do not add a second ESLint or Prettier configuration when one already exists.
- Keep framework-specific lint rules inside the relevant app rather than the root baseline.

## Validation and error handling

### API input validation

- Validate at the transport boundary and again where business rules are owned.
- Use Zod schemas for structured REST bodies and shared write rules.
- Use the service-validated GraphQL args decorator for resolver `input` arguments when SDL owns shape/nullability and the service owns business validation.
- Keep resolvers/controllers thin by passing parsed values to the service.
- Reject unknown REST body keys with strict schemas when the endpoint contract is closed.
- Validate storage namespaces, MIME allowlists, traversal, and absolute paths before signing uploads.
- Generate final storage keys server-side instead of trusting caller-supplied object keys.

### Error shape

For validation failures, return a stable machine-readable structure:

```ts
{
  message: 'Input validation failed.',
  errors: [
    {
      field: 'input.email',
      message: 'email must be a valid email address.',
    },
  ],
}
```

Rules:

- `message` summarizes the failure category.
- `errors` contains field-specific details.
- `field` uses a dotted path when nested.
- `message` is safe, specific, and written for the client; never expose stack traces or persistence details.
- Throw NestJS exceptions from API boundaries/services rather than returning ad hoc error objects.

### Client errors

- Query failures render an inline error state with a retry action.
- Mutation failures use transient toast feedback unless the error belongs to a specific field.
- Form validation appears beside the affected field.
- Render crashes use the platform's error boundary.
- Do not display raw server errors directly; map known errors to user-safe copy.
- Never swallow errors silently. Log or surface them at the correct layer.

## API response conventions

### GraphQL

GraphQL operations return typed domain payloads directly. Do not wrap successful GraphQL data in a second `{ success, data, message }` envelope because GraphQL already provides the `data` and `errors` transport envelope.

- Use explicit payload/result types when a mutation needs more than one return value.
- Keep error codes and validation details stable for client mapping.
- Keep database-specific fields out of the schema.
- Paginate collections that can grow; use concrete connection types.
- Clamp page sizes through the shared repository policy rather than local limits.

### REST

- Return the endpoint's typed result directly for successful requests unless an existing controller establishes a wrapper.
- Use NestJS HTTP exceptions for failures.
- Keep validation errors in the standard `message` plus `errors[]` structure.
- Do not mix multiple success-envelope shapes across controllers.

## Service and persistence rules

- Keep business logic in services.
- Use repositories for persistence and shared page-size/filter/sort behavior.
- Pass structurally compatible repository filters and sorts through without local normalization objects.
- Perform external side effects before persisting terminal success state.
- Make rollback or transaction boundaries explicit when operation order cannot safely change.
- Protect side-effecting REST endpoints with authentication and role guards at the method boundary.

## Tests

- Add or update colocated `*.spec.ts` tests for validation, authorization, service behavior, and regression paths.
- Test observable behavior and contract shape, not private implementation details.
- Include rejected input and authorization cases, not only the happy path.


# Project Structure

> Reach for this document when deciding where new code belongs, moving files, adding a feature, or reviewing whether a change respects the boilerplate's Nx monorepo boundaries.

## Workspace map

```text
.
├── apps/
│   ├── app-web/                # Next.js admin web application
│   ├── app-api/                # NestJS GraphQL and REST API
│   └── app-mobile/             # Expo React Native application
├── packages/
│   └── shared-constants/       # Cross-app types, constants, schemas, and pure logic
├── .agents/skills/             # Agent tooling and workspace instructions
├── AGENTS.md                   # Repository-wide agent rules
├── nx.json                     # Nx plugins and task configuration
├── package.json                # Root scripts and npm workspaces
└── tsconfig.base.json          # Strict shared TypeScript baseline
```

The repository uses npm workspaces for `apps/*` and `packages/*`. Run projects through Nx and keep app-specific code inside the owning application.

## Ownership rules

- Put web UI, browser behavior, and Next.js routes in `apps/app-web`.
- Put native screens, Expo Router routes, device behavior, and NativeWind UI in `apps/app-mobile`.
- Put GraphQL SDL, resolvers, services, repositories, REST controllers, authentication, scheduling, and infrastructure adapters in `apps/app-api`.
- Put only product-neutral types, constants, schemas, and pure business logic used by two or more applications in `packages/shared-constants`.
- Do not share web UI components with React Native.
- Do not create a shared package for code used by only one app.
- Keep changes inside the owning app unless a contract or genuinely reusable rule crosses app boundaries.

## Feature organization

Follow the established structure in the affected app before creating a new pattern. Prefer feature/domain colocation over global folders containing unrelated code.

### API domain module

Each API domain belongs in `apps/app-api/src/modules/<domain>/`:

```text
<domain>/
├── <domain>.module.ts
├── <domain>.resolver.ts
├── <domain>.service.ts
├── <domain>.validation.ts       # When request/write validation is shared
└── repositories/
    ├── <domain>.repository.ts
    └── <domain>.repository.module.ts
```

Rules:

- Keep resolvers and controllers thin; delegate business behavior to services.
- Access MongoDB through the repository abstraction, never directly from a resolver or service.
- Use exactly one repository factory per `.repository.ts` file.
- Align names across the module, resolver, service, repository, tests, and GraphQL schema.
- Put reusable transport validation in a feature validation file or a shared validation pipe.
- Keep tests beside the implementation as `*.spec.ts`.

### Web and mobile features

- Follow the nearest existing feature's route, component, hook, provider, query, and form layout.
- Keep route-only components close to their route.
- Promote a component to shared app-level UI only after it is reused across features.
- Keep platform-specific implementations separate even when admin and mobile expose the same capability.
- Import genuinely shared, product-neutral contracts from `@app/shared-constants`; keep app-specific and single-consumer values in the owning app.

## GraphQL placement

- Treat SDL files as the public API source of truth.
- Put shared scalars and interfaces in a shared schema file.
- Let feature schemas extend `Query` and `Mutation`.
- Change SDL before regenerating generated TypeScript types.
- Never edit generated GraphQL files by hand.

## Agent instructions

- Treat the root `AGENTS.md` as the repository-wide authority.
- Use relevant instructions under `.agents/skills/` when the task matches them.
- Keep reusable guidance product-neutral; do not hardcode paths from another project.
- Update instructions only when a durable repository rule changes, not for one-off implementation details.

## Placement checklist

Before adding a file, ask:

- Which app owns this behavior?
- Is this platform-specific?
- Does an equivalent feature already establish the folder pattern?
- Is the code genuinely shared, pure, and free of framework dependencies?
- Will placing it here keep the change scoped and discoverable?


# Workflow

> Reach for this document when planning or executing a feature, bug fix, enhancement, or refactor; creating a task file; updating phase checkboxes; or preparing commits and pull requests.

This file is the canonical workflow source for generated project instructions. Update it here, then regenerate `AGENTS.md`; do not maintain a second editable copy in a skill or consumer repository.

## Roles

Project work is split across two agents with fixed responsibilities; apply the sections below through the lens of whichever role you occupy.

- **Codex — the executor.** Builds against `AGENTS.md` and the project Task Plan, one phase at a time, updating phase checkboxes (`[ ]` → `[~]` → `[x]`) as work completes and passes its QA rows. Does not write to Notion.
- **Claude Code — the planner and reviewer.** Distils the design export into the Reference and Task Plan, refines phases, reviews the executor's finished work against the Reference with the Fidelity QA gate, and syncs phase status to Notion during planning or review sessions. Does not implement features unless the user explicitly asks.
- **Provenance of scope:** all product planning and UI/UX originates in Claude Design and arrives as the committed `design/` export. Neither agent invents UI; ambiguity is escalated to the user.

When only one agent is present on a task, it still respects the boundary that matters most: nothing visual is rebuilt from prose, and no phase is marked complete without its validation.

## Change workflow

Apply this sequence together with the user's request and the repository instructions that govern the affected files.

### 1. Establish scope and local rules

Before editing:

1. Read the request and any linked issue, specification, logs, screenshots, or error output.
2. Read the applicable `AGENTS.md`, `CLAUDE.md`, README, contribution guides, and nested instructions.
3. Inspect the working tree so existing user changes are not overwritten or mistaken for task changes.
4. Locate the nearest implementation, tests, configuration, and comparable feature.
5. Identify the owning app or package and include another boundary only when a contract or dependency genuinely crosses it.
6. Discover the supported scripts, generated-file workflow, and validation commands from repository configuration rather than guessing them.

Ask a clarifying question only when missing information would materially change the implementation. Otherwise, state a reasonable assumption and continue. If the user requested diagnosis or review only, provide the requested evidence without implementing an unrequested fix.

Use an external tracker only when the user references one or the repository workflow requires it. Verify tracker content against the current code and require user authorization for external writes.

### 2. Diagnose or define the change

For a bug fix:

- Reproduce the failure when practical, or gather the strongest available evidence when reproduction is unavailable.
- Trace the affected control flow, data flow, and boundary conditions far enough to identify the root cause.
- Check for an existing test or nearby pattern that reveals the intended behavior.
- Fix the cause rather than only suppressing the visible symptom.

For an enhancement:

- Compare the current behavior with the requested outcome.
- Identify acceptance criteria, affected states, edge cases, and compatibility constraints.
- Find the nearest comparable implementation before introducing a new pattern or abstraction.

### 3. Plan and implement the smallest coherent change

Write or update `task.md` when the work requires multiple phases, affects several layers, or benefits from an explicit handoff checklist. Use the format below and keep its state aligned with reality.

- Follow the nearest established structure, naming, data flow, hooks, modules, repositories, and error-handling patterns.
- Keep the diff focused and avoid unrelated cleanup or broad refactors.
- Preserve public behavior and compatibility outside the requested scope unless the change explicitly requires otherwise.
- Change public contracts first: SDL/schema, shared types, then generated and client code.
- For cross-app changes, implement in dependency order: shared contract → API → clients.
- Add or update tests for observable behavior when the repository has a relevant test surface.
- For user-facing changes, cover applicable loading, empty, error, success, accessibility, and responsive states.
- Do not hand-edit generated files when a generator exists. Inspect regenerated output for unrelated churn and report a failed or unavailable generator instead of fabricating output.

### 4. Validate in proportion to risk

Run the smallest relevant checks first:

1. Focused test, reproduction, or manual check for the changed behavior.
2. Affected project's lint and typecheck.
3. Affected project's broader tests and build when the change can affect compilation or bundling.
4. Workspace-wide or integration checks only when shared contracts, root configuration, or cross-system behavior changed.

Typical root commands:

```bash
npm run lint
npm run typecheck
npm run build
```

Use the corresponding Nx project target when validating one app.

Inspect unfamiliar scripts before running them. Deployment, destructive, data-mutating, production-bound, privileged, or external-write commands require explicit user authorization; their presence in CI or package scripts is not permission to execute them.

Increase validation for authentication, authorization, sensitive data, persistence, concurrency, public APIs, schemas, migrations, billing, destructive operations, and deployment configuration. Verify relevant failure paths, compatibility, and rollback or migration needs.

Do not claim a check passed unless it ran successfully. If a check cannot run, report the command, reason, and remaining risk.

### 5. Close out accurately

- Inspect the final diff and working tree for unintended or unrelated edits.
- Update task checkboxes and notes to match the actual repository state.
- Update an authorized tracker only when the user or repository workflow requires it; do not mark incomplete or unvalidated work complete.
- Update documentation or standards only when the change creates a durable rule, public contract, configuration requirement, or reusable workflow.
- Summarize what changed, what was validated, and any limitation, assumption, migration, or follow-up that remains.

## Task file format

Use `task.md` for repository-local implementation plans. Keep it actionable and tied to observable outcomes.

```md
# <Task title>

## Context

<Why this work is needed and the current behavior.>

## Expected outcome

<What must be true when the task is complete.>

## Scope

### In scope

- <Owned behavior or surface>

### Out of scope

- <Explicit non-goals>

## Phases

### Phase 1 — <Discovery or contract>

- [ ] <Concrete task>
- [ ] <Concrete task>
- [ ] Validate: <smallest relevant check>

### Phase 2 — <Implementation>

- [ ] <Concrete task>
- [ ] <Concrete task>
- [ ] Validate: <smallest relevant check>

### Phase 3 — <Integration and finish>

- [ ] <Regression or cross-surface check>
- [ ] Complete regression and cross-surface checks
- [ ] Record assumptions, decisions, and follow-ups

## Verification

- [ ] Lint passes for the affected project
- [ ] Typecheck passes for the affected project
- [ ] Relevant tests pass
- [ ] Expected loading, empty, error, and success states are verified

## Notes

- Assumptions:
- Decisions:
- Follow-ups:
```

Immediately follow a feature plan with UI mockups for every affected admin and mobile surface when UI is in scope.

## Phase checkbox pattern

- Use `- [ ]` for pending work.
- Use `- [x]` only after the work and its relevant validation are complete.
- Group checkboxes under ordered phase headings: `Phase 1`, `Phase 2`, and so on.
- Write one verifiable action per checkbox.
- End each implementation phase with a validation checkbox.
- Preserve incomplete items; do not mark a phase complete because most of it works.
- Add newly discovered work to the appropriate phase instead of hiding it in prose.
- Keep status honest: the task file should show the actual repository state at handoff.

## Commit style

Use Conventional Commit-style subjects:

```text
<type>(<optional scope>): <imperative summary>
```

Common types:

- `feat` — new behavior
- `fix` — bug correction
- `refactor` — structural change without intended behavior change
- `test` — test-only change
- `docs` — documentation-only change
- `chore` — maintenance or tooling

Common scopes are `web`, `mobile`, `api`, `shared`, and `workspace`. A scope is optional when the change is truly repository-wide.

Examples:

```text
feat(api): add structured request validation
fix(mobile): prevent duplicate notification registration
refactor: update application references
docs(workspace): document implementation workflow
```

Rules:

- Keep the subject imperative, specific, and concise.
- One commit should represent one coherent change.
- Do not mix unrelated apps or cleanup into the same commit.
- Use the body to explain why, contract changes, migrations, or non-obvious tradeoffs.
- Do not claim tests passed unless they were run.

## Pull request style

The boilerplate has no established PR history, so use this compatible baseline:

```md
## Summary

- <What changed>
- <Why it changed>

## Scope

- Owning app/package:
- Related task:

## Validation

- [ ] Focused tests
- [ ] Lint
- [ ] Typecheck
- [ ] Build, if applicable
- [ ] Manual UX states, if applicable

## Contract or migration notes

<GraphQL, schema, environment, data, or rollout impact. Write "None" when absent.>

## Screenshots

<Required for visible web/mobile changes; otherwise "Not applicable".>
```

Keep PRs scoped to one task. Call out generated files, contract changes, security-sensitive behavior, and follow-up work explicitly.


## Stack skills (routed index — read the full file before touching its surface)

### api-app
_"API implementation standards for apps/*-api (NestJS + Apollo GraphQL schema-first + Mongoose/MongoDB + TypeScript). USE when writing, reviewing, or refactoring any code in apps/*-api. TRIGGERS: creating modules, resolvers, services, repositories, GraphQL schema (SDL) changes, filters, sorting, pagination, search queries, mutations, guards, auth, multi-tenancy, scheduled jobs/cron, validation, file uploads, codegen, API tests. EXAMPLES: 'add a query', 'add a mutation', 'create a module', 'add a filter', 'paginate this list', 'add a field to the schema', 'write a repository', 'add a cron job', 'protect this resolver', 'add tenant scoping', 'regenerate GraphQL types'."_

Full instructions: `.skills-source/skills/api-app/SKILL.md`

### datatable-builder
_Build or rebuild a DataTable component by porting DataTableReference to the current app's dependency set. Use this skill whenever the user asks to create, rebuild, port, or fix a DataTable component. Trigger on requests like "build the DataTable", "rebuild DataTable", "port DataTableReference", "fix the DataTable", or "create a data table component"._

Full instructions: `.skills-source/skills/datatable-builder/SKILL.md`

### explain-code
_Explains code with visual diagrams and analogies. Use when explaining how code works, teaching about a codebase, or when the user asks "how does this work?"_

Full instructions: `.skills-source/skills/explain-code/SKILL.md`

### fix-and-enhance
_Repository-agnostic coordinator for bug fixes and enhancements. Uses the project's generated workflow instructions, coordinates Notion-tracked work through the Notion MCP, and delegates implementation standards to the `web-app`, `mobile-app`, and `api-app` skills when their supported surfaces are affected. Use whenever a user asks to fix broken behavior, improve or polish an existing feature, add or change functionality, or implement a scoped feature._

Full instructions: `.skills-source/skills/fix-and-enhance/SKILL.md`

### mobile-app
_"Mobile app implementation standards for apps/*-mobile (React Native + Expo + TypeScript + TanStack Query + NativeWind). USE when writing, reviewing, or refactoring any code in apps/*-mobile. TRIGGERS: creating components, screens, hooks, providers, features, data fetching, forms, navigation, performance work, accessibility, analytics, caching, state management, keyboard handling, safe areas, folder structure decisions. EXAMPLES: 'add a feature', 'build a screen', 'create a hook', 'audit this component', 'where should this go?', 'set up a query', 'add a mutation', 'fix keyboard hiding input', 'improve startup time', 'add safe area handling', 'handle Android back button'."_

Full instructions: `.skills-source/skills/mobile-app/SKILL.md`

### mobile-native-ui-design
_"Complete guide for designing and building beautiful, production-grade mobile interfaces for iOS and Android. Covers aesthetic direction, design tokens, platform conventions, converge vs diverge, UX research, typography, color, motion, accessibility, brand, iconography, illustration, and navigation. When producing HTML mockups of mobile screens, translate every mobile spec to its closest CSS/HTML equivalent. USE for any mobile UI work. TRIGGERS: 'build a screen', 'build a component', 'design this', 'style this', 'does this look native?', 'iOS vs Android', 'platform parity', 'design tokens', 'motion spec', 'accessibility audit', 'touch targets', 'dark mode', 'FAB or no FAB?', 'bottom sheet or modal?', 'create a component', 'add navigation', 'add animation', 'review this screen', 'converge or diverge', 'make this beautiful', 'write once feel native', 'cross-platform mobile design', 'haptic spec', 'UX research plan', 'handoff checklist', 'design critique', 'platform conventions', 'same or different per platform?', 'navigation architecture', 'dark mode strategy', 'icon system', 'typography scale', 'spring physics', 'create a mockup', 'mockup html'."_

Full instructions: `.skills-source/skills/mobile-native-ui-design/SKILL.md`

### project-learning-auditor
_Scan a project read-only and generate a self-contained HTML learning guide at reference/project-learning-audit/index.html. Use when a user wants repository onboarding, a mental model, architecture and full-stack flow explanations, frontend/backend/database pattern analysis, optimization or accessibility risks, prioritized audit cards, diagrams, comprehension tests, a learning path, or an appended topic deep dive. Produces documentation only and never edits app source, runs builds or tests, deploys, or commits._

Full instructions: `.skills-source/skills/project-learning-auditor/SKILL.md`

### prose-builder
_Build or rebuild a Prose component by porting ProseReference to the current app's dependency set — for both web (Next.js/shadcn) and mobile (React Native/NativeWind) targets. Use this skill whenever the user asks to create, rebuild, port, or fix a Prose or typography display component. Trigger on requests like "build the Prose component", "rebuild Prose", "port ProseReference", "fix the Prose component", "create a prose component", or "add a Prose display component"._

Full instructions: `.skills-source/skills/prose-builder/SKILL.md`

### richtext-builder
_Build or rebuild a RichText (Wysiwyg) component by porting WysiwygReference to the current app's dependency set. Use this skill whenever the user asks to create, rebuild, port, or fix a RichText or Wysiwyg editor component. Trigger on requests like "build the RichText", "rebuild Wysiwyg", "port WysiwygReference", "fix the RichText editor", or "create a rich text editor component"._

Full instructions: `.skills-source/skills/richtext-builder/SKILL.md`

### shadcn
_Manages shadcn components and projects — adding, searching, fixing, debugging, styling, and composing UI. Provides project context, component docs, and usage examples. Applies when working with shadcn/ui, component registries, presets, --preset codes, or any project with a components.json file. Also triggers for "shadcn init", "create an app with --preset", or "switch to --preset"._

Full instructions: `.skills-source/skills/shadcn/SKILL.md`

### skill-creator
_Create new skills, modify and improve existing skills, and measure skill performance. Use when users want to create a skill from scratch, edit, or optimize an existing skill, run evals to test a skill, benchmark skill performance with variance analysis, or optimize a skill's description for better triggering accuracy._

Full instructions: `.skills-source/skills/skill-creator/SKILL.md`

### web-app
_"Web app implementation standards for apps/*-admin (Next.js App Router + React + TypeScript + TanStack Query + Tailwind + shadcn/ui). USE when writing, reviewing, or refactoring any code in apps/*-admin. TRIGGERS: creating components, hooks, providers, features, data fetching, forms, routing, SSR/SSG, performance work, SEO, accessibility, analytics, caching, state management, folder structure decisions. EXAMPLES: 'add a feature', 'build a page', 'create a hook', 'audit this component', 'where should this go?', 'set up a query', 'add a mutation', 'fix a hydration error', 'improve LCP', 'add SEO metadata'."_

Full instructions: `.skills-source/skills/web-app/SKILL.md`

### web-ui-design
_'Complete guide for designing and building production-grade web interfaces. Use for any web UI work: pages, dashboards, forms, tables, dialogs, drawers, navigation, responsive layouts, dark mode, accessibility, motion, charts, empty/loading/error states, and visual polish. Pair with `web-app` for implementation authority.'_

Full instructions: `.skills-source/skills/web-ui-design/SKILL.md`

