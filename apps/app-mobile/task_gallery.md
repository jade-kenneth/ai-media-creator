# Organization Gallery — Implementation Plan

## Objective

Display a unified photo gallery in the mobile app by aggregating images already uploaded to AWS S3 from existing `announcements`, `event-posts`, and `schedules` entities. No new database model, no admin upload flow — the gallery surfaces photos that admins already upload through their existing workflows.

## Architecture Overview

```
Mobile Gallery screen
  ↓ queries existing entities (announcements, event-posts, schedules)
  ↓ filters to those with imageUrl
  ↓ merges + sorts by createdAt desc
  → renders photo grid → lightbox
```

No new API module. No new MongoDB collection. Admin photos appear automatically when they upload images to announcements, event-posts, or schedules.

---

## Affected Surfaces

| App | Change |
|---|---|
| `org-system-api` | New `galleryFeed` query that aggregates imageUrls from existing collections |
| `org-system-mobile` | New Gallery tab, photo grid screen, lightbox viewer |

**No admin changes needed** — photos are managed through existing announcement/event-post/schedule flows.

---

## Phase 1 — API: Gallery Feed Query

### Task 1.1 — Add `gallery-feed.gql` schema

**File:** `apps/org-system-api/src/graphql/schemas/gallery-feed.gql`

```gql
enum GallerySourceType {
  ANNOUNCEMENT
  EVENT_POST
  SCHEDULE
}

type GalleryFeedItem {
  id: ID!
  sourceId: ID!
  sourceType: GallerySourceType!
  imageUrl: String!
  title: String
  caption: String
  createdAt: DateTime!
}

type GalleryFeedItemEdge implements Edge {
  cursor: Cursor!
  node: GalleryFeedItem!
}

type GalleryFeedConnection implements Connection {
  totalCount: Int!
  edges: [GalleryFeedItemEdge!]!
  pageInfo: CursorPageInfo!
}

extend type Query {
  galleryFeed(
    first: Int
    after: Cursor
  ): GalleryFeedConnection!
}
```

**Notes:**
- `galleryFeed` is public (no auth guard) — scoped to tenant's `organizationId` via `@CurrentTenant()`
- `title` maps to the source entity's title/name field
- `caption` maps to the source entity's description/body field (truncated to ~120 chars if long)
- `imageUrl` is the existing S3 URL already stored on the entity

### Task 1.2 — Gallery Feed Resolver + Service

**File:** `apps/org-system-api/src/modules/gallery-feed/gallery-feed.resolver.ts`
**File:** `apps/org-system-api/src/modules/gallery-feed/gallery-feed.service.ts`
**File:** `apps/org-system-api/src/modules/gallery-feed/gallery-feed.module.ts`

Service logic:
1. Query `announcements` where `organizationId = tenant.organizationId AND imageUrl IS NOT NULL`
2. Query `event-posts` where `organizationId = tenant.organizationId AND imageUrl IS NOT NULL`
3. Query `schedules` where `organizationId = tenant.organizationId AND imageUrl IS NOT NULL`
4. Map each to `GalleryFeedItem` (normalize `title`, `caption`, `imageUrl`, `sourceType`, `createdAt`)
5. Merge all three arrays, sort by `createdAt` descending
6. Apply cursor-based pagination over the merged result

Inject the existing repositories for `announcements`, `event-posts`, and `schedules` — do not create new collections.

Register `GalleryFeedModule` in root `AppModule`.

### Task 1.3 — Regenerate GraphQL types

Run the existing type generation script after schema changes:
```bash
cd apps/org-system-api && npx ts-node src/graphql/generate-types.ts
```

---

## Phase 2 — Mobile: Data Layer

### Task 2.1 — GraphQL document

**File:** `apps/org-system-mobile/react-query/gallery/graphql/gallery.ts`

