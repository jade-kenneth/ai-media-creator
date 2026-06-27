# Mobile UI Revamp — Variant D (Navy + Gold)

## Overview

Redesign the entire mobile app UI from the current teal-slate theme to **Variant D**: a civic-authoritative palette built around deep navy (`#1a1f5e`) and gold (`#F5C400`) on a clean off-white surface. The home screen ships first; all other screens follow in sequence.

**Stack:** Expo Router · React Native · NativeWind 4  
**Scope:** All screens — home priority, full cascade after  
**Branch:** `ai-powered`

---

## Design Token Reference (Variant D)

These values replace the current teal/slate palette everywhere.

| Token              | Value     | Replaces                  |
| ------------------ | --------- | ------------------------- |
| Primary / Navy     | `#1a1f5e` | `#0f766e`, `#2dd4bf`      |
| Gold / Accent      | `#F5C400` | teal active states        |
| Screen background  | `#f4f6fb` | `#f8fafc`                 |
| Card background    | `#ffffff` | —                         |
| Subtle fill        | `#f0f3fd` | —                         |
| Border             | `#e2e6f0` | `slate-300` / `slate-600` |
| Body text          | `#1a1f5e` | `#0f172a`                 |
| Secondary text     | `#5a6080` | —                         |
| Muted / label text | `#8892b8` | `#64748b`, `#94a3b8`      |
| Dark card border   | `#dce2f5` | —                         |
| Gold pill bg       | `#fffbea` | —                         |
| Gold pill text     | `#7a5e00` | —                         |
| Gold pill border   | `#f0d860` | —                         |

**Dark mode:** Keep existing dark-mode support from CLAUDE.md. Map dark-mode surfaces to `#0d1033` (body), `#12194a` (card), `#1e2660` (elevated card), and keep gold/muted tokens consistent.

---

## Phase 0 — Audit & Token Centralization

> Complete this before touching any component.

**0.1 — Audit current color usage**

- Search all files for hardcoded hex values and the current teal tokens (`#2dd4bf`, `#0f766e`, `#0f172a`, `slate-*` via NativeWind classes)
- List every location where color is hardcoded vs. driven by a class or token
- Files to audit: `app/(main)/(tabs)/_layout.tsx`, `app/(main)/_layout.tsx`, all `features/*/components/`, all `components/ui/`

**0.2 — Create `theme/colors.ts`**

Create `theme/colors.ts` with the full Variant D token set as a typed const object. Both light and dark surfaces should live here.

```ts
export const colors = {
  primary: '#1a1f5e',
  accent: '#F5C400',
  accentDark: '#D4A900', // OLED fallback if gold reads faint
  screenBg: '#f4f6fb',
  cardBg: '#ffffff',
  subtleFill: '#f0f3fd',
  border: '#e2e6f0',
  bodyText: '#1a1f5e',
  secondaryText: '#5a6080',
  mutedText: '#8892b8',
  cardBorder: '#dce2f5',
  goldPillBg: '#fffbea',
  goldPillText: '#7a5e00',
  goldPillBorder: '#f0d860',
  error: '#cc3333',
  errorBg: '#fff0f0',
  // dark surfaces
  dark: {
    screenBg: '#0d1033',
    cardBg: '#12194a',
    elevatedCard: '#1e2660',
    border: 'rgba(255,255,255,0.08)',
    bodyText: '#f0f2ff',
    mutedText: '#8892b8',
  },
} as const;
```

**0.3 — Extend `tailwind.config.ts`**

Add the Variant D palette as named NativeWind classes so components use `bg-brand-navy`, `text-brand-gold`, etc. instead of inline styles or one-off hex values.

```ts
theme: {
  extend: {
    colors: {
      brand: {
        navy: '#1a1f5e',
        gold: '#F5C400',
        'gold-dark': '#D4A900',
        'screen-bg': '#f4f6fb',
        'subtle-fill': '#f0f3fd',
        border: '#e2e6f0',
        muted: '#8892b8',
        secondary: '#5a6080',
      },
    },
  },
},
```

---

## Phase 1 — Shared Infrastructure

