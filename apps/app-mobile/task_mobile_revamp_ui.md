# Home Screen UI Revamp — Full Implementation Plan

> **Branch:** `ai-powered`
> **Scope:** Home screen only (all sections). Other screens follow after this ships.
> **Stack:** Expo Router · React Native 0.81 · NativeWind 4 · Reanimated 4
> **Colors:** Variant D already in `theme/colors.ts` — navy `#1a1f5e` + gold `#F5C400`
> **Note:** Tags marked `[COMING SOON]` mean backend doesn't support it yet — build the UI with a coming-soon overlay or pill. Tags marked `[BACKEND READY]` are fully wired.

---

## Design Philosophy

The revamp transforms the current functional-but-flat layout into a **civic-premium** experience:

- **Human first** — show the member's real name (not parsed email), personalized greeting, their actual data front-and-center
- **Hierarchy through depth** — layered cards, subtle shadows, elevation system (not heavy Material-style, more iOS-leaning)
- **Action clarity** — every section has a single primary action visible without scrolling past the fold
- **Motion with purpose** — section entrances, skeleton shimmer, haptic feedback on interactive taps
- **Dark mode parity** — every component designed for both themes simultaneously

---

## Overall Screen Layout (Before vs After)

```
BEFORE (current)                  AFTER (revamped)
════════════════════              ══════════════════════════════
┌──────────────────┐              ┌──────────────────────────┐
│ [Logo] Org [🔔] │              │ [Logo] Org Name    [🔔] │ ← Tighter, search added
├──────────────────┤              ├──────────────────────────┤
│ Primary bg card  │              │ Gradient hero card       │ ← Proper name, weather pill
│ Greeting + stats │              │ + animated stat counters │
├──────────────────┤              ├──────────────────────────┤
│ Member ID pill │              │ Digital ID card (redesig)│ ← Card-style, name visible
├──────────────────┤              ├──────────────────────────┤
│ Pinned scroll →  │              │ [NEW] Active Requests    │ ← New widget (conditional)
├──────────────────┤              ├──────────────────────────┤
│ Quick actions    │              │ Quick Actions (redesign) │ ← Better icons, new actions
├──────────────────┤              ├──────────────────────────┤
│ "Announcements"  │              │ 📋 Bulletin Board        │ ← UI rename; pinned carousel
├──────────────────┤              │   (pinned + post list)   │   + posts under one label
│ Event recaps     │              ├──────────────────────────┤
├──────────────────┤              │ Event Recaps (same+)     │ ← Minor polish
│ Schedules        │              ├──────────────────────────┤
├──────────────────┤              │ Schedules (category icon)│ ← Category-colored accent
│ Polls [soon]     │              ├──────────────────────────┤
├──────────────────┤              ├──────────────────────────┤
│ Emergency ctcts  │              │ [NEW] Officials Carousel │ ← New horizontal section
└──────────────────┘              ├──────────────────────────┤
                                  │ Polls (better soon state)│ ← Better preview design
                                  ├──────────────────────────┤
                                  │ Emergency (SOS + cards)  │ ← SOS button + better cards
                                  └──────────────────────────┘

```

---

## Phase 1 — Foundation & Tokens

### Task 1.1 — Extend color tokens for new components

**File:** `theme/colors.ts`

Add missing semantic tokens needed by the revamp:

```typescript
// Add to colors object:
warningBg: '#fff7ed',
warningText: '#b45309',
warningBorder: '#fed7aa',
requestPendingBg: '#fffbea',
requestReviewBg: '#eef5ff',
requestApprovedBg: '#e8f7ee',
requestRejectedBg: '#fff0f0',
heroBg: '#1a1f5e',        // same as primary but semantic alias
heroOverlay: 'rgba(0,0,0,0.35)',
cardShadowColor: '#1a1f5e',

// Add to dark:
warningBg: 'rgba(180,83,9,0.15)',
warningText: '#fbbf24',
warningBorder: 'rgba(251,191,36,0.3)',
```

**Also add to `use-theme-colors.ts`** — expose all new tokens so components can use them via `useThemeColors()`.

---

### Task 1.2 — Add `useProfileName` hook

**File:** `hooks/use-profile-name.ts` (new)

Replace the fragile email-parsing approach in `home-screen.tsx` with a proper hook that:
1. Reads `meQuery.data?.me` for the profile (firstName from member profile if available, email fallback)
2. Returns `{ firstName, fullName, isLoaded }`

The current approach `extractFirstName(email)` — parsing `juan.delacruz@gmail.com` → `Juan.delacruz` — breaks on real names. We need the actual profile name.

```typescript
// Usage in home-screen.tsx:
const { firstName } = useProfileName();
```

**Note:** This requires the `me` query to return `memberProfile { firstName, lastName }`. Check the GraphQL schema — if not available, use email fallback with better parsing (split on `.` and take first segment).

---

## Phase 2 — Top Header Redesign

**File:** `features/home/components/static-top-header.tsx`

### Task 2.1 — Redesign StaticTopHeader

**Current issues:**
- No visual weight difference between logo area and action area
- Subtitle is only shown when `organizationSubtitle` prop is passed (never in practice)
- No search affordance

**Changes:**
1. Add `organizationMunicipality` subtitle line pulled from tenant — show "Municipality of ___" or the organization's city below the organization name (always, not conditionally on prop)
2. Tighten vertical padding from `py-4` to `py-3` — saves 8pt of height
3. Logo circle: increase border contrast in dark mode
4. Notification bell: use `notifications` (filled) when `unreadCount > 0`, keep `notifications-none` when zero
5. Add a `Search` icon button (right side, before bell) — [COMING SOON] shows toast "Search is coming soon!"
6. The shadow should use `cardShadowColor` at 8% opacity, not black

```
BEFORE:
┌──────────────────────────────────────┐
│ [●Logo]  Organization Uno         [🔔²]  │
│          (no subtitle)               │
└──────────────────────────────────────┘

AFTER:
┌──────────────────────────────────────┐
│ [●Logo]  Organization Uno         [🔍][🔔²]│
│          Municipality of Cebu City   │
└──────────────────────────────────────┘
```

**Dark mode:** Logo border uses `rgba(255,255,255,0.15)`. Header bg uses `colors.cardBg` (unchanged).

---

