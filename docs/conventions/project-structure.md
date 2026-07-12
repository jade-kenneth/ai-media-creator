# Project structure

Use this guide when deciding where new code belongs or reviewing whether a change respects the Nx workspace boundaries.

## Applications

- `apps/app-api`: NestJS GraphQL API, persistence, authentication, integrations, and server-only orchestration.
- `apps/app-web`: Next.js tenant and super-admin interface.
- `apps/app-mobile`: Expo tenant-aware mobile application.

Application-specific components, hooks, schemas, services, and business rules stay inside their owning app.

## Shared packages

Use `packages/` only for code that is consumed by multiple applications and has a clear stable contract. Good candidates include shared constants, domain-neutral types, validation contracts, and pure utility functions.

Do not move code into a shared package merely to shorten an import path. Avoid shared packages that depend on one app's framework internals, environment variables, database models, or UI assumptions.

## Feature placement

Keep a feature vertically discoverable. Place its UI, state, API operations, tests, and local helpers close together according to the conventions of the owning application. Cross-feature imports should go through an intentional public module boundary rather than reaching into another feature's internals.

## Generated and synchronized files

Treat `AGENTS.md` and hydrated skill-source content as generated inputs. Update their source or synchronization process instead of manually patching generated output.

## Before adding a file

Ask:

1. Which application owns this behavior?
2. Is the code genuinely reused today, rather than possibly reused later?
3. Does the location make tests and ownership obvious?
4. Does it introduce an unnecessary dependency between apps or features?
