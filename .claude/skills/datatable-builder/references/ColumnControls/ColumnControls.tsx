import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
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
import {
  CheckIcon,
  Columns03Icon,
  DotsGridIcon,
  SearchLgIcon,
  XCloseIcon,
} from '@untitled-theme/icons-react';
import * as React from 'react';
import { twMerge } from 'tailwind-merge';
import { Button } from '~/components/ui/Button';
import { Checkbox } from '~/components/ui/Checkbox';
import { Field } from '~/components/ui/Field';
import { Icon } from '~/components/ui/Icon';
import { Presence } from '~/components/ui/Presence';
import { dataAttr } from '~/utils/dataAttr';
import { useDataTableContext } from '../DataTableContext';
import {
  ColumnControlsProvider,
  useColumnControlsContext,
  UseColumnControlsProps,
  useColumnsControl,
} from './ColumnControlsContext';

interface ColumnsControlProps extends UseColumnControlsProps {
  children: React.ReactNode;
}

export function ColumnControls({ children, ...props }: ColumnsControlProps) {
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
      size="sm"
      variant="subtle"
      onClick={() => columnsControl.setOpen((v) => !v)}
      disabled={datatable.table.loading}
      data-state={columnsControl.open ? 'open' : 'closed'}
    >
      <Icon>
        <Columns03Icon />
      </Icon>
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

    list.sort((i, j) => order.indexOf(i.id) - order.indexOf(j.id));

    return list;
  }, [datatable.table.columns, datatable.table.columnsOrder, search]);

  if (!datatable.table.columnControls) return null;

  return (
    <Presence
      present={columnsControl.open}
      className="shrink-0 overflow-hidden [--width:275px] ui-open:animate-collapse-x-in ui-closed:animate-collapse-x-out"
    >
      <div
        className={twMerge(
          'flex',
          'max-w-[275px]',
          'min-w-[275px]',
          'flex-col',
          'rounded-xl',
          'border',
          'border-[#EAECF0]',
          'bg-white',
          'dark:border-[#26272B]',
          'dark:bg-[#0A1117]',
          'inplay:border-[#26272B]',
          'inplay:bg-[#0A1117]',
          'happybingo:border-[#333741]',
          'happybingo:bg-[#090D1C]',
          'crazywin:border-[#26272B]',
          'crazywin:bg-[#0A1117]',
        )}
      >
        <div className="flex justify-between border-b border-[#26272B] px-4 py-3 light:border-[#EAECF0] happybingo:border-[#333741]">
          <h2 className="text-sm font-semibold text-[#CECFD2] light:text-[#475467] inplay:text-[#CECFD2] happybingo:text-[#CECFD2]">
            Columns
          </h2>
          <button type="button" onClick={() => columnsControl.setOpen(false)}>
            <Icon className="text-[#85888E]">
              <XCloseIcon />
            </Icon>
          </button>
        </div>

        <div className="px-4 py-3">
          <Field.Root className="relative">
            <Field.Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search column"
              className="pl-10"
            />
            <SearchLgIcon className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-[#94969C]" />
          </Field.Root>
        </div>

        <div className="overflow-y-auto p-1">
          <DndContext
            sensors={sensors}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            collisionDetection={closestCenter}
            onDragEnd={async ({ active, over }) => {
              if (!over || active.id === over.id) return;

              datatable.table.setColumnsOrder(
                arrayMove(
                  datatable.table.columnsOrder,
                  datatable.table.columnsOrder.indexOf(active.id.toString()),
                  datatable.table.columnsOrder.indexOf(over.id.toString()),
                ),
              );
            }}
          >
            <div>
              <SortableContext
                items={columns}
                strategy={verticalListSortingStrategy}
              >
                {columns.map((column) => {
                  const content = (
                    <Checkbox.Root
                      size="sm"
                      checked={!column.hidden}
                      onCheckedChange={(details) => {
                        if (details.checked === 'indeterminate') return;

                        column.toggleHidden();

                        const hasCorrespondingFilter =
                          datatable.filter.items.some(
                            (item) => item.id === column.id,
                          );

                        if (hasCorrespondingFilter) {
                          datatable.filter.setValue({
                            [column.id]: undefined,
                          });
                        }
                      }}
                    >
                      <Checkbox.Control>
                        <Checkbox.Indicator>
                          <CheckIcon />
                        </Checkbox.Indicator>
                      </Checkbox.Control>
                      <Checkbox.Label className="text-sm font-medium text-[#CECFD2] select-none light:text-[#344054]">
                        {column.controls.label}
                      </Checkbox.Label>
                      <Checkbox.HiddenInput />
                    </Checkbox.Root>
                  );

                  if (!column.orderable) {
                    return (
                      <div
                        key={column.id}
                        className="flex items-center gap-2 px-2.5 py-2"
                      >
                        <button
                          type="button"
                          disabled
                          className="text-[#94969C] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <DotsGridIcon className="size-4" />
                        </button>
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
            </div>
          </DndContext>
        </div>
      </div>
    </Presence>
  );
}

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
}

function SortableItem(props: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className="flex items-center gap-2 px-2.5 py-2"
    >
      <button type="button" {...listeners} {...attributes}>
        <DotsGridIcon
          className="size-4 cursor-grab text-[#94969C] ui-dragging:cursor-grabbing"
          data-dragging={dataAttr(isDragging)}
        />
      </button>
      {props.children}
    </div>
  );
}
