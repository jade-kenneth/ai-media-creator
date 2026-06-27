# Responsiveness Guide

This project uses Tailwind CSS with custom breakpoints. The primary goal is to keep layouts readable at `375px` while scaling cleanly at tablet and desktop widths without horizontal overflow.

---

## Breakpoints

| Token | Width | Target | Notes |
| --- | --- | --- | --- |
| `sm` | 375px | Mobile (small) | Design baseline — all layouts must work here |
| `md` | 768px | Tablet (portrait) | Grid expansion point, side-by-side layouts begin |
| `lg` | 1040px | Tablet (landscape) | Full navigation visible, wider content areas |
| `xl` | 1280px | Desktop | Primary desktop breakpoint |
| `2xl` | 1536px | Large desktop | Optional — extra columns or wider containers |

**Approach:** Mobile-first. Default styles target `sm` (375px), then add responsive modifiers (`md:`, `lg:`, `xl:`) for larger screens.

---

## Global Rules

**File:** `apps/ecommerce-app/src/app/globals.css`

| Rule | Purpose | Implementation |
| --- | --- | --- |
| `html, body { overflow-x: hidden; }` | Prevents horizontal page scroll globally | Safety net — should not be needed if components are responsive |
| `img, video, svg { max-width: 100%; }` | Prevents media from overflowing containers | All media constrained by default |
| `.max-w-screen` class | Controls page padding and width per breakpoint | Applied to main content wrappers |

---

## Component Responsiveness Reference

### Layout Shell

**File:** `libs/features/src/portal/layout/Layout.tsx`

| Property | Value | Purpose |
| --- | --- | --- |
| `w-full` | 100% width | Fills viewport |
| `overflow-x-hidden` | Hidden | Prevents accidental side-scroll from children |

### Highlight Bar

**File:** `libs/features/src/portal/Highlight.tsx`

| Breakpoint | Behavior |
| --- | --- |
| Mobile | Stacked layout — icon + text vertically centered |
| Desktop | Horizontal row — items side by side |
| Icons | Scale down (`w-4 h-4`) on small screens |

### Navbar

**File:** `libs/features/src/portal/Navbar.tsx`

| Breakpoint | Layout | Details |
| --- | --- | --- |
| Mobile | Stacked | Full-width search, simplified actions |
| Desktop | 3-column grid | `logo | search | actions` |
| Mobile menu | Dialog drawer | Quick links and categories in a slide-out panel |

**Key patterns:**

- Search input uses `w-full` on mobile
- Action buttons (cart, account) stay visible on all breakpoints
- Mobile drawer uses `Dialog` component for accessibility (focus trap, escape to close)

### Carousel

**File:** `libs/features/src/portal/Carousel.tsx`

| Property | Implementation | Purpose |
| --- | --- | --- |
| Height | `clamp(200px, 40vw, 400px)` | Scales smoothly between mobile and desktop |
| Border radius | Responsive utility | Smaller radius on mobile |
| Image | `object-cover` | Maintains focal point at any crop |

### Categories

**File:** `libs/features/src/portal/Categories.tsx`

| Breakpoint | Grid columns | Notes |
| --- | --- | --- |
| Mobile | `grid-cols-2` | 2 categories per row |
| Tablet (`md`) | `grid-cols-3` | 3 per row |
| Desktop (`lg`) | `grid-cols-6` | Full row visibility |

Card sizes scale with responsive padding and image dimensions.

### Product Cards

**File:** `libs/ui/components/Cards.tsx`

| Change | Before → After | Purpose |
| --- | --- | --- |
| Fixed widths | Removed → stretch with grid | Cards adapt to container width |
| Badge sizes | Desktop sizes → responsive scaling | Badges don't overflow card on mobile |
| Text sizes | Fixed → `text-xs md:text-sm` | Readable on all screens |

### Product Grids

**Files:**

- `libs/features/src/portal/TopSelling.tsx`
- `libs/features/src/portal/HighPoint.tsx`
- `libs/features/src/portal/JustForYou.tsx`

