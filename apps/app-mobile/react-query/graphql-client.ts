import { store } from '@/providers/AuthProvider/store';
import axios, { isAxiosError } from 'axios';
import { GraphQLClient as BaseGraphQLClient } from 'graphql-request';
import { z } from 'zod';

export type RequestInitExtended = RequestInit & {
  url: string;
  operationName?: string;
  variables?: object;
};

export type GraphqlMiddleware = (
  request: RequestInitExtended,
) => RequestInitExtended | Promise<RequestInitExtended>;

export type GraphqlDocument = string | GraphqlOperation;

export interface GraphqlOperation {
  operationName?: string;
  query: string;
}

export interface GraphqlRequestOptions {
  cache?: RequestCache;
  signal?: AbortSignal;
  headers?: HeadersInit;
  priority?: RequestPriority;
  middleware?: GraphqlMiddleware | GraphqlMiddleware[];
}

export type GraphqlRequestErrorName =
  | 'BadRequestError'
  | 'ForbiddenError'
  | 'UnauthorizedError'
  | 'NotFoundError'
  | 'InternalServerError'
  | 'ServiceUnavailableError'
  | 'UnknownError'
  | 'DuplicateSessionError'
  | 'SessionTimeoutError'
  | 'InvalidCredentialsError'
  | 'ConflictError'
  | 'RegistrationPendingError'
  | 'RegistrationRejectedError'
  | 'NotAffiliatedMemberError';

export interface GraphqlRequestError {
  name: GraphqlRequestErrorName;
  message: string;
  details?: Record<string, unknown>;
}

export type GraphqlRequestResult<Data> =
  | {
      ok: true;
      data: Data;
      error?: never;
    }
  | {
      ok: false;
      data?: Data;
      error: GraphqlRequestError;
    };

const ApiResponseDefinition = z.object({
  data: z.record(z.string(), z.any()).optional().nullable(),
  errors: z
    .array(
      z.object({
        message: z.string().optional().nullable(),
        extensions: z
          .object({
            code: z.string().nullable().optional(),
            details: z.record(z.string(), z.unknown()).optional().nullable(),
          })
          .optional()
          .nullable(),
      }),
    )
    .optional()
    .nullable(),
});

/**
 * Hard ceiling for any single network attempt. React Native's fetch has no
 * default timeout, so a stalled or dead socket (common after the OS switches
 * networks or the device wakes from sleep) hangs the request indefinitely —
 * which is why the app previously had to be force-closed to recover. Aborting
 * after this window lets TanStack Query retry on a fresh connection.
 */
const REQUEST_TIMEOUT_MS = 15000;

type RequestSignal = {
  signal: AbortSignal;
  didTimeout: () => boolean;
  cleanup: () => void;
};

/**
 * Combines the caller's abort signal (query cancellation on unmount / key
 * change) with a timeout so a stalled request never hangs forever.
 */
function createRequestSignal(
  externalSignal: AbortSignal | undefined,
  timeoutMs: number,
): RequestSignal {
  const controller = new AbortController();
  let timedOut = false;

  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const onExternalAbort = () => controller.abort();

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', onExternalAbort, { once: true });
    }
  }

  return {
    signal: controller.signal,
    didTimeout: () => timedOut,
    cleanup: () => {
      clearTimeout(timeoutId);
      externalSignal?.removeEventListener('abort', onExternalAbort);
    },
  };
}

export class GraphQLClient {
  private readonly url: string;
  private readonly options?: GraphqlRequestOptions;

  constructor(url: string, options?: GraphqlRequestOptions) {
    this.url = url;
    this.options = options;
  }

  async request<
    Data extends Record<string, unknown> = Record<string, unknown>,
    Variables extends object = Record<string, never>,
  >(
    document: GraphqlDocument,
    variables?: Variables,
    options?: GraphqlRequestOptions,
  ): Promise<GraphqlRequestResult<Data>> {
    return this.execute<Data, Variables>(document, variables, options);
  }

  async upload<
    Data extends Record<string, unknown> = Record<string, unknown>,
    Variables extends object = Record<string, never>,
  >(
    document: GraphqlDocument,
    variables?: Variables,
    options?: GraphqlRequestOptions,
  ): Promise<GraphqlRequestResult<Data>> {
    return this.execute<Data, Variables>(document, variables, options);
  }

