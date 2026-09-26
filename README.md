# Full-Stack Application Boilerplate

Nx monorepo for **AI Creation Platform**, a web studio that turns one product
into a short vertical affiliate video script, backed by a NestJS GraphQL API.
The product spec lives in `Product Specification.md` and the build order in
`Implementation Plan.md`; the Expo mobile app was removed for this product.

## Included platform capabilities

- JWT authentication with refresh-token sessions and role-based access
- Multi-tenant organizations and tenant-aware request handling
- MongoDB repositories, cursor pagination, and request-scoped batching
- S3 uploads with presigned URLs
- Google sign-in with first-time creator provisioning and starter credits
- Credit holds and Mongo-backed generation jobs with an in-API worker
- Rate limiting, CORS/security headers, structured logging, and health checks

Business-specific examples, content, branding, and assets are intentionally not
included. Add product features within the owning app and put only genuinely
shared contracts or pure logic in `packages/`.

## Workspace

| Project                     | Stack                          | Purpose                            |
| --------------------------- | ------------------------------ | ---------------------------------- |
| `apps/app-api`              | NestJS, GraphQL, MongoDB       | API and reusable platform services |
| `apps/app-web`              | Next.js, shadcn/ui             | Creator web studio                 |
| `packages/shared-constants` | TypeScript                     | Cross-app constants and contracts  |

## Getting started

Prerequisites: Node.js 22.6+ and pnpm 11.16.0. The `packageManager` field pins
the pnpm release used by local worktrees and CI.

For a repository created from this template, initialize upstream tracking and
product identity before feature work:

```bash
pnpm boilerplate:setup
pnpm project:init
```

The interactive initializer asks for the display name, slug, package scope,
mobile namespace, optional owned domain, and local database name. For automation:

```bash
pnpm project:init -- \
  --name "Dala" \
  --namespace com.jadey \
  --domain dala.app
```

Preview changes without writing by adding `--dry-run`. Existing custom values
are protected; `--force` is required to replace them intentionally. Internal
architecture names such as `app-web`, `app-mobile`, and `app-api` remain
stable for cleaner boilerplate updates.

Then install and run the workspace:

```bash
pnpm install
cp .env.example .env
pnpm api
pnpm web
pnpm worker   # media worker: voice and render jobs (video beta)
```

The media worker (`apps/app-api/src/worker.ts`) is a second API process with no
HTTP server. It claims only voice and render jobs; text jobs stay in the API
process. It refuses to start unless FFmpeg and ffprobe run and FFmpeg includes
`libx264`, `aac`, `drawtext` (freetype) and `ass` (libass). Deploy it as its own
process with the same environment as the API, and run `node dist/worker` in
production.

Configure MongoDB (`MONGODB_URI`), JWT, S3, Google OAuth, a text provider (OpenAI or
Anthropic), and deployment credentials before using those integrations.
App-specific public environment variables are documented in each app's
`.env.example`.

### S3 bucket CORS

Browsers upload straight to S3 with a presigned `PUT`, so the bucket needs a
CORS rule for every web origin. Without one, S3 rejects the preflight with
`403` and every upload fails in the browser even though server-side calls work.
List the same origins as the API's `CORS_ORIGINS`:

