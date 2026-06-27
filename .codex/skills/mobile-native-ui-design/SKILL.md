---
name: mobile-native-ui-design
description: "Complete guide for designing and building beautiful, production-grade mobile interfaces for iOS and Android. Covers aesthetic direction, design tokens, platform conventions, converge vs diverge, UX research, typography, color, motion, accessibility, brand, iconography, illustration, and navigation. When producing HTML mockups of mobile screens, translate every mobile spec to its closest CSS/HTML equivalent. USE for any mobile UI work. TRIGGERS: 'build a screen', 'build a component', 'design this', 'style this', 'does this look native?', 'iOS vs Android', 'platform parity', 'design tokens', 'motion spec', 'accessibility audit', 'touch targets', 'dark mode', 'FAB or no FAB?', 'bottom sheet or modal?', 'create a component', 'add navigation', 'add animation', 'review this screen', 'converge or diverge', 'make this beautiful', 'write once feel native', 'cross-platform mobile design', 'haptic spec', 'UX research plan', 'handoff checklist', 'design critique', 'platform conventions', 'same or different per platform?', 'navigation architecture', 'dark mode strategy', 'icon system', 'typography scale', 'spring physics', 'create a mockup', 'mockup html'."
version: 3.4.0
license: MIT
---

# Native UI Design — Beautiful Mobile Interfaces for iOS & Android

> **Core philosophy**: Design for human behavior first — adapt for platform conventions second, never the reverse. The goal is a product that feels _at home_ on each platform while being unmistakably the same brand. Make it feel native and inevitable.

The central craft problem of cross-platform mobile design is the tension between **consistency** and **nativeness**. This guide shows how to hold both.

---

## Skill Layering & Authority

When another design skill is used alongside this one, treat each skill as a different layer of the decision stack. Do not let broad design recommendations override concrete app, platform, or project constraints.

### Invocation Order (which skill to trigger first)

> This is distinct from authority order. Invocation order controls **when** each skill is called; authority order controls **what wins** in a conflict.

1. **`mobile-native-ui-design`** (this skill) — invoke first. Apply mobile execution rules (iOS/Android conventions, safe areas, touch targets, navigation, motion, accessibility).

### Authority Order (what wins in a conflict)

1. **User request** — the feature, audience, target screen, and explicit constraints.
2. **`mobile-app`** — the implementation authority. Defer to it for all code decisions: stack conventions, folder structure, data fetching, state management, patterns, and platform-specific APIs. This skill does not override `mobile-app`.
3. **Platform execution** — this skill's iOS/Android conventions, safe areas, touch targets, navigation, typography, motion, and accessibility rules.
4. **Design intelligence** — product patterns, aesthetic direction, palettes, typography, UX guidelines, and anti-patterns derived from the task context and project conventions.

This skill owns **design decisions only**: visual language, platform conventions, dark mode, typography, spacing, motion, accessibility posture, and component-level UI quality. For everything else, defer to `mobile-app`.

### Conflict Rules

- If a suggestion conflicts with existing app tokens or established screen patterns, keep the app tokens and adapt the recommendation.
- If a recommendation is web-centric (floating navbar, hover behavior, desktop card composition), translate the intent into native mobile conventions instead.
- If this skill asks for platform divergence and another skill suggests one universal layout, preserve shared logic/content but diverge iOS and Android surfaces where native behavior matters.
- If the product context calls for restraint (government, civic, admin, healthcare, finance), prioritize clarity, density, contrast, and trust over decorative spectacle.
- Never introduce a new design system, font stack, icon set, or component pattern when the app already has one that fits.
- For any code-level decision not covered here, defer to `mobile-app`.

### Practical Workflow

1. Extract the product context from the task and apply palette, typography, product patterns, UX guidelines, and anti-patterns through the project's existing brand, tokens, and stack.
3. Apply this skill's mobile execution rules: safe areas, native navigation, platform affordances, touch targets, accessibility, motion, empty/loading/error states.
4. For any implementation detail (how to write the code, which APIs to use, folder placement), defer to `mobile-app`.
5. In mockups or handoff notes, call out which recommendations were accepted, adapted, or rejected.

---

## Quick Reference Map

| Task | Reference |
| -------------------------------------------- | -------------------------------------- |
| Critiquing/iterating AI-generated UI         | `references/visual-design-principles.md` |
| Animations, springs, Reanimated              | `references/animations.md`            |
| Native controls (Switch, Slider, Picker)     | `references/controls.md`              |
| Form bottom sheet pattern                    | `references/form-sheet.md`            |
| Gradient backgrounds, atmospheric fills      | `references/gradients.md`             |
| Icons (MaterialIcons), color tokens          | `references/icons.md`                 |
| Images, video, expo-image patterns           | `references/media.md`                 |
| Expo Router, route structure, layouts        | `references/route-structure.md`       |
| Search UI patterns                           | `references/search.md`                |
| SecureStore, AsyncStorage design patterns    | `references/storage.md`               |
| Tab bar design, bottom nav patterns          | `references/tabs.md`                  |
| Toolbar, headers, Large Title                | `references/toolbar-and-headers.md`   |
| Blur, vibrancy, visual effects               | `references/visual-effects.md`        |
| WebGPU / Three.js / 3D effects               | `references/webgpu-three.md`          |
| Zoom + shared element transitions            | `references/zoom-transitions.md`      |
| Empty state design (icon, heading, action)   | `references/empty-states.md`          |
| Loading skeletons, shimmer animation         | `references/loading-skeleton.md`      |
| Toast design (slide-fade, palette, position) | `references/toast-feedback.md`        |
| Typography NativeWind implementation         | `references/typography-implementation.md` |
| Native date picker field design              | `references/date-picker-field.md`     |
| Network error banner design                  | `references/network-banner.md`        |

---

## Dark Mode & Light Mode — Non-Negotiable

**Every screen, component, and token must be designed and implemented for both light mode AND dark mode simultaneously. Dark mode is never an afterthought, a stretch goal, or an optional pass.**

### Strict Rules