## Phase 3 — Hero Greeting Section Redesign

**File:** `features/home/components/greeting-header.tsx`

### Task 3.1 — Redesign GreetingHeader with animated stats and weather pill

**Current issues:**
- Stats at bottom separated by hairline — feels cheap
- No visual depth inside the card
- Day/sun icon feels disconnected from the date line
- Name comes from email parsing (fix via Task 1.2)

**Changes:**

1. **Date + weather row** (top of card)
   - Show `Tue, May 13` on left
   - Show a weather pill [COMING SOON] on right: `☁️ 31°C` with rounded pill bg `rgba(255,255,255,0.15)` — tapping shows toast "Weather is coming soon!"
   - Remove the floating day icon (was `MaterialIcons wb-sunny` in top-right absolute)

2. **Greeting text**
   - Keep Cebuano greeting logic (Maayong buntag/hapon/gabii)
   - Use actual `firstName` from `useProfileName` (not email-parsed)
   - Add wave emoji after name: `Maayong buntag, Juan! 👋`
   - Subtitle: change from Cebuano to English for broader reach: `"Here's what's happening in your organization today."`

3. **Stats row** — replace hairline dividers with pill-style stat cards
   - Each stat: small rounded rect `rgba(255,255,255,0.12)` bg, accent-colored number, white label
   - Add relevant icons before each stat label (MaterialIcons): `campaign` for Board (Bulletin Board count), `event` for Schedules, `history-edu` for Recaps

4. **Background** — add a subtle radial gradient overlay at top-right (white circle at 6% opacity, already exists — keep it, add a second at bottom-left at 4%)

```
BEFORE:
┌────────────────────────────────────┐
│ [📅Thu May 13]           [☀️icon]  │
│ Maayong buntag, juan!              │
│ Kani ang mga balita...             │
│ ─────────────────────────────────  │
│   5          3           2         │
│ Bulletin Bd  Schedules  Recaps     │
└────────────────────────────────────┘

AFTER:
┌────────────────────────────────────┐
│  Tue, May 13               [☁️ 31°C] [COMING SOON pill]  │
│                                    │
│  Maayong buntag,                   │
│  Juan! 👋                          │
│  Here's what's happening in your   │
│  organization today.                   │
│                                    │
│ ┌──────────┐ ┌─────────┐ ┌──────┐ │
│ │ 📢  5    │ │ 📅  3   │ │ 🎬 2 │ │
│ │  Board   │ │Schedules│ │Recaps│ │
│ └──────────┘ └─────────┘ └──────┘ │
└────────────────────────────────────┘
```

**Props change:** Add `isLoadingProfile?: boolean` to show skeleton on firstName while profile loads.

**Accessibility:** Keep `accessibilityRole="header"` on greeting text. Add `accessibilityLabel` to weather pill.

---

## Phase 4 — Digital Member ID Card Redesign

**File:** `features/home/components/member-id-banner.tsx`

### Task 4.1 — Redesign MemberIdBanner as a proper ID card

**Current:** A simple banner with badge icon, title, "Verify your residency" text, and a coming-soon pill. Feels like a button, not an ID card.

**Goal:** Make it look like an actual digital ID card that previews member info — enticing the user to "unlock" it once available.

**Visual design:**
```
┌─────────────────────────────────────────┐
│  ┌───────────────────────────────────┐  │
│  │ ORGANIZATION BUDDY MEMBER ID        │  │
│  │ ─────────────────────────────────│  │
│  │  [Avatar]   Juan Dela Cruz        │  │
│  │  initials   Purok 3, Org Uno     │  │
│  │             ● Active              │  │
│  │                                   │  │
│  │  [Barcode placeholder] [QR blur]  │  │
│  │  ─────────────────────────────── │  │
│  │  [COMING SOON] Tap to unlock      │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**Implementation details:**
1. Card background: gradient from `primary` (`#1a1f5e`) to `#2a3280` (slightly lighter navy)
2. Show member's actual initials in avatar circle (from `useProfileName`)
3. Show `firstName + lastName` and `Purok X, Organization Name` (from `useTenant` + profile)
4. Show `● Active` status badge in green `#86efac` text on dark, `#22863a` on light
5. Blurred barcode + QR placeholder at bottom: use `opacity-30` horizontal lines and a blurred square
6. Coming-soon overlay: semi-transparent overlay with gold "Coming Soon" pill
7. Shimmer animation using `react-native-reanimated` — looping `Animated.loop` moving a white gradient shimmer left to right (150ms delay, 1800ms duration)
8. Card aspect ratio: keep it wide (full width), height ~120pt

**Dark mode:** Same card bg — it's navy regardless of mode. Text and accent colors adjust only slightly.

---

## Phase 5 — Active Requests Widget (NEW SECTION)

**File:** `features/home/components/active-requests-widget.tsx` (new)

### Task 5.1 — Build conditional Active Requests widget

**Context:** [BACKEND READY] — We have `myDocumentRequests` query. This section only appears if the user has active (non-completed, non-cancelled) requests.

**Layout:**
```
┌─────────────────────────────────────────┐
│  My Active Requests              [All→] │
│  ─────────────────────────────────────  │
│  ┌───────────────────────────────────┐  │
│  │ 📄 Organization Clearance    [Review] │  │
│  │ Ref #BC-2025-0042                 │  │
│  │ Submitted May 10 · Under Review   │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ 📄 Certificate of Residency [Pen] │  │
│  │ Ref #CR-2025-0018                 │  │
│  │ Submitted May 8 · Pending         │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**Implementation:**
1. New hook `useActiveRequestsQuery` in `features/home/hooks/` — calls `myDocumentRequests` with `status: [PENDING, UNDER_REVIEW, APPROVED, READY_FOR_PICKUP]`, `first: 3`
2. `ActiveRequestsWidget` component — takes `requests[]`, shows max 2 items with "See all" if more
3. Status pill colors:
   - `PENDING` → gold pill (existing goldPillBg/Text)
   - `UNDER_REVIEW` → info pill (existing infoBg/Text)
   - `APPROVED` → success pill (existing successBg/Text)
   - `READY_FOR_PICKUP` → new: purple `#ede9fe` / `#7c3aed` / `#c4b5fd`
