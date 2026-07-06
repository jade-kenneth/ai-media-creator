# Date Handling — date-fns

## Import

```ts
import { format, formatDistanceToNowStrict, addDays, addMinutes, isAfter, isValid } from 'date-fns';
import { formatInTimeZone } from '@date-fns/tz'; // timezone-aware formatting
```

Use `date-fns` functions only. Do not use `moment`, `dayjs`, or raw `Date` prototype methods for formatting.

---

## Centralize Formatters

Keep all date formatting helpers in one shared utility file (`utils/date.ts` or `lib/date.ts`). Do not inline formatting logic in components.

```ts
// utils/date.ts
import { format, formatDistanceToNowStrict } from 'date-fns';

export function formatShortDate(value: string | Date | null | undefined, fallback = 'N/A') {
  if (!value) return fallback;
  const date = typeof value === 'string' ? new Date(value) : value;
  if (!isValid(date)) return fallback;
  return format(date, 'MMM d, yyyy');
}

export function formatRelativeTime(value: string | Date | null | undefined, fallback = 'Recently') {
  if (!value) return fallback;
  const date = typeof value === 'string' ? new Date(value) : value;
  if (!isValid(date)) return fallback;
  return formatDistanceToNowStrict(date, { addSuffix: true });
}
```

---

## Parsing API Dates

API responses return ISO 8601 strings (e.g., `"2025-05-21T08:00:00.000Z"`). Parse with `new Date(isoString)`.

**Always validate after parsing:**

```ts
const date = new Date(apiValue);
if (!isValid(date)) return fallback;
```

Use `isValid(date)` from date-fns instead of `Number.isNaN(date.getTime())` — it's more readable and handles edge cases.

---

## Common Format Patterns

| Use case | Pattern | Output |
|---|---|---|
| Short date | `format(date, 'MMM d')` | `May 21` |
| Full date | `format(date, 'MMMM d, yyyy')` | `May 21, 2025` |
| Date + time | `format(date, 'MMM d, yyyy h:mm a')` | `May 21, 2025 8:00 AM` |
| Relative time | `formatDistanceToNowStrict(date, { addSuffix: true })` | `3 days ago` |
| Time only | `format(date, 'h:mm a')` | `8:00 AM` |

---

## Number Formatting

```ts
const formatter = new Intl.NumberFormat();
export function formatCount(value: number) {
  return formatter.format(value); // 1,234
}
```

Create `Intl.NumberFormat` once at module level, not inside the function. Avoid `.toLocaleString()` directly in components — locale can differ between server and client, causing hydration mismatches.

---

## Timezone-Aware Display

Use `@date-fns/tz` when displaying dates in a specific timezone rather than the user's local timezone:

```ts
import { formatInTimeZone } from '@date-fns/tz';

formatInTimeZone(date, 'Asia/Manila', 'MMM d, yyyy h:mm a');
// → "May 21, 2025 8:00 AM" in Manila time regardless of user's browser timezone
```

Use plain `date-fns` (no timezone) only for relative times or when the user's local timezone is intentional.

---

## Token / Expiry Timestamps

Store token expiry as a Unix timestamp (milliseconds), compare with `Date.now()`:

```ts
import { addMinutes, addDays } from 'date-fns';

const accessTokenExpiry = addMinutes(new Date(), 15).getTime();  // 15 min from now
const refreshTokenExpiry = addDays(new Date(), 30).getTime();     // 30 days from now

// Checking expiry
const isExpired = Date.now() > storedExpiry;
```

---

## SSR Safety

Dynamic date values are hydration-unsafe in server-rendered components. Rules:

- `Date.now()` / `new Date()` in JSX render → **unsafe** in server components, causes hydration mismatch.
- `formatDistanceToNowStrict()` in a `'use client'` component → **safe** (runs only in the browser).
- `format(date, pattern)` with a static date from props/data → **safe** in server components (deterministic).

When a relative time display causes a hydration warning, move the component to `'use client'` or defer the display with `useEffect`.

---

## Anti-Patterns

- Do not inline date formatting in JSX — always extract to a named formatter function.
- Do not use `Date.now()` or `new Date()` directly in server component render — defer to client or `useEffect`.
- Do not use `.toLocaleDateString()` / `.toLocaleTimeString()` in components — locale inconsistency causes hydration mismatches.
- Do not import `moment` or `dayjs` — use `date-fns`.
- Do not assume the API date string is always valid — always validate before formatting.

---

## Related References

- `references/nextjs-performance-seo.md` — hydration-stable rendering; why locale/timezone formatting defers to the client
- `references/browser-compatibility.md` — § 3 JavaScript and browser API watchouts (date parsing differences)
