# How app-boilerplate works — the beginner map

Everything in this repository, in one place: what the pieces are, how a request travels
end to end, where the rules come from, and what stops a bad change. No prior knowledge
of the stack assumed.

For the design pipeline in depth, see [`docs/claude-design-flow.md`](claude-design-flow.md).
This page covers the whole system and links out where a topic has its own page.

---

## The analogy

**This repository is a restaurant franchise starter kit.**

Not one restaurant — the _kit_ you hand to someone opening a branch: a fitted kitchen,
a POS system, staff rulebooks, and an inspection regime. Every branch starts identical
and then serves its own menu.

| Piece                       | Role in the franchise                                               |
| --------------------------- | ------------------------------------------------------------------- |
| `app-boilerplate`           | The franchise starter kit. Never serves customers itself.           |
| Your product repo           | One actual branch, opened from the kit.                             |
| `apps/app-api`              | The kitchen. All cooking happens here, nowhere else.                |
| `apps/app-web`              | The manager's back office — staff only.                             |
| `apps/app-mobile`           | The customer's app in their pocket.                                 |
| `packages/shared-constants` | The label printer both the kitchen and the office use.              |
| MongoDB                     | The storeroom.                                                      |
| An organization / tenant    | One branch's own shelf in that storeroom.                           |
| `TenantMiddleware`          | The host at the door who reads which branch you belong to.          |
| Guards                      | The bouncer _and_ the "staff only" sign on the office door.         |
| Access token                | A wristband. Valid 15 minutes.                                      |
| Refresh token               | Your membership card. Gets you a fresh wristband for 30 days.       |
| `sessions` collection       | The guest list at the door. Cross a name off and the card dies.     |
| `skills-source`             | Head office's rulebook.                                             |
| `AGENTS.md`                 | The laminated copy pinned up in _this_ kitchen.                     |
| Claude Design               | The interior designer. Draws the dining room, never lifts a hammer. |
| Codex                       | The build crew.                                                     |
| Claude Code                 | The foreman and the inspector.                                      |
| GitHub Actions              | The health inspector who shows up unannounced.                      |

One rule the analogy is built around: **a branch can never reach another branch's shelf.**
Almost every security decision below exists to enforce that.

---

## 1. The whole thing at a glance

```mermaid
flowchart TB
  subgraph KIT["THE KIT — this repository"]
    BP["app-boilerplate<br/>backend plumbing only"]
    SS["skills-source<br/>the rulebook"]
  end

  subgraph BRANCH["ONE PRODUCT — your repo"]
    direction TB
    subgraph CLIENTS["What people touch"]
      WEB["app-web<br/>Next.js back office"]
      MOB["app-mobile<br/>Expo customer app"]
    end
    API["app-api<br/>NestJS + GraphQL"]
    DB[("MongoDB<br/>the storeroom")]
    EXT["S3 · Brevo email<br/>Expo Push · Apple/Google<br/>Kafka"]
  end

  DESIGN["Claude Design<br/>the look"]

  BP ==>|"template + pnpm project:init"| BRANCH
  SS ==>|"generates AGENTS.md"| BRANCH
  DESIGN ==>|"design/ export"| BRANCH

  WEB --> API
  MOB --> API
  API --> DB
  API --> EXT

  CI{{"GitHub Actions<br/>the inspector"}} -.->|"gates every PR"| BRANCH
```

Three separate supply lines feed a product repo, and they are genuinely independent:

- **The kit** gives you working backend plumbing on day one.
- **skills-source** gives the agents their rules.
- **Claude Design** gives the product its look and scope.

The boilerplate's own UI is scaffolding. It gets discarded — design wins on look, always.

---

## 2. Day one — from kit to running branch

```mermaid
flowchart TD
  T["Create repo from the template"]
  T --> S1["pnpm boilerplate:setup<br/>remembers which kit version you started from"]
  S1 --> S2["pnpm project:init<br/>names the branch"]
  S2 --> S3["pnpm install<br/>postinstall hydrates .skills-source"]
  S3 --> S4["cp .env.example .env<br/>fill in real values"]
  S4 --> RUN

  subgraph RUN["Three terminals"]
    R1["pnpm api → :3001"]
    R2["pnpm web → :4302"]
    R3["pnpm mobile → Expo"]
  end

  RUN --> SEED["seed-default-admin<br/>creates the first way in"]
```

