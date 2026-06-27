import {
  type DefinedInitialDataInfiniteOptions,
  type DefinedInitialDataOptions,
  type InfiniteData,
  type MutationKey,
  type QueryKey,
  type UseInfiniteQueryResult,
  type UseMutationOptions,
  type UseMutationResult,
  type UseQueryResult,
  useInfiniteQuery as usePrimitiveInfiniteQuery,
  useMutation as usePrimitiveMutation,
  useQuery as usePrimitiveQuery,
} from '@tanstack/react-query';

type QueryFnContext = {
  signal?: AbortSignal;
};

type InfiniteQueryFnContext = {
  signal?: AbortSignal;
  pageParam?: string | null;
};

type QueryOptions<
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

type InfiniteQueryOptions<Data> = Partial<
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

type MutationOptions<
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
  | 'meta'
> & {
  locals?: LocalContext;
};

type DefineQueryConfig<
  Data,
  Input = never,
  LocalContext extends object = Record<string, never>,
> = {
  queryFn: (
    input?: Input,
    context?: QueryFnContext,
    locals?: LocalContext,
  ) => Promise<Data>;
  queryKey: QueryKey | ((input?: Input) => QueryKey);
} & Pick<
  QueryOptions<Data>,
  | 'gcTime'
  | 'staleTime'
  | 'refetchOnMount'
  | 'refetchOnReconnect'
  | 'refetchOnWindowFocus'
  | 'refetchInterval'
  | 'retry'
  | 'retryDelay'
>;

type DefineInfiniteQueryConfig<Data, Input> = {
  queryFn: (input?: Input, context?: InfiniteQueryFnContext) => Promise<Data>;
  queryKey: QueryKey | ((input?: Input) => QueryKey);
  getNextPageParam?: (data: Data) => string | null;
} & Pick<
  InfiniteQueryOptions<Data>,
  | 'gcTime'
  | 'staleTime'
  | 'refetchOnMount'
  | 'refetchOnReconnect'
  | 'refetchOnWindowFocus'
  | 'refetchInterval'
  | 'retry'
  | 'retryDelay'
>;

type DefineMutationConfig<
  Data,
  Input,
  LocalContext extends object = Record<string, never>,
> = {
  mutationFn: (input?: Input, locals?: LocalContext) => Promise<Data>;
  mutationKey: MutationKey;
  suppressGlobalErrorToast?: boolean;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isEmptyPlainObject(value: Record<string, unknown>) {
  return Object.keys(value).length === 0;
}

function cleanKey<T extends QueryKey | MutationKey>(key: T): T {
  const nextKey: unknown[] = [];

  key.forEach((value) => {
    if (value === undefined) return;
    if (isPlainObject(value) && isEmptyPlainObject(value)) return;
    nextKey.push(value);
  });

  return nextKey as unknown as T;
}

export function defineQuery<
  Data,
  Input = never,
  LocalContext extends object = Record<string, never>,
>(config: DefineQueryConfig<Data, Input, LocalContext>) {
  function useQuery(
    input?: Input,
    options?: QueryOptions<Data, LocalContext>,
  ): UseQueryResult<Data, Error> {
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

  return useQuery;
}

export function defineInfiniteQuery<Data, Input = never>(
  config: DefineInfiniteQueryConfig<Data, Input>,
) {
  function useInfiniteQuery(
    input?: Input,
    options?: InfiniteQueryOptions<Data>,
  ): UseInfiniteQueryResult<InfiniteData<Data, string | null>, Error> {
    return usePrimitiveInfiniteQuery<
      Data,
      Error,
      InfiniteData<Data, string | null>,
      QueryKey,
      string | null
    >({
      ...config,
      ...options,
      initialData: undefined,
      initialPageParam: null,
      getNextPageParam: config.getNextPageParam ?? (() => null),
      queryKey:
        typeof config.queryKey === 'function'
          ? cleanKey(config.queryKey(input))
          : cleanKey(config.queryKey),
      queryFn: (context) => config.queryFn(input, context),
    });
  }

  useInfiniteQuery.getQueryFn = (input?: Input) => () => config.queryFn(input);
  useInfiniteQuery.getQueryKey = (input?: Input) =>
    typeof config.queryKey === 'function'
      ? cleanKey(config.queryKey(input))
      : cleanKey(config.queryKey);

  return useInfiniteQuery;
}

export function defineMutation<
  Data = void,
  Input = void,
  LocalContext extends object = Record<string, never>,
>(config: DefineMutationConfig<Data, Input, LocalContext>) {
  function useMutation<Context = unknown>(
    options?: MutationOptions<Data, Input, Context, LocalContext>,
  ): UseMutationResult<Data, Error, Input, Context> {
    const { locals, ...options_ } = options ?? {};

    return usePrimitiveMutation<Data, Error, Input, Context>({
      meta: {
        suppressGlobalErrorToast: config.suppressGlobalErrorToast === true,
      },
      mutationKey: cleanKey(config.mutationKey),
      mutationFn: (input) => config.mutationFn(input, locals),
      ...options_,
    });
  }

  useMutation.getMutationKey = () => cleanKey(config.mutationKey);
  useMutation.getMutationFn = (locals?: LocalContext) => (input?: Input) =>
    config.mutationFn(input, locals);

  return useMutation;
}