  private async execute<
    Data extends Record<string, unknown>,
    Variables extends object,
  >(
    document: GraphqlDocument,
    variables?: Variables,
    options?: GraphqlRequestOptions,
    allowSilentRefresh = true,
  ): Promise<GraphqlRequestResult<Data>> {
    const operation = normalizeDocument(document);
    const merged = mergeOptions(this.options, options);
    const requestSignal = createRequestSignal(
      merged.signal,
      REQUEST_TIMEOUT_MS,
    );
    const client = new BaseGraphQLClient(this.url, {
      headers: merged.headers,
      cache: merged.cache,
      signal: requestSignal.signal,
      errorPolicy: 'all',
      requestMiddleware: composeMiddlewares(merged.middleware),
      fetch: createFetchWithOperationName(operation),
      ...(merged.priority ? { priority: merged.priority } : {}),
    });

    try {
      const response = await client.rawRequest<Data, Variables>(
        operation.query,
        variables,
      );

      if (response.status === 400) {
        return {
          ok: false,
          error: {
            name: 'BadRequestError',
            message: 'Bad Request',
          },
        };
      }

      if (response.status === 401) {
        const unauthorizedResult: GraphqlRequestResult<Data> = {
          ok: false,
          error: {
            name: 'UnauthorizedError',
            message: 'Access Denied',
          },
        };

        return this.handleUnauthorizedResult(
          unauthorizedResult,
          operation,
          variables,
          merged,
          allowSilentRefresh,
        );
      }

      if (response.status === 403) {
        return {
          ok: false,
          error: {
            name: 'ForbiddenError',
            message: 'Access Forbidden',
          },
        };
      }

      if (response.status === 404) {
        return {
          ok: false,
          error: {
            name: 'NotFoundError',
            message: 'Not Found',
          },
        };
      }

      if (response.status === 500) {
        return {
          ok: false,
          error: {
            name: 'InternalServerError',
            message: 'Internal Server Error',
          },
        };
      }

      if (response.status === 503) {
        return {
          ok: false,
          error: {
            name: 'ServiceUnavailableError',
            message: 'Service Unavailable',
          },
        };
      }

      const result = ApiResponseDefinition.parse(response);

      if (result.data) {
        return {
          ok: true,
          data: result.data as Data,
        };
      }

      const error = result.errors?.at(0);

      if (error?.extensions?.code === 'FORBIDDEN') {
        return {
          ok: false,
          error: {
            name: 'ForbiddenError',
            message: error?.message ?? 'Access Forbidden',
          },
        };
      }

      if (
        error?.extensions?.code === 'UNAUTHORIZED' ||
        error?.extensions?.code === 'ACCESS_TOKEN_EXPIRED' ||
        error?.extensions?.code === 'UNAUTHENTICATED'
      ) {
        const unauthorizedResult: GraphqlRequestResult<Data> = {
          ok: false,
          error: {
            name: 'UnauthorizedError',
            message: error?.message ?? 'Access Denied',
          },
        };

        return this.handleUnauthorizedResult(
          unauthorizedResult,
          operation,
          variables,
          merged,
          allowSilentRefresh,
        );
      }
      if (error?.extensions?.code === 'DUPLICATE_SESSION') {
        return {
          ok: false,
          error: {
            name: 'DuplicateSessionError',
            message:
              error?.message ??
              'Duplicate session detected. Please log in again.',
          },
        };
      }

      if (error?.extensions?.code === 'SESSION_TIMEOUT') {
        return {
          ok: false,
          error: {
            name: 'SessionTimeoutError',
            message:
              error?.message ?? 'Session has expired. Please log in again.',
          },
        };
      }

      if (error?.extensions?.code === 'INVALID_CREDENTIALS') {
        return {
          ok: false,
          error: {
            name: 'InvalidCredentialsError',
            message: error?.message ?? 'Invalid email or password.',
          },
        };
      }

      if (
        error?.extensions?.code === 'BAD_REQUEST' ||
        error?.extensions?.code === 'BAD_USER_INPUT'
      ) {
        return {
          ok: false,
          error: {
            name: 'BadRequestError',
            message: error?.message ?? 'Bad Request',
          },
        };
      }

      if (error?.extensions?.code === 'REGISTRATION_PENDING') {
        return {
          ok: false,
          error: {
            name: 'RegistrationPendingError',
            message:
              error?.message ?? 'Your registration is still pending approval.',
          },
        };
      }

      if (error?.extensions?.code === 'REGISTRATION_REJECTED') {
        return {
          ok: false,
          error: {
            name: 'RegistrationRejectedError',
            message: error?.message ?? 'Your registration was rejected.',
            details: error?.extensions?.details ?? undefined,
          },
        };
      }

      if (error?.extensions?.code === 'NOT_AFFILIATED_MEMBER') {
        return {
          ok: false,
          error: {
            name: 'NotAffiliatedMemberError',
            message:
              error?.message ??
              'You are not a registered member of this organization.',
          },
        };
      }

      if (error?.extensions?.code === 'INTERNAL_SERVER_ERROR') {
        return {
          ok: false,
          error: {
            name: 'InternalServerError',
            message: error?.message ?? 'Internal Server Error',
          },
        };
      }

      if (error?.extensions?.code === 'CONFLICT') {
        return {
          ok: false,
          error: {
            name: 'ConflictError',
            message: error?.message ?? 'Resource already exists.',
          },
        };
      }

      return {
        ok: false,
        error: {
          name: 'UnknownError',
          message: error?.message ?? 'Something went wrong',
        },
      };
    } catch (err) {
      if (requestSignal.didTimeout()) {
        console.warn(
          '[graphql-client] request timed out:',
          getOperationName(operation),
        );
        return {
          ok: false,
          error: {
            name: 'ServiceUnavailableError',
            message:
              'The request is taking too long. Please check your connection and try again.',
          },
        };
      }

      console.warn('[graphql-client] request failed:', err);
      return {
        ok: false,
        error: {
          name: 'UnknownError',
          message: 'Something went wrong',
        },
      };
    } finally {
      requestSignal.cleanup();
    }
  }

