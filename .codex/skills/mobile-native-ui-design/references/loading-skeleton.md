# Loading Skeletons

## Principle

Show skeleton screens, not spinners. Skeletons communicate the shape of incoming content so the page does not feel like a blank void. Spinners are acceptable only for the initial app load and button-level actions.

---

## Shimmer Animation

Use `Animated.Value` with a loop to create the shimmer sweep:

```ts
const shimmer = useRef(new Animated.Value(0)).current;

useEffect(() => {
  Animated.loop(
    Animated.timing(shimmer, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true, // ← required for performance
    }),
  ).start();
}, [shimmer]);

const translateX = shimmer.interpolate({
  inputRange: [0, 1],
  outputRange: [-300, 300], // sweep width matches container
});
```

Render the sweep as a semi-transparent white overlay on top of the skeleton base:

```tsx
<View
  className="overflow-hidden rounded-lg"
  style={{ backgroundColor: colors.skeletonBase }}
>
  <Animated.View
    style={{
      ...StyleSheet.absoluteFillObject,
      transform: [{ translateX }],
      backgroundColor: colors.skeletonShimmer, // semi-transparent white
    }}
  />
</View>
```

---

## Token Requirements

The theme must define:

| Token | Light | Dark |
|-------|-------|------|
| `skeletonBase` | `#E5E7EB` (gray-200) | `#374151` (gray-700) |
| `skeletonShimmer` | `rgba(255,255,255,0.6)` | `rgba(255,255,255,0.08)` |

If the theme does not yet have these tokens, use `useThemeColors()` and derive them from existing surface tokens — never hardcode.

---

## Skeleton Primitives

Build composable skeleton primitives and compose them into layout skeletons:

```tsx
function SkeletonRect({
  width,
  height,
  className,
}: {
  width?: number | `${number}%`;
  height: number;
  className?: string;
}) {
  // animated shimmer applied here
  return (
    <View
      className={cn('overflow-hidden rounded', className)}
      style={{ width, height, backgroundColor: colors.skeletonBase }}
    >
      {/* shimmer overlay */}
    </View>
  );
}
```

---

## Card Skeleton

Matches a typical content card (image thumb + title + metadata):

```
┌──────────────────────────────────────┐
│ ████  ████████████████████           │  ← avatar + title rect
│       ██████████████                 │  ← subtitle rect
│       ████████ · ██████              │  ← meta + badge rects
└──────────────────────────────────────┘
```

```tsx
function CardSkeleton() {
  return (
    <View className="flex-row gap-3 p-4">
      <SkeletonRect width={48} height={48} className="rounded-full" />
      <View className="flex-1 gap-2 pt-1">
        <SkeletonRect width="80%" height={14} />
        <SkeletonRect width="55%" height={12} />
      </View>
    </View>
  );
}
```

---

## List Skeleton

Repeat the card skeleton 4–6 times. Do not randomize widths per render — pick fixed widths (`80%`, `55%`, `65%`) and keep them consistent across renders to avoid layout jitter:

```tsx
function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </>
  );
}
```

---

## Full-Screen Skeleton

For a screen's initial load, render the skeleton at the same level as the content — not in a modal or overlay:

```tsx
function MyScreen() {
  const { data, isLoading } = useMyQuery();

  if (isLoading) return <MyScreenSkeleton />;
  if (!data) return <EmptyState />;
  return <MyScreenContent data={data} />;
}
```

---

## Stagger Entry Animation

When data loads and replaces the skeleton, stagger list items with `FadeIn`:

```ts
// With Reanimated:
entering={FadeInDown.delay(index * 60).duration(250)}
```

This makes the list feel alive instead of all items popping in at once.

---

## Reduced Motion

When the user has reduced motion enabled, skip the shimmer loop and show a static gray rectangle:

```ts
import { AccessibilityInfo } from 'react-native';

const [reduceMotion, setReduceMotion] = useState(false);
useEffect(() => {
  AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
}, []);

// If reduceMotion: don't start the Animated.loop
```

---

## Rules

- Always use `useNativeDriver: true` on skeleton animations — JS-driven animations cause jitter during data fetching
- Never show both skeleton and empty state simultaneously — skeleton while loading, empty state when loaded with no data
- Use fixed width percentages — do not randomize on each render
- Mount the `Animated.loop` once in `useEffect` — restart it if the component remounts
- Skeleton shapes must approximate the real content layout — a mismatch breaks the transition
- Keep skeleton count close to what will actually load (4–6 items) — too many wastes layout time
