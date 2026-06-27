import { createListCollection, ListCollection } from '@ark-ui/react';
import { uniq } from 'es-toolkit';
import { isString } from 'es-toolkit/compat';
import * as React from 'react';
import * as z from 'zod';
import { useControllableState } from '~/hooks/useControllableState';
import { DateRange, DateRangePreset, NumberRange, Option } from '~/types/index';

/*
 *----------------------------------------------
 *    FILTER
 *----------------------------------------------
 */

interface CommonFilterProps {
  label: string;
  /**
   * @description
   * If set to `false`, the filter will not be rendered.
   * This is useful if you want to conditionally hide/show a filter.
   * For example, if you want to hide a filter when future flag is disabled.
   * @default true
   */
  enabled?: boolean;
  /**
   * @description
   * If set to `true`, the corresponding element will be disabled.
   */
  disabled?: boolean;
  placeholder?: string;
  /**
   * @description
   * If set to `true`, will add a "clear" option
   * which will clear the value of the field.
   */
  clearable?: boolean;
  /**
   * @description
   * If set to `true`, will use the default value when the field is cleared
   * or when the "clear all" button is clicked.
   */
  useDefaultValueOnClear?: boolean;
  /**
   * @description
   * Removes top margin and radius and removes previous sibling radius.
   * This will result to items being attached to each other.
   */
  attached?: boolean;
}

export interface TextFilter extends CommonFilterProps {
  type: 'TEXT';
}

export interface UrlFilter extends CommonFilterProps {
  type: 'URL';
}

export interface EmailFilter extends CommonFilterProps {
  type: 'EMAIL';
}

export interface ToggleFilter extends CommonFilterProps {
  type: 'TOGGLE';
}

export interface SelectFilter extends CommonFilterProps {
  type: 'SELECT';
  options: Option[] | (() => Option[]);
}

export interface MultiSelectFilter extends CommonFilterProps {
  type: 'MULTI_SELECT';
  options: Option[] | (() => Option[]);
}

export interface AsyncSelectFilter extends CommonFilterProps {
  type: 'ASYNC_SELECT';
  options: (inputValue: string, previousValue: string) => Promise<Option[]>;
}

/** aka. `Combobox` */
export interface AsyncMultiSelectFilter extends CommonFilterProps {
  type: 'ASYNC_MULTI_SELECT';
  options: (inputValue: string, previousValue: string[]) => Promise<Option[]>;
  clearOnSelect?: boolean;
}

export interface DateFilter extends CommonFilterProps {
  type: 'DATE' | 'DATETIME';
}

export interface DateRangeFilter extends CommonFilterProps {
  type: 'DATE_RANGE' | 'DATETIME_RANGE';
  dual?: boolean;
  presets?: DateRangePreset[];
}

export interface NumberRangeFilter extends CommonFilterProps {
  type: 'NUMBER_RANGE';
  /** @default 0 */
  min?: number;
  /** @default 9999 */
  max?: number;
  hint?:
    | string
    | React.ReactNode
    | ((value: NumberRange) => string | React.ReactNode);
}

export type Filter =
  | TextFilter
  | UrlFilter
  | EmailFilter
  | SelectFilter
  | DateFilter
  | NumberRangeFilter
  | DateRangeFilter
  | MultiSelectFilter
  | AsyncMultiSelectFilter
  | AsyncSelectFilter
  | ToggleFilter;

export interface FilterEntries {
  [x: string]: Filter;
}

type GetFilterTypeValueType<T extends Filter> = T extends TextFilter
  ? string
  : T extends UrlFilter
  ? string
  : T extends EmailFilter
  ? string
  : T extends SelectFilter
  ? string
  : T extends MultiSelectFilter
  ? string[]
  : T extends AsyncMultiSelectFilter
  ? string[]
  : T extends NumberRangeFilter
  ? Partial<NumberRange> | null
  : T extends DateFilter
  ? Date | null
  : T extends DateRangeFilter
  ? Partial<DateRange> | null
  : T extends AsyncSelectFilter
  ? string
  : T extends ToggleFilter
  ? boolean
  : never;

type FilterToKeyValuePair<T extends FilterEntries> = {} & {
  [K in keyof T]?: GetFilterTypeValueType<T[K]>;
};

