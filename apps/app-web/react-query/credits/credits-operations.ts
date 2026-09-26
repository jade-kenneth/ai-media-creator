import type { MyCreditsQuery } from '@/react-query/generated__types';
import { client } from '@/react-query/graphql-client';
import { unwrapGraphqlResult } from '@/react-query/graphql-error';
import { defineQuery } from '@/react-query/utils';

import { MY_CREDITS_QUERY } from './graphql/credits';

export type CreditSummary = MyCreditsQuery['myCredits'];

export const creditsQueryKeys = {
  all: ['credits'] as const,
  summary: ['credits', 'summary'] as const,
};

export const useMyCreditsQuery = defineQuery<MyCreditsQuery>({
  queryKey: creditsQueryKeys.summary,
  queryFn: async (_input, context) =>
    unwrapGraphqlResult(
      await client.request<MyCreditsQuery>(MY_CREDITS_QUERY, undefined, {
        signal: context?.signal,
      }),
    ),
  staleTime: 30_000,
});