Tackle shared components first. Every screen benefits immediately.

### 1.1 — Top bar / stack header

**File:** `app/(main)/_layout.tsx`

- Header background: `#ffffff`, bottom border `0.5px solid #e2e6f0`
- Title typography: `font-weight: 600`, `color: #1a1f5e`
- Back chevron / close icon: `#1a1f5e`
- Notification bell (if present in header): `#f0f3fd` circle bg, gold dot badge `#F5C400`

### 1.2 — Bottom tab navigator

**File:** `app/(main)/(tabs)/_layout.tsx`

- Tab bar background: `#ffffff`, top border `0.5px solid #e2e6f0`
- Inactive icon color: `#cdd4ec`
- Active icon color: `#1a1f5e`
- Active label color: `#1a1f5e`
- Active indicator: small gold dot `#F5C400` above the active icon — remove any filled/highlighted tab background
- Remove current spring icon animation or keep only if it remains subtle (no bounce on inactive tap)
- Safe area: `insets.bottom` already applied — verify nothing breaks after color change

### 1.3 — Section headers

**File:** `components/ui/section-header.tsx`

- Label: all-caps, 11px, `#8892b8`, `letter-spacing: 0.07em`, `font-weight: 500`
- "Tingnan lahat" / "See all" link: 12px, `#1a1f5e`, `opacity: 0.6`

### 1.4 — Empty state

**File:** `components/ui/empty-state.tsx`

- White card, `border-radius: 12px`, `0.5px border #e2e6f0`
- Message text: `#8892b8`
- Action button (if any): navy `#1a1f5e` background, white label

### 1.5 — Error screen

**File:** `components/ui/error-screen.tsx`

- Error icon: `#fff0f0` circle, `#cc3333` stroke icon
- Retry button: navy `#1a1f5e` background, gold `#F5C400` label text
- Body text: `#8892b8`

### 1.6 — Skeleton base color

Update all skeleton pulse placeholder colors across all feature skeleton files:

- Default placeholders: `#e8ecf5`
- Placeholders inside navy cards (hero card): `rgba(255,255,255,0.15)`

Skeleton files to update:

- `features/home/components/home-screen-skeleton.tsx`
- `features/announcements/components/skeleton-card.tsx`
- `features/announcements/components/announcement-detail-skeleton.tsx`
- `features/requests/components/request-list-skeleton.tsx`
- `features/requests/components/request-detail-skeleton.tsx`
- `features/schedules/components/schedule-list-skeleton.tsx`
- `features/notifications/components/notifications-list-skeleton.tsx`
- `features/profile/components/profile-skeleton.tsx`
- `features/emergency-contacts/components/contacts-list-skeleton.tsx`

### 1.7 — Badge / pill component

**File:** `components/ui/badge.tsx`

- Navy-tinted variant: `#f0f3fd` bg, `#1a1f5e` text, `0.5px border #dce2f5`
- Gold-tinted variant: `#fffbea` bg, `#7a5e00` text, `0.5px border #f0d860`
- Remove any solid-color (filled) badge variants — keep tinted only

---

## Phase 2 — Home Screen

**Files:** `features/home/home-screen.tsx`, `features/home/components/`

This is the highest-priority screen. Complete and sign off before moving to Phase 3.

### 2.1 — Hero / greeting card

**File:** `features/home/components/greeting-header.tsx`

- Card background: `#1a1f5e`, `border-radius: 16px`
- Float the card with `margin: 12px 16px 0` — not full-bleed
- Greeting name: white, `font-weight: 600`
- Date/time sub-label: `rgba(255,255,255,0.5)`
- Organization seal SVG: top-right inside the card (navy circle, gold ring, gold center dot)
- Stat shelf: integrated at the card bottom
  - Horizontal dividers: `rgba(255,255,255,0.1)`
  - Stat numbers: `#F5C400`, `font-weight: 500`
  - Stat labels: `rgba(255,255,255,0.65)`, 11px

### 2.2 — Quick action grid

**File:** `features/home/components/quick-action-grid.tsx`

