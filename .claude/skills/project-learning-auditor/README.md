# Project Learning Auditor

Scans the current project **read-only** and generates a single, self-contained
HTML learning guide that explains the codebase from beginner to full-stack level.

## What it produces

```
reference/project-learning-audit/
├── index.html          ← the guide (self-contained: inline CSS, no external libs)
├── data/
│   ├── manifest.json    ← read-only scan (machine-readable)
│   └── audit-findings.json
├── diagrams/*.html      ← HTML/CSS-only animated flow diagrams
├── tutor-server/        ← local OpenCode Zen proxy for the topic AI tutor (topic mode only)
└── *.md                 ← supporting companions (audit, best-practices, etc.)
```

The guide covers: mental-model analogy · full architecture map · tech stack ·
frontend patterns · backend patterns · database structure · end-to-end flows ·
old-vs-modern comparisons · a P1/P2/P3/STRENGTH best-practices audit · strengths ·
a comprehension test · and a project-specific learning path. Every claim is
grounded in a real `path:line` or marked `Not detected from current files.`

In **topic deep-dive mode**, each appended topic also gets its own comprehension
test and an opt-in **AI tutor chat** (continuous, topic-scoped Q&A via OpenCode Zen,
through a local proxy — your key never touches the HTML). See below.

## How to invoke

Ask in plain language, e.g.:

> "Scan this project and build me a learning guide HTML page that explains how it
> works and audits it for risks."

Or run the skill directly. Either way it follows `SKILL.md`.

### Topic deep-dive mode (append to the guide)

Name one topic and the skill generates a focused section and **appends it** to the
existing `index.html` — without regenerating the whole page:

> "deep dive on the authentication flow and add it to the guide"
> "append a section explaining the polls reminder scheduler"

Each topic becomes a `<section class="topic" id="topic-<slug>">` (with a nav link),
grounded in real `path:line`. Re-running the same topic refreshes it in place — no
duplicates. If the guide doesn't exist yet, the full guide is generated first. See
`references/12-topic-deepdive.md`.

Every topic section ends with two learning aids:

- **Per-topic comprehension test** — 3–5 graded `<details>` questions grounded in
  that topic's files. Works with JavaScript disabled.
- **AI tutor chat** — a continuous, topic-scoped conversation powered by your
  **OpenCode Zen** key. Because Zen has no browser CORS and the key must never sit
  in the HTML, the chat talks to a tiny **local proxy** (`tutor-server/`,
  OpenAI-compatible against `https://opencode.ai/zen/v1`) that the skill scaffolds
  on the first topic. One-time setup:

  ```bash
  cd reference/project-learning-audit/tutor-server
  cp .env.example .env          # paste your OpenCode Zen key (from https://opencode.ai/auth)
  npm install && npm start      # serves http://localhost:8788
  ```

  Reload `index.html`; each topic's tutor flips to **on**. The skill **never writes
  your key** — only `.env.example`; `.env` is git-ignored and created by you.

## How it works

1. Runs `scripts/safe_scan.py` (read-only) → `data/manifest.json`.
2. Generates content phase by phase using the specs in `references/NN-*.md`.
3. Builds `data/audit-findings.json` and the animated diagrams.
4. Assembles `assets/index-template.html` → `reference/project-learning-audit/index.html`.

Regenerate any time — `index.html` is rebuilt fresh; the markdown companions keep
your hand-written notes (outside the `<!-- pla:auto:* -->` markers).

## Guarantees (docs-only)

- Never edits application source, config, `package.json`, or `.env*`.
- Never runs builds, tests, deploys, or git commands.
- Never reads, quotes, or echoes secrets — sensitive files are skipped and recorded
  by path + reason only. The AI-tutor proxy is scaffolded with a `.env.example`
  only; your OpenCode Zen key stays in a git-ignored `.env` you create.
- All output is confined to `reference/project-learning-audit/`.

## Files

- `SKILL.md` — the orchestrator (start here).
- `references/00..12-*.md` — per-phase content specs, read on demand
  (`12-topic-deepdive.md` covers the comprehension test + AI tutor).
- `scripts/safe_scan.py` — the read-only scanner.
- `assets/index-template.html` — the self-contained HTML skeleton + CSS + the
  audit-filter and AI-tutor scripts.
- `assets/diagrams/flow-diagram.html` — reusable animated-flow snippet.
- `assets/tutor-server/` — the local OpenCode Zen proxy (copied into the output on
  the first topic deep dive). Holds the key, adds CORS; never ships a key.
- `evals/trigger-eval.json` — when-to-fire test cases.
