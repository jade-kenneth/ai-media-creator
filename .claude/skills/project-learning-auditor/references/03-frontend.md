# 03 — Frontend deep dive

Explain the frontend patterns the project actually uses. Produce a set of
**pattern cards** for the frontend section of `index.html`.

## Patterns to scan for and explain

Cover the ones that exist (skip with `Not detected from current files.` if absent):

- Routing pattern (App Router / file-based / stack navigator)
- Page & layout structure
- Component hierarchy & reusable components
- Server components vs client components (Next.js `"use client"`)
- Props & composition
- State management (local, context, store, server-cache)
- Form handling
- Validation (zod/yup/react-hook-form/manual)
- API fetching (TanStack Query / fetch / Apollo / generated hooks)
- Loading, empty, and error states
- Authentication gating (protected routes/screens)
- Role-based UI rendering
- Conditional rendering
- Modal/dialog/bottom-sheet patterns
- Table/list rendering
- Pagination, filtering, search, sorting
- Reusable hooks & utilities
- Styling system (Tailwind / NativeWind / CSS modules)
- Responsive layout
- Accessibility basics
- Performance / rerender risks

De-dup: when a pattern repeats (e.g. the same form→validate→submit shape across
several features), explain it **once** and list every location.

## Pattern card shape (each one)

```
### <Pattern name>
- **What it is:** one plain sentence.
- **Where it appears:** path:line (+ list other occurrences).
- **Why it exists:** the problem it solves.
- **How it works (step by step):** 3–6 steps, ending in a UI change.
- **Triggering user action:** what the user does to start it.
- **Beginner mistake to avoid:** one concrete pitfall.
- **Best-practice rule:** one rule to follow.
```

## Per-card AI tutor (required, one per card)

Each pattern card ends with its **own** AI tutor box, scoped to that single card —
so the learner can ask about *this exact pattern* and hold a continuous,
topic-scoped conversation. Add it as the **last child inside** the card's `.card`
div (so grounding = that one card). Reuse the page's existing classes — no new CSS
or script. See `references/12-topic-deepdive.md` for the proxy/why/setup.

```html
<div class="topic-chat" data-topic-slug="<card-slug>" data-topic-title="<Pattern name>">
  <div class="chat-head"><h3>Ask the AI tutor about this</h3><span class="ai-status">tutor offline</span></div>
  <div class="chat-log" aria-live="polite"></div>
  <form class="chat-form">
    <input class="chat-input" type="text" autocomplete="off" aria-label="Ask the AI tutor about <Pattern name>" placeholder="Ask about “<Pattern name>”…" />
    <button class="chat-send" type="submit">Send</button>
  </form>
  <p class="chat-hint">Topic-scoped chat (OpenCode Zen). Needs the local tutor: <code>cd reference/project-learning-audit/tutor-server &amp;&amp; npm start</code>.</p>
  <noscript>The AI tutor needs JavaScript.</noscript>
</div>
```

- `<card-slug>` = kebab-case of the pattern name; must be unique on the page.
- Escape `<`, `>`, `&`, `"` inside the title attribute. The box must be the card's
  last child so `box.closest('.card')` grounds the tutor in that card only.

## Example frontend flow to include (adapt to real files)

```
User taps "Submit"
→ Form state updates            (the form hook)
→ Validation runs               (zod/resolver)
→ API request is sent           (mutation hook)
→ Loading state appears          (isPending)
→ Backend returns a response
→ Success toast appears / cache invalidated
→ UI refreshes or navigates
```

## This codebase's likely stack (confirm against the scan)

- **Admin:** Next.js App Router + React + TypeScript + TanStack Query + Tailwind +
  shadcn/ui. Look in `apps/brgy-system-admin/` (`features/`, `react-query/`,
  `components/`, `app/`).
- **Mobile:** React Native + Expo + TypeScript + TanStack Query + NativeWind. Look
  in `apps/brgy-system-mobile/`.
- GraphQL data layer with generated hooks/types is common here — cite the
  generated files and the `react-query/` operations.

## Output of this phase

- Frontend pattern cards (web + mobile, clearly separated when both exist), each
  ending with its own per-card AI tutor box (`.topic-chat`).
