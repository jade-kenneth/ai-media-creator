# Icons

## Icon Library — Non-Negotiable

This project uses **`MaterialIcons` from `@expo/vector-icons`** as the primary icon library. It works identically on iOS and Android.

Do not introduce a new icon library. Do not use FontAwesome, Ionicons, Feather, or any other icon set. Do not use `expo-symbols` / SF Symbols unless building an iOS-exclusive native feature that genuinely requires it.

```tsx
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

<MaterialIcons name="home" size={24} color={themeColors.bodyText} />;
```

---

## Dark Mode — Non-Negotiable

**Every icon must support both light and dark mode. Hardcoded color values on icons are a blocker.**

### The rule

Always source icon color from `useThemeColors()`. Never pass a hardcoded hex, `'black'`, `'white'`, or `'#1a1f5e'` as the icon `color` prop.

```tsx
// ✅ Correct
const themeColors = useThemeColors();
<MaterialIcons name="notifications" size={24} color={themeColors.bodyText} />

// ✅ Correct — secondary/muted hierarchy
<MaterialIcons name="info" size={20} color={themeColors.secondaryText} />

// ❌ Wrong — hardcoded color breaks dark mode
<MaterialIcons name="home" size={24} color="#1a1f5e" />
<MaterialIcons name="close" size={20} color="black" />
```

### Color token selection for icons

| Icon role                       | Token                            |
| ------------------------------- | -------------------------------- |
| Primary action / prominent icon | `themeColors.bodyText`           |
| Secondary / supporting icon     | `themeColors.secondaryText`      |
| Placeholder / disabled / muted  | `themeColors.mutedText`          |
| Success state                   | `themeColors.successText`        |
| Warning state                   | `themeColors.warningText`        |
| Error / destructive state       | `themeColors.error`              |
| Info state                      | `themeColors.infoText`           |
| Brand / interactive element     | `themeColors.primaryInteractive` |
| Accent / highlight              | `colors.accent`                  |

Import `useThemeColors` and `colors`:

```tsx
import { useThemeColors } from '@/hooks/use-theme-colors';
import { colors } from '@/theme/colors';
```

---

## Basic Usage

```tsx
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useThemeColors } from '@/hooks/use-theme-colors';

function MyComponent() {
  const themeColors = useThemeColors();

  return <MaterialIcons name="star" size={24} color={themeColors.bodyText} />;
}
```

### Props

```tsx
<MaterialIcons
  name="star"           // Material icon name (required)
  size={24}            // Width and height in dp
  color={themeColors.bodyText}  // ALWAYS from useThemeColors()
  style={...}          // Standard RN style props
/>
```

---

## Common Icons

### Navigation & Actions

- `home` / `home-filled` — home (use filled for active tab)
- `settings` — settings
- `search` — search
- `add` / `add-circle` — add
- `close` — close/dismiss
- `chevron-left` / `chevron-right` — directional nav
- `arrow-back` / `arrow-forward` — back/forward
- `menu` — hamburger menu
- `more-vert` / `more-horiz` — overflow menu

### Content & Documents

- `description` — document/request
- `folder` / `folder-open` — folder
- `download` / `upload` — file transfer
- `edit` / `edit-note` — edit
- `delete` / `delete-outline` — delete
- `content-copy` — copy
- `share` — share
- `print` — print
- `attach-file` — attachment
- `link` — link

### People & Community

- `person` / `person-outline` — profile
- `groups` — group/community
- `group-add` — add people
- `badge` — official/verified

### Status & Feedback

- `check-circle` — success/done (use `successText` token)
- `cancel` / `error` — error/failed (use `error` token)
- `warning` / `warning-amber` — warning (use `warningText` token)
- `info` — info (use `infoText` token)
- `help` / `help-outline` — help/question
- `notifications` / `notifications-none` / `notifications-active` — alerts

### Media

