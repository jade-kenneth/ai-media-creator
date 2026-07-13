# Project structure

Reusable ownership and placement rules are owned by
[`skills-source/conventions/project-structure.md`](https://github.com/jade-kenneth/skills-source/blob/main/conventions/project-structure.md)
and embedded in the generated root `AGENTS.md`. The locked detailed source is:

```text
.skills-source/conventions/project-structure.md
```

## Workspace map

| Path | Owner |
| --- | --- |
| `apps/app-api` | NestJS GraphQL/REST API, persistence, auth, integrations, and server orchestration |
| `apps/app-web` | Next.js tenant and super-admin web application |
| `apps/app-mobile` | Expo tenant-aware mobile application |
| `packages/shared-constants` | Stable product-neutral contracts and pure logic used across apps |

Use the full **Project Structure** section in `AGENTS.md` for API module layout,
feature organization, GraphQL placement, generated files, and the placement
checklist. Do not maintain another copy of those rules here.

## Boilerplate boundary

In product repositories, product-specific API modules/scripts and web/mobile
features belong to the product. Reusable architecture, common utilities, libs,
providers, security boundaries, repository abstractions, shared packages, and
third-party integration scaffolds remain possible boilerplate contributions.

Run the advisory detector on a product branch with:

```bash
npm run boilerplate:contributions
```
