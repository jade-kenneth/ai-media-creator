# Responsive Design Patterns

## Table of Contents

1. [Layout and Containers](#layout-and-containers)
2. [Grid and Flex Behavior](#grid-and-flex-behavior)
3. [Typography](#typography-text)
4. [Images and Media](#images-and-media)
5. [Buttons and Tap Targets](#buttons-and-tap-targets)
6. [Navigation](#navigation-most-common-mobile-breakpoints-issue)
7. [Forms](#forms-most-painful-on-mobile-if-not-responsive)
8. [Tables and Dense Content](#tables-and-dense-content)
9. [Cards and Content Blocks](#cards-and-content-blocks)
10. [Overflows and Breakpoints](#overflows-and-breakpoints-the-silent-killers)
11. [Modals, Drawers, Popups](#modals-drawers-popups)
12. [Performance-Related Responsiveness](#performance-related-responsiveness-affects-mobile-ux)
13. [Responsive Review Checklist](#responsive-review-checklist)

---

## Layout and Containers

### Main Wrapper / Container Width

| Pattern | Status | Why |
| --- | --- | --- |
| `width: 1200px` | ❌ Never | Overflows on any screen narrower than 1200px |
| `max-width: 1200px` + `width: 100%` | ✅ Correct | Scales down, caps at max |
| `max-width` + `width: 100%` + responsive padding | ✅ Best | Scales down with breathing room on edges |

```css
/* ✅ Recommended container pattern */
.container {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;        /* 16px mobile */
}

@media (min-width: 768px) {
  .container {
    padding: 0 2rem;      /* 32px tablet+ */
  }
}
```

```tsx
/* Tailwind equivalent */
<div className="w-full max-w-7xl mx-auto px-4 md:px-8">
```

### Spacing System

| Breakpoint | Typical padding | Typical gap | Typical section margin |
| --- | --- | --- | --- |
| Mobile (<768px) | `px-4` (16px) | `gap-3` (12px) | `py-6` (24px) |
| Tablet (768–1024px) | `px-6` (24px) | `gap-4` (16px) | `py-8` (32px) |
| Desktop (>1024px) | `px-8` (32px) | `gap-6` (24px) | `py-12` (48px) |

**Rule:** Padding and margins should scale down on mobile. Avoid huge whitespace that forces unnecessary scrolling on small screens.

### Section Stacking

| Desktop | Mobile | Notes |
| --- | --- | --- |
| Side-by-side (row) | Stack vertically (column) | Use `flex-col md:flex-row` or grid column changes |
| Image left, text right | Image on top, text below | Preserve logical reading order |
| Sidebar + content | Content only (sidebar in drawer) | Sidebar should collapse or become a drawer |

---

## Grid and Flex Behavior

### Grid Column Breakpoints

| Content type | Mobile (375px) | Tablet (768px) | Desktop (1280px) | Notes |
| --- | --- | --- | --- | --- |
| Product cards | 2 columns | 3 columns | 4–5 columns | Cards should not go below ~160px width |
| Category cards | 2 columns | 3 columns | 6 columns | Small cards can stay at 2 on mobile |
| Blog/article cards | 1 column | 2 columns | 3 columns | Longer content needs more width |
| Dashboard widgets | 1 column | 2 columns | 3–4 columns | Widgets need min ~280px to be usable |
| Form sections | 1 column | 1–2 columns | 2 columns | Never 3+ column forms |
| Image gallery | 2 columns | 3 columns | 4 columns | Thumbnails can be smaller |

```tsx
/* Tailwind grid responsive pattern */
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
```

**Watch for:** Cards getting too small (<140px), uneven heights causing layout holes, content overflow.

### Flex Rows → Columns

```tsx
/* Desktop: horizontal row | Mobile: vertical stack */
<div className="flex flex-col md:flex-row gap-4">
  <div className="md:w-1/2">Left content</div>
  <div className="md:w-1/2">Right content</div>
</div>
```

**Watch for:** Items squeezed because `flex-wrap: nowrap` — always use `flex-wrap` or switch to `flex-col`.

### Flex Wrapping

Chips, tags, and button groups **must wrap** instead of overflowing:

```tsx
/* ✅ Correct — wraps to next line */
<div className="flex flex-wrap gap-2">
  {tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}
</div>

/* ❌ Wrong — overflows or gets cut off */
<div className="flex gap-2 overflow-hidden">
  {tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}
</div>
```

### Content Ordering

Sometimes image/text order must swap on mobile (e.g., image above text):

```tsx
/* Image first on mobile, second on desktop */
<div className="flex flex-col md:flex-row">
  <div className="order-2 md:order-1">Text content</div>
  <div className="order-1 md:order-2">
    <Image src={hero} alt="..." />
  </div>
</div>
```

---

## Typography (Text)

### Font Size Scaling

| Element | Mobile | Tablet | Desktop | CSS/Tailwind |
| --- | --- | --- | --- | --- |
| H1 (hero) | 24–28px | 32–36px | 40–48px | `text-2xl md:text-4xl lg:text-5xl` |
| H2 (section) | 20–24px | 24–28px | 28–32px | `text-xl md:text-2xl lg:text-3xl` |
| H3 (card title) | 16–18px | 18–20px | 20px | `text-base md:text-lg` |
| Body text | 14–16px | 16px | 16px | `text-sm md:text-base` |
| Caption/helper | 12–13px | 13–14px | 14px | `text-xs md:text-sm` |

**Rule:** Headings should scale down on mobile. A 48px H1 that pushes all content below the fold on a phone is a bug.

### Line Length / Readability

- **Max line length:** ~65–75 characters for body text (`max-w-prose` in Tailwind = 65ch)
- Avoid long unbroken lines on mobile — they're hard to track visually
- Use `leading-relaxed` (1.625) on mobile for better readability

### Text Overflow

Long titles, usernames, URLs, and dynamic content must be handled:

```tsx
/* Truncate with ellipsis */
<p className="truncate">{longTitle}</p>

/* Or wrap safely */
<p className="break-words">{longUrl}</p>

/* For multi-line truncation (2 lines) */
<p className="line-clamp-2">{description}</p>
```

---

## Images and Media

### Responsive Images

| Rule | Implementation | Why |
| --- | --- | --- |
| Images must scale with container | `max-width: 100%; height: auto` or `w-full h-auto` | Prevents overflow |
| Preserve aspect ratio | `object-fit: cover` or `object-fit: contain` | Prevents stretching |
| Hero/banner focal points | Test crops on mobile | Cropping can cut faces/text |
| Dimension reservation | Use `aspect-ratio` or explicit `width`/`height` | Prevents CLS |

```tsx
/* Next.js responsive image with reserved space */
<div className="relative aspect-[16/9] w-full">
  <Image
    src={heroImage}
    alt="Hero banner"
    fill
    className="object-cover"
    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 1200px"
    priority
  />
</div>
```

### Galleries / Carousels

- Must be swipe-friendly on touch devices (not just arrow-button navigation)
- Pagination dots/indicators must be visible and not overlap content
- Autoplay should pause on touch/interaction

### Video Embeds

```tsx
/* ✅ Responsive iframe — maintains 16:9 aspect ratio */
<div className="relative w-full aspect-video">
  <iframe
    src={videoUrl}
    className="absolute inset-0 w-full h-full"
    allowFullScreen
  />
</div>

/* ❌ Fixed width iframe — breaks on mobile */
<iframe src={videoUrl} width="640" height="360" />
```

---

## Buttons and Tap Targets

### Minimum Tap Target Size

| Platform guideline | Minimum size | Notes |
| --- | --- | --- |
| Apple HIG | 44×44pt | Recommended for all tap targets |
| Material Design | 48×48dp | Includes touch padding |
| WCAG 2.5.5 (AAA) | 44×44 CSS px | Enhanced target size |
| Practical minimum | 40×40px | Below this, mis-taps increase significantly |

```tsx
/* ✅ Icon button with proper tap target */
<button className="p-3 min-w-[44px] min-h-[44px]" aria-label="Delete">
  <TrashIcon className="w-5 h-5" />
</button>

/* ❌ Tiny icon button — hard to tap */
<button className="p-1">
  <TrashIcon className="w-4 h-4" />
</button>
```

### Primary CTA Visibility

The primary call-to-action should be visible without excessive scrolling on mobile. If it's below the fold, consider a sticky bottom bar:

```tsx
/* Sticky CTA on mobile for checkout/add-to-cart */
<div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t md:hidden">
  <Button className="w-full">Add to Cart — ${price}</Button>
</div>
```

### Button Groups

```tsx
/* Desktop: horizontal | Mobile: stack or wrap */
<div className="flex flex-col sm:flex-row gap-2">
  <Button variant="primary" className="w-full sm:w-auto">Save</Button>
  <Button variant="ghost" className="w-full sm:w-auto">Cancel</Button>
</div>
```

**Spacing:** Maintain at least 8px gap between tappable elements to prevent mis-taps.

---

## Navigation (Most Common Mobile Breakpoints Issue)

### Navbar Patterns

| Screen size | Pattern | Implementation |
| --- | --- | --- |
| Mobile (<768px) | Hamburger → drawer/sheet | `<Sheet>` or `<Dialog>` with slide animation |
| Tablet (768–1024px) | Collapsed nav or icon-only | Reduced labels, priority items only |
| Desktop (>1024px) | Full horizontal nav | All items visible |

**Rules:**

- Logo and menu button should never collide or overlap
- Hamburger icon must have a clear tap target (44×44px minimum)
- Mobile drawer should be full-height and allow internal scrolling

### Dropdowns

- Must open **within the viewport** — not extending beyond screen edges
- Should be **touch-friendly** — not hover-only (hover doesn't exist on mobile)
- Close on tap outside, back button, or swipe away

### Sticky Headers

| Rule | Why |
| --- | --- |
| Should not cover content | Users can't read what's behind the header |
| Should not block form inputs | Keyboard + sticky header = invisible input field |
| Should be thin on mobile | Desktop headers (80px+) eat too much vertical space on mobile |
| Should hide on scroll down, show on scroll up (optional) | Reclaims vertical space on mobile |

---

## Forms (Most Painful on Mobile If Not Responsive)

### Form Layout Transitions

| Desktop | Mobile | Rule |
| --- | --- | --- |
| 2-column form fields | 1-column fields | Always collapse to single column on mobile |
| Label beside input | Label above input | Side-by-side labels don't fit on 375px |
| Inline button groups | Stacked full-width buttons | Buttons must be full-width on mobile |
| Horizontal radio/checkbox groups | Vertical stack | Horizontal groups overflow or get squeezed |

```tsx
/* ✅ Responsive form field layout */
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

Always use the correct `type` attribute for mobile keyboard optimization:

| Field | Input type | Mobile keyboard |
| --- | --- | --- |
| Email | `type="email"` | Shows `@` key |
| Phone | `type="tel"` | Numeric pad |
| Number/Quantity | `type="number"` or `inputMode="numeric"` | Numeric pad |
| URL | `type="url"` | Shows `/` and `.com` |
| Search | `type="search"` | Shows search button |
| Password | `type="password"` | Secure input |

### Error Messages

- Must wrap properly — long error text should not break layout
- Should appear below the input, not to the side
- Must be visible when the input is focused (not hidden behind keyboard or sticky header)

---

## Tables and Dense Content

### Mobile Table Strategies

| Strategy | When to use | Implementation |
| --- | --- | --- |
| **Horizontal scroll** | Data tables with many columns | `<div className="overflow-x-auto"><table>...</table></div>` |
| **Stacked cards** | Entity tables (users, orders) | Transform each row into a card on mobile |
| **Hidden columns** | Tables with low-priority columns | `className="hidden md:table-cell"` on less important columns |
| **Accordion rows** | Detail-heavy rows | Show summary on mobile, expand for details |

```tsx
/* ✅ Horizontal scroll wrapper for data tables */
<div className="overflow-x-auto -mx-4 px-4">
  <table className="min-w-[600px] w-full">
    {/* Table content */}
  </table>
</div>

/* ✅ Hidden columns pattern */
<th className="hidden md:table-cell">Created</th>
<th className="hidden lg:table-cell">Category</th>
```

**Rule:** Data grids must not cause horizontal page overflow. The page scrolls vertically; tables scroll horizontally within their container.

---

## Cards and Content Blocks

### Card Responsive Behavior

| Aspect | Rule | Implementation |
| --- | --- | --- |
| Width | Must shrink cleanly | `w-full` within grid, never fixed width |
| Text | Must not overflow card | `truncate`, `line-clamp-2`, or `break-words` |
| Image | Must scale with card | `w-full h-auto object-cover` with aspect-ratio |
| Grid | 3–4 columns desktop → 1–2 mobile | `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` |
| Height | Must tolerate unequal content | Use grid (auto-equal rows) or don't assume equal heights |

```tsx
/* ✅ Card that adapts cleanly */
<div className="rounded-lg border bg-white overflow-hidden">
  <div className="aspect-[4/3] relative">
    <Image src={image} alt={title} fill className="object-cover" />
  </div>
  <div className="p-3 md:p-4">
    <h3 className="text-sm md:text-base font-medium line-clamp-2">{title}</h3>
    <p className="text-xs md:text-sm text-gray-500 mt-1 truncate">{subtitle}</p>
  </div>
</div>
```

---

## Overflows and Breakpoints (The "Silent Killers")

### Common Overflow Sources

| Source | Fix | Tailwind |
| --- | --- | --- |
| Fixed-width elements (`width: 500px`) | Use `max-width: 100%` or `w-full` | `w-full` or `max-w-full` |
| Long URLs or unbreakable strings | Add word-break | `break-words` or `break-all` |
| Pre-formatted code blocks | Scroll container | `overflow-x-auto` |
| Absolute-positioned elements | Check mobile positioning | Use responsive positioning utilities |
| Negative margins without matching padding | Audit for screen overflow | Wrap in `overflow-hidden` container |
| Horizontal flex without wrapping | Add `flex-wrap` | `flex-wrap` |

**Principle:** Any element causing sideways page scroll is a bug unless it's an intentional scroll container (carousel, table).

### Testing for Overflows

```css
/* Debug — temporarily add this to find overflow sources */
* { outline: 1px solid red !important; }
```

Or use Chrome DevTools → Elements → scroll to the right to find the overflowing element.

---

## Modals, Drawers, Popups

### Modal Responsive Behavior

| Aspect | Desktop | Mobile |
| --- | --- | --- |
| Width | `max-w-lg` centered | Full-width with `mx-4` or fullscreen sheet |
| Height | Auto with max-height | `max-h-[90vh]` with internal scroll |
| Close button | Top-right corner | Must be visible and ≥44px tap target |
| Background scroll | Locked (`body` scroll lock) | Locked — prevent scroll passthrough |
| Interaction | Click outside to close | Tap outside or swipe down to close |

```tsx
/* ✅ Responsive modal pattern */
<Dialog>
  <DialogContent className="w-full max-w-lg mx-4 md:mx-auto max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Confirm</DialogTitle>
      <DialogClose className="min-w-[44px] min-h-[44px]" />
    </DialogHeader>
    <div className="p-4 md:p-6">
      {/* Content */}
    </div>
    <DialogFooter className="flex flex-col sm:flex-row gap-2">
      <Button className="w-full sm:w-auto">Confirm</Button>
      <Button variant="ghost" className="w-full sm:w-auto">Cancel</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Drawers / Sheets (Mobile-Preferred)

For mobile, bottom sheets are often better UX than centered modals:

- Easier thumb reach for close/confirm
- Natural swipe-to-dismiss gesture
- Full width on mobile, modal on desktop

---

## Performance-Related Responsiveness (Affects Mobile UX)

### Image Sizes by Breakpoint

| Element | Mobile `sizes` | Desktop `sizes` | Example |
| --- | --- | --- | --- |
| Hero banner | `100vw` | `100vw` (or `1200px`) | `sizes="100vw"` |
| Product card in 2-col grid | `50vw` | `25vw` | `sizes="(max-width: 768px) 50vw, 25vw"` |
| Thumbnail (40px) | `40px` | `40px` | `sizes="40px"` |
| Avatar (32px) | `32px` | `32px` | `sizes="32px"` |

**Rule:** Don't send 2000px desktop images to a 375px mobile screen. Use `next/image` `sizes` prop or `<picture>` with `srcSet`.

### Lazy Loading

- Lazy-load images and content **below the fold**
- **Never** lazy-load the hero image or primary CTA
- Use `loading="lazy"` for `<img>` or Next.js `Image` default behavior
- Consider virtual lists for 100+ items (e.g., `react-window`)

---

## Responsive Review Checklist

Before shipping any user-facing UI change, verify:

| Check | How to verify |
| --- | --- |
| ☐ No horizontal page overflow at 375px | Chrome DevTools → responsive mode → 375px width |
| ☐ Readable typography (body ≥14px, headings scaled) | Visual inspection at mobile width |
| ☐ Tap targets ≥40px | DevTools → inspect button/link dimensions |
| ☐ Correct stacking order (content, image, CTA) | Check mobile layout matches intended reading order |
| ☐ Responsive images (no desktop-sized images on mobile) | Network tab → check image sizes at mobile width |
| ☐ Forms usable on touch devices | Test input types, label positions, error messages |
| ☐ Navigation accessible (hamburger, drawer, no hover-only) | Tap through nav on mobile width |
| ☐ Tables don't break layout | Check for horizontal page overflow vs. table-local scroll |
| ☐ Modals fit mobile viewport | Open modal at 375px, verify close button and scrolling |
| ☐ No fixed widths causing overflow | Search for `width:` values in new/changed CSS |
| ☐ Cards shrink cleanly in grid | Check at 375px — text truncation, image aspect ratio |
| ☐ Sticky elements don't block content | Scroll with sticky header visible — content should still be readable |