`pnpm project:init` is the one people skip and regret. It renames the display name,
slug, package scope, mobile bundle identifier, and local database — and it deliberately
**leaves `app-web`, `app-mobile`, `app-api` alone**. Those internal names stay stable so
that future kit updates merge cleanly instead of conflicting on every path.

It is idempotent and refuses to overwrite an already-customized value without `--force`.
Preview with `--dry-run`.

_Franchise: you paint your own sign, but the walk-in fridge keeps the part number the
manufacturer gave it._

---

## 3. The runtime — one tap, end to end

This is the diagram to understand first. Everything else is detail hanging off it.

```mermaid
sequenceDiagram
  autonumber
  participant U as User
  participant C as Client<br/>web or mobile
  participant TH as Throttler
  participant TM as TenantMiddleware
  participant G as Auth and Roles guards
  participant R as Resolver
  participant S as Service
  participant DB as MongoDB

  U->>C: taps a button
  C->>TH: POST /graphql<br/>Authorization: Bearer access
  Note over TH: too many requests?<br/>→ 429, stop here
  TH->>TM: allowed
  Note over TM: peeks at the token to find<br/>which branch this is
  TM->>DB: organizations.findOne by slug
  DB-->>TM: organizationId, isActive
  Note over TM: inactive or missing → Forbidden
  TM->>G: request now carries tenantId
  Note over G: verifies the token signature<br/>then checks @Roles
  G->>R: authenticated user attached
  R->>S: call with CurrentUser + CurrentTenant
  S->>DB: query, always filtered by organizationId
  DB-->>S: this branch's rows only
  S-->>R: result
  R-->>C: GraphQL response
  C-->>U: screen updates
```

### The subtlety worth pausing on

`TenantMiddleware` calls `jwt.decode()` — it **reads the token without verifying it**.
That sounds alarming and isn't, because of the order of the pipeline:

- The middleware only uses the decoded `tenantSlug` to _look something up_. A forged token
  gets you a tenant lookup and nothing else.
- The **guard** runs afterwards and does the real cryptographic verification. A forged
  token dies there, before any resolver runs.

So the door host reads your badge to point you at the right room; the bouncer inside
checks whether the badge is real. Both, in that order.

`SUPER_ADMIN` skips tenant pinning entirely — that role works across branches by design.

**Never trust a role or tenant sent as a header.** Authorization comes from the verified
token plus current database state. That invariant is the whole reason this pipeline has
so many stages.

---

## 4. Authentication — wristbands and membership cards

Two tokens, two very different jobs.

|           | Access token           | Refresh token                |
| --------- | ---------------------- | ---------------------------- |
| Analogy   | Wristband              | Membership card              |
| Lifetime  | 15 minutes             | 30 days                      |
| Sent with | Every request          | Only the refresh call        |
| Stored    | In memory              | Client secure storage        |
| Revocable | No — just expires fast | **Yes** — delete its session |

Short-lived wristbands are what make a stolen access token boring: it dies on its own.
Long-lived cards are what make logout meaningful: the `jti` row disappears from `sessions`
and that card is instantly dead everywhere.

```mermaid
sequenceDiagram
  autonumber
  participant C as Client
  participant A as AuthResolver / AuthService
  participant SE as SessionsService
  participant DB as MongoDB

  rect rgb(232,244,253)
  Note over C,DB: LOGIN
  C->>A: login email + password
  A->>DB: find user by normalized email
  A->>A: bcrypt compare<br/>reject inactive user or tenant
  A->>SE: create session, store jti
  SE->>DB: insert session
  A-->>C: access 15m + refresh 30d
  end

  rect rgb(255,240,224)
  Note over C,DB: 15 MINUTES LATER — 401
  C->>C: access expired, refresh still valid
  C->>SE: POST /session/refresh
  SE->>SE: JwtRefreshGuard<br/>assert token type is REFRESH
  SE->>DB: is jti still on the guest list?
  DB-->>SE: yes, and user still active
  SE->>DB: stamp dateTimeLastRefreshed
  SE-->>C: NEW access + NEW refresh
  Note over C: token rotation —<br/>the old pair is replaced
  C->>C: retry the original request
  end

  rect rgb(224,240,224)
  Note over C,DB: LOGOUT
  C->>SE: logout
  SE->>DB: delete session by jti
  Note over DB: card is dead everywhere,<br/>on every device
  end
```

