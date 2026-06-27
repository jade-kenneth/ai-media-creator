# Unified Admin Gallery — Implementation Plan

## Objective

Make the admin Gallery page show **every photo members can see in the mobile Gallery tab** — not just the manually-uploaded `GalleryPhoto` records. Today:

- Admin Gallery (`/admin/gallery`) only lists `galleryPhotos` (manual uploads), capped at 60 + "Load more".
- Mobile Gallery tab calls `galleryFeed`, which aggregates cover images from `announcements`, `event-posts`, and `schedules` — **it does not include `galleryPhotos` at all**. So photos admins upload via "Upload photo" never actually reach members.

This plan:
1. Fixes the gap by folding `galleryPhotos` into `galleryFeed` as a new source type (`GALLERY_PHOTO`), so manual uploads finally show up on mobile.
2. Adds an **"All Photos"** tab to the admin Gallery page backed by `galleryFeed` — a read-only, unified view of everything members see, with a source badge and a link back to the originating record.
3. Keeps the existing CRUD/reorder grid as a **"Manage Uploads"** tab, unchanged in behavior.

---

## Architecture Overview

```
Before:
  Admin Gallery page  → galleryPhotos (manual uploads only, capped at 60)
  Mobile Gallery tab  → galleryFeed (announcements + event posts + schedules only)
                          ⚠ galleryPhotos never reaches mobile

After:
  galleryFeed = announcements + event posts + schedules + galleryPhotos (NEW)
                          ↓
  Admin Gallery page:
    Tab "All Photos"      → galleryFeed (read-only, all sources, badges, "View source")
    Tab "Manage Uploads"  → galleryPhotos (existing CRUD + reorder, unchanged)
                          ↓
  Mobile Gallery tab      → galleryFeed (now includes manual uploads too)
```

---

## Affected Surfaces

| App | Change |
|---|---|
| `org-system-api` | Extend `GallerySourceType` with `GALLERY_PHOTO`; `GalleryFeedService` merges `galleryPhotos` into the feed |
| `org-system-admin` | New `galleryFeed` query wiring; restructure `/admin/gallery` into tabs ("All Photos" + "Manage Uploads") |
| `org-system-mobile` | Minor: give `GALLERY_PHOTO` its own badge label (currently falls into the generic "Photo" default, which already works, but a dedicated label is clearer) |

---

## Phase 1 — API: Fold `GalleryPhoto` into `galleryFeed`

### Task 1.1 — Extend `GallerySourceType`

**File:** `apps/org-system-api/src/graphql/schemas/gallery-feed.gql`

```gql
enum GallerySourceType {
  ANNOUNCEMENT
  EVENT_POST
  SCHEDULE
  GALLERY_PHOTO
}
```

No other SDL changes needed — `GalleryFeedItem.sourceId` already maps cleanly to `GalleryPhoto.id`.

### Task 1.2 — Merge `galleryPhotos` in `GalleryFeedService`

**File:** `apps/org-system-api/src/modules/gallery-feed/gallery-feed.service.ts`

- Inject `GALLERY_PHOTOS_REPOSITORY` (same DI token pattern as the other three repositories).
- Add a fourth parallel query in `galleryFeed()`:
  ```ts
  this.galleryPhotosRepository
    .list(applyTenantFilter({}, organizationId), { sort: { createdAt: 'DESC' } })
    .collect()
  ```
- Add a `fromGalleryPhoto(photo: GalleryPhotoRecord): GalleryFeedItem` mapper:
  - `id: toGalleryItemId(GallerySourceType.GALLERY_PHOTO, photo.id)`
  - `sourceId: photo.id`
  - `sourceType: GallerySourceType.GALLERY_PHOTO`
  - `imageUrl: photo.imageUrl`
  - `title: photo.title`
  - `caption: photo.caption`
  - `createdAt: photo.createdAt`
- Add the mapped items to the `items` array before `.filter(hasImageUrl).sort(compareGalleryFeedItems)`. `GalleryPhoto.imageUrl` is required (never empty per `createGalleryPhoto` validation), so it always passes `hasImageUrl`.

