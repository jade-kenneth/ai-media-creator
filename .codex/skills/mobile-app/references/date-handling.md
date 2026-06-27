# Date Handling

## Library

Use `date-fns` for all date formatting and manipulation. Do not use `moment`, `dayjs`, or `Intl.DateTimeFormat` for formatting — keep one library.

```ts
import { format, isAfter, addDays, addMinutes } from 'date-fns';
```

---

## Centralized Formatters

Define all date formatters in one utility file (e.g. `utils/date.ts`). Never call `format()` directly in components — use the named formatter:

```ts
export function formatFullDate(dateValue: string | null | undefined): string {
  if (!dateValue) return 'Unknown date';

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'Unknown date';

  return format(date, 'MMMM d, yyyy · h:mm a');
}

export function formatShortDate(dateValue: string | null | undefined): string {
  if (!dateValue) return '—';

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '—';

  return format(date, 'MMMM d, yyyy');
}

export function formatScheduleDate(dateValue: string): string {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'TBD';
  return format(date, 'MMM d');
}
```

---

## Validation Pattern

Always validate before formatting. Use `Number.isNaN(date.getTime())` — do not use `isValid()` from date-fns because `new Date(null)` returns epoch (valid) while `new Date(undefined)` returns Invalid Date:

```ts
const date = new Date(dateValue);
if (Number.isNaN(date.getTime())) {
  // invalid — return fallback
}
```

---

## Fallback Values by Context

| Context | Fallback |
|---------|----------|
| Missing date on a record | `'—'` (em dash) |
| Date field required but null | `'Unknown date'` |
| Schedule / TBD date | `'TBD'` |
| Date unavailable from server | `'Date unavailable'` |

Keep fallbacks consistent across the app. Define them as constants if used in more than one formatter.

---

## Token Expiry with date-fns

For expiry calculations in the auth store use `addMinutes` and `addDays`:

```ts
import { addMinutes, addDays, isAfter } from 'date-fns';

// Write expiry
const expiresAt = addMinutes(new Date(), 15).getTime(); // ms timestamp

// Read check
if (isAfter(new Date(storedTimestamp), new Date())) {
  // still valid
}
```

---

## Intl.NumberFormat for Counts

For numeric formatting (counts, statistics) use `Intl.NumberFormat` — not date-fns:

```ts
const numberFormatter = new Intl.NumberFormat();

export function formatCount(value: number): string {
  return numberFormatter.format(value);
}
```

Initialize the formatter once at module level, not inside a component or function.

---

## Format Tokens Reference

| Pattern | Result | Use for |
|---------|--------|---------|
| `'MMMM d, yyyy'` | January 5, 2025 | Full dates, forms |
| `'MMMM d, yyyy · h:mm a'` | January 5, 2025 · 2:30 PM | Timestamps with time |
| `'MMM d'` | Jan 5 | Compact schedules |
| `'MMM d, yyyy'` | Jan 5, 2025 | Medium length |

---

## Rules

- All formatting goes through named functions in `utils/date.ts` — not inline `format()` calls
- Always validate with `Number.isNaN(date.getTime())` before formatting
- Never return raw ISO strings to the UI — always format
- Do not import date-fns inside component files — import the project's formatter functions
- `Intl.DateTimeFormat` is acceptable only for locale detection (e.g. `new Intl.DateTimeFormat().resolvedOptions().locale`) — not for formatting dates in the UI