The client half of this is automatic. `react-query/graphql-client.ts` in both apps carries
a silent-refresh middleware: a 401 triggers the refresh, stores the new pair, and replays
the original request. A user never sees it.

Three roles, and they nest:

| Role          | Reach                                |
| ------------- | ------------------------------------ |
| `USER`        | Their own stuff, inside their branch |
| `ADMIN`       | The whole branch                     |
| `SUPER_ADMIN` | Every branch                         |

`@Public()` marks login and registration. Leaving `@Roles()` off an operation does **not**
make it public — it means "any signed-in role." That difference bites people once.

---

## 5. Multi-tenancy — why data cannot leak sideways

One database. One set of collections. Every tenant-owned document carries an
`organizationId`, and every tenant-owned query is filtered by it.

```mermaid
flowchart LR
  subgraph REQ["Two requests arriving at the same moment"]
    A["Admin of<br/>branch-north"]
    B["Admin of<br/>branch-south"]
  end

  A --> M1["tenantId = north"]
  B --> M2["tenantId = south"]

  M1 --> Q1["users.find<br/>organizationId: north"]
  M2 --> Q2["users.find<br/>organizationId: south"]

  Q1 --> DB[("one MongoDB")]
  Q2 --> DB

  DB --> R1["north rows only"]
  DB --> R2["south rows only"]

  SA["SUPER_ADMIN"] -.->|"no tenant pin —<br/>crosses branches on purpose"| DB
```

Why one shared database instead of one per branch? Cheaper, one migration, one backup,
one set of indexes. The trade is that the filter is now load-bearing: **forget
`organizationId` in one query and you have a data leak, not a bug.** That is exactly why
tenant context is resolved once at the platform boundary and handed to services through
`@CurrentTenant()`, rather than each feature rolling its own.

_Franchise: one warehouse, labelled shelves. Cheap and efficient — right up until someone
grabs from the wrong shelf._

---

## 6. What else the kitchen already does

None of this is product-specific. It ships working.

```mermaid
flowchart TD
  API["app-api"]

  API --> N["Notifications<br/>in-app rows"]
  API --> P["Push<br/>Expo tokens"]
  API --> S3["S3 uploads<br/>presigned URLs"]
  API --> ML["Email<br/>Brevo"]
  API --> SC["Scheduled jobs<br/>+ scheduler locks"]
  API --> ST["Store purchases<br/>Apple · Google"]
  API --> AD["Account deletion<br/>requests"]
  API --> K["Kafka events<br/>optional"]
  API --> OB["Health · logging<br/>rate limits · CORS"]
```

A few that deserve a sentence each:

- **Presigned S3 uploads.** The API never receives the file. It hands the client a
  time-limited URL and the client uploads straight to S3. _The kitchen gives you a locker
  key instead of carrying your bag._
- **Scheduler locks.** Run three copies of the API and a nightly job would fire three
  times. A lock row means exactly one instance wins. _One person holds the rota pen._
- **Request batch loader.** Fifty rows each needing their author would be fifty queries.
  The batcher collects them into one round trip per request. This is the classic N+1 fix.
- **Store purchases** sit behind ports and gateways, so Apple and Google are swappable
  implementations rather than logic smeared through the module.
- **Kafka** is optional. It is there for fire-and-forget work that shouldn't block a
  response, and the app runs fine without it.

### Push notifications, end to end

```mermaid
flowchart LR
  T["something happens"] --> N["create a notification row<br/>per recipient"]
  N --> L["look up their device tokens"]
  L --> D["dedupe · validate · chunk ≤100"]
  D --> E["Expo Push API"]
  E --> R{"ticket says<br/>DeviceNotRegistered?"}
  R -->|yes| X["delete that token"]
  R -->|no| OK["delivered"]
```

Two deliveries, one event: a row in the database so the bell icon works whether or not
the phone was on, and a push so the phone buzzes. Uninstalled apps clean themselves out
of the token table automatically.

---

## 7. The two clients

Both talk to the same GraphQL API, both use TanStack Query, both get their types
generated from the API's live schema. They differ in shell, not in approach.

