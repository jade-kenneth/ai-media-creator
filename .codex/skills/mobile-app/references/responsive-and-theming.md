# Responsive Design & Theming

## Responsive

- Phone-first: design and build for the smallest supported screen first.
- Treat responsive regressions as bugs — not polish.
- Use `useWindowDimensions()` to read screen dimensions — never `Dimensions.get()`.
- Use flexbox over fixed widths. Reserve fixed sizes for icons and avatars.
- Verify layouts on small devices (375pt wide) before considering a feature done.

## Theming (Light + Dark Mode)

- If a requirement mentions light or dark mode, implement both from the start — retrofitting costs more.
- Use semantic color tokens from `theme/colors.ts` via `useThemeColors()` — never hardcode hex values inline.
- Every color used in UI must resolve to both a light and a dark value through the token system.
- Test dark mode on a real device or simulator — color inversions that look fine in code often fail visually.
- Use `useColorScheme()` to read the active scheme; do not rely on `Appearance.getColorScheme()` directly.

---

## Theme Support Rules

If a task, design, or requirement includes both light theme and dark theme, implement both during the initial build.

- Ensure text, icons, borders, surfaces, backgrounds, shadows, overlays, and interaction states are properly styled for both themes.
- Do not leave any element partially themed or dependent on default colors that only work in one mode.
- Prefer theme-aware tokens, variables, or semantic classes over hardcoded color values.
- Ensure both themes are visually consistent, readable, accessible, and production-ready upon creation.

---

## Styling and Design System Rules

Keep styling consistent with the design system.

- Prefer tokens, semantic utility classes, or canonical shared styles.
- Prefer existing design-system components and spacing scales over one-off styling decisions.
- Do not create duplicate visual primitives when a shared version already exists.
- Keep shared text, spacing, radius, and color usage consistent.
- Keep table- or web-specific patterns out of mobile code unless the feature truly needs them.

---

## Responsive Design Standards

Responsive behavior is mandatory for user-facing UI.

- Design for phone first, then adapt for larger screens such as tablets.
- Do not rely on fixed widths that break on small devices.
- Prefer flexible layout, max widths, and responsive padding.
- Prevent clipped content and horizontal overflow.
- Scale typography for mobile readability.
- Keep tap targets large enough for touch interaction.
- Stack or wrap button groups when horizontal space is limited.
- Make forms mobile-friendly and full-width where appropriate.
- Ensure modals, sheets, and dialogs fit within the viewport and allow internal scrolling when necessary.
- Ensure images and media scale correctly without distortion.
- Respect safe area insets.

Responsive regressions should be treated as bugs.
