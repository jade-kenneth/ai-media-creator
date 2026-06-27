# App Boilerplate

A production-grade, multi-tenant **Nx monorepo boilerplate** with a NestJS GraphQL API, a Next.js admin/super-admin web app, and an Expo (React Native) mobile app — sharing types through a workspace package.

It was extracted from a real, shipped product and stripped down to the **reusable fundamentals** so you can start a new project without rebuilding auth, multi-tenancy, push notifications, file uploads, mail, theming, i18n, and the surrounding patterns from scratch.

A single example domain feature — **Announcements** — is kept end-to-end (API ➝ admin ➝ mobile) as a copy-paste template for your own modules.

---

## Apps & packages

| Path | What it is | Stack |
| --- | --- | --- |
| `apps/app-api` | GraphQL API | NestJS · Apollo · Mongoose (MongoDB) · schema-first GraphQL · JWT auth |
| `apps/app-admin` | Admin + Super-Admin web app | Next.js (App Router) · React · TanStack Query · Tailwind · shadcn/ui |
| `apps/app-mobile` | Member mobile app | Expo · React Native · expo-router · TanStack Query · NativeWind · i18next |
| `packages/shared-constants` | Cross-app types/constants | published in-workspace as `@app/shared-constants` |

The import namespace is `@app/*` and the workspace condition is `@app/source` — see [Renaming the boilerplate](#renaming-the-boilerplate-for-your-project).

---

## What's included (generic / reusable)

**API (`app-api`)**
- **Auth** — JWT access/refresh, login, registration + approval flow, sessions, guards (`GraphqlAuthGuard`, `RolesGuard`, throttler), `@Roles` / `@Public` / `@CurrentTenant` decorators
- **Multi-tenancy** — `organizations` module + `TenantMiddleware` (tenant resolved per request)
- **Users & Members** — `users` (admin/staff accounts) and `members` (end-users) with role-based access
- **Admin management & account-deletion requests** — super-admin tooling
- **Notifications** — in-app notifications + **Expo push** (`push-notifications`, `push-tokens`)
- **Mail** — transactional email (Brevo) with templates
- **File uploads** — S3 presigned URLs (`s3` module)
- **Dashboard** — admin + super-admin KPI summaries
- **Waitlist** — lead-capture/"request a demo"
- **Infra** — request-logging middleware, structured logger, error formatting, env validation (zod), rate limiting, CORS/security headers, scheduler locks, repository-factory pattern over Mongoose
- **Example CRUD** — `announcements`

**Admin (`app-admin`)**
- Auth + route guards, admin shell & super-admin shell with sidebars
- Dashboard (admin + super-admin), members, **announcements (example CRUD)**, push-tester
- Super-admin: organizations, admin-accounts, account-deletion-requests, waitlist
- DataTable / RichText / Prose components, feature-flag mechanism, dark mode, i18n, landing page

**Mobile (`app-mobile`)**
- Auth (login, register, onboarding, organization picker, registration pending/rejected)
- Tabs: Home, Notifications, Profile
- Providers: Auth, Tenant, Theme preference, Language preference
- Push notifications wiring, **announcements (example feature)**, theming, i18n

> The original domain features (document requests, polls, schedules, officials, emergency contacts, event posts, gallery, service catalog) were removed. **Announcements** remains as the worked example.

---

## Prerequisites

- Node 20+ and npm
- A MongoDB instance (local or Atlas)
- (Mobile) Xcode / Android Studio for native builds; an Expo account for EAS

---

## Getting started

```bash
# 1. Install dependencies (workspace root)
npm install

# 2. Configure environment
cp .env.example .env                 # API + shared config — fill in MongoDB, JWT, AWS, Brevo
cp apps/app-mobile/.env.example apps/app-mobile/.env

# 3. Generate GraphQL types (required — the committed generated files are placeholders)
npm run --workspace app-api generate-graphql-types   # API interfaces from src/graphql/schemas/*.gql
npm run --workspace app-admin codegen                # admin typed operations
npm run --workspace app-mobile codegen               # mobile typed operations

# 4. Seed the default admin / super-admin accounts
npm run --workspace app-api seed:default-admin

# 5. Run the apps (separate terminals)
npm run api        # NestJS API on :3001
npm run admin      # Next.js admin on :3000
npm run mobile     # Expo dev server
```

### Mobile native projects

Native `android/` and `ios/` folders are **not** committed (they are generated). Before a native run/build:

```bash
cd apps/app-mobile
cp google-services.example.json google-services.json   # replace with your Firebase config
npx expo prebuild                                       # regenerates android/ + ios/
```

Update the identifiers in `apps/app-mobile/app.json` (`slug`, `scheme`, `ios.bundleIdentifier`, `android.package`, `extra.eas.projectId`, `owner`) to your own.

---

## Renaming the boilerplate for your project

The placeholder namespace is `@app`. To rebrand to e.g. `@acme`:

1. Replace `@app/` ➝ `@acme/` and `@app/source` ➝ `@acme/source` in `package.json`, `tsconfig.base.json`, and `packages/shared-constants/package.json`.
2. Optionally rename the app folders / Nx project names (`app-api`, `app-admin`, `app-mobile`) and the root `package.json` scripts that reference them.
3. Update mobile identifiers in `apps/app-mobile/app.json` and the bundle ID `com.example.appmobile`.
4. Re-run codegen.

---

## ⚠️ Finishing the setup (read this)

This boilerplate was extracted by pruning a larger app. The structure, wiring, and brand renaming are complete and internally consistent, **but the committed GraphQL `generated/` / `generated__types.ts` files are stale** (they still describe removed types and the old schema shape). They are normally git-ignored build artifacts.

After `npm install`, run codegen (step 3 above) and a typecheck to surface and fix any remaining references:

```bash
npm run typecheck        # nx run-many -t typecheck --all
```

Expect a small number of leftover type errors to clean up after codegen — primarily where UI referenced fields/enums that were trimmed from the example schema. This is the intended "last mile" of adapting the boilerplate to your project.

---

## Architecture docs

See `docs/` for deep dives that still apply to this boilerplate:

- `NESTJS_GRAPHQL_AUTH_PIPELINE.md` — auth/guards/resolver pipeline
- `MONGODB_REPOSITORY_AND_INDEXING.md` — the repository-factory pattern
- `multi-tenant-architecture.drawio` — tenant resolution
- `refresh-token-architecture.drawio` — session/refresh flow
- `push-notification-flow.drawio` — Expo push pipeline
- `LOGGING_AND_OBSERVABILITY.md`, `SECURITY_RATE_LIMITING_CORS_HEADERS.md`, `REACT_NATIVE_DOCS.md`, `GOOGLE_PLAY_PUBLISHING.md`

---

## Useful commands

```bash
npm run build                 # build all projects
npm run lint                  # lint all projects
npm run typecheck             # typecheck all projects
npx nx graph                  # visualize the project graph
docker compose up -d          # local Kafka (optional async event bus)
```