- **Design both modes from the start.** Produce both light and dark variants before any implementation begins. Never design only one mode and defer the other.
- **Never use hardcoded color values.** Every color must reference a semantic design token that has both a light and a dark variant. Raw hex values in component code are forbidden.
- **Never use pure black or pure white as surfaces.** Dark mode backgrounds must be dark-but-not-black. Light mode backgrounds should be warm or intentionally tinted — not cold flat white.
- **Test both modes before reporting complete.** Screenshots or previews showing only one mode are incomplete.
- **Contrast must be verified in both modes independently.** A color pair passing WCAG AA in light mode may fail in dark mode and vice versa.
- **Illustrations and icons must adapt.** Hardcoded fills look broken on dark backgrounds. Use tokens inside SVG fills or ship separate dark-mode variants.
- **Never rely on color inversion as a dark mode solution.** Inversion produces wrong hues and destroys brand colors. Always use explicit dark-mode token values.
- **Atmospheric backgrounds must have dark variants.** Every gradient, overlay, or blurred surface must have a dark-mode version — not simply inverted.
- **Shadows disappear in dark mode — use elevation tinting instead.** iOS: slightly lighter fills for elevated surfaces. Android Material You: tonal color overlay. Never rely on shadow alone for depth in dark mode.
- **In HTML mockups: always render both modes.** Use CSS custom properties so switching is mechanical and complete.

### Dark Mode Token Contract

Every token must declare both values before it can be used. Use the project's actual token values — the roles below are illustrative:

```
Token             Light                      Dark
surface           (light card/sheet bg)      (dark, not pure black)
bg                (light page bg)            (dark page bg)
textPrimary       (dark readable text)       (light readable text)
textSecondary     (muted text)               (muted text on dark)
border            (subtle divider)           (subtle divider on dark)
surfaceEl1        (elevated card)            (slightly lighter dark)
surfaceEl2        (popover/toast)            (more elevated dark)
```

Brand colors stay **identical** in both modes. Only surfaces, text, and border values shift.

### Dark Mode Critique Gate

Before a screen is considered done:

| Check                                     | Pass condition                            |
| ----------------------------------------- | ----------------------------------------- |
| All colors from tokens                    | No raw hex in component code              |
| Both modes rendered                       | Light + dark screenshots/preview provided |
| Contrast AA in both modes                 | Verified independently for each mode      |
| Elevation visible in dark                 | Tinting used, not shadows                 |
| Illustrations adapt                       | Token fills or separate dark variants     |
| Atmospheric backgrounds have dark variant | Explicit gradient/overlay per mode        |

**Any failing check = the screen is not done.**

---

## Design Thinking

Before touching code, commit to a clear aesthetic direction:

- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick a direction that fits the context — minimal, editorial, playful, premium, utilitarian, atmospheric. Commit to one that is true to the product.
- **Constraints**: Stack, performance, accessibility, platform conventions.
- **Differentiation**: What makes this memorable? Design for that moment.

Choose a clear conceptual direction and execute it with precision. The key is intentionality, not intensity. Match implementation complexity to the aesthetic vision.

---

## The Eight Visual Design Principles — Your AI Critique Vocabulary

Generated UI trends **sterile and utilitarian** — agents assemble patterns from code and templates but cannot _see_ the result. "Every vibe-coded app looks the same" because the first output is a feature-shaped base, not a finished screen. These eight principles are the shared vocabulary for **critiquing and iterating that base into something polished**. Full definitions, worked before/after examples, and the anti-sterility playbook live in `references/visual-design-principles.md`.

### Give the agent eyes — the critique loop

An agent has no eyes; design is not code. Critiquing code instead of pixels is how sterile output survives. So:

1. **Generate** the screen.
2. **Render** it — run the app or build an HTML mockup — and capture a **screenshot**.
3. **Critique** the screenshot against the eight principles below; name the specific failure ("no high-contrast focal point", "hierarchy is muddled").
4. **Revise** with a fix tied to the named principle.
5. **Repeat** until all eight pass — then add **one memorable moment**.

### The checklist

| Principle | Passes when… | Failure smell |
| --------- | ------------ | ------------- |
| **Contrast** | One clear high-contrast focal point; the primary action looks unmistakably clickable. | Everything competes equally; tonal clashes; no focal point. |
| **Hierarchy** | Eye moves in the order the product wants (e.g. atmosphere → conversion → browse). | Wordmark, tagline, labels, and titles all fight at the same weight. |
| **Alignment** | Elements share clean edges/axes; margins consistent. | Ragged, off-axis, inconsistent margins. |
| **Proximity** | Related items grouped; white space separates groups instead of borders. | Facts crammed together; dense stacks with no breathing room. |
| **Repetition** | One type family, one accent, consistent shapes/spacing/radii. | Mixed fonts/weights, competing accent colors, independent decisions. |
| **Balance** | Weight distributed with intention; asymmetry still resolved. | Bottom-heavy/lopsided; one block dominates, the eye sinks. |
| **White space** | Negative space reads as active and intentional — premium/calm. | Every pixel working; cluttered. |
| **Unity** | Every choice reinforces one idea. | "A template with content poured in." |

> **Unity is emergent** — you get it when the other seven agree. Don't chase it directly.

### Don't ship the sterile base

Treat agent output as a starting point, then add the nuance it skipped (e.g. order recaps surfaced through a checkout) and engineer **one memorable visual moment** (ties to "design for that memory" below). In civic/admin/healthcare/finance surfaces, that memorable moment is calm legibility and trust — not decorative spectacle.

---

## Mobile Aesthetic Atmosphere

Mobile screens are intimate and personal — flat, unstyled surfaces feel unfinished. Every screen deserves atmosphere.

- **Typography**: Use a distinctive brand typeface for display text. Use the platform's system font for UI chrome — it builds platform trust.
- **Color commitment**: One dominant brand color + one sharp accent. Rich or warm background tones over flat neutral surfaces.
- **Atmospheric backgrounds**: Use gradient and overlay techniques the project supports for hero sections and cards. Avoid flat unbranded backgrounds for primary surfaces.
- **Depth through elevation**: iOS — blur/vibrancy for overlays, layered translucency. Android — tonal color overlay (Material You), not drop shadows. Elevation is expressed through color, not shadow.
- **Decorative details**: Radial glows, subtle grain, geometric shapes, overlapping translucent layers create spatial depth within the flat medium.
- **Spatial composition**: Asymmetry, intentional overlap, grid-breaking elements. Generous negative space OR rich density — never a default-centered column.

