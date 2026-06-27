# Icon System — lucide-react + react-icons

## Libraries in Use

- **`lucide-react`** — primary icon library. Use for all UI chrome, actions, status indicators, and navigation.
- **`react-icons`** — supplementary, for brand icons (social, third-party) or icons not available in Lucide.

Do not introduce a third icon library.

---

## Sizing Scale

| Context | Size class | Pixel equivalent |
|---|---|---|
| Inline text icon | `size-3` | 12px |
| Small badge / chip | `size-3.5` | 14px |
| Default inline / input adornment | `size-4` | 16px |
| Button icon | `size-4` | 16px |
| Interactive control (default) | `size-5` | 20px |
| Stat card icon | `size-5` | 20px |
| Avatar fallback / large control | `size-6` | 24px |
| Empty state icon | `size-8` | 32px |

Use `size-*` (width + height together) rather than `w-* h-*` pairs.

---

## Color

Icons inherit `currentColor` from Tailwind. Set color via the text color on the icon or its parent:

```tsx
// Inherits from parent
<div className="text-primary">
  <Users className="size-5" />
</div>

// Direct color
<CheckCircle className="size-4 text-emerald-600 dark:text-emerald-400" />
<AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
<OctagonX className="size-4 text-destructive" />
```

Never set `fill` or `stroke` on Lucide icons directly — they use `currentColor` by default.

---

## Icon Containers (Background Rings)

Wrap icons in a container when they need visual weight:

```tsx
{/* Stat card icon container */}
<div className="flex size-11 items-center justify-center rounded-2xl bg-muted/75 ring-1 ring-border/70">
  <Users className="size-5 text-primary" />
</div>

{/* Empty state icon container */}
<div className="flex size-16 items-center justify-center rounded-[22px] border border-border/70 bg-muted/70 text-primary shadow-sm">
  <Users className="size-8" />
</div>

{/* Quick action icon container */}
<div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
  <FileText className="size-4" />
</div>
```

---

## Button Icons

```tsx
// Icon-only button — always provide accessible name
<Button variant="ghost" size="icon" aria-label="Delete official">
  <Trash2 className="size-4" />
</Button>

// Button with leading icon
<Button>
  <Plus className="size-4" />
  Add Official
</Button>

// Button with trailing icon (navigation)
<Button variant="ghost" size="sm">
  View all
  <ArrowRight className="size-3" />
</Button>
```

---

## Icon-Only Buttons — Accessibility

Every icon-only button must have either:
- `aria-label="..."` on the `<Button>` element, or
- A `<Tooltip>` wrapping the button with the label as `TooltipContent`

```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="ghost" size="icon" onClick={onEdit}>
      <Pencil className="size-4" />
    </Button>
  </TooltipTrigger>
  <TooltipContent>Edit official</TooltipContent>
</Tooltip>
```

---

## Status Icons

| Status | Icon | Color |
|---|---|---|
| Success / active | `CircleCheck` | `text-emerald-600 dark:text-emerald-400` |
| Warning | `TriangleAlert` | `text-amber-600 dark:text-amber-400` |
| Error / rejected | `OctagonX` or `XCircle` | `text-destructive` |
| Info / pending | `Info` or `Clock` | `text-primary` |
| Loading | `Loader2 animate-spin` | `text-muted-foreground` |

---

## Drag Handle Icons

Use `GripVertical` from Lucide for drag handles:

```tsx
<button {...listeners} aria-label="Drag to reorder" type="button">
  <GripVertical className="size-4 text-muted-foreground" />
</button>
```

---

## Anti-Patterns

- Do not mix icon libraries within the same UI section — pick Lucide or react-icons for a given component.
- Do not use `w-4 h-4` — use `size-4`.
- Do not hardcode `stroke` or `fill` on Lucide icons.
- Do not use icon-only buttons without `aria-label` or a tooltip.
- Do not use icons larger than `size-8` in content areas — reserve large icons for empty states and illustrations only.
