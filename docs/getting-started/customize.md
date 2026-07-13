# Customize the boilerplate

Use this checklist immediately after creating a new application from the repository.

## 1. Initialize boilerplate tracking

After the new product repository has its own `origin`, run:

```bash
npm run boilerplate:setup
git add boilerplate.lock.json
git commit -m "chore: record boilerplate starting revision"
```

This safely adds and fetches the upstream `boilerplate` remote and records the
revision used by the product. If you cloned the source repository instead of
using GitHub's template action, rename its original remote and add the product
remote before running setup.

## 2. Rename the workspace

Replace the neutral placeholders with the product name and package scope:

- root `package.json` name
- app names and display names
- Expo bundle/package identifiers
- page titles and metadata
- email sender name and address
- database name
- deployment project names

Keep reusable package names generic unless they truly belong to the product domain.

## 3. Configure environments

Copy the root environment template and each app-specific template:

```bash
cp .env.example .env
```

Use local or test credentials during development. Never commit secrets, production tokens, private keys, or real bootstrap passwords.

## 4. Replace starter presentation

Replace placeholder logos, icons, colors, copy, email templates, sample records, and screenshots. Product branding belongs in the owning application, not in shared packages.

## 5. Define the product domain

Add business modules inside the app that owns them. Move code to `packages/` only when it is genuinely shared, framework-independent where practical, and used by more than one app.

## 6. Verify identifiers

Search before the first product commit:

```bash
git grep -nE 'App Boilerplate|@app/boilerplate|app-db|example\.com'
```

Review every match. Some placeholders may remain intentionally in documentation or environment examples.

## 7. Validate the workspace

```bash
npm install
npm run lint
npm run typecheck
npm run build
npm test --workspaces --if-present
npm run check-skills
npm run boilerplate:check
```

Document any intentionally skipped check in the pull request.
