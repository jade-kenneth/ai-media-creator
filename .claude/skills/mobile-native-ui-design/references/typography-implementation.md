# Typography Implementation

## NativeWind + RN Text Mapping

The type scale is defined in `mobile-native-ui-design` SKILL.md. This reference covers the implementation: how to express those tokens using NativeWind utility classes on React Native `Text` components.

---

## Class Patterns

Map the semantic scale to NativeWind + inline `style` for color (never hardcode):

| Token | NativeWind | Weight class | Use for |
|-------|-----------|--------------|---------|
| display | `text-2xl` | `font-extrabold` | Hero headings |
| title1 | `text-xl` | `font-bold` | Screen titles |
| title2 | `text-lg` | `font-bold` | Section headings |
| headline | `text-base` | `font-bold` | Card titles, labels |
| body | `text-base` | `font-normal` | Body content |
| callout | `text-sm` | `font-normal` | Supporting text |
| caption | `text-xs` | `font-normal` | Timestamps, metadata |
| micro | `text-[11px]` | `font-semibold` | Badges, chips |

```tsx
// Screen title
<Text className="text-xl font-bold" style={{ color: colors.bodyText }}>
  My Documents
</Text>

// Card body
<Text className="text-base" style={{ color: colors.bodyText }}>
  {description}
</Text>

// Caption / metadata
<Text className="text-xs" style={{ color: colors.mutedText }}>
  Published Jan 5, 2025
</Text>
```

---

## Color Rules

Never use NativeWind color utilities on `Text` — always use inline `style` with `useThemeColors()`:

```tsx
// ✓ Correct
<Text className="text-sm font-semibold" style={{ color: colors.bodyText }}>

// ✗ Wrong — hardcoded, breaks dark mode
<Text className="text-sm font-semibold text-gray-800">
```

| Role | Token |
|------|-------|
| Primary readable text | `colors.bodyText` |
| Secondary / supporting | `colors.mutedText` |
| Error messages | `colors.error` |
| Brand / accent text | `colors.brand` |
| Placeholder / hint | `colors.mutedText` (with reduced opacity if needed) |

---

## Line Height

React Native does not inherit `lineHeight` automatically. Set it explicitly on any multi-line text:

```tsx
<Text
  className="text-base"
  style={{ color: colors.bodyText, lineHeight: 24 }}
  numberOfLines={3}
>
```

Recommended line heights:

| Font size | Line height |
|-----------|-------------|
| 11px | 16 |
| 12px (text-xs) | 18 |
| 14px (text-sm) | 20 |
| 15–16px (text-base) | 24 |
| 18–19px (text-lg) | 28 |
| 20–22px (text-xl/2xl) | 30 |

---

## Font Scaling (Dynamic Type / Accessibility)

React Native scales text automatically with OS font size settings. Allow scaling on all text. Cap only tab bar labels and badge counts to prevent layout breakage:

```tsx
// Allow scaling (default)
<Text className="text-base">Body text</Text>

// Cap for UI chrome elements only
<Text className="text-xs" maxFontSizeMultiplier={1.3}>
  TAB LABEL
</Text>
```

Test at 200% font scale on both platforms before shipping.

---

## Tabular Numbers

For numeric counters (counts, statistics, timestamps) that change value, use tabular numerals to prevent layout jitter:

```tsx
<Text
  className="text-base font-semibold"
  style={{ color: colors.bodyText, fontVariant: ['tabular-nums'] }}
>
  {count}
</Text>
```

---

## Selectable Text

Make data that users may want to copy selectable:

```tsx
<Text selectable className="text-sm" style={{ color: colors.bodyText }}>
  {referenceNumber}
</Text>
```

Error messages should also be selectable so users can copy them for support.

---

## Truncation

```tsx
// Single line, ellipsis
<Text className="text-base font-semibold" numberOfLines={1} ellipsizeMode="tail">
  {title}
</Text>

// Two-line clamp
<Text className="text-sm" numberOfLines={2} ellipsizeMode="tail">
  {description}
</Text>
```

Always pair `numberOfLines` with `ellipsizeMode="tail"`. Never use `flex: 1` on the Text itself — put it on the parent `View`.

---

## Hierarchy on a Screen

Use at most 3 size levels per screen. Increase weight before increasing size:

```
Screen title:    text-xl font-bold       (display/title1)
Section header:  text-base font-semibold (headline)
Body content:    text-sm                 (callout)
Metadata:        text-xs                 (caption)
```

Avoid more than two weight levels in a single component — it creates visual noise.

---

## Rules

- Never hardcode color values in `className` — always use inline `style` with `useThemeColors()`
- Set `lineHeight` explicitly on all multi-line text
- Use `fontVariant: ['tabular-nums']` on all numeric values that update dynamically
- Allow font scaling on all text except UI chrome (tab labels, badge counts)
- Never use `Text` directly for a heading — give it an `accessibilityRole="header"` when it functions as a section heading
- `selectable` prop on error messages and reference numbers
