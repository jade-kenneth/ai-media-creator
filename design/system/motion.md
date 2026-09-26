# Motion

Motion is quiet and functional. It confirms that something responded, or shows where something came from. There is no decorative motion. Values follow the design-engineering rules (the motion authority for this product).

## Tokens

| Token | Value | Use |
| --- | --- | --- |
| `--t-press` | 140ms | Press feedback (scale) |
| `--t-fast` | 120ms | Hover and colour changes, border changes, chip selection, overlay exits |
| `--t-base` | 180ms | Popover and dialog enter |
| `--t-slow` | 280ms | Drawer enter, job progress bar width |
| `--ease-out` | `cubic-bezier(0.23, 1, 0.32, 1)` | Everything entering or responding |
| `--ease-in-out` | `cubic-bezier(0.77, 0, 0.175, 1)` | Things moving while visible (hook rail paging; Batch 2 scene reorder) |
| `--ease-drawer` | `cubic-bezier(0.32, 0.72, 0, 1)` | Drawer and bottom sheet enter |

Colour and hover transitions use plain `ease`. Never use `ease-in` for interactive UI, never `transition: all`, and never animate width, height, margin or position when a transform works. (The job progress bar is the one exception: it animates `transform: scaleX()` on a full-width bar, not `width`.)

## Frequency gate

| Frequency | Examples | Motion |
| --- | --- | --- |
| Many times per session | Chip and segment selection, fact Approve/Reject, menu open, typing, autosave indicator | Colour only; menus appear instantly |
| Occasional | Dialogs, drawer, popover, toast, job panel changes | Standard motion below |
| Rare | First script ready | The toast is enough; no celebration |

Keyboard-initiated actions never animate beyond colour.

## Patterns

| Pattern | Behaviour |
| --- | --- |
| Button press | `transform: scale(0.97)` on `:active`, `--t-press` `--ease-out`. Buttons only, not chips, rows or cards. |
| Hover (pointer devices only) | Colour and border change over `--t-fast` `ease`, gated by `@media (hover: hover) and (pointer: fine)`. |
| Popover (credits) | Enters from `scale(0.96)` and `opacity: 0` over `--t-base` `--ease-out`, `transform-origin` at the trigger. Exits over `--t-fast`, opacity only. |
| Menu | Appears instantly; closes instantly. |
| Dialog | Enters with opacity 0 → 1 and `scale(0.97)` → 1 over `--t-base` `--ease-out`, centred origin; the scrim fades over `--t-base`. Exits over `--t-fast`, opacity only. |
| Bottom sheet (dialogs below 640px) | Enters `translateY(100%)` → 0 over `--t-slow` `--ease-drawer`; exits over `--t-fast` sliding back down. |
| Drawer (version history) | Enters `translateX(100%)` → 0 over `--t-slow` `--ease-drawer`; exits along the same path over `--t-fast`. |
| Toast | Enters over `--t-base` from `translateY(8px)` and opacity 0; auto-dismisses after about 3.6s; exits over `--t-fast`. Timers pause while the document is hidden or the toast is hovered or focused. |
| Skeleton shimmer | 1.4s linear loop. |
| Spinner | 700ms linear rotation. |
| Job progress bar | `scaleX` over `--t-slow` `--ease-out` per update; the queued bar is static. |
| Hook rail paging | Smooth scroll by one card (browser `scrollBy({ behavior: 'smooth' })`). |
| Step or state change | No page transition; content swaps in place. Focus moves to the new heading when a whole panel changes (job panel → editor). |

## Reduced motion

Under `prefers-reduced-motion: reduce`:

- scale and translate are removed; dialogs, popovers, sheets, the drawer and toasts fade over 150ms opacity only;
- press feedback is removed (colour change remains);
- the shimmer stops;
- programmatic scrolling (“Go to scene 4”, hook paging) jumps instantly.

The spinner keeps a slow 1.2s rotation, because it communicates that work is in progress. Nothing autoplays in any mode.