- `photo-library` — gallery/photos
- `photo-camera` — camera
- `image` — image
- `videocam` — video
- `mic` / `mic-off` — microphone
- `volume-up` / `volume-off` — volume
- `play-arrow` / `pause` / `stop` — playback

### Communication

- `mail` / `mail-outline` — email
- `phone` / `phone-outlined` — phone
- `chat` / `chat-bubble-outline` — message
- `announcement` — announcement/broadcast

### Location & Time

- `location-on` / `location-off` — location
- `map` — map
- `place` — place pin
- `schedule` / `access-time` — time
- `calendar-today` / `event` — calendar
- `today` — today

### Misc

- `refresh` — refresh/reload
- `filter-list` — filters
- `sort` — sort
- `bookmark` / `bookmark-border` — bookmark
- `star` / `star-border` — favorite
- `favorite` / `favorite-border` — like
- `visibility` / `visibility-off` — show/hide
- `lock` / `lock-open` — secure/locked
- `qr-code` / `qr-code-scanner` — QR code

---

## Active / Inactive Icon Pattern

For toggle states (tabs, favorites, bookmarks), pair a filled and outline variant:

```tsx
<MaterialIcons
  name={isActive ? 'bookmark' : 'bookmark-border'}
  size={24}
  color={isActive ? colors.accent : themeColors.secondaryText}
/>
```

---

## Sizes

Use consistent sizes across the app:

| Context                   | Size |
| ------------------------- | ---- |
| Tab bar icons             | 24   |
| Inline content icons      | 20   |
| Small/label icons         | 16   |
| Large feature/hero icons  | 32   |
| Empty state illustrations | 48+  |

---

## Touch Targets

Icon buttons must have a minimum 44×44pt tappable area. Pad with `Pressable` or `TouchableOpacity`:

```tsx
<Pressable
  onPress={onPress}
  style={{ padding: 10 }} // 24dp icon + 10dp padding = 44dp target
  hitSlop={4}
>
  <MaterialIcons name="close" size={24} color={themeColors.bodyText} />
</Pressable>
```

---

## Anti-Patterns — All Are Blockers

| Anti-pattern                                          | Fix                                     |
| ----------------------------------------------------- | --------------------------------------- |
| `color="#1a1f5e"` (hardcoded)                         | Use `themeColors.bodyText`              |
| `color="black"` or `color="white"`                    | Use `themeColors.bodyText`              |
| `color={isDark ? '#fff' : '#000'}` (manual branching) | Use `themeColors.bodyText` directly     |
| Using Ionicons, FontAwesome, or Feather icons         | Use MaterialIcons                       |
| Importing `expo-symbols` for cross-platform UI        | Use MaterialIcons                       |
| Icon button without a 44pt touch target               | Wrap in `Pressable` with padding        |
| Icon without accessible label                         | Add `accessibilityLabel` to the wrapper |

---

## Accessibility

Always provide an accessible name on interactive icon elements:

```tsx
<Pressable
  accessibilityLabel="Close dialog"
  accessibilityRole="button"
  onPress={onClose}
  style={{ padding: 10 }}
>
  <MaterialIcons name="close" size={24} color={themeColors.bodyText} />
</Pressable>
```

Use a human action description, not the icon name ("Close dialog" not "close icon").

---

## SF Symbols — iOS Only (Restricted Use)

`expo-symbols` / `SymbolView` is allowed **only** when:

1. The feature is iOS-exclusive (`.ios.tsx` file)
2. The symbol is not available in MaterialIcons AND the visual difference matters for platform feel

When used, still source tint color from `useThemeColors()`:

```tsx
// .ios.tsx only
import { SymbolView } from 'expo-symbols';
import { useThemeColors } from '@/hooks/use-theme-colors';

const themeColors = useThemeColors();
<SymbolView
  name="square.and.arrow.down"
  tintColor={themeColors.bodyText}
  resizeMode="scaleAspectFit"
  style={{ width: 24, height: 24 }}
/>;
```

Never use `PlatformColor('label')` — it bypasses the app's theme token system.
