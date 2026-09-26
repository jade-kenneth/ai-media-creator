# Typography

**Typeface:** Geist for all UI text, and Geist Mono for timecodes, durations, credit amounts and the plain-text creator brief. Both ship as self-hosted variable fonts (`apps/app-web/app/fonts/geist-sans.woff2`, `geist-mono.woff2`) loaded with `next/font/local` and `display: swap`. Fallbacks are listed in [tokens.md](tokens.md).

## Scale

| Class | Size / line-height | Weight | Tracking | Use |
| --- | --- | --- | --- | --- |
| `t-display` | 32 / 40 (26 / 32 below 640px) | 600 | −0.02em | Sign-in headline, large numerals |
| `t-h1` | 24 / 32 (22 / 28 below 640px) | 600 | −0.015em | One per page: page or step title |
| `t-h2` | 18 / 26 | 600 | −0.01em | Dialog titles, empty-state titles |
| `t-h3` | 15 / 22 | 600 | 0 | Card titles, project card titles, scene purpose |
| `t-body` (default) | 15 / 24 | 400 | 0 | Body copy, input values |
| `t-sm` | 13 / 20 | 400 | 0 | Secondary descriptions, card meta, banners in asides |
| `t-label` | 13 / 18 | 500 | 0 | Field labels, emphasised short text |
| `t-caption` | 12 / 16 | 500 | +0.01em | Timestamps, counts, fine print |
| `t-overline` | 11 / 16 | 600 | +0.08em, uppercase | Section group labels (Plan / Produce / Deliver), angle and hook type |
| `t-mono` | 13 / 20 | 500 | tabular numerals, no wrap | Durations (`0:08–0:14`), credits (`128`, `3 credits`), counters (`1 of 3`) |
| Hook text | 17 / 24 | 600 | −0.01em | Hook option quote only |
| Button | 14 / 20 (13 for small) | 500 | 0 | All buttons |
| Brief text | 13 / 20 mono | 400 | 0 | The creator brief `<pre>` (12 below 640px) |

## Rules

- One `h1` per page. Card titles are `h2` visually styled as `t-h3`, so the semantic hierarchy stays correct.
- Sentence case everywhere: titles, buttons, menu items. Uppercase is only for `t-overline`.
- Numbers the creator compares (durations, credits, counts) use `t-mono` so they don't jitter as they change.
- Maximum measure for descriptive text is about 640px (`max-width` on step subtitles and empty-state paragraphs).
- Creator content (hooks, narration, captions) is rendered in the same sans face as the UI. It may be English, Filipino or Taglish; the UI copy itself is English only.
- Do not use weights other than 400, 500, 600 and 700 (700 only for the working wordmark and the caption chip on the stage).