| Breakpoint | Grid columns | Min card width (approx) |
| --- | --- | --- |
| Mobile | `grid-cols-2` | ~170px (at 375px viewport) |
| Tablet (`md`) | `grid-cols-3` | ~220px |
| Desktop (`lg`) | `grid-cols-4` | ~260px |
| Large desktop (`xl`) | `grid-cols-5` | ~230px |

### Cart

**Files:**

- `libs/features/src/portal/Cart/Cart.tsx`
- `libs/features/src/portal/Cart/Items.tsx`

| Breakpoint | Layout | Details |
| --- | --- | --- |
| Mobile | Stacked | Item cards full-width, summary below |
| Desktop | Side-by-side | Items (2/3 width) + sticky summary (1/3 width) |

Summary should be `sticky top-*` on desktop for visibility during scroll.

### Checkout

**File:** `libs/features/src/portal/Checkout/Checkout.tsx`

| Breakpoint | Layout |
| --- | --- |
| Mobile | All sections stacked vertically |
| Desktop (`lg`+) | Two-column split — form left, summary right |

Form fields collapse to single column on mobile.

### Auth Dialogs

**Files:**

- `libs/features/src/portal/AuthForm.tsx`
- `libs/features/src/portal/LoginForm.tsx`
- `libs/features/src/portal/SignupForm.tsx`

| Aspect | Mobile | Desktop |
| --- | --- | --- |
| Spacing | Compact (`p-4`, `gap-3`) | Standard (`p-6`, `gap-4`) |
| Header text | Smaller (`text-lg`) | Standard (`text-xl`) |
| Close button | Positioned top-right, within bounds | Top-right with offset |
| Width | Full-width with margins | Max-width centered |

**Critical:** Close button must not overflow off-screen on mobile.

### Footer

**File:** `libs/features/src/portal/Footer.tsx`

| Breakpoint | Layout |
| --- | --- |
| Mobile | Single column — all sections stacked |
| Tablet (`lg`) | 2-column grid |
| Desktop (`xl`) | 4-column layout |

---

## Adding New Components — Checklist

Before merging any new user-facing component:

| ☐ | Rule | Details |
| --- | --- | --- |
| ☐ | No fixed widths | Use `w-full`, `max-w-*`, and responsive grids |
| ☐ | Flex children can't overflow | Add `min-w-0` when flex children contain text that could exceed container |
| ☐ | Responsive heights/spacing | Use `clamp()` or responsive utility classes (`h-40 md:h-60`) |
| ☐ | Test at 375px | Verify no horizontal overflow, text readable, tap targets usable |
| ☐ | Test at 1040px | Verify tablet layout transitions correctly |
| ☐ | Test at 1280px | Verify desktop layout is clean |
| ☐ | Images use `object-cover`/`contain` | No stretching, aspect ratio preserved |
| ☐ | Text handles overflow | `truncate`, `line-clamp-*`, or `break-words` for dynamic content |
| ☐ | Buttons/links ≥40px tap target | Add padding if icon-only buttons are smaller |
| ☐ | Forms use `w-full` inputs on mobile | Multi-column forms collapse to single column |

### Common Tailwind Patterns for Responsiveness

```tsx
/* Responsive grid */
className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4"

/* Flex row → column on mobile */
className="flex flex-col md:flex-row gap-4"

/* Responsive text */
className="text-sm md:text-base lg:text-lg"

/* Responsive padding */
className="p-4 md:p-6 lg:p-8"

/* Prevent text overflow */
className="truncate"                    /* Single line + ellipsis */
className="line-clamp-2"               /* Two lines + ellipsis */
className="break-words"                /* Wrap long words/URLs */

/* Prevent flex child overflow */
className="min-w-0"                    /* Allow flex child to shrink below content size */

/* Responsive visibility */
className="hidden md:block"            /* Hide on mobile, show on tablet+ */
className="md:hidden"                  /* Show on mobile, hide on tablet+ */
