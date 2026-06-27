# Loading States — Skeleton Patterns

## Core Rule

Every server-backed surface must have a loading state. A blank area while data loads is a broken UX.

---

## Skeleton Component

Use the `Skeleton` component from your UI library (shadcn: `components/ui/skeleton`). It renders a shimmer-animated placeholder.

```tsx
import { Skeleton } from '@/components/ui/skeleton';

<Skeleton className="h-4 w-32" />
```

Set `className` to match the shape of the content it represents:

| Content | Skeleton |
|---|---|
| One-line text | `h-4 w-40 rounded-full` |
| Button | `h-9 w-24 rounded-md` |
| Avatar | `size-10 rounded-full` |
| Chart area | `h-64 w-full rounded-xl` |
| Badge | `h-5 w-16 rounded-full` |
| Icon placeholder | `size-5 rounded-md` |

---

## Card Skeleton — Mirror the Layout

Mirror the card's exact layout — same padding, same slot positions:

```tsx
function MyCardSkeleton() {
  return (
    <Card>
      <CardHeader className="items-center pt-6 text-center">
        <Skeleton className="mx-auto size-20 rounded-full" />
        <Skeleton className="mt-3 h-4 w-32" />
        <Skeleton className="mt-1 h-5 w-24 rounded-full" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </CardFooter>
    </Card>
  );
}
```

---

## Grid of Card Skeletons

Wrap skeleton cards in the same grid structure as the real content:

```tsx
if (isLoading) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <MyCardSkeleton key={i} />
      ))}
    </div>
  );
}
```

---

## Stat Card Skeleton

For KPI stat cards:

```tsx
function StatCardSkeleton() {
  return (
    <Card className="min-h-[168px]">
      <CardContent className="flex h-full flex-col justify-between gap-6 px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24 rounded-full" />
            <Skeleton className="h-9 w-20 rounded-lg" />
          </div>
          <Skeleton className="size-11 rounded-2xl" />
        </div>
        <Skeleton className="h-4 w-full rounded-full" />
      </CardContent>
    </Card>
  );
}
```

---

## Table Skeleton

Show rows of skeleton content matching the table's column count:

```tsx
if (isLoading) {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      ))}
    </div>
  );
}
```

---

## Page-Level Loading

Mirror the page structure for page-level loading states:

```tsx
if (isLoading) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
```

---

## Vary Skeleton Widths

Never make all skeleton lines the same width — it looks artificial:

```tsx
{/* ✅ Varied — looks natural */}
<Skeleton className="h-4 w-full" />
<Skeleton className="h-4 w-3/4" />
<Skeleton className="h-4 w-1/2" />

{/* ❌ Uniform — looks robotic */}
<Skeleton className="h-4 w-full" />
<Skeleton className="h-4 w-full" />
<Skeleton className="h-4 w-full" />
```

---

## Anti-Patterns

- Do not use `animate-pulse` on arbitrary `div` elements — use the `Skeleton` component.
- Do not show only a spinner for page-section loading — spinners don't preserve layout space.
- Do not render an empty container while loading.
- Do not make all skeleton lines the same width.