4. Each row: document icon (type-specific), request type label, reference number, submitted date, status pill
5. Tap → navigate to `/(main)/(tabs)/requests`
6. If zero active requests: **do not render this section at all** (no empty state here — keep screen clean)
7. Skeleton: 2 placeholder rows while loading

**Feature flag:** Wrap in `useFeatureFlag(FEATURE_FLAGS.MOBILE_REQUESTS)` — hide entirely if requests are disabled.

---

## Phase 6 — Quick Actions Redesign

**File:** `features/home/components/quick-action-grid.tsx`

### Task 6.1 — Redesign QuickActionButton with improved visual treatment

**Current issues:**
- Buttons feel flat — white card, thin border, small icon box
- 3 columns causes overflow on small screens
- No pressed state animation beyond `active:opacity-80`
- Icon box size (40×40) is below the 48×48dp minimum for comfort

**Changes:**

1. **Icon box**: increase from `h-10 w-10` to `h-12 w-12` (48pt), radius from `rounded-[12px]` to `rounded-2xl`
2. **Card padding**: from `px-[14px] py-[14px]` to `px-4 py-4` (canonical)
3. **Card size**: min-width stays `min-w-[47%]` — keep 2-column layout (2 per row is correct, not 3)
4. **Shadow**: add elevation shadow to each card — `shadowColor: colors.cardShadowColor`, `shadowOpacity: 0.06`, `shadowRadius: 8`, `elevation: 2`
5. **Pressed state**: add `useAnimatedStyle` from Reanimated — scale down to `0.97` on press, spring back on release
6. **Icon size**: increase from `size={20}` to `size={22}`
7. **Label font**: from `text-[13px] font-bold` to `text-sm font-semibold`

**New actions to add** (add to `home-screen.tsx` quickActions array):
- `Officials` → navigate to `/(main)/(tabs)/officials` (if `OFFICIALS` flag enabled) — tone: `info` (blue)
- `Bulletin Board` → toast "coming soon" — tone: `warn`, `comingSoon: true`

**New tone** — add `info` tone to `QuickActionTone` union:
```typescript
info: {
  iconBg: colors.infoBg,
  iconColor: colors.infoText,
}
```

**Updated full action list (in order):**
1. Request Document [BACKEND READY, flag-gated]
2. My Requests [BACKEND READY, flag-gated]
3. Schedules [BACKEND READY]
4. Emergency Contacts [BACKEND READY]
5. Community Map [COMING SOON]
6. Report Issue [COMING SOON]
7. Officials [BACKEND READY, flag-gated] — only renders if OFFICIALS flag on

```
BEFORE:
┌──────────────┐ ┌──────────────┐
│ [📄] small  │ │ [📁] small  │
│ Request Doc  │ │ My Requests  │
└──────────────┘ └──────────────┘

AFTER:
┌───────────────┐ ┌───────────────┐
│               │ │               │
│ [████]        │ │ [████]        │
│  48pt icon    │ │  48pt icon    │
│               │ │               │
│ Request Doc   │ │ My Requests   │
│ Create new req│ │ Track requests│
└───────────────┘ └───────────────┘
  ↑ subtle shadow    ↑ subtle shadow
  ↑ scale-down press animation
```

---

## Phase 7 — Bulletin Board: Pinned Posts Carousel

**File:** `features/home/components/pinned-announcements-carousel.tsx` (new)

### Task 7.1 — Replace horizontal ScrollView with a swipeable full-width carousel

**Context:** The home screen's "Bulletin Board" section leads with pinned posts — think of a real corkboard where the most important notices are pinned at eye level. The carousel is the visual equivalent of those pinned items.

**Current:** `ScrollView horizontal` — user has to scroll/drag to see multiple pinned items. No indication of how many there are.

**New:** Full-width swipeable carousel with pagination dots.

**Implementation:**
1. Use `FlatList` with `horizontal`, `pagingEnabled`, `showsHorizontalScrollIndicator={false}`
2. Each card takes full container width (`width: screenWidth - 32` — accounting for 16pt margins)
3. Pagination dots below the carousel — filled dot for active, `rgba(primary, 0.25)` for inactive
4. Auto-advance: if > 1 item, auto-advance every 5 seconds using `setInterval` inside `useEffect` (clear on unmount)
5. Only render this section if `pinnedAnnouncements.length > 0` (existing behavior — keep)

**Carousel card design** — full-width redesign of `AnnouncementCard` in carousel mode:
```
┌──────────────────────────────────────┐
│ [EMERGENCY]                          │
│                                      │
│ Water supply interruption in         │
│ Purok 1-3 this Friday                │
│                                      │
│ Water will be cut from 8AM to 6PM    │
│ due to pipeline maintenance.         │
│ Prepare water in advance.            │
│                                      │
│                         📢 May 13    │
└──────────────────────────────────────┘
          ●  ○  ○
```

**Card internals:**
- Left color bar (4pt wide) in emergency red or category color
- Category badge at top-left
- Title in `text-base font-bold` (16pt)
- Content preview `numberOfLines={3}` in `text-sm`
- Timestamp at bottom-right
- Card height: fixed `h-44` (176pt) so all cards are equal height in the carousel

---

## Phase 8 — Bulletin Board: Post List Redesign

**File:** `features/home/components/announcement-card.tsx`

**Framing note:** The data model stays `Announcement` everywhere in the code (GraphQL type, file names, variables). Only the **user-facing label** changes — `SectionHeader title="Bulletin Board"` with `actionLabel="See all"` navigating to `/announcements`. This is a UI rename, not a backend change.

### Task 8.1 — Redesign AnnouncementCard with cover image support

**Changes to the non-compact card:**

1. **Cover image** — if `announcement.coverImageUrl` exists, show it above the content at `h-32` with `contentFit="cover"` and `borderRadius` on top corners. [BACKEND READY — coverImageUrl field exists in schema]
2. **Category badge placement** — move to top-left overlay on the image when cover exists; keep current position when no image
3. **Content layout** — when no cover image, keep current icon + text row layout
4. **Read more affordance** — add `"Read more →"` in `colors.primary` at bottom-right of card, `text-[11px] font-medium`
5. **Emergency card** — replace left red border with a red top banner strip: `h-1` full-width bar at top of card in `colors.error`
6. **Timestamp** — right-align on the same row as the "Read more" link

