# Accessibility

## Rules

Always consider accessibility for every user-facing component and page.

- Use semantic HTML elements (`button`, `nav`, `main`, `section`, `article`, `label`, etc.).
- Preserve keyboard interaction — every interactive element must be keyboard reachable and operable.
- Preserve visible focus states — do not remove `:focus-visible` outlines without a visible replacement.
- Use proper labels for all controls (`label`, `aria-label`, `aria-labelledby`).
- Add `aria-*` attributes where appropriate (`aria-expanded`, `aria-haspopup`, `aria-live`, etc.).
- Ensure interactive elements are usable on both touch and keyboard.
- Maintain readable contrast — minimum WCAG AA (4.5:1 for text, 3:1 for large text and UI components).
- Ensure accessible structure — headings, lists, and landmarks are used semantically.
- Ensure modals and drawers support focus trapping, Escape handling, and accessible close controls.
- For long dialog and drawer content, cap the viewport height and use an internal `overflow-y-auto` body so content remains scrollable while the header and footer stay reachable.
- Do not rely on hover-only interaction for critical actions.

---

## Audit Checklist

| Check | Notes |
| --- | --- |
| Semantic HTML used throughout | No `div` soup where `button`, `nav`, `main` apply |
| All controls have accessible labels | `label`, `aria-label`, or `aria-labelledby` |
| Keyboard navigation works end-to-end | Tab, Shift+Tab, Enter, Space, Escape |
| Focus states are visible | Not removed by `outline: none` without replacement |
| Contrast meets WCAG AA (4.5:1 for text) | Test in both light and dark mode |
| Modals trap focus and support Escape | Focus returns to trigger on close |
| No color-only communication | State is also communicated by text, icon, or shape |
| Images have meaningful `alt` text | Decorative images use `alt=""` |
