import { Types } from 'mongoose';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export function clampPageSize(
  value: number | undefined,
  fallback = DEFAULT_PAGE_SIZE,
): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback;
  }

  return Math.min(MAX_PAGE_SIZE, Math.max(1, Math.trunc(value)));
}

export type FilterCondition<TEntity> = {
  equal?: TEntity;
  notEqual?: TEntity;
  in?: TEntity[];
  notIn?: TEntity[];
  greaterThan?: TEntity;
  greaterThanOrEqual?: TEntity;
  lesserThan?: TEntity;
  lesserThanOrEqual?: TEntity;
  regex?: TEntity;
  options?: TEntity;
  text?: TEntity;
};

export type RepositoryFilter<TEntity> = {
  [Key in keyof TEntity]?: TEntity[Key] extends Array<infer U>
    ? FilterCondition<U>
    : TEntity[Key] | FilterCondition<TEntity[Key]>;
};

export type RepositorySortDirection = 'ASC' | 'DESC';

export type RepositorySort<TEntity> = Partial<
  Record<Extract<keyof TEntity, string>, RepositorySortDirection>
>;

export interface RepositoryQueryOptions<TEntity> {
  sort?: RepositorySort<TEntity>;
}

export interface CursorPaginationInput {
  first?: number;
  after?: string;
}
export interface Edge<TEntity> {
  cursor: string;
  node: TEntity;
}

export interface CursorPageInfo {
  endCursor: string | null;
  hasNextPage: boolean;
}

export interface Connection<TEntity> {
  totalCount: number;
  edges: Array<Edge<TEntity>>;
  pageInfo: CursorPageInfo;
}

export interface OffsetLimitPaginationInput {
  page?: number;
  limit?: number;
}

export interface OffsetLimitPageInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface OffsetResult<TEntity> {
  items: TEntity[];
  pageInfo: OffsetLimitPageInfo;
}

export interface RepositoryList<TEntity> {
  collect(): Promise<TEntity[]>;
  connection(pagination?: CursorPaginationInput): Promise<Connection<TEntity>>;
  offset(
    pagination?: OffsetLimitPaginationInput,
  ): Promise<OffsetResult<TEntity>>;
}

export interface Repository<
  TEntity,
  TFilter = Types.ObjectId | RepositoryFilter<TEntity>,
  TCreateInput = Partial<TEntity>,
  TUpdateInput = Partial<TEntity>,
> {
  create(data: TCreateInput): Promise<TEntity>;
  list(
    filter?: TFilter,
    options?: RepositoryQueryOptions<TEntity>,
  ): RepositoryList<TEntity>;
  update(filter: TFilter, data: TUpdateInput): Promise<void>;
  delete(filter?: TFilter): Promise<void>;
  exists(filter?: TFilter): Promise<boolean>;
  count(filter?: TFilter): Promise<number>;
  find(filter?: TFilter): Promise<TEntity>;
  search(
    search: string,
    filter?: TFilter,
    opts?: {
      index: string;
      type?: 'autocomplete' | 'text';
      path: string | string[];
      limit?: number;
      secondaryPreferred?: true;
    },
  ): Promise<TEntity[]>;
}