```
WITH COVER IMAGE:
┌──────────────────────────────────────┐
│                                      │
│  [Cover image — 128pt tall]          │
│  [Event]  ← badge overlaid on img   │
│                                      │
├──────────────────────────────────────┤
│ Annual Health Awareness Program      │
│ The organization will be conducting...   │
│                                      │
│ May 10, 2026              Read more →│
└──────────────────────────────────────┘

WITHOUT COVER IMAGE (current layout, polished):
┌──────────────────────────────────────┐
│ [Health]                             │
│ [🏥img] Annual Health Program        │
│         The organization will be...      │
│                                      │
│ May 10, 2026              Read more →│
└──────────────────────────────────────┘

EMERGENCY:
┌──────────────────────────────────────┐  ← red top strip (h-1)
│ [Emergency]                          │
│ [🚨img] Water Supply Interruption    │
│         All puroks affected...       │
│                                      │
│ May 13, 2026              Read more →│
└──────────────────────────────────────┘
```

---

## Phase 9 — Event Recaps Section Polish

**File:** `features/event-posts/EventPostCard.tsx`

### Task 9.1 — Polish EventPostCard

_(Read the current `EventPostCard.tsx` before making changes — this is in `features/event-posts/`, not `features/home/components/`)_

Minor polish only — don't redesign significantly since Event Recaps is a secondary section:
1. Ensure dark mode colors are correct (use `useThemeColors` not hardcoded)
2. Add a subtle shadow matching quick action cards
3. Add `active:opacity-80` press feedback if missing
4. Show event date badge overlaid at top-right of image (if photo exists): `"May 10"` in a pill

---

## Phase 10 — Upcoming Schedules Section Redesign

**File:** `features/home/components/schedule-list-item.tsx`

### Task 10.1 — Add category icon and category-colored accent to ScheduleListItem

**Current:** Date box (navy bg, gold month, white day) + title + time pill + location. Good foundation.

**Changes:**
1. Add category icon — map each `ScheduleCategory` to a MaterialIcons icon name:
   ```typescript
   const categoryIconMap: Record<ScheduleCategory, string> = {
     GARBAGE_COLLECTION: 'delete-outline',
     VACCINATION: 'vaccines',
     CLINIC_SCHEDULE: 'local-hospital',
     PAYOUT_SCHEDULE: 'payments',
     ORGANIZATION_EVENT: 'celebration',
     CLEANUP_DRIVE: 'cleaning-services',
     GENERAL_SCHEDULE: 'event-note',
   };
   ```
2. Show category icon in a small `h-6 w-6` circle at top-right of the card (inside content area, not overlapping date box)
3. Add category label text below the location line in `text-[10px]` muted style
4. Left accent bar: 3pt wide colored bar based on category:
   - `GARBAGE_COLLECTION`, `CLEANUP_DRIVE` → green
   - `VACCINATION`, `CLINIC_SCHEDULE` → red/health
   - `PAYOUT_SCHEDULE` → gold
   - `ORGANIZATION_EVENT` → primary navy
   - `GENERAL_SCHEDULE` → muted

```
BEFORE:                          AFTER:
┌──────────────────────────┐     ┌───┬──────────────────────────┐
│ [MAY] [Title]     [9AM]  │     │ ▌ │ [MAY] [Title]     [9AM] │
│ [14 ] Tuesday            │     │ ▌ │ [14 ] Tuesday       [🗑] │
│       📍 Location        │     │ ▌ │       📍 Location        │
└──────────────────────────┘     │ ▌ │       Garbage Collection │
                                 └───┴──────────────────────────┘
                                   ↑ category-colored left bar
```

---

## Phase 11 — Organization Officials Spotlight (NEW SECTION)

**File:** `features/home/components/officials-spotlight.tsx` (new)

### Task 11.1 — Build horizontal officials carousel

**Context:** [BACKEND READY] — We have `officials` query. Show a horizontal scroll of official avatars.

**Layout:**
```
┌──────────────────────────────────────────┐
│  Organization Officials           [View all→]│
│                                          │
│  ←  [Avatar] [Avatar] [Avatar] [Avatar] →│
│     Capt.    Sec.     Kagd.   Kagd.      │
│     Juan     Maria    Pedro    Ana       │
└──────────────────────────────────────────┘
```

**Implementation:**
1. `OfficialsSpotlight` component takes `officials: OfficialRecordFragment[]`
2. Horizontal `FlatList` with `showsHorizontalScrollIndicator={false}`, `contentContainerClassName="gap-4 px-4"`
3. Each item: vertical flex column, 80pt wide
   - Avatar circle: `h-[56px] w-[56px]`, initials or photo (if available), navy bg with accent initial text
   - Name: `text-[11px] font-semibold` centered, `numberOfLines={1}`, 80pt max
   - Role: `text-[10px]` muted centered, `numberOfLines={1}`
4. Tapping an official → navigate to `/(main)/(tabs)/officials`
5. Show max 10 officials in the carousel
6. Add to `use-home-data.ts` hook: `officialsQuery` — `{ first: 10 }` with `staleTime: 300_000`
7. Only render section if `officials.length > 0`
8. Skeleton: 4 placeholder avatar circles while loading

```
Avatar item:
┌──────────┐
│  ● Juan  │   ← 56pt circle, navy bg
│  Dela    │
│  Cruz    │
│ Punong   │   ← role label
│ Org.    │
└──────────┘
  80pt wide
```

---

## Phase 12 — Community Polls Section (Better Coming Soon)

**File:** `features/home/components/community-polls-widget.tsx`

### Task 12.1 — Improve coming-soon design for Community Polls

**Current:** Poll card with fake data + `ComingSoonOverlay`. This is fine structurally but needs polish.

**Changes:**
1. Add pulsing animation to the "Coming soon" label — slow 1.5s loop opacity pulse via Reanimated
2. Change the overlay gradient: `linear-gradient` from `transparent` at 40% to `cardBg` at 100% (bottom fade)
3. Update the overlay CTA: "Cast your vote when this feature goes live! 🗳️"
4. Add a tappable "Notify me" button in the overlay [COMING SOON] → toast "We'll let you know!"
5. Keep the fake poll bars visible but blurred (`opacity-40`) to show the concept

