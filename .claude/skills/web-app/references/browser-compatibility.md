# Browser Compatibility Watchouts

## Browser Compatibility Rules

Keep browser support aligned with the project compatibility target.

- Prefer stable, broadly supported platform features.
- Guard or progressively enhance newer APIs.
- Test critical user journeys when a change affects layout, media, forms, navigation, or browser APIs.
- Review compatibility guidance before adopting niche CSS or browser-only APIs.

---

Use this as a practical checklist when reviewing, building, or testing frontend work. Every item represents a real-world bug class that has caused production issues in modern web apps.

---

## Goal

Prevent browser-specific bugs, layout inconsistencies, broken interactions, and poor mobile behavior across major browsers. Catch these issues during development and code review — not after users report them.

---

## Browsers to Always Consider

| Browser           | Engine          | Key Risk Areas                                                                                        |
| ----------------- | --------------- | ----------------------------------------------------------------------------------------------------- |
| Chrome (Desktop)  | Blink/V8        | Baseline reference — fewest surprises                                                                 |
| Safari (Desktop)  | WebKit          | CSS differences (`backdrop-filter`, `position: sticky`, `gap` in flexbox), date inputs, clipboard API |
| Firefox (Desktop) | Gecko           | Form styling, scrollbar behavior, `overflow` edge cases                                               |
| Edge (Desktop)    | Blink/V8        | Generally matches Chrome; watch for enterprise policy overrides                                       |
| Safari on iPhone  | WebKit (forced) | Viewport height (`100vh`), fixed positioning with keyboard, autofill styling, media autoplay          |
| Chrome on Android | Blink/V8        | Soft keyboard viewport resize, `position: fixed` during scroll, back/forward cache                    |

**Important**: All iOS browsers (Chrome iOS, Firefox iOS, Edge iOS) use WebKit under the hood. Safari iOS bugs affect all iOS browsers.

---

## 1. Layout and CSS Watchouts

Agent should watch out for:

### Flexbox and Grid

- **Flexbox `gap`**: Supported in all modern browsers, but older Safari versions (pre-14.1) do not support `gap` in flexbox containers. Use `margin` fallback or check your support target.
- **CSS Grid `subgrid`**: Only supported in Firefox and Safari 16+. Chrome shipped support in 117+. Do not rely on it without a fallback.
- **`align-items: baseline`** behaves differently across engines when children have mixed content types (text + images).
- **`flex-shrink` and `min-width: auto`**: Flex children with overflow content may not shrink as expected. Apply `min-w-0` (`min-width: 0`) on flex children that contain text or scrollable content.

### Positioning

- **`position: sticky`**: Fails silently when any ancestor has `overflow: hidden`, `overflow: auto`, or `overflow: scroll`. This is the most common "sticky doesn't work" bug.
- **`position: fixed`** on iOS Safari: Jumps or disappears when the virtual keyboard opens. Fixed elements behave as `position: absolute` relative to the visual viewport during keyboard display.
- **`z-index` stacking contexts**: A `z-index` value only applies within its stacking context. Setting `transform`, `filter`, `will-change`, or `opacity < 1` on a parent creates a new stacking context. Modals, drawers, dropdowns, and popovers appearing behind other layers is almost always a stacking context issue.

### Viewport and Sizing

- **`100vh` on mobile**: Does not account for browser chrome (address bar, toolbar). The actual visible area is smaller. Use `100dvh` (dynamic viewport height) for elements that must fill the visible screen. Fallback: `min-height: 100vh` with JavaScript correction or `100svh`/`100lvh` where appropriate.
- **Viewport units**: `svh` (small), `lvh` (large), `dvh` (dynamic) — supported in all modern browsers since 2023, but verify your support matrix. Use `dvh` for full-screen modals and overlays.

### Visual Properties

