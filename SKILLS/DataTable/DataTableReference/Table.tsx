import { Portal } from '@ark-ui/react/portal';
import {
  AlertTriangleIcon,
  ArrowDownIcon,
  CheckIcon,
} from '@untitled-theme/icons-react';
import { isBoolean, isNil, isString } from 'es-toolkit';
import Link from 'next/link';
import { twMerge } from 'tailwind-merge';
import { Checkbox } from '~/components/ui/Checkbox';
import { Tooltip } from '~/components/ui/Tooltip';
import { callIfFn } from '~/utils/callIfFn';
import { dataAttr } from '~/utils/dataAttr';
import { Empty } from '../Empty';
import { Show } from '../Show';
import { Skeleton } from '../ui/Skeleton';
import { useDataTableContext } from './DataTableContext';

export function Table() {
  const datatable = useDataTableContext();

  const loading =
    datatable.table.collection.items.length > 0
      ? false
      : datatable.table.loading;

  const empty =
    datatable.table.collection.items.length === 0 && !datatable.table.loading;

  return (
    <div
      className={twMerge(
        'relative',
        'block',
        'max-w-full',
        'grow',
        'overflow-x-auto',
        'overflow-y-hidden',
        'whitespace-nowrap',
        'scrollbar:h-2',
        'scrollbar-thumb:rounded-full',
        'scrollbar-thumb:bg-[#D0D5DD]',
        'scrollbar-track:bg-[#F2F4F7]',
        'dark:scrollbar-thumb:bg-[#333333]',
        'dark:scrollbar-track:bg-[#161B26]',
        'inplay:scrollbar-thumb:bg-[#333333]',
        'inplay:scrollbar-track:bg-[#161B26]',
        'crazywin:scrollbar-thumb:bg-[#333333]',
        'crazywin:scrollbar-track:bg-[#161B26]',
        'happybingo:scrollbar-thumb:bg-[#333333]',
        'happybingo:scrollbar-track:bg-[#161B26]',
      )}
    >
      <table
        id={datatable.table.id}
        className="w-full border-separate border-spacing-0"
        cellSpacing={0}
        cellPadding={0}
      >
        <Show when={!empty}>
          <thead>
            <tr>
              {datatable.table.columns.map((column, index) => {
                const heading = callIfFn(column.heading);
                const content = (
                  <div className="flex items-center gap-2">
                    <Show when={datatable.table.selectableRows && index === 0}>
                      <Checkbox.Root
                        checked={datatable.table.allRowsSelected}
                        onCheckedChange={(details) => {
                          if (details.checked === 'indeterminate') {
                            return;
                          } else if (details.checked) {
                            datatable.table.selectAllRows();
                          } else {
                            datatable.table.deselectAllRows();
                          }
                        }}
                      >
                        <Checkbox.Control>
                          <Checkbox.Indicator>
                            <CheckIcon />
                          </Checkbox.Indicator>
                        </Checkbox.Control>
                        <Checkbox.HiddenInput />
                      </Checkbox.Root>
                    </Show>

                    {heading}

                    <Show when={column.sortable}>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={column.switchSortOrder}
                        aria-label={`Sort by ${heading}`}
                        data-sort={
                          column.sortOrder === 'ASC'
                            ? 'ascending'
                            : column.sortOrder === 'DESC'
                            ? 'descending'
                            : 'none'
                        }
                        className={twMerge(
                          'rounded-md',
                          'text-[#94969C]',
                          'light:text-[#475467]',
                          'transition-all',
                          'duration-200',
                          'disabled:cursor-not-allowed',
                          column.sortOrder === 'ASC' &&
                            'rotate-180 bg-[#d9d9d91a] text-[#d39400] inplay:text-[#F05127]',
                          column.sortOrder === 'DESC' &&
                            'rotate-0 bg-[#d9d9d91a] text-[#d39400] inplay:text-[#F05127]',
                        )}
                      >
                        <ArrowDownIcon className="size-4" />
                      </button>
                    </Show>
                  </div>
                );

                return (
                  <th
                    key={column.id}
                    hidden={column.hidden}
                    className={twMerge(
                      'border-b',
                      'border-[#EAECF0]',
                      'bg-[#F9FAFB]',
                      'px-6',
                      'py-4',
                      'text-xs',
                      'font-medium',
                      'text-[#475467]',
                      'dark:border-[#26272B]',
                      'dark:bg-[#161B26]',
                      'dark:text-[#94969C]',
                      'inplay:border-[#26272B]',
                      'inplay:bg-[#161B26]',
                      'inplay:text-[#94969C]',
                      'happybingo:border-[#1F242F]',
                      'happybingo:bg-[#0C111D]',
                      'happybingo:text-[#94969C]',
                      'crazywin:border-[#26272B]',
                      'crazywin:bg-[#161B26]',
                      'crazywin:text-[#94969C]',
                      column.classNames?.heading,
                    )}
                  >
                    <Show when={!!column.tooltip} fallback={content}>
                      <Tooltip.Root
                        positioning={{
                          placement: 'top',
                        }}
                      >
                        <Tooltip.Trigger>{content}</Tooltip.Trigger>
                        <Portal>
                          <Tooltip.Positioner>
                            <Tooltip.Content>
                              <Tooltip.Arrow>
                                <Tooltip.ArrowTip />
                              </Tooltip.Arrow>
                              {column.tooltip}
                            </Tooltip.Content>
                          </Tooltip.Positioner>
                        </Portal>
                      </Tooltip.Root>
                    </Show>
                  </th>
                );
              })}
            </tr>
          </thead>
        </Show>

        <tbody>
          <Show when={!loading} fallback={<Loading />}>
            {datatable.table.collection.items.map((item, rowIndex) => (
              <tr
                key={`${datatable.table.collection.getItemValue(
                  item,
                )}${rowIndex}`}
                className={twMerge(
                  'group',
                  '[&:last-of-type_td]:border-b-0',
                  'td:border-b',
                  'td:border-[#EAECF0]',
                  'td:bg-white',
                  'td:px-6',
                  'td:py-4',
                  'td:text-sm',
                  'td:text-[#475467]',
                  'dark:td:border-[#26272B]',
                  'dark:td:bg-[#0A161E]',
                  'dark:td:text-[#94969C]',
                  'inplay:td:border-[#26272B]',
                  'inplay:td:bg-[#090D1C]',
                  'inplay:td:text-[#94969C]',
                  'happybingo:td:border-[#1F242F]',
                  'happybingo:td:bg-[#0C111D]',
                  'happybingo:td:text-[#94969C]',
                  'crazywin:td:border-[#26272B]',
                  'crazywin:td:bg-[#0A161E]',
                  'crazywin:td:text-[#94969C]',
                )}
              >
                {datatable.table.columns
                  .filter((col) => !col.hidden)
                  .map((column, colIndex) => {
                    const href = callIfFn(column.link, item, rowIndex);

                    const fallback = (
                      <span className="font-mono opacity-50">-</span>
                    );

                    let content = callIfFn(column.cell, item, rowIndex);

                    if (isNil(content) || content === '') {
                      content = fallback;
                    } else if (isString(href)) {
                      content = (
                        <Link
                          href={href}
                          className="font-medium text-[#FBBD2C] underline-offset-3 hover:underline light:text-[#101828] inplay:text-[#F05127] happybingo:text-[#EAAA08]"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          {content}
                        </Link>
                      );
                    } else if (isBoolean(href) && href) {
                      content = (
                        <span className="font-medium text-[#FBBD2C] light:text-[#101828] inplay:text-[#F05127] happybingo:text-[#EAAA08]">
                          {content}
                        </span>
                      );
                    }

                    return (
                      <td
                        key={column.id}
                        hidden={column.hidden}
                        onClick={() => column.onClick?.(item, rowIndex)}
                        colSpan={column.colSpan}
                        className={twMerge(
                          'transition-colors',
                          'duration-300',
                          'group-hover:bg-white',
                          'ui-selected:bg-white',
                          'dark:group-hover:bg-[#1C2220]',
                          'dark:ui-selected:bg-[#1C2220]',
                          'inplay:group-hover:bg-[#1C2220]',
                          'inplay:ui-selected:bg-[#1C2220]',
                          'crazywin:group-hover:bg-[#1C2220]',
                          'crazywin:ui-selected:bg-[#1C2220]',
                          'happybingo:group-hover:bg-[#1C2220]',
                          'happybingo:ui-selected:bg-[#1C2220]',
                          column.classNames?.cell,
                        )}
                        data-selected={dataAttr(
                          datatable.table.isRowSelected(item),
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Show
                            when={
                              datatable.table.selectableRows && colIndex === 0
                            }
                          >
                            <Checkbox.Root
                              checked={datatable.table.isRowSelected(item)}
                              onCheckedChange={() => {
                                datatable.table.toggleSelectedRow(item);
                              }}
                            >
                              <Checkbox.Control>
                                <Checkbox.Indicator>
                                  <CheckIcon />
                                </Checkbox.Indicator>
                              </Checkbox.Control>
                              <Checkbox.HiddenInput />
                            </Checkbox.Root>
                          </Show>

                          {content}
                        </div>
                      </td>
                    );
                  })}
              </tr>
            ))}

            <Show when={empty}>
              <tr>
                <td className="w-full">
                  <Empty />
                </td>
              </tr>
            </Show>
          </Show>
        </tbody>

        <Show
          when={
            !empty &&
            datatable.table.summary &&
            !datatable.table.summary__loading &&
            datatable.table.summary__error
          }
        >
          <tfoot>
            <tr>
              <td
                className={twMerge(
                  'border-t',
                  'border-[#EAECF0]',
                  'bg-white',
                  'px-6',
                  'py-4',
                  'text-sm',
                  'font-semibold',
                  'text-[#475467]',
                  'first:text-[#101828]',
                  'first:uppercase',
                  'dark:border-[#26272B]',
                  'dark:bg-[#161B26]',
                  'dark:text-[#94969C]',
                  'dark:first:text-[#FBBD2C]',
                  'inplay:border-[#26272B]',
                  'inplay:bg-[#161B26]',
                  'inplay:text-[#94969C]',
                  'inplay:first:text-[#F05127]',
                  'happybingo:border-[#1F242F]',
                  'happybingo:bg-[#0C111D]',
                  'happybingo:text-[#94969C]',
                  'happybingo:first:text-[#EAAA08]',
                  'crazywin:border-[#26272B]',
                  'crazywin:bg-[#161B26]',
                  'crazywin:text-[#94969C]',
                  'crazywin:first:text-[#FBBD2C]',
                )}
              >
                <div className="flex items-center gap-2">
                  Total
                  <Tooltip.Root
                    positioning={{
                      placement: 'top-start',
                    }}
                  >
                    <Tooltip.Trigger type="button">
                      <AlertTriangleIcon className="size-4 text-[#D92D20]" />
                    </Tooltip.Trigger>
                    <Portal>
                      <Tooltip.Positioner>
                        <Tooltip.Content>
                          <Tooltip.Arrow>
                            <Tooltip.ArrowTip />
                          </Tooltip.Arrow>
                          Results exceed 1,000,000 records, please refine your
                          filters.
                        </Tooltip.Content>
                      </Tooltip.Positioner>
                    </Portal>
                  </Tooltip.Root>
                </div>
              </td>
              <td
                colSpan={datatable.table.columns.length}
                className={twMerge(
                  'border-t',
                  'border-[#EAECF0]',
                  'bg-white',
                  'px-6',
                  'py-4',
                  'text-sm',
                  'font-semibold',
                  'text-[#475467]',
                  'first:text-[#101828]',
                  'first:uppercase',
                  'dark:border-[#26272B]',
                  'dark:bg-[#161B26]',
                  'dark:text-[#94969C]',
                  'dark:first:text-[#FBBD2C]',
                  'inplay:border-[#26272B]',
                  'inplay:bg-[#161B26]',
                  'inplay:text-[#94969C]',
                  'inplay:first:text-[#F05127]',
                  'happybingo:border-[#1F242F]',
                  'happybingo:bg-[#0C111D]',
                  'happybingo:text-[#94969C]',
                  'happybingo:first:text-[#EAAA08]',
                  'crazywin:border-[#26272B]',
                  'crazywin:bg-[#161B26]',
                  'crazywin:text-[#94969C]',
                  'crazywin:first:text-[#FBBD2C]',
                )}
              />
            </tr>
          </tfoot>
        </Show>
        <Show
          when={
            !empty &&
            datatable.table.summary &&
            datatable.table.summary__loading
          }
        >
          <tfoot>
            <tr>
              {datatable.table.columns.map((column, idx) => {
                if (idx === 0)
                  return (
                    <td
                      key={column.id}
                      className={twMerge(
                        'border-t',
                        'border-[#EAECF0]',
                        'bg-white',
                        'px-6',
                        'py-4',
                        'text-sm',
                        'font-semibold',
                        'text-[#475467]',
                        'first:text-[#101828]',
                        'first:uppercase',
                        'dark:border-[#26272B]',
                        'dark:bg-[#161B26]',
                        'dark:text-[#94969C]',
                        'dark:first:text-[#FBBD2C]',
                        'inplay:border-[#26272B]',
                        'inplay:bg-[#161B26]',
                        'inplay:text-[#94969C]',
                        'inplay:first:text-[#F05127]',
                        'happybingo:border-[#1F242F]',
                        'happybingo:bg-[#0C111D]',
                        'happybingo:text-[#94969C]',
                        'happybingo:first:text-[#EAAA08]',
                        'crazywin:border-[#26272B]',
                        'crazywin:bg-[#161B26]',
                        'crazywin:text-[#94969C]',
                        'crazywin:first:text-[#FBBD2C]',
                        column.classNames?.summary,
                      )}
                    >
                      {callIfFn(column.summary)}
                    </td>
                  );
                if (typeof column.summary === 'undefined')
                  return (
                    <td
                      key={column.id}
                      className={twMerge(
                        'border-t',
                        'border-[#EAECF0]',
                        'bg-white',
                        'px-6',
                        'py-4',
                        'text-sm',
                        'font-semibold',
                        'text-[#475467]',
                        'first:text-[#101828]',
                        'first:uppercase',
                        'dark:border-[#26272B]',
                        'dark:bg-[#161B26]',
                        'dark:text-[#94969C]',
                        'dark:first:text-[#FBBD2C]',
                        'inplay:border-[#26272B]',
                        'inplay:bg-[#161B26]',
                        'inplay:text-[#94969C]',
                        'inplay:first:text-[#F05127]',
                        'happybingo:border-[#1F242F]',
                        'happybingo:bg-[#0C111D]',
                        'happybingo:text-[#94969C]',
                        'happybingo:first:text-[#EAAA08]',
                        'crazywin:border-[#26272B]',
                        'crazywin:bg-[#161B26]',
                        'crazywin:text-[#94969C]',
                        'crazywin:first:text-[#FBBD2C]',
                        column.classNames?.summary,
                      )}
                    />
                  );
                return (
                  <td
                    key={column.id}
                    className={twMerge(
                      'border-t',
                      'border-[#EAECF0]',
                      'bg-white',
                      'px-6',
                      'py-4',
                      'text-sm',
                      'font-semibold',
                      'text-[#475467]',
                      'first:text-[#101828]',
                      'first:uppercase',
                      'dark:border-[#26272B]',
                      'dark:bg-[#161B26]',
                      'dark:text-[#94969C]',
                      'dark:first:text-[#FBBD2C]',
                      'inplay:border-[#26272B]',
                      'inplay:bg-[#161B26]',
                      'inplay:text-[#94969C]',
                      'inplay:first:text-[#F05127]',
                      'happybingo:border-[#1F242F]',
                      'happybingo:bg-[#0C111D]',
                      'happybingo:text-[#94969C]',
                      'happybingo:first:text-[#EAAA08]',
                      'crazywin:border-[#26272B]',
                      'crazywin:bg-[#161B26]',
                      'crazywin:text-[#94969C]',
                      'crazywin:first:text-[#FBBD2C]',
                      column.classNames?.summary,
                    )}
                  >
                    <Skeleton className="h-2.5 w-16" />
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </Show>
        <Show
          when={
            !empty &&
            datatable.table.summary &&
            !datatable.table.summary__loading &&
            !datatable.table.summary__error
          }
        >
          <tfoot>
            <tr>
              {datatable.table.columns.map((column) => (
                <td
                  key={column.id}
                  hidden={column.hidden}
                  colSpan={column.colSpan}
                  className={twMerge(
                    'border-t',
                    'border-[#EAECF0]',
                    'bg-white',
                    'px-6',
                    'py-4',
                    'text-sm',
                    'font-semibold',
                    'text-[#475467]',
                    'first:text-[#101828]',
                    'first:uppercase',
                    'dark:border-[#26272B]',
                    'dark:bg-[#161B26]',
                    'dark:text-[#94969C]',
                    'dark:first:text-[#FBBD2C]',
                    'inplay:border-[#26272B]',
                    'inplay:bg-[#161B26]',
                    'inplay:text-[#94969C]',
                    'inplay:first:text-[#F05127]',
                    'happybingo:border-[#1F242F]',
                    'happybingo:bg-[#0C111D]',
                    'happybingo:text-[#94969C]',
                    'happybingo:first:text-[#EAAA08]',
                    'crazywin:border-[#26272B]',
                    'crazywin:bg-[#161B26]',
                    'crazywin:text-[#94969C]',
                    'crazywin:first:text-[#FBBD2C]',
                    column.classNames?.summary,
                  )}
                >
                  {callIfFn(column.summary)}
                </td>
              ))}
            </tr>
          </tfoot>
        </Show>
      </table>
    </div>
  );
}

function Loading() {
  const datatable = useDataTableContext();
  const columns = datatable.table.columns.filter((col) => !col.hidden);
  const array = Array.from({
    length: datatable.pagination.pageSize,
  });

  return (
    <>
      {array.map((_, idx) => (
        <tr
          key={idx}
          className={twMerge(
            'td:border-b',
            'td:border-[#EAECF0]',
            'td:bg-white',
            'td:px-6',
            'td:py-4',
            'td:text-sm',
            'dark:td:border-[#26272B]',
            'dark:td:bg-[#0A161E]',
            'inplay:td:border-[#26272B]',
            'inplay:td:bg-[#090D1C]',
            'happybingo:td:border-[#1F242F]',
            'happybingo:td:bg-[#0C111D]',
            'crazywin:td:border-[#26272B]',
            'crazywin:td:bg-[#0A161E]',
            'last:td:border-b-0',
          )}
        >
          {columns.map((column) => (
            <td key={column.id}>
              <Skeleton className="h-2.5 w-16" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
