# Code style in this workspace

Reusable code-style rules are owned by
[`skills-source/conventions/code-style.md`](https://github.com/jade-kenneth/skills-source/blob/main/conventions/code-style.md).
This repository consumes the reviewed revision recorded in
`skills-source.lock.json` and embeds it in the generated root `AGENTS.md`.

Before changing application code, read the **Code Style** section of `AGENTS.md`.
Detailed locked source is available locally at:

```text
.skills-source/conventions/code-style.md
```

Do not copy general naming, TypeScript, validation, error, GraphQL, persistence,
or testing rules into this document. That would create a second editable source.

## Workspace-specific application

- Follow the closest implementation in the owning app before adding a pattern.
- Treat GraphQL SDL as the API contract and regenerate web/mobile client types
  with their existing `codegen` workspace commands.
- Use the existing GraphQL clients, React Query wrappers, API error hierarchy,
  repository abstractions, authentication, tenancy, and integration scaffolds.
- Keep product behavior in its owning app; put code in `packages/` only when it
  has a stable cross-app contract.

## Changing a reusable rule

Change the canonical file in `skills-source`, validate it there, and then adopt
the reviewed revision here:

```bash
npm run update-skills -- --sha <full-skills-source-sha>
npm run check-skills
```

Never edit generated `AGENTS.md` to make a durable rule change.
