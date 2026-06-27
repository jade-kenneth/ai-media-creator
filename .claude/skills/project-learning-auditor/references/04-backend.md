# 04 — Backend deep dive

Explain the backend patterns the project actually uses. Produce **pattern cards**
for the backend section of `index.html`, plus the request-lifecycle trace.

## Patterns to scan for and explain

Cover the ones that exist (else `Not detected from current files.`):

- API surface: REST endpoints and/or GraphQL schema + resolvers
- Module structure (NestJS modules) / route structure
- Controller pattern
- Service pattern (business logic)
- Repository / data-access pattern
- DTO / schema validation (`class-validator`, zod, GraphQL input types)
- Authentication flow (JWT/session, login, refresh)
- Authorization & role checks (guards, `@Roles`, policies)
- Middleware / interceptors / pipes
- Guards
- Tenant scoping (`tenantId`/`barangayId` on every query)
- Database query pattern + ORM/ODM usage
- GraphQL resolver pattern (queries, mutations, `@ResolveField`, dataloaders)
- Background jobs / cron / schedulers
- Queues (if present)
- File upload handling
- Notification sending
- Error handling (filters, exceptions)
- Logging
- Rate limiting
- Caching
- Transactions
- Environment / config management
- Security-sensitive areas & deployment risks

De-dup repeated patterns; explain once, list all locations.

## Pattern card shape (each one)

```
### <Pattern name>
- **What it is:** one plain sentence.
- **Where it appears:** path:line (+ other occurrences).
- **Why it exists:** the problem it solves.
- **How a request moves through it:** the steps.
- **Risk if done wrong:** one concrete risk.
- **Best practice to follow:** one rule.
```

## Per-card AI tutor (required, one per card)

Each backend pattern card ends with its **own** AI tutor box, scoped to that single
card, for a continuous topic-scoped conversation about *this exact pattern*. Add it
as the **last child inside** the card's `.card` div (so `box.closest('.card')`
grounds the tutor in that one card). Reuse existing classes — no new CSS/script.
See `references/12-topic-deepdive.md` for the proxy/why/setup.

```html
<div class="topic-chat" data-topic-slug="<card-slug>" data-topic-title="<Pattern name>">
  <div class="chat-head"><h3>Ask the AI tutor about this</h3><span class="ai-status">tutor offline</span></div>
  <div class="chat-log" aria-live="polite"></div>
  <form class="chat-form">
    <input class="chat-input" type="text" autocomplete="off" aria-label="Ask the AI tutor about <Pattern name>" placeholder="Ask about “<Pattern name>”…" />
    <button class="chat-send" type="submit">Send</button>
  </form>
  <p class="chat-hint">Topic-scoped chat (OpenCode Zen). Needs the local tutor: <code>cd reference/project-learning-audit/tutor-server &amp;&amp; npm start</code>.</p>
  <noscript>The AI tutor needs JavaScript.</noscript>
</div>
```

`<card-slug>` = kebab-case of the pattern name, unique on the page. Escape `<`, `>`,
`&`, `"` in the title attribute.

## The request-lifecycle trace (always include)

Grounded in real files:

```
Frontend sends a request
→ Controller/Resolver receives it     (resolver path:line)
→ Guard checks the user is logged in  (guard path:line)
→ Guard/policy checks the role/tenant (path:line)
→ DTO/input validates the body        (dto path:line)
→ Service applies business rules      (service path:line)
→ Repository/model queries the DB     (path:line)
→ Response is returned to the frontend
```

## This codebase's likely stack (confirm against the scan)

- **API:** NestJS + GraphQL (code-first or schema-first via `*.gql`), Mongoose
  (MongoDB). Look in `apps/brgy-system-api/src/` (`modules/`, `graphql/`).
- Resolvers live per-module under `modules/<name>/<name>.resolver.ts`; services
  under `<name>.service.ts`; schemas under `<name>.schema.ts` or `graphql/schemas/*.gql`.
- Schedulers exist (e.g. polls reminder) — explain the cron/scheduler pattern and
  flag any locking concern (see audit).
- Multi-tenant: confirm whether queries are scoped by `barangayId`/`tenantId`.

## Output of this phase

- Backend pattern cards (each ending with its own per-card AI tutor box) + the
  request-lifecycle trace.
