# Charts — Recharts + shadcn Chart Wrapper

## Stack

`recharts` is the chart library. The project uses the **shadcn `chart` component** pattern — a `ChartContainer` wrapper that handles `ResponsiveContainer`, CSS variable color injection, and dark mode. If the project doesn't have it yet, add it via `npx shadcn@latest add chart`.

---

## ChartConfig — Define Colors and Labels

```ts
import type { ChartConfig } from '@/components/ui/chart';

const chartConfig = {
  pending: {
    label: 'Pending',
    color: 'var(--chart-1)',
  },
  approved: {
    label: 'Approved',
    color: 'var(--chart-2)',
  },
  rejected: {
    label: 'Rejected',
    color: 'var(--chart-3)',
  },
} satisfies ChartConfig;
```

Use `var(--chart-1)` through `var(--chart-5)` CSS tokens — these are defined in the project's `globals.css` for both light and dark mode. Do not hardcode hex values in chart config.

---

## ChartContainer — Always Use It

Never use `ResponsiveContainer` directly — it's handled inside `ChartContainer`.

```tsx
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

<ChartContainer config={chartConfig} className="h-64 w-full">
  <BarChart data={data} accessibilityLayer>
    <CartesianGrid vertical={false} />
    <XAxis dataKey="label" tickLine={false} axisLine={false} />
    <YAxis tickLine={false} axisLine={false} />
    <ChartTooltip content={<ChartTooltipContent />} />
    <ChartLegend content={<ChartLegendContent />} />
    <Bar dataKey="pending" fill="var(--color-pending)" radius={4} />
    <Bar dataKey="approved" fill="var(--color-approved)" radius={4} />
  </BarChart>
</ChartContainer>
```

`fill="var(--color-{key})"` — the `--color-{key}` vars are injected by `ChartContainer` from `ChartConfig`.

---

## Chart Type Selection

| Data relationship | Chart type |
|---|---|
| Compare quantities across categories | Bar chart (grouped or stacked) |
| Show composition / proportion | Pie or donut (≤5 categories) |
| Show trend over time | Line or area chart |
| Show progress toward a goal | Radial bar |
| Compare multiple items across multiple metrics | Grouped bar or radar |

For admin dashboards: prefer bar charts. Pie charts are acceptable for ≤5 categories. Avoid pie charts for time-series data.

---

## PieChart Example

```tsx
import { Pie, PieChart, Cell } from 'recharts';

<ChartContainer config={chartConfig} className="aspect-square h-48">
  <PieChart>
    <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
      {data.map((entry, index) => (
        <Cell key={index} fill={entry.color} />
      ))}
    </Pie>
    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
  </PieChart>
</ChartContainer>
```

---

## Sizing

Always set an explicit height on `ChartContainer` — recharts needs a concrete height to render:

```tsx
// ✅ Explicit height
<ChartContainer config={config} className="h-64 w-full">

// ❌ No height — chart renders at 0px
<ChartContainer config={config}>
```

Common heights: `h-48` (compact), `h-64` (standard), `h-80` (detailed). Use `aspect-square` only for pie/donut.

---

## Axes

```tsx
// Clean axes — no tick lines, no axis lines
<XAxis dataKey="label" tickLine={false} axisLine={false} />
<YAxis tickLine={false} axisLine={false} tickFormatter={(v) => formatCount(v)} />
```

- Format large numbers with a number formatter on `tickFormatter`.
- For date axes, use abbreviated labels.
- Use `tickCount={5}` or similar to avoid crowded numeric axes.

---

## Grid Lines

```tsx
<CartesianGrid vertical={false} />
```

Show only horizontal grid lines for bar and line charts. Remove grid for pie charts entirely.

---

## Accessibility

Always add `accessibilityLayer` to the root recharts component:

```tsx
<BarChart data={data} accessibilityLayer>
<LineChart data={data} accessibilityLayer>
```

---

## Skeleton While Loading

```tsx
import { Skeleton } from '@/components/ui/skeleton';

<Skeleton className="h-64 w-full rounded-xl" />
```

---

## Empty State

When data is zero or absent, show a message — not an empty chart frame:

```tsx
if (!data.length || data.every((d) => d.value === 0)) {
  return (
    <div className="flex h-64 items-center justify-center rounded-xl border border-border/70 bg-muted/30">
      <p className="text-sm text-muted-foreground">No data for this period</p>
    </div>
  );
}
```

---

## Anti-Patterns

- Do not use `ResponsiveContainer` directly.
- Do not hardcode hex colors in `fill` — use `var(--color-{key})` from `ChartConfig`.
- Do not omit an explicit height on `ChartContainer`.
- Do not skip the empty state.
- Do not skip `accessibilityLayer` on the root chart element.
- Do not use pie charts for > 5 categories or for time-series data.

---

## Related References

- `references/code-splitting.md` — charts are heavy imports; load them per the heavy-client-imports non-negotiable
- `references/responsive-design.md` — container sizing and dense-content rules for chart layouts
- `references/accessibility.md` — accessible labels and color-independent communication
