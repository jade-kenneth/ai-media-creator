import {
  DefinedInitialDataInfiniteOptions,
  DefinedInitialDataOptions,
  InfiniteData,
  MutationKey,
  QueryKey,
  UseInfiniteQueryResult,
  UseMutationOptions,
  UseMutationResult,
  UseQueryResult,
  useInfiniteQuery as usePrimitiveInfiniteQuery,
  useMutation as usePrimitiveMutation,
  useQuery as usePrimitiveQuery,
} from '@tanstack/react-query';
import { isPlainObject, isUndefined } from 'es-toolkit';
import { isEmpty } from 'es-toolkit/compat';
import { Simplify } from 'type-fest';

/*
 *------------------------------------------------
 *  defineQuery
 *-----------------------------------------------
 */

type _QueryFnContext = {
  signal?: AbortSignal;
};

type _QueryOptions<
  Data,
  LocalContext extends object = Record<string, never>,
> = Partial<
  Pick<
    DefinedInitialDataOptions<Data, Error>,
    | 'enabled'
    | 'gcTime'
    | 'staleTime'
    | 'refetchInterval'
    | 'refetchOnMount'
    | 'refetchOnReconnect'
    | 'refetchOnWindowFocus'
    | 'retry'
    | 'retryDelay'
    | 'initialData'
    | 'initialDataUpdatedAt'
    | 'placeholderData'
  >
> & {
  locals?: LocalContext;
};

type DefineQueryConfig<
  Data,
  Input = never,
  LocalContext = Record<string, never>,
> = {
  queryFn: (
    input?: Input,
    context?: _QueryFnContext,
    locals?: LocalContext,
  ) => Promise<Data>;
  queryKey: QueryKey | ((input?: Input) => QueryKey);
} & Simplify<
  Pick<
    _QueryOptions<Data>,
    | 'gcTime'
    | 'staleTime'
    | 'refetchOnMount'
    | 'refetchOnReconnect'
    | 'refetchOnWindowFocus'
    | 'refetchInterval'
    | 'retry'
    | 'retryDelay'
  >
>;

type DefinedQuery<
  Data,
  Input = never,
  LocalContext extends object = Record<string, never>,
> = {
  (
    input?: Input,
    options?: _QueryOptions<Data, LocalContext>,
  ): UseQueryResult<Data, Error>;
  getQueryFn: (input?: Input, locals?: LocalContext) => () => Promise<Data>;
  getQueryKey: (input?: Input) => QueryKey;
  '~input': (input?: Input) => Input | undefined;
  '~options': (
    options?: _QueryOptions<Data, LocalContext>,
  ) => _QueryOptions<Data, LocalContext> | undefined;
};

function cleanKey<T extends QueryKey | MutationKey>(k: T): T {
  const l: unknown[] = [];

  k.forEach((v) => {
    if (isPlainObject(v) && isEmpty(v)) return;
    if (isUndefined(v)) return;
    l.push(v);
  });

  return l as unknown as T;
}

export function defineQuery<
  Data,
  Input = never,
  LocalContext extends object = Record<string, never>,
>(
  config: DefineQueryConfig<Data, Input, LocalContext>,
): DefinedQuery<Data, Input, LocalContext> {
  function useQuery(
    input?: Input,
    options?: _QueryOptions<Data, LocalContext>,
  ) {
    const { locals, ...options_ } = options ?? {};

    return usePrimitiveQuery<Data, Error>({
      ...config,
      ...options_,
      queryFn: (context) => config.queryFn(input, context, locals),
      queryKey:
        typeof config.queryKey === 'function'
          ? cleanKey(config.queryKey(input))
          : cleanKey(config.queryKey),
    });
  }

  useQuery.getQueryFn = (input?: Input, locals?: LocalContext) => () =>
    config.queryFn(input, undefined, locals);
  useQuery.getQueryKey = (input?: Input) =>
    typeof config.queryKey === 'function'
      ? cleanKey(config.queryKey(input))
      : cleanKey(config.queryKey);
  useQuery['~input'] = (input?: Input) => input;
  useQuery['~options'] = (options?: _QueryOptions<Data, LocalContext>) =>
    options;

  return useQuery;
}

/*
 *------------------------------------------------
 *  defineInfiniteQuery
 *-----------------------------------------------
 */

type _InfiniteQueryFnContext = {
  signal?: AbortSignal;
  pageParam?: string | null;
};

type _InfiniteQueryOptions<Data> = Partial<
  Pick<
    DefinedInitialDataInfiniteOptions<
      Data,
      Error,
      InfiniteData<Data, string | null>,
      QueryKey,
      string | null
    >,
    | 'enabled'
    | 'gcTime'
    | 'staleTime'
    | 'refetchInterval'
    | 'refetchOnMount'
    | 'refetchOnReconnect'
    | 'refetchOnWindowFocus'
    | 'placeholderData'
    | 'initialData'
    | 'initialDataUpdatedAt'
    | 'initialPageParam'
    | 'retry'
    | 'retryDelay'
  >
>;

