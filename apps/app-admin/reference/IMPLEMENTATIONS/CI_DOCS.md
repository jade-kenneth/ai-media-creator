# CI Documentation

This document reflects the current CI workflow in `.github/workflows/ci.yml`.

## Workflow Trigger

CI runs on:

- `push` to `main`
- `pull_request` targeting `main`

## Permissions

The workflow uses read-only permissions:

- `actions: read`
- `contents: read`

## Current Job: `main`

Runner:

- `ubuntu-latest`

Steps:

1. Checkout repository with full history (`actions/checkout@v4`, `fetch-depth: 0`)
2. Setup Node.js 20 with npm cache (`actions/setup-node@v4`)
3. Install dependencies: `npm ci --legacy-peer-deps`
4. Install Playwright browsers and system deps: `npx playwright install --with-deps`
5. Set Nx SHAs (`nrwl/nx-set-shas@v4`)
6. Run affected tasks: `npx nx affected -t lint test build e2e`

## Current State Notes

- CI currently has a single job (`main`).
- No dedicated `apk-release` job is defined in the active workflow file.
- Branch target has been aligned to `main` (not `master`).
