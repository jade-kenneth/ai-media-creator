import { isNil } from 'es-toolkit';
import * as React from 'react';
import { twMerge } from 'tailwind-merge';
import { Merge } from 'type-fest';
import { Accessor } from '~/types/index';
import { callIfFn } from '~/utils/callIfFn';
import { splitProps } from '~/utils/splitProps';
import { PageHeader } from '../PageHeader';
import { Show } from '../Show';
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
import { FilterEntries, useDataTable, UseDataTableProps } from './useDataTable';

interface DataTableBaseProps {
  title?: string;
  description?: string;
  renderRightStartMenu?: React.ReactNode | Accessor<React.ReactNode>;
  renderRightEndMenu?: React.ReactNode | Accessor<React.ReactNode>;
  renderLeftStartMenu?: React.ReactNode | Accessor<React.ReactNode>;
  renderLeftEndMenu?: React.ReactNode | Accessor<React.ReactNode>;
  renderBeforeTable?: React.ReactNode | Accessor<React.ReactNode>;
  renderLeftBesideTable?: React.ReactNode | Accessor<React.ReactNode>;
  className?: string;
}

export type DataTableProps<T, F extends FilterEntries> = Merge<
  UseDataTableProps<T, F>,
  DataTableBaseProps
>;

export function DataTable<T, F extends FilterEntries>(
  props: DataTableProps<T, F>,
) {
  const [useDataTableProps, localProps] = splitProps(props, [
    'id',
    'name',
    'collection',
    'columns',
    'columnControls',
    'defaultSelectedRows',
    'loading',
    'summary__error',
    'summary__loading',
    'onExport',
    'onReload',
    'sort',
    'defaultSort',
    'onSortChange',
    'selectableRows',
    'selectedRows',
    'onSelectedRowsChange',
    'filter',
    'pagination',
    'search',
  ]);

  const datatable = useDataTable<any, any>(useDataTableProps);

  const hideHeader =
    isNil(props.title) &&
    isNil(props.description) &&
    !datatable.filter.enabled &&
    !datatable.search.enabled &&
    isNil(datatable.table.reload) &&
    isNil(datatable.table.export) &&
    isNil(localProps.renderLeftEndMenu) &&
    isNil(localProps.renderLeftStartMenu) &&
    isNil(localProps.renderRightEndMenu) &&
    isNil(localProps.renderRightStartMenu);

  return (
    <DataTableProvider value={datatable}>
      <Filter>
        <ColumnControls>
          <div
            className={twMerge(
              'relative flex w-full items-start gap-3 overflow-hidden',
              localProps.className,
            )}
          >
            <FilterContent />
            <div className="w-full overflow-hidden rounded-xl border border-[#EAECF0] bg-white dark:border-[#26272B] dark:bg-[#0A1117] inplay:border-[#26272B] inplay:bg-[#090D1C] crazywin:border-[#26272B] crazywin:bg-[#0A1117] happybingo:border-[#1F242F] happybingo:bg-[#0C111D]">
              <Show when={!hideHeader}>
                <div className="flex items-center gap-3 border-b border-[#EAECF0] px-4 py-3 dark:border-[#26272B] inplay:border-[#26272B] crazywin:border-[#26272B] happybingo:border-[#1F242F]">
                  <Show when={!isNil(props.title)}>
                    <PageHeader
                      size="sm"
                      heading={props.title}
                      subHeading={props.description}
                    />
                  </Show>
                  {callIfFn(localProps.renderLeftStartMenu)}
                  <FilterTrigger />
                  {callIfFn(localProps.renderLeftEndMenu)}
                  <Searchbar />
                  <div className="grow" />
                  <Export />
                  <ColumnControlsTrigger />
                  {callIfFn(localProps.renderRightStartMenu)}
                  <Reload />
                  {callIfFn(localProps.renderRightEndMenu)}
                </div>
              </Show>
              {callIfFn(localProps.renderBeforeTable)}
              <div className="flex w-full">
                <Table />
                {callIfFn(localProps.renderLeftBesideTable)}
              </div>
              <Pagination />
            </div>
            <ColumnControlsContent />
          </div>
        </ColumnControls>
      </Filter>
    </DataTableProvider>
  );
}

DataTable.collection = useDataTable.collection;
DataTable.clearStore = useDataTable.clearStore;
