# Toast / Feedback Design

## Visual Anatomy

```
┌─────────────────────────────────────────────┐  ← rounded-xl, 0.5px border
│ Message text here, up to two lines max      │  ← 14sp semibold
└─────────────────────────────────────────────┘
  ↑ inset-x: 16dp from screen edges
  ↑ top: 56dp (below safe area status bar, ~top-14)
  ↑ z-index: above all content
```

---

## Entry / Exit Animation

Slide down + fade in on entry. Slide up + fade out on dismiss:

| Phase | Duration | Transform | Opacity |
|-------|----------|-----------|---------|
| Entry | 180ms | `translateY: -30 → 0` | `0 → 1` |
| Auto-dismiss | after 3200ms on screen | — | — |
| Exit | 180ms | `translateY: 0 → -30` | `1 → 0` |

Run with `Animated.parallel` for simultaneous transform + opacity. Always `useNativeDriver: true`.

---

## Palette by Type

Each type uses three semantic tokens — background, border, text:

| Type | Visual feel | When to use |
|------|------------|-------------|
| `error` | Warm red tint | Mutation failure, validation error, permission denied |
| `success` | Green tint | Saved, submitted, completed |
| `info` | Blue/neutral tint | Non-critical state change, settings reminder |

All three values come from `useThemeColors()`. Never hardcode hex values in the toast component.

---

## Positioning

```
Screen edge
├── 16dp margin ──────────────────────── 16dp margin ┤
│            Toast container                         │
└───────────────────────────────────────────────────┘
         ↑ top: 56dp (safe-area-aware)
```

Position as `position: absolute`, `inset-x: 16`, `top: 56` (adjust if a persistent header is shown). The toast sits above all other content via `z-index: 50`.

---

## Dark Mode

Toast colors invert automatically when tokens are correctly defined. Specific dark mode notes:

- Backgrounds: slightly higher elevation than the page background — dark-surfaceEl2 level
- Borders: 0.5px, subtle — the border should not dominate the component
- Text: full contrast against the toast background (not reduced opacity)

---

## Accessibility

```tsx
<Animated.View
  accessibilityLiveRegion="polite"
  accessibilityRole="alert"
  ...
>
```

`"polite"` queues the announcement without interrupting currently spoken content. For critical errors consider `"assertive"` — but use sparingly.

---

## Message Writing

| Type | Structure | Example |
|------|-----------|---------|
| Error | What failed + implicit next step | "Could not save changes. Please try again." |
| Success | What completed | "Request submitted successfully." |
| Info | Neutral state change | "Notifications are turned off." |

Keep messages to one sentence, sentence case, no trailing punctuation for success. Maximum ~60 characters to avoid wrapping.

---

## Rules

- Mount `ToastHost` once at the root layout — not per screen
- `accessibilityRole="alert"` is required on the animated container
- Dismiss automatically — never require user interaction to close a toast
- Do not show a toast during navigation — the toast disappears before the user sees it
- One toast at a time — if two fire in quick succession, the second replaces the first
- Error toasts must not be used for info/success messages — semantic misuse trains users to ignore them