- Card: white bg, `border-radius: 12px`, `0.5px border #e2e6f0`
- Icon container tints (replace any solid-color backgrounds):
  - Documents / schedules: gold tint (`#fffbea`, `#F5C400` icon)
  - Requests: navy tint (`#f0f3fd`, `#1a1f5e` icon)
  - Emergency: red tint (`#fff0f0`, `#cc3333` icon)
- Label: `#1a1f5e`, `font-weight: 500`
- Sub-label: `#8892b8`, 11px

### 2.3 — Pinned announcement cards

**File:** `features/home/components/announcement-card.tsx`

- Card: white bg, `border-radius: 12px`, `0.5px border #e2e6f0`
- Top row: SVG pin icon + "Naka-pin" label, `#1a1f5e`, 11px
- Title: `#1a1f5e`, `font-weight: 500`
- Date: `#8892b8`
- Category badge: navy-tinted or gold-tinted pill (see badge spec in 1.7)

### 2.4 — Schedule list items

**File:** `features/home/components/schedule-list-item.tsx`

- Date box: `#f0f3fd` bg, `#1a1f5e` day number and month text, `0.5px border #dce2f5`
- Time pill: gold-tinted (`#fffbea` bg, `#7a5e00` text, `0.5px border #f0d860`)
- Title: `#1a1f5e`, `font-weight: 500`
- Meta / location text: `#8892b8`

### 2.5 — Emergency contact cards (home preview)

**File:** `features/home/components/emergency-contact-card.tsx`

- Avatar circle 38px, color-coded by role:
  - Officials: navy tint (`#f0f3fd`)
  - Health workers: red tint (`#fff0f0`)
  - Tanod: gold tint (`#fffbea`)
- Name: `#1a1f5e`, `font-weight: 500`
- Role: `#8892b8`
- Call button: `#1a1f5e` circle, gold phone icon `#F5C400`

### 2.6 — Home screen skeleton (navy card aware)

**File:** `features/home/components/home-screen-skeleton.tsx`

- Hero card skeleton: navy `#1a1f5e` bg, inner placeholders `rgba(255,255,255,0.15)`
- All other placeholders: `#e8ecf5`
- Match block sizes and positions to the real layout exactly

---

## Phase 3 — Announcements

**Files:** `features/announcements/`

### 3.1 — Announcement list item

**File:** `features/announcements/components/announcement-list-item.tsx`

- White card, `border-radius: 12px`, `0.5px border #e2e6f0`
- Category badge: tinted pill (navy or gold depending on category)
- Title: `#1a1f5e`, `font-weight: 500`
- Body preview: `#5a6080`
- Date: `#8892b8`
- Pinned badge: update `features/announcements/components/pinned-badge.tsx` to navy-tinted pill

### 3.2 — Announcement detail screen

**File:** `features/announcements/announcement-detail-screen.tsx`

- Screen bg: `#f4f6fb`
- Header card (category + title): white card, `border-radius: 12px`, `0.5px border #e2e6f0`
- Date and author row: `#8892b8`
- Body text: `#5a6080`
- Filter chips: `features/announcements/components/filter-chips.tsx` — active chip: navy bg `#1a1f5e`, white text; inactive: `#f0f3fd` bg, `#8892b8` text

---

## Phase 4 — Schedules

**Files:** `features/schedules/`

### 4.1 — Schedule card

**File:** `features/schedules/components/schedule-card.tsx`

- White card, `border-radius: 12px`, `0.5px border #e2e6f0`
- Date box (left column): `#f0f3fd` bg, `#1a1f5e` text, `0.5px border #dce2f5`
- Time pill: gold-tinted
- Category badge: tinted pill
- Title: `#1a1f5e`, `font-weight: 500`
- Description: `#5a6080`
- Location / meta: `#8892b8`

### 4.2 — Category filter chips

**File:** `features/schedules/components/category-filter-chips.tsx`

- Active: navy `#1a1f5e` bg, white text
- Inactive: `#f0f3fd` bg, `#8892b8` text, `0.5px border #e2e6f0`

### 4.3 — Section divider

**File:** `features/schedules/components/section-divider.tsx`

- Label: all-caps, `#8892b8`, 11px (matches section-header spec from 1.3)