- **`aspect-ratio`**: Supported in all modern browsers. On older Safari (pre-15), use the padding-top hack fallback.
- **`object-fit`**: Works consistently, but `object-fit: contain` can produce unexpected whitespace on non-matching aspect ratios. Verify visual result.
- **`backdrop-filter`**: Requires `-webkit-backdrop-filter` prefix for Safari. Performance impact on low-end devices. May render as fully transparent if the browser does not support it — always set a semi-opaque background color as fallback.
- **`-webkit-line-clamp`**: Requires `display: -webkit-box` and `-webkit-box-orient: vertical`. Works in all modern browsers but the syntax is non-standard. The `line-clamp` standard property is not widely supported yet.
- **Font rendering**: `-webkit-font-smoothing: antialiased` only works in Safari/Chrome on macOS. Firefox uses `moz-osx-font-smoothing: grayscale`. Text weight can appear different across engines.
- **`text-wrap: balance`**: Chrome 114+, Firefox 121+, Safari 17.4+. Do not rely on it for critical layout — treat as progressive enhancement.

### Hover

- **Hover-only interactions**: Touch devices do not have hover. Any UI that only appears on `:hover` (tooltips, dropdown triggers, secondary actions) is inaccessible on mobile. Always provide a tap/click alternative. Use `@media (hover: hover)` to scope hover-only styles.

---

## 2. Forms and Inputs Watchouts

Agent should watch out for:

### Styling

- **Native form elements** (input, select, textarea, checkbox, radio) have different default appearances across browsers and operating systems. Safari on macOS/iOS applies heavy native styling that overrides CSS. Use `appearance: none` and rebuild styling when consistent cross-browser appearance is required.
- **Autofill styling**: Chrome applies a distinct background color (`-webkit-autofill`) that overrides your design. The only reliable way to override it is:
  ```css
  input:-webkit-autofill {
    -webkit-box-shadow: 0 0 0 1000px var(--surface-color) inset;
    -webkit-text-fill-color: var(--text-color);
  }
  ```
  Safari and Firefox have different autofill visual behaviors.

### Behavior

- **Date and time inputs**: `<input type="date">` renders completely different UI across browsers. Safari desktop only added native date picker support in version 14.1. For consistent UX, prefer a JavaScript date picker (for example `react-day-picker`, `date-fns` + custom UI).
- **`<input type="number">`**: Firefox allows non-numeric text entry and validates on blur. Chrome blocks non-numeric input. Safari behavior varies. For reliable numeric-only input, use `inputMode="numeric"` with `pattern="[0-9]*"` on a text input.
- **File upload controls**: Cannot be styled consistently. The visual rendering of `<input type="file">` differs across every browser. Use a hidden file input with a styled button trigger.
- **Placeholder alignment**: Vertical alignment of placeholder text can differ by 1–2px across browsers. Do not rely on pixel-perfect placeholder alignment for layout.

### Mobile

- **Soft keyboard covering inputs**: On iOS Safari, `position: fixed` elements shift when the keyboard opens. Focused inputs near the bottom of the viewport may be hidden. Use `visualViewport` API or scroll-to-input logic.
- **Zoom on focus**: iOS Safari zooms in on inputs with `font-size < 16px`. Set `font-size: 16px` or larger on all inputs, or use `<meta name="viewport" content="..., maximum-scale=1">` (with accessibility trade-offs — prevents pinch zoom).

### Accessibility

- **Focus states**: Some browsers (especially Safari) do not show `:focus` outlines by default on buttons and links. Use `:focus-visible` for keyboard-only focus styling. Always verify visible focus in Safari.
- **Tab navigation**: Custom components (dropdowns, modals, accordions) must manage focus manually. Browsers do not automatically trap or move focus for custom UI.
- **Disabled and readonly**: Visual styling for `disabled` and `readonly` states differs across browsers. Explicitly style both states.

---

## 3. JavaScript and Browser API Watchouts

### Storage APIs

| API              | Safari Gotcha                                  | Fallback Strategy                         |
| ---------------- | ---------------------------------------------- | ----------------------------------------- |
| `localStorage`   | Throws in private browsing mode (older Safari) | Wrap in try/catch, use in-memory fallback |
| `sessionStorage` | Same as localStorage                           | Same strategy                             |
| `IndexedDB`      | Works but with quota quirks in Safari          | Check availability before use             |

### Observer APIs

