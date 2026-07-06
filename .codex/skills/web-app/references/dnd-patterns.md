# Drag and Drop — @dnd-kit

## Stack

- `@dnd-kit/core` — `DndContext`, sensors, collision algorithms
- `@dnd-kit/sortable` — `SortableContext`, `useSortable`, `arrayMove`, sorting strategies
- `@dnd-kit/modifiers` — optional movement constraints (e.g., restrict to axis)
- `@dnd-kit/utilities` — `CSS` transform helper

---

## Standard Sortable List Pattern

### 1. Setup sensors

```tsx
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

const sensors = useSensors(
  useSensor(PointerSensor),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  }),
);
```

Always include both `PointerSensor` and `KeyboardSensor`. Keyboard support is required for accessibility.

### 2. Handle reorder

```tsx
function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event;
  if (!over || active.id === over.id) return;

  setItems((items) => {
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    return arrayMove(items, oldIndex, newIndex);
  });
}
```

### 3. Wrap the list

```tsx
<DndContext
  sensors={sensors}
  collisionDetection={closestCenter}
  onDragEnd={handleDragEnd}
>
  <SortableContext
    items={items.map((item) => item.id)}
    strategy={verticalListSortingStrategy}
  >
    {items.map((item) => (
      <SortableItem key={item.id} item={item} />
    ))}
  </SortableContext>
</DndContext>
```

---

## useSortable — Individual Sortable Item

```tsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableItem({ item }: { item: MyItem }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {/* Drag handle — apply listeners here, NOT to the whole card */}
      <button {...listeners} aria-label="Drag to reorder" type="button">
        <GripVertical className="size-4 text-muted-foreground" />
      </button>
      <p>{item.name}</p>
    </div>
  );
}
```

Apply `{...listeners}` to a **dedicated drag handle element**, not to the entire card. This preserves click and focus interactions on other interactive elements in the card.

---

## Collision Detection

| Algorithm | Use case |
|---|---|
| `closestCenter` | Vertical/horizontal lists, card grids |
| `closestCorners` | Kanban multi-column boards |
| `rectIntersection` | Large droppable zones |

Use `closestCenter` for sortable list use cases.

---

## Strategy Selection

| Strategy | Use case |
|---|---|
| `verticalListSortingStrategy` | Single-column vertical list |
| `horizontalListSortingStrategy` | Single-row horizontal list |
| `rectSortingStrategy` | Multi-column card grids |

---

## Constraining Movement

Use modifiers to restrict drag direction:

```tsx
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';

<DndContext
  modifiers={[restrictToVerticalAxis, restrictToParentElement]}
  ...
>
```

---

## Persisting Order to the Server

After `handleDragEnd`, optimistically update local state, then fire a mutation with the new order:

```tsx
function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event;
  if (!over || active.id === over.id) return;

  setItems((prev) => {
    const oldIndex = prev.findIndex((i) => i.id === active.id);
    const newIndex = prev.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(prev, oldIndex, newIndex);

    reorderMutation.mutate(
      reordered.map((item, idx) => ({ id: item.id, order: idx })),
    );

    return reordered;
  });
}
```

Roll back to the previous items state in the mutation `onError` callback.

---

## Anti-Patterns

- Do not apply `{...listeners}` to the whole card — use a dedicated handle element.
- Do not omit `KeyboardSensor` — keyboard reordering is required for accessibility.
- Do not use `CSS.Transform.toString` in `className` — apply it via `style.transform` only.
- Do not call `setItems` and `mutate` separately (race condition) — compute the new array once, use it for both.

---

## Related References

- `references/caching.md` — § Optimistic UI Rules for persisting reorder to the server with rollback
- `references/accessibility.md` — keyboard operability for sortable interactions