---

## Phase 5 — Emergency Contacts

**Files:** `features/emergency-contacts/`

### 5.1 — Contact card

**File:** `features/emergency-contacts/components/contact-card.tsx`

- White card, `border-radius: 12px`, `0.5px border #e2e6f0`
- Avatar: 44px circle, role-coded tint (navy / red / gold — see 2.5)
- Name: `#1a1f5e`, `font-weight: 500`
- Role / department: `#8892b8`

### 5.2 — Call button

**File:** `features/emergency-contacts/components/call-button.tsx`

- Background: `#1a1f5e` circle
- Icon: gold phone `#F5C400`
- Press feedback: opacity on iOS, ripple on Android

### 5.3 — Group header

**File:** `features/emergency-contacts/components/group-header.tsx`

Apply section-header spec from 1.3.

---

## Phase 6 — Requests

**Files:** `features/requests/`

### 6.1 — Request list item

**File:** `features/requests/components/request-list-item.tsx`

- White card, `border-radius: 12px`, `0.5px border #e2e6f0`
- Request type label: `#1a1f5e`, `font-weight: 500`
- Date: `#8892b8`
- Status badge: use tinted pill variants from badge spec (1.7):
  - Pending: gold-tinted
  - Approved: navy-tinted
  - Rejected: red-tinted (`#fff0f0` bg, `#cc3333` text)

### 6.2 — Status badge

**File:** `features/requests/components/status-badge.tsx`

Apply role-coded tint from 6.1 status table.

### 6.3 — Status timeline

**File:** `features/requests/components/status-timeline.tsx`

- Active/completed step: `#1a1f5e` dot, `#1a1f5e` label
- Pending step: `#e2e6f0` dot, `#8892b8` label
- Connector line: `#e2e6f0`

### 6.4 — Status filter chips

**File:** `features/requests/components/status-filter-chips.tsx`

Apply category chip spec from 4.2.

### 6.5 — Floating action button

**File:** `features/requests/components/floating-action-button.tsx`

- Background: `#1a1f5e`
- Icon: `#F5C400` or white — pick for contrast
- Shadow: subtle navy-tinted shadow

### 6.6 — New request screen

**File:** `features/requests/new-request-screen.tsx`

- Screen bg: `#f4f6fb`
- Form inputs: apply button/input spec from Phase 1 tokens
- Submit button: navy bg `#1a1f5e`, white label, gold loading indicator

---

## Phase 7 — Notifications

**Files:** `features/notifications/`

### 7.1 — Notification item

**File:** `features/notifications/components/notification-item.tsx`

- White card / row, `0.5px border #e2e6f0`
- Unread indicator: gold dot `#F5C400`
- Title: `#1a1f5e`, `font-weight: 500`
- Body: `#5a6080`
- Timestamp: `#8892b8`
- Icon / avatar circle: navy-tinted (`#f0f3fd`)

### 7.2 — In-app notification banner

**File:** `features/notifications/components/in-app-notification-banner.tsx`

- Background: `#1a1f5e`
- Text: white
- Close icon: `rgba(255,255,255,0.7)`

### 7.3 — Notification permission prompt

**File:** `features/notifications/components/notification-permission-prompt.tsx`

- Card: white, `border-radius: 12px`, `0.5px border #e2e6f0`
- CTA button: navy bg, white label

---

## Phase 8 — Profile

**Files:** `features/profile/`

### 8.1 — Profile screen

**File:** `features/profile/profile-screen.tsx`

- Header section: white card, `border-radius: 12px`, `0.5px border #e2e6f0`
- Avatar circle border: `#1a1f5e` or gold ring
- Name: `#1a1f5e`, `font-weight: 600`
- Role / organization: `#8892b8`
- Info rows (from `components/ui/info-row.tsx`): label `#8892b8`, value `#1a1f5e`
- Section headers: apply spec from 1.3
- Sign out button: `border #e2e6f0`, `#cc3333` label

### 8.2 — Edit profile screen

**File:** `features/profile/edit-profile-screen.tsx`

- Screen bg: `#f4f6fb`
- Save button: navy bg, white label

