# Toast / Feedback

## Pattern

The mobile app uses a **pub-sub toast** — no external library. Two exports:

```ts
export function showToast(payload: { message: string; type?: 'error' | 'success' | 'info' }): void
export function ToastHost(): React.ReactElement | null
```

`showToast` is callable from anywhere (event handlers, mutation callbacks, utility functions) — no React context required. `ToastHost` is the single rendering site; mount it once at the app root.

---

## showToast

```ts
type ToastListener = (payload: ToastPayload) => void;
const listeners = new Set<ToastListener>();

export function showToast(payload: ToastPayload) {
  listeners.forEach((listener) => listener(payload));
}
```

Dispatches to all registered listeners. Listeners self-register inside `ToastHost` via a `subscribe` helper on mount.

---

## ToastHost

Mount once at the root layout, above all screen content:

```tsx
<SafeAreaProvider>
  <ToastHost />   {/* ← here */}
  <Stack />
</SafeAreaProvider>
```

Internally uses `Animated.Value` for slide+fade:

```ts
const translateY = useRef(new Animated.Value(-30)).current;
const opacity = useRef(new Animated.Value(0)).current;
```

On each toast:
1. `fadeIn` — parallel `opacity 0→1` + `translateY -30→0`, 180ms
2. After 3200ms — `fadeOut` — parallel `opacity 1→0` + `translateY 0→-30`, 180ms
3. On `finished`, clear state

Always use `useNativeDriver: true` on both Animated values.

Positioned absolutely:
```tsx
className="absolute inset-x-4 top-14 z-50"
```

---

## Palette by Type

Map `type` to three theme color tokens per variant:

| Type | Background | Border | Text |
|------|-----------|--------|------|
| `error` | `colors.errorBg` | `colors.errorBorder` | `colors.error` |
| `success` | `colors.successBg` | `colors.successBorder` | `colors.successText` |
| `info` | `colors.infoBg` | `colors.infoBorder` | `colors.infoText` |

Never use hardcoded hex. Always read from `useThemeColors()`.

---

## Call Sites

```ts
// Mutation error
onError: (error) => {
  showToast({ type: 'error', message: explainGraphqlErrorMessage(error, 'Something went wrong') });
},

// Success confirmation
onSuccess: () => {
  showToast({ type: 'success', message: 'Changes saved.' });
},

// Non-critical info
showToast({ type: 'info', message: 'Notifications stayed off.' });
```

Default type is `'error'` when omitted.

---

## Accessibility

```tsx
<Animated.View
  accessibilityLiveRegion="polite"
  accessibilityRole="alert"
  ...
>
```

`accessibilityLiveRegion="polite"` causes screen readers to announce the message when it appears without interrupting current speech.

---

## Rules

- Mount `ToastHost` once — multiple instances cause duplicate toasts
- Call `showToast` from mutation callbacks, not from JSX render paths
- Never use `type: 'error'` for non-error info — it trains users to ignore red toasts
- Keep messages short: one sentence, no trailing periods for status messages
- Do not show a toast and navigate simultaneously — pick one; toasts disappear before the user can read them during navigation
- All toast colors must come from `useThemeColors()` — hardcoded colors break dark mode
