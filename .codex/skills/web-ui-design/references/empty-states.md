# Empty States — Design System

## Core Rule

Every list, table, or data-driven section needs an empty state. A blank container with no content is confusing and makes the app feel broken.

---

## Anatomy

An empty state has four parts:

1. **Icon container** — a rounded container holding a contextual icon
2. **Title** — short, specific, states what is missing
3. **Description** — explains why and what will cause content to appear
4. **Action** (optional) — a primary button that leads to the next step

```tsx
function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-[22px] border border-border/70 bg-muted/70 text-primary shadow-sm">
        <Icon className="size-8" />
      </div>
      <h3 className="mt-5 text-lg font-medium">{title}</h3>
      <p className="mt-2 max-w-[340px] text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {actionLabel && onAction ? (
        <Button className="mt-5" size="lg" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
```

---

## Usage

```tsx
{items.length === 0 ? (
  <EmptyState
    icon={Megaphone}
    title="No announcements yet"
    description="Announcements you publish will appear here. Post your first one to notify residents."
    actionLabel="Publish announcement"
    onAction={openCreateDialog}
  />
) : (
  <AnnouncementList items={items} />
)}
```

---

## Icon Selection

Choose an icon that directly represents the absent content — never use a generic fallback for every empty state:

| Content | Icon |
|---|---|
| Users / people | `Users` |
| Documents / requests | `FileText` |
| Announcements / posts | `Megaphone` |
| Schedules / events | `Calendar` |
| Photos / gallery | `ImageIcon` |
| Polls / votes | `Vote` |
| Search results | `SearchX` |
| Notifications | `Bell` |
| Settings / configs | `Settings` |

---

## Writing Copy

**Title** — state what is missing, be specific:
- ✅ "No announcements published yet"
- ❌ "Nothing here" / "Empty" / "No data"

**Description** — explain why it's empty and what the user should do:
- ✅ "Approved residents will appear here once registration requests are reviewed."
- ❌ "There is nothing to display."

**Action label** — a verb phrase that maps to a real action:
- ✅ "Publish announcement" / "Add official" / "Review requests"
- ❌ "Click here" / "Add new" / "Go"

---

## Search / Filter Empty State

When a search or filter returns no results (vs. "truly empty"), use different copy:

```tsx
{filteredItems.length === 0 && searchQuery ? (
  <EmptyState
    icon={SearchX}
    title={`No results for "${searchQuery}"`}
    description="Try a different search term or clear the filter."
  />
) : (
  <ItemList items={filteredItems} />
)}
```

---

## Error vs. Empty State

| Scenario | Pattern |
|---|---|
| Query failed (network/server error) | Inline error with retry button |
| Query succeeded, returned `[]` | Empty state |
| Query succeeded, all items filtered out | Empty state with search-specific copy |

---

## Placement

Render the empty state in the same container that would hold the list content. The `py-16` vertical padding self-manages spacing within a card or section body.

---

## Dark Mode

Use token-based classes (`bg-muted/70`, `border-border/70`, `text-primary`, `text-muted-foreground`) — the component is dark-mode safe when following this pattern.

---

## Anti-Patterns

- Do not render a blank container — always show an empty state.
- Do not use a generic message ("No data", "Nothing to show").
- Do not confuse filtered-empty with truly-empty — use different copy.
- Do not show a loading skeleton when data has loaded and is genuinely empty.
