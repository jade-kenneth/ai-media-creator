# Customize the boilerplate

Use this checklist immediately after creating a new application from the repository.

## 1. Rename the workspace

Replace the neutral placeholders with the product name and package scope:

- root `package.json` name
- app names and display names
- Expo bundle/package identifiers
- page titles and metadata
- email sender name and address
- database name
- deployment project names

Keep reusable package names generic unless they truly belong to the product domain.

## 2. Configure environments

Copy the root environment template and each app-specific template:

```bash
cp .env.example .env
```

Use local or test credentials during development. Never commit secrets, production tokens, private keys, or real bootstrap passwords.

## 3. Replace starter presentation

Replace placeholder logos, icons, colors, copy, email templates, sample records, and screenshots. Product branding belongs in the owning application, not in shared packages.

## 4. Define the product domain

Add business modules inside the app that owns them. Move code to `packages/` only when it is genuinely shared, framework-independent where practical, and used by more than one app.

## 5. Verify identifiers

Search before the first product commit:

```bash
git grep -nE 'App Boilerplate|@app/boilerplate|app-db|example\.com'
```

Review every match. Some placeholders may remain intentionally in documentation or environment examples.

## 6. Validate the workspace

```bash
npm install
npm run lint
npm run typecheck
npm run build
npm test --workspaces --if-present
npm run check-skills
```

Document any intentionally skipped check in the pull request.
