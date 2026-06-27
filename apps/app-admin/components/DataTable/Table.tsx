'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table as PrimitiveTable,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/utils';
import {
  AlertTriangleIcon,
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
} from 'lucide-react';

import { useDataTableContext } from './DataTableContext';
import type { FilterEntries } from './useDataTable';
import { useDataTable } from './useDataTable';

function getColumnHeading<TData>(
  column: ReturnType<
    typeof useDataTable<TData, FilterEntries>
  >['table']['columns'][number],
) {
  return typeof column.heading === 'function'
    ? column.heading()
    : column.heading;
}

function getCellContent<TData>(
  column: ReturnType<
    typeof useDataTable<TData, FilterEntries>
  >['table']['columns'][number],
  item: TData,
  index: number,
) {
  const content =
    typeof column.cell === 'function' ? column.cell(item, index) : column.cell;

  if (content === null || content === undefined || content === '') {
    return <span className="text-muted-foreground">-</span>;
  }

  return content;
}

function getLinkValue<TData>(
  column: ReturnType<
    typeof useDataTable<TData, FilterEntries>
  >['table']['columns'][number],
  item: TData,
  index: number,
) {
  return typeof column.link === 'function'
    ? column.link(item, index)
    : column.link;
}

function getSummaryContent<TData>(
  column: ReturnType<
    typeof useDataTable<TData, FilterEntries>
  >['table']['columns'][number],
) {
  if (!column.summary) {
    return null;
  }

  return typeof column.summary === 'function'
    ? column.summary()
    : column.summary;
}

