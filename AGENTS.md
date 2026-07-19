# AGENTS.md — execution contract (generated from skills-source; do not edit)

Source revision: `jade-kenneth/skills-source@e3db2d8f262bdcb1c9568a020737372a21ccba0b`

You are the EXECUTOR on this project. Claude Design produced the UI/UX handoff;
Claude Code reconciled it with this repository. Your job is to build faithfully.

## Automatic project context — no repeated user instruction required
Before planning, editing, reviewing, or implementing application code:

1. Read the repository-root `Product Specification.md` and
   `Implementation Plan.md`. Do not use similarly named files under
   `design/`, `.skills-source/`, dependencies, generated output, or nested copies.
2. The Product Specification owns verified UI and behavior. The Implementation
   Plan owns dependency order, scope, phase status, and Fidelity QA.
3. Read this AGENTS.md for code structure, naming, stack patterns, and skills.
4. If either canonical root document is missing, stop and ask for
   `/finalize-build-docs <project name>` instead of guessing or using a legacy file.

The user does not need to repeat “read AGENTS.md, Product Specification.md, and
Implementation Plan.md.” Treat that context load as the default start of every
application task.
For an implementation request, follow the phase the user names; otherwise resume
the single `[~]` phase, or start the first unblocked `[ ]` phase when none is in
progress. Check `[ ]` → `[~]` → `[x]` only after the phase's QA rows pass.

## Non-negotiables
- Conflict order: design/prototypes > design/system > design/planning >
  this file (code structure ONLY) > boilerplate UI (never wins, always discarded).
- Fidelity: a screen is done only when it passes every row of the Fidelity QA
  checklist at the end of the Implementation Plan. "Close enough" is a failure.
- Prototype boundary: implement only `data-app-root`; never ship device frames,
  preview shells, presentation canvases, annotations, or presentation-only content.
- Platform-native conversion: web may reuse compatible markup; Expo/React Native
  must use native primitives and must not ship prototype HTML in a WebView or copy
  fixed preview dimensions into a production container.
- Prototype-to-production boundary: prototypes own visual and interaction outcomes,
  not implementation mechanics. Never carry prototype-local data, manual-only
  validation, inline mock handlers, hard-coded permissions, or fake persistence
  into production. Resolve the production path from current project configuration,
  the approved Implementation Plan, protected foundations that actually exist,
  nearby end-to-end exemplars, and then the routed app skill. Reuse GraphQL,
  codegen, TanStack Query, form schemas, and API layers when this repository
  provides them; otherwise use its configured equivalents.
- Reuse-not-rebuild: auth, authz, GraphQL client/server, codegen, S3, CI are
  provided ([BP]) — extend the existing primitive, never re-implement it.
- Do not mark a phase [x] without running its QA rows. Do not skip ahead.
- If the Product Specification and this file disagree on anything visual, the Product Specification wins.
- If something is genuinely ambiguous, stop and ask instead of inventing.