> The one thing a user remembers about the app should be a visual moment — a bold header, an unexpected color, a distinctive typeface. Design for that memory.

---

## HTML Mockup Rules

When producing an HTML mockup of a mobile screen, the HTML is a **fidelity approximation** — not a web build. All design decisions still follow the mobile sections of this skill. Every mobile spec must be translated to its closest CSS/HTML equivalent.

### Translation Table

| Mobile spec                     | HTML/CSS equivalent                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Gradient backgrounds            | `linear-gradient()` CSS property                                                                     |
| Blur / glass overlay            | `backdrop-filter: blur()` + `saturate()`                                                             |
| Custom fonts                    | `@import` from Google Fonts CDN or equivalent                                                        |
| Spring press feedback           | `:active { transform: scale(0.96); transition: transform 100ms cubic-bezier(0.34, 1.56, 0.64, 1); }` |
| Professional spring (no bounce) | `cubic-bezier(0.4, 0, 0.2, 1)`                                                                       |
| Entering animation — stagger    | `@keyframes fadeSlideUp` + `animation-delay: calc(var(--i) * 60ms)`                                  |
| Screen push/pop (300–400ms)     | CSS `@keyframes slideInRight` on `.screen`                                                           |
| Modal present (350ms rise+fade) | `@keyframes slideUp` + `opacity 0→1`                                                                 |
| Skeleton → content (300ms)      | `@keyframes shimmer` on placeholder rects                                                            |
| Reduced motion                  | `@media (prefers-reduced-motion) { * { animation: none; transition: opacity 150ms; } }`              |
| Box shadow                      | CSS `box-shadow`                                                                                     |
| Extended tap area               | `padding` expansion or `::before` pseudo-element                                                     |
| Safe area insets                | CSS `padding` matching the exact pt values from Platform Specifications                              |
| Frosted tab bar                 | `backdrop-filter: blur(24px) saturate(180%)` + semi-transparent bg                                   |
| Continuous corner curve         | `border-radius` — visually equivalent in HTML                                                        |
| Dark mode surfaces              | CSS custom properties with `@media (prefers-color-scheme: dark)`                                     |
| Haptics                         | Not applicable in HTML — annotate in a comment where haptic would fire                               |

### Rules

1. **Press states on every interactive element** — every card, row, button, and tab item must have an `:active` scale transform.
2. **Entry animations on list items** — stagger children with `animation-delay`. Lists that appear all at once feel like a page load, not a native app.
3. **Never flat backgrounds** — apply a gradient or a rich solid token. Flat white/grey as a hero background is always wrong.
4. **Frosted tab bar** — use `backdrop-filter` with a semi-transparent bg. Never solid opaque.
5. **Skeleton states** — show shimmer skeletons before content populates, even in a mockup.
6. **Reduced motion fallback** — always include `@media (prefers-reduced-motion)` that replaces all transforms with a 150ms opacity fade.
7. **Annotate where approximation diverges** — add a comment on elements where the CSS is a close but not exact match.
8. **Always render both light and dark modes.** Use CSS custom properties for all colors. A mockup showing only one mode is incomplete.

---

## Write Once, Feel Native Principle

"Write once" does not mean identical on both platforms. It means:

- **One token layer** drives color, spacing, radius, and type scale on both
- **One component logic** — the same behavior and content
- **Two platform skins** — the surface adapts to each OS's native conventions

Users on iOS should never feel like they're using an Android port. Users on Android should never feel like they're using an iOS port. Both feel like the same brand.

### The Three Layers

```
┌─────────────────────────────────────┐
│         BRAND IDENTITY              │  ← Same on both: color, voice, illustration
├─────────────────────────────────────┤
│         COMPONENT LOGIC             │  ← Same on both: behavior, content, IA
├──────────────────┬──────────────────┤
│   iOS SURFACE    │  ANDROID SURFACE │  ← Diverges: chrome, toggles, navigation
└──────────────────┴──────────────────┘
```

---

## Design Token Foundation

Tokens are the single source of truth. Every design decision — color, spacing, radius, type — lives here. Always check the project's token file first before defining new values.

### Color Tokens — Semantic Roles

| Token           | Role                                          |
| --------------- | --------------------------------------------- |
| `brand`         | Primary brand color — main CTA, active states |
| `brandDark`     | Darker shade — pressed states                 |
| `brandLight`    | Very light tint — backgrounds, chips          |
| `brandMid`      | Mid tint — borders, subtle fills              |
| `accent`        | Secondary accent — highlights, badges         |
| `surface`       | Card / sheet background                       |
| `bg`            | Page background                               |
| `textPrimary`   | Primary readable text                         |
| `textSecondary` | Secondary / supporting text                   |
| `textTertiary`  | Placeholder, hints, disabled text             |
| `border`        | Dividers, input borders                       |
| `error`         | Destructive actions, validation errors        |
| `success`       | Confirmation, completed states                |
| `warning`       | Caution states                                |

### Dark Mode Surfaces — NOT pure black

| Token             | Role                       |
| ----------------- | -------------------------- |
| `dark.bg`         | Page background            |
| `dark.surface`    | Cards, sheets              |
| `dark.surfaceEl1` | Elevated cards             |
| `dark.surfaceEl2` | Popovers, toasts           |
| `dark.border`     | Dividers (subtler in dark) |

> Brand colors stay identical in dark mode. Only surfaces change — use elevation tinting, not shadows.

### Spacing Scale (dp — never raw px)

| Token       | Value |
| ----------- | ----- |
| spacing-xs  | 4dp   |
| spacing-sm  | 8dp   |
| spacing-md  | 16dp  |
| spacing-lg  | 24dp  |
| spacing-xl  | 32dp  |
| spacing-2xl | 48dp  |

### Border Radius

