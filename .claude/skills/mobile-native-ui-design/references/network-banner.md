# Network Error Banner Design

## Purpose

A non-blocking persistent banner that appears when the device loses internet connectivity and disappears when it reconnects. It does not interrupt the user's flow — it overlays at the top edge of the screen.

---

## Visual Anatomy

```
┌─────────────────────────────────────────────────┐  ← full screen width
│         No internet connection                  │  ← text-sm, font-semibold, centered
└─────────────────────────────────────────────────┘
  ↑ position: absolute, top: 0, inset-x: 0
  ↑ z-index: 50 (above all content, below modals)
  ↑ padding: py-2.5, px-4
```

---

## Colors

| Context    | Background                                                       | Text                    |
| ---------- | ---------------------------------------------------------------- | ----------------------- |
| Light mode | `colors.error`                                                   | `colors.cardBg` (white) |
| Dark mode  | `rgba(204, 51, 51, 0.88)` or `colors.error` with reduced opacity | `colors.cardBg`         |

Dark mode uses a slightly translucent error background so it does not feel like an opaque wall across the top of the screen. Adjust alpha to match the product's dark surface depth.

---

## Animation

Fade in when offline, fade out when reconnected:

| Event        | Duration | Opacity |
| ------------ | -------- | ------- |
| Goes offline | 300ms    | `0 → 1` |
| Reconnects   | 300ms    | `1 → 0` |

Use `Animated.timing` with `useNativeDriver: true`. Run on every `NetInfo.addEventListener` state change.

Return `null` from the component when `isOffline` is `false` — remove from render tree completely when not needed.

---

## Positioning

```tsx
<Animated.View style={{ opacity }} className="absolute inset-x-0 top-0 z-50">
  <View className="px-4 py-2.5" style={{ backgroundColor: errorBgColor }}>
    <Text
      className="text-center text-sm font-semibold"
      style={{ color: colors.cardBg }}
    >
      No internet connection
    </Text>
  </View>
</Animated.View>
```

The banner sits at `top-0` — above the safe area, at the very top of the screen. This is intentional: it mimics the system-level "No Internet" indicator that users already recognize.

---

## Accessibility

```tsx
<Animated.View
  accessibilityLiveRegion="polite"
  accessibilityRole="alert"
  ...
>
```

`accessibilityLiveRegion="polite"` causes VoiceOver / TalkBack to announce "No internet connection" when the banner appears, without interrupting ongoing speech.

---

## Copy

Use exactly: **"No internet connection"**

- Short, factual, no blame
- No exclamation marks
- No call-to-action (the user cannot fix this from the app)
- Do not say "offline" — "No internet connection" is more descriptive

---

## Mount Point

Mount once at the root layout, above the navigator:

```tsx
<View className="flex-1">
  <NetworkErrorBanner /> {/* ← mounted here, absolute positioning */}
  <Stack />
</View>
```

Never mount per-screen — a single instance handles all screens.

---

## Rules

- `position: absolute` with `top: 0` — the banner overlays content, it does not push it down
- `z-index: 50` places it above content but below modals and bottom sheets
- Return `null` when online — do not leave an invisible zero-height view
- Banner animation uses `useNativeDriver: true` — no JS thread involvement
- Do not add a close/dismiss button — it should auto-hide on reconnect
- Never show the banner during initial app load — only after the first connectivity state resolves to offline
