# Accessibility

**Target:** WCAG 2.2 AA on every screen and state.

## Structure

- Landmarks: the top bar is a `header`, primary navigation and the project stepper are each a `nav` with an `aria-label`, and each page's content is the `main` landmark. Only one `h1` per page (the step or page title). Card titles are `h2`.
- The project stepper marks the current step with `aria-current="step"`. Locked steps use `aria-disabled="true"` and include “locked” in their accessible name; the reason is in the visible lock and the result text.
- The breadcrumb is a `nav` with `aria-label="Breadcrumb"`. The current item is `aria-current="page"`.

## Keyboard

- Everything is operable by keyboard in visual order: top bar, stepper, head, content, then the footer action bar.
- **Radio groups** (filter chips, platform/language/tone/style chips, the Length segment, angle cards, hook cards, fact Approve/Reject): Tab reaches the group, arrow keys move the selection, and Space selects.
- **Menus:** Enter or Space opens; arrow keys move through items; Escape closes and returns focus to the trigger.
- **Dialogs and drawer:** focus moves to the first field (or the title when there is no field) and is trapped. Escape cancels. Focus returns to the trigger on close.
- **In-page jumps** (“Go to scene 4”) move focus into the target field, not only the scroll position.
- **Batch 2 scene reorder:** needs a keyboard alternative to drag (“Move up / Move down”). It is recorded so it isn’t forgotten.

## Focus

A 2px `--focus` (#1D4ED8) outline at 2px offset on every focusable element, never removed. On the stretched project-card link, the ring is drawn around the whole card.

## Contrast and colour

- All text pairs are at least 4.5:1; see [colors.md](colors.md) for the measured values.
- UI boundaries and the flare indicator are at least 3:1.
- Status is always text plus colour. Selection is always shape (a check or ring) plus colour.

## Targets

At least 24 × 24px at ≥ 1024px (icon buttons are 32px). Below 1024px, buttons, icon buttons, chips, segments, menu items and inputs grow to at least 40–44px.

## Screen readers

- Every icon-only button has an `aria-label` that names its object (“More actions for LED Desk Lamp, WFH Setup”, “Remove feature: BPA-free cup”).
- Credits read as “128 credits available”.
- **Live regions:** the toast region (`role="status"`, polite) on every screen; job status (`role="status"` while queued or running, `role="alert"` when failed); the Fact review counter and the Continue gating reason (polite); rewrite-in-progress notes (polite).
- Busy regions use `aria-busy="true"` with a label (“Loading projects”, “Suggesting angles”).
- Flags attach to their field with `aria-describedby`. Field errors use `aria-invalid` plus `aria-describedby`.
- Decorative art (the sign-in stage panel, thumbnails) is `aria-hidden`.

## Motion

`prefers-reduced-motion` is honoured as described in [motion.md](motion.md). Nothing autoplays.

## Content language

The UI is `lang="en"`. Creator content fields containing Filipino or Taglish should carry the content language (`lang="fil"` for Filipino). Taglish stays unmarked or `en`, because screen readers mispronounce mixed code-switching either way. The script version stores its content language, so fields can set `lang` from it.

## Checks per screen (run before a screen is marked built)

- Contrast of every rendered text and control pair against its actual background (token pairs are pre-computed in [colors.md](colors.md)).
- Every interactive element has exactly one bound action (see the [interaction inventory](../planning/interaction-inventory.md)) and an accessible name.
- Layout at 360, 390, 820, 1024 and 1440px: no horizontal page scroll; sticky footers respect the safe area.
- Keyboard pass: focus order follows visual order; radio groups use arrow keys; menus, dialogs and the drawer trap and return focus; in-page jumps move focus.
- Screen reader pass: live regions announce job status, counters and gating reasons.
- Reduced motion: no slides or scale; opacity-only transitions.

## Implementation notes

- Radio groups (chips, segments, angle and hook cards) implement the full APG radio-group keyboard pattern: one tab stop, arrow keys move and select, Home/End jump. Use the Radix toggle-group or radio primitives, not buttons with `role="radio"`.
- Dialogs, menus, popovers and the drawer use the Radix primitives already in `apps/app-web/components/ui`, which trap and restore focus.
- Taglish text-to-speech pronunciation is a content risk for screen-reader users that design cannot fix.