| Token       | Value  | Usage                        |
| ----------- | ------ | ---------------------------- |
| radius-sm   | 6px    | Badges, chips                |
| radius-md   | 12px   | Android cards                |
| radius-lg   | 16px   | iOS cards, sheets            |
| radius-xl   | 20px   | iOS bottom sheet top corners |
| radius-full | 9999px | Pills, toggles, avatars      |

> `card-radius` = 16pt iOS / 12dp Android. `sheet-radius` = 20pt iOS / 16dp Android. Never hardcode.

### Component Architecture

- Build atomic components (Button, Input, Card, Badge) with **variants per platform**
- Document which components are universal vs. platform-specific

---

## Converge vs Diverge

### Keep Identical on Both ✓

- Design tokens (color, spacing, radius, type scale)
- Brand identity — colors, illustration style, icon weight, motion personality
- Content hierarchy and information architecture
- Error, empty, and loading states
- Copy tone and UX writing voice
- Accessibility minimum standards (WCAG AA)
- Accessible label language
- Haptic moment mapping (the _when_, not the _how_)

### Adapt Per Platform ≠

| Element            | iOS                           | Android                                |
| ------------------ | ----------------------------- | -------------------------------------- |
| System font        | San Francisco (SF Pro)        | Google Sans / Roboto                   |
| Primary navigation | Tab bar — bottom, max 5 items | Bottom nav bar with pill indicator     |
| Back navigation    | Swipe from left edge          | System back gesture / hardware back    |
| Modal dismiss      | Swipe down                    | Back gesture or ✕ button               |
| Search placement   | Inline below Large Title      | Expands into Top App Bar               |
| Sub-navigation     | Segmented Control             | Material Tab Bar + underline indicator |
| Settings layout    | Grouped UITableView rows      | Material preference list               |
| FAB                | Avoid — use nav bar button    | Extended FAB for primary action        |
| Toggle/Switch      | Green pill (51×31pt)          | M3 outlined → filled (52×32dp)         |
| Sheet corners      | 20pt top radius               | 16dp top radius                        |
| Overflow menu      | ‹ back + title                | Three-dot ⋮ overflow                   |
| Alerts             | Centered modal dialog         | Snackbar for transient info            |
| Large title        | Collapses on scroll           | No equivalent                          |
| Action label case  | "See all →" sentence case     | "SEE ALL" uppercase                    |

### Navigation Architecture Rule

Design your IA so it works for **both back models**. Never make the back button the only exit from a state — always provide an explicit close/cancel affordance. Android users have a system back gesture; iOS users swipe from the left edge. Both must always have a way out.

### State Signal Economy

Communicate each state with the minimum number of cues needed to make it obvious and accessible.

- Do not combine icon, badge, border highlight, helper copy, and inline label when they all repeat the same state.
- Choose one primary signal first: text label, badge, icon, color treatment, or placement.
- Add a second signal only when it adds different value such as accessibility, urgency, or metadata.
- Redundancy is acceptable when each treatment communicates a different layer, such as `Failed` plus `Needs review`, or color + text for accessibility.
- In dense civic and admin surfaces, prefer calm clarity over decorative reinforcement.

Examples:

- Good: `Your vote` badge plus neutral row styling.
- Good: warning icon plus explanatory error text.
- Avoid: check icon, success badge, green border, and helper copy all repeating `Selected`.

---

## Touch Targets & Layout

### Touch Target Rules

| Rule                    | Value                                               |
| ----------------------- | --------------------------------------------------- |
| Minimum touch target    | **48×48dp** — covers both iOS 44pt and Android 48dp |
| Primary actions / FAB   | 56×56dp                                             |
| Spacing between targets | 8dp minimum to prevent mis-taps                     |

Small visual elements (icon buttons, checkboxes) must have their tappable area extended beyond their visual bounds — via padding, invisible hit-area layer, or the framework's equivalent mechanism.

### Safe Areas

Never hardcode top/bottom padding. Always use the project's safe area utilities to get inset values dynamically.

**iOS safe areas (portrait):**

- Status bar: 54pt (Dynamic Island) / 44pt (notch) / 20pt (no notch)
- Home indicator: 34pt (Face ID devices) / 0pt (home button)
- Navigation bar: 44pt standard
- Tab bar: 49pt + safe area bottom

**Android safe areas:**

- Status bar: 24dp standard (varies with cutout)
- Navigation bar: 48dp (3-button) / gesture inset varies by OEM
- App bar: 56dp standard, 64dp prominent
- Bottom navigation: 56dp + nav bar inset

### Responsive Grid

- 4-column grid on mobile — 16dp margins, 8dp gutters
- Design fluid — proportions not fixed pixels for container widths
- Test at: 320px (small Android), 375px, 390px, 412px, 428px (Pro Max)
- Design simultaneously at **390×844** (iPhone 15) and **360×800** (common Android)

---

## Navigation Patterns

### Full Navigation Divergence Table

| Pattern            | iOS                                     | Android                                                  |
| ------------------ | --------------------------------------- | -------------------------------------------------------- |
| Primary nav        | Tab bar (bottom, max 5)                 | Bottom nav + pill indicator                              |
| Back gesture       | Swipe from left edge                    | System back / hardware back button                       |
| Back affordance    | `‹ Title` in nav bar                    | `←` arrow icon button in App Bar                         |
| Search             | Appears inline below Large Title on tap | SearchView expands INTO the Top App Bar, replacing title |
| Sub-nav            | Segmented Control below Large Title     | Material Tab Bar at App Bar bottom, accent underline     |
| Settings access    | Tab item or Profile section             | Three-dot overflow → Settings                            |
| FAB                | Avoid — use nav bar `+` button          | Extended FAB (icon + label)                              |
| Modal dismiss      | Swipe down                              | Back gesture or ✕ button                                 |
| Action sheet       | Bottom sheet, rounded top               | Bottom sheet or dialog                                   |
| Transient feedback | Toast/snackbar                          | Snackbar (preferred for Android)                         |
| Large title        | 34pt, left-aligned, collapses on scroll | No direct equivalent                                     |

### iOS HIG Key Rules