type DefineInfiniteQueryConfig<Data, Input> = {
  queryFn: (input?: Input, context?: _InfiniteQueryFnContext) => Promise<Data>;
  queryKey: QueryKey | ((input?: Input) => QueryKey);
  getNextPageParam?: (data: Data) => string | null;
} & Simplify<
  Pick<
    _InfiniteQueryOptions<Data>,
    | 'gcTime'
    | 'staleTime'
    | 'refetchOnMount'
    | 'refetchOnReconnect'
    | 'refetchOnWindowFocus'
    | 'refetchInterval'
    | 'retry'
    | 'retryDelay'
  >
>;

type DefinedInfiniteQuery<Data, Input = never> = {
  (
    input?: Input,
    options?: _InfiniteQueryOptions<Data>,
  ): UseInfiniteQueryResult<InfiniteData<Data, string | null>, Error>;
  getQueryFn: (input?: Input) => () => Promise<Data>;
  getQueryKey: (input?: Input) => QueryKey;
  '~input': (input?: Input) => Input | undefined;
  '~options': (
    options?: _QueryOptions<Data>,
  ) => _QueryOptions<Data> | undefined;
};

export function defineInfiniteQuery<Data, Input = never>(
  config: DefineInfiniteQueryConfig<Data, Input>,
): DefinedInfiniteQuery<Data, Input> {
  function useInfiniteQuery(
    input?: Input,
    options?: _InfiniteQueryOptions<Data>,
  ) {
    return usePrimitiveInfiniteQuery<
      Data,
      Error,
      InfiniteData<Data, string | null>,
      QueryKey,
      string | null
    >({
      ...config,
      initialData: undefined,
      initialPageParam: null,
      getNextPageParam: config.getNextPageParam ?? (() => null),
      ...options,
      queryKey:
        typeof config.queryKey === 'function'
          ? cleanKey(config.queryKey(input))
          : cleanKey(config.queryKey),
      queryFn(context) {
        return config.queryFn(input, context);
      },
    });
  }

  useInfiniteQuery.getQueryFn = (input?: Input) => () => config.queryFn(input);
  useInfiniteQuery.getQueryKey = (input?: Input) =>
    typeof config.queryKey === 'function'
      ? cleanKey(config.queryKey(input))
      : cleanKey(config.queryKey);
  useInfiniteQuery['~input'] = (input?: Input) => input;
  useInfiniteQuery['~options'] = (options?: _QueryOptions<Data>) => options;

  return useInfiniteQuery;
}

/*
 *------------------------------------------------
 *  defineMutation
 *-----------------------------------------------
 */

type _MutationOptions<
  Data,
  Input,
  Context = unknown,
  LocalContext extends object = Record<string, never>,
> = Pick<
  UseMutationOptions<Data, Error, Input, Context>,
  | 'onMutate'
  | 'onSettled'
  | 'onSuccess'
  | 'onError'
  | 'gcTime'
  | 'retry'
  | 'retryDelay'
  | 'throwOnError'
> & {
  locals?: LocalContext;
};

type DefineMutationConfig<
  Data,
  Input,
  LocalContext extends object = Record<string, never>,
> = {
  mutationFn: (input?: Input, locals?: LocalContext) => Promise<Data>;
  mutationKey: MutationKey;
};

type DefinedMutation<
  Data,
  Input,
  LocalContext extends object = Record<string, never>,
> = {
  <Context = unknown>(
    options?: _MutationOptions<Data, Input, Context, LocalContext>,
    locals?: LocalContext,
  ): UseMutationResult<Data, Error, Input>;
  getMutationKey: () => MutationKey;
  getMutationFn: (locals?: LocalContext) => (input?: Input) => Promise<Data>;
  '~options': <Context = unknown>(
    options?: _MutationOptions<Data, Input, Context, LocalContext>,
  ) => _MutationOptions<Data, Input, Context, LocalContext> | undefined;
};

export function defineMutation<
  Data = void,
  Input = void,
  LocalContext extends object = Record<string, never>,
>(
  config: DefineMutationConfig<Data, Input, LocalContext>,
): DefinedMutation<Data, Input, LocalContext> {
  function useMutation<Context = unknown>(
    options?: _MutationOptions<Data, Input, Context, LocalContext>,
  ) {
    const { locals, ...options_ } = options ?? {};

    return usePrimitiveMutation<Data, Error, Input, Context>({
      mutationKey: cleanKey(config.mutationKey),
      mutationFn(input: Input) {
        return config.mutationFn(input, locals);
      },
      ...options_,
    });
  }

  useMutation.getMutationFn = (locals?: LocalContext) => (input?: Input) =>
    config.mutationFn(input, locals);
  useMutation.getMutationKey = () => cleanKey(config.mutationKey);
  useMutation['~options'] = <Context = unknown>(
    options?: _MutationOptions<Data, Input, Context, LocalContext>,
  ) => options;

  return useMutation;
}

/*
 *------------------------------------------------
 *  removeNeverRecord
 *-----------------------------------------------
 */

export type RemoveNeverRecord<T> =
  T extends Record<PropertyKey, never>
    ? never
    : T extends (infer U)[]
      ? RemoveNeverRecord<U>[]
      : T extends object
        ? { [K in keyof T]: RemoveNeverRecord<T[K]> }
        : T;

export function removeNeverRecord<T>(value: T): RemoveNeverRecord<T> {
  return value as RemoveNeverRecord<T>;
}
