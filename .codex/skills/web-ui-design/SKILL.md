---
name: web-ui-design
description: 'Complete guide for designing and building production-grade web interfaces. Use for any web UI work: pages, dashboards, forms, tables, dialogs, drawers, navigation, responsive layouts, dark mode, accessibility, motion, charts, empty/loading/error states, and visual polish. Pair with `web-app` for implementation authority.'
version: 1.4.0
license: MIT
---

# Web UI Design

> **Core philosophy**: Web UI should be clear, responsive, accessible, fast, and intentionally styled for its product context. Marketing pages can be memorable and atmospheric; admin/productivity tools should be dense, calm, and built for repeated use.

---

## Skill Layering & Authority

When other design skills are used alongside this one, treat each skill as a separate layer. Do not let broad visual recommendations override concrete project constraints.

### Invocation Order (which skill to trigger first)

> This is distinct from authority order. Invocation order controls **when** each skill is called; authority order controls **what wins** in a conflict.

1. **`web-ui-design`** (this skill) — invoke first. Apply web execution rules (semantic HTML, responsive layout, dark mode, accessibility, motion, performance).

### Authority Order (what wins in a conflict)

1. **User request** — the requested page, workflow, audience, and explicit constraints.
2. **`web-app`** — the implementation authority. Defer to it for all code decisions: stack conventions, folder structure, data fetching, routing, SSR/CSR, caching, forms, and performance. This skill does not override `web-app`.
3. **Web platform execution** — this skill's browser, responsive, accessibility, semantic HTML, keyboard, motion, dark mode, and performance rules.
4. **Design intelligence** — product patterns, aesthetic direction, palettes, typography, UX guidelines, charts, and anti-patterns derived from the task context and project conventions.

This skill owns **design decisions only**: visual language, layout composition, dark mode, typography, component-level UI quality, interaction states, and accessibility posture. For everything else, defer to `web-app`.

### Conflict Rules

- Existing app tokens, CSS variables, the project's component library, and local component APIs win over generated palettes, font stacks, icon systems, and component patterns.
- `web-app` wins over this skill whenever code placement, data fetching, caching, forms, SSR/CSR, SEO, security, or performance is involved.
- Web platform behavior wins over native mobile patterns. Do not copy bottom tabs, native sheets, haptics, or mobile-only gestures into web unless the app already uses an equivalent web pattern.
- For admin, CRM, SaaS, civic, healthcare, finance, and operations tools, prioritize density, clarity, contrast, predictable navigation, and efficient scanning over decorative spectacle.
- Do not introduce new UI libraries, chart libraries, animation libraries, or design systems if the current app already has a fitting pattern.

### Practical Workflow

1. Identify the product context (admin tool, public site, dashboard, landing page, etc.) and apply palette, typography, product patterns, UX guidelines, and anti-patterns through the project's existing brand, tokens, components, and stack.
3. Apply this skill's web execution rules: semantic HTML, keyboard navigation, responsive behavior, focus states, loading/error/empty states, dark mode, and performance.
4. For any implementation detail (how to write the code, which APIs to use, folder placement, SSR/CSR strategy), defer to `web-app`.
5. In handoff notes, briefly call out which recommendations were accepted, adapted, or rejected when that context matters.

---

## Quick Reference Map

| Task | Reference |
|---|---|
| Motion, animation, transitions, `prefers-reduced-motion` | `references/motion.md` |
| Chart type selection, colors, axes, legend, empty state | `references/charts.md` |
| Skeleton patterns, loading state anatomy | `references/loading-states.md` |
| EmptyState component, copy guidelines, placement | `references/empty-states.md` |
| KPI cards, stat blocks, dashboard section layout | `references/dashboard-widgets.md` |
| Type scale, font weight, line height, truncation | `references/typography-scale.md` |
| Icon sizing, containers, accessible icon buttons | `references/icon-system.md` |
| Form field states (focus, error, disabled, loading) | `references/form-field-states.md` |
| Toast / notification visual design and copy rules | `references/toast-notifications.md` |

---

## Dark Mode & Light Mode — Non-Negotiable

