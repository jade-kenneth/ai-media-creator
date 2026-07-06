# 13 — Tech stack (extensive, repo-connected)

Don't just list the stack — **teach it**. For every core technology, show what it
is, the exact job it does *in this repo*, the **config/setting file that wires it
up**, the **folder/structure it imposes**, and how it **connects to the next
technology in the chain**. The whole point of this section is to turn "we use X"
into "X is configured *here*, used *there*, and hands off to Y *like this*."

Produces the `index.html` Tech-stack section: an **overview table** followed by
**per-technology deep-dive cards** (each card ends with its own AI tutor box).

## Part A — Overview table (keep this, it's the at-a-glance map)

One row per technology. Columns:

| Technology | Layer | Where it's configured | What it does here | Why it's used | Real-world analogy | Related files (`path:line`) |
|---|---|---|---|---|---|---|

- **Layer** = one of: Monorepo/tooling · Language · Backend · API · Database ·
  Frontend (web) · Frontend (mobile) · Styling · Data fetching · Auth · Async/infra · Build/CI.
- **Where it's configured** must point at a **real settings file** (not "the code"):
  e.g. `nx.json`, root `package.json` (workspaces), `tsconfig.base.json`,
  `codegen.ts`, `next.config.*`, `app.json`/`eas.json`, `tailwind.config.*`,
  `docker-compose.yml`, `config/env.schema.ts`, `nest-cli.json`.
- Every "Related files" cell cites a real `path:line` from the manifest, or
  `Not detected from current files.`

## Part B — Per-technology deep-dive cards (the extensive part)

