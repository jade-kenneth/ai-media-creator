# 09 — Diagrams (HTML/CSS only)

Make hidden program flow visible with **HTML + CSS animated diagrams**. No
JavaScript is required for diagrams. Each diagram is also saved as a standalone
file under `reference/project-learning-audit/diagrams/` and embedded in the
matching `index.html` section.

## Theme

All diagrams use the **dark "programmer minimalist"** theme shared with
`index.html`: near-black background (`--bg:#0b0f14`), dark panels
(`--panel:#11161d`), soft off-white text (`--ink:#c9d1d9`), subtle hairline
borders (`--line`), and accent colors tuned for dark (`--blue:#58a6ff`,
`--orange:#f0883e`, `--green:#3fb950`). Step numbers, file refs, and labels use
the monospace stack. Never reintroduce the old light palette — copy variables
from `assets/diagrams/flow-diagram.html` verbatim.

## Visual convention

- A horizontal row of **step cards** joined by **dashed connectors**.
- Each card: a square monospace step number (1, 2, 3 …) in a rounded keycap, a
  short label in bright ink, and a small grey `path:line — method()` line beneath.
- **Connector = a dashed line in the gap** between two cards, with a small
  chevron arrowhead at the end pointing into the next step. Draw it with the
  `.flow-step::after` (dashed line) + `.flow-step::before` (arrowhead) pseudo
  elements — never with a solid `→` glyph. The dashes gently "march" toward the
  next step via the `flowDash` keyframe.
- **One step is highlighted at a time**, cycling via CSS `@keyframes` — slow
  (~1.2–1.6s per step) and readable. The active card lifts, brightens, and gets
  an accent-colored ring + soft glow. Use `animation-delay` per card so the
  highlight walks left-to-right and loops.
- Responsive: on narrow screens the row becomes a vertical column and the
  connector rotates to a **vertical dashed rail** with a downward chevron.
- Use the shared snippet `assets/diagrams/flow-diagram.html` as the base; change
  only the step content. Do not duplicate or hand-roll the connector CSS.

## Highlight + connector technique (CSS only)

Give each card a base muted style and an animation that briefly raises opacity,
adds a colored ring + glow, and lifts it, offset by
`animation-delay: calc(var(--i) * 1.4s)` with a total cycle = (steps × per-step
duration). Draw the dashed connector as a gradient-backed pseudo element so the
dashes can animate. No JS needed.

```css
.flow { gap: var(--gap); --gap: 30px; }
.flow-step { opacity: .5; animation: flowPulse calc(var(--steps) * var(--dur)) infinite; }
/* dashed connector + marching dashes */
.flow-step::after {
  content: ""; position: absolute; right: calc(-1 * var(--gap)); top: 50%;
  width: var(--gap); height: 2px; transform: translateY(-50%);
  background-image: linear-gradient(90deg, var(--line-bright) 0 5px, transparent 5px 10px);
  background-size: 10px 2px; background-repeat: repeat-x;
  animation: flowDash .6s linear infinite;
}
/* chevron arrowhead */
.flow-step::before {
  content: ""; position: absolute; right: calc(-1 * var(--gap) + 1px); top: 50%;
  width: 6px; height: 6px; transform: translateY(-50%) rotate(45deg);
  border-top: 2px solid var(--line-bright); border-right: 2px solid var(--line-bright);
}
.flow-step:last-child::after, .flow-step:last-child::before { content: none; }
@keyframes flowPulse {
  0%, 14% { opacity: 1; border-color: var(--accent2);
    box-shadow: 0 0 0 1px var(--accent2), 0 0 22px -6px var(--accent2); transform: translateY(-2px); }
  20%, 100% { opacity: .5; border-color: var(--line); box-shadow: none; transform: none; }
}
@keyframes flowDash { to { background-position: 10px 0; } }
```

(The shared snippet generalizes this; respect `prefers-reduced-motion` by
disabling both the pulse and the dash animation.)

## Required diagrams (generate each)

| File | Flow | Color phase |
|---|---|---|
| `api-request-flow.html` | request → guard → DTO → service → DB → response | orange (main action) |
| `auth-flow.html` | login → validate → issue token/session → guard checks | blue (init) |
| `form-submission-flow.html` | input → validate → submit → loading → success | orange |
| `database-flow.html` | service → repository/model → DB → result | green |
| `notification-flow.html` | trigger → notification service → device/email | green |
| `frontend-state-flow.html` | action → state update → rerender → UI | blue |

Generate `n1-query-flow.html` **only if** `manifest.audit_signals` has a
`possible_n1_query` entry — show the per-item query loop vs a single batched query.

## Grounding

Every step card carries the real `path:line` from the scan. If a step can't be
located, label it `not detected` in grey rather than inventing a file.

## Standalone vs embedded

- Standalone file: a full minimal HTML doc (own `<style>`) so it opens on its own.
- Embedded copy: the same markup dropped into the relevant `index.html` section
  (the page's global `<style>` already defines `.flow-*` classes — don't duplicate).

## Output of this phase

- `diagrams/*.html` (6, or 7 with N+1) + embedded copies in `index.html`.