**Every page, component, and token must be designed and implemented for both light mode AND dark mode simultaneously. Dark mode is never an afterthought, a stretch goal, or a "later ticket."**

### Strict Rules

- **Design both modes from the start.** Produce both light and dark variants before marking the task complete. Never ship one mode and defer the other.
- **Never use hardcoded color values.** Every color must reference a token or theme variable that has both a light and dark variant. Raw hex values in class strings or inline styles are forbidden.
- **Pair every color declaration with its dark counterpart.** Every background, text, border, ring, and fill must have a dark-mode override via the project's dark mode mechanism.
- **Never rely on inverting light mode.** Inversion destroys brand colors and produces wrong hues. Always declare explicit dark-mode values.
- **Never use raw white or pure black as surface defaults.** Light surfaces should use warm or tinted values. Dark surfaces must be dark-but-not-black. Pure black or white create harsh, unintentional contrast.
- **Test both modes before reporting complete.** Every PR, component, or page must be verified in both light and dark.
- **Contrast must be verified in both modes independently.** A color pair passing WCAG AA in light mode may fail in dark mode. Check each mode separately.
- **Charts, illustrations, and custom SVGs must adapt.** Hardcoded fill colors break in dark mode. Use `currentColor`, CSS variables, or dark-mode fill overrides.
- **Shadows in dark mode must be rethought.** Most light-mode shadows become invisible or harsh in dark mode. Use lighter shadow values, colored glows, or border-based elevation instead.
- **Every interactive state must work in both modes:** focus rings, hover backgrounds, active states, disabled opacity, skeleton shimmer, and loading spinners.
- **Empty states, error states, and toast/alert variants must all have dark-mode colors.**

### Token Contract — Web

Always declare both modes in the root or theme layer. Use the project's actual token values — the structure below is illustrative:

```css
:root {
  --background: /* light page bg */;
  --foreground: /* light text */;
  --card: /* light card surface */;
  --muted: /* light muted bg */;
  --muted-foreground: /* light muted text */;
  --border: /* light border */;
}

/* dark mode class or media query — use whatever the project's theme system provides */
.dark,
[data-theme='dark'] {
  --background: /* dark page bg — not pure black */;
  --foreground: /* dark text */;
  --card: /* dark card surface */;
  --muted: /* dark muted bg */;
  --muted-foreground: /* dark muted text */;
  --border: /* dark border */;
}
```

All color choices must go through the project's theme variables — not hardcoded palette classes.

### Dark Mode Implementation Checklist (runs before every delivery)

| Check                                | Pass condition                                        |
| ------------------------------------ | ----------------------------------------------------- |
| All colors via project tokens        | No raw hex in component code                          |
| Both modes verified visually         | Light + dark browser toggle test                      |
| Contrast AA in both modes            | Checked independently per mode                        |
| Shadows adapted                      | Dark-mode shadows use lighter opacity or colored glow |
| Charts / SVGs adapt                  | `currentColor` or CSS variable fills                  |
| Interactive states in both modes     | Hover, focus, active, disabled, skeleton, error       |
| Empty / error states styled per mode | Not just inherited from light                         |

**Any failing check = the feature is not done.**

---

## Web Design Contexts

Choose the design posture based on the product surface:

- **Admin / dashboard / internal tools**: quiet, dense, utilitarian, fast to scan. Use restrained color, compact tables, clear filtering, predictable navigation, and explicit states.
- **SaaS product app**: polished but task-first. Prefer strong hierarchy, focused cards, clear action placement, and responsive layout systems.
- **Public service / civic / healthcare / finance**: trust, readability, accessibility, low ambiguity, strong contrast, plain language.
- **Landing / marketing pages**: memorable first viewport, strong media, deliberate typography, clear offer, visible next section.
- **Data-heavy screens**: tables, filters, saved views, bulk actions, pagination/virtualization, skeletons, empty states, and export affordances when relevant.

---

## Responsive Layout

- Design from content constraints, not viewport guesses. Use `max-width`, grid tracks, and stable dimensions for fixed-format controls.
- Verify at 375px, 768px, 1024px, 1280px, and 1440px when a screen has meaningful responsive behavior.
- Prevent horizontal scroll except for intentional data tables with clear overflow handling.
- Make mobile web navigation explicit and accessible. Avoid hiding critical actions behind ambiguous icon-only menus.
- Use cards only for repeated items, modals, and genuinely framed tools. Do not put cards inside cards or style every section as a floating card.

