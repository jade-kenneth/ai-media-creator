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
the manifest. It prints a one-line summary and **only ever writes the manifest** —
nothing else.

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
    "markers": { "nextjs": 1, "nestjs": 1, "expo": 1, "graphql": 22, ... }
  },
  "files": [ { "path": "...", "class": "frontend|backend|database|config|infra|test|docs|generated|unknown", "ext": ".tsx", "size": 1234, "binary": false, "sampled_only": false } ],
  "skipped": [ { "path": "...", "reason": "ignored-file-glob|looks-sensitive|unreadable" } ],
  "audit_signals": [ { "kind": "resolver_no_guard", "path": "...", "line": 22, "note": "..." } ]
}
```

Read `signals.markers` + `signals.dependencies` to decide which guides apply.
Read `audit_signals` to seed (not finalize) the audit cards — **open each cited
file and confirm before asserting a finding**.

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
- If you build evidence notes, keep them inside `data/` so they regenerate cleanly.
- If the scan found zero files of a class, the relevant later section prints
  `Not detected from current files.` rather than inventing content.
