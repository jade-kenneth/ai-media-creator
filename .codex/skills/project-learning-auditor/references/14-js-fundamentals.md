# 14 — JavaScript fundamentals (core topics, repo-connected)

The whole project is written in JavaScript/TypeScript, so a learner needs the
**core language building blocks** before the frameworks make sense. This section is
a focused list of **core JS fundamentals only** — the everyday building blocks like
arrays and objects — each tied to a **real place it's used in this repo**. It is a
primer, not a full language course: keep it to the core list below, don't drift
into advanced/runtime-specific corners (no event loop internals, no metaprogramming,
no decorators here — those belong in a topic deep dive if asked).

Produces the `index.html` "JavaScript fundamentals" section: a short intro, a
**core-topics table**, compact per-topic explainers, and **one** AI tutor box for
the whole section.

## The core topics list (cover these; skip none unless truly absent)

Keep to these — they are "core" by design. For each: a one-line "what it is", a
**tiny** canonical example, and **where it shows up in this repo** (`path:line`, or
`Not detected from current files.`). Prefer a real example pulled from the manifest
over a generic one.

1. **Variables & scope** — `let` / `const`, block scope, why `const` by default.
2. **Data types** — primitives (`string`, `number`, `boolean`, `null`,
   `undefined`, `symbol`, `bigint`) vs objects; `typeof`.
3. **Objects** — object literals, properties & methods, dot vs bracket access,
   nesting, shorthand. *(The backbone of every DTO, config, and response here.)*
4. **Arrays** — literals, indexing, `length`, and the workhorse methods:
   `map`, `filter`, `reduce`, `find`, `some`/`every`, `forEach`, `includes`,
   `sort`. *(Used everywhere lists are transformed — rendering, batching.)*
5. **Functions** — declarations vs expressions, parameters, `return`, default
   parameters, rest params `...args`.
6. **Arrow functions** — concise syntax, implicit return, and lexical `this`
   (why callbacks here are usually arrows).
7. **Control flow** — `if`/`else`, `switch`, ternary `?:`, `for` / `for…of` /
   `for…in`, `while`.
8. **Operators** — arithmetic, comparison, logical `&&`/`||`/`!`, plus the modern
   ones this codebase leans on: **optional chaining `?.`** and **nullish
   coalescing `??`**.
9. **Equality & truthy/falsy** — `===` vs `==`, the falsy set
   (`0`, `''`, `null`, `undefined`, `NaN`, `false`), guard patterns.
10. **Template literals** — backtick strings, `${interpolation}`, multiline.
11. **Destructuring** — object & array destructuring, renaming, defaults
    (e.g. `const { ok, data } = result`, `const [first] = items`).
12. **Spread & rest** — `...` to copy/merge objects & arrays and to gather args;
    immutability (`{ ...prev, field }`, `[...list, item]`).
13. **Array iteration & higher-order functions** — passing callbacks to
    `map`/`filter`/`reduce`; chaining; building new arrays instead of mutating.
14. **Closures** — a function remembering its outer scope (hooks, factories,
    memoized callbacks rely on this).
15. **`this` & context** — what `this` refers to, and why arrow functions sidestep
    rebinding in class methods/callbacks.
16. **Classes** — `class`, `constructor`, methods, `extends`/`super`
    (NestJS services, repositories, and DTOs are classes here).
17. **Modules** — `import` / `export` (named vs default), how files share code.
18. **Promises & async/await** — asynchronous code, `await`, `Promise.all`,
    `.then`/`.catch`; why almost every data call here is `async`.
19. **Error handling** — `try`/`catch`/`finally`, `throw`, and the result-object
    alternative this repo uses on the client (`{ ok:false, error }`).
20. **JSON** — `JSON.stringify` / `JSON.parse`, and how JSON maps to JS objects
    (API payloads, config).

> Optional one-liners only if you have room, framed as "TypeScript adds…": types &
> interfaces, generics, enums, union types. Keep these to a single sentence — the
> dedicated TypeScript treatment lives in the Tech-stack section (§13), not here.

## Part A — Core-topics table

A compact, scannable table so a learner sees the whole core list at once:

| # | Topic | One-line what | Tiny example | Where it's used here (`path:line`) |
|---|---|---|---|---|

Fill the "Where it's used here" cell with a **real** occurrence from the scan when
one is obvious (e.g. an array `.map` in a component, a destructured hook result, an
`async` service method). If you can't find a clear example for a topic, write
`Not detected from current files.` — never fabricate a line.

## Part B — Short explainers (group, don't bloat)

After the table, add a few compact `.card`s grouping related topics so the section
teaches, not just lists. Suggested grouping (3–5 cards total):

- **Objects & arrays — the two you'll touch most** (objects, arrays, array methods,
  destructuring, spread/rest). Show one repo-grounded snippet each.
- **Functions & flow** (functions, arrow functions, control flow, higher-order
  functions, closures).
- **Modern safety operators** (`?.`, `??`, `===`, truthy/falsy) — note where the
  repo uses them and why they prevent bugs.
- **Async & modules** (promises/async-await, error handling, import/export, JSON).

Each card: 1–2 sentence explanation + a tiny escaped code sample + a `path:line`
where the repo uses it. Tie back to the frameworks ("this is the same `.map` React
uses to render a list", "this `{ ...prev }` is how immutable state updates work").

## Part C — One AI tutor box for the whole section

Add a **single** `.topic-chat` box at the end of the section (NOT inside a `.card`,
so it grounds in the whole section via `box.closest('section')`). One box is right
here — the topics are small and closely related, so per-topic boxes would be
excessive. Reuse existing classes; add no new CSS/script.

```html
<div class="topic-chat" data-topic-slug="js-fundamentals" data-topic-title="JavaScript fundamentals">
  <div class="chat-head"><h3>Ask the AI tutor about JavaScript fundamentals</h3><span class="ai-status">tutor offline</span></div>
  <div class="chat-log" aria-live="polite"></div>
  <form class="chat-form">
    <input class="chat-input" type="text" autocomplete="off" aria-label="Ask the AI tutor about JavaScript fundamentals" placeholder="Ask about arrays, objects, async/await…" />
    <button class="chat-send" type="submit">Send</button>
  </form>
  <p class="chat-hint">Topic-scoped chat (OpenCode Zen). Needs the local tutor: <code>cd reference/project-learning-audit/tutor-server &amp;&amp; npm start</code>.</p>
  <noscript>The AI tutor needs JavaScript.</noscript>
</div>
```

## Rules

- **Core only.** Stick to the 20-topic list. Don't expand into advanced/runtime
  topics — if the user wants those, they belong in a topic deep dive (§12 mode).
- **Connect to the repo.** Prefer a real `path:line` example over a generic one;
  use `Not detected from current files.` when there's no clear example.
- **TS is a layer, not the lesson here.** Mention TypeScript only as the one-line
  "TS adds…" note; the full TypeScript/tooling story lives in §13 Tech stack.
- **Self-contained.** Reuse the page's classes (`.card`, `.file-ref`, `table`,
  `.topic-chat`, `.chat-*`, `.ai-status`); add no new `<style>`/`<script>`.
- Escape `<`, `>`, `&` in every code sample; never paste a secret value.

## Output of this phase

- "JavaScript fundamentals" section = core-topics table (Part A) + grouped
  explainer cards (Part B) + one section-level AI tutor box (Part C).
