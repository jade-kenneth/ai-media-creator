# Topic AI Tutor — local proxy (OpenCode Zen)

This tiny Node server powers the **"Ask the AI tutor"** chat box that appears under
every topic deep dive in `index.html`. Each topic gets its own continuous,
topic-scoped conversation. The static **comprehension test** in each topic works
without this server — only the live chat needs it.

```text
index.html  ──POST /topic-chat──▶  this proxy  ──▶  OpenCode Zen (opencode.ai/zen/v1)
```

## Why a proxy (don't put the key in the HTML)

1. **Secrets.** Your OpenCode Zen API key must never live in the browser or in
   `index.html`. The page talks to this local server; the server holds the key.
2. **CORS.** OpenCode Zen does not send CORS headers, so a browser page cannot call
   it directly. This proxy adds them.

The auditor skill that generated this folder **never writes your key** — it only
scaffolds `.env.example`. You create `.env` yourself, and `.env` is git-ignored.

## Setup

1. Get a key: <https://opencode.ai/auth> → create an OpenCode Zen API key.
2. Create the env file (copy the example):

   ```bash
   cd reference/project-learning-audit/tutor-server
   cp .env.example .env
   # then edit .env and paste your key after OPENCODE_ZEN_API_KEY=
   ```

3. Install and run:

   ```bash
   npm install
   npm start
   ```

   Expected:

   ```text
   Project-learning tutor proxy running on http://localhost:8788
   ```

4. Open `reference/project-learning-audit/index.html` in your browser. Under any
   topic deep dive, the tutor status flips to **ON** — type a question and chat.

## Config

| Env var | Default | Notes |
|---|---|---|
| `OPENCODE_ZEN_API_KEY` | _(required)_ | From <https://opencode.ai/auth>. Lives only in `.env`. |
| `OPENCODE_ZEN_MODEL` | `grok-code` | Any model your key can use — see <https://opencode.ai/zen>. |
| `OPENCODE_ZEN_BASE_URL` | `https://opencode.ai/zen/v1` | OpenAI-compatible chat-completions base. |
| `PORT` | `8788` | If you change it, update `PLA_TUTOR_URL` in `index.html`. |

## Endpoints

- `GET  /health` → `{ ok, model, baseUrl, hasKey, endpoints }` — the page polls this to show ON/OFF.
- `POST /topic-chat` → `{ topic, grounding, messages }` → `{ answer }`. Powers every
  per-card "Ask the AI tutor about this" box. The page sends the card's title, the
  card's own guide text (grounding), and the running conversation; the tutor answers
  grounded in that context only.
- `POST /generate` → `{ grounding, count, topic }` → `{ questions: [{ question, answer, file }] }`.
  Powers the Test-yourself "Generate new questions from this repo" button. The page
  sends the guide's main-section text as grounding; the model returns repo-grounded
  comprehension questions (returned as plain JSON, parsed leniently).

## Notes

- Every chat message calls OpenCode Zen and may be billed to your account.
- The tutor is told to answer only from the topic's guide content and to say
  "Not detected" rather than invent files — but always verify against the cited
  `path:line` in the guide.
- This is a study tool. It never touches application source code.
