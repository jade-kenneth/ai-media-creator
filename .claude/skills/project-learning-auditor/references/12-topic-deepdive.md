# 12 — Topic deep dive (append mode)

A focused mode: the user names **one specific topic** and the skill generates a
single, self-contained deep-dive section and **appends it** to the existing
`reference/project-learning-audit/index.html` — without regenerating the whole
guide. Examples of a topic: "the authentication flow", "the polls reminder
scheduler", "how notifications are sent", "tenant scoping", "the registration
approval flow", "the DataTable component", "CI/CD", "migration scripts", or
"third-party integrations".

Every topic section ends with two learning aids:
1. A **per-topic comprehension test** — graded `<details>` questions (static, works
   with JS disabled).
2. A **per-topic AI tutor** — a chat box for a continuous, topic-scoped conversation,
   powered by the user's **OpenCode Zen** key through a local proxy (see §"AI tutor").

## When to use this mode

Trigger when the user asks to add/append/generate a section about a *named topic*,
e.g. "deep dive on the auth flow and add it to the guide", "append a section
explaining the scheduler", "add a topic about how voting works".

If they instead ask for the whole guide, use the full phase run (SKILL.md §2–§3),
not this mode.

## Procedure

1. **Ensure the guide exists.** If `reference/project-learning-audit/index.html`
   is missing, run the full generation first (the topic section needs the page to
   append into). If it exists, do **not** regenerate it — only append.

2. **Ensure a fresh-enough scan.** If `data/manifest.json` exists and the repo
   hasn't obviously changed, reuse it. Otherwise re-run the scanner
   (`scripts/safe_scan.py`). Ground every claim in the manifest.

3. **Resolve the topic to real files.** Search the manifest `files[]` and the repo
   for the modules/components/flows the topic names. Collect the concrete
   `path:line` evidence. If the topic isn't present in the codebase, say
   `Not detected from current files.` and stop — never invent a topic.
   If the topic names an engineering initiative track (`cicd`, `migration`,
   `automation`, `ai`, or `third-party`), reuse
   `references/19-engineering-initiatives.md` heuristics and
   `signals.initiative_surfaces.<track>` as the evidence block before reading the
   cited config/script/module files.

4. **Build the slug.** `slug = kebab-case(topic)` (lowercase, spaces→`-`, strip
   punctuation). Section id = `topic-<slug>`. Nav label = short Title Case.

5. **Scaffold the AI-tutor proxy (first topic only).** If
   `reference/project-learning-audit/tutor-server/` does not exist yet, copy this
   skill's `assets/tutor-server/` into it verbatim: `server.mjs`, `package.json`,
   `.env.example`, `.gitignore`, `README.md`. **Never create `.env` and never write
   any key** — the user supplies their OpenCode Zen key in `.env` themselves. If the
   folder already exists, leave it untouched. (The chat CSS + engine already live in
   `index.html` from the full build, so topic mode adds **no** new `<style>`/`<script>`.)

