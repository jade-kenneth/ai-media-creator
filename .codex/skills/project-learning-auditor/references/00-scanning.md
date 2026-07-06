# 00 — Safe scanning

Turn the project into a trustworthy, secret-free `manifest.json` that every later
phase is grounded in. Prefer the script; fall back to manual rules.

## Preferred path — run the scanner

```bash
python3 .claude/skills/project-learning-auditor/scripts/safe_scan.py \
  --out reference/project-learning-audit/data/manifest.json
```

The script walks the project root, prunes ignored/sensitive paths, classifies each
readable file, detects stack signals, collects heuristic audit signals, and writes
the manifest plus a compact `manifest-summary.json` beside it. It prints a one-line
summary and **only ever writes those two scan artifacts** — nothing else.

### Manifest shape

```jsonc
{
  "generated_at": "ISO-8601",
  "root": "/abs/path",
  "stats": {
    "scanned": 1171, "skipped": 32,
    "by_class": { "frontend": 692, "backend": 139, ... },
    "audit_signal_count": 37
  },
  "signals": {
    "package_name": "...", "scripts": ["build","test",...],
    "has_test_script": true,
    "dependencies": ["next","@nestjs/core","expo",...],
    "markers": { "nextjs": 1, "nestjs": 1, "expo": 1, "graphql": 22, ... },
    "initiative_surfaces": {
      "cicd": {
        "workflows": [
          {
            "path": ".github/workflows/ci.yml",
            "line": 3,
            "triggers": {
              "push": false,
              "pull_request": false,
              "schedule": false,
              "workflow_dispatch": true,
              "manual_only": true
            },
            "step_keywords": ["lint", "test", "typecheck", "build"]
          }
        ],
        "dockerfiles": ["Dockerfile"],
        "docker_compose": [{ "path": "docker-compose.yml", "services": ["api"] }],
        "mobile_build": { "eas_json": true, "fastlane": false }
      },
      "migrations": {
        "package_scripts": [
          { "workspace": "apps/api", "path": "apps/api/package.json", "line": 14, "name": "migrate:example", "command": "..." }
        ],
        "files": [{ "path": "apps/api/src/scripts/migrate-example.ts", "line": 1 }],
        "framework_dependencies": { "migrate-mongo": false, "umzug": false, "mongration": false, "prisma": false, "typeorm": false, "knex": false }
      },
      "automation": {
        "scheduler": {
          "dependencies": ["@nestjs/schedule"],
          "source_markers": [{ "path": "apps/api/src/jobs/example.ts", "line": 12, "marker": "@Cron(" }]
        },
        "event_queue_dependencies": ["kafkajs"],
        "git_hook_tooling": ["husky"],
        "codegen_scripts": [
          { "workspace": "apps/web", "path": "apps/web/package.json", "line": 12, "name": "codegen", "command": "..." }
        ],
        "codegen_script_count": 1
      },
      "ai": {
        "dependencies_by_workspace": [{ "workspace": "apps/web", "path": "apps/web/package.json", "dependencies": ["openai"] }],
        "dependency_names": ["openai"]
      },
      "third_party": {
        "matches": [
          { "integration": "email provider", "dependencies": [{ "workspace": "apps/api", "path": "apps/api/package.json", "line": 31, "dependency": "resend" }] }
        ],
        "integration_names": ["email provider"]
      }
    }
  },
  "files": [ { "path": "...", "class": "frontend|backend|database|config|infra|test|docs|generated|unknown", "ext": ".tsx", "size": 1234, "binary": false, "sampled_only": false } ],
  "skipped": [ { "path": "...", "reason": "ignored-file-glob|looks-sensitive|unreadable" } ],
  "audit_signals": [ { "kind": "resolver_no_guard", "path": "...", "line": 22, "note": "..." } ]
}
```

Read `signals.markers` + `signals.dependencies` to decide which guides apply.
Read `audit_signals` to seed (not finalize) the audit cards — **open each cited
file and confirm before asserting a finding**.

Read `signals.initiative_surfaces` to seed §19 engineering initiatives:

- `cicd` records workflow files, their `on:` trigger shape (`push`,
  `pull_request`, `schedule`, `workflow_dispatch`, `manual_only`), which CI step
  keywords appear (`lint`, `test`, `typecheck`, `build`, `deploy`, `publish`,
  `docker`), Dockerfiles, compose service names, and mobile build config presence
  (`eas.json`, `fastlane/`).
- `migrations` records migration/seed/reset package scripts, migration/seed/reset
  files under source `scripts/` or `migrations/` folders, and migration framework
  dependency booleans (`migrate-mongo`, `umzug`, `mongration`, `prisma`, `typeorm`,
  `knex`).
- `automation` records scheduler dependencies/markers (`@nestjs/schedule`,
  `@Cron(`, `node-cron`, `bullmq`, `agenda`), event/queue dependencies, git-hook
  tooling, and codegen/generate script names plus counts per workspace.
- `ai` records AI SDK dependencies in product workspaces (`apps/*`, `packages/*`,
  root): `openai`, `@anthropic-ai/sdk`, `@ai-sdk/*`, `@google/generative-ai`,
  `langchain`, `llamaindex`, `ollama`. An empty list is itself evidence; proposals
  then cite project objectives and say `Not detected from current files.` for the
  current AI stack.
