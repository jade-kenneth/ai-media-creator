# Error Handling

## Layers

```
ErrorBoundary (class component)   ← catches render errors, shows error screen
    ↓
Screen-level error state          ← query `isError` + retry button
    ↓
Inline error UI                   ← field errors, validation, inline banners
    ↓
showToast({ type: 'error' })      ← transient feedback for mutation failures
```

---

## ErrorBoundary Component

Use a class-based `ErrorBoundary` at layout and screen level. React does not support function component error boundaries:

```tsx
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <ErrorScreen />;
    }
    return this.props.children;
  }
}
```

Wrap each major section (tab, feature) in its own `ErrorBoundary` so one crash does not take down the whole app.

---

## Screen-Level Error State

When a query fails, show an inline error state with a retry action. Do not use a full-screen error for data that is secondary to the screen:

```tsx
function MyScreen() {
  const { data, isLoading, isError, refetch } = useMyQuery();

  if (isLoading) return <LoadingSkeleton />;

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center gap-4 p-6">
        <MaterialIcons name="error-outline" size={48} color={colors.error} />
        <Text style={{ color: colors.bodyText }} className="text-base font-semibold">
          Something went wrong
        </Text>
        <Text style={{ color: colors.mutedText }} className="text-sm text-center">
          We could not load this content.
        </Text>
        <Pressable onPress={() => refetch()} className="rounded-xl px-6 py-3" style={{ backgroundColor: colors.brand }}>
          <Text style={{ color: colors.white }} className="text-sm font-semibold">Try Again</Text>
        </Pressable>
      </View>
    );
  }

  return <MyContent data={data} />;
}
```

---

## ErrorScreen Component

A full-screen error component for unrecoverable states (e.g. `ErrorBoundary` fallback, network-level failures):

```tsx
export function ErrorScreen({ onRetry }: { onRetry?: () => void }) {
  const colors = useThemeColors();
  return (
    <SafeAreaView className="flex-1 items-center justify-center gap-4 p-6">
      <MaterialIcons name="error-outline" size={64} color={colors.error} />
      <Text className="text-lg font-bold text-center" style={{ color: colors.bodyText }}>
        Something went wrong
      </Text>
      {onRetry && (
        <Pressable onPress={onRetry} className="rounded-xl px-6 py-3" style={{ backgroundColor: colors.brand }}>
          <Text className="text-sm font-semibold" style={{ color: colors.white }}>Retry</Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}
```

---

## Mutation Error Handling

Bridge `GraphqlRequestResult` errors to `showToast` in `onError`:

```ts
const mutation = useMyMutation({
  onError: (error) => {
    showToast({
      type: 'error',
      message: explainGraphqlErrorMessage(error, 'Something went wrong. Please try again.'),
    });
  },
  onSuccess: () => {
    showToast({ type: 'success', message: 'Saved successfully.' });
  },
});
```

Use `suppressGlobalErrorToast: true` on the `defineMutation` config when you handle errors inline (e.g. form validation errors returned from the server).

---

## Error Display Rules

| Error type | Where to show |
|------------|--------------|
| Mutation failure | `showToast({ type: 'error' })` |
| Query failure | Inline error state with retry |
| Form validation | Field-level error message below input |
| Auth / session expired | Handled by `withAuthGuard` (redirect) |
| Render crash | `ErrorBoundary` fallback |
| Network offline | `NetworkErrorBanner` (auto-showing) |

---

## GraphQL Error Messages

```ts
import { explainGraphqlErrorMessage } from '@/react-query/graphql-error';

// In onError:
const message = explainGraphqlErrorMessage(error, 'Something went wrong');
```

`explainGraphqlErrorMessage` maps known `GraphqlRequestErrorName` values to human-readable sentences. Always pass a fallback as the second argument.

---

## Rules

- Never swallow errors silently — always show feedback or log a warning
- Use `ErrorBoundary` at feature boundaries, not around individual components
- Screen-level query errors show inline with a retry button — not a toast
- Mutation errors show as a toast — not an inline banner (unless the error targets a specific field)
- Do not show raw error messages from the server to users — always pass through `explainGraphqlErrorMessage`
- `console.warn` for recoverable errors (push registration, badge updates, read-sync); `console.error` for unexpected crashes