- Navigation bar title: center-aligned (default), max 1 line
- Tab bar: max 5 items, always visible — never hide on scroll
- Back button: system chevron + previous screen title (truncate at >10 chars)
- Destructive actions: always require confirmation

### Material Design 3 Key Rules

- Color scheme: Dynamic Color — design must work without it
- Shape: corner radius tokens (Extra Small 4dp → Extra Large 28dp → Full)
- Elevation: tonal color overlay at 5 levels (not drop shadows)
- FAB: 56×56dp standard, 40×40dp small, 96×96dp large

### Navigation Implementation Principles

These are framework-agnostic. Apply them regardless of the project's routing solution.

- Keep route/screen entry files thin — no business logic, just composition
- Define navigation structure in layout or shell files, not inside individual screens
- Always have a root/home entry point
- Use the framework's native modal and sheet primitives before building custom ones
- Prefer framework-native navigation transitions over custom ones — they match platform expectations
- Remove stale route files when restructuring navigation — do not leave orphaned screens

---

## Typography

### Font Strategy

1. Choose a **brand typeface** that renders well on both platforms — test on actual devices
2. Use the platform's system font for UI chrome — builds trust, respects accessibility settings
3. Use the project's font-loading mechanism for custom typefaces

### Shared Type Scale

| Token    | iOS (pt) | Android (sp) | Weight |
| -------- | -------- | ------------ | ------ |
| display  | 28       | 28           | 800    |
| title1   | 22       | 22           | 700    |
| title2   | 19       | 18           | 700    |
| headline | 17       | 16           | 700    |
| body     | 15       | 15           | 400    |
| callout  | 14       | 14           | 400    |
| caption  | 12       | 12           | 400    |
| micro    | 11       | 11           | 600    |

### iOS — SF Pro Full Scale

| Style       | Size (pt) | Weight   | Line Height |
| ----------- | --------- | -------- | ----------- |
| Large Title | 34        | Regular  | 41          |
| Title 1     | 28        | Regular  | 34          |
| Title 2     | 22        | Regular  | 28          |
| Title 3     | 20        | Regular  | 25          |
| Headline    | 17        | Semibold | 22          |
| Body        | 17        | Regular  | 22          |
| Callout     | 16        | Regular  | 21          |
| Subhead     | 15        | Regular  | 20          |
| Footnote    | 13        | Regular  | 18          |
| Caption 1   | 12        | Regular  | 16          |
| Caption 2   | 11        | Regular  | 13          |

### Android — Material Type Scale

| Role            | Size (sp) | Weight  | Line Height |
| --------------- | --------- | ------- | ----------- |
| Display Large   | 57        | Regular | 64          |
| Headline Large  | 32        | Regular | 40          |
| Headline Medium | 28        | Regular | 36          |
| Title Large     | 22        | Regular | 28          |
| Title Medium    | 16        | Medium  | 24          |
| Body Large      | 16        | Regular | 24          |
| Body Medium     | 14        | Regular | 20          |
| Body Small      | 12        | Regular | 16          |
| Label Large     | 14        | Medium  | 20          |
| Label Medium    | 12        | Medium  | 16          |

### Hierarchy Rules

- **3-tier hierarchy max** per screen: Primary (20–28pt) / Secondary (15–17pt) / Supporting (12–13pt)
- Increase **weight before size** to create hierarchy — fewer size jumps = cleaner
- Line length: **45–75 characters** optimal for mobile readability
- Minimum body text: **15sp/pt** (13sp acceptable for secondary/caption only)

### Accessibility Scaling

- Design and test at **iOS Dynamic Type** (up to 310%) and **Android font scaling** (up to 200%)
- Text must never clip, overflow containers, or overlap at large sizes
- Set line height explicitly — some mobile frameworks do not inherit it automatically
- Allow font scaling on all text; cap tab labels and badges to prevent layout breakage

---

## Color & Visual Design

### Color System Architecture

Define semantic roles — not raw values:

```
Semantic Roles (mapped from brand):

  Light Mode                   Dark Mode
  primary:    brand-600        primary:    brand-300
  on-primary: white            on-primary: brand-900
  surface:    white            surface:    <dark surface>
  on-surface: neutral-900      on-surface: neutral-100

State Colors:
  error / on-error / error-container
  success / on-success
  warning / on-warning
```

### Dark Mode Strategy

Design both light and dark simultaneously — never as an afterthought. See the "Dark Mode & Light Mode — Non-Negotiable" section for the full rule set and critique gate.

**Common dark mode mistakes (all are blockers):**

- Designing only light mode and adding dark mode as a final pass
- Simply inverting light mode (harsh, unintentional — wrong hues)
- Using pure black (harsh on OLED, destroys depth hierarchy)
- Using raw hex values in component code instead of semantic tokens
- Forgetting shadows don't work on dark — use elevation tints instead
- Not testing contrast ratios in dark mode independently from light mode
- Shipping illustrations with hardcoded fills that look broken on dark backgrounds

**iOS Dark Mode:** Use semantic colors for automatic adaptation. Custom brand colors need explicit dark variants. Elevated surfaces get progressively lighter fills.

**Android Dark Mode (Material You):** Use tonal palette — each color has a light and dark variant. Elevation expressed as tonal overlay, not shadow.

### Contrast Requirements

| Context                 | Minimum Ratio   |
| ----------------------- | --------------- |
| Body text on background | 4.5:1 (WCAG AA) |
| Large text (18pt+)      | 3:1             |
| UI components & icons   | 3:1             |
| Enhanced / preferred    | 7:1 (WCAG AAA)  |

### Color Psychology for Mobile

- **CTA buttons**: High-contrast brand color — draws eye to primary action
- **Destructive actions**: Red (universal signal) — never use brand red for CTAs
- **Success states**: Green — avoid as brand color to prevent confusion
- **Disabled states**: Reduced opacity of normal state — never just grey (loses brand feel)

### Visual Depth

- **iOS**: Blur/vibrancy for overlays, subtle shadows, layered translucency
- **Android**: Material You tonal elevation (color overlay, not shadow)
- **Universal**: Depth through color and spacing — not drop shadows alone