- `third_party` maps known dependencies to integration names (AWS/S3, email
  provider, push provider, queue, payments, SMS, analytics, maps) so §19 can cite
  reuse anchors instead of inventing current integrations.

The initiative collectors obey the same no-secrets rule as the rest of the scan:
they never read `.env*` or files skipped as sensitive. Environment variable names
may only be inferred from readable source/config files, never from secret values.

### `audit_signals` kinds

| kind | meaning | maps to |
|---|---|---|
| `resolver_no_guard` | server entry point with no guard/role decorator in the file | P1 authz card |
| `possible_missing_validation` | server entry point with no validation/DTO marker | P2 validation card |
| `timer_no_cleanup` | `setInterval/setTimeout` with no matching `clear*` in file | P1/P2 timer card |
| `effect_no_cleanup` | `useEffect` creates a subscription/timer with no cleanup return nearby | P2 effect card |
| `possible_n1_query` | awaited query inside `.map()` | P1/P2 N+1 card |
| `dangerous_html` | `dangerouslySetInnerHTML` usage | P2/P3 XSS card |
| `hardcoded_secret_shape` | a string matching a key/secret shape in source | P1 secret card (cite location + kind only) |
| `next_client_route_boundary` | Next.js route file marked `use client` | optimization web-bundle card |
| `possible_heavy_client_import` | heavy dependency imported from UI code | optimization bundle/code-splitting card |
| `possible_unbounded_query` | database `find`/`aggregate` without nearby bound/projection marker | optimization database card |
| `possible_await_waterfall` | `await` appears inside/near a loop | optimization API/database waterfall card |
| `graphql_list_without_pagination` | GraphQL list field without obvious pagination args | optimization API/GraphQL card |
| `large_asset` | image asset over 300 KB | optimization assets/mobile-startup card |
| `button_no_pending_disable` | mutation/submit with no `isPending`/`isSubmitting`/`disabled`/`aria-busy` guard in file | UI/UX interaction-safety card (double-submit / spam clicks) |
| `missing_loading_state` | data fetch/mutation with no loading indicator (isLoading/Skeleton/Spinner/ActivityIndicator) in file | UI/UX loading-states card |
| `missing_error_state` | data fetch/mutation with no visible error feedback (isError/onError/catch/toast/Alert) in file | UI/UX error-empty-states card |
| `interactive_no_a11y_label` | icon-only button/touchable with no `aria-label`/`accessibilityLabel` nearby | UI/UX accessibility card |

These are **heuristics**. They have false positives (e.g. a resolver may inherit a
global guard). Confidence for cards built purely from a signal starts at `low`/`medium`.

## Fallback path — manual scan (no Python)

Walk the tree yourself and apply the same rules.

**Skip these directories entirely:** `.git`, `node_modules`, `vendor`, `Pods`,
`dist`, `build`, `out`, `.next`, `.nuxt`, `.svelte-kit`, `.expo`, `.turbo`,
`.cache`, `coverage`, `__pycache__`, `.venv`/`venv`, `.gradle`, `.idea`,
`DerivedData`, `logs`, `tmp`, and anything in `.gitignore`. Never descend into
`reference/` itself.

**Skip these files (never read):** `.env`, `.env.*`, `*.pem`, `*.key`, `*.p12`,
`*.crt`, `*.keystore`, `id_rsa*`, `*.log`, `*.min.js`, `*.map`, lockfiles (note by
name only), and binaries/media (`.png`, `.pdf`, `.zip`, `.woff`, `.so`, `.sqlite`,…).

**Secret heuristic:** skip any file whose name contains `secret`, `credential`,
`service-account`, `google-services`, or whose content matches a private-key
header or AWS/Google/GitHub/Slack key shapes or `api_key|secret|password|token = "…"`.
Record only the path + reason — never the value.

**Size cap:** files over ~2 MB are noted but only head-sampled, not deep-read.

## Classification cheat-sheet

| Class | Signals |
|---|---|
| `frontend` | `.tsx/.jsx/.vue/.svelte/.css`, or code under `components/ pages/ app/ screens/ hooks/ features/ ui/ views/ client` |
| `backend` | code under `controllers/ services/ routes/ api/ middleware/ repositories/ resolvers/ modules/ server`, or server langs (`.py/.go/.rb/.java/.kt/.rs/.php/.cs`) |
| `database` | `schema.prisma`, `*.sql`, `migrations/`, `seed`, ORM configs, `*.schema.ts` |
| `config` | `package.json`, `tsconfig`, `*.config.*`, `.yml/.yaml/.toml/.ini` |
| `infra` | Dockerfile, `docker-compose`, `.github/workflows`, terraform, k8s/helm |
| `test` | `.test.`/`.spec.`, `__tests__`, `cypress`, `playwright`, `e2e` |
| `docs` | `.md/.mdx/.txt/.rst` |
| `generated` | binaries/media |
| `unknown` | everything else — list under "needs review" |

## Output of this phase

- `data/manifest.json` — the scan (machine-readable). Required.
- `data/manifest-summary.json` — compact scan summary; includes
  `signals.initiative_surfaces` so later phases can load cheap evidence.
- If you build evidence notes, keep them inside `data/` so they regenerate cleanly.
- If the scan found zero files of a class, the relevant later section prints
  `Not detected from current files.` rather than inventing content.
