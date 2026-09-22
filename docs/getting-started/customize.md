# Customize the boilerplate

Use this checklist immediately after creating a new application from the repository.

## 1. Initialize boilerplate tracking

After the new product repository has its own `origin`, run:

```bash
pnpm boilerplate:setup
git add boilerplate.lock.json
git commit -m "chore: record boilerplate starting revision"
```

This safely adds and fetches the upstream `boilerplate` remote and records the
revision used by the product. If you cloned the source repository instead of
using GitHub's template action, rename its original remote and add the product
remote before running setup.

## 2. Initialize product identity

Run the guided initializer:

```bash
pnpm project:init
```

It asks for:

- product display name;
- URL/package slug;
- npm package scope;
- reverse-domain mobile namespace;
- optional owned web/email domain;
- local database name.

For automation or CI-assisted setup, pass the values directly:

```bash
pnpm project:init -- \
  --name "Dala" \
  --slug dala \
  --scope @dala \
  --namespace com.jadey \
  --domain dala.app \
  --database dala-db
```

Use `--dry-run` to preview the exact files. The command is idempotent and
accepts only boilerplate placeholders or values already matching the requested
identity. If a target is already customized, it stops before writing anything.
Use `--force` only when replacing that custom identity is intentional.

The initializer updates:

- root package name and package-lock workspace name;
- README product heading;
- Expo display name, slug, scheme, Android package, and iOS bundle identifier;
- root/API local database defaults;
- web application display name;
- email sender name;
- example admin, sender, and privacy emails when an owned domain is supplied.

It deliberately preserves `apps/app-web`, `apps/app-mobile`,
`apps/app-api`, their package names, and shared architecture paths. Stable
internal names reduce conflicts when reviewing future boilerplate updates.

It also leaves external-resource identifiers untouched because they cannot be
safely inferred from a project name:

- Expo owner and EAS project ID;
- S3 bucket, CDN, and AWS credentials;
- hosting and deployment project IDs;
- production domains, secrets, and service tokens;
- logos, icons, store assets, colors, and product copy.

## 3. Configure environments

Copy the root environment template and each app-specific template:

```bash
cp .env.example .env
```

Use local or test credentials during development. Never commit secrets,
production tokens, private keys, or real bootstrap passwords. Create the actual
Expo/EAS, storage, email, database, and deployment resources before replacing
their remaining placeholders.

## 4. Replace starter presentation

Replace placeholder logos, icons, colors, copy, email templates, sample records,
and screenshots. Product branding belongs in the owning application, not in
shared packages.

## 5. Define the product domain

Add business modules inside the app that owns them. Move code to `packages/`
only when it is genuinely shared, framework-independent where practical, and
used by more than one app.

## 6. Verify identifiers

Search before the first product commit:

```bash
git grep -nE 'App Boilerplate|@app/boilerplate|app-db|example\.com|your-eas-project-id|your-expo-username'
```

Review every match. Some placeholders may remain intentionally in documentation
or environment examples, but none should leak into a production configuration.

## 7. Validate the workspace

```bash
pnpm test:project-init
pnpm install
pnpm lint
pnpm typecheck
pnpm build
pnpm -r --if-present test
pnpm check-skills
pnpm boilerplate:check
```

Document any intentionally skipped check in the pull request.
