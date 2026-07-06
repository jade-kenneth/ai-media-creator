# Accessibility

## Rules

Always consider accessibility for every user-facing component and screen.

- Use accessible labels for all controls (`accessibilityLabel`, `accessibilityHint`).
- Preserve keyboard interaction where relevant.
- Preserve visible focus states where supported.
- Add accessibility roles, labels, and hints where appropriate (`accessibilityRole`).
- Ensure interactive elements are usable on touch and assistive technologies (VoiceOver / TalkBack).
- Maintain readable contrast — minimum WCAG AA (4.5:1 for text, 3:1 for large text and UI components).
- Ensure accessible structure — headings, lists, and landmarks are used semantically.
- Ensure dialogs, modals, and sheets have accessible close controls and correct focus behavior when possible.
- Do not rely on hover-only interaction for critical actions.
- Tap targets must be at least 44×44 pt.

---

## Audit Checklist

| Check | Notes |
| --- | --- |
| Interactive elements have `accessibilityLabel` | Buttons, icons, image-only controls |
| Tap targets at least 44x44px | Measure all touchable elements |
| Contrast meets WCAG AA (4.5:1 for text) | Test in both light and dark mode |
| Dialogs and sheets have accessible close controls | Close button with label, not gesture-only |
| `accessibilityRole` set on interactive elements | `button`, `link`, `header`, `image`, etc. |
| VoiceOver / TalkBack reading order is logical | Focus order matches visual order |
| No color-only communication | Do not use color as the only indicator of state |

---

## Related References

- `mobile-native-ui-design` › `references/icons.md` — dark-mode color tokens; hardcoded icon colors are a blocker
- `references/responsive-and-theming.md` — light/dark contrast and theming that affects AA compliance
- `references/layout-and-safe-areas.md` — safe-area handling so controls stay reachable and unobscured