```ts
import { gql } from 'graphql-request';

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
        node {
          ...GalleryFeedItem
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  ${GALLERY_FEED_ITEM_FRAGMENT}
`;
```

### Task 2.2 — Gallery operations + query keys

**File:** `apps/org-system-mobile/react-query/gallery/gallery-operations.ts`

Follow the exact pattern of `event-posts-operations.ts`:
- Export `GalleryFeedItemRecord` type alias from the generated fragment
- Export `galleryQueryKeys` with `.all`, `.feed(variables?)`
- Export `galleryFeedRequest` function
- Export `useGalleryFeedQuery` using `defineInfiniteQuery` with `getNextPageParam` reading `pageInfo.hasNextPage`

### Task 2.3 — Regenerate mobile types

**File:** `apps/org-system-mobile/react-query/generated__types.ts`

New types needed:
- `GalleryFeedItemFragment`
- `GalleryFeedQuery`
- `GalleryFeedQueryVariables`
- `GallerySourceType` enum

### Task 2.4 — Feature flag

**File:** `apps/org-system-mobile/utils/feature-flags.ts`

Add:
```ts
GALLERY: 'gallery',
```

---

## Phase 3 — Mobile: UI Feature

### Task 3.1 — Hook: `use-gallery-data.ts`

**File:** `apps/org-system-mobile/features/gallery/hooks/use-gallery-data.ts`

```ts
export function useGalleryData() {
  // calls useGalleryFeedQuery with { first: 30 }
  // staleTime: 5 * 60_000
  // returns: photos (flat GalleryFeedItemRecord[]), isLoading, isRefreshing, isError,
  //          onRefresh, retry, fetchNextPage, hasNextPage, totalCount
}
```

Flatten pages: `query.data?.pages.flatMap(p => p.galleryFeed.edges.map(e => e.node)) ?? []`

### Task 3.2 — Gallery skeleton

**File:** `apps/org-system-mobile/features/gallery/components/gallery-skeleton.tsx`

3-column grid of rounded rectangular skeleton cards (2:3 aspect ratio). Show 12 placeholder cells.

### Task 3.3 — Gallery photo grid item

**File:** `apps/org-system-mobile/features/gallery/components/gallery-grid-item.tsx`

Props: `{ photo: GalleryFeedItemRecord; onPress: () => void; width: number }`

- `Image` from `expo-image`, `contentFit="cover"`, fixed `width`, `height = width * 1.3`
- Rounded corners (`borderRadius: 10`)
- Subtle bottom gradient overlay if `title` or `caption` present
- Overlay: title in bold white, caption in smaller muted white
- Small source badge (top-right corner, pill): "Announcement" / "Event" / "Schedule" in matching color
- `accessibilityRole="button"`, `accessibilityLabel={photo.title ?? 'Gallery photo'}`

### Task 3.4 — Lightbox / fullscreen viewer

**File:** `apps/org-system-mobile/features/gallery/components/photo-lightbox.tsx`

Props: `{ photos: GalleryFeedItemRecord[]; initialIndex: number; visible: boolean; onClose: () => void }`

- `Modal` with `animationType="fade"`, black background
- Horizontal `FlatList` with `pagingEnabled`
- Each page: photo centered with `contentFit="contain"`
- Bottom overlay: title, caption, source type badge, formatted date
- Close button (X) top-right with `SafeAreaView`
- Page counter: "3 / 12"

### Task 3.5 — Gallery screen

**File:** `apps/org-system-mobile/features/gallery/gallery-screen.tsx`

```
GalleryScreen
  SafeAreaView (edges: ['top'])
    PageHeader title="Gallery" subtitle="Photos from announcements, events & schedules."
    [loading]   → GallerySkeleton
    [error]     → ErrorScreen
    [empty]     → centered text "No photos yet."
    [data]      → FlatList (numColumns=3, columnWrapperStyle gap)
                    renderItem → GalleryGridItem
                    onEndReached → fetchNextPage
                    refreshControl → RefreshControl
    PhotoLightbox (modal, controlled by selectedIndex state)