```mermaid
flowchart TB
  subgraph W["app-web — Next.js"]
    WL["/login"]
    WA["/admin/*<br/>branch admin"]
    WS["/super-admin/*<br/>cross-branch"]
    WP["/privacy-policy · /delete-account<br/>public, required by app stores"]
  end

  subgraph M["app-mobile — Expo Router"]
    MA["(auth)<br/>onboarding · login · register<br/>organization picker"]
    MM["(main)<br/>tabs: home · notifications · profile"]
  end

  W --> GQL["GraphQL /graphql"]
  M --> GQL
```

Shared client architecture in both apps: an `AuthProvider` holding the token store, a
`graphql-client` with the silent-refresh middleware, `react-query/` folders per feature,
theming, and i18n. Learn it once, it reads the same on both sides.

The public web pages are not filler — Apple and Google require a reachable privacy policy
and an account-deletion route before they will list an app.

**The type flow is worth internalizing:**

```mermaid
flowchart LR
  GQLF[".gql schema files<br/>hand-written"] --> NEST["Nest generates<br/>server interfaces"]
  GQLF --> CG["pnpm codegen<br/>in each client"]
  CG --> TYPES["generated__types.ts"]
  TYPES --> UI["typed hooks in the UI"]
```

The schema is the contract. Change a `.gql` file, re-run codegen, and TypeScript points at
every screen that just broke — before anything ships. _One printed menu; kitchen and
front-of-house cannot disagree about what's on it._

---

## 8. The monorepo, and the ownership line

Nx + pnpm workspaces: one `pnpm install`, one lint/test/build command, projects that can
import each other with real type safety.

```mermaid
flowchart TD
  ROOT["repo root"]
  ROOT --> APPS["apps/"]
  ROOT --> PKG["packages/"]
  ROOT --> SCR["scripts/"]
  ROOT --> DOC["docs/"]
  ROOT --> DES["design/"]

  APPS --> A1["app-api"]
  APPS --> A2["app-web"]
  APPS --> A3["app-mobile"]
  PKG --> P1["shared-constants"]
```

**Where does my new code go?** One question answers it: _would a completely different
product also need this?_

- Yes, and it's a genuinely shared contract or pure logic → `packages/`
- No → the owning app, under `features/` or a module

The bar for `packages/` is deliberately high. Shared code is code you can no longer change
freely.

Cutting across that is a second line, defined in `boilerplate-sync.config.json`:

|             | `foundationPaths`                                       | `productPaths`                          |
| ----------- | ------------------------------------------------------- | --------------------------------------- |
| Contains    | Auth, common, providers, react-query, scripts, packages | Your features, screens, product modules |
| Belongs to  | The kit                                                 | Your branch                             |
| Kit updates | Flow into it                                            | Never touch it                          |

Edit foundation code in a product and you've customized the walk-in fridge — every future
kit update now conflicts. `pnpm boilerplate:contributions` flags exactly that, so you
can push the improvement back up to the kit instead.

---

## 9. Where the agents' rules come from

The agents on this project don't improvise conventions. They read a generated file, and
that file is pinned to an exact upstream revision.

```mermaid
flowchart TD
  SRC["skills-source repo<br/>conventions · skills · commands"]
  LOCK["skills-source.lock.json<br/>pins one exact 40-char SHA"]
  SNAP[".skills-source/<br/>local snapshot"]
  AG["AGENTS.md<br/>GENERATED — never hand-edit"]

  SRC --> LOCK
  LOCK -->|"pnpm sync-skills"| SNAP
  SNAP -->|"generate"| AG
  AG --> CODEX["Codex reads this<br/>before writing code"]

  CHECK{{"pnpm check-skills<br/>skills-drift workflow"}} -.->|"AGENTS.md must match the lock"| AG

  LOCK -->|"pnpm update-skills"| NEW["advance to a newer SHA<br/>deliberate, reviewed"]
```

| Command              | What it does                                                 |
| -------------------- | ------------------------------------------------------------ |
| `pnpm install`       | Hydrates the **locked** snapshot only. Never moves the lock. |
| `pnpm sync-skills`   | Hydrate the locked revision, regenerate `AGENTS.md`.         |
| `pnpm update-skills` | Deliberately move the lock forward. A reviewable change.     |
| `pnpm check-skills`  | Fail if the committed `AGENTS.md` drifted. CI runs this.     |

The pin is the point. Two developers and three agents on the same commit read byte-identical
rules, and rules only change when somebody chooses to change them.

