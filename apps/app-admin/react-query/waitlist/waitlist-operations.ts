import type {
  AdminWaitlistEntriesQuery,
  AdminWaitlistEntriesQueryVariables,
  AdminWaitlistStatsQuery,
  DeleteWaitlistEntryMutation,
  DeleteWaitlistEntryMutationVariables,
  JoinWaitlistMutation,
  JoinWaitlistMutationVariables,
  WaitlistEntryRecordFragment,
} from '@/react-query/generated__types';
import type {
  GraphqlRequestOptions,
  GraphqlRequestResult,
} from '@/react-query/graphql-client';

import { client } from '@/react-query/graphql-client';
import {
  defineInfiniteQuery,
  defineMutation,
  defineQuery,
} from '@/react-query/utils';
import {
  ADMIN_WAITLIST_ENTRIES_QUERY,
  ADMIN_WAITLIST_STATS_QUERY,
  DELETE_WAITLIST_ENTRY_MUTATION,
  JOIN_WAITLIST_MUTATION,
} from '../graphql/waitlist';

export type WaitlistEntryRecord = WaitlistEntryRecordFragment;

export const waitlistQueryKeys = {
  all: ['waitlist'] as const,
  list: (variables?: AdminWaitlistEntriesQueryVariables) =>
    ['waitlist', 'list', variables ?? {}] as const,
  stats: () => ['waitlist', 'stats'] as const,
};

function normalizeListVariables(
  variables?: AdminWaitlistEntriesQueryVariables,
) {
  if (!variables) {
    return undefined;
  }

  const rest = { ...variables };
  delete rest.after;

  return rest;
}

function unwrapGraphqlResult<Data extends Record<string, unknown>>(
  result: GraphqlRequestResult<Data>,
) {
  if (result.ok) {
    return result.data;
  }

  const error = new Error(result.error.message);
  error.name = result.error.name;

  throw error;
}

export function adminWaitlistEntriesRequest(
  variables?: AdminWaitlistEntriesQueryVariables,
  options?: GraphqlRequestOptions,
) {
  return client.request<
    AdminWaitlistEntriesQuery,
    AdminWaitlistEntriesQueryVariables
  >(ADMIN_WAITLIST_ENTRIES_QUERY, variables, options);
}

export function adminWaitlistStatsRequest(options?: GraphqlRequestOptions) {
  return client.request<AdminWaitlistStatsQuery>(
    ADMIN_WAITLIST_STATS_QUERY,
    undefined,
    options,
  );
}

export function joinWaitlistRequest(
  variables: JoinWaitlistMutationVariables,
  options?: GraphqlRequestOptions,
) {
  return client.request<JoinWaitlistMutation, JoinWaitlistMutationVariables>(
    JOIN_WAITLIST_MUTATION,
    variables,
    options,
  );
}

export function deleteWaitlistEntryRequest(
  variables: DeleteWaitlistEntryMutationVariables,
  options?: GraphqlRequestOptions,
) {
  return client.request<
    DeleteWaitlistEntryMutation,
    DeleteWaitlistEntryMutationVariables
  >(DELETE_WAITLIST_ENTRY_MUTATION, variables, options);
}

export const useAdminWaitlistEntriesQuery = defineInfiniteQuery<
  AdminWaitlistEntriesQuery,
  AdminWaitlistEntriesQueryVariables
>({
  queryFn: async (variables, context) => {
    const normalizedVariables = normalizeListVariables(variables);
    const result = await adminWaitlistEntriesRequest(
      {
        ...normalizedVariables,
        after: context?.pageParam ?? null,
      },
      {
        signal: context?.signal,
      },
    );

    return unwrapGraphqlResult(result);
  },
  getNextPageParam: (data) =>
    data.adminWaitlistEntries.pageInfo.hasNextPage
      ? (data.adminWaitlistEntries.pageInfo.endCursor ?? null)
      : null,
  queryKey: (variables) =>
    waitlistQueryKeys.list(normalizeListVariables(variables)),
});

export const useAdminWaitlistStatsQuery = defineQuery<AdminWaitlistStatsQuery>({
  queryFn: async (_, context) => {
    const result = await adminWaitlistStatsRequest({
      signal: context?.signal,
    });

    return unwrapGraphqlResult(result);
  },
  queryKey: waitlistQueryKeys.stats(),
});

export const useJoinWaitlistMutation = defineMutation<
  JoinWaitlistMutation,
  JoinWaitlistMutationVariables
>({
  mutationFn: async (variables) => {
    if (!variables) {
      throw new Error('Join waitlist input is required.');
    }

    return unwrapGraphqlResult(await joinWaitlistRequest(variables));
  },
  mutationKey: [...waitlistQueryKeys.all, 'join'],
});

export const useDeleteWaitlistEntryMutation = defineMutation<
  DeleteWaitlistEntryMutation,
  DeleteWaitlistEntryMutationVariables
>({
  mutationFn: async (variables) => {
    if (!variables) {
      throw new Error('Delete waitlist entry variables are required.');
    }

    return unwrapGraphqlResult(await deleteWaitlistEntryRequest(variables));
  },
  mutationKey: [...waitlistQueryKeys.all, 'delete'],
});