```
┌──────────────────────────────────────┐
│ Which project should we prioritize?  │
│                                      │
│ Road Repair      ████████████ 60%   │  ← blurred/faded
│ Playground       █████        25%   │  ← blurred/faded
│ Health Center    ███          15%   │  ← blurred/faded
│ ──────────────────────────────────  │
│         ↓ coming soon gradient fade │
│    🗳️  Community Polls              │
│    Coming soon — have your say!      │
│                                      │
│    [Notify me when available]        │  ← coming soon, shows toast
└──────────────────────────────────────┘
```

---

## Phase 13 — Emergency Contacts Section Redesign

**File:** `features/home/components/emergency-contact-card.tsx`

### Task 13.1 — Add SOS banner + redesign contact cards

**New: SOS banner at the top of the emergency section** (in `home-screen.tsx`, before the contacts list):

```
┌──────────────────────────────────────┐
│ 🚨  Emergency?    [Call Hotline 911] │  ← red bg card, full width
│     Tap to call emergency services   │
└──────────────────────────────────────┘
```

Implementation — `EmergencySosBanner` component (new file in `features/home/components/`):
- Background: `colors.error` / `colors.errorBg` in dark
- Left: `🚨` emoji + "Emergency?" title + subtitle
- Right: a call button `[Call 911]` in white on red, rounded pill shape
- Pressing calls `openPhoneDialer('911')` directly
- Animate the `🚨` with a subtle scale pulse (Reanimated, 800ms, scale 1.0 → 1.1 → 1.0)

**EmergencyContactCard changes:**
1. **Type icon** — replace `support-agent` icon with type-specific icons:
   ```typescript
   const typeIconMap: Record<EmergencyContactType, string> = {
     ORGANIZATION_HALL: 'account-balance',
     ORGANIZATION_TANOD: 'security',
     HEALTH_CENTER: 'local-hospital',
     POLICE: 'local-police',
     FIRE_STATION: 'local-fire-department',
     AMBULANCE: 'airport-shuttle',
     DISASTER_RESPONSE_TEAM: 'emergency',
   };
   ```
2. **Alternate number** — if `contact.alternateNumber` exists, show it below primary number in `text-[10px]` muted
3. **Call button** — keep current design but increase to `h-11 w-11` and use proper shadow
4. **Type label** → use `getEmergencyContactTypeLabel` (already exists)

```
BEFORE:                          AFTER:
┌────────────────────────────┐   ┌────────────────────────────┐
│ [👤] BHW Name    [📞call] │   │ [🏥] Health Center  [📞] │
│       Health Center        │   │      BHW Maria Santos      │
│       0917 xxx xxxx        │   │      0917 xxx xxxx         │
└────────────────────────────┘   │      alt: 0927 xxx xxxx    │
                                 └────────────────────────────┘
```

---


## Phase 15 — Home Screen Layout & Data Wiring

**File:** `features/home/home-screen.tsx`

### Task 15.1 — Restructure home-screen.tsx with new section order and components

**New section render order:**
1. `StaticTopHeader` (with search button) — outside ScrollView
2. Inside ScrollView with `ViewWrapper`:
   1. `GreetingHeader` — updated props
   2. `MemberIdBanner` — redesigned ID card
   3. `ActiveRequestsWidget` — new, conditional, flag-gated
   4. `QuickActionGrid` — updated actions
   5. **Bulletin Board** section header (`SectionHeader title="Bulletin Board" actionLabel="See all"` → `/announcements`)
   6. Pinned announcements carousel (conditional on length > 0, no separate sub-header — sits inside Bulletin Board)
   7. Latest announcement posts list (announcement cards, below the carousel)
   8. Event recaps (with `SectionHeader title="Event Recaps"`)
   9. Upcoming schedules (with `SectionHeader title="Upcoming Schedules"` + "See all")
   10. `OfficialsSpotlight` — new section (conditional on length > 0)
   11. `CommunityPollsWidget` — with improved coming soon
   12. `EmergencySosBanner` — new SOS banner
   13. Emergency contacts list (with `SectionHeader title="Emergency Contacts"` + "See all")
3. Bottom padding `pb-8` inside last section

**Remove:** `extractFirstName` function — replaced by `useProfileName` hook.

**User-facing string renames (home screen only):**
| Old label | New label | Location |
|-----------|-----------|----------|
| `"Latest Announcements"` | `"Bulletin Board"` | `SectionHeader title` |
| `"📌 Pinned"` | `"📌 Pinned"` | Keep — pinned items *within* Bulletin Board |
| `"Announcements"` stat pill | `"Board"` | `GreetingHeader` stats |
| `"No announcements"` empty state | `"Nothing posted yet"` | `EmptyState title` |
| `"See all announcements"` | `"See all posts"` | `SectionHeader actionLabel` accessibility hint |

> **Out of scope for this task:** Renaming the `/announcements` route, the full Announcements list screen title, and the tab bar label. Those follow in the next screen-by-screen revamp pass.

**ViewWrapper padding audit:** Confirm `ViewWrapper` applies `px-4` and `gap-5` between sections. If it only wraps with padding but no gap, add `gap-5` to the `View` children or use a `gap-5 flex-col` wrapper.

---

### Task 15.2 — Update `use-home-data.ts` hook

**File:** `features/home/hooks/use-home-data.ts`

**Add:**
1. `officialsQuery` — `useOfficialsQuery({ first: 10 })` with `staleTime: 300_000`
2. Return `officials` from the hook (flattened from edges → nodes)
3. Include `officials` in the combined `isLoading` check

---

### Task 15.3 — Add `useActiveRequestsQuery` hook

**File:** `features/home/hooks/use-active-requests.ts` (new)

```typescript
// Fetch up to 3 active (non-terminal) requests for the widget
export function useActiveRequests() {
  const query = useMyDocumentRequestsQuery(
    { 
      first: 3,
      // filter to active statuses — check generated types for filter API
    },
    { staleTime: 60_000 }
  );
  
  const requests = query.data?.myDocumentRequests.edges.map(e => e.node) ?? [];
  const activeRequests = requests.filter(r => 
    !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(r.currentStatus)
  );
  
  return { activeRequests, isLoading: query.isLoading };
}
```

Note: Verify the exact filter API from `generated__types.ts` before implementing.

---

## Phase 16 — Animation & Interactions

### Task 16.1 — Add haptic feedback to interactive home elements