| API                    | Support             | Notes                                       |
| ---------------------- | ------------------- | ------------------------------------------- |
| `IntersectionObserver` | All modern browsers | Polyfill only if supporting IE11 (unlikely) |
| `ResizeObserver`       | All modern browsers | Safari had bugs pre-15.4 with SVG elements  |
| `MutationObserver`     | All modern browsers | Performance concern with large DOM trees    |

### Clipboard and Share

- **`navigator.clipboard.writeText()`**: Requires a secure context (HTTPS) and user gesture (click handler). Fails silently in some browsers without gesture. Always check `navigator.clipboard` existence and catch errors.
- **`navigator.share()`**: Mobile-first API. Available on iOS Safari, Android Chrome. Limited desktop support (Chrome on Windows/ChromeOS). Always check `navigator.share` and provide a fallback (copy-to-clipboard).

### Other APIs

- **`Notification API`**: Requires permission. Safari supports web push notifications only since macOS Ventura + Safari 16. iOS web push requires a PWA (added to Home Screen) on iOS 16.4+.
- **Drag and drop**: HTML5 drag/drop does not work on mobile touch devices. Use a touch-compatible library (for example `@dnd-kit/core`, `react-beautiful-dnd`) for mobile support.
- **Service Workers**: Fully supported in all modern browsers. Safari had aggressive cache eviction (7-day limit) for service worker caches, which was relaxed in recent versions but still shorter than Chrome.

### General

- Code assuming API support without fallback — always check existence: `if ('share' in navigator) { ... }`
- Browser permissions causing failures — wrap in try/catch and provide user-facing fallback
- Features breaking silently in unsupported browsers — log the failure for debugging
- Browser-only globals (`window`, `document`, `navigator`) causing SSR or hydration issues — gate behind `typeof window !== 'undefined'` or `useEffect`
- `Intl.DateTimeFormat`, `Intl.NumberFormat`: Locale-specific formatting differences exist. Always specify explicit locale and options rather than relying on browser defaults. Safari has historically lagged in `Intl` feature support.

---

## 4. Mobile Browser Watchouts

Agent should watch out for:

- **iOS Safari viewport height**: `100vh` includes the area behind the address bar. Use `100dvh` or JavaScript `visualViewport.height`.
- **Sticky/fixed headers during scroll**: iOS Safari hides/shows the toolbar during scroll, causing `position: fixed` elements to jump. Use `position: sticky` or `dvh` units where possible.
- **Soft keyboard interactions**: Bottom sheets, modals, and fixed footers break when the soft keyboard opens on iOS. The keyboard pushes the visual viewport up, not the layout viewport. Use `visualViewport` API to detect keyboard presence.
- **Touch vs mouse**: Touch events (`touchstart`, `touchend`) fire before click events (~300ms delay on older browsers, now mostly eliminated). Pointer Events (`pointerdown`, `pointerup`) unify mouse/touch/pen. Prefer `onClick` in React (handles both) and Pointer Events for custom gesture handling.
- **`:hover` on touch**: `:hover` state becomes "sticky" on iOS — tapping an element triggers hover, and it stays until tapping elsewhere. Use `@media (hover: hover)` to scope hover-only styles.
- **Tap targets**: WCAG minimum is 24×24px; Google recommends 48×48px. Buttons, links, and interactive elements that are too small cause mis-taps. Especially critical on forms and navigation.
- **Horizontal overflow on small screens**: Any element with `min-width`, `width` in pixels, or non-wrapping flex/grid can cause horizontal scroll on mobile. Treat horizontal scroll as a bug unless explicitly intended (for example horizontal scroll carousel).
- **Safe area insets**: Devices with notches (iPhone X+) require `env(safe-area-inset-*)` for content that sits at screen edges. Use `padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)` on edge-to-edge layouts.
- **Autoplay restrictions**: iOS and Android block autoplay for `<video>` and `<audio>` with sound unless the user has interacted with the page. Muted autoplay works. Always check and handle autoplay failure.
- **Scroll locking**: `overflow: hidden` on `body` does not prevent scroll on iOS Safari. Use `position: fixed` + `top` offset technique, or a library like `body-scroll-lock`, for reliable modal scroll locking.

---

## 5. Interaction and UI Behavior Watchouts

Agent should watch out for:

- **Dropdowns**: Custom dropdown menus must handle click-outside-to-close, Escape key, and arrow key navigation. Native `<select>` renders differently per browser but handles these automatically. Radix UI / Headless UI handle this correctly.
- **Modals**: Must trap focus (Tab cycles within modal), handle Escape to close, prevent background scroll, and return focus to trigger on close. Screen reader must announce the modal. Use `dialog` element or a modal library with proper ARIA.
- **Tooltips**: Must be accessible via keyboard (focus, not just hover). Consider `aria-describedby`. On mobile, tooltips typically show on long-press or are replaced by inline text.
- **Accordions and tabs**: Must support arrow keys for navigation between items, Enter/Space to toggle, and `aria-expanded`/`aria-selected` for screen readers.
- **Smooth scrolling**: `scroll-behavior: smooth` is supported in all modern browsers but can be jarring for users with motion sensitivity. Respect `prefers-reduced-motion: reduce` by disabling smooth scrolling.
- **Anchor links behind sticky headers**: When navigating to `#section`, the browser scrolls the element to the top — behind a sticky header. Use `scroll-margin-top` on target elements equal to the header height.
- **Click handlers on touch devices**: Avoid using `mousedown`/`mouseup` — use `onClick` or Pointer Events. Some click events can fire twice on touch devices if both `touchend` and `click` are handled.
- **Drag interactions**: HTML5 drag/drop does not work on touch. Use Pointer Events or a dedicated library for cross-device drag support.
- **CSS transitions/animations**: `transition` on `height: auto` does not work. Use `max-height` or explicit pixel values, or use the `<details>`/`<summary>` element pattern. `requestAnimationFrame` timing varies subtly across browsers.

---

## 6. Media and Asset Watchouts

Agent should watch out for:

- **Image stretching/cropping**: Always use `object-fit: cover` or `object-fit: contain` on images in constrained containers. Without it, images stretch to fill the container. `next/image` handles this automatically with the `fill` prop + `object-fit`.
- **SVG rendering**: SVGs without explicit `width`/`height` attributes or `viewBox` may render at 0×0 or inconsistent sizes across browsers. Always include `viewBox` and set explicit dimensions or use CSS sizing.
- **Web fonts**: Font files load asynchronously. Use `font-display: swap` to show fallback text immediately, or `font-display: optional` to prevent layout shift entirely (at the cost of sometimes not showing the custom font). `next/font` handles this automatically.
- **Fallback font metrics**: System font fallback (`Arial`, `Helvetica`, `sans-serif`) has different metrics (line-height, character width) than custom fonts, causing CLS when the custom font loads. Use `next/font` `adjustFontFallback` or `@font-face` `size-adjust` to minimize shift.
- **Video autoplay**: Muted autoplay works cross-browser. Autoplay with sound requires user interaction. Always handle the rejected promise from `video.play()`.
- **Audio playback**: Same autoplay restrictions as video. iOS requires user interaction even for `Audio()` constructor playback.
- **Downloads**: `<a download>` behavior varies — Safari sometimes opens the file instead of downloading. Chrome on Android may show a download prompt. Test download flows on target browsers.
- **Lazy-loaded images**: Using `loading="lazy"` on above-the-fold images hurts LCP. Only lazy-load below-the-fold images. `next/image` with `priority` handles this correctly.

---

## 7. Accessibility and Compatibility Watchouts

Agent should watch out for:

