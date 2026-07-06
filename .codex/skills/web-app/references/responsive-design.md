# Responsive Design

## Theme Support Rules

If a task, design, or requirement includes both light theme and dark theme, implement both during the initial build.

- Ensure text, icons, borders, surfaces, backgrounds, shadows, overlays, and interaction states are properly styled for both themes.
- Do not leave any element partially themed or dependent on default colors that only work in one mode.
- Prefer theme-aware tokens, variables, or semantic classes over hardcoded color values.
- Ensure both themes are visually consistent, readable, accessible, and production-ready upon creation.

---

## Styling and Design System Rules

Keep styling consistent with the design system.

- Avoid arbitrary values in utility classes and avoid inline styles for layout, spacing, and sizing unless there is a strong reason.
- Prefer tokens, semantic utility classes, or canonical shared classes.
- When the project provides a class-mapping utility such as `suggestCanonicalClasses`, use it to map semantic intent to canonical classes.
- Always prefer the canonical Tailwind class over the arbitrary-value equivalent (e.g. use `min-w-60` not `min-w-[240px]`).
- Prefer existing design-system components and spacing scales over one-off styling decisions.
- Do not extract `className` strings into variables — apply classes directly on the element.
- Shared table-facing copy belongs in the reusable table layer. Keep derived labels such as filter summaries, record counts, empty-state descriptions, and default table empty states inside `DataTable` or its typed config instead of rebuilding them in each feature page.
- For feature pages using `DataTable`, define table configuration directly in the `<DataTable />` props. Keep columns, `filter.entries`, search, and pagination inline at the callsite.

---

## Responsive Design Standards

Responsive behavior is mandatory for user-facing UI.

- Do not rely on fixed page widths. Prefer `max-width`, fluid width, and responsive padding.
- Collapse multi-column layouts appropriately on smaller screens.
- Prevent horizontal overflow.
- For dense tables, put horizontal scrolling on the table content region, not the page shell.
- Scale typography for mobile readability.
- Keep tap targets large enough for touch interaction.
- Stack or wrap button groups when horizontal space is limited.
- Make forms mobile-friendly and full-width where appropriate.
- Provide a mobile strategy for tables and dense content.
- Ensure modals and drawers fit within the viewport and allow internal scrolling when necessary.
- Ensure images and media scale correctly without distortion.
- Responsive regressions should be treated as bugs.

---

This project uses Tailwind CSS with a mobile-first approach. Default styles target `375px`; responsive modifiers (`md:`, `lg:`, `xl:`) build up from there.

---

## Table of Contents

