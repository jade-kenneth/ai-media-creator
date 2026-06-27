# Chart Design — Visual Standards

## Chart Type Selection

Choose chart type based on the **cognitive task** the reader must perform:

| Task | Best chart |
|---|---|
| Compare quantities across categories | Bar chart (vertical or horizontal) |
| Show composition / proportion | Donut or pie (≤5 categories only) |
| Show trend over time | Line chart or area chart |
| Show correlation between two variables | Scatter plot |
| Show progress toward a goal | Radial bar or linear progress |
| Compare multiple items across multiple metrics | Grouped bar or radar chart |

**For this admin app:** Grouped/stacked bar charts and area charts cover 90% of cases. Use donut sparingly.

---

## Color Encoding

Always use the project's chart color tokens — never hardcode hex values:

```
var(--chart-1)  — primary series
var(--chart-2)  — secondary series
var(--chart-3)  — tertiary series
var(--chart-4)
var(--chart-5)
```

These are defined in `globals.css` for both light and dark mode.

### Color-Safety Rules

- Do not rely on color alone to distinguish series — pair with pattern, shape, or label.
- Use muted/desaturated colors for background or context series; saturated colors for primary data.
- Status colors should be semantically consistent: `text-emerald-*` for positive, `text-destructive` for failures, `text-amber-*` for warnings.
- Do not use red/green as the only distinguishing pair — colorblind-unsafe.

---

## Sizing

- Set an explicit height on `ChartContainer`. Do not rely on auto-height.
- Common heights: `h-48` (compact), `h-64` (standard), `h-80` (detailed).
- Use `aspect-square` only for pie/donut charts.
- Charts in cards should fill the card width with `w-full`.

---

## Axes

- Horizontal bar labels: use `XAxis` with `tickLine={false}` and `axisLine={false}` for a clean look.
- Do not show both `tickLine` and `axisLine` — choose one or neither.
- For numeric axes: format large numbers with `tickFormatter={(v) => formatCount(v)}` (from `utils/date.ts`).
- For date axes: use abbreviated labels (`MMM d` format via `date-fns`).
- Do not clutter axes with too many ticks — use `tickCount={5}` or similar for numeric axes.

---

## Tooltips

Always include a tooltip. Use `ChartTooltipContent` from `components/ui/chart.tsx`:

```tsx
<ChartTooltip content={<ChartTooltipContent />} />

// With custom label formatting
<ChartTooltip
  content={
    <ChartTooltipContent
      labelFormatter={(label) => `Month: ${label}`}
    />
  }
/>
```

Tooltips must work in both light and dark mode — `ChartTooltipContent` handles this via CSS vars.

---

## Legend

Show a legend when there are 2+ series. Use `ChartLegendContent`:

```tsx
<ChartLegend content={<ChartLegendContent />} />
```

- Position legend below the chart (`verticalAlign="bottom"`) for horizontal bar charts.
- Position legend above for area charts where series labels need to be visible without scrolling.
- Do not show a legend for single-series charts.

---

## Grid Lines

```tsx
<CartesianGrid vertical={false} />
```

- Show only horizontal grid lines for bar and line charts.
- Remove grid lines for pie/donut charts entirely.
- Use `stroke-border/50` — the `ChartContainer` styles this via its class overrides.

---

## Empty State

When data is zero or absent, do not render an empty chart frame. Instead:

```tsx
if (allValuesAreZero || !data.length) {
  return (
    <div className="flex h-64 items-center justify-center rounded-xl border border-border/70 bg-muted/30">
      <p className="text-sm text-muted-foreground">No data for this period</p>
    </div>
  );
}
```

---

## Skeleton While Loading

Match the chart's aspect ratio in the skeleton:

```tsx
<Skeleton className="h-64 w-full rounded-xl" />
```

---

## Dark Mode

Charts are automatically dark-mode safe when using:
- `var(--chart-*)` tokens for fill colors
- `ChartTooltipContent` for tooltips
- `ChartContainer` (which injects CSS vars with dark-mode variants)

Do not hardcode fill colors on `<Bar>`, `<Line>`, `<Area>`, or `<Pie>` — always use `var(--color-{key})` injected by `ChartConfig`.

---

## Anti-Patterns

- Do not use pie charts for > 5 categories.
- Do not use pie charts for time-series data.
- Do not rely on color alone to distinguish series (colorblind-safety).
- Do not show an empty chart frame — always render an empty state message.
- Do not skip the tooltip.
- Do not hardcode hex fill values.