export interface UseFilterProps<F extends FilterEntries> {
  /**
   * @default true
   */
  enabled?: boolean;
  /**
   * ⚠️ **NOTE**
   *
   * If you want the filter to be hidden if it's corresponding column is hidden,
   * Then you must use the same ID for both the column and the filter.
   */
  entries?: F;
  value?: FilterToKeyValuePair<F>;
  defaultValue?: FilterToKeyValuePair<F>;
  onValueChange?: (value: FilterToKeyValuePair<F>) => void;
}

function useFilter<T extends FilterEntries>(props?: UseFilterProps<T>) {
  /* merge id and config */
  const items = React.useMemo(() => {
    if (!props?.entries) return [];

    return Object.entries(props.entries).map(([id, value]) => {
      return {
        id,
        ...value,
        enabled: value.enabled ?? true,
        disabled: value.disabled ?? false,
      };
    });
  }, [props?.entries]);

  const [value, _setValue] = useControllableState<Record<string, any>>({
    value: props?.value,
    defaultValue: props?.defaultValue ?? {},
    onChange: props?.onValueChange,
  });

  const setValue = React.useCallback(
    (next: Record<string, any>) => {
      _setValue((prev) => {
        const copy = { ...next };

        if (props && props.entries) {
          for (const key in copy) {
            const item = props.entries[key];

            if (
              item &&
              item.useDefaultValueOnClear &&
              props.defaultValue &&
              props.defaultValue[key]
            ) {
              const value = copy[key];
              const defaultValue = props.defaultValue[key];

              if (!value) copy[key] = defaultValue;

              /* ✏️ Might need to handle empty array for multi-select, etc. */
            }
          }
        }

        return {
          ...prev,
          ...copy,
        };
      });
    },
    [_setValue, props],
  );

  return {
    items,
    value,
    setValue,
    enabled: props?.enabled ?? true,
  };
}

/*
 *----------------------------------------------
 *    PAGINATION
 *----------------------------------------------
 */

export interface UsePaginationProps {
  /**
   * @default true
   */
  enabled?: boolean;
  count?: number;
  page?: number;
  pageSize?: number;
  defaultPage?: number;
  defaultPageSize?: number;
  onPageChange?: (value: number) => void;
  onPageSizeChange?: (value: number) => void;
  pageSizes?: number[];
  /**
   * force pagination to be in loading state
   */
  loading?: boolean;
}

function usePagination(props?: UsePaginationProps) {
  const count = props?.count ?? 0;
  const pageSizes = props?.pageSizes ?? [10, 25, 30, 40, 50];

  const [page, setPage] = useControllableState({
    value: props?.page,
    defaultValue: props?.defaultPage ?? 1,
    onChange: props?.onPageChange,
  });

  const [pageSize, setPageSize] = useControllableState({
    value: props?.pageSize,
    defaultValue: props?.defaultPageSize ?? 10,
    onChange(value) {
      setPage(1);
      props?.onPageSizeChange?.(value);
    },
  });

  const numOfPages = Math.ceil(count / pageSize);
  const hasNextPage = page < numOfPages;
  const hasPrevPage = page > 1;

  const next = () => setPage((n) => n + 1);
  const prev = () => setPage((n) => n - 1);

  const loading = props?.loading ?? false;

  return {
    enabled: props?.enabled ?? true,
    page,
    setPage,
    pageSize,
    setPageSize,
    pageSizes,
    hasNextPage,
    hasPrevPage,
    numOfPages,
    count,
    next,
    prev,
    loading,
  };
}

/*
 *----------------------------------------------
 *    SEARCH
 *----------------------------------------------
 */

export interface UseSearchProps {
  /**
   * @default false
   */
  enabled?: boolean;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
}

function useSearch(props?: UseSearchProps) {
  const [value, setValue] = useControllableState<string>({
    value: props?.value,
    defaultValue: props?.defaultValue ?? '',
    onChange: props?.onValueChange,
  });

  return {
    value,
    setValue,
    enabled: props?.enabled ?? false,
    placeholder: props?.placeholder,
  };
}

/*
 *----------------------------------------------
 *    TABLE
 *----------------------------------------------
 */

export type SortOrder = 'ASC' | 'DESC';