---

## Interaction & Accessibility

- Use semantic elements first: `button`, `a`, `form`, `label`, `input`, `table`, `thead`, `tbody`, `dialog` and accessible dialog primitives.
- Every interactive element needs visible focus, hover, active, disabled, loading, and error states where applicable.
- Keyboard support is required for menus, tabs, dialogs, popovers, comboboxes, data tables, and form flows.
- Use icon buttons only for familiar actions and always provide accessible names or tooltips.
- Body text contrast must meet WCAG AA; do not use low-contrast muted text for primary content.
- Respect `prefers-reduced-motion`; motion should clarify feedback or orientation before adding delight.

---

## Visual System

- Use the project's existing tokens and shared primitives before adding new styles.
- Use the project's established icon library — do not introduce a new one.
- Use a limited semantic palette: primary, accent, success, warning, destructive, info, muted, surface, border.
- Avoid one-note palettes. Do not let the interface become dominated by a single color.
- For dark mode, adjust surfaces and borders deliberately using explicit dark-mode overrides. **Never invert light mode. Never defer dark mode.**
- Use typography scale intentionally. Compact panels, table cells, sidebars, and dense dashboards should not use hero-scale text.

## State Signal Economy

Communicate each state with the minimum number of cues needed to make it obvious.

- Do not combine icon, badge, border color, helper copy, and inline label when they all repeat the same state.
- Choose one primary signal first: text label, badge, icon, color treatment, or placement.
- Add a second signal only when it adds a different kind of value such as accessibility, urgency, or extra metadata.
- Redundancy is acceptable when required for accessibility or when each treatment communicates a distinct layer, such as `Failed` plus `Needs review`.
- Dense product surfaces should favor quiet clarity over decorative reinforcement.

Examples:

- Good: warning icon plus explanatory error text.
- Good: status badge plus timestamp.
- Avoid: green check icon, green badge, green border, and `Completed` helper copy on the same row.

---

## Components & Patterns

- **Forms**: labels, helper text, validation, disabled/loading states, success/error handling, keyboard order, and accessible error summaries for complex forms.
- **Tables**: sorting, filtering, loading skeletons, empty states, pagination/virtualization, column alignment, row actions, and responsive overflow.
- **Dialogs/drawers**: focus trap, escape/close behavior, clear title/description, destructive confirmation, and scroll-safe bodies.
- **Navigation**: clear active state, breadcrumbs for deep admin flows, predictable sidebar/topbar behavior, and responsive collapse rules.
- **Charts**: choose chart types based on task. Include legends, labels, tooltips, empty states, and color-safe encodings.
- **Async states**: every server-backed surface needs loading, empty, error, and refetch/submitting states.

---

## Performance & Stability

- Protect Core Web Vitals: LCP first, then INP/TBT, then CLS.
- Reserve image/media dimensions to avoid layout shift.
- Avoid rendering values that differ between server and client — defer browser-only data to effects or client-only boundaries.
- Lazy-load heavy non-critical components, charts, maps, editors, and media.
- Prefer CSS transitions for simple UI motion. Use animation libraries only if the project already uses them or the interaction warrants it.

---

## Delivery Checklist

Before finishing web UI work:

- Existing project tokens/components were reused where they fit.
- The implementation follows `web-app` rules for code placement, data, routing, and SSR conventions.
- Layout works at mobile, tablet, and desktop widths.
- No horizontal overflow or text clipping in normal content.
- Keyboard and screen reader paths are coherent.
- Focus, hover, active, disabled, loading, empty, and error states are present.
- Dark mode is fully implemented: every color uses the project's dark-mode mechanism, both modes are visually verified, contrast passes AA in both modes independently, and no raw hex values appear in component code. **Dark mode is always required — it is not conditional on whether the app "currently supports it."** If the app has no dark mode infrastructure, set it up as part of the task.
- Core Web Vitals risks are considered for media, charts, tables, and large client components.
