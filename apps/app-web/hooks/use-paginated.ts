import { chunk } from 'es-toolkit/compat';

import { Accessor } from '@/types';
import { callIfFn } from '@/utils/call-if-fn';

export interface UsePaginatedOptions {
  /**
   * The page number to retrieve.
   * @default 1
   */
  page?: number;
  /**
   * The number of items per page.
   * @default 10
   */
  pageSize?: number;
}

export interface UsePaginatedReturn<T> {
  pages: T[][];
  currentPage: T[];
  totalPages: number;
}

const defaultOptions = {
  page: 1,
  pageSize: 10,
} satisfies UsePaginatedOptions;

/**
 * @example
 * ```tsx
 * const { pages, currentPage, totalPages } = usePaginated(items, { page: 2, pageSize: 3 });
 *
 * console.log(pages); // [[item1, item2, item3], [item4, item5, item6], ...]
 * console.log(currentPage); // [item4, item5, item6]
 * console.log(totalPages); // 4
 * ```
 */
export function usePaginated<T>(
  items: T[] | Accessor<T[]>,
  options?: UsePaginatedOptions,
): UsePaginatedReturn<T> {
  const arr = callIfFn(items);

  if (arr.length <= 0) {
    return {
      pages: [],
      currentPage: [],
      totalPages: 0,
    };
  }

  const { page, pageSize } = {
    ...defaultOptions,
    ...options,
  };

  const pages = chunk(arr, pageSize);
  const currentPage = pages.at(page - 1) ?? [];
  const totalPages = pages.length;

  return {
    pages,
    currentPage,
    totalPages,
  };
}