interface ColumnControlsConfig {
  /**
   * @default true
   */
  enabled?: boolean;
  label?: string;
}

export interface ColumnProps<T> {
  id: string;
  /**
   * Whether the column is totally hidden from table.
   * This is useful if you want to conditionally hide/show a column.
   * @example
   * ```ts
   * {
   *   id: 'new-column',
   *   enabled: !futureFlag.isEnabled,
   *   ...
   * },
   * {
   *   id: 'admin-column',
   *   enabled: isAdmin,
   *   ...
   * },
   * ```
   */
  enabled?: boolean;
  onClick?: (data: T, index: number) => void;
  colSpan?: number;
  rowSpan?: number;
  sortable?: boolean;
  hideable?: boolean;
  defaultHidden?: boolean;
  orderable?: boolean;
  cell: React.ReactNode | ((data: T, index: number) => React.ReactNode);
  heading?: string | React.ReactNode | (() => string | React.ReactNode);
  /**
   * aka. aggregates
   */
  summary?: React.ReactNode | (() => React.ReactNode);
  link?:
    | boolean
    | string
    | ((data: T, index: number) => string | boolean | undefined);
  tooltip?: string | React.ReactNode;
  controls?: ColumnControlsConfig;
  classNames?: {
    cell?: string;
    heading?: string;
    summary?: string;
  };
}

interface Sort {
  /**
   * Column ID
   */
  column: string;
  order: SortOrder;
}

export interface TableProps<T> {
  id: string;
  name?: string;
  collection: ListCollection<T>;
  columns: ColumnProps<T>[];
  /**
   * @default true
   */
  columnControls?: boolean;
  loading?: boolean;
  /**
   * Wheter to render aggregates.
   * Calculated based on `Column.summary` by default
   */
  summary?: boolean;
  /**
   * Whether the aggregates has error
   */
  summary__error?: boolean;
  /**
   * Whether the aggregates is loading
   */
  summary__loading?: boolean;
  onReload?: () => void;
  onExport?: () => void;
  sort?: Sort | null;
  defaultSort?: Sort | null;
  onSortChange?: (value: Sort | null) => void;
  selectableRows?: boolean;
  selectedRows?: string[];
  defaultSelectedRows?: string[];
  onSelectedRowsChange?: (value: string[]) => void;
}