```json
[
  {
    "AllowedOrigins": ["http://localhost:4302", "http://127.0.0.1:4302"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["content-type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

Add each deployed web origin to `AllowedOrigins`. Previews and thumbnails use
signed `GET` URLs in `<img>`/`<video>` elements, which do not need CORS.

## Design source

Claude Design is optional. Pick where the product's UI and behavior come from and
record it in `design.config.json`:

```bash
pnpm design:source --set claude-design                        # design in Claude Design
pnpm design:source --set spec --brief docs/product-brief.md   # build from a written brief
```

In spec mode there is no `design/` export. Run `/sync-build-docs <project name>`
to draft the root build documents from the brief and the boilerplate's own
design system, approve each screen's spec section, and let Codex build approved
screens against the Spec QA checklist. See
[Building without Claude Design](docs/design-handoff.md#building-without-claude-design).
The rest of this section describes the Claude Design path.

## Claude Design handoff

Before design work begins, open Claude Code in the product repository and run:

```text
/prepare-claude-design <project name>
```

This creates `design/CLAUDE_DESIGN_PROMPT.md`. Paste that file into Claude
Design, complete the design, and copy the export into `design/prototypes/`,
`design/system/`, and `design/planning/`, including `design/design-release.json`,
`design/planning/screen-inventory.md`,
`design/handoff/[PROJECT] Design Reference.md`, and
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
design, export the corrected files into `design/` as the first buildable batch, then run:

```bash
pnpm sync-skills
pnpm design:validate
```

For every validated design batch, open Claude Code and run:

```text
/sync-build-docs <project name>
```

This creates or incrementally updates the same root build documents and unblocks
only screens declared `readyForBuild`. Claude Design can continue later screens
while Codex implements an already released slice.

When the complete required MVP design is marked final and synchronized, run:

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
boilerplate tracking and product identity, replace starter presentation,
configure environments and third-party projects, and verify that placeholder
values do not leak into a deployment.

## Continuous project learning

After a product fix is verified, run:

```text
/capture-project-learning <short lesson name>
```

The command creates a reviewable JSON proposal under `skill-contributions/` and
routes it to exact skill categories from the locked snapshot, such as `mobile-app`,
`web-app`, or `api-app`. Run `pnpm skills:contribution:validate --file <path>`
before committing it.

When the proposal reaches the product repository's `main` branch,
`.github/workflows/submit-project-learning.yml` sends it to `skills-source` as a
review issue. Configure a separate product-repository Actions secret named
`SKILLS_SOURCE_CONTRIBUTION_TOKEN`; do not reuse `APP_BOILERPLATE_SYNC_TOKEN`.
The token needs access to dispatch events to `jade-kenneth/skills-source`.
Canonical skill changes still require a separate reviewed promotion PR.

## Useful commands

```bash
pnpm build
pnpm lint
pnpm typecheck
pnpm -r --if-present test
pnpm check-skills
```

When this template becomes a new product repository, initialize its upstream
boilerplate tracking once:

```bash
pnpm boilerplate:setup
git add boilerplate.lock.json
git commit -m "chore: record boilerplate starting revision"
```

Use `pnpm boilerplate:check` to report later template updates, then apply
explicit reviewed commits on a clean product branch with
`pnpm boilerplate:port --sha <full-app-boilerplate-sha>`. Run
`pnpm boilerplate:ack --sha <full-reviewed-through-sha>` only after every
commit through that revision was applied or deliberately declined. Use
`pnpm boilerplate:contributions` to detect product changes that may be worth
porting back as reusable architecture. See
[`docs/boilerplate-updates.md`](docs/boilerplate-updates.md) for the reviewed
update and contribution workflow.

GraphQL client types are generated from the local API schema:

```bash
pnpm --filter app-web codegen
```

## Engineering conventions

New to this repository? [How app-boilerplate works](docs/how-app-boilerplate-works.md)
is a beginner-oriented map of the whole system — architecture, request flow, auth,
multi-tenancy, the skills/design pipelines, and CI gates — with diagrams throughout.

- [Project structure](docs/conventions/project-structure.md)
- [Code style](docs/conventions/code-style.md)
- [Development workflow](docs/conventions/workflow.md)
- [Third-party integrations](docs/THIRD_PARTY_INTEGRATIONS.md) — Cloudflare
  Turnstile, Google sign-in, and Xendit payments; all optional and off by default

Agent instructions are generated from the locked `skills-source` revision. Use
`pnpm sync-skills` to hydrate the locked revision, `pnpm update-skills` to
intentionally update it, and `pnpm check-skills` to detect drift.
