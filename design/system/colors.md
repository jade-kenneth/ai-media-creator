# Colour

Values are in [tokens.md](tokens.md). This document covers how colour is used.

## Theme decision

**Light app, dark stage** (confirmed 2026-09-23).

- **Light:** forms, review tables and the dashboard are light, which keeps long review sessions readable.
- **Dark stage:** anything showing footage (the 9:16 preview and the editor canvas in Batch 2, plus the sign-in illustration) sits on the dark stage so colours read true.

Tokens are semantic, so a full dark theme can be added later by redefining them.

## Roles

| Need | Use | Never |
| --- | --- | --- |
| Primary action | `--primary` fill, `--on-primary` text | Flare as a button fill: white on `#FF5A36` is only 3.1:1 |
| Secondary action | `--surface` fill, `--border-strong` border, `--ink` text | — |
| Link or inline text accent | `--flare-text`, underlined | `--flare` for text |
| Selection (chip, hook, angle, segment) | `--ink` fill or a 1.5px `--ink` border plus a 1px ring | Colour alone; selection also shows a check glyph |
| Current step | `--flare` dot, `--surface-sunken` row | — |
| Approved or completed | success family | — |
| Needs review, flag, over length, offline | warning family | Danger for a flag: a flag is a prompt, not an error |
| Rejected, failed, destructive, field error | danger family | — |
| Imported source, running job, neutral info | info family | — |

## Status mapping (shared across screens)

| Domain state | Badge |
| --- | --- |
| Fact `unreviewed` | warning “Needs review”, plus a 3px warning inset bar on the row |
| Fact `approved` | success “Approved” |
| Fact `rejected` | danger “Rejected”, claim struck through in `--ink-3` |
| Fact `unknown` | neutral “Unknown” |
| Project `draft` / `generating` | neutral |
| Project `facts_review` / `script_review` / `media_review` | info |
| Project `ready` / `exported` | success |
| Job `queued` | neutral “Queued” |
| Job `running` | info “Running” |
| Job `completed` | success “Completed” |
| Job `failed` | danger “Failed” |
| Script version draft / approved / needs review | neutral / success / warning |

Every status carries a text label. Colour is never the only signal (WCAG 1.4.1).

## Source badges

| Source | Badge |
| --- | --- |
| Imported from a listing | info tint, “Imported” |
| Entered by the creator | neutral tint, “You entered” |
| Imported, then changed by the creator | warning tint, “Edited” |

## Contrast (verified)

- **Text pairs**, all at least 4.5:1: `--ink` on `--canvas` 16.5 · `--ink-2` on `--canvas` 8.2 · `--ink-3` on `--surface` 5.4, on `--canvas` 5.0, on `--surface-sunken` 4.65 · `--flare-text` on white 5.4 · success, warning, danger and info text on their soft tints are 4.7, 5.7, 5.6 and 5.6.
- **Non-text UI:** `--flare` 3.1:1 and `--border-strong` are used only where WCAG 1.4.11 applies (3:1). Input borders (`--border-strong`) are paired with a visible label, so the field is identifiable without the border.

## Intentional exceptions

- A project or asset with no media shows a flat `--surface-sunken` tile with a 20px `--ink-3` film icon. No gradients or invented art stand in for media.
- Brand candidates (open decision 1) are not tokens until one is chosen.
