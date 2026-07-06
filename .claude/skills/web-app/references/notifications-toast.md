# Notifications & Toast — Sonner

## Setup

Mount `<Toaster>` once at the app root (inside the root layout or app providers). Never add a second instance.

```tsx
// app/layout.tsx or providers/app-providers.tsx
import { Toaster } from 'sonner';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster richColors />
      </body>
    </html>
  );
}
```

---

## Import

```ts
import { toast } from 'sonner';
```

---

## Variants

```ts
// Success — completed action
toast.success('Official created successfully');

// Error — failed action
toast.error('Unable to save. Please try again.');

// Loading — in-progress async operation
const id = toast.loading('Uploading image...');
// ... on complete:
toast.dismiss(id);
toast.success('Image uploaded');

// Info — neutral information
toast.info('Changes saved as draft');

// Warning — recoverable risk
toast.warning('Session expiring soon. Save your work.');
```

---

## Where to Call toast.*

Call `toast.*` only inside:
- Mutation `onSuccess` / `onError` callbacks
- Form submit handlers (after `mutateAsync` resolves/rejects)
- Explicit user action handlers

Never call `toast.*` in `useEffect`, render functions, or query `onError` callbacks (those fire on background refetch failures too).

---

## Error Message Pattern

Extract a human-readable message from the error before passing it to `toast.error`:

```ts
function getErrorMessage(error: unknown, fallback = 'Something went wrong. Try again.') {
  if (error instanceof Error) return error.message || fallback;
  return fallback;
}

try {
  await mutation.mutateAsync(values);
  toast.success('Record saved');
} catch (error) {
  toast.error(getErrorMessage(error, 'Unable to save. Try again.'));
}
```

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

## Message Writing

**Success** — past tense, specific action:
- ✅ "Announcement published" / "Account deleted"
- ❌ "Done" / "OK" / "Success"

**Error** — what failed, what to do:
- ✅ "Unable to upload image. Check the file size and try again."
- ❌ "Error" / "Something went wrong" (alone)

**Loading** — active verb in present continuous:
- ✅ "Uploading image..." / "Saving changes..."
- ❌ "Loading" / "Please wait"

---

## Customizing the Toaster

```tsx
<Toaster
  theme="system"            // 'light' | 'dark' | 'system'
  position="bottom-right"  // default
  richColors               // semantic colors per variant
  expand                   // stacked vs expanded
/>
```

Integrate with `next-themes`:

```tsx
import { useTheme } from 'next-themes';

function AppToaster() {
  const { theme } = useTheme();
  return <Toaster theme={theme as 'light' | 'dark' | 'system'} richColors />;
}
```

---

## Anti-Patterns

- Do not call `toast.*` in `useEffect`.
- Do not fire multiple toasts for one user action.
- Do not use `toast()` without a variant for action feedback — always pick `success`, `error`, `info`, or `warning`.
- Do not let `toast.loading()` auto-dismiss — always `toast.dismiss(id)` explicitly.
- Do not pass raw error objects or stack traces to the toast message.

---

## Related References

- `references/error-boundaries.md` — boundary vs toast decision for error surfacing
- `references/caching.md` — the mutation lifecycle where success/error toasts fire
- `references/graphql-patterns.md` — error names to map into user-facing messages
