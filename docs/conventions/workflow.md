# Development workflow

Use this workflow for features, fixes, enhancements, and refactors.

## 1. Define the task

Record the problem, desired outcome, scope boundaries, acceptance criteria, risks, and relevant commands. Break larger work into phases with checkboxes that describe observable outcomes.

Example:

```md
## Phase 1 — API contract
- [ ] Define validated input and output types
- [ ] Enforce authorization and tenant isolation
- [ ] Cover success and rejected cases
```

Update checkboxes only when the corresponding result is complete and verified.

## 2. Create a focused branch

Use a short descriptive branch name such as:

- `feat/account-invitations`
- `fix/tenant-upload-access`
- `chore/update-agent-skills`

Do not mix unrelated cleanup into the same branch.

## 3. Implement in small slices

Prefer a thin complete path over disconnected layers. Keep generated files, migrations, schemas, clients, tests, and documentation synchronized with the source change that requires them.

## 4. Validate

Run the relevant checks, normally:

```bash
npm run lint
npm run typecheck
npm run build
npm test --workspaces --if-present
npm run check-skills
```

Run narrower tests during development, then the broadest practical checks before opening the pull request.

## 5. Commit intentionally

Use imperative Conventional Commit-style messages where practical:

- `feat: add tenant invitation flow`
- `fix: enforce upload ownership`
- `docs: clarify local setup`
- `chore: update locked skills revision`

Each commit should represent a coherent change and leave the repository in an understandable state.

## 6. Prepare the pull request

Explain:

- what changed
- why it changed
- user or developer impact
- security or contract considerations
- validation performed
- generated files or follow-up work

Keep pull requests scoped to one task. Mark incomplete or exploratory work as draft.