---

## Motion & Microinteraction

### Motion Principles

All motion must serve one of three purposes — in this priority order:

1. **Feedback** — confirm the user's action
2. **Orientation** — show where something came from or is going
3. **Delight** — add personality (only after 1 and 2 are satisfied)

### Motion Personality Archetypes

| Archetype      | Feel                                        | When to use                   |
| -------------- | ------------------------------------------- | ----------------------------- |
| Playful        | Bouncy springs, slight overshoot, energetic | Consumer apps, youth products |
| Professional   | Smooth, controlled, no overshoot            | B2B, financial, government    |
| Premium/Luxury | Slow, deliberate, graceful deceleration     | High-end goods, banking       |
| Utility        | Fast, minimal — get out of the user's way   | Productivity, tools           |

### Timing Guidelines

| Interaction                  | Duration             | Notes                      |
| ---------------------------- | -------------------- | -------------------------- |
| Micro (tap feedback, toggle) | 100–200ms            |                            |
| Screen push/pop              | 300–400ms            |                            |
| Modal present                | 350ms                | Rise + fade                |
| Modal dismiss                | 280ms                | Slightly faster exit       |
| Toast/snackbar               | 250ms in / 200ms out |                            |
| Button press                 | 100ms                | Scale 0.96 on press        |
| Toggle                       | 200ms                | spring                     |
| Skeleton → content           | 300ms                | Stagger children 60ms each |
| Never exceed                 | 700ms                | Users feel blocked         |

### Spring Physics

Spring physics model physical mass and feel natural on both platforms. Reference values — adapt to match the project's existing motion personality:

- **iOS-style**: smooth with subtle overshoot (response ~0.35, damping ~0.7)
- **Android-style**: snappier entrance, clean exit (FastOutSlowIn curve)

Prefer spring/ease-out curves for all UI motion. Avoid linear — it feels mechanical.

### Animation Easing Curves

**iOS:**

- Standard: `easeInOut`
- Spring (preferred): smooth with subtle overshoot
- Navigation push/pop: slightly heavier spring

**Android Material Motion:**

- Standard: FastOutSlowIn
- Decelerate: FastOutLinearIn (for elements entering)
- Accelerate: LinearOutSlowIn (for elements leaving)

### Loading State Hierarchy

1. **Optimistic UI** — assume success, revert on failure (best UX)
2. **Skeleton screens** — layout visible immediately, content fades in
3. **Inline spinner** — within the component loading
4. **Full-screen spinner** — initial app load only; avoid elsewhere

### Haptic Feedback Mapping

Use haptics conditionally, respecting platform capabilities:

| Moment             | iOS                  | Android             |
| ------------------ | -------------------- | ------------------- |
| Tap confirmation   | Light impact         | Click effect        |
| Destructive action | Heavy impact         | Heavy click effect  |
| Toggle             | Rigid impact         | Tick effect         |
| Success            | Success notification | Custom vibration    |
| Error              | Error notification   | Double click effect |
| Selection change   | Selection feedback   | Tick effect         |

### Reduced Motion

Always provide a fallback. Use the platform's reduced motion preference signal. Replace spring/slide with opacity fade only (150ms). Motion is an enhancement, never a requirement.

---

## Iconography & Illustration

### Icon System

- Base size: **24dp** with **2dp stroke weight** for outline icons
- **Filled variant** for selected/active states (outline = inactive, filled = active)
- Use the project's established icon library — do not introduce a new one
- Keep icon size and stroke weight consistent across the app

### Export Requirements

```
iOS:     @1x, @2x, @3x
Android: SVG/vector drawable to cover all densities
         — OR — mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi raster sets
```

### Illustration Style for Cross-Platform

| Style                  | Platform Bias      | Recommendation                        |
| ---------------------- | ------------------ | ------------------------------------- |
| Flat geometric         | None               | Excellent — default choice            |
| Isometric              | None               | Good for product/feature illustration |
| Line art               | None               | Versatile, scales well                |
| Photographic           | None               | If photography is in brand identity   |
| 3D render              | None               | Premium feel, expensive to produce    |
| Skeuomorphic           | iOS historical     | Avoid                                 |
| Heavy Material shadows | Android historical | Avoid                                 |

### Illustration Production Standards

- SVG primary — never raster-only for UI use
- Use design system color tokens — never hardcode hex inside illustrations
- Design dark mode variants — or use colors that adapt gracefully
- Maintain consistent stroke weight and corner radius across all illustrations
- Commit to one perspective per system (flat, slight 3/4, or straight-on)

---

## Brand Design

### The Brand Adaptation Principle

Brand consistency lives in **color, typography, illustration style, and motion feel** — not in forcing iOS patterns onto Android or vice versa.

Your brand exists at three fidelity levels on mobile:

- **App Icon**: First impression. Must read at 60×60pt on a cluttered home screen
- **Splash / Launch Screen**: 2-second brand moment. Logo on brand background. Simple
- **In-App Brand**: Color, typography, motion personality, illustration

### App Icon Specifications

| Platform | Size                       | Format          | Corner Radius                          |
| -------- | -------------------------- | --------------- | -------------------------------------- |
| iOS      | 1024×1024pt                | PNG, no alpha   | System applies (~22% continuous curve) |
| Android  | 108×108dp (18dp safe zone) | PNG or adaptive | Launcher-applied (varies by OEM)       |

**Icon design principles:**

- Legible at 60×60 — test small from day one
- Single focal element — one dominant shape, not a logotype
- Color contrast works on light, dark, and colorful wallpapers
- No text (except 1–2 letters if that is the mark)
- Unique silhouette — the shape alone should identify you

**Android Adaptive Icons — two layers required:**

1. **Background layer** (108×108dp): solid color or subtle texture, no important content
2. **Foreground layer** (108×108dp, safe zone 72×72dp): logo/symbol, centered in safe zone

### Brand Colors in Dark Mode

Brand colors stay fixed — they do not shift in dark mode. Surface colors shift to elevation-based tints. This anchors brand identity even when the interface is dark.

---

## Accessibility (Universal Floor)

These are non-negotiable on both platforms.

