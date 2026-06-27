# Motion & Animation

## Philosophy

Motion should **clarify feedback or orientation** before adding delight. In an admin/civic tool, animation is a communication tool — not a spectacle.

---

## `prefers-reduced-motion` — Non-Negotiable

All animations must be suppressible:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

The project uses `tw-animate-css`, which respects this at the utility level. Never override or ignore `prefers-reduced-motion`.

---

## Duration Scale

| Type | Duration | Use |
|---|---|---|
| Micro | `75ms` | Focus rings, button press |
| Fast | `150ms` | Tooltips, badge changes |
| Standard | `200ms` | Modal enter, dropdown open |
| Slow | `300ms` | Page transitions, drawer slide |
| Very slow | `500ms+` | Skeleton shimmer, loading progress |

Default to `150ms–200ms`. Never use values above `400ms` for utility transitions — they feel sluggish in admin UIs.

---

## Easing

| Use case | Easing |
|---|---|
| Enter (appear, expand) | `ease-out` |
| Exit (disappear, collapse) | `ease-in` |
| General transitions | `ease-in-out` |
| Spring-like (Framer Motion only) | `type: 'spring'` |

Tailwind equivalents: `ease-in`, `ease-out`, `ease-in-out`.

---

## CSS Transitions (Preferred)

Use Tailwind transition utilities for simple UI state changes:

```tsx
// Hover state
<button className="transition-colors duration-150 hover:bg-muted">

// Expand/collapse
<div className="transition-all duration-200 ease-out overflow-hidden" style={{ height: open ? contentHeight : 0 }}>

// Focus ring
<input className="ring-0 transition-shadow duration-75 focus:ring-2 focus:ring-ring" />
```

---

## tw-animate-css Utilities

The project includes `tw-animate-css`. Use its animation utilities for enter/exit animations:

```tsx
// Fade in
<div className="animate-in fade-in duration-200">

// Slide from bottom (e.g. drawer, bottom sheet)
<div className="animate-in slide-in-from-bottom duration-300">

// Zoom in (modal appear)
<div className="animate-in zoom-in-95 fade-in duration-150">

// Exit (pair with conditional rendering or Radix animation state)
<div data-state={open ? 'open' : 'closed'} className="data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95">
```

---

## Skeleton Shimmer

Use the `Skeleton` component from `components/ui/skeleton` — it has the shimmer animation built in. Do not reimplement shimmer with `animate-pulse` on non-skeleton elements.

```tsx
<Skeleton className="h-4 w-32 rounded-full" />
<Skeleton className="h-9 w-20 rounded-lg" />
```

Mirror the shape of the content it represents: same approximate width, height, and border-radius.

---

## What NOT to Animate

- Table row highlights on data change (too noisy in dense admin UIs)
- Sorting direction indicators (instantaneous is fine)
- Badge/count number changes (unless building a real-time notification counter)
- Form validation errors appearing (they should be instant)

---

## Radix / shadcn Component Animations

shadcn primitives (Dialog, DropdownMenu, Popover, Tooltip, Sheet) use Radix's `data-state` attributes for enter/exit. Add `animate-in`/`animate-out` utilities via `data-[state=open]` and `data-[state=closed]` selectors — do not use JavaScript to drive the animation timing.

---

## Anti-Patterns

- Do not use `setTimeout` to delay UI visibility for a "fade in" effect.
- Do not animate layout properties (`width`, `height`, `top`, `left`) — animate `transform` and `opacity` instead for GPU compositing.
- Do not add entrance animations to every element on a page — restrict to one or two focal points.
- Do not use `transition-all` on large elements — it transitions every CSS property and is expensive.
- Do not ignore `prefers-reduced-motion`.