- **Focus indicators**: Safari does not show `:focus` outlines on buttons by default. Use `:focus-visible` with an explicit outline style. Ensure focus ring is visible on all interactive elements. `outline-offset: 2px` with a solid outline works cross-browser.
- **Keyboard navigation**: All interactive elements must be reachable via Tab. Custom components (menus, dialogs, tabs, trees) must implement proper `role`, `aria-*` attributes, and keyboard handlers (Arrow keys, Enter, Space, Escape, Home, End).
- **Semantic HTML**: Screen readers rely on semantic elements (`nav`, `main`, `article`, `aside`, `header`, `footer`, `section`, `h1`–`h6`, `button`, `a`, `ul`/`ol`/`li`, `table`). Using `<div>` with click handlers instead of `<button>` breaks keyboard and screen reader access.
- **Screen reader engines**: VoiceOver (Safari), NVDA/JAWS (Windows + Chrome/Firefox), TalkBack (Android Chrome). Each interprets ARIA differently. Test with at least VoiceOver + Chrome/Safari for macOS development.
- **Zoom behavior**: Layout must remain usable at 200% zoom (WCAG 1.4.4). Fixed-width containers, `overflow: hidden`, and absolute positioning commonly break at high zoom levels.
- **`prefers-reduced-motion`**: Users who set "Reduce motion" in OS settings expect animations to be minimal or disabled. Use `@media (prefers-reduced-motion: reduce)` to disable transitions, auto-playing animations, and smooth scrolling.
- **`prefers-color-scheme`**: If supporting dark mode via media query, ensure all UI states (hover, focus, disabled, error) are tested in both light and dark themes. Contrast ratios must meet WCAG AA (4.5:1 for text, 3:1 for large text/UI components) in both themes.
- **Low contrast from autofill/browser defaults**: Browser-applied autofill backgrounds, default link colors, and form element borders can break contrast requirements. Override explicitly.

---

## 8. Performance and Stability Watchouts

Agent should watch out for:

- **Layout shifts during page load (CLS)**: Images without dimensions, fonts loading late, injected banners/toasts, and dynamically loaded content above the fold all cause CLS. Reserve space with explicit dimensions, `aspect-ratio`, or skeleton placeholders.
- **Hydration mismatches (Next.js/SSR)**: Any difference between server-rendered HTML and first client render causes hydration errors. Common causes: `Date.now()`, `Math.random()`, `window.innerWidth` in render, conditional rendering based on `typeof window`. Fix by deferring browser-only values to `useEffect`.
- **Browser-specific rendering glitches**: Safari has known issues with `position: sticky` inside `overflow: auto` containers, `backdrop-filter` on certain transform contexts, and CSS Grid rendering with `subgrid`. Test critical layouts in Safari.
- **Large lists causing lag**: Rendering 1000+ DOM nodes causes scroll jank, especially on mobile. Use virtualization (`react-window`, `@tanstack/virtual`, `react-virtuoso`) for large lists.
- **Expensive scroll listeners**: Scroll event handlers fire at 60+ fps. Use `IntersectionObserver` instead of scroll listeners where possible. If a scroll listener is necessary, throttle it and use `passive: true`.
- **Animations causing frame drops**: CSS `transform` and `opacity` animations are GPU-accelerated. Animating `width`, `height`, `top`, `left`, `margin`, `padding` causes layout recalculation and drops frames, especially on mobile.
- **Re-renders in weaker browsers/devices**: Performance issues that are invisible on a fast desktop Mac become painful on mid-range Android phones. Profile with Chrome DevTools CPU throttling (4× slowdown) to simulate real-world conditions.

---

## 9. Real Components to Test

Agent should always test these in real browsers, prioritized by breakage frequency:

### Critical (break most often)

- Modal / Dialog — focus trap, scroll lock, z-index, mobile keyboard
- Dropdown / Combobox — click outside, scroll within, z-index
- Navigation / Sidebar — responsive layout, hamburger menu, mobile drawer
- Form inputs — autofill, date picker, number input, file upload, validation messages

### High Priority

- Sticky header — scroll behavior, content overlap, mobile toolbar interaction
- Tabs / Accordion — keyboard navigation, ARIA, content height changes
- Toast / Notification — positioning, stacking, animation, auto-dismiss
- Carousel / Slider — touch swipe, pagination, autoplay

### Standard

- Cards / Grid layouts — responsive columns, overflow, image aspect ratios
- Tables — horizontal scroll, mobile stacking, sort/filter interactions
- Tooltips / Popovers — positioning (viewport edge), touch behavior
- Date picker — browser native vs custom, timezone handling
- File upload — drag/drop, preview, progress, error states

---

## 10. Safe Compatibility Practices

Agent should:

