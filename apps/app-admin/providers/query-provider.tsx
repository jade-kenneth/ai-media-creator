'use client';

import { GraphqlRequestError } from '@/react-query/graphql-client';
import { handleUnauthenticatedError } from '@/react-query/graphql-error';
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { type ReactNode } from 'react';

const ReactQueryDevtools = dynamic(
  () =>
    import('@tanstack/react-query-devtools').then(
      (module) => module.ReactQueryDevtools,
    ),
  {
    ssr: false,
  },
);

export const queryCache = new QueryCache();

export const mutationCache = new MutationCache();

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
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' ? (
        <ReactQueryDevtools initialIsOpen={false} />
      ) : null}
    </QueryClientProvider>
  );
}