## How to use the skill index
Each skill below lists WHEN it applies and WHERE its full instructions live
(inside .skills-source/, which is hydrated from the committed lock file).
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
- `PascalCase` directories and filenames only for a component or provider folder that is exported as a unit under the exported component's name (for example `DataTable/DataTable.tsx`, `RichText/RichTextRoot.tsx`, `AuthProvider/AuthProvider.tsx`). Everything else, including route files, feature folders, hooks, and utilities, stays `kebab-case`.
- Use framework suffixes consistently: `*.module.ts`, `*.resolver.ts`, `*.service.ts`, `*.controller.ts`, `*.repository.ts`, `*.validation.ts`, and `*.spec.ts`.
- Reuse the domain folder's exact name in every file basename inside an API module, including the SDL schema file; never mix singular and plural forms of the same domain (`sessions/sessions.resolver.ts`, not `sessions/session.resolver.ts`).
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
├── .skills-source/             # Locked reusable skills and conventions
├── AGENTS.md                   # Repository-wide agent rules
├── nx.json                     # Nx plugins and task configuration
├── package.json                # Root scripts and npm workspaces
└── tsconfig.base.json          # Strict shared TypeScript baseline
```

The repository uses npm workspaces for `apps/*` and `packages/*`. Run projects through Nx and keep app-specific code inside the owning application.

## Stable architecture paths

- Preserve `apps/app-web`, `apps/app-api`, `apps/app-mobile`, `packages/shared-constants`, and their Nx project/package identifiers for every surviving application surface in a product created from the boilerplate.
- These are upstream integration identifiers, not customer-facing product names. Keeping them stable lets boilerplate changes apply to the same paths and avoids duplicate folders, missed patches, and unnecessary merge conflicts.
- Put the product identity in display names, root package metadata, URL/app slugs, mobile bundle identifiers, database names, domains, environment configuration, branding, and product copy.
- Do not add app-directory or Nx-project renames to generated build plans. A whole application may be removed only when the product mapping explicitly removes that surface, documents every responsibility that must move or be retired, and updates workspace, codegen, CI, deployment, and documentation references. Any other structural rename requires a separately reviewed migration that defines how future upstream boilerplate changes will be mapped.

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
- Align names across the module, resolver, service, repository, tests, and GraphQL schema: use the `<domain>` folder name verbatim in every basename, including the `.gql` file and exported class names (`SessionsResolver` in `sessions/sessions.resolver.ts`, never `SessionResolver` in `sessions/session.resolver.ts`).
- Put reusable transport validation in a feature validation file or a shared validation pipe.
- Keep tests beside the implementation as `*.spec.ts`.

### Web and mobile features

- Follow the nearest existing feature's route, component, hook, provider, query, and form layout.
- Keep route-only components close to their route.
- Promote a component to shared app-level UI only after it is reused across features.
- Keep platform-specific implementations separate even when admin and mobile expose the same capability.
- Colocate client GraphQL documents with their owning feature's data-layer folder (`react-query/<feature>/graphql/`); do not keep a central cross-feature documents folder, and do not leave re-export shims behind when a document moves.
- Import genuinely shared, product-neutral contracts from `@app/shared-constants`; keep app-specific and single-consumer values in the owning app.

## GraphQL placement

- Treat SDL files as the public API source of truth.
- Put shared scalars and interfaces in a shared schema file.
- Let feature schemas extend `Query` and `Mutation`.
- Change SDL before regenerating generated TypeScript types.
- Never edit generated GraphQL files by hand.

## Agent instructions

- Treat the root `AGENTS.md` as the repository-wide authority.
- Use relevant instructions under `.skills-source/skills/` when the task matches them.
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

- **Codex — the executor.** Builds against `AGENTS.md` and `Implementation Plan.md`, one phase at a time, updating phase checkboxes (`[ ]` → `[~]` → `[x]`) as work completes and passes its QA rows. Does not write to Notion.
- **Claude Code — the planner and reviewer.** Reconciles the design export into `Product Specification.md` and `Implementation Plan.md`, refines phases, reviews the executor's finished work against the Product Specification with the Fidelity QA gate, and syncs phase status to Notion during planning or review sessions. Does not implement features unless the user explicitly asks.
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

### 2. Scan the established pattern before writing

Existing code is the executable form of these conventions. Before creating or modifying any artifact, scan how the same kind of artifact is already implemented and consumed in this repository; never write one from framework habit or memory.

This scan is non-negotiable. No implementation may begin before it is completed and recorded, no role or agent is exempt, and no deadline, phase pressure, or "obvious" change waives it. Work submitted without a recorded scan fails review automatically — even when the resulting code happens to look correct — and restarts from the scan.

1. Name the kind of artifact the change needs: GraphQL query or mutation, API domain module, repository, REST endpoint, client operation, screen or page, form, table, hook, provider, validation schema, or test.
2. Find at least two existing implementations of that kind by suffix or naming pattern (for example `*.resolver.ts`, `*.repository.ts`, `*-operations.ts`, `use-*.ts`, or the feature folders under the owning app).
3. Trace one exemplar end-to-end through every layer it touches before writing any code. For a new GraphQL query the trace is: SDL definition → generated types → resolver method → service method → repository call → client document in `react-query/<feature>/graphql/` → operation wrapper → consuming component with its loading, error, empty, and success states. Apply the equivalent full trace for other kinds.
4. Record the pattern being replicated: naming, file placement, validation, error shape, pagination, guards, test coverage, and how existing consumers call it across the codebase.
5. Match the majority pattern. When exemplars disagree, follow the one these conventions endorse; when still ambiguous, follow the most recently reviewed implementation and record the choice.
6. Deviate only after the scan proves no exemplar fits, keep the deviation minimal, and record why in the task notes and pull request.

Record the scan in the active task file under a `Pattern scan` heading before the first line of implementation: the exemplar file paths consulted, the end-to-end trace followed, and the pattern decisions adopted. A change without this record is treated as unscanned. Reviewers verify the record exists and that the implementation matches it; either failure rejects the phase.

### 3. Translate prototype outcomes through production architecture

Claude Design prototypes are authoritative for visible outcomes, interaction
intent, copy, and required states inside `data-app-root`. Their implementation
mechanics are not production authority. Prototype-local arrays, component state,
inline handlers, manual submit checks, fake delays, hard-coded permissions,
browser storage, and mock network behavior exist only to demonstrate the design;
never copy them into production merely because they make the prototype work.

Before implementing a prototype-backed screen, add a `Production mapping` under
the active task's pattern scan. Resolve architecture in this order: explicit
project configuration and the approved Implementation Plan; protected foundations
that actually exist in the current repository; the nearest end-to-end exemplars;
then the routed skill for the owning app. A prototype's implementation mechanism
never participates in that precedence. Record:

1. each state value and its owner: server/cache, persisted client/session, form,
   or ephemeral UI;
2. the established read and write path, including the configured transport,
   generated types or contracts, operation wrapper, server/application layers,
   persistence boundary, and cache key where applicable;
3. the configured client validation used for form feedback and the authoritative
   server-side validation, authorization, and error contract;
4. loading, empty, error, success, offline, optimistic-update, rollback, and
   invalidation behavior required by the design; and
5. the existing end-to-end exemplar being extended.

Use local component/reducer state only for ephemeral presentation state such as
an open dialog, selected tab, draft gesture, or unsaved field control. Entity
lists, persisted records, permissions, sessions, and mutation results belong to
their established production owners. Server state goes through the data client,
operation layer, cache, and persistence boundaries configured in the current
repository. When GraphQL, codegen, and TanStack Query are protected foundations,
reuse them; when the approved project uses another architecture, use its existing
equivalents. Optimistic state belongs in the configured server-state cache with
rollback, not in a second local copy. Forms use the repository's configured form
and validation stack; manual prototype conditions are translated into that stack,
and the server independently enforces business and security rules. Client
validation improves feedback but is never authorization or the only protection
for persisted writes.

If the required production operation or vertical slice does not exist, implement
it contract-first in dependency order or mark the task blocked. Do not preserve a
mock/local implementation to make the screen appear complete. Review must trace
every data-backed action end-to-end and reject hard-coded or duplicated production
state even when visual fidelity passes.

### 4. Diagnose or define the change

For a bug fix:

- Reproduce the failure when practical, or gather the strongest available evidence when reproduction is unavailable.
- Trace the affected control flow, data flow, and boundary conditions far enough to identify the root cause.
- Check for an existing test or nearby pattern that reveals the intended behavior.
- Fix the cause rather than only suppressing the visible symptom.

For an enhancement:

- Compare the current behavior with the requested outcome.
- Identify acceptance criteria, affected states, edge cases, and compatibility constraints.
- Find the nearest comparable implementation before introducing a new pattern or abstraction.

### 5. Plan and implement the smallest coherent change

For full-project execution after the canonical Product Specification and Implementation Plan exist, generate or reconcile the root `TASK_<project-slug>.md`. In Claude Code, use `/generate-project-tasks <project name>`. In Codex or any agent without slash-command support, read `.skills-source/commands/generate-project-tasks.md` in full and execute it directly; if `.skills-source/` is missing, run `npm run sync-skills` first. For a small standalone change outside that project tracker, use a scoped `task.md`. Keep either task file aligned with reality.

- Follow the nearest established structure, naming, data flow, hooks, modules, repositories, and error-handling patterns.
- Keep the diff focused and avoid unrelated cleanup or broad refactors.
- Preserve public behavior and compatibility outside the requested scope unless the change explicitly requires otherwise.
- Change public contracts first: SDL/schema, shared types, then generated and client code.
- For cross-app changes, implement in dependency order: shared contract → API → clients.
- Add or update tests for observable behavior when the repository has a relevant test surface.
- For user-facing changes, cover applicable loading, empty, error, success, accessibility, and responsive states.
- Do not hand-edit generated files when a generator exists. Inspect regenerated output for unrelated churn and report a failed or unavailable generator instead of fabricating output.

### Port reviewed boilerplate updates

In a downstream product repository, use the boilerplate synchronization commands
as a review boundary rather than merging the upstream template:

```bash
npm run boilerplate:check
npm run boilerplate:port -- --sha <full-app-boilerplate-sha>
npm run boilerplate:ack -- --sha <reviewed-through-app-boilerplate-sha>
```

- Run the port command only on a dedicated product branch and pass every reviewed
  non-merge revision explicitly. The command orders selections by upstream
  history, verifies they belong to the unreviewed `boilerplate/main` range,
  refuses dirty/default-branch worktrees, and preserves `git cherry-pick -x`
  provenance.
- Preview a selection with `--dry-run` when useful. Resolve any cherry-pick
  conflict semantically with `git cherry-pick --continue`, or cancel with
  `git cherry-pick --abort`; never invent an automatic conflict resolution.
- Keep acknowledgement separate. Porting records applied revisions but does not
  advance `reviewedThroughSha`. Acknowledge a target only after every upstream
  commit through it was deliberately applied or declined and relevant validation
  passed.
- Reject merge commits from automatic porting because selecting a mainline would
  hide scope. Port their reviewed constituent commits instead.

### Classify and contribute foundation changes

The reusable architecture surface is declared in `boilerplate-sync.config.json`
(`foundationPaths`, with the most specific pattern winning over the product
globs). Changes to it are governed in both directions:

- In pull request CI, `npm run boilerplate:contributions` fails when foundation
  paths changed without a declared classification. Declare it with a PR label
  (`foundation:reusable`, `foundation:product-specific`, `foundation:backported`)
  or a `Foundation-Change: <classification>` line in the PR description. Never
  bypass the check by reclassifying paths; changing the foundation surface is
  itself a foundation change requiring maintainer review.
- Port a change classified reusable or backported upstream from the product
  repository:

```bash
npm run boilerplate:contribute -- --dry-run --sha <full-40-character-sha>
npm run boilerplate:contribute -- --sha <full-40-character-sha> [--branch <name>]
```

  The command accepts only explicit non-merge commits from the product history
  that touch foundation paths exclusively — split mixed commits first. It
  cherry-picks them with provenance onto a worktree branched from
  `boilerplate/main`; push that branch and open a pull request against
  `app-boilerplate`, where the maintainer accepts or rejects the standard change.
- `npm run boilerplate:foundation-drift` (run weekly by the drift workflow)
  reports foundation files that diverged locally from the reviewed upstream
  revision versus ported updates pending acknowledgement. Resolve divergence by
  contributing it upstream or recording why it stays product-specific.

### 6. Validate in proportion to risk

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

### 7. Close out accurately

- Inspect the final diff and working tree for unintended or unrelated edits.
- Update task checkboxes and notes to match the actual repository state.
- Update an authorized tracker only when the user or repository workflow requires it; do not mark incomplete or unvalidated work complete.
- Update documentation or standards only when the change creates a durable rule, public contract, configuration requirement, or reusable workflow.
- Summarize what changed, what was validated, and any limitation, assumption, migration, or follow-up that remains.

## Port reviewed boilerplate updates into a product

Product repositories keep discovery, code application, and final review as three
separate decisions:

1. `npm run boilerplate:check` fetches the configured `app-boilerplate` branch
   and lists unreviewed commits after `boilerplate.lock.json.reviewedThroughSha`.
   It discovers candidates; it does not copy code or advance the lock.
2. After inspecting the commit diffs, create a dedicated product branch and run
   `npm run boilerplate:port -- --sha <full-40-character-sha>` with one `--sha`
   for every explicitly selected commit. Use `--dry-run` first when useful. The
   command validates membership in the unreviewed range, orders selections by
   upstream history, rejects merge commits, and applies each commit with
   `git cherry-pick -x` so provenance is retained.
3. Resolve any semantic conflicts manually and run affected product checks. The
   port command must preserve Git's conflict state and direct the user to
   `git cherry-pick --continue` or `git cherry-pick --abort`; agents must not
   resolve conflicts automatically.
4. Run `npm run boilerplate:ack -- --sha <full-40-character-sha>` only after every
   commit through that revision was deliberately applied or declined. Acknowledging
   records the final review boundary; it never copies code.

Never port directly on `main`, `master`, the configured default branch, or a
detached HEAD. Start with a clean worktree and no unfinished cherry-pick. Never
select a merge commit or guess its mainline parent; inspect it and explicitly
select the applicable constituent commits instead. Do not reapply a commit already
recorded in `appliedUpdates`, already present by ancestry, or already referenced by
a cherry-pick provenance footer.

The port command records each successfully applied upstream SHA in
`boilerplate.lock.json.appliedUpdates`, but leaves `reviewedThroughSha` unchanged.
It does not resolve conflicts, acknowledge updates, or commit the lock file.

## Task file format

`TASK_<project-slug>.md` is a derived detailed execution tracker: Product Specification owns product/UI behavior, Implementation Plan owns phase scope and order, and the task file owns atomic actions and evidence. Never let it become a competing specification or architecture plan. Preserve protected boilerplate primitives—including GraphQL clients and codegen, TanStack Query setup, authentication, standardized errors, repositories, common libraries, async-event infrastructure, S3, notifications, security, CI, and test foundations—and create `[BP] verify & reuse` tasks instead of replacement tasks.

When Product Specification.md or Implementation Plan.md changes, task
reconciliation must compare the affected task's current acceptance criteria,
canonical references, repository evidence, and blockers. Do not preserve `[x]`
just because a task was previously complete or its phase name is unchanged.
Record and compare full-file content fingerprints for Product Specification.md
and Implementation Plan.md, and keep task-level canonical references,
evidence/history, and reconciliation reasons so the comparison is auditable.
Preserve `[x]` only when the acceptance criteria are unchanged and still
validated. Reopen an affected completed task as `[~]` only when implementation
of its updated acceptance criteria has actually started; an older implementation
alone is historical evidence, not in-progress evidence. Use `[ ]` for changed or
newly required work that has not started. Classify requirement changes and
blocker transitions separately because both may affect the same task. Add new
atomic tasks for new plan items, resolve
blockers superseded by the updated documents, and retain evidence/history with a
dated reason for every reopen, split, supersession, or unblock. Never mark
changed requirements complete without updated validation. Each reconciliation
must include a report of preserved, reopened, added, revised, blocked,
unblocked, superseded, and removed tasks; it must not claim that scope or
checkboxes were unchanged without an acceptance-criteria and repository
comparison.

Use the following compact structure for a small scoped `task.md`; `.skills-source/commands/generate-project-tasks.md` defines the richer full-project tracker format and must be read directly by agents that cannot invoke the wrapper command.

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

## Pattern scan

- Exemplars consulted: <file paths of the existing implementations of the same kind>
- End-to-end trace: <layers followed through one exemplar>
- Pattern decisions: <naming, placement, validation, error shape, pagination, guards, tests>
- Deviations: <none, or the minimal deviation and why no exemplar fits>

## Production mapping

Complete when the change implements a prototype-backed or data-backed surface; otherwise write `Not applicable` and delete the fields below.

- State ownership: <server/cache, persisted client/session, form, ephemeral UI>
- Architecture source: <project config/plan → protected foundation → exemplar → routed skill>
- Read path: <configured transport/operation → contract/types → cache wrapper → consumer>
- Write path: <configured form validation → write operation → server/application layers → persistence → cache update>
- Validation and errors: <client feedback validation + server validation/auth/error contract>
- Async states: <loading, empty, error, success, offline, optimistic rollback>
- Prototype-only mechanics rejected: <mock/local/manual mechanisms not carried over>

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

- [ ] Pattern scan recorded before implementation and the code matches it
- [ ] Prototype outcomes are preserved through the recorded production mapping, or the task records `Not applicable`; no mock data, server state, or manual-only validation was copied as architecture
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
_API implementation standards for apps/*-api (NestJS + Apollo GraphQL schema-first + Mongoose/MongoDB + TypeScript). USE when writing, reviewing, or refactoring any code in apps/*-api. TRIGGERS: creating modules, resolvers, services, repositories, GraphQL schema (SDL) changes, filters, sorting, pagination, search queries, mutations, guards, auth, multi-tenancy, scheduled jobs/cron, validation, file uploads, codegen, API tests. EXAMPLES: 'add a query', 'add a mutation', 'create a module', 'add a filter', 'paginate this list', 'add a field to the schema', 'write a repository', 'add a cron job', 'protect this resolver', 'add tenant scoping', 'regenerate GraphQL types'._

Full instructions: `.skills-source/skills/api-app/SKILL.md`

### datatable-builder
_Build or rebuild a DataTable component by porting DataTableReference to the current app's dependency set. Use this skill whenever the user asks to create, rebuild, port, or fix a DataTable component. Trigger on requests like "build the DataTable", "rebuild DataTable", "port DataTableReference", "fix the DataTable", or "create a data table component"._

Full instructions: `.skills-source/skills/datatable-builder/SKILL.md`

### explain-code
_Explains code with visual diagrams and analogies. Use when explaining how code works, teaching about a codebase, or when the user asks "how does this work?"_

Full instructions: `.skills-source/skills/explain-code/SKILL.md`

### fix-and-enhance
_Repository-agnostic coordinator for bug fixes and enhancements. Uses the project's generated workflow instructions, coordinates tracked work, delegates implementation standards to the matching app skills, and routes verified reusable lessons through `project-learning-contributor`. Use whenever a user asks to fix broken behavior, improve or polish an existing feature, add or change functionality, or implement a scoped feature._

Full instructions: `.skills-source/skills/fix-and-enhance/SKILL.md`

### mobile-app
_Mobile app implementation standards for apps/*-mobile (React Native + Expo + TypeScript + TanStack Query + NativeWind). USE when writing, reviewing, or refactoring any code in apps/*-mobile. TRIGGERS: creating components, screens, hooks, providers, features, data fetching, forms, navigation, performance work, accessibility, analytics, caching, state management, keyboard handling, safe areas, folder structure decisions. EXAMPLES: 'add a feature', 'build a screen', 'create a hook', 'audit this component', 'where should this go?', 'set up a query', 'add a mutation', 'fix keyboard hiding input', 'improve startup time', 'add safe area handling', 'handle Android back button'._

Full instructions: `.skills-source/skills/mobile-app/SKILL.md`

### mobile-native-ui-design
_Design and review production-grade mobile interfaces for iOS and Android, including platform adaptation, tokens, typography, color, motion, navigation, accessibility, iconography, brand, research, and handoff. Use for any mobile UI screen or component, native-feel critique, iOS-versus-Android decision, dark-mode or touch-target audit, animation or haptic specification, navigation architecture, cross-platform design system, or mobile HTML mockup. Pair with the mobile implementation skill when writing application code._

Full instructions: `.skills-source/skills/mobile-native-ui-design/SKILL.md`

### project-learning-auditor
_Scan a project read-only and generate a self-contained HTML learning guide at reference/project-learning-audit/index.html. Use when a user wants repository onboarding, a mental model, architecture and full-stack flow explanations, frontend/backend/database pattern analysis, optimization or accessibility risks, prioritized audit cards, diagrams, comprehension tests, a learning path, or an appended topic deep dive. Produces documentation only and never edits app source, runs builds or tests, deploys, or commits._

Full instructions: `.skills-source/skills/project-learning-auditor/SKILL.md`

### project-learning-contributor
_Capture verified, reusable engineering lessons from a product repository and route them to the correct canonical skill in skills-source. Use after a bug fix, incident, integration discovery, performance improvement, security correction, or durable architecture lesson should benefit other projects; also use when promoting a reviewed project-learning issue into one or more skills. Produces review-gated proposals and never auto-merges canonical skill changes._

Full instructions: `.skills-source/skills/project-learning-contributor/SKILL.md`

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
_Web app implementation standards for apps/*-admin (Next.js App Router + React + TypeScript + TanStack Query + Tailwind + shadcn/ui). USE when writing, reviewing, or refactoring any code in apps/*-admin. TRIGGERS: creating components, hooks, providers, features, data fetching, forms, routing, SSR/SSG, performance work, SEO, accessibility, analytics, caching, state management, folder structure decisions. EXAMPLES: 'add a feature', 'build a page', 'create a hook', 'audit this component', 'where should this go?', 'set up a query', 'add a mutation', 'fix a hydration error', 'improve LCP', 'add SEO metadata'._

Full instructions: `.skills-source/skills/web-app/SKILL.md`

### web-ui-design
_Complete guide for designing and building production-grade web interfaces. Use for any web UI work: pages, dashboards, forms, tables, dialogs, drawers, navigation, responsive layouts, dark mode, accessibility, motion, charts, empty/loading/error states, and visual polish. Pair with `web-app` for implementation authority._

Full instructions: `.skills-source/skills/web-ui-design/SKILL.md`