**So when a convention is wrong, you fix it upstream in `skills-source`, advance the lock,
and regenerate.** Patching `AGENTS.md` locally fixes one branch and CI reverts you.
`/capture-project-learning` is the paved road for that: it writes a reviewable proposal,
and once merged a workflow forwards it to `skills-source` as a review issue.

_Franchise: when the same mistake happens at three branches, you change the head-office
rulebook — not the sticky note in one kitchen._

---

## 10. Kit updates, in both directions

Two repos, four memory files, and a deliberately manual middle.

```mermaid
flowchart TD
  BP["app-boilerplate<br/>improves"]
  BP -->|"weekly boilerplate-drift job"| CHK["pnpm boilerplate:check<br/>what's new since my lock?"]
  CHK --> PORT["pnpm boilerplate:port --sha SHA<br/>apply on a clean branch, review it"]
  PORT --> ACK["pnpm boilerplate:ack --sha SHA<br/>reviewed through here"]

  PROD["your product<br/>invents something reusable"]
  PROD -->|"pnpm boilerplate:contributions"| BACK["candidate to push back<br/>into the kit"]
  BACK --> BP
```

Nothing auto-merges. Updates are proposed, applied on a branch, and acknowledged only once
every commit through that SHA was applied **or deliberately declined**. That last clause
matters: declining is a valid, recorded outcome.

### The four memory files

Confusing them is the most common source of "why is this failing?"

| File                           | Written by                           | Answers                                                 |
| ------------------------------ | ------------------------------------ | ------------------------------------------------------- |
| `skills-source.lock.json`      | You, via `update-skills`             | Which rulebook revision are we on?                      |
| `boilerplate.lock.json`        | You, via `boilerplate:ack`           | Which kit updates have we reviewed?                     |
| `design/design-release.json`   | **Claude Design**                    | What is being delivered in this batch?                  |
| `design/design-sync.lock.json` | **The repository**, via `design:ack` | What have we already accepted, and what did it hash to? |

The last pair is a delivery note and a signed receipt. Claude Design writes the note; the
repository writes the receipt. **Claude Design must never touch the receipt** — that
separation is what makes the design gate meaningful.

---

## 11. The design pipeline, in brief

Full detail lives in [`docs/claude-design-flow.md`](claude-design-flow.md). The shape:

```mermaid
flowchart LR
  P["/prepare-claude-design<br/>or /adapt-design-export"] --> CD["Claude Design"]
  CD --> EX["design/ export<br/>prototypes · system · planning"]
  EX --> V{"pnpm design:validate"}
  V -->|fails| EX
  V -->|passes| SY["/sync-build-docs"]
  SY --> D["Product Specification.md<br/>Implementation Plan.md"]
  D --> TK["/generate-project-tasks"]
  TK --> CX["Codex builds ONE phase"]
  CX --> QA{"Fidelity QA<br/>vs the prototype"}
  QA -->|off| CX
  QA -->|matches| DONE["phase complete → Notion"]
  DONE -.->|next slice| CD
```

Four things a beginner should take from it:

1. **You do not wait for the full design.** Batch 1 unblocks a slice; building starts.
   `/finalize-build-docs` is the closing gate, not the starting one.
2. **Only what's inside `data-app-root` is binding.** Phone frames and annotations are
   presentation, not product.
3. **Mobile prototypes are HTML, but the app is not.** They're a contract on _outcomes_.
   You rebuild with native React Native primitives — never a WebView, never copied CSS.
4. **The gate remembers.** Every accepted prototype is hashed. Quietly editing an
   already-built screen fails validation instead of silently changing the contract.

When sources disagree: prototypes → design system → planning → repo conventions (code
structure only) → boilerplate UI, which never wins.

---

## 12. What stops a bad change

```mermaid
flowchart TD
  PR["you open a pull request"]

  PR --> C1["CI<br/>lint · test · build · typecheck · e2e"]
  PR --> C2["skills-drift<br/>AGENTS.md matches its lock?"]
  PR --> C3["design-gate<br/>export still valid + hashes intact"]
  PR --> C4["boilerplate-contribution-check<br/>did you edit foundation code?"]

  C1 & C2 & C3 & C4 --> M{"all green?"}
  M -->|no| FIX["fix it"]
  FIX --> PR
  M -->|yes| MERGE["merge"]

  W1["boilerplate-drift<br/>weekly"] -.-> REPORT["reports new kit commits"]
  W2["submit-project-learning<br/>on merge to main"] -.-> ISSUE["files a review issue<br/>on skills-source"]
```