1. [Breakpoints](#breakpoints)
2. [Global Rules](#global-rules)
3. [Layout and Containers](#layout-and-containers)
4. [Grid and Flex Behavior](#grid-and-flex-behavior)
5. [Typography](#typography)
6. [Images and Media](#images-and-media)
7. [Buttons and Tap Targets](#buttons-and-tap-targets)
8. [Navigation](#navigation)
9. [Forms](#forms)
10. [Tables and Dense Content](#tables-and-dense-content)
11. [Cards and Content Blocks](#cards-and-content-blocks)
12. [Overflows and Breakpoints](#overflows-and-breakpoints)
13. [Modals, Drawers, Popups](#modals-drawers-popups)
14. [Performance-Related Responsiveness](#performance-related-responsiveness)
15. [Review Checklist](#review-checklist)

---

## Breakpoints

| Token | Width  | Target             | Notes                                            |
| ----- | ------ | ------------------ | ------------------------------------------------ |
| `sm`  | 375px  | Mobile (small)     | Design baseline — all layouts must work here     |
| `md`  | 768px  | Tablet (portrait)  | Grid expansion point, side-by-side layouts begin |
| `lg`  | 1040px | Tablet (landscape) | Full navigation visible, wider content areas     |
| `xl`  | 1280px | Desktop            | Primary desktop breakpoint                       |
| `2xl` | 1536px | Large desktop      | Optional — extra columns or wider containers     |

---

## Global Rules

| Rule                                   | Purpose                                                        |
| -------------------------------------- | -------------------------------------------------------------- |
| `html, body { overflow-x: hidden; }`   | Safety net — should not be needed if components are responsive |
| `img, video, svg { max-width: 100%; }` | All media constrained by default                               |

These live in `apps/*-admin/app/globals.css`. They are guards, not substitutes for component-level responsiveness.

---

## Layout and Containers

### Container Width

| Pattern                                          | Status     | Why                                          |
| ------------------------------------------------ | ---------- | -------------------------------------------- |
| `width: 1200px`                                  | ❌ Never   | Overflows on any screen narrower than 1200px |
| `max-width: 1200px` + `width: 100%`              | ✅ Correct | Scales down, caps at max                     |
| `max-width` + `width: 100%` + responsive padding | ✅ Best    | Scales down with breathing room on edges     |

```tsx
<div className="w-full max-w-7xl mx-auto px-4 md:px-8">
```

### Spacing Scale

| Breakpoint          | Padding | Gap     | Section margin |
| ------------------- | ------- | ------- | -------------- |
| Mobile (<768px)     | `px-4`  | `gap-3` | `py-6`         |
| Tablet (768–1040px) | `px-6`  | `gap-4` | `py-8`         |
| Desktop (>1040px)   | `px-8`  | `gap-6` | `py-12`        |

### Section Stacking

| Desktop                | Mobile                                            |
| ---------------------- | ------------------------------------------------- |
| Side-by-side (row)     | Stack vertically — `flex-col md:flex-row`         |
| Image left, text right | Image on top, text below — preserve reading order |
| Sidebar + content      | Sidebar collapses into drawer                     |

---

## Grid and Flex Behavior

### Grid Column Breakpoints

| Content type       | Mobile | Tablet | Desktop |
| ------------------ | ------ | ------ | ------- |
| Product cards      | 2      | 3      | 4–5     |
| Category cards     | 2      | 3      | 6       |
| Blog/article cards | 1      | 2      | 3       |
| Dashboard widgets  | 1      | 2      | 3–4     |
| Form sections      | 1      | 1–2    | 2       |
| Image gallery      | 2      | 3      | 4       |

```tsx
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
```

Cards must not go below ~140px wide.

### Flex Rows → Columns

```tsx
<div className="flex flex-col md:flex-row gap-4">
  <div className="md:w-1/2">Left</div>
  <div className="md:w-1/2">Right</div>
</div>
```

Watch for `flex-wrap: nowrap` squeezing items — always use `flex-wrap` or switch to `flex-col`.

### Flex Wrapping

Chips, tags, and button groups must wrap:

```tsx
/* ✅ wraps to next line */
<div className="flex flex-wrap gap-2">
  {tags.map((tag) => (
    <Badge key={tag}>{tag}</Badge>
  ))}
</div>
```

### Content Ordering

```tsx
/* Image first on mobile, second on desktop */
<div className="flex flex-col md:flex-row">
  <div className="order-2 md:order-1">Text</div>
  <div className="order-1 md:order-2"><Image ... /></div>
</div>
```

### Flex Child Overflow

Add `min-w-0` when a flex child contains text that could exceed the container:

```tsx
<div className="flex gap-2">
  <div className="min-w-0 flex-1 truncate">{longTitle}</div>
  <Badge>New</Badge>
</div>
```

---

## Typography

### Font Size Scaling

| Element         | Mobile  | Tablet  | Desktop | Tailwind                           |
| --------------- | ------- | ------- | ------- | ---------------------------------- |
| H1 (hero)       | 24–28px | 32–36px | 40–48px | `text-2xl md:text-4xl lg:text-5xl` |
| H2 (section)    | 20–24px | 24–28px | 28–32px | `text-xl md:text-2xl lg:text-3xl`  |
| H3 (card title) | 16–18px | 18–20px | 20px    | `text-base md:text-lg`             |
| Body            | 14–16px | 16px    | 16px    | `text-sm md:text-base`             |
| Caption         | 12–13px | 13–14px | 14px    | `text-xs md:text-sm`               |

A 48px H1 that pushes all content below the fold on mobile is a bug.

### Line Length

- Max ~65–75 characters for body text (`max-w-prose`)
- Use `leading-relaxed` on mobile for readability

### Text Overflow

```tsx
<p className="truncate">{longTitle}</p>        {/* single line + ellipsis */}
<p className="line-clamp-2">{description}</p>  {/* two lines + ellipsis */}
<p className="break-words">{longUrl}</p>        {/* wrap long strings */}
```

---

## Images and Media

### Responsive Images

| Rule                  | Implementation                                             |
| --------------------- | ---------------------------------------------------------- |
| Scale with container  | `w-full h-auto`                                            |
| Preserve aspect ratio | `object-cover` or `object-fit: contain`                    |
| Reserve dimensions    | `aspect-ratio` or explicit `width`/`height` to prevent CLS |

```tsx
<div className="relative aspect-[16/9] w-full">
  <Image
    src={heroImage}
    alt="Hero"
    fill
    className="object-cover"
    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 1200px"
    priority
  />
</div>
```

### Image Sizes by Breakpoint

| Element            | `sizes` value                   |
| ------------------ | ------------------------------- |
| Hero banner        | `100vw`                         |
| Card in 2-col grid | `(max-width: 768px) 50vw, 25vw` |
| Thumbnail / avatar | `40px`                          |

Don't send 2000px desktop images to a 375px screen.

### Video Embeds

```tsx
/* ✅ responsive 16:9 iframe */
<div className="relative w-full aspect-video">
  <iframe
    src={videoUrl}
    className="absolute inset-0 w-full h-full"
    allowFullScreen
  />
</div>
```

### Carousels

- Must support swipe on touch devices
- Autoplay should pause on touch/interaction

---

## Buttons and Tap Targets

### Minimum Size

| Guideline         | Minimum      |
| ----------------- | ------------ |
| Apple HIG         | 44×44pt      |
| Material Design   | 48×48dp      |
| WCAG 2.5.5 (AAA)  | 44×44 CSS px |
| Practical minimum | 40×40px      |

```tsx
/* ✅ icon button with proper tap target */
<button className="p-3 min-w-[44px] min-h-[44px]" aria-label="Delete">
  <TrashIcon className="w-5 h-5" />
</button>
```

Maintain at least 8px gap between interactive elements to prevent mis-taps.

### Button Groups

```tsx
<div className="flex flex-col sm:flex-row gap-2">
  <Button className="w-full sm:w-auto">Save</Button>
  <Button variant="ghost" className="w-full sm:w-auto">
    Cancel
  </Button>
</div>
```

### Sticky CTA

When a primary CTA is below the fold on mobile, consider a sticky bar:

```tsx
<div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t md:hidden">
  <Button className="w-full">Add to Cart</Button>
</div>
```

---

## Navigation

### Navbar Patterns

| Screen size         | Pattern                                    |
| ------------------- | ------------------------------------------ |
| Mobile (<768px)     | Hamburger → `<Sheet>` or `<Dialog>` drawer |
| Tablet (768–1040px) | Collapsed nav or icon-only labels          |
| Desktop (>1040px)   | Full horizontal nav                        |

**Rules:**

- Logo and menu button must never collide
- Hamburger tap target must be ≥44×44px
- Mobile drawer must be full-height with internal scroll

### Dropdowns

- Must open within the viewport — not extending beyond screen edges
- Must be touch-friendly — no hover-only triggers
- Close on tap outside, Escape, or back button

### Sticky Headers

| Rule                       | Why                                       |
| -------------------------- | ----------------------------------------- |
| Must not cover content     | Users can't read what's behind            |
| Must not block form inputs | Keyboard + sticky header = hidden input   |
| Should be thin on mobile   | 80px+ headers eat too much vertical space |

---

## Forms

### Layout Transitions

| Desktop                          | Mobile                     |
| -------------------------------- | -------------------------- |
| 2-column fields                  | 1-column — always collapse |
| Label beside input               | Label above input          |
| Inline button groups             | Stacked full-width buttons |
| Horizontal radio/checkbox groups | Vertical stack             |

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <Field.Root>
    <Field.Label htmlFor="first-name">First name</Field.Label>
    <Input id="first-name" className="w-full" />
  </Field.Root>
  <Field.Root>
    <Field.Label htmlFor="last-name">Last name</Field.Label>
    <Input id="last-name" className="w-full" />
  </Field.Root>
</div>
```

### Mobile Input Types

| Field  | Type                  | Mobile keyboard      |
| ------ | --------------------- | -------------------- |
| Email  | `type="email"`        | Shows `@` key        |
| Phone  | `type="tel"`          | Numeric pad          |
| Number | `inputMode="numeric"` | Numeric pad          |
| URL    | `type="url"`          | Shows `/` and `.com` |
| Search | `type="search"`       | Search button        |

### Error Messages

- Must appear below the input, not beside it
- Must wrap — long error text should not break layout
- Must remain visible when the keyboard is open

---

## Tables and Dense Content

### Mobile Strategies

| Strategy          | When                          | Implementation                             |
| ----------------- | ----------------------------- | ------------------------------------------ |
| Horizontal scroll | Data tables with many columns | `<div className="overflow-x-auto"><table>` |
| Stacked cards     | Entity tables (users, orders) | Transform each row into a card             |
| Hidden columns    | Low-priority columns          | `className="hidden md:table-cell"`         |
| Accordion rows    | Detail-heavy rows             | Summary on mobile, expand for details      |

```tsx
<div className="overflow-x-auto -mx-4 px-4">
  <table className="min-w-[600px] w-full">...</table>
</div>

<th className="hidden md:table-cell">Created</th>
<th className="hidden lg:table-cell">Category</th>
```

**Rule:** Data grids must not cause horizontal page overflow. Tables scroll within their container; the page scrolls vertically.

---

## Cards and Content Blocks

| Aspect | Rule                                               |
| ------ | -------------------------------------------------- |
| Width  | `w-full` within grid — never fixed                 |
| Text   | `truncate`, `line-clamp-2`, or `break-words`       |
| Image  | `w-full h-auto object-cover` with aspect-ratio     |
| Grid   | `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`        |
| Height | Must tolerate unequal content — use auto-rows grid |

```tsx
<div className="rounded-lg border bg-card overflow-hidden">
  <div className="aspect-[4/3] relative">
    <Image src={image} alt={title} fill className="object-cover" />
  </div>
  <div className="p-3 md:p-4">
    <h3 className="text-sm md:text-base font-medium line-clamp-2">{title}</h3>
    <p className="text-xs md:text-sm text-muted-foreground mt-1 truncate">
      {subtitle}
    </p>
  </div>
</div>
```

---

## Overflows and Breakpoints

### Common Overflow Sources

| Source                                    | Fix                          |
| ----------------------------------------- | ---------------------------- |
| Fixed-width elements                      | `w-full` or `max-w-full`     |
| Long URLs / unbreakable strings           | `break-words` or `break-all` |
| Pre-formatted code blocks                 | `overflow-x-auto` wrapper    |
| Absolute-positioned elements              | Audit mobile positioning     |
| Negative margins without matching padding | `overflow-hidden` wrapper    |
| Horizontal flex without wrapping          | Add `flex-wrap`              |

**Principle:** Any element causing sideways page scroll is a bug unless it's an intentional scroll container.

### Debugging Overflows

```css
/* Temporarily outline everything to find the culprit */
* {
  outline: 1px solid red !important;
}
```

Or: Chrome DevTools → Elements panel → scroll right to find the overflowing element.

---

## Modals, Drawers, Popups

### Modal Responsive Behavior

| Aspect            | Desktop              | Mobile                                |
| ----------------- | -------------------- | ------------------------------------- |
| Width             | `max-w-lg` centered  | Full-width `mx-4` or fullscreen sheet |
| Height            | Auto with max-height | `max-h-[90vh]` with internal scroll   |
| Close button      | Top-right, ≥44px     | Visible and ≥44px tap target          |
| Background scroll | Locked               | Locked — prevent scroll passthrough   |

```tsx
<Dialog>
  <DialogContent className="w-full max-w-lg mx-4 md:mx-auto max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Confirm</DialogTitle>
      <DialogClose className="min-w-[44px] min-h-[44px]" />
    </DialogHeader>
    <div className="p-4 md:p-6">{/* Content */}</div>
    <DialogFooter className="flex flex-col sm:flex-row gap-2">
      <Button className="w-full sm:w-auto">Confirm</Button>
      <Button variant="ghost" className="w-full sm:w-auto">
        Cancel
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Bottom Sheets (Mobile-Preferred)

For mobile, bottom sheets are often better UX than centered modals:

- Easier thumb reach for close/confirm
- Natural swipe-to-dismiss
- Full width on mobile, modal on desktop

---

## Performance-Related Responsiveness

### Lazy Loading

- Lazy-load images and content below the fold
- Never lazy-load the hero image or primary CTA
- Use `loading="lazy"` on `<img>` or Next.js `Image` default
- Consider virtual lists (`react-window`) for 100+ items

### Carousel Height

Use `clamp()` for smooth scaling between breakpoints:

```css
height: clamp(200px, 40vw, 400px);
```

---

## Review Checklist

Before shipping any user-facing UI change:

| Check                                                          | How to verify                                      |
| -------------------------------------------------------------- | -------------------------------------------------- |
| ☐ No horizontal overflow at 375px                              | DevTools → responsive mode → 375px                 |
| ☐ Readable typography (body ≥14px, headings scaled)            | Visual inspection at mobile width                  |
| ☐ Tap targets ≥40px                                            | DevTools → inspect button/link dimensions          |
| ☐ No fixed widths causing overflow                             | Grep for `width:` in new/changed code              |
| ☐ Flex children use `min-w-0` where needed                     | Check flex children with dynamic text              |
| ☐ Correct stacking order (content, image, CTA)                 | Check mobile layout reading order                  |
| ☐ Responsive images with correct `sizes`                       | Network tab → image sizes at mobile                |
| ☐ Forms usable on touch (input types, label positions, errors) | Test at mobile width                               |
| ☐ Navigation accessible (hamburger, drawer, no hover-only)     | Tap through nav at mobile width                    |
| ☐ Tables don't break page layout                               | Verify table-local scroll vs. page overflow        |
| ☐ Modals fit mobile viewport                                   | Open at 375px — close button and scroll work       |
| ☐ Cards shrink cleanly in grid                                 | Check text truncation and image ratio at 375px     |
| ☐ Sticky elements don't block content                          | Scroll with sticky header — content still readable |
| ☐ Test at 375px, 768px, 1040px, 1280px                         | All major breakpoints pass                         |

---

## Related References

- `references/accessibility.md` — tap targets, focus, and contrast rules that pair with these standards
- `references/browser-compatibility.md` — cross-browser layout watchouts
- `references/core-web-vitals.md` — CLS-stable responsive layouts
