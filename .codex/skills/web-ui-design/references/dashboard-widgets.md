# Dashboard Widgets — KPI Cards, Stat Blocks, Charts

## KPI / Stat Card

Use a card component for top-level KPI metrics. The pattern:

```tsx
function StatCard({
  icon: Icon,
  label,
  value,
  iconClassName,
  caption,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  iconClassName?: string;
  caption?: string;
}) {
  return (
    <Card className="min-h-[168px] border-border/70">
      <CardContent className="flex h-full flex-col justify-between gap-6 px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {label}
            </p>
            <p className="text-3xl font-semibold tracking-tight">{value}</p>
          </div>
          <div className="flex size-11 items-center justify-center rounded-2xl bg-muted/75 ring-1 ring-border/70">
            <Icon className={cn('size-5', iconClassName)} />
          </div>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          {caption ?? 'Updated from the latest summary.'}
        </p>
      </CardContent>
    </Card>
  );
}
```

- Fixed `min-h-[168px]` — all stat cards in a row must share the same minimum height.
- Label: `text-[11px] uppercase tracking-[0.2em]` — deliberately small and spaced for KPI readability.
- Value: `text-3xl font-semibold tracking-tight` — the number is the focal point.

---

## Stat Card Grid

Always render stat cards in a responsive grid:

```tsx
<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
  <StatCard label="Total Residents" value={formatCount(data.totalResidents)} icon={Users} iconClassName="text-primary" />
  <StatCard label="Active Requests" value={formatCount(data.activeRequests)} icon={FileText} iconClassName="text-amber-600 dark:text-amber-400" />
  <StatCard label="Votes Cast" value={formatCount(data.votesCast)} icon={Vote} iconClassName="text-emerald-600 dark:text-emerald-400" />
</section>
```

---

## Trend Indicator (Delta)

When data includes a trend (e.g., `+12 this month`, `↑ 4.5%`), display it in the caption with semantic color:

```tsx
const caption = trend
  ? `${trend.direction === 'up' ? '↑' : '↓'} ${trend.deltaPercent}% from last month`
  : 'Updated from the latest summary.';
```

Color convention:
- Positive / up: `text-emerald-600 dark:text-emerald-400`
- Negative / down: `text-destructive`
- Neutral: `text-muted-foreground`

---

## Quick Action Cards

For action shortcut links on the dashboard:

```tsx
<Link
  href="/admin/requests"
  className="group flex items-start gap-3 rounded-xl border border-border/70 bg-card p-4 transition-colors hover:bg-muted/50"
>
  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
    <FileText className="size-4" />
  </div>
  <div className="min-w-0">
    <p className="text-sm font-medium">Review queue</p>
    <p className="text-xs text-muted-foreground">Pending reviews and release-ready documents.</p>
  </div>
  <ArrowRight className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
</Link>
```

---

## Recent Activity List Rows

For compact "recent records" sections — use rows, not cards:

```tsx
<div className="divide-y divide-border/70">
  {recentItems.map((item) => (
    <div key={item.id} className="flex items-center gap-3 py-3 px-1">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.name}</p>
        <p className="text-xs text-muted-foreground">{item.type}</p>
      </div>
      <StatusBadge status={item.status} />
      <span className="shrink-0 text-xs text-muted-foreground">
        {formatRelativeTime(item.createdAt)}
      </span>
    </div>
  ))}
</div>
```

---

## Dashboard Section Layout

Use `Card` + `CardHeader` + `CardContent` for each dashboard section:

```tsx
<Card className="border-border/70">
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle>Requests per Month</CardTitle>
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/requests">
          View all <ArrowRight className="size-3" />
        </Link>
      </Button>
    </div>
    <CardDescription>Monthly breakdown by status</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Chart or list */}
  </CardContent>
</Card>
```

---

## Responsive Dashboard Layout

```tsx
<div className="space-y-6">
  {/* Stat cards */}
  <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">...</section>

  {/* Charts — side by side on large screens */}
  <div className="grid gap-4 lg:grid-cols-2">
    <Card>...</Card>
    <Card>...</Card>
  </div>

  {/* Recent activity — full width */}
  <Card>...</Card>
</div>
```

---

## Anti-Patterns

- Do not display raw numbers without formatting (`formatCount`, `formatRelativeTime`).
- Do not show trend arrows without semantic color (green/red).
- Do not put more than 3 stat cards per row at the largest breakpoint.
- Do not nest cards inside cards.
- Do not use full cards for recent activity rows — use a divide-y row list.