  private async handleUnauthorizedResult<
    Data extends Record<string, unknown>,
    Variables extends object,
  >(
    unauthorizedResult: GraphqlRequestResult<Data>,
    operation: GraphqlOperation,
    variables: Variables | undefined,
    mergedOptions: GraphqlRequestOptions,
    allowSilentRefresh: boolean,
  ): Promise<GraphqlRequestResult<Data>> {
    if (!allowSilentRefresh) {
      return unauthorizedResult;
    }

    const didRefresh = await silentRefreshSession();

    if (!didRefresh) {
      return unauthorizedResult;
    }

    return this.execute(operation, variables, mergedOptions, false);
  }
}

export const defineGraphQLMiddleware = (
  fn: GraphqlMiddleware,
): GraphqlMiddleware => fn;

export const defineGraphQLOptions = (
  options: GraphqlRequestOptions,
): GraphqlRequestOptions => options;

function normalizeDocument(document: GraphqlDocument): GraphqlOperation {
  if (typeof document === 'string') {
    return { query: document };
  }

  return document;
}

function getOperationName(document: GraphqlOperation) {
  if (document.operationName) return document.operationName;

  const match = document.query.match(
    /\b(?:query|mutation|subscription)\s+(\w+)/,
  );

  return match?.[1];
}

function mergeOptions(
  base?: GraphqlRequestOptions,
  next?: GraphqlRequestOptions,
): GraphqlRequestOptions {
  return {
    cache: next?.cache ?? base?.cache,
    signal: next?.signal ?? base?.signal,
    headers: mergeHeaders(base?.headers, next?.headers),
    priority: next?.priority ?? base?.priority,
    middleware: mergeMiddlewares(next?.middleware, base?.middleware),
  };
}

function mergeHeaders(...values: (HeadersInit | undefined)[]) {
  const headers = new Headers();

  for (const value of values) {
    new Headers(value).forEach((headerValue, key) => {
      headers.set(key, headerValue);
    });
  }

  return headers;
}

function mergeMiddlewares(
  ...values: (GraphqlMiddleware | GraphqlMiddleware[] | undefined)[]
): GraphqlMiddleware[] {
  return values.flatMap((value) => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  });
}

function composeMiddlewares(
  middleware?: GraphqlMiddleware | GraphqlMiddleware[],
) {
  const fns = middleware
    ? Array.isArray(middleware)
      ? middleware
      : [middleware]
    : [];

  return async (request: RequestInitExtended) => {
    let current: RequestInitExtended = {
      ...request,
      headers: mergeHeaders(request.headers),
    };

    for (const fn of fns) {
      const next = await fn(current);

      current = {
        ...current,
        ...next,
        headers: mergeHeaders(current.headers, next.headers),
      };
    }

    return current;
  };
}

function createFetchWithOperationName(operation: GraphqlOperation) {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const rawUrl =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    const url = new URL(rawUrl);
    const operationName = getOperationName(operation);

    if (operationName) {
      url.searchParams.set('_q', operationName);
    }

    return fetch(url.toString(), init);
  };
}

type TokenPair = {
  accessToken: string;
  refreshToken?: string | null;
};

async function silentRefreshSession(): Promise<boolean> {
  const { refreshToken } = await store.get();

  if (!refreshToken) {
    await store.clearSession();
    return false;
  }

  try {
    const response = await axios.post<TokenPair>(
      '/session/refresh',
      { refreshToken },
      {
        baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
        timeout: REQUEST_TIMEOUT_MS,
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      },
    );

    await store.set({
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken ?? undefined,
    });

    return true;
  } catch (error) {
    if (isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 401 || status === 403) {
        await store.clearSession();
        return false;
      }
    }

    await store.clearSession();
    return false;
  }
}

export const authMiddleware = defineGraphQLMiddleware(async (request) => {
  const headers = mergeHeaders(request.headers);
  const { accessToken } = await store.get();

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  } else {
    headers.delete('Authorization');
  }

  return {
    ...request,
    headers,
  };
});

export const client = new GraphQLClient(
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/graphql',
  {
    middleware: [authMiddleware],
  },
);

export const publicClient = new GraphQLClient(
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/graphql',
);