```

- Item width: `(screenWidth - padding * 2 - gap * 2) / 3` using `useWindowDimensions()`
- Header right slot: total count ("42 photos")

### Task 3.6 — Route entry file

**File:** `apps/org-system-mobile/app/(main)/(tabs)/gallery.tsx`

```tsx
import { GalleryScreen } from '@/features/gallery/gallery-screen';
export default function GalleryTab() {
  return <GalleryScreen />;
}
```

### Task 3.7 — Register Gallery tab in layout

**File:** `apps/org-system-mobile/app/(main)/(tabs)/_layout.tsx`

Add after the `officials` tab:
```tsx
const isGalleryEnabled = useFeatureFlag(FEATURE_FLAGS.GALLERY);

<Tabs.Screen
  name="gallery"
  options={{
    href: isGalleryEnabled ? undefined : null,
    title: 'Gallery',
    tabBarIcon: ({ color, focused, size }) => (
      <TabBarIcon
        color={color}
        focused={focused}
        activeIconName="photo-library"
        inactiveIconName="photo-library"
        size={size}
      />
    ),
  }}
/>
```

---

## Phase 4 — Integration & QA

### Task 4.1 — End-to-end smoke test

1. Upload an image on an existing announcement, event-post, or schedule via the admin
2. Enable the `gallery` feature flag for the organization
3. Launch the mobile app — verify Gallery tab appears
4. Navigate to Gallery — verify the uploaded photo appears with the correct source badge
5. Tap a photo — verify lightbox opens on the correct item
6. Swipe left/right — verify pagination works
7. Pull-to-refresh — verify the list updates

### Task 4.2 — Edge cases

- Entity has no `imageUrl` → excluded from gallery (not shown)
- No entities have images → empty state renders correctly
- Photo with no title/caption → grid item and lightbox render without overlay
- Network error → error state with retry button
- Very long caption → truncated in grid, full text in lightbox
- Portrait and landscape images → `contentFit="contain"` in lightbox, `contentFit="cover"` in grid

---

## File Checklist

### API (`apps/org-system-api`)

- [ ] `src/graphql/schemas/gallery-feed.gql` — SDL schema
- [ ] `src/graphql/generated/graphql.ts` — regenerate after schema change
- [ ] `src/modules/gallery-feed/gallery-feed.service.ts` — aggregates from existing repos
- [ ] `src/modules/gallery-feed/gallery-feed.resolver.ts`
- [ ] `src/modules/gallery-feed/gallery-feed.module.ts`
- [ ] `src/app.module.ts` — register `GalleryFeedModule`

### Mobile (`apps/org-system-mobile`)

- [ ] `utils/feature-flags.ts` — add `GALLERY` flag
- [ ] `react-query/gallery/graphql/gallery.ts` — GQL documents
- [ ] `react-query/gallery/gallery-operations.ts` — query keys + hooks
- [ ] `react-query/generated__types.ts` — update generated types
- [ ] `features/gallery/hooks/use-gallery-data.ts`
- [ ] `features/gallery/components/gallery-skeleton.tsx`
- [ ] `features/gallery/components/gallery-grid-item.tsx`
- [ ] `features/gallery/components/photo-lightbox.tsx`
- [ ] `features/gallery/gallery-screen.tsx`
- [ ] `app/(main)/(tabs)/gallery.tsx` — route entry
- [ ] `app/(main)/(tabs)/_layout.tsx` — add Gallery tab

---

## Implementation Order

1. **API** — schema → service (aggregate from existing repos) → resolver → module → register → regenerate types
2. **Mobile data layer** — GQL documents → operations → generated types
3. **Mobile UI** — hook → components (skeleton, grid-item, lightbox) → screen → route → tab registration
4. **QA** — smoke test both surfaces, edge cases
