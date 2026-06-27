# Toast & Notification Design — Sonner

## Variant Visual Design

| Variant | Icon | Use |
|---|---|---|
| `toast.success()` | CircleCheck / ✓ | Completed action |
| `toast.error()` | XCircle / ✕ | Failed action |
| `toast.info()` | Info / ℹ | Neutral information |
| `toast.warning()` | TriangleAlert / ⚠ | Recoverable risk |
| `toast.loading()` | Spinner (animated) | In-progress async operation |

When using shadcn's Sonner setup, customize icons once at the `<Toaster>` component level — not per call:

```tsx
<Toaster
  icons={{
    success: <CircleCheckIcon className="size-4" />,
    error: <OctagonXIcon className="size-4" />,
    info: <InfoIcon className="size-4" />,
    warning: <TriangleAlertIcon className="size-4" />,
    loading: <Loader2Icon className="size-4 animate-spin" />,
  }}
/>
```

---

## Token Integration

Bind toast background and border to your design tokens so they adapt to light/dark mode automatically:

```tsx
<Toaster
  style={{
    '--normal-bg': 'var(--popover)',
    '--normal-text': 'var(--popover-foreground)',
    '--normal-border': 'var(--border)',
    '--border-radius': 'var(--radius)',
  } as React.CSSProperties}
/>
```

Never hardcode colors in toast call-sites — define them once at the `<Toaster>` level.

---

## Message Writing

**Success** — past tense, specific:
- ✅ "Announcement published" / "Account deleted" / "Changes saved"
- ❌ "Done" / "OK" / "Success"

**Error** — what failed and what to do:
- ✅ "Unable to upload image. Check the file size and try again."
- ❌ "Error" / "Something went wrong" (alone)

**Loading** — active verb, present continuous:
- ✅ "Uploading image..." / "Saving changes..."
- ❌ "Loading" / "Please wait"

**Info** — neutral, factual:
- ✅ "Session expires in 5 minutes. Save your work."

---

## Placement and Stacking

Sonner stacks the most recent 3 toasts by default. The `<Toaster>` should be mounted once at the app root — do not change its position unless there is an explicit UX reason (e.g., the layout has a fixed bottom bar that overlaps).

---

## Duration

- Default (~4s) is appropriate for most success/error/info toasts.
- `toast.loading()` must be dismissed manually with `toast.dismiss(id)` — never auto-dismissed.
- Do not shorten error toast duration — users need time to read the message.

---

## Loading + Dismiss Pattern

Always dismiss the loading toast in both success and error branches:

```ts
let id: string | number | undefined;

try {
  id = toast.loading('Saving changes...');
  await doAsyncWork();
  toast.dismiss(id);
  toast.success('Changes saved');
} catch (error) {
  toast.dismiss(id);
  toast.error(getErrorMessage(error, 'Save failed. Try again.'));
}
```

---

## Dark Mode

When using `next-themes`, pass `theme` from `useTheme()` to the `<Toaster>`:

```tsx
import { useTheme } from 'next-themes';
import { Toaster } from 'sonner';

function AppToaster() {
  const { theme } = useTheme();
  return <Toaster theme={theme as 'light' | 'dark' | 'system'} />;
}
```

Use CSS token overrides (see Token Integration above) rather than hardcoded colors — they automatically adapt to both modes.

---

## Anti-Patterns

- Do not fire multiple toasts for one user action.
- Do not use `toast()` (no variant) for feedback — always pick a semantic variant.
- Do not let `toast.loading()` auto-dismiss — always `toast.dismiss(id)` explicitly.
- Do not customize icons or colors per `toast.*` call — configure them once at `<Toaster>`.
- Do not use generic message text ("Error", "Done") — be specific.