Make **one `.card` per CORE technology** the project actually depends on (confirm
against `manifest.json` `signals.dependencies` + the lockfile + config files —
never list a tech you can't point to). Skip anything not present with
`Not detected from current files.` Don't pad the list with trivial transitive deps;
pick the technologies a new developer must understand to be productive.

### Card shape (each one)

```
### <Technology> — <one-line role in THIS repo>
- **What it is:** one plain sentence + a real-world analogy.
- **Its job in this project:** the concrete responsibility it owns here.
- **How it's wired up (settings):** the exact config file(s) + `path:line` that
  turn it on and the key options that matter — e.g. the workspaces glob, the
  `paths` alias, the codegen `schema`/`generates` targets, the strict-mode flag,
  the env vars it reads. Quote the *setting name*, never a secret value.
- **The structure it imposes:** the folders/file-naming this tech expects and how
  this repo follows it — cite the real directories (`apps/…`, `packages/…`,
  `src/modules/…`, `app/…`, `react-query/…`).
- **How it connects to the rest of the stack:** name the technology *before* and
  *after* it in the chain and the hand-off (e.g. "the `.gql` SDL → graphql-codegen
  → the generated hooks the React components import"). This is the most important
  line — it's what makes the stack a *system*, not a pile of tools.
- **Version (if visible):** from `package.json`/lockfile — note majors that change
  conventions (e.g. Tailwind v4, Next.js App Router, React 19).
- **Beginner mistake to avoid:** one concrete pitfall specific to this tech here.
- **Best-practice rule:** one rule a contributor should follow in this repo.
```

End every deep-dive card with its **own** per-card AI tutor box as the card's last
child (so `box.closest('.card')` grounds the tutor in that one technology). Reuse
existing classes — add no new CSS/script (same pattern as `references/03-frontend.md`):

```html
<div class="topic-chat" data-topic-slug="tech-<slug>" data-topic-title="Tech stack: <Technology>">
  <div class="chat-head"><h3>Ask the AI tutor about this</h3><span class="ai-status">tutor offline</span></div>
  <div class="chat-log" aria-live="polite"></div>
  <form class="chat-form">
    <input class="chat-input" type="text" autocomplete="off" aria-label="Ask the AI tutor about <Technology>" placeholder="Ask about “<Technology>”…" />
    <button class="chat-send" type="submit">Send</button>
  </form>
  <p class="chat-hint">Topic-scoped chat (OpenCode Zen). Needs the local tutor: <code>cd reference/project-learning-audit/tutor-server &amp;&amp; npm start</code>.</p>
  <noscript>The AI tutor needs JavaScript.</noscript>
</div>
```

`<slug>` = kebab-case of the technology; keep it unique on the page. Escape `<`,
`>`, `&`, `"` in the title attribute.

## Part C — "How the stack connects" mini-diagram (always include, after the cards)

A single CSS-only `.flow` strip that walks the request across the *technologies*
(not the files) so the learner sees the stack as a pipeline. One step per tech in
the order data flows, each with the config/entry file in the `.f` line:

```html
<div class="flow blue" style="--steps:7;">
  <div class="flow-step"><span class="n">1</span><span class="t">Next.js / Expo</span><span class="f">app/… — renders UI</span></div>
  <div class="flow-step"><span class="n">2</span><span class="t">TanStack Query</span><span class="f">react-query/… — calls the hook</span></div>
  <div class="flow-step"><span class="n">3</span><span class="t">graphql-request</span><span class="f">client — sends the operation</span></div>
  <div class="flow-step"><span class="n">4</span><span class="t">NestJS resolver</span><span class="f">*.resolver.ts — guards + delegates</span></div>
  <div class="flow-step"><span class="n">5</span><span class="t">Service</span><span class="f">*.service.ts — business logic</span></div>
  <div class="flow-step"><span class="n">6</span><span class="t">Mongoose</span><span class="f">*.repository.ts — queries Mongo</span></div>
  <div class="flow-step"><span class="n">7</span><span class="t">MongoDB</span><span class="f">returns documents</span></div>
</div>
```

Adapt the steps to the **actual** stack you detected; set `--steps` to the count.
Keep it to the detected technologies only.

## How to pick "core" (so the section stays focused)

Read these signals from `manifest.json` and the config files, in order:
1. **Monorepo/tooling** — `nx.json`, root `package.json` `workspaces`, the package
   manager (npm/pnpm/yarn lockfile).
2. **Language + compiler settings** — `tsconfig*.json` (strict mode, `paths`
   aliases, module target).
3. **Backend framework + API style** — Nest (`nest-cli.json`, `@nestjs/*`),
   GraphQL vs REST (`*.gql` schemas, `@nestjs/apollo`), `codegen.ts`.
4. **Database + data layer** — Mongoose/Prisma/TypeORM deps + schema/model files.
5. **Frontend frameworks** — Next.js (`next.config.*`, `app/`), Expo/React Native
   (`app.json`, `eas.json`, `app/` router).
6. **Styling** — Tailwind/NativeWind (`tailwind.config.*`, `globals.css`).
7. **Data fetching** — TanStack Query + the hand-rolled `GraphQLClient`.
8. **Auth** — JWT/passport deps + the auth module + env (`JWT_*`).
9. **Async/infra** — Kafka, schedulers, S3, email/push providers (deps + compose +
   `config/env.schema.ts`).

Each of those that's actually present becomes a deep-dive card.

## This codebase's likely core stack (confirm against the scan; cite real config)

Use as hints only — prove each from the manifest before asserting:

- **Nx + npm workspaces** — `nx.json`, root `package.json` `workspaces: ["apps/*","packages/*"]`. Imposes the `apps/`+`packages/` split; `npx nx <target> <project>` runs per-app tooling. Connects everything: shared types flow through `packages/shared-constants`.
- **TypeScript** — `tsconfig.base.json` `paths` map `@brgy-system/shared-constants` to the shared package; strict mode. Connects the three apps to one type source.
- **NestJS** — `nest-cli.json` + `apps/brgy-system-api/src/main.ts`. Imposes the `modules/<feature>/` resolver→service→repository shape. Hands the API surface to GraphQL.
- **Apollo GraphQL (schema-first)** — SDL in `src/graphql/schemas/**/*.gql` compiled to `src/graphql/generated/graphql.ts`. The contract every client codegen reads.
- **graphql-codegen** — `codegen.ts` in each client points at the API's `.gql` files; `generates` writes `react-query/generated__types.ts` (admin) and the mobile typed ops. The bridge from server SDL to typed client hooks.
- **Mongoose / MongoDB** — connection from `MONGODB_URI` (`config/env.schema.ts`), base repo in `src/libs/` (`repository.ts`, `moongose-repository.ts`, `cursor.ts`) giving cursor/Relay pagination. The persistence layer behind every service.
- **Next.js App Router** — `apps/brgy-system-admin/app/` with `(super-admin)` and `admin` groups; `next-intl` locale in `proxy.ts`. The admin/super-admin surface.
- **shadcn/ui + Tailwind v4** — `tailwind.config.*`/`globals.css`; prefer canonical utilities. Note v4's CSS-first config if present.
- **Expo + React Native + Expo Router + NativeWind** — `app.json`, `eas.json`, `apps/brgy-system-mobile/app/` `(auth)`/`(main)` groups, providers under `providers/`. The resident mobile app.
- **TanStack Query + hand-rolled `GraphQLClient`** — `react-query/<feature>/*.ts` hooks + query keys; client returns a discriminated `{ ok, data } | { ok:false, error }`. The data-fetching layer both clients share by pattern (not by code).
- **Kafka / @nestjs/schedule / S3 / Brevo / Expo push / Zod env** — `docker-compose.yml` (Kafka KRaft :9092), `libs/async-event-module`, `scheduler-locks`, `modules/s3`, `modules/mail`, `modules/push-notifications`, `config/env.schema.ts`. The async/infra edges; gate by env.

## Rules

- Ground **every** card and table row in a real config/`path:line`, or write
  `Not detected from current files.`
- Cite **settings**, not just source — the value-add of this section is showing
  *where the tech is turned on and tuned*.
- Never quote a secret value from `.env`/config; cite the *setting name* and file only.
- Escape `<`, `>`, `&` in any code/config snippet.

## Output of this phase

- Tech-stack section = overview table (Part A) + per-technology deep-dive cards
  (Part B, each ending in its own AI tutor box) + the "how the stack connects"
  flow strip (Part C).
