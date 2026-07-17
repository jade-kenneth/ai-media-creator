'use client';

import * as React from 'react';
import { Merge } from 'type-fest';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/utils';

import { callIfFn } from '@/utils/call-if-fn';
import {
  ColumnControls,
  ColumnControlsContent,
  ColumnControlsTrigger,
} from './ColumnControls';
import { DataTableProvider } from './DataTableContext';
import { Export } from './Export';
import { Filter, FilterContent, FilterTrigger } from './Filter';
import { Pagination } from './Pagination';
import { Reload } from './Reload';
import { Searchbar } from './Searchbar';
import { Table } from './Table';
import {
  FilterEntries,
  useDataTable,
  UseDataTableProps,
  type Column,
  type DataTableSort,
  type DataTableSortOrder,
  type DateRange,
  type NumberRange,
  type Option,
} from './useDataTable';

type Slot = React.ReactNode | (() => React.ReactNode);

interface DataTableBaseProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  renderRightStartMenu?: Slot;
  renderRightEndMenu?: Slot;
  renderLeftStartMenu?: Slot;
  renderLeftEndMenu?: Slot;
  renderBeforeTable?: Slot;
  renderLeftBesideTable?: Slot;
  className?: string;
}

export type DataTableProps<T, F extends FilterEntries> = Merge<
  UseDataTableProps<T, F>,
  DataTableBaseProps
>;

function DataTableComponent<T, F extends FilterEntries>(
  props: DataTableProps<T, F>,
) {
  const {
    id,
    name,
    collection,
    columns,
    columnControls,
    defaultSelectedRows,
    loading,
    summary__error,
    summary__loading,
    onExport,
    onReload,
    sort,
    defaultSort,
    onSortChange,
    selectableRows,
    selectedRows,
    onSelectedRowsChange,
    filter,
    pagination,
    search,
    summary,
    title,
    description,
    renderRightStartMenu,
    renderRightEndMenu,
    renderLeftStartMenu,
    renderLeftEndMenu,
    renderBeforeTable,
    renderLeftBesideTable,
    className,
  } = props;

  const datatable = useDataTable<T, F>({
    id,
    name,
    collection,
    columns,
    columnControls,
    defaultSelectedRows,
    loading,
    summary__error,
    summary__loading,
    onExport,
    onReload,
    sort,
    defaultSort,
    onSortChange,
    selectableRows,
    selectedRows,
    onSelectedRowsChange,
    filter,
    pagination,
    search,
    summary,
  });

  return (
    <DataTableProvider value={datatable}>
      <Filter>
        <ColumnControls>
          <section className={cn('w-full flex flex-col gap-4', className)}>
            <Card className="border-border/70">
              <CardHeader className="flex flex-col gap-4 border-b border-border/70">
                {(title || description) && (
                  <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex flex-col gap-1">
                      {title ? <CardTitle>{title}</CardTitle> : null}
                      {description ? (
                        <p className="text-sm text-muted-foreground">
                          {description}
                        </p>
                      ) : null}
                    </div>
                    {callIfFn(renderRightEndMenu)}
                  </div>
                )}

                <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    {callIfFn(renderLeftStartMenu)}
                    <Searchbar />

                    {callIfFn(renderLeftEndMenu)}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {callIfFn(renderRightStartMenu)}
                    <Export />
                    <Reload />
                    <ColumnControlsTrigger />
                    <FilterTrigger />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="px-3">
                {callIfFn(renderBeforeTable)}

                <div
                  className={cn(
                    'flex flex-col gap-4',
                    renderLeftBesideTable
                      ? 'xl:flex-row xl:items-start'
                      : undefined,
                  )}
                >
                  <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-border/70">
                    <Table />
                  </div>

                  {renderLeftBesideTable ? (
                    <div className="xl:w-80 xl:min-w-80">
                      {callIfFn(renderLeftBesideTable)}
                    </div>
                  ) : null}
                </div>
                <div className="mt-4" />
                <Pagination />
              </CardContent>
            </Card>

            <FilterContent />
            <ColumnControlsContent />
          </section>
        </ColumnControls>
      </Filter>
    </DataTableProvider>
  );
}

type DataTableComponentType = typeof DataTableComponent & {
  clearStore: typeof useDataTable.clearStore;
  collection: typeof useDataTable.collection;
};

export const DataTable = Object.assign(DataTableComponent, {
  clearStore: useDataTable.clearStore,
  collection: useDataTable.collection,
}) as DataTableComponentType;

export type {
  Column,
  DataTableSort,
  DataTableSortOrder,
  DateRange,
  NumberRange,
  Option,
};
