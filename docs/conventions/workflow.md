# Workspace workflow commands

The canonical change workflow, roles, task phases, validation policy, commit
style, and pull-request style are owned by `skills-source`. Its
[`conventions/workflow.md`](https://github.com/jade-kenneth/skills-source/blob/main/conventions/workflow.md)
page is the upstream editing location and may be newer than this project's
approved rules. The reviewed rules are embedded in the generated root
`AGENTS.md`. The locked detailed source is:

```text
.skills-source/conventions/workflow.md
```

This page is only an operational command index for this workspace.

## Application validation

Run focused project checks first, then the broadest practical workspace checks:

```bash
npm run lint
npm run typecheck
npm test --workspaces --if-present
npm run build
```

## Generated GraphQL clients

After changing SDL, regenerate the affected clients instead of editing generated
files:

```bash
npm run codegen --workspace=app-web
npm run codegen --workspace=app-mobile
```

## Skills instructions

```bash
npm run sync-skills
npm run check-skills
npm run update-skills -- --sha <full-skills-source-sha>
```

`sync-skills` restores the currently approved revision. `update-skills`
intentionally selects a new reviewed revision and normally requires that an
explicit SHA belongs to the configured `skills-source/main`. Use
`--allow-unmerged` only for an intentional, reviewed exception.

## Boilerplate code tracking in product repositories

```bash
npm run boilerplate:setup
npm run boilerplate:check
npm run boilerplate:contributions
npm run boilerplate:ack -- --sha <full-app-boilerplate-sha>
```

These commands discover and record updates; they do not merge code. Review and
port applicable boilerplate commits on a dedicated product branch.

Do not add general workflow prose here. Change the canonical `skills-source`
workflow and regenerate `AGENTS.md` instead.