function HeaderTooltip({ content }: { content: React.ReactNode }) {
  const t = useTranslations('Common');
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center text-muted-foreground transition-colors hover:text-foreground"
          >
            <AlertTriangleIcon className="size-3.5" />
            <span className="sr-only">{t('showColumnDetails')}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent>{content}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function EmptyTableState() {
  const t = useTranslations('Common');

  return (
    <div className="flex flex-col items-center justify-center gap-1 px-6 py-12 text-center">
      <p className="font-medium text-foreground">{t('noRows')}</p>
      <p className="text-sm text-muted-foreground">
        {t('noRowsDescription')}
      </p>
    </div>
  );
}

function TableView() {
  const datatable = useDataTableContext();
  const loading =
    datatable.table.collection.items.length > 0
      ? false
      : datatable.table.loading;
  const visibleColumns = datatable.table.columns.filter(
    (column) => !column.hidden,
  );
  const skeletonRowCount = datatable.pagination.enabled
    ? Math.max(1, datatable.pagination.pageSize)
    : 5;

  return (
    <PrimitiveTable>
      {visibleColumns.length > 0 ? (
        <TableHeader>
          <TableRow>
            {visibleColumns.map((column, columnIndex) => {
              const heading = getColumnHeading(column);
              const sortIcon = !column.sortable ? null : !column.sortOrder ? (
                <ArrowUpDownIcon data-icon="inline-end" />
              ) : column.sortOrder === 'ASC' ? (
                <ArrowUpIcon data-icon="inline-end" />
              ) : (
                <ArrowDownIcon data-icon="inline-end" />
              );

              return (
                <TableHead
                  key={column.id}
                  colSpan={column.colSpan}
                  rowSpan={column.rowSpan}
                  className={cn(column.classNames?.heading)}
                >
                  <div className="flex items-center gap-2">
                    {datatable.table.selectableRows && columnIndex === 0 ? (
                      <input
                        type="checkbox"
                        checked={datatable.table.allRowsSelected}
                        onChange={(event) => {
                          if (event.target.checked) {
                            datatable.table.selectAllRows();
                            return;
                          }

                          datatable.table.deselectAllRows();
                        }}
                        className="size-4 rounded border-border accent-primary"
                        aria-label="Select all rows"
                      />
                    ) : null}

                    {column.sortable ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto px-0 hover:bg-transparent"
                        onClick={column.switchSortOrder}
                        disabled={datatable.table.loading}
                      >
                        {heading}
                        {sortIcon}
                      </Button>
                    ) : (
                      heading
                    )}

                    {column.tooltip ? (
                      <HeaderTooltip content={column.tooltip} />
                    ) : null}
                  </div>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
      ) : null}

      <TableBody>
        {loading
          ? Array.from({ length: skeletonRowCount }).map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {visibleColumns.map((column, columnIndex) => (
                  <TableCell
                    key={`${column.id}-${rowIndex}`}
                    className={cn(column.classNames?.cell)}
                  >
                    <div className="flex items-center gap-3">
                      {datatable.table.selectableRows && columnIndex === 0 ? (
                        <Skeleton className="size-4 rounded-sm" />
                      ) : null}
                      <Skeleton className="h-4 w-full max-w-40" />
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            ))
          : null}

        {!loading && datatable.table.collection.items.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={Math.max(visibleColumns.length, 1)}
              className="px-0"
            >
              <EmptyTableState />
            </TableCell>
          </TableRow>
        ) : null}

        {!loading
          ? datatable.table.collection.items.map((item, rowIndex) => {
              const rowId =
                datatable.table.collection.getItemValue(item) || `${rowIndex}`;
              const rowLabel =
                datatable.table.collection.getItemString(item) || rowId;

              return (
                <TableRow
                  key={`${rowId}-${rowIndex}`}
                  data-state={
                    datatable.table.isRowSelected(item) ? 'selected' : undefined
                  }
                >
                  {visibleColumns.map((column, columnIndex) => {
                    const content = getCellContent(column, item, rowIndex);
                    const linkValue = getLinkValue(column, item, rowIndex);
                    const href =
                      typeof linkValue === 'string' ? linkValue : undefined;

                    let cellContent = content;

                    if (href) {
                      cellContent = (
                        <Link
                          href={href}
                          className="inline-flex items-center text-primary hover:underline"
                          onClick={() => column.onClick?.(item, rowIndex)}
                        >
                          {content}
                        </Link>
                      );
                    } else if (column.onClick) {
                      cellContent = (
                        <button
                          type="button"
                          className="inline-flex items-center text-left transition-colors hover:text-primary"
                          onClick={() => column.onClick?.(item, rowIndex)}
                        >
                          {content}
                        </button>
                      );
                    } else if (linkValue === true) {
                      cellContent = (
                        <span className="inline-flex items-center font-medium text-primary">
                          {content}
                        </span>
                      );
                    }

                    return (
                      <TableCell
                        key={`${column.id}-${rowId}-${rowIndex}`}
                        colSpan={column.colSpan}
                        rowSpan={column.rowSpan}
                        className={cn(column.classNames?.cell)}
                      >
                        <div className="flex items-center gap-3">
                          {datatable.table.selectableRows &&
                          columnIndex === 0 ? (
                            <input
                              type="checkbox"
                              checked={datatable.table.isRowSelected(item)}
                              onChange={() =>
                                datatable.table.toggleSelectedRow(item)
                              }
                              className="size-4 rounded border-border accent-primary"
                              aria-label={`Select ${rowLabel}`}
                            />
                          ) : null}
                          {cellContent}
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })
          : null}
      </TableBody>

      {!loading &&
      datatable.table.collection.items.length > 0 &&
      datatable.table.summary ? (
        <TableFooter>
          {datatable.table.summary__loading ? (
            <TableRow>
              {visibleColumns.map((column) => (
                <TableCell key={`summary-loading-${column.id}`}>
                  <Skeleton className="h-4 w-full max-w-32" />
                </TableCell>
              ))}
            </TableRow>
          ) : datatable.table.summary__error ? (
            <TableRow>
              <TableCell
                colSpan={Math.max(visibleColumns.length, 1)}
                className="text-sm text-muted-foreground"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangleIcon />
                  Summary unavailable.
                </div>
              </TableCell>
            </TableRow>
          ) : (
            <TableRow>
              {visibleColumns.map((column) => (
                <TableCell
                  key={`summary-${column.id}`}
                  className={cn('font-medium', column.classNames?.summary)}
                >
                  {getSummaryContent(column)}
                </TableCell>
              ))}
            </TableRow>
          )}
        </TableFooter>
      ) : null}
    </PrimitiveTable>
  );
}

type TableComponent = typeof TableView & {
  collection: typeof useDataTable.collection;
};

export const Table = Object.assign(TableView, {
  collection: useDataTable.collection,
}) as TableComponent;