function useTable<T>({
  id,
  name,
  collection,
  onReload,
  onExport,
  columns: userDefinedColumns,
  ...props
}: TableProps<T>) {
  /*
   *----------------------------------------------
   *    STORAGE KEYS
   *----------------------------------------------
   */

  const hiddenColumnsStorageKey = `${id}/columns/hidden`;
  const columnsOrderStorageKey = `${id}/columns/order`;

  /*
   *----------------------------------------------
   *    HIDDEN COLUMNS
   *----------------------------------------------
   */

  const [hiddenColumns, setHiddenColumns] = React.useState<string[]>(
    userDefinedColumns
      .filter((column) => column.defaultHidden)
      .map((column) => column.id),
  );

  const hideColumn = React.useCallback(
    (id: string) => {
      const value = [...hiddenColumns, id];
      localStorage.setItem(hiddenColumnsStorageKey, JSON.stringify(value));
      setHiddenColumns(value);
    },
    [hiddenColumns, hiddenColumnsStorageKey],
  );

  const showColumn = React.useCallback(
    (id: string) => {
      const value = hiddenColumns.filter((columnId) => columnId !== id);
      localStorage.setItem(hiddenColumnsStorageKey, JSON.stringify(value));
      setHiddenColumns(value);
    },
    [hiddenColumns, hiddenColumnsStorageKey],
  );

  React.useEffect(() => {
    const previousHiddenColumns = localStorage.getItem(hiddenColumnsStorageKey);
    if (previousHiddenColumns === null) return;
    const arr = z
      .array(z.string())
      .nullable()
      .catch([])
      .transform((v) => v ?? [])
      .parse(safeJsonParse(previousHiddenColumns));
    if (arr.length) setHiddenColumns(arr);
  }, [hiddenColumnsStorageKey]);

  /*
   *----------------------------------------------
   *    COLUMN ORDERS
   *----------------------------------------------
   */

  const [columnsOrder, _setColumnsOrder] = React.useState<string[]>([]);

  const setColumnsOrder = React.useCallback(
    (value: string[]) => {
      localStorage.setItem(columnsOrderStorageKey, JSON.stringify(value));
      _setColumnsOrder(value);
    },
    [columnsOrderStorageKey],
  );

  React.useEffect(() => {
    const previousColumnsOrder = localStorage.getItem(columnsOrderStorageKey);

    if (previousColumnsOrder === null) {
      _setColumnsOrder(
        userDefinedColumns
          .filter((column) => column.orderable)
          .map((column) => column.id),
      );

      return;
    }

    const arr = z
      .array(z.string())
      .nullable()
      .catch([])
      .transform((v) => v ?? [])
      .parse(safeJsonParse(previousColumnsOrder));

    if (arr.length) {
      _setColumnsOrder(arr);
    } else {
      _setColumnsOrder(
        userDefinedColumns
          .filter((column) => column.orderable)
          .map((column) => column.id),
      );
    }
  }, [columnsOrderStorageKey, userDefinedColumns]);

  /*
   *----------------------------------------------
   *    SORT
   *----------------------------------------------
   */

  const [sort, setSort] = useControllableState({
    value: props.sort,
    defaultValue: props.defaultSort ?? null,
    onChange: props.onSortChange,
  });

  /*
   *----------------------------------------------
   *    CHECKBOX
   *----------------------------------------------
   */

  const [selectedRows, setSelectedRows] = useControllableState<string[]>({
    value: props.selectedRows,
    defaultValue: props.defaultSelectedRows ?? [],
    onChange: props.onSelectedRowsChange,
  });

  const selectAllRows = () =>
    setSelectedRows((prev) => [
      ...new Set([
        ...prev,
        ...collection.items
          .map((item) => collection.getItemValue(item) ?? '')
          .filter(Boolean),
      ]),
    ]);

  const deselectAllRows = () => {
    setSelectedRows((prev) =>
      prev.filter(
        (rowId) =>
          !collection.items.some(
            (item) => collection.getItemValue(item) === rowId,
          ),
      ),
    );
  };

  const isRowSelected = (item: T) => {
    const id = collection.getItemValue(item) ?? '';
    return selectedRows.includes(id);
  };

  const toggleSelectedRow = (item: T) => {
    const id = collection.getItemValue(item) ?? '';

    setSelectedRows((prev) => {
      return prev.includes(id)
        ? prev.filter((rowId) => rowId !== id)
        : [...prev, id];
    });
  };

  const allRowsSelected =
    collection.items.length > 0 &&
    collection.items.every((d) =>
      selectedRows.includes(collection.getItemValue(d) ?? ''),
    );

  /*
   *----------------------------------------------
   *    COLUMN DETAILS
   *----------------------------------------------
   */

  const columns = React.useMemo(() => {
    const array = userDefinedColumns.map((column) => {
      const enabled = column.enabled ?? true;
      const colSpan = column.colSpan ?? 1;
      const rowSpan = column.rowSpan ?? 1;
      const hideable = column.hideable ?? false;
      const sortable = column.sortable ?? false;
      const orderable = column.orderable ?? false;
      const sortOrder = !sortable
        ? null
        : sort && sort.column === column.id
        ? sort.order
        : null;
      const link = column.link ?? null;
      const hidden = hideable ? hiddenColumns.includes(column.id) : false;

      return {
        ...column,
        enabled,
        hidden,
        colSpan,
        rowSpan,
        sortable,
        hideable,
        orderable,
        controls: {
          label: getReactNodeTextContent(column.heading),
          enabled: true,
          ...column.controls,
        },
        link,
        toggleHidden() {
          if (!hideable) return;
          if (hidden) showColumn(column.id);
          else hideColumn(column.id);
        },
        sortOrder,
        switchSortOrder() {
          if (!sortable) return;
          if (!sortOrder) {
            return setSort({
              order: 'DESC',
              column: column.id,
            });
          }

          if (sortOrder === 'DESC') {
            return setSort({
              order: 'ASC',
              column: column.id,
            });
          }

          setSort(null);
        },
      };
    });

    /* Keep array placement of non-orderable columns */

    const sorted = array.filter((column) => column.orderable);
    sorted.sort((i, j) => {
      return columnsOrder.indexOf(i.id) - columnsOrder.indexOf(j.id);
    });

    const res: typeof array = [];
    const len = array.length;

    let i = 0;
    let j = 0;

    for (; i < len; i++) {
      if (array[i].orderable) {
        res.push(sorted[j]);
        j++;
      } else {
        res.push(array[i]);
      }
    }

    return res.filter((column) => column.enabled);
  }, [
    columnsOrder,
    hiddenColumns,
    hideColumn,
    setSort,
    showColumn,
    sort,
    userDefinedColumns,
  ]);

  /* Save localstorage keys to be able to clear 'em later */
  React.useEffect(() => {
    const v = localStorage.getItem(DATATABLE__STORES_LOCALSTORAGE_KEY);
    const l =
      v == null
        ? []
        : z
            .array(z.string().trim().min(1).nullable().catch(null))
            .catch([])
            .parse(safeJsonParse(v))
            .filter(Boolean);

    localStorage.setItem(
      DATATABLE__STORES_LOCALSTORAGE_KEY,
      JSON.stringify(
        uniq([...l, hiddenColumnsStorageKey, columnsOrderStorageKey]),
      ),
    );
  }, [columnsOrderStorageKey, hiddenColumnsStorageKey]);

  return {
    id,
    name,
    collection,
    columns,
    loading: props.loading ?? false,
    summary: props.summary ?? columns.some((column) => !!column.summary),
    summary__error: props.summary__error ?? false,
    summary__loading: props.summary__loading ?? false,
    columnsOrder,
    setColumnsOrder,
    sort,
    setSort,
    reload: onReload,
    export: onExport,
    selectableRows: props.selectableRows ?? false,
    selectedRows,
    setSelectedRows,
    selectAllRows,
    deselectAllRows,
    isRowSelected,
    toggleSelectedRow,
    allRowsSelected,
    columnControls: props.columnControls ?? true,
  };
}