`design-gate` no-ops in a repo that has no design export yet, so the kit itself stays green.

---

## 13. Who does what

| Actor             | Does                                                  | Never does                      |
| ----------------- | ----------------------------------------------------- | ------------------------------- |
| **Claude Design** | Screens, design system, `design-release.json`         | Write `design-sync.lock.json`   |
| **Claude Code**   | Plans, reconciles, reviews, Fidelity QA, syncs Notion | Implement features unless asked |
| **Codex**         | Builds one phase, ticks `[ ] → [~] → [x]`             | Edit Notion                     |
| **You**           | Decide scope, review, approve lock advances           | Hand-edit `AGENTS.md`           |

Notion is the wall board: read by everyone, written only during planning and review.

---

## 14. Beginner mistakes, ranked by how much time they cost

1. **Skipping `pnpm project:init`** and hand-renaming things — future kit updates
   conflict everywhere.
2. **Editing `AGENTS.md` directly.** Generated. CI reverts you. Fix upstream.
3. **Forgetting `organizationId`** in a new query. Not a bug — a data leak.
4. **Trusting a client-sent role or tenant header.** Authorization comes from the verified
   token and the database.
5. **Editing foundation paths in a product repo** instead of contributing upstream.
6. **Copying prototype DOM/CSS into the mobile app.** Rebuild with native primitives.
7. **Running the design workflow in the boilerplate repo** instead of the product repo.
8. **Letting Claude Design write `design-sync.lock.json`.** Repository-owned.
9. **Waiting for the complete design before building anything.**
10. **Pasting a connection string** into design or planning docs. Environment variable
    _name_ and sanitized database name only — never a credential.

---

## 15. Glossary

| Term                       | Meaning                                                                 |
| -------------------------- | ----------------------------------------------------------------------- |
| Monorepo                   | One repo holding several apps that share tooling and types.             |
| Nx                         | The task runner that builds, lints, and tests them together.            |
| Tenant / organization      | One customer's isolated slice of the shared database.                   |
| `organizationId`           | The field that isolation depends on. Never optional.                    |
| JWT                        | A signed token. Readable by anyone, forgeable by no one.                |
| `jti`                      | The refresh token's ID, stored as a session row. Delete it to revoke.   |
| Token rotation             | Refreshing returns a _new_ refresh token, retiring the old one.         |
| Guard                      | NestJS code that runs before a resolver and can reject the request.     |
| Resolver                   | The GraphQL entry point for one operation.                              |
| Service                    | Where business logic and tenant filtering live.                         |
| Repository                 | The thin layer that talks to MongoDB.                                   |
| Codegen                    | Generating TypeScript types from the GraphQL schema.                    |
| Presigned URL              | A short-lived URL letting a client upload straight to S3.               |
| N+1                        | One query per row instead of one for all of them. The batcher fixes it. |
| `data-app-root`            | The single element marking where the real screen begins. Binding.       |
| Foundation vs product path | Kit-owned code vs your code.                                            |
| Lock file                  | A recorded revision, so everyone reads the same rules.                  |

---

## The shortest version

A shared kitchen serves several branches out of one storeroom, and a strict door policy is
the only thing keeping their shelves apart. Two clients order from the same menu, printed
from a single schema. The rules the robots build by are pinned to an exact revision, so
nobody argues about conventions. Designs arrive as sealed, hashed drawings and get built
one slice at a time. An inspector checks all of it on every pull request.

## Related

- [`docs/claude-design-flow.md`](claude-design-flow.md) — the design pipeline in depth
- [`docs/NESTJS_GRAPHQL_AUTH_PIPELINE.md`](NESTJS_GRAPHQL_AUTH_PIPELINE.md) — auth specifics
- [`docs/MONGODB_REPOSITORY_AND_INDEXING.md`](MONGODB_REPOSITORY_AND_INDEXING.md) — persistence
- [`docs/SECURITY_RATE_LIMITING_CORS_HEADERS.md`](SECURITY_RATE_LIMITING_CORS_HEADERS.md) — request hardening
- [`docs/boilerplate-updates.md`](boilerplate-updates.md) — the update and contribution workflow
- [`docs/getting-started/customize.md`](getting-started/customize.md) — the day-one checklist
- `docs/*.drawio` — sequence diagrams for refresh tokens, tenancy, and push
