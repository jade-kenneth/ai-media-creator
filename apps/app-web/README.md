# Web admin

Next.js admin application for the reusable multi-tenant platform foundation.

## Retained foundation

- JWT authentication with access and refresh sessions
- admin and super-admin route guards
- organization and administrator management
- account-deletion compliance workflow
- S3-backed image uploads
- push-notification delivery testing
- internationalization, themes, shadcn/ui, and reusable data tables

Product-specific modules should live in their own feature directories and add
their own GraphQL operations instead of changing the shared shell.

## Environment

Copy `.env.example` to `.env.local` and configure the API endpoints, application
name, privacy contact, and optional S3 public hostname.

## Commands

Run from the repository root:

```bash
npm run web
npm run lint --workspace=app-web
npm run build --workspace=app-web
npm run codegen --workspace=app-web
```

The root route redirects to `/login`. Authenticated organization admins use
`/admin`; platform administrators use `/super-admin`.
