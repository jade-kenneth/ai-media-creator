# Empty States

## Anatomy

Every empty state has four layers — only `heading` is required:

```
┌─────────────────────────┐
│                         │
│       [Icon]            │   48–64dp, muted color
│                         │
│    Heading text         │   16–17sp, semibold, primary text color
│                         │
│  Supporting body text   │   14sp, regular, secondary text color
│  (optional, 1–2 lines)  │
│                         │
│  [ Primary Action ]     │   optional CTA button
│                         │
└─────────────────────────┘
```

---

## Layout

Center vertically and horizontally within the container. Use `flex: 1` on the parent + `alignItems: 'center'` + `justifyContent: 'center'`. Add `paddingHorizontal: 32` so copy does not span edge-to-edge:

```tsx
<View className="flex-1 items-center justify-center gap-4 px-8">
  <MaterialIcons name="inbox" size={56} color={colors.mutedText} />
  <View className="items-center gap-1">
    <Text className="text-base font-semibold text-center" style={{ color: colors.bodyText }}>
      No results found
    </Text>
    <Text className="text-sm text-center" style={{ color: colors.mutedText }}>
      Try adjusting your search or filter.
    </Text>
  </View>
</View>
```

---

## Icon Selection

| Context | Icon name (MaterialIcons) | Size |
|---------|--------------------------|------|
| Empty list / inbox | `inbox` | 56dp |
| No search results | `search-off` | 56dp |
| No notifications | `notifications-none` | 56dp |
| No documents | `description` | 56dp |
| Error / failed load | `error-outline` | 56dp |
| No connection | `wifi-off` | 56dp |
| Nothing scheduled | `event-busy` | 56dp |
| No announcements | `campaign` | 56dp |

Always use `colors.mutedText` for the icon color — never brand color on empty state icons. The icon should feel neutral, not alarming.

---

## Two Distinct Contexts

### Truly Empty (no data yet)

No records exist yet. Invite the user to take action:
- Heading: "No [things] yet"
- Body: "When you [action], they'll appear here."
- CTA: Primary action that creates content

### Search / Filter Empty

Records exist, but the current filter/search returns nothing:
- Heading: "No results found"
- Body: "Try adjusting your search or removing filters."
- CTA: "Clear search" or "Reset filters" (not a create action)

Never show "No [things] yet" when the cause is an active search filter — it confuses the user into thinking they have no data.

---

## With Action

```tsx
<View className="flex-1 items-center justify-center gap-6 px-8">
  <MaterialIcons name="inbox" size={56} color={colors.mutedText} />
  <View className="items-center gap-1">
    <Text className="text-base font-semibold text-center" style={{ color: colors.bodyText }}>
      No requests yet
    </Text>
    <Text className="text-sm text-center" style={{ color: colors.mutedText }}>
      Your document requests will appear here once submitted.
    </Text>
  </View>
  <Pressable
    className="rounded-2xl px-6 py-3"
    style={{ backgroundColor: colors.brand }}
    onPress={onRequestDocument}
    accessibilityLabel="Request a document"
    accessibilityRole="button"
  >
    <Text className="text-sm font-semibold" style={{ color: colors.white }}>
      Request a Document
    </Text>
  </Pressable>
</View>
```

---

## Inside a FlatList

Pass to `ListEmptyComponent`. Do not use absolute positioning — the component renders in the list's natural flow:

```tsx
<FlatList
  data={data}
  renderItem={renderItem}
  ListEmptyComponent={
    isLoading ? null : (
      <View className="flex-1 items-center justify-center py-16 px-8 gap-4">
        <MaterialIcons name="inbox" size={48} color={colors.mutedText} />
        <Text className="text-sm text-center" style={{ color: colors.mutedText }}>
          Nothing here yet.
        </Text>
      </View>
    )
  }
/>
```

Return `null` for `ListEmptyComponent` during loading — show a skeleton instead.

---

## Copy Guidelines

- Heading: 3–5 words, sentence case, no punctuation
- Body: 1–2 short sentences. Explain what's missing AND what to do next
- CTA: Verb + noun ("Request Document", "Clear Search") — not "OK" or "Go"
- Never say "Oops", "Uh oh", or apologize — state facts calmly

---

## Dark Mode

All colors come from `useThemeColors()`. The empty state requires no special dark mode treatment beyond the token system — if tokens are correct, dark mode is automatic.

---

## Rules

- Icon is always `colors.mutedText` — not `colors.error` unless the state is a failure
- `ListEmptyComponent` returns `null` during loading — never show empty + skeleton simultaneously
- Keep gap between icon and text at `gap-4` (16dp) — tighter feels cramped, looser feels disconnected
- Do not animate the empty state — it appears once and stays
- The CTA (if present) is secondary importance — the heading + body are the primary communication