**File:** Use `expo-haptics` (already in Expo SDK)

Add light haptic feedback (`Haptics.impactAsync(ImpactFeedbackStyle.Light)`) on:
- Quick action button press
- Emergency contact call button press (use `Medium` impact for this one)
- SOS banner call button (use `Heavy` impact)
- Announcement card press

Wrap in try/catch — haptics can fail silently on some Android devices.

---

### Task 16.2 — Add skeleton shimmer animation

**File:** `features/home/components/home-screen-skeleton.tsx`

Replace the static skeleton placeholders with animated shimmer:
1. Use `react-native-reanimated`'s `useSharedValue` + `withRepeat` + `withTiming`
2. Shimmer: a white gradient moving left-to-right over gray placeholder shapes
3. Duration: 1200ms, loop infinite
4. Apply to: hero card placeholder, ID banner placeholder, quick action grid placeholders, announcement card placeholders

Note: Reanimated 4 API may differ from v2 — check the installed version (`4.1.1`) and use the correct API.

---

### Task 16.3 — Section reveal animation on scroll

**Optional enhancement** — if Reanimated work is progressing well, add a fade-in-up entrance for each section as it enters the viewport.

Use `react-native-reanimated` `FadeInDown` entering animation on section `View` wrappers:
```tsx
<Animated.View entering={FadeInDown.duration(300).delay(index * 60)}>
  {/* section content */}
</Animated.View>
```

Only apply to sections below the fold (skip hero + quick actions which are immediately visible). Keep `delay` proportional to section index to create a cascading effect.

---

## Phase 17 — Accessibility Audit

### Task 17.1 — Review and fix accessibility across all new components

Checklist for each new/changed component:

- [ ] `accessibilityRole` is set on every interactive element (`button`, `link`, `header`)
- [ ] `accessibilityLabel` describes the action clearly (not just the visual label)
- [ ] `accessibilityHint` on complex actions (what happens when you press)
- [ ] `accessibilityState` on items with states (coming-soon buttons should have `disabled: true`)
- [ ] Touch targets: all interactive elements ≥ 48×48pt (use `hitSlop` if visual is smaller)
- [ ] `numberOfLines` caps: ensure truncation doesn't hide critical info for VoiceOver users
- [ ] Color contrast: check all new color combinations (especially the hero card overlays)
- [ ] SOS banner: label "Call 911 for emergencies" not just "Call Hotline"

---

## Phase 18 — Dark Mode Audit

### Task 18.1 — Full dark mode verification for all new components

For each new component, confirm it uses `useThemeColors()` tokens exclusively:
- No hardcoded hex values except inside `colors.ts`
- No NativeWind color classes that don't have dark variants (e.g., `bg-white` without `dark:bg-[...]`)
- Test with `isDark: true` state manually or by switching device to dark mode

Dark mode specific checks:
- `MemberIdBanner` (ID card): card bg is always navy — check text contrast in dark
- `EmergencySosBanner`: use `colors.errorBg` bg + `colors.error` text in dark mode
- `ActiveRequestsWidget`: status pills use existing semantic tokens — verify dark variants
- `OfficialsSpotlight`: avatar circles use `colors.subtleFill` in dark

---

## Phase 19 — QA & Testing

### Task 19.1 — Device testing checklist

Test on:
- [ ] iPhone 15 (390×844) — primary iOS target
- [ ] iPhone SE 3rd gen (375×667) — small screen, ensure nothing clips
- [ ] Android 360×800 — common Android baseline
- [ ] Android 412×915 — Pixel-size Android

Per-device checks:
- [ ] Carousel pagination dots visible and sized correctly
- [ ] Quick action grid wraps correctly (2 columns, no overflow)
- [ ] Hero card stats don't overflow on long locale-formatted dates
- [ ] ID card aspect ratio looks correct (not too tall/short)
- [ ] Emergency SOS banner full-width on all sizes
- [ ] Officials carousel scrolls smoothly
- [ ] Pull-to-refresh works and triggers all queries
- [ ] Dark mode switch → no flash of unstyled content
- [ ] Offline → error screen appears, retry works

### Task 19.2 — Performance check

- [ ] Scroll performance: no frame drops in the officials horizontal scroll
- [ ] Skeleton screen appears immediately (before queries resolve)
- [ ] No unnecessary re-renders — wrap heavy list sections if needed
- [ ] `eventPostsQuery` infinite scroll still works (check `handleScroll` function after restructure)

---

## File Manifest (New and Changed)

### New files
| File | Purpose |
|------|---------|
| `features/home/components/active-requests-widget.tsx` | Widget showing user's active requests |
| `features/home/components/pinned-announcements-carousel.tsx` | Swipeable carousel for pinned announcements |
| `features/home/components/officials-spotlight.tsx` | Horizontal officials scroll section |
| `features/home/components/emergency-sos-banner.tsx` | SOS call banner at top of emergency section |
| `features/home/hooks/use-active-requests.ts` | Hook for fetching active document requests |
| `hooks/use-profile-name.ts` | Hook for resolved first/full name from profile |

### Modified files
| File | Changes |
|------|---------|
| `features/home/home-screen.tsx` | New section order, new components, useProfileName |
| `features/home/components/greeting-header.tsx` | Weather pill, animated stats, real name, new subtitle |
| `features/home/components/static-top-header.tsx` | Search button, subtitle always-on, notification icon |
| `features/home/components/member-id-banner.tsx` | Full redesign as ID card with shimmer |
| `features/home/components/quick-action-grid.tsx` | Larger touch targets, shadow, Reanimated press, new tones |
| `features/home/components/announcement-card.tsx` | Cover image support, read more, emergency strip |
| `features/home/components/schedule-list-item.tsx` | Category icon, category accent bar, category label |
| `features/home/components/emergency-contact-card.tsx` | Type-specific icons, alternate number, larger call button |
| `features/home/components/community-polls-widget.tsx` | Pulsing animation, gradient fade, notify-me button |
| `features/home/components/home-screen-skeleton.tsx` | Shimmer animation via Reanimated |
| `features/home/hooks/use-home-data.ts` | Add officialsQuery |
| `features/event-posts/EventPostCard.tsx` | Dark mode fix, shadow, date badge |
| `theme/colors.ts` | New semantic tokens (warning, requestStatus, heroOverlay) |