| Area                           | Requirement                                                 |
| ------------------------------ | ----------------------------------------------------------- |
| Touch targets                  | 48×48dp minimum everywhere                                  |
| Color contrast — text          | 4.5:1 (WCAG AA)                                             |
| Color contrast — UI components | 3:1                                                         |
| Screen reader                  | Label every interactive element — test VoiceOver + TalkBack |
| Focus order                    | Logical top-to-bottom, left-to-right                        |
| Error messages                 | Never color alone — always icon + text                      |
| Animations                     | Respect reduced motion preference                           |
| Text resizing                  | All layouts survive 200% font scale without data loss       |

### Accessible Labels

Every interactive element needs:

- **Accessible name** — a human action description, not the icon name ("Call emergency hotline" not "phone icon")
- **Role** — button, switch, link, etc.
- **Hint** — what happens on tap, when not obvious from the name

### Design Focus States Explicitly

Keyboard and switch access users exist on both platforms. Design focus rings and focus order before shipping — not as an afterthought.

---

## UX Research for Cross-Platform

### The Recruiting Rule

**Always recruit equal numbers of Android and iOS users.** Minimum 5 per platform. Mental models genuinely differ — Android users are more tolerant of drawer navigation; iOS users expect swipe-back as a primary gesture.

### Research by Phase

#### Discovery

| Method                           | Output                        |
| -------------------------------- | ----------------------------- |
| Competitive teardown (both OSes) | Platform Convention Audit doc |
| Platform mental model interviews | Navigation mental model map   |
| Jobs-to-be-done interviews       | JTBD map                      |
| Diary studies (1–2 weeks)        | Context of use report         |

#### Usability Testing Setup

- Physical devices only — never simulators
- Test on at least 2 iOS sizes (SE/standard + Pro Max) and 2 Android (budget + flagship)
- Record: screen + face + audio

**Metrics:**

- **TSR** — Task Success Rate: % who complete without assistance
- **ToT** — Time on Task: seconds per task
- **Error Rate** — wrong taps / total taps
- **SUS** — System Usability Scale: 0–100 (>68 = above average)

#### Ongoing Research

| Method            | Platform split                           | Signal                                    |
| ----------------- | ---------------------------------------- | ----------------------------------------- |
| Funnel analysis   | Always split by iOS vs Android           | Drop-off difference = navigation mismatch |
| Session recording | Filter by platform                       | Rage taps, unreachable areas              |
| A/B testing       | Analyze results split by platform        | Variant performance differs by OS         |
| App store reviews | Mine Play Store and App Store separately | Platform-specific complaints              |

### Insight Format

```
FINDING:        [Short headline]
EVIDENCE:       [What you observed / verbatim quote]
IMPACT:         [Why this matters to user / business]
RECOMMENDATION: [Specific design change]
PRIORITY:       Critical / Major / Minor
PLATFORM:       iOS only / Android only / Both
```

---

## Handoff & Documentation

### Designer → Developer Handoff Checklist

- [ ] All components annotated with platform-specific behavior notes
- [ ] Spacing in `dp`/`pt` — never `px`
- [ ] Dark mode specs alongside light mode
- [ ] All interaction states: default, pressed, focused, disabled, loading, error, success
- [ ] Motion specs: duration, easing curve, trigger condition
- [ ] Accessibility annotations: role, label, hint for every interactive element
- [ ] Edge case screens: empty states, error states, permission prompts, onboarding
- [ ] Content overflow: truncation rules, max line counts, scroll behavior
- [ ] Haptic moment specs for both platforms

### Assets Delivery

- Icons: SVG source + platform-compiled formats
- Illustrations: SVG primary + PNG fallbacks at 2x and 3x
- Color tokens: exported for the project's token pipeline
- Typography tokens: with platform mapping (iOS pt values, Android sp values)

---

## Design Critique Framework

Score every screen before shipping. Score below 7 = needs revision.

| Dimension                      | What to evaluate                                                                                                                      |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Visual Principles** (0–10)   | Critiqued from a screenshot against the eight principles (contrast, hierarchy, alignment, proximity, repetition, balance, white space, unity)? See `references/visual-design-principles.md`. |
| **Aesthetic Direction** (0–10) | Is there a clear, committed visual identity?                                                                                          |
| **Platform Nativeness** (0–10) | Does it use appropriate conventions for each platform?                                                                                |
| **Brand Consistency** (0–10)   | Is the brand clearly expressed regardless of platform?                                                                                |
| **Accessibility** (0–10)       | WCAG AA, touch targets, screen reader support                                                                                         |
| **Motion Quality** (0–10)      | Purposeful, consistent personality, reduced-motion handled?                                                                           |
| **Dark Mode** (0–10) BLOCKER   | Both modes designed + token contract satisfied + contrast verified in each mode + no raw hex. Score below 8 = revise before shipping. |
| **Edge Cases** (0–10)          | Empty states, errors, long text, small screens all designed?                                                                          |
| **Handoff Readiness** (0–10)   | Can a developer implement this without guessing?                                                                                      |

### Platform Parity Checklist (run before every release)

| Item                            | iOS                | Android         |
| ------------------------------- | ------------------ | --------------- |
| Tab bar style (blur vs solid)   | ✓                  | ✓               |
| Toggle style (green pill vs M3) | ✓                  | ✓               |
| Back navigation gesture works   | ✓                  | ✓               |
| Safe area insets respected      | ✓                  | ✓               |
| Status bar color correct        | ✓                  | ✓               |
| FAB visible                     | —                  | ✓               |
| Large Title collapses on scroll | ✓                  | —               |
| Segmented Control (iOS only)    | ✓                  | —               |
| Material Tab Bar (Android only) | —                  | ✓               |
| Search bar placement correct    | inline below title | expands app bar |

---

## Platform Specifications Reference

### iOS Device Dimensions

| Device              | Logical Resolution | Scale |
| ------------------- | ------------------ | ----- |
| iPhone SE (3rd gen) | 375×667pt          | @2x   |
| iPhone 14           | 390×844pt          | @3x   |
| iPhone 15           | 393×852pt          | @3x   |
| iPhone 15 Pro Max   | 430×932pt          | @3x   |
| iPhone 15 Plus      | 430×932pt          | @3x   |

