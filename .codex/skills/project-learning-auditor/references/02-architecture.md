# 02 — Architecture

Explain the full architecture: what each part is, where it lives, and how the
parts connect. Produce the architecture HTML section + `concept-map.md`.

## Detect & describe each part

For each, say what it is, the folder that proves it, and one beginner sentence.
Mark anything unsupported by the scan as `Not detected from current files.`

- **Frontend app(s)** — web admin, public/landing, mobile. Cite `apps/*`.
- **Backend API** — REST and/or GraphQL. Cite the API app + `markers.graphql`.
- **Database** — engine + ORM/ODM. Cite schema files / ORM deps.
- **Authentication** — where identity is checked. Cite the auth module.
- **Authorization / roles** — guards, role enums, decorators.
- **Storage** — file/object storage, if present.
- **Notifications** — push/email/SMS, if present.
- **Third-party integrations** — payment, maps, analytics, email providers (from deps).
- **Deployment / hosting** — `infra` files, CI workflows, Docker, EAS.
- **Shared packages / libraries** — monorepo `packages/*`, shared constants/types.

## The end-to-end narration (always include)

Write the canonical request lifecycle in plain English, grounded in real files:

```
User opens the frontend            (apps/.../screen-or-page)
→ Frontend sends an API request    (the data-fetching hook / client)
→ Backend checks authentication    (guard / middleware)
→ Backend validates the input      (DTO / schema)
→ Backend runs business logic      (service)
→ Backend queries the database     (repository / model)
→ Database returns data
→ Backend sends a response
→ Frontend updates the UI           (state / cache update)
```

Replace each parenthetical with the **actual** file path from the scan. If a step
genuinely cannot be located, keep the step but write `Not detected from current files.`

## Architecture diagram (HTML/CSS only)

Render a simple layered diagram in the architecture section: a column or row of
boxes (Mobile · Admin · API · Database, plus Storage/Notifications if present),
connected by CSS-drawn arrows. No external diagram library. Follow the visual
conventions in `references/09-diagrams.md`. This is a static layout diagram (it
may animate the request path, but does not have to).

## `concept-map.md`

A short markdown file linking the analogy nodes (§01) to the real parts and their
folders — a quick "where does each idea live" index. Use auto-region markers.

## Monorepo note (common in this codebase)

If `apps/` holds multiple apps and `packages/` holds shared code, explain the
monorepo shape: each app is deployed separately but shares types/constants. Cite
`apps/` and `packages/` directly.

## Output of this phase

- Architecture HTML section: parts list + end-to-end narration + layout diagram.
- `concept-map.md`.
