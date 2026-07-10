'use client';

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
  restrictToParentElement,
  restrictToVerticalAxis,
} from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/utils';
import {
  Columns3Icon,
  GripVerticalIcon,
  RotateCcwIcon,
  SearchIcon,
} from 'lucide-react';

import { useDataTableContext } from '../DataTableContext';
import {
  ColumnControlsProvider,
  useColumnControlsContext,
  type UseColumnControlsProps,
  useColumnsControl,
} from './ColumnControlsContext';

interface ColumnControlsProps extends UseColumnControlsProps {
  children: React.ReactNode;
}

export function ColumnControls({ children, ...props }: ColumnControlsProps) {
  const columnControls = useColumnsControl(props);

  return (
    <ColumnControlsProvider value={columnControls}>
      {children}
    </ColumnControlsProvider>
  );
}

export function ColumnControlsTrigger() {
  const datatable = useDataTableContext();
  const columnsControl = useColumnControlsContext();

  if (!datatable.table.columnControls) return null;

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={() => columnsControl.setOpen(true)}
      disabled={datatable.table.loading}
      data-state={columnsControl.open ? 'open' : 'closed'}
    >
      <Columns3Icon data-icon="inline-start" />
      Columns
    </Button>
  );
}

export function ColumnControlsContent() {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const datatable = useDataTableContext();
  const columnsControl = useColumnControlsContext();

  const [search, setSearch] = React.useState('');

  const columns = React.useMemo(() => {
    const order = datatable.table.columnsOrder;
    const copy = datatable.table.columns.slice();
    const list = copy.filter((column) => {
      if (!column.controls.enabled) return false;
      if (!search) return true;
      return column.controls.label.toLowerCase().includes(search.toLowerCase());
    });

    list.sort((left, right) => order.indexOf(left.id) - order.indexOf(right.id));

    return list;
  }, [datatable.table.columns, datatable.table.columnsOrder, search]);

  const onDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) return;

      datatable.table.setColumnsOrder(
        arrayMove(
          datatable.table.columnsOrder,
          datatable.table.columnsOrder.indexOf(active.id.toString()),
          datatable.table.columnsOrder.indexOf(over.id.toString()),
        ),
      );
    },
    [datatable.table],
  );

  const resetColumns = React.useCallback(() => {
    const defaultOrder = datatable.table.columns
      .filter((column) => column.orderable)
      .map((column) => column.id);

    datatable.table.setColumnsOrder(defaultOrder);

    datatable.table.columns.forEach((column) => {
      if (column.hidden) {
        column.toggleHidden();
      }
    });
  }, [datatable.table]);

  if (!datatable.table.columnControls) return null;

  return (
    <Sheet open={columnsControl.open} onOpenChange={columnsControl.setOpen}>
      <SheetContent side="right" className="w-full max-w-lg">
        <SheetHeader>
          <SheetTitle>Column controls</SheetTitle>
          <SheetDescription>
            Show, hide, and reorder visible columns.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-3">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search column"
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 pb-4">
          <DndContext
            sensors={sensors}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={columns.map((column) => column.id)}
              strategy={verticalListSortingStrategy}
            >
              {columns.map((column) => {
                const content = (
                  <label className="flex items-center gap-3 text-sm">
                    <Checkbox
                      checked={!column.hidden}
                      onCheckedChange={(checked) => {
                        if (checked === 'indeterminate') return;

                        column.toggleHidden();

                        const hasCorrespondingFilter = datatable.filter.items.some(
                          (item) => item.id === column.id,
                        );

                        if (hasCorrespondingFilter) {
                          datatable.filter.setValue({ [column.id]: undefined });
                        }
                      }}
                    />
                    <span className="truncate">{column.controls.label}</span>
                  </label>
                );

                if (!column.orderable) {
                  return (
                    <div
                      key={column.id}
                      className="flex items-center gap-2 rounded-lg border border-border/70 px-3 py-2"
                    >
                      <GripVerticalIcon className="size-4 text-muted-foreground opacity-50" />
                      {content}
                    </div>
                  );
                }

                return (
                  <SortableItem key={column.id} id={column.id}>
                    {content}
                  </SortableItem>
                );
              })}
            </SortableContext>
          </DndContext>
        </div>

        <Separator />

        <SheetFooter>
          <Button type="button" variant="outline" onClick={resetColumns}>
            <RotateCcwIcon data-icon="inline-start" />
            Reset columns
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={() => columnsControl.setOpen(false)}
          >
            <Columns3Icon data-icon="inline-start" />
            Done
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
}

function SortableItem(props: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: props.id,
    });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        'flex items-center gap-2 rounded-lg border border-border/70 px-3 py-2 bg-card',
      )}
    >
      <button type="button" {...listeners} {...attributes}>
        <GripVerticalIcon className="size-4 cursor-grab text-muted-foreground" />
      </button>
      {props.children}
    </div>
  );
}
