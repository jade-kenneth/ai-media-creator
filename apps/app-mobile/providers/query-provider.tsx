import { showToast } from '@/components/ui/toast';
import { GraphqlRequestError } from '@/react-query/graphql-client';
import {
  explainGraphqlErrorMessage,
  handleUnauthenticatedError,
} from '@/react-query/graphql-error';
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';

import { type ReactNode } from 'react';

export const queryCache = new QueryCache();

export const mutationCache = new MutationCache({
  onError: (error, _variables, _context, mutation) => {
    const hasCustomMutationHandler =
      typeof mutation.options.onError === 'function';
    const shouldSuppressGlobalToast =
      (
        mutation.options.meta as
          | { suppressGlobalErrorToast?: boolean }
          | undefined
      )?.suppressGlobalErrorToast === true;

    if (handleUnauthenticatedError(error as GraphqlRequestError)) {
      return;
    }

    if (hasCustomMutationHandler || shouldSuppressGlobalToast) {
      return;
    }

    showToast({
      type: 'error',
      message: explainGraphqlErrorMessage(
        error as Error,
        'Request failed. Please try again.',
      ),
    });
  },
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 4 /* 4hr */,
      staleTime: 1000 * 60 * 10 /* 10m */,
      throwOnError: false,
      refetchOnMount: 'always',
      refetchOnReconnect: true,
      refetchOnWindowFocus: true,
      retry: (failureCount, error) => {
        // never retry auth errors

        if (handleUnauthenticatedError(error as GraphqlRequestError)) {
          return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
      gcTime: 1000 * 60 * 10 /* 10m */,
      throwOnError: false,
    },
  },
  queryCache,
  mutationCache,
});

type QueryProviderProps = {
  children: ReactNode;
};

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