6. **Generate the section** (markup below) and **insert idempotently**:
   - If a `<section class="topic" id="topic-<slug>">…</section>` already exists in
     `index.html`, **replace that whole section** (refresh, don't duplicate).
   - Otherwise insert the new section **immediately before** `<!-- PLA:TOPICS:end -->`.
   - On the **first** topic ever added, also remove the placeholder
     `<p class="topics-empty">…</p>` between the TOPICS markers.
   - Insert the nav link immediately before `<!-- PLA:TOPIC_NAV:end -->` (skip if a
     link to `#topic-<slug>` already exists).

7. **Re-stamp.** Update the header/footer generation date (`<!-- PLA:DATE -->`
   regions) to today, since the page changed.

8. **Report.** Tell the user the topic was appended, where (`#topic-<slug>`), how
   many files it cites, and — if the proxy was scaffolded — the one-time setup to
   turn the AI tutor on (see §"AI tutor"). Note anything that was `Not detected`.

## Section markup (self-contained — uses the page's existing CSS classes)

```html
<section class="topic" id="topic-<slug>">
  <div class="topic-head">
    <span class="badge badge-topic">Topic deep dive</span>
    <h2><Topic title></h2>
  </div>
  <p class="meta">Added <YYYY-MM-DD> · grounded in <N> files</p>

  <div class="card">
    <p><strong>Simple explanation.</strong> One or two plain sentences.</p>
    <p><strong>Mental model / analogy.</strong> A real-world analogy.</p>
  </div>

  <div class="card">
    <h3>Where it lives</h3>
    <ul>
      <li><span class="file-ref">apps/.../file.ts:42</span> — what this part does</li>
      <!-- one per relevant file -->
    </ul>
  </div>

  <!-- OPTIONAL: animated flow if the topic is a process (auth, submit, job…) -->
  <div class="flow blue" style="--steps:4;">
    <div class="flow-step"><span class="n">1</span><span class="t">Step</span><span class="f">path:line — method()</span></div>
    <!-- … one per step; set --steps to the count … -->
  </div>

  <!-- OPTIONAL: old vs modern if relevant -->
  <div class="compare">
    <div class="code-old"><span class="tag">Old / simple way</span>…</div>
    <div class="code-new"><span class="tag">Modern / better way</span>…</div>
  </div>

  <div class="card">
    <p><strong>Common beginner mistake.</strong> …</p>
    <p><strong>Best practice.</strong> …</p>
    <p><strong>Risk if done poorly.</strong> … (link to an audit finding if one exists)</p>
  </div>

  <!-- REQUIRED: per-topic comprehension test (3–5 graded questions) -->
  <div class="topic-quiz">
    <h3>Check your understanding</h3>
    <details>
      <summary><Q1 — easy: what / where></summary>
      <p>Answer, citing <code>path:line</code>.</p>
    </details>
    <details>
      <summary><Q2 — trace the flow / find the file></summary>
      <p>Answer, citing <code>path:line</code>.</p>
    </details>
    <details>
      <summary><Q3 — spot the risk / old-vs-modern (harder)></summary>
      <p>Answer, citing <code>path:line</code> or a real audit finding.</p>
    </details>
    <!-- 3–5 total; grade easy → hard -->
  </div>

  <!-- REQUIRED: per-topic AI tutor (continuous, topic-scoped conversation) -->
  <div class="topic-chat" data-topic-slug="<slug>" data-topic-title="<Topic title>">
    <div class="chat-head">
      <h3>Ask the AI tutor about this topic</h3>
      <span class="ai-status">tutor offline</span>
    </div>
    <div class="chat-log" aria-live="polite"></div>
    <form class="chat-form">
      <input class="chat-input" type="text" autocomplete="off"
             placeholder="Ask anything about <topic>…" />
      <button class="chat-send" type="submit">Send</button>
    </form>
    <p class="chat-hint">
      Continuous, topic-scoped chat powered by OpenCode Zen. Start the local tutor
      once: <code>cd reference/project-learning-audit/tutor-server &amp;&amp; npm install &amp;&amp; npm start</code>
      (needs your key in <code>.env</code>). The comprehension test above works without it.
    </p>
    <noscript>The AI tutor needs JavaScript; the comprehension test above does not.</noscript>
  </div>
</section>
```

Nav link (inserted before `<!-- PLA:TOPIC_NAV:end -->`):

```html
<a href="#topic-<slug>"><Short Title></a>
```

## Per-topic comprehension test

- **3–5 questions**, graded easy → hard, each hidden with native
  `<details><summary>…</summary><p>…</p></details>` (works with JS disabled).
- Mix the types from `references/10-comprehension-and-path.md`: a *what/where*
  starter, a *trace-the-flow* or *find-the-file*, and at least one *spot-the-risk*
  or *old-vs-modern* closer.
- Every answer is correct for THIS topic and cites a real `path:line` (or a real
  audit finding). No invention — if unknown, `Not detected from current files.`

## AI tutor (continuous conversation, OpenCode Zen)

The chat box gives a **continuous, topic-scoped conversation** about each topic.

- **How it's wired.** The page's existing engine (baked into `index.html` during the
  full build) finds every `.topic-chat`, keeps a separate conversation history per
  topic, and POSTs `{ topic, grounding, messages }` to a **local proxy** at
  `http://localhost:8788/topic-chat`. The `grounding` is the topic section's own
  rendered text, so the tutor stays anchored to what the guide actually says.
- **Why a proxy (not a direct call).** Two hard reasons, both non-negotiable:
  1. **Secrets.** The OpenCode Zen API key must never live in `index.html` or the
     browser. The proxy holds it (from a git-ignored `.env` the *user* creates); the
     skill never writes a key. This keeps SKILL.md §1.4 intact.
  2. **CORS.** OpenCode Zen sends no CORS headers, so a browser cannot call it
     directly. The proxy (`assets/tutor-server/server.mjs`) adds them and is
     OpenAI-compatible against `https://opencode.ai/zen/v1`.
- **One-time setup the user runs** (tell them this in the report on the first topic):
  ```bash
  cd reference/project-learning-audit/tutor-server
  cp .env.example .env          # then paste the OpenCode Zen key after OPENCODE_ZEN_API_KEY=
  npm install && npm start      # serves http://localhost:8788
  ```
  Reload `index.html`; each topic's status flips to **tutor on**.
- **Graceful offline.** If the proxy isn't running (or JS is off), the chat shows the
  start command and the comprehension test still works — the page stays useful and
  self-contained.

## Rules

- **Self-contained still holds for the page.** Topic mode reuses the page's existing
  classes (`.card`, `.flow`, `.compare`, `.code-old/.code-new`, `.badge`, `.file-ref`,
  `.topic-quiz`, `.topic-chat`, `.chat-*`, `.ai-status`, `details`). Do **not** add new
  `<style>` or `<script>` tags. The only network use is the opt-in AI tutor calling the
  **local** proxy — never an external CDN, never a remote call from the page itself.
- **No key, ever.** Scaffold `assets/tutor-server/` (incl. `.env.example`) but never
  create `.env`, never read/echo/write the user's key. The skill stays read-only on app
  code and secrets.
- **Ground everything.** Every claim and every quiz answer cites a real `path:line`;
  escape `<`, `>`, `&` in code samples; never paste secret values.
- **Idempotent.** Re-running the same topic refreshes its section in place (quiz + chat
  included); it never creates a duplicate section or duplicate nav link.
- **Append-only to the page body.** Never touch the existing §0–§15 sections when in
  topic mode — only the TOPICS and TOPIC_NAV regions and the date stamp.
- **Animated flow is optional.** Include it only when the topic is a process worth
  visualizing; a concept topic can be cards + quiz + chat only.

## Output of this mode

- One `<section class="topic" id="topic-<slug>">` appended/refreshed in `index.html`
  (cards + optional flow/compare + comprehension test + AI tutor chat), plus its nav
  link, plus a refreshed date stamp.
- On the first topic only: `reference/project-learning-audit/tutor-server/` scaffolded
  from `assets/tutor-server/` (no `.env`, no key).
