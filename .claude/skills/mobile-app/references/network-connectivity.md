# Network Connectivity

## Library

Use `@react-native-community/netinfo` for offline detection. Import the default export:

```ts
import NetInfo from '@react-native-community/netinfo';
```

---

## Subscribing to Connectivity State

`NetInfo.addEventListener` is the primary API. It fires immediately with the current state and on every change:

```ts
useEffect(() => {
  const unsubscribe = NetInfo.addEventListener((state) => {
    const offline = state.isConnected === false;
    setIsOffline(offline);
    // animate banner in/out
  });

  return unsubscribe; // cleanup on unmount
}, []);
```

`state.isConnected` can be `null` (unknown), `true`, or `false`. Treat `null` as online to avoid false positives.

---

## NetworkErrorBanner

A non-blocking banner mounted once at the app root, above all content. Shows when offline, hides when reconnected:

```tsx
<Animated.View
  accessibilityLiveRegion="polite"
  accessibilityRole="alert"
  style={{ opacity }}
  className="absolute inset-x-0 top-0 z-50"
>
  <View className="px-4 py-2.5" style={{ backgroundColor: colors.error }}>
    <Text className="text-center text-sm font-semibold" style={{ color: colors.cardBg }}>
      No internet connection
    </Text>
  </View>
</Animated.View>
```

Use `Animated.timing` with `useNativeDriver: true` for the opacity transition (300ms). Return `null` when offline is `false` to skip the view entirely from the render tree.

---

## TanStack Query Integration

TanStack Query retries failed queries automatically. When the device comes back online `refetchOnReconnect: true` (the default) causes stale queries to refetch. No additional setup is needed — the NetInfo banner is purely visual feedback.

For features that need explicit reconnect behavior:

```ts
const queryClient = useQueryClient();

useEffect(() => {
  const unsubscribe = NetInfo.addEventListener((state) => {
    if (state.isConnected === true) {
      void queryClient.refetchQueries({ type: 'active', stale: true });
    }
  });
  return unsubscribe;
}, [queryClient]);
```

Only do this if the default `refetchOnReconnect` behavior is not sufficient.

---

## One-Shot Connectivity Check

For imperative checks before a mutation (e.g. file upload):

```ts
const state = await NetInfo.fetch();
if (!state.isConnected) {
  showToast({ type: 'error', message: 'No internet connection. Please try again.' });
  return;
}
```

---

## Rules

- Mount `NetworkErrorBanner` once at the root layout — not per-screen
- Check `state.isConnected === false` explicitly — do not use `!state.isConnected` (null is truthy-ish)
- Never block navigation or mutations just because of offline state — let TanStack Query retry handle it
- Always unsubscribe `NetInfo.addEventListener` in `useEffect` cleanup
- Use `useNativeDriver: true` on all Animated transitions in the banner
- Banner colors must come from `useThemeColors()` — no hardcoded hex