---

## Task Execution Order

Execute phases strictly in this sequence — later phases depend on earlier ones:

```
1.1 → 1.2 (foundation)
    ↓
2.1 (top header)
    ↓
3.1 (hero greeting)
    ↓
4.1 (ID card)
    ↓
5.1 (active requests widget + hook)
    ↓
6.1 (quick actions)
    ↓
7.1 (pinned carousel)
    ↓
8.1 (announcement card)
    ↓
9.1 (event post polish)
    ↓
10.1 (schedule item)
    ↓
11.1 (officials spotlight + hook update)
    ↓
12.1 (polls coming soon)
    ↓
13.1 (SOS banner + emergency card)
    ↓
15.1 → 15.2 → 15.3 (home screen wiring)
    ↓
16.1 → 16.2 → 16.3 (animations)
    ↓
17.1 (accessibility)
    ↓
18.1 (dark mode)
    ↓
19.1 → 19.2 (QA)
```

---

## Full Screen ASCII Mockup — Light Mode

```
┌────────────────────────────────────────────┐  ← iPhone 15 390pt wide
│ STATUS BAR                                 │
│ ┌──────────────────────────────────────┐  │
│ │ [●Logo]  Organization Uno       [🔍][🔔²]│  │  StaticTopHeader
│ │          Municipality of Cebu City   │  │  (white card, shadow)
│ └──────────────────────────────────────┘  │
│ ─── scroll area begins ─────────────────  │
│                                            │
│ ┌──────────────────────────────────────┐  │  GreetingHeader
│ │  Tue, May 13           [☁️ 31°C →]  │  │  (primary navy bg)
│ │                                      │  │
│ │  Maayong buntag,                     │  │
│ │  Juan! 👋                            │  │
│ │  Here's what's happening in your     │  │
│ │  organization today.                     │  │
│ │                                      │  │
│ │  ┌─────────┐ ┌─────────┐ ┌───────┐  │  │  Stats pills
│ │  │ 📢  5   │ │ 📅  3   │ │ 🎬  2│  │  │
│ │  │ Board   │ │Schedules│ │Recaps │  │  │
│ │  └─────────┘ └─────────┘ └───────┘  │  │
│ └──────────────────────────────────────┘  │
│                                            │
│ ┌──────────────────────────────────────┐  │  Digital ID Card
│ │ ORGANIZATION BUDDY MEMBER ID           │  │  (navy gradient bg)
│ │ ──────────────────────────────────  │  │
│ │  [JD]   Juan Dela Cruz              │  │  ← initials avatar
│ │  ●●●●   Purok 3 · Organization Uno      │  │
│ │         ● Active                    │  │
│ │                                      │  │
│ │  [≡≡≡≡≡≡≡≡≡≡≡≡≡]  [▓▓▓ QR]        │  │  ← blurred barcode + QR
│ │  ──────────────────────────────────  │  │
│ │      ✨ [Coming Soon] Tap to unlock  │  │  ← shimmer overlay
│ └──────────────────────────────────────┘  │
│                                            │
│ ● My Active Requests          [All→]      │  ActiveRequestsWidget
│ ┌──────────────────────────────────────┐  │  (only if requests exist)
│ │ 📄 Organization Clearance   [Under Rev.] │  │
│ │    Ref #BC-2025-0042                 │  │
│ │    Submitted May 10                  │  │
│ └──────────────────────────────────────┘  │
│                                            │
│ Quick Actions                              │  Section header
│ ┌──────────────────┐ ┌──────────────────┐ │
│ │  [████]          │ │  [████]          │ │  QuickActionGrid
│ │  Request Document│ │  My Requests     │ │  (2-col, shadow cards)
│ │  Create new req  │ │  Track requests  │ │
│ └──────────────────┘ └──────────────────┘ │
│ ┌──────────────────┐ ┌──────────────────┐ │
│ │  [████]          │ │  [████]          │ │
│ │  Schedules       │ │  Emergency       │ │
│ │  View events     │ │  Call lines      │ │
│ └──────────────────┘ └──────────────────┘ │
│ ┌──────────────────┐ ┌──────────────────┐ │
│ │  [░░░░]          │ │  [░░░░]          │ │  ← Coming soon (faded)
│ │  Community Map   │ │  Report Issue    │ │
│ │  Coming Soon ✦  │ │  Coming Soon ✦   │ │
│ └──────────────────┘ └──────────────────┘ │
│                                            │
│ 📋 Bulletin Board             [See all→]  │  ← section header (UI rename)
│ 📌 Pinned                                  │  Pinned carousel (inside Bulletin Board)
│ ┌──────────────────────────────────────┐  │  (full-width, paginated)
│ │ [Emergency]                          │  │
│ │                                      │  │
│ │  Water Supply Interruption           │  │
│ │  in Puroks 1-3 This Friday           │  │
│ │                                      │  │
│ │  Water will be cut from 8AM to 6PM   │  │
│ │  due to pipeline maintenance.        │  │
│ │                         📢 May 13   │  │
│ └──────────────────────────────────────┘  │
│                  ●  ○  ○                   │  ← pagination dots
│                                            │
│   (pinned carousel lives inside the       │
│    Bulletin Board section, no extra header)│
│                                            │
│ 📋 Bulletin Board             [See all→]  │  UI label for announcements
│ ┌──────────────────────────────────────┐  │  (backend: Announcement type)
│ │ [────── Cover image ──────────────]  │  │  ← with cover image
│ │ [Health]                             │  │
│ │ Annual Health Awareness Program      │  │
│ │ The organization will be conducting...   │  │
│ │ May 10, 2026           [Read more→]  │  │
│ └──────────────────────────────────────┘  │
│ ┌──────────────────────────────────────┐  │
│ │ [Event]                              │  │  ← no cover image
│ │ [🎉]  Organization Fiesta 2026           │  │
│ │       Join us on May 20 for the...   │  │
│ │ May 8, 2026            [Read more→]  │  │
│ └──────────────────────────────────────┘  │
│                                            │
│ Event Recaps                              │  Event recaps
│ ┌──────────────────────────────────────┐  │
│ │  [Photo coverage image]   May 10 ●  │  │  ← date badge
│ │  Cleanup Drive at Purok 4            │  │
│ │  Over 50 volunteers participated...  │  │
│ └──────────────────────────────────────┘  │
│                                            │
│ 📅 Upcoming Schedules         [See all→]  │  Schedules
│ ┌───┬──────────────────────────────────┐  │
│ │ ▌ │ [MAY]  Garbage Collection  [🗑] │  │  ← green accent bar
│ │ ▌ │ [14 ]  Tuesday              ──  │  │
│ │ ▌ │        📍 Purok 1-5            │  │
│ │ ▌ │        6AM–10AM · Pickup Day   │  │
│ └───┴──────────────────────────────────┘  │
│ ┌───┬──────────────────────────────────┐  │
│ │ ▌ │ [MAY]  Vaccination Drive   [💉] │  │  ← red accent bar
│ │ ▌ │ [18 ]  Saturday                 │  │
│ │ ▌ │        📍 Organization Hall         │  │
│ │ ▌ │        8AM–4PM · Free service  │  │
│ └───┴──────────────────────────────────┘  │
│                                            │
│ 🏛️ Organization Officials         [View all→] │  Officials spotlight
│ ← [JD][MG][PR][AR][KB][LS] →             │
│   Capt. Sec. Kagd Kagd Kagd Kagd          │
│   Juan  Mari  Pedr  Ana  Karl  Lisa       │
│                                            │
│ 🗳️ Community Polls          [Coming Soon] │  Polls widget
│ ┌──────────────────────────────────────┐  │
│ │ Which project should we prioritize?  │  │
│ │                                      │  │
│ │ Road Repair    ████████████  60%    │  │  ← faded/blurred
│ │ Playground     █████         25%    │  │
│ │ Health Center  ███           15%    │  │
│ │ ───────────────────────────────────  │  │
│ │  🗳️  Community Polls — Coming soon!  │  │  ← gradient overlay
│ │  [Notify me when available →]        │  │
│ └──────────────────────────────────────┘  │
│                                            │
│ ┌──────────────────────────────────────┐  │  SOS Banner
│ │ 🚨  Emergency?    [Call 911 →]      │  │  (red bg, pulsing icon)
│ │     Tap to call emergency services   │  │
│ └──────────────────────────────────────┘  │
│                                            │
│ 🚨 Emergency Contacts         [See all→]  │  Emergency contacts
│ ┌──────────────────────────────────────┐  │
│ │ [🏥]  BHW Maria Santos      [📞]    │  │
│ │       Health Center                  │  │
│ │       0917 123 4567                  │  │
│ │       alt: 0927 765 4321             │  │
│ └──────────────────────────────────────┘  │
│ ┌──────────────────────────────────────┐  │
│ │ [🚔]  Organization Police Post  [📞]    │  │
│ │       Police                         │  │
│ │       0917 987 6543                  │  │
│ └──────────────────────────────────────┘  │
│                                            │
│ ─── bottom padding pb-8 ───────────────── │
└────────────────────────────────────────────┘
   ↑ Tab bar below (managed by navigation)
```

