# 10 — Comprehension test & learning path

Close the guide with a check-your-understanding test and a project-specific
learning path. Both render in `index.html`.

## Comprehension test

Generate 7–12 questions grounded in *this* project. Mix these types:

- **Multiple choice** — 3–4 options, one correct.
- **Short answer** — one-line answer.
- **Trace the flow** — "list the steps from X screen to the database."
- **Spot the risk** — point at a real audit finding.
- **Find the file** — "which file handles authentication?" (answer cites path).
- **Old vs modern** — "what's the modern alternative to X here?"
- **Explain in your own words** — concept restatement.

Each question hides its answer with native HTML:

```html
<details>
  <summary>Show answer</summary>
  <p>The backend API receives the request, checks the guard, validates the input,
     runs the service, queries <code>apps/.../x.schema.ts</code>, and returns a
     response.</p>
</details>
```

### Question rules

- Answers must be correct for this repo and cite real `path:line` where relevant.
- Include at least: one auth question, one full-stack-flow trace, one
  spot-the-risk tied to a real P1/P2 finding, one find-the-file, one old-vs-modern.
- Keep difficulty graded: start easy (what is this project), end harder (trace a
  full write flow, reason about a risk).

## AI "generate from this repo" (required, opt-in)

Below the static questions, the Test-yourself section includes an AI control that
**generates fresh questions grounded in this repo** on demand. The markup is already
in the template (`assets/index-template.html`) — keep it; you only emit the static
questions above it:

```html
<div class="test-gen">
  <div class="gen-head">
    <button class="gen-btn" type="button" disabled>✨ Generate new questions from this repo</button>
    <label class="gen-count">Count
      <select class="gen-count-sel"><option>3</option><option selected>5</option><option>8</option><option>10</option></select>
    </label>
    <span class="ai-status">tutor offline</span>
  </div>
  <div class="gen-out"></div>
  <p class="chat-hint">AI-generated from this repo's guide content via OpenCode Zen…</p>
  <noscript>Generating questions needs JavaScript; the static questions above do not.</noscript>
</div>
```

- The page's engine collects the visible text of the main sections (summary,
  architecture, frontend, backend, database, old-vs-modern, audit) as grounding and
  POSTs it to the local proxy's `POST /generate`, which returns JSON
  `{ questions: [{ question, answer, file }] }`. Each is rendered as a `<details>`.
- It's progressive enhancement: with JS off or the proxy down, the **static**
  questions above still work. The button stays disabled until the proxy is reachable.
- Grounded only in the provided content — the proxy is told to cite real file paths
  and never invent files. Still verify generated answers against the cited `path:line`.

## Learning path

End with an **ordered** path based on the actual project — not generic advice.
Default skeleton (adapt to what was found):

```
1.  Understand the mental model (the office analogy).
2.  Study the monorepo / folder structure (apps/, packages/).
3.  Follow one complete user flow end to end (pick the simplest real one).
4.  Learn the frontend state & form patterns (cite the files).
5.  Learn the backend request lifecycle (resolver → guard → service → model).
6.  Study the database models & relationships.
7.  Review authentication & authorization (the auth module + guards).
8.  Review the audit findings.
9.  Fix one P3 issue (name a real one).
10. Fix one P2 issue (name a real one).
11. Study one P1 issue carefully before changing it (name a real one).
```

Reference the specific files and findings discovered in earlier phases so the path
is concrete.

## Output of this phase

- Comprehension test (HTML, `<details>` answers) + the AI "generate from this repo"
  control (`.test-gen`, wired to `POST /generate`).
- Learning path (HTML, ordered list referencing real files/findings).
