# Date Picker Field Design

## Pattern

The native date picker uses a `Pressable` trigger that opens the platform picker. Never use a text input for date entry — always use the native picker to ensure locale-correct formatting and a familiar interaction.

---

## Visual States

```
Default (no value selected):
┌─────────────────────────────────────┐  ← rounded-2xl, border-width: 0.5
│  Select date                        │  ← mutedText color (placeholder)
└─────────────────────────────────────┘
  min-height: 48dp

Value selected:
┌─────────────────────────────────────┐  ← rounded-2xl, border
│  January 5, 2025                    │  ← bodyText color
└─────────────────────────────────────┘

Error state:
┌─────────────────────────────────────┐  ← borderColor: colors.error
│  January 5, 2025                    │
└─────────────────────────────────────┘
  Date of birth is required           ← error text below, colors.error

Pressed:
  opacity: 0.7 (Pressable default) OR scale: 0.98 (spring press)
```

---

## Layout

```
┌─────────────────────────────────────┐
│ Label text                          │   text-sm font-medium, bodyText
├─────────────────────────────────────┤
│  [ Trigger Pressable              ] │   min-h-12, rounded-2xl, px-4
├─────────────────────────────────────┤
│  Error message (if any)             │   text-sm, error color
└─────────────────────────────────────┘
```

Consistent with other form fields: label above, error below.

---

## Platform Behavior

**iOS**: `display="default"` shows an inline spinner wheel. The picker stays visible until the user picks a value. The `onChange` callback fires on every value change (not just on confirmation), so only call `onChange(nextValue)` when `event.type === 'set'` and close immediately.

**Android**: `display="default"` shows a modal calendar dialog. The dialog handles its own open/close — `setIsOpen(false)` in `onChange` ensures state is cleaned up.

---

## Dark Mode

The `DateTimePicker` component renders with native OS colors and adapts to the device's appearance mode automatically. No custom styling is needed for the picker itself.

The trigger `Pressable` uses:
- `backgroundColor: colors.cardBg`
- `borderColor: error ? colors.error : colors.border`
- `borderWidth: 0.5`

---

## Accessibility

The trigger `Pressable` must have:

```tsx
accessibilityRole="button"
accessibilityLabel={`${label}, ${value ? format(value, 'MMMM d, yyyy') : 'not selected'}`}
accessibilityHint="Opens a date picker"
```

The label announces the current value so screen reader users hear "Date of Birth, January 5, 2025" and understand what the button does without reading surrounding text.

---

## Touch Target

`min-h-12` (48dp) ensures the trigger meets the minimum touch target. Never make the trigger smaller — users miss it on small screen sizes.

---

## Typography Inside the Trigger

| State | Text | Style |
|-------|------|-------|
| No value | Placeholder text | `text-base`, `colors.mutedText` |
| Value selected | Formatted date | `text-base`, `colors.bodyText` |

Use `format(value, 'MMMM d, yyyy')` for consistency with other date displays in the app.

---

## Rules

- Trigger border width is `0.5` — matches other input fields in the app
- Label is `text-sm font-medium` — not bold, consistent with form field labels
- Error text is `text-sm`, selectable, uses `colors.error`
- `DateTimePicker` renders conditionally — only when `isOpen` is `true`
- Fallback `value` prop (e.g. `new Date(2000, 0, 1)`) prevents native picker crash on null
- Never style the native `DateTimePicker` component itself — it renders with platform defaults