---

## Phase 9 — Auth Screens

**Files:** `features/auth/`

Auth screens are not in the main tab flow but must match the new brand.

### 9.1 — Login screen

**File:** `features/auth/login-screen.tsx`

- Screen bg: `#f4f6fb`
- Logo / seal: top center, apply SVG seal (navy circle, gold ring)
- Municipality / organization name: `#1a1f5e`, `font-weight: 600`
- Form inputs: white bg, `0.5px border #e2e6f0`, focus border `#1a1f5e`
- Primary button: navy `#1a1f5e` bg, white label
- Link text: `#1a1f5e`, `opacity: 0.6`

### 9.2 — Register screen

**File:** `features/auth/register-screen.tsx`

Same surface and input tokens as login.

### 9.3 — Registration pending screen

**File:** `features/auth/registration-pending-screen.tsx`

- Illustration / icon: navy-tinted circle, gold checkmark or hourglass
- Heading: `#1a1f5e`, `font-weight: 600`
- Body: `#5a6080`

---

## Phase 10 — Typography Pass

Do this pass after all screens are updated.

| Usage                        | Weight | Color     |
| ---------------------------- | ------ | --------- |
| Screen titles, card headings | 600    | `#1a1f5e` |
| Primary labels, names        | 500    | `#1a1f5e` |
| Body / description           | 400    | `#5a6080` |
| Muted — date, role, subtitle | 400    | `#8892b8` |
| Section labels (all-caps)    | 500    | `#8892b8` |
| Stat numbers                 | 500    | `#F5C400` |
| Error text                   | 400    | `#cc3333` |

Audit every screen for font-weight and color consistency against this table. Fix deviations.

---

## Phase 11 — QA

Latest audit output: `theme/phase-11-qa-report.md` (2026-04-18)

### 11.1 — Screen state coverage

For every screen, verify all four states render correctly with Variant D colors:

| Screen               | Default | Loading | Empty | Error |
| -------------------- | ------- | ------- | ----- | ----- |
| Home                 |         |         |       |       |
| Announcements list   |         |         |       |       |
| Announcement detail  |         |         |       |       |
| Schedules            |         |         |       |       |
| Emergency contacts   |         |         |       |       |
| Requests list        |         |         |       |       |
| Request detail       |         |         |       |       |
| New request          |         |         |       |       |
| Notifications        |         |         |       |       |
| Profile              |         |         |       |       |
| Edit profile         |         |         |       |       |
| Login                |         |         |       |       |
| Register             |         |         |       |       |
| Registration pending |         |         |       |       |

### 11.2 — Device checks

- `#f4f6fb` screen background reads as light (not washed out) on both iOS and Android
- Gold `#F5C400` is legible — if it reads faint on OLED/high-brightness panels, switch to `#D4A900`
- Bottom nav safe area insets are intact (especially iPhone home indicator + Android gesture bar)
- Tap targets are ≥ 44px on all interactive elements
- No hardcoded bottom spacing remains (all use `insets.bottom`)

### 11.3 — Accessibility

- All foreground/background color pairs meet WCAG AA contrast (`#1a1f5e` on white = 9.9:1 ✓)
- Gold `#F5C400` on navy `#1a1f5e` = 5.9:1 ✓ — acceptable for large/bold text
- Gold on white `#ffffff` = 1.6:1 — **do not use gold text on white backgrounds**; use `#7a5e00` for gold-pill text instead
- Icon-only controls have accessible labels

---

## Definition of Done

A screen is complete when:

- [ ] All colors match Variant D tokens (no leftover teal/slate)
- [ ] Light mode and dark mode both tested
- [ ] All four states (default, loading, empty, error) styled correctly
- [ ] Typography matches the Phase 10 table
- [ ] No hardcoded hex values outside `theme/colors.ts` or NativeWind config
- [ ] Safe area insets respected (no UI cut off by system bars)
- [ ] No lint errors or TypeScript errors introduced
- [ ] Tested on at least one iOS and one Android device/emulator

The full revamp is complete when every screen in the table above is checked off.

#next

iOS: San Francisco (SF Pro)
Android: Roboto
