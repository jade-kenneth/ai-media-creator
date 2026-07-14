# Full-Stack Application Boilerplate

Project-agnostic Nx monorepo for a multi-tenant product with a web admin,
Expo mobile app, and NestJS GraphQL API.

## Included platform capabilities

- JWT authentication with refresh-token sessions and role-based access
- Multi-tenant organizations and tenant-aware request handling
- Super-admin organization and tenant-admin account management
- MongoDB repositories, cursor pagination, and request-scoped batching
- S3 uploads with presigned URLs
- In-app notifications, Expo push tokens, and test push delivery
- Account-deletion request workflow
- Internationalization, theming, responsive admin UI, and mobile navigation
- Rate limiting, CORS/security headers, structured logging, and health checks

Business-specific examples, content, branding, and assets are intentionally not
included. Add product features within the owning app and put only genuinely
shared contracts or pure logic in `packages/`.

## Workspace

| Project | Stack | Purpose |
| --- | --- | --- |
| `apps/app-api` | NestJS, GraphQL, MongoDB | API and reusable platform services |
| `apps/app-web` | Next.js, shadcn/ui | Tenant and super-admin web app |
| `apps/app-mobile` | Expo, React Native, NativeWind | Tenant-aware mobile starter app |
| `packages/shared-constants` | TypeScript | Cross-app constants and contracts |

## Getting started

Prerequisites: Node.js 20+ and npm.

```bash
npm install
cp .env.example .env
npm run api
npm run web
npm run mobile
```

Configure MongoDB, JWT, S3, email, and Expo push credentials in `.env` before
using the related integrations. App-specific public environment variables are
documented in each app's `.env.example`.

## Claude Design handoff

Before design work begins, open Claude Code in the product repository and run:

```text
/prepare-claude-design <project name>
```

This creates `design/CLAUDE_DESIGN_PROMPT.md`. Paste that file into Claude
Design, complete the design, and copy the export into `design/prototypes/`,
`design/system/`, and `design/planning/`, including
`design/handoff/[PROJECT] Design Reference.md` and
`design/handoff/[PROJECT] Design Handoff Plan.md`.

If you already have designed screens—whether they are still only in Claude
Design or already exported—keep them and run:

```text
/adapt-design-export <project name>
```

This creates `design/CLAUDE_DESIGN_ADAPTATION_PROMPT.md` for the existing Claude
Design project. If no export exists yet, Claude Design inventories and corrects
the live project before its first export. It adds the required metadata and
handoff boundaries without redesigning the screens. Paste it into that existing
design, export the corrected files into `design/`, then run:

```bash
npm run sync-skills
npm run design:validate
```

Open Claude Code in the product repository and invoke:

```text
/finalize-build-docs <project name>
```

The project command delegates to the locked canonical command from skills-source
and reconciles Claude Design's exported pair with the actual boilerplate into
the canonical repository-root `Product Specification.md` and `Implementation Plan.md`.
Only each prototype's `data-app-root` becomes production UI. Preview/device shells
are excluded, and mobile HTML is translated into native Expo/React Native primitives.
See [`docs/design-handoff.md`](docs/design-handoff.md) for inputs, security rules,
completeness checks, and the executor handoff.

Before starting product work, follow the
[customization checklist](docs/getting-started/customize.md) to initialize
boilerplate tracking, rename workspace identifiers, replace starter
presentation, configure environments, and verify that placeholder values do not
leak into a deployment.

## Useful commands

```bash
npm run build
npm run lint
npm run typecheck
npm test --workspaces --if-present
npm run check-skills
```

When this template becomes a new product repository, initialize its upstream
boilerplate tracking once:

```bash
npm run boilerplate:setup
git add boilerplate.lock.json
git commit -m "chore: record boilerplate starting revision"
```

Use `npm run boilerplate:check` to report later template updates and
`npm run boilerplate:contributions` to detect product changes that may be worth
porting back as reusable architecture. See
[`docs/boilerplate-updates.md`](docs/boilerplate-updates.md) for the reviewed
update and contribution workflow.

GraphQL client types are generated from the local API schema:

```bash
npm run codegen --workspace=app-web
npm run codegen --workspace=app-mobile
```

## Engineering conventions

- [Project structure](docs/conventions/project-structure.md)
- [Code style](docs/conventions/code-style.md)
- [Development workflow](docs/conventions/workflow.md)

Agent instructions are generated from the locked `skills-source` revision. Use
`npm run sync-skills` to hydrate the locked revision, `npm run update-skills` to
intentionally update it, and `npm run check-skills` to detect drift.
