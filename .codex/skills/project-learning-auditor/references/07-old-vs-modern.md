# 07 — Old vs modern

Help beginners understand *why* modern patterns exist. Produce the "Old vs modern"
section of `index.html` as red/green comparison blocks.

## Format (every comparison)

```
- **Old / simple way:** what a beginner often writes first.
- **Problem:** why it hurts as the project grows.
- **Modern / better way:** the pattern this project uses (or could use).
- **Benefit:** what you gain.
- **Tradeoff:** what it costs (learning curve, indirection).
- **Related files:** path:line where the modern pattern appears here.
```

## The golden rule

**Never say the old way is always wrong.** Frame it as: fine for small projects,
harder to maintain at scale. Always include the tradeoff. The goal is understanding,
not dogma.

## Good comparisons to draw (pick ones the project demonstrates)

- Manual `fetch` in every component → reusable query hooks / TanStack Query
  (look for `react-query/` usage).
- Manual loading/error booleans → query state (`isPending`/`isError`).
- Inline validation `if` checks → schema validation (zod / class-validator).
- Prop drilling → context / store / server cache.
- Hand-written types for API responses → generated GraphQL types/hooks.
- Raw `setInterval` polling → scheduled jobs / cache invalidation / subscriptions.
- One giant component → composition into smaller components + hooks.
- Unscoped DB queries → tenant-scoped queries (`where: { barangayId }`).
- N+1 per-item queries → batch loading / dataloader / `$in` queries (the repo has
  a "batch loading for residents and users" commit — cite it if visible).

## Rules

- Only present a comparison where you can point to the modern side in the codebase,
  **or** clearly label the modern side as a suggestion (`Not yet in this project`).
- Render the "old" side in a red panel, the "modern" side in a green panel
  (see the HTML template's `.code-old` / `.code-new` classes).

## Per-card AI tutor (required, one per comparison)

Each comparison card ends with its **own** AI tutor box, scoped to that comparison,
so the learner can ask "why is the modern way better here?" in a continuous
conversation. Add it as the **last child inside** the comparison's `.card` div (so
`box.closest('.card')` grounds the tutor in that one comparison). Reuse existing
classes — no new CSS/script. See `references/12-topic-deepdive.md`.

```html
<div class="topic-chat" data-topic-slug="old-vs-modern-<slug>" data-topic-title="Old vs modern: <short label>">
  <div class="chat-head"><h3>Ask the AI tutor about this</h3><span class="ai-status">tutor offline</span></div>
  <div class="chat-log" aria-live="polite"></div>
  <form class="chat-form">
    <input class="chat-input" type="text" autocomplete="off" aria-label="Ask the AI tutor about this comparison" placeholder="Ask about this comparison…" />
    <button class="chat-send" type="submit">Send</button>
  </form>
  <p class="chat-hint">Topic-scoped chat (OpenCode Zen). Needs the local tutor: <code>cd reference/project-learning-audit/tutor-server &amp;&amp; npm start</code>.</p>
  <noscript>The AI tutor needs JavaScript.</noscript>
</div>
```

`<slug>`/`<short label>` come from the comparison's modern-side file or topic; keep
the slug unique on the page. Escape `<`, `>`, `&`, `"` in the title attribute.

## Output of this phase

- Old-vs-modern comparison blocks (HTML section), each comparison card ending with
  its own per-card AI tutor box.