### Task 1.3 — Wire the repository into the module

**File:** `apps/org-system-api/src/modules/gallery-feed/gallery-feed.module.ts`

- Import `GalleryPhotosRepositoryModule` (from `../gallery-photos/repositories/gallery-photos.repository.module`).

### Task 1.4 — Regenerate GraphQL types

- Run the project's codegen script so `GallerySourceType.GalleryPhoto` appears in `generated/graphql.ts` (API) and `generated__types.ts` (admin + mobile).

---

## Phase 2 — Admin: Data Layer for `galleryFeed`

### Task 2.1 — Add `galleryFeed` GraphQL operation

**File:** `apps/org-system-admin/react-query/graphql/gallery.ts`

Add (mirroring the mobile fragment in `apps/org-system-mobile/react-query/gallery/graphql/gallery.ts`):

```ts
export const GALLERY_FEED_ITEM_FRAGMENT = gql`
  fragment GalleryFeedItem on GalleryFeedItem {
    id
    sourceId
    sourceType
    imageUrl
    title
    caption
    createdAt
  }
`;

export const GALLERY_FEED_QUERY = gql`
  query GalleryFeed($first: Int, $after: Cursor) {
    galleryFeed(first: $first, after: $after) {
      totalCount
      edges {
        cursor
        node { ...GalleryFeedItem }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
  ${GALLERY_FEED_ITEM_FRAGMENT}
`;
```

### Task 2.2 — Add `useGalleryFeedQuery`

**File:** `apps/org-system-admin/react-query/gallery/gallery-operations.ts`

- Add `galleryQueryKeys.feed(variables)`.
- Add `galleryFeedRequest(...)`.
- Add `useGalleryFeedQuery` via `defineInfiniteQuery`, same shape as the mobile version (`after`-stripping for cache key, `getNextPageParam` from `pageInfo`).
- Export `GalleryFeedItemRecord = GalleryFeedItemFragment` type.

---

## Phase 3 — Admin UI: Unified Gallery Page

### Task 3.1 — Restructure `gallery-page.tsx` with Tabs

**File:** `apps/org-system-admin/features/gallery/gallery-page.tsx`

- Wrap the page body in shadcn `Tabs`:
  - `TabsList` with two `TabsTrigger`s: **"All Photos"** (default) and **"Manage Uploads"**.
  - `TabsContent value="all"` → new `AllPhotosTab` (Task 3.2).
  - `TabsContent value="manage"` → the existing CRUD grid, extracted as-is into `ManageUploadsTab` (Task 3.3).
- Keep the existing stat cards above the tabs, but source `Total Photos` from `galleryFeed.totalCount` (all sources) instead of `galleryPhotos.totalCount`. Add a second stat for `Manual Uploads` using the existing `galleryPhotos.totalCount`.

**shadcn components:** `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` (new import from `@/components/ui/tabs`).

### Task 3.2 — `AllPhotosTab` (new file)

**File:** `apps/org-system-admin/features/gallery/all-photos-tab.tsx`

- Uses `useGalleryFeedQuery({ first: 60 })` (infinite query) — same grid layout/sizing as the current photo grid (`grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5`, `aspect-[3/4]`).
- Each tile shows:
  - The image (`next/image`, same `fill`/`sizes` pattern as today).
  - A source `Badge` in the top-left corner:
    - `ANNOUNCEMENT` → `secondary` variant, label "Announcement"
    - `EVENT_POST` → `secondary` variant, label "Event"
    - `SCHEDULE` → `secondary` variant, label "Schedule"
    - `GALLERY_PHOTO` → `outline` variant, label "Upload"
  - Title/caption overlay on hover (same gradient pattern as today).
  - A "View source" `Button` (icon-only, `ExternalLink` from lucide) in the top-right, shown on hover — **only for non-`GALLERY_PHOTO` items** — that navigates via `next/link` to:
    - `ANNOUNCEMENT` → `/admin/announcements`
    - `EVENT_POST` → `/admin/event-posts`
    - `SCHEDULE` → `/admin/schedules`
    (These are list pages without per-item routes today, so link to the list; wrap in a `Tooltip` reading "Open in Announcements/Events/Schedules".)
- Add a filter `Select` above the grid: "All sources" / "Announcements" / "Events" / "Schedules" / "Uploads" — filters the already-fetched `photos` array client-side by `sourceType` (no new API param needed; `galleryFeed` has no `filter` arg per SDL).
- Loading skeleton: reuse the same `animate-pulse` grid pattern as `ManageUploadsTab`.
- Empty state: reuse `ModuleErrorState`/empty pattern, message "No photos yet — uploads, announcements, events, and schedules with images will appear here."
- "Load more" button identical to today's pattern, driven by `listQuery.hasNextPage` / `fetchNextPage`.

**shadcn components:** `Badge`, `Select` (`SelectTrigger`, `SelectContent`, `SelectItem`, `SelectValue`), `Tooltip` (`TooltipTrigger`, `TooltipContent`, `TooltipProvider`), `Button` (existing), `Skeleton` (optional, can keep the `animate-pulse div` pattern already used).

### Task 3.3 — `ManageUploadsTab` (extracted, minimal change)

**File:** `apps/org-system-admin/features/gallery/manage-uploads-tab.tsx`

- Move the current grid + upload/edit/delete/reorder logic from `gallery-page.tsx` into this component verbatim (same `useGalleryPhotosQuery`, `useGalleryPhotosCountQuery`, dialogs).
- No behavioral changes — this is a pure extraction so the new tab structure has somewhere to put the existing feature.
- Update the toolbar copy: "Photos you upload here, plus photos from announcements, events, and schedules, all appear to members — see the **All Photos** tab for the full picture."

**shadcn components:** none new — reuses `Button`, `DropdownMenu`, existing dialogs.

### Task 3.4 — Update stat cards

**File:** `apps/org-system-admin/features/gallery/gallery-page.tsx`

- `Total Photos` stat → `galleryFeed.totalCount` (via `useGalleryFeedQuery` first page, or a lightweight count-only query — `galleryFeed` has no dedicated count query in the SDL, so read `totalCount` off the first page response of `useGalleryFeedQuery`).
- Add `Manual Uploads` stat → existing `useGalleryPhotosCountQuery().data.galleryPhotos.totalCount`.
- Keep `Last Uploaded` stat as-is (from `galleryPhotos`, since that's the admin-controlled upload date).

**shadcn components:** none new — reuses existing `StatCard`.

---

## Phase 4 — Mobile: Dedicated badge for `GALLERY_PHOTO`

**File:** `apps/org-system-mobile/features/gallery/components/gallery-grid-item.tsx`

- Add an explicit `case GallerySourceType.GalleryPhoto:` in `getSourceBadge()` returning `{ label: 'Gallery', backgroundColor: 'rgba(124, 58, 237, 0.9)', color: '#fff' }` (currently falls into the generic default "Photo" — works, but a distinct label/color is clearer once these start appearing).
- No layout changes; this is a one-line addition to the existing switch.

---

## Phase 5 — Verification Checklist

- [ ] Upload a photo in **Manage Uploads** → confirm it appears in **All Photos** tab tagged "Upload".
- [ ] Confirm an announcement/event/schedule with a cover image appears in **All Photos** tagged correctly, with a working "View source" link.
- [ ] Confirm the same uploaded photo now appears in the **mobile** Gallery tab (closes the original gap).
- [ ] Confirm source filter `Select` narrows the grid correctly for each source type.
- [ ] Confirm `Total Photos` / `Manual Uploads` stat cards show correct, distinct counts.
- [ ] Confirm "Manage Uploads" CRUD (create/edit/delete/reorder) still works unchanged.
- [ ] Confirm pagination ("Load more") works for both tabs independently.
- [ ] Dark mode + responsive check (2/3/4/5 column breakpoints) on both tabs.
