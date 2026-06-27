# Layout & Safe Areas

## Keyboard Avoidance

- Always use `behavior="padding"` on `KeyboardAvoidingView` — both iOS and Android.
- Never use `behavior="height"` — it shrinks the container but does not scroll the focused input into view on Android, causing inputs to be hidden behind the keyboard.
- No platform branching needed: `behavior="padding"` works correctly on both platforms.

```tsx
<KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
  {children}
</KeyboardAvoidingView>
```

## Safe Areas

- Always consume safe area insets via `useSafeAreaInsets()` from `react-native-safe-area-context`.
- Never hardcode bottom spacing without including `insets.bottom`.
- Always include `insets.bottom` in bottom spacing for:
  - Custom bottom navigation bars
  - Sticky/floating action buttons
  - Bottom sheets
  - Full-screen modals
  - Scroll view content padding

```tsx
const insets = useSafeAreaInsets();

// Correct
<View style={{ paddingBottom: insets.bottom + 16 }} />

// Wrong — breaks on devices with home indicator
<View style={{ paddingBottom: 16 }} />
```

- Wrap the app root in `<SafeAreaProvider>` from `react-native-safe-area-context`.
- Use `contentInsetAdjustmentBehavior="automatic"` on `ScrollView` instead of a `<SafeAreaView>` wrapper.
