# Tokens

The single source of named values for AI Creation Platform. Production defines them once in `apps/app-web/app/globals.css` (`:root`) and maps them into the Tailwind theme, so components use utilities such as `bg-canvas` or `text-ink-2`. The companion documents explain usage:

- [colors.md](colors.md)
- [typography.md](typography.md)
- [spacing-layout.md](spacing-layout.md)
- [motion.md](motion.md)

Tokens are **semantic**: components reference the role (`--surface`, `--ink-2`), never a hex value. A second theme is added by redefining the same names, without touching components.

## Colour: light app (default theme)

| Token | Value | Role |
| --- | --- | --- |
| `--canvas` | `#F6F5F1` | Page background (warm paper) |
| `--surface` | `#FFFFFF` | Cards, inputs, top bar, stepper rail, dialogs |
| `--surface-sunken` | `#EFEDE7` | Segmented-control track, disabled button fill, current step, skeleton base |
| `--surface-hover` | `#F1EFEA` | Hover fill for ghost buttons, menu items, steps |
| `--border` | `#E2DFD6` | Card and divider borders |
| `--border-strong` | `#C9C5B9` | Input, chip and secondary-button borders |
| `--ink` | `#17161C` | Primary text; primary button fill; selected chip fill |
| `--ink-2` | `#4A4852` | Secondary text |
| `--ink-3` | `#6B6874` | Tertiary text, hints, placeholders (≥ 4.65:1 on every light surface) |
| `--primary` / `--primary-hover` / `--primary-pressed` | `#17161C` / `#2C2A33` / `#000000` | Primary action fill states |
| `--on-primary` | `#FFFFFF` | Text on primary |
| `--flare` | `#FF5A36` | Brand accent, **non-text only**: current-step dot, empty-state art. 3.1:1 on white |
| `--flare-text` | `#C4380F` | Accent for text and links (5.36:1 on white) |
| `--flare-soft` | `#FFE9E2` | Accent tint behind icons |
| `--focus` | `#1D4ED8` | Focus ring (6.7:1 on white) |
| `--success` / `-soft` / `-border` | `#1C7A43` / `#E3F4EA` / `#A9D8BA` | Approved, completed, on target |
| `--warning` / `-soft` / `-border` | `#8A5300` / `#FFF3D6` / `#F0C36A` | Needs review, claim flags, over length, offline |
| `--danger` / `-soft` / `-border` | `#B42318` / `#FDE8E6` / `#F2B8B2` | Rejected, failed, destructive, errors |
| `--info` / `-soft` / `-border` | `#1F55C8` / `#E6EEFD` / `#B5C8F3` | Imported source, running, neutral notices |

## Colour: dark stage

The stage is a surface **inside** the light theme. It is used for the sign-in illustration panel today, and for the 9:16 preview and scene editor canvas in Batch 2. It is not a dark theme.

| Token | Value | Role |
| --- | --- | --- |
| `--stage` | `#0E0E12` | Stage background |
| `--stage-surface` | `#1A1A21` | Panels on the stage |
| `--stage-border` | `#2B2B35` | Borders on the stage |
| `--stage-ink` | `#F3F2F7` | Primary text on stage (17.3:1) |
| `--stage-ink-2` | `#A9A7B4` | Secondary text on stage (7.3:1 on `--stage-surface`) |
| `--stage-flare` | `#FF7A5C` | Accent on stage (7.5:1 on `--stage`) |

## Type

| Token | Value |
| --- | --- |
| `--font-sans` | `'Geist', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif` |
| `--font-mono` | `'Geist Mono', ui-monospace, 'SF Mono', Menlo, monospace` |

The scale is in [typography.md](typography.md).

## Space (4-pt)

`--s1` 4 · `--s2` 8 · `--s3` 12 · `--s4` 16 · `--s5` 20 · `--s6` 24 · `--s8` 32 · `--s10` 40 · `--s12` 48 · `--s16` 64 (px)

## Radius

`--r-sm` 6px (inputs inside rows, small buttons, menu items) · `--r-md` 10px (buttons, inputs, banners, popovers) · `--r-lg` 14px (cards, dialogs, tiles) · `--r-pill` 999px (chips, badges)

## Elevation

| Token | Value | Use |
| --- | --- | --- |
| `--e1` | `0 1px 2px rgba(23,22,28,.06)` | Selected segment |
| `--e2` | `0 4px 16px rgba(23,22,28,.08)` | Popovers, hovered project card |
| `--e3` | `0 24px 48px rgba(23,22,28,.18)` | Dialogs, drawers, toasts |

## Motion

`--t-press` 140ms · `--t-fast` 120ms · `--t-base` 180ms · `--t-slow` 280ms · `--ease-out` `cubic-bezier(0.23, 1, 0.32, 1)` · `--ease-in-out` `cubic-bezier(0.77, 0, 0.175, 1)` · `--ease-drawer` `cubic-bezier(0.32, 0.72, 0, 1)`. See [motion.md](motion.md).

## Sizing

| Token | Value | Note |
| --- | --- | --- |
| `--control-h` | 40px | Buttons and inputs at ≥ 1024px; 44px below |
| `--control-h-sm` | 32px | Small buttons at ≥ 1024px; 36px below |
| `--topbar-h` | 60px | App shell top bar |
| `--rail-w` | 232px | Project workflow stepper rail |

## Brand-dependent tokens

The parent brand is undecided (open decision 1). Choosing a direction changes only these:

- the `--flare`, `--flare-text` and `--flare-soft` values (and the matching `--stage-flare`);
- the mark SVG;
- the wordmark typeface.

Everything else in this file is brand-independent.
