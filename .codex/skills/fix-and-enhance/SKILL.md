---
name: fix-and-enhance
description: "Three-step workflow for every fix or enhancement in this monorepo: pull the task from Notion first, apply the change in the owning app, then feed the reusable lesson back into that app's standard. USE whenever the user requests a bug fix, enhancement, improvement, or feature. TRIGGERS: 'fix', 'fix this', 'fix the bug', 'enhance', 'improve', 'add', 'implement', 'polish', feature requests, any change request that alters behavior. EXAMPLES: 'fix the login crash', 'enhance the signup form', 'add a delete button', 'improve the checkout flow', 'this is broken, fix it', 'polish this screen'."
---

# Fix & Enhancement Workflow

Follow this three-step loop **every time** the user asks for a fix or an enhancement (any "fix", "fix this", "enhance", "improve", "add", feature-request, or similar behavior change). The order is fixed: **Notion → code → standard.**

Do not skip a step because a change "looks small." The point of the loop is that one-off fixes become durable rules and every change is tracked.

---

## Step 1 — Pull from Notion first (before touching code)

Use the **Notion MCP** to work the project task/bug tracker (the project's tracker database in Notion) as the source of truth for scope.

1. **Find the matching item.** Search the tracker for the task/bug. If the user names a symptom rather than a task, search to locate the owning item.
2. **Read it fully.** Treat the **Description**, **Root cause**, and **Fix** notes as the authoritative scope — this avoids re-investigating what's already diagnosed and keeps the change tight.
3. **If no matching item exists, create one first** before any code changes:
   - **Task type** — pick the fitting one: 🐞 Bug / 💬 Feature request / 💅 Polish.
   - **Task name** — clear and specific.
   - **Description** — the problem.
   - **Status** — `In progress`.

> Never start editing code until the tracker item exists and you've read its scope.

---

## Step 2 — Apply the fix (owning app only)

1. Make the change **in the owning app only**, following that app's established patterns (reuse the pattern already used in that layer/feature — don't introduce a new one).
2. Keep changes scoped; validate the smallest relevant slice first (only the affected app's paths).
3. When the change lands, update the Notion item's **Status** to `Done`, and add a short **root-cause + fix** note in the page body if one isn't already there.

---

## Step 3 — Enhance the relevant standard

After the fix is applied, capture the **reusable lesson** where that app's standards live. Write it **generically** — the rule or pattern itself, never this fix's domain, routes, filenames, or project labels. Concrete/project-specific values stay in app source.

### Where the lesson goes (by owning app)

| Owning app | Home for the lesson |
| --- | --- |
| Admin / Next.js (`apps/app-admin`) | the **`web-app`** skill |
| Mobile / Expo / React Native (`apps/app-mobile`) | the **`mobile-app`** skill |
| API / NestJS / GraphQL (`apps/app-api`) — no dedicated skill yet | the API app's own **`AGENTS.md` and `CLAUDE.md`**, kept in sync (write the same lesson into the equivalent section of each) |

For the client skills, put the lesson in the right place: SKILL.md non-negotiables + `references/*.md`.

### Then sync any cross-cutting lesson to its sibling(s)

- **`web-app` ↔ `mobile-app`.** These carry parallel reference files (e.g. `references/caching.md`, `graphql-patterns.md`, `react-patterns.md`, `typescript-patterns.md`). If a lesson is **not** platform-specific — it holds for both admin and mobile — add it to the matching reference in **both** skills, in the equivalent section of each. The copies have diverged over time, so **insert the guidance to match each file's structure** rather than copy-pasting one over the other.
- **API ↔ client.** Mirror a shared API↔client convention (e.g. a GraphQL contract or an error-code rule) into the other side too.

**Skip the sibling only when** the lesson is genuinely bound to one platform (Expo/native-only, Next.js/SSR-only, or backend-only) or the sibling has no parallel location.

> Only edit skills in **this repo's** `.claude/skills/` — never the boilerplate repo.

---

## Why this order

The tracker already holds the diagnosed root cause and intended fix, so starting there avoids re-investigating and keeps scope tight. Feeding each fix back into the owning app's standard turns one-off fixes into durable rules — but **only when written generically**; otherwise the standard fills up with project trivia instead of transferable rules. The clients have skills for this; until the API gets its own skill, its `AGENTS.md`/`CLAUDE.md` are the durable home for backend lessons. Most caching, data-fetching, React, and TypeScript lessons apply to both clients, so keeping the parallel references in sync stops the two skills from drifting apart.

---

## Checklist (run through before finishing)

- [ ] Notion item found or created, with correct **Task type** and **Status: In progress**, and its scope read.
- [ ] Fix applied in the **owning app only**, following existing patterns.
- [ ] Smallest relevant slice validated (only the affected app's paths).
- [ ] Notion item set to **Done** with a root-cause + fix note in the body.
- [ ] Reusable lesson written **generically** into the owning app's standard (client skill, or the API's `AGENTS.md`/`CLAUDE.md` kept in sync).
- [ ] Cross-cutting lesson mirrored to the sibling (other client skill, or the other side of an API↔client contract) — or consciously skipped as platform-bound.
