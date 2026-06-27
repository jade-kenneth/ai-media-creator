# Typography Scale

## Core Rules

- Use the project's Tailwind type scale — do not create custom `font-size` values with arbitrary `[]` syntax.
- Typography must be legible at all breakpoints and in both light and dark mode.
- Never use low-contrast muted text for primary content.

---

## Type Scale Reference

| Role | Tailwind classes | Use |
|---|---|---|
| Page title | `text-2xl font-semibold tracking-tight` | Main page heading (h1 equivalent) |
| Section title | `text-xl font-semibold` | Card headers, section headings |
| Card title | `text-lg font-medium` | `CardTitle` default, modal headers |
| Subsection label | `text-base font-medium` | Sub-headers within sections |
| Body (default) | `text-sm` | Lists, table cells, form values |
| Body large | `text-base` | Dialog body, longer-form content |
| Caption / helper | `text-xs text-muted-foreground` | Field hints, timestamps, metadata |
| Badge / label | `text-xs font-medium` | Status badges, tags |
| Stat value | `text-3xl font-semibold tracking-tight` | KPI numbers on dashboard |
| Stat label | `text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground` | KPI card labels |
| Table header | `text-xs font-medium text-muted-foreground uppercase tracking-wide` | Column headers |
| Code / mono | `font-mono text-sm` | Reference numbers, IDs, tokens |

---

## Color Pairings

| Purpose | Class |
|---|---|
| Primary content | `text-foreground` |
| Secondary / supporting | `text-muted-foreground` |
| Destructive / error | `text-destructive` |
| Success | `text-emerald-600 dark:text-emerald-400` |
| Warning | `text-amber-600 dark:text-amber-400` |
| Info | `text-primary` |
| Disabled | `text-muted-foreground opacity-50` |

Never use raw color values (e.g., `text-gray-500`) for semantic content — always use token-based classes.

---

## Line Height

| Context | Class |
|---|---|
| UI elements (labels, buttons, badges) | Default (tight) |
| Body paragraphs, descriptions | `leading-6` |
| Long-form content (announcements, prose) | `leading-7` (via `Prose` component) |
| Dense table cells | `leading-5` |

---

## Font Weight

| Use | Weight |
|---|---|
| Regular body text | `font-normal` (default) |
| Labels, table values, list items | `font-medium` |
| Titles, card headers | `font-semibold` |
| KPI values, brand text | `font-semibold` |
| Never for UI text | `font-bold`, `font-extrabold`, `font-black` |

Use `font-bold` only for emphasis within prose content (via the `Prose` component).

---

## Dense Admin UI Rules

For admin panels, tables, sidebars, and compact cards:
- Use `text-sm` as the default body size — not `text-base`.
- Use `text-xs` for metadata, timestamps, and secondary labels.
- Do not use `text-lg` or larger for body content — reserve larger sizes for headings only.
- Avoid hero-scale typography (`text-4xl`+) inside content panels.

---

## Truncation

For text in constrained containers (table cells, list items, sidebar items):

```tsx
// Single-line truncation
<p className="truncate text-sm">{longText}</p>

// Multi-line clamp
<p className="line-clamp-2 text-sm">{longText}</p>
```

Always test truncation with the longest expected real-world value.

---

## Anti-Patterns

- Do not use arbitrary font sizes (`text-[13px]`) — use the canonical scale.
- Do not use `text-gray-*` for semantic text — use `text-foreground` / `text-muted-foreground`.
- Do not use `font-bold` for UI headings — use `font-semibold`.
- Do not use `text-base` as default inside dense admin panels — use `text-sm`.
- Do not use low-contrast muted text for primary readable content.