### Android Device Dimensions

| Device          | Resolution (dp) | Density     |
| --------------- | --------------- | ----------- |
| Pixel 7         | 360×780         | xxhdpi (3x) |
| Pixel 8 Pro     | 412×915         | xxhdpi      |
| Samsung S24     | 360×780         | xxhdpi      |
| Budget (common) | 360×640         | xhdpi (2x)  |

### iOS Gesture Reference

| Gesture              | System Use          | Design Implication                            |
| -------------------- | ------------------- | --------------------------------------------- |
| Swipe from left edge | Back navigation     | Don't place interactive elements at left edge |
| Swipe down from top  | Notification Center | Don't use pull-down for in-app actions        |
| Swipe up from bottom | Home + App Switcher | Keep critical UI above bottom 34pt            |
| Long press           | Context menus       | Design context menu items                     |
| Pinch                | Zoom                | Only use if semantically appropriate          |

### Android Gesture Reference

| Gesture                    | System Use                    | Design Implication                         |
| -------------------------- | ----------------------------- | ------------------------------------------ |
| Swipe from left/right edge | Back (Gesture Nav)            | Don't use edge swipe for in-app navigation |
| Swipe up from bottom       | Home                          | Keep critical UI above bottom inset        |
| Long press                 | App shortcuts, selection mode | Design selection state for list items      |
| Two-finger swipe down      | Quick Settings                |                                            |

---

## Quick Decision Reference

| Question                      | Answer                                                                                                                |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Bottom sheet or modal?        | Sheet for contextual actions related to content. Modal for decisions interrupting the full flow.                      |
| Where does settings go?       | iOS: Tab item or Profile section. Android: Three-dot ⋮ overflow top right.                                            |
| How many tabs?                | Max 5 (iOS HIG hard limit). 5 is still ideal on Android.                                                              |
| FAB or no FAB?                | Android: 1 FAB per screen max. iOS: nav bar `+` or inline CTA.                                                        |
| Toast, snackbar, or alert?    | Transient → Snackbar (3–4s auto-dismiss). Action required → Alert. Persistent → Inline error.                         |
| iOS toggle or Android toggle? | Never use the same component for both. iOS: green pill (51×31pt). Android M3: outlined track → filled, thumb shows ✓. |
| Same border radius on both?   | No. Cards: iOS 16pt / Android 12dp. Sheets: iOS 20pt / Android 16dp. Never hardcode.                                  |
| Pull-to-refresh same?         | Same behavior, different visual. Never suppress iOS bounce.                                                           |
| Safe area handling?           | Use the project's safe area utility — never hardcode insets.                                                          |
| Keyboard avoidance?           | Use the platform's keyboard avoidance mechanism. Ensure focused inputs scroll into view on both platforms.            |

---

## Implementation Principles

These apply regardless of the project's tech stack.

- Keep screen entry files thin — composition only, no business logic
- Use flexbox-based layout — avoid fixed pixel dimensions for containers
- Use the window/screen dimension API the project provides rather than static constants
- Set line height explicitly — some mobile rendering engines do not inherit it
- Mark important data and error text as selectable/copyable
- Use tabular-nums for numeric counters to prevent layout jitter
- Extend tap areas on small visual elements without changing their visual size
- Use the platform's scroll container adjustments for safe area handling — never hardcode padding
- Express depth through color tinting in dark mode, not shadows

---

## Techniques by Discipline

### UX Designer

- **IA that works for both back models.** Every screen needs an explicit close/cancel affordance.
- **Split-platform usability testing.** Recruit equal iOS and Android cohorts.
- **Task completion analysis by platform.** Funnel drop-off split by OS reveals navigation mismatch.

### UI Designer

- **4-column fluid grid.** 16dp margins, 8dp gutters — works across screen sizes.
- **Platform-diverged toggles.** iOS: green pill (51×31pt). Android M3: outlined → filled. Never use the same component for both.
- **Navigation chrome divergence.** iOS: frosted tab bar (max 5 items). Android: solid bottom nav with pill indicator behind active icon.

### Interaction Designer

- **Spring physics universally.** Spring feels natural on both platforms.
- **Press feedback: scale 0.96, 100ms.** Applied to every tappable card, row, and button.
- **Haptic spec alongside motion spec.** Document the _when_ for both platforms in every interactive component.

### Design Systems Designer

- **Semantic color roles, not raw values.** `brand-primary`, `on-primary`, `surface`, `on-surface`. Platform adapts the shade; semantics stay constant.
- **Component variants for platform.** Track which components are universal vs. platform-specific.
- **Two border radius values per component.** `card-radius`: iOS 16pt, Android 12dp. `sheet-radius`: iOS 20pt, Android 16dp. Never hardcoded.

### Brand Designer

- **Brand is in the token layer.** Color, typeface choice, illustration style, and motion personality carry identity.
- **App icon design is a brand touchpoint.** iOS: 1024×1024pt. Android: adaptive icon with foreground + background layers, all content in 72dp safe zone.
- **Brand colors stay fixed in dark mode.** Only surfaces change.

### UX Writer

- **Action label conventions diverge.** iOS: sentence case ("See all →"). Android: uppercase ("SEE ALL").
- **Error messages are platform-agnostic.** Always: what happened, why, what to do next.
- **Accessible names are UX Writer territory.** Every interactive element needs a human action label, not the icon name.

### Motion Designer

- **Spring > linear easing.** Spring physics feel natural on both platforms.
- **Stagger entry animations.** Lists that fade+slide-up in sequence feel alive.
- **Reduced motion fallback is not optional.** Fallback: opacity only, 150ms.

### UX Researcher

- **Always equal iOS/Android cohorts.** Minimum 5 per platform.
- **Funnel analysis split by platform.** A 40% drop-off on Android vs 12% on iOS is a navigation mismatch.
- **App store review mining by platform.** Filter Play Store vs App Store reviews separately.

---

_All measurements in dp (Android) / pt (iOS). Never use raw px._