- **Prefer feature detection over browser detection**: Use `if ('IntersectionObserver' in window)` instead of `if (isSafari)`. Browser detection (user agent sniffing) is unreliable and breaks when browsers update.
- **Use `@supports` for CSS feature detection**: `@supports (backdrop-filter: blur(10px)) { ... }` applies styles only when the browser supports them.
- **Add fallback behavior for unsupported features**: Every modern API usage should have a graceful degradation path. Users on unsupported browsers should still get core functionality.
- **Test on real devices**: Browser DevTools device emulation does not catch iOS-specific bugs (viewport height, keyboard behavior, gesture handling). Use BrowserStack, Sauce Labs, or real devices for critical flows.
- **Test actual user flows**: Click through complete flows (signup → form → submit → success state) on each browser, not just static page loads.
- **Retest after Safari-specific fixes**: Safari CSS/JS fixes often introduce side effects in Chrome or Firefox. Always cross-browser verify after targeted fixes.
- **Verify forms, scrolling, overlays, and responsive layouts**: These are the four most common browser-specific breakage categories.
- **Check Can I Use (caniuse.com)**: Before using any CSS property or Web API that might have limited support, verify current support levels.

---

## 11. Common High-Risk Areas

These usually break first, ranked by frequency of production issues:

1. **Safari CSS behavior** — `position: sticky` failures, `backdrop-filter` rendering, flexbox `gap` (older versions), `line-clamp` syntax
2. **Mobile viewport height** — `100vh` not matching visible area, keyboard opening changes
3. **Modal/overlay scroll lock** — Background scrolling on iOS, focus trap failures
4. **Form styling and autofill** — Chrome autofill background, Safari native input styling, date input inconsistencies
5. **`z-index` layering** — Modals behind headers, dropdowns behind content, stacking context creation
6. **Hover-dependent UI** — Tooltips, secondary menus, action buttons visible only on hover
7. **Fixed/sticky positioning** — iOS keyboard pushing elements, sticky inside overflow containers
8. **Clipboard and share APIs** — Permission requirements, secure context requirements, missing fallbacks
9. **Touch interactions** — Drag/drop not working, double-tap zoom, swipe conflicts
10. **Image/font loading CLS** — Missing dimensions, font swap causing reflow

---

## 12. Review Rule for Agents

Before approving frontend work, agent should confirm:

- [ ] Layout is stable across Chrome, Safari, Firefox, and Edge — no broken grids, overflows, or collapsed sections
- [ ] Forms are usable and visually consistent across browsers — autofill, validation, keyboard behavior
- [ ] Interactions work on both mouse and touch devices — no hover-only critical paths
- [ ] Unsupported APIs have fallback or graceful handling — clipboard, share, notifications
- [ ] Mobile viewport issues are handled — `100dvh`, safe area insets, keyboard interactions
- [ ] No critical Safari-only bugs — sticky, backdrop-filter, z-index, form styling
- [ ] Accessibility is not broken by browser differences — focus states visible, keyboard navigation works, screen reader compatibility
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Images and media have explicit dimensions to prevent CLS

---

## Quick Approval Checklist

### Cross-Browser Layout

- [ ] Works in Chrome
- [ ] Works in Safari
- [ ] Works in Firefox
- [ ] Works in Edge
- [ ] Works on iPhone Safari
- [ ] Works on Android Chrome
- [ ] No broken layout at 375px, 768px, 1280px
- [ ] No hidden overflow issues causing horizontal scroll

### Interaction & Forms

- [ ] Sticky/fixed header works correctly during scroll and keyboard open
- [ ] Forms behave correctly — autofill, validation, date inputs, file upload
- [ ] Focus states are visible in all browsers (especially Safari)
- [ ] Modals and dropdowns layer correctly (z-index)
- [ ] Mobile keyboard does not hide focused inputs

### APIs & Progressive Enhancement

- [ ] New browser APIs have existence check and fallback
- [ ] No hover-only critical interaction
- [ ] No hydration or rendering mismatch between server and client

### Performance & Accessibility

- [ ] Images have explicit dimensions or aspect-ratio
- [ ] Animations respect `prefers-reduced-motion`
- [ ] All interactive elements reachable via keyboard
- [ ] Contrast ratios meet WCAG AA minimums

---

## Related References

- `references/responsive-design.md` — the breakpoint and mobile layout rules these watchouts protect
- `references/accessibility.md` — keyboard and focus rules that overlap § 7
- `references/core-web-vitals.md` — performance and stability overlap with § 8
