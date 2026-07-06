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

## Per-Surface Guidance

### Forms

- Pair every visible label with its control using `htmlFor`/`id`, or use `aria-labelledby` when the label is custom-composed.
- Connect helper text and validation messages with `aria-describedby` so screen readers receive the same context sighted users see.
- Render field-level errors near the control with `role="alert"`; keep the zod message as the user-facing copy.
- Mark required fields in text, not only with color or an icon.
- Use `fieldset` and `legend` for grouped choices such as radio groups, checkbox groups, and multi-part questions.
- Keep disabled and pending states understandable: the control should communicate why it cannot be used or when the blocking action will finish.
- Preserve input values after validation or submit failures so users can correct rather than re-enter.

### Tables and Data Grids

- Use real table semantics for tabular data: `table`, `caption`, `thead`, `tbody`, `tr`, `th`, and `td`.
- Add `scope="col"` or `scope="row"` to header cells when the relationship is not obvious.
- Give action buttons row-specific names, such as "Edit Ana Santos" instead of only "Edit".
- Use `aria-sort` on sortable column headers and make the sort trigger a real `button` inside the header.
- Selection checkboxes need row-specific labels and a clear "select all" label.
- Loading, empty, and error table states should be announced as status content, not only shown visually.
- Keep horizontal scrolling reachable by keyboard and avoid hiding focused cells/actions outside the viewport.

### Async Announcements

- Use `aria-live="polite"` for non-blocking status updates such as saved, uploaded, or refreshed.
- Use `role="alert"` or assertive live regions only for errors that need immediate attention.
- Do not rely on toast alone for critical form errors; keep the actionable error near the affected control or region.
- Avoid live-region spam during rapid updates; announce meaningful state changes, not every progress tick.
- When async content replaces a major region, keep focus stable unless the user needs to act on the new result.
- If a submit fails and the first error is off-screen, move focus to a summary or the first invalid control.

### Dialogs and Drawers

- Provide an accessible title and description through the dialog component's title/description APIs.
- Trap focus while open and return focus to the trigger when closed.
- Support Escape to close non-destructive dialogs; for destructive confirmations, make cancel/close explicit and reachable.
- Include a visible close button with an accessible name.
- Use `alertdialog` only for blocking confirmations that require immediate decision.
- For long content, keep header/footer reachable and scroll the body internally.
- Avoid nested dialogs unless the design system explicitly supports focus management for that stack.

### Navigation

- Use landmarks (`header`, `nav`, `main`, `aside`, `footer`) and label multiple nav regions distinctly.
- Provide a skip link when pages have repeated navigation before main content.
- Mark the current page or section with `aria-current="page"` or the correct `aria-current` token.
- Keep keyboard tab order aligned with visual reading order.
- Icon-only navigation items need accessible names; decorative icons should be hidden from assistive tech.
- Menus, disclosure navigation, and mobile nav toggles need `aria-expanded` and keyboard support.

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
| Form errors are associated with controls | `aria-describedby` + `role="alert"` |
| Tables expose headers, captions, sort, and row action names | No unlabeled icon-only row actions |
| Async status changes are announced appropriately | Live regions are meaningful and not noisy |
| Navigation exposes landmarks and current state | Skip link and `aria-current` where needed |

---

## Related References

- `references/responsive-design.md` — tap targets, breakpoints, and modal/drawer layout rules that pair with these checks
- `references/forms.md` — form labels, error association, disabled states, and submit lifecycle
- `references/upload-fields.md` — file input, dropzone, preview, and upload status accessibility
- `references/browser-compatibility.md` — § 7 accessibility and compatibility watchouts
- `references/common-anti-patterns.md` — § Redundant State Indicators (color-only and stacked state signals)
