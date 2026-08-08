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
pnpm lint
pnpm typecheck
pnpm -r --if-present test
pnpm build
```

## Generated GraphQL clients

After changing SDL, regenerate the affected clients instead of editing generated
files:

```bash
pnpm --filter app-web codegen
pnpm --filter app-mobile codegen
```

## Skills instructions

```bash
pnpm sync-skills
pnpm check-skills
pnpm update-skills -- --sha <full-skills-source-sha>
```

`sync-skills` restores the currently approved revision. `update-skills`
intentionally selects a new reviewed revision and normally requires that an
explicit SHA belongs to the configured `skills-source/main`. Use
`--allow-unmerged` only for an intentional, reviewed exception.

## Boilerplate code tracking in product repositories

```bash
pnpm boilerplate:setup
pnpm boilerplate:check
pnpm boilerplate:port -- --dry-run --sha <full-app-boilerplate-sha>
pnpm boilerplate:port -- --sha <full-app-boilerplate-sha>
pnpm boilerplate:contributions
pnpm boilerplate:ack -- --sha <full-app-boilerplate-sha>
```

`boilerplate:check` discovers updates, `boilerplate:port` applies explicit reviewed
commits on a clean non-default product branch, and `boilerplate:ack` records the
final review boundary. Porting and acknowledgement remain separate. Never resolve
port conflicts automatically or select a merge commit by guessing its mainline
parent.

Do not add general workflow prose here. Change the canonical `skills-source`
workflow and regenerate `AGENTS.md` instead.
