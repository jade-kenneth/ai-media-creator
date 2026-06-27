# Mobile Design Standard (React Native)
**Write Once, Feel Native (iOS + Android)**

---

## Goal

Build a single React Native codebase that:
- Shares **logic, layout, and design system**
- Feels **natural on iOS**
- Feels **Material-consistent on Android**

> Rule: **80–90% shared, 10–20% platform-aware**

---

## Core Principles

### 1. Shared First, Platform Second
Always default to shared implementation.

Only use platform-specific logic when:
- Interaction feels wrong
- UX pattern is clearly different
- Native expectation matters (navigation, feedback, sheets)

### 2. Platform Awareness > Platform Duplication
Do NOT create separate screens unless necessary.

✅ Good: Shared screen + platform-aware components
❌ Bad: `HomeScreen.ios.tsx` + `HomeScreen.android.tsx` (avoid unless required)

### 3. Native Feel Comes From Details
Focus on: press feedback, spacing density, navigation behavior, motion, component shape.

---

## Design System

### Tokens (Shared but Adaptive)

```ts
import { Platform } from 'react-native';

export const spacing = {
  sm: Platform.select({ ios: 10, android: 8 }),
  md: 16,
  lg: Platform.select({ ios: 24, android: 20 }),
};

export const radius = {
  sm: 10,
  md: Platform.select({ ios: 14, android: 12 }),
};

export const metrics = {
  screenPadding: Platform.select({ ios: 20, android: 16 }),
  buttonHeight: Platform.select({ ios: 50, android: 48 }),
};
```

---

## Component Strategy

All UI must go through shared wrapper components:
- `AppButton`
- `AppHeader`
- `AppTabs`
- `AppTextField`
- `AppCard`
- `AppSheet`

### Example: Button

```tsx
import { Pressable, Text, Platform } from 'react-native';

export function AppButton({ label, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
      style={({ pressed }) => ({
        opacity: Platform.OS === 'ios' && pressed ? 0.7 : 1,
        borderRadius: Platform.OS === 'ios' ? 14 : 12,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      <Text>{label}</Text>
    </Pressable>
  );
}
```

---

## Navigation

Use: `createNativeStackNavigator`, `createBottomTabNavigator`

| Platform | Rules |
|----------|-------|
| iOS | Allow large titles, smooth transitions, prefer stacked navigation |
| Android | Respect system back behavior, predictable hierarchy, avoid breaking back stack |

---

## Interaction Patterns

### Press Feedback

| Platform | Behavior |
|----------|----------|
| iOS | Opacity / subtle feedback |
| Android | Ripple |

### Haptics
- iOS: light, subtle
- Android: short vibration

### Forms
- Use inline validation
- Break into steps when needed
- Use correct keyboard types

---

## Layout Rules

| Element | iOS | Android |
|---------|-----|---------|
| Spacing | More breathing room | Slightly tighter |
| Radius | Softer | Slightly sharper |
| Density | Airy | Structured |

---

## Platform-Specific Files (Use Sparingly)

Use `.ios.tsx` / `.android.tsx` ONLY for:
- Date pickers
- Action sheets
- Native modals
- Bottom sheets
- Device-specific APIs

---

## Platform Adapter

Centralize all platform logic:

```ts
import { Platform } from 'react-native';

export const platformUI = {
  isIOS: Platform.OS === 'ios',

  button: {
    opacityPressed: Platform.OS === 'ios' ? 0.7 : 1,
    useRipple: Platform.OS === 'android',
  },

  spacing: {
    screen: Platform.OS === 'ios' ? 20 : 16,
  },
};
```

---

## Motion & Feedback

Use motion for: screen transitions, button press, loading states, success feedback.

Avoid: over-animation, decorative-only animations.

---

## Required Screen States

Every screen must handle:
- **Loading** → skeleton or placeholder
- **Empty** → helpful message + action
- **Error** → clear message + retry
- **Success** → confirmation + next step

---

## Accessibility

- Use readable contrast
- Do not rely on color only
- Support larger text
- Use proper labels
- Ensure tap targets ≥ 44px

---

## Safe Area & Bottom Navigation (Critical)

On Android (3-button or gesture navigation), bottom UI can overlap with custom navigation, sticky buttons, sheets, and screen content.

### Required Setup

```tsx
import { SafeAreaProvider } from 'react-native-safe-area-context';

export function App() {
  return (
    <SafeAreaProvider>
      <RootNavigator />
    </SafeAreaProvider>
  );
}
```

### Use Safe Area Insets

```tsx
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const insets = useSafeAreaInsets();
```

### Patterns

```tsx
// Custom bottom bar
<View style={{ paddingBottom: Math.max(insets.bottom, 8), height: 56 + Math.max(insets.bottom, 8) }}>

// Scroll content protection
<ScrollView contentContainerStyle={{ paddingBottom: 80 + insets.bottom }}>

// Sticky bottom CTA
<View style={{ paddingBottom: 12 + insets.bottom }}>
```

### Reusable Hook

```ts
export function useBottomSafeSpacing(extra = 0) {
  const insets = useSafeAreaInsets();
  return Math.max(insets.bottom, 8) + extra;
}
```

### Rules
- NEVER hardcode bottom spacing only
- ALWAYS include `insets.bottom`
- APPLY to: custom bottom nav, sticky buttons, bottom sheets, full-screen modals
- ENSURE scroll content is not hidden behind bottom UI

---

## Anti-Patterns

Do NOT:
- Copy iOS UI exactly into Android
- Copy Material UI exactly into iOS
- Create separate screens per platform unnecessarily
- Overuse platform conditionals everywhere
- Hide primary actions
- Use too many floating buttons
- Overdesign with gradients/glass effects

---

## Folder Structure

```
src/
  components/
    AppButton.tsx
    AppHeader.tsx
    AppTabs.tsx
    AppTextField.tsx
    AppSheet.ios.tsx
    AppSheet.android.tsx
  theme/
    tokens.ts
    platform-ui.ts
  navigation/
    RootNavigator.tsx
  screens/
    HomeScreen.tsx
    ProfileScreen.tsx
```

---

## Definition of Done

A feature is complete when:
- Works on both iOS and Android
- Feels natural on both platforms
- Uses shared components
- Handles all states (loading, empty, error, success)
- No UI is blocked by system areas
- Passes accessibility basics
- No unnecessary platform duplication

---

> One product. One system. Two native experiences.