---

## Full Screen ASCII Mockup — Dark Mode

```
┌────────────────────────────────────────────┐  ← dark mode
│ STATUS BAR (light content)                  │
│ ┌──────────────────────────────────────┐  │
│ │ [●Logo]  Organization Uno       [🔍][🔔] │  │  dark cardBg #12194a
│ │          Municipality of Cebu City   │  │  white text
│ └──────────────────────────────────────┘  │
│                                            │
│ ┌──────────────────────────────────────┐  │  Hero (same navy, brighter text)
│ │  Tue, May 13        [☁️ 31°C]        │  │
│ │  Maayong buntag, Juan! 👋            │  │
│ │  Here's what's happening...          │  │
│ │  ┌─────────┐ ┌─────────┐ ┌───────┐  │  │
│ │  │📢 5     │ │📅 3     │ │🎬 2   │  │  │  stats same look
│ │  └─────────┘ └─────────┘ └───────┘  │  │
│ └──────────────────────────────────────┘  │
│                                            │
│ ┌──────────────────────────────────────┐  │  ID card (navy works in dark too)
│ │ ORGANIZATION BUDDY MEMBER ID           │  │  gold accent text
│ │  [JD]   Juan Dela Cruz               │  │
│ │         Purok 3 · ● Active (green)   │  │
│ │  [blurred barcode]  [blurred QR]     │  │
│ │  ✨ [Coming Soon] Tap to unlock      │  │
│ └──────────────────────────────────────┘  │
│                                            │
│ ┌──────────────────────────────────────┐  │  Active requests — dark card #12194a
│ │ 📄 Organization Clearance  [Under Rev.]  │  │  border rgba(white,0.12)
│ └──────────────────────────────────────┘  │
│                                            │
│ ┌──────────────────┐ ┌──────────────────┐ │  Quick actions — dark card
│ │  Request Doc     │ │  My Requests     │ │  #12194a bg, gold icon bg
│ └──────────────────┘ └──────────────────┘ │
│                                            │
│ [Full carousel with dark card announcement]│  Emergency card: errorBg dark
│                                            │  [🚨 🚔 🏥] dark type icons
└────────────────────────────────────────────┘
```

---

## Component Spec Summary

| Component | New/Changed | Backend | Coming Soon |
|-----------|-------------|---------|-------------|
| `StaticTopHeader` | Changed | ✅ | Search button only |
| `GreetingHeader` | Changed | ✅ | Weather pill only |
| `MemberIdBanner` | Changed (full redesign) | ❌ | Whole feature |
| `ActiveRequestsWidget` | New | ✅ | — |
| `QuickActionGrid` | Changed | ✅ partial | Map, Report, Bulletin |
| `PinnedAnnouncementsCarousel` | New | ✅ | — |
| `AnnouncementCard` | Changed | ✅ | — |
| `EventPostCard` | Changed (minor) | ✅ | — |
| `ScheduleListItem` | Changed | ✅ | — |
| `OfficialsSpotlight` | New | ✅ | — |
| `CommunityPollsWidget` | Changed | ❌ | Whole feature |
| `EmergencySosBanner` | New | ✅ | — |
| `EmergencyContactCard` | Changed | ✅ | — |
| `HomeScreenSkeleton` | Changed | — | — |

---

_Last updated: 2026-05-13_
_Branch: ai-powered_
_Author: jade-kenneth_