function getReactNodeTextContent(node: unknown): string {
  if (typeof node === 'string') {
    return node;
  }

  if (React.isValidElement<HTMLElement>(node)) {
    return getReactNodeTextContent(node.props.children);
  }

  if (Array.isArray(node)) {
    return node
      .map((childNode) => getReactNodeTextContent(childNode))
      .join(' ');
  }

  return '';
}

function safeJsonParse(value: unknown): unknown {
  if (!isString(value)) return null;

  try {
    return JSON.parse(value);
  } catch {
    console.warn('Failed to parse JSON:', value);
    return null;
  }
}

/*
 *----------------------------------------------
 *    DATATABLE
 *----------------------------------------------
 */

export interface UseDataTableProps<T, F extends FilterEntries>
  extends TableProps<T> {
  filter?: UseFilterProps<F>;
  pagination?: UsePaginationProps;
  search?: UseSearchProps;
}

export interface UseDataTableReturn
  extends ReturnType<typeof useDataTable<any, FilterEntries>> {}

export function useDataTable<T, F extends FilterEntries>(
  props: UseDataTableProps<T, F>,
) {
  const table = useTable(props);
  const filter = useFilter(props?.filter);
  const pagination = usePagination(props?.pagination);
  const search = useSearch(props?.search);

  return {
    table,
    filter,
    search,
    pagination,
  };
}

interface CollectionOptions<T> {
  items: T[];
  itemToValue: (item: T) => string;
  itemToString: (item: T) => string;
  isItemDisabled?: (item: T) => boolean;
}

useDataTable.collection = <T,>(options: CollectionOptions<T>) => {
  return createListCollection(options);
};

useDataTable.clearStore = () => {
  const v = localStorage.getItem(DATATABLE__STORES_LOCALSTORAGE_KEY);
  if (v == null) return;
  const l = z
    .array(z.string().nullable().catch(null))
    .catch([])
    .parse(safeJsonParse(v))
    .filter(Boolean);
  l.forEach((k) => localStorage.removeItem(k));
  setTimeout(() => {
    localStorage.removeItem(DATATABLE__STORES_LOCALSTORAGE_KEY);
  }, 1);
};

const DATATABLE__STORES_LOCALSTORAGE_KEY = 'web-admin/datatable/stores';
