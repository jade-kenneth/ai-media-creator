import type {
  AccountDeletionRequestFilterInput,
  AccountDeletionRequestRecordFragment,
  AdminAccountDeletionRequestQuery,
  AdminAccountDeletionRequestQueryVariables,
  AdminAccountDeletionRequestsQuery,
  AdminAccountDeletionRequestsQueryVariables,
  ReviewAccountDeletionRequestMutation,
  ReviewAccountDeletionRequestMutationVariables,
  SubmitAccountDeletionRequestMutation,
  SubmitAccountDeletionRequestMutationVariables,
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
  ADMIN_ACCOUNT_DELETION_REQUEST_QUERY,
  ADMIN_ACCOUNT_DELETION_REQUESTS_COUNT_QUERY,
  ADMIN_ACCOUNT_DELETION_REQUESTS_QUERY,
  REVIEW_ACCOUNT_DELETION_REQUEST_MUTATION,
  SUBMIT_ACCOUNT_DELETION_REQUEST_MUTATION,
} from '../graphql/account-deletion-requests';

type AdminAccountDeletionRequestsCountQuery = {
  adminAccountDeletionRequests: { totalCount: number };
};
type AdminAccountDeletionRequestsCountQueryVariables = {
  filter?: AccountDeletionRequestFilterInput | null;
};

export type AccountDeletionRequestRecord =
  AccountDeletionRequestRecordFragment;

export const accountDeletionRequestsQueryKeys = {
  all: ['account-deletion-requests'] as const,
  list: (variables?: AdminAccountDeletionRequestsQueryVariables) =>
    [
      ...accountDeletionRequestsQueryKeys.all,
      'list',
      variables ?? {},
    ] as const,
  count: (variables?: AdminAccountDeletionRequestsCountQueryVariables) =>
    [...accountDeletionRequestsQueryKeys.all, 'count', variables ?? {}] as const,
  detail: (id: string) =>
    [...accountDeletionRequestsQueryKeys.all, 'detail', id] as const,
};

function normalizeListVariables(
  variables?: AdminAccountDeletionRequestsQueryVariables,
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

export function adminAccountDeletionRequestsRequest(
  variables?: AdminAccountDeletionRequestsQueryVariables,
  options?: GraphqlRequestOptions,
) {
  return client.request<
    AdminAccountDeletionRequestsQuery,
    AdminAccountDeletionRequestsQueryVariables
  >(ADMIN_ACCOUNT_DELETION_REQUESTS_QUERY, variables, options);
}

export function adminAccountDeletionRequestsCountRequest(
  variables?: AdminAccountDeletionRequestsCountQueryVariables,
  options?: GraphqlRequestOptions,
) {
  return client.request<
    AdminAccountDeletionRequestsCountQuery,
    AdminAccountDeletionRequestsCountQueryVariables
  >(ADMIN_ACCOUNT_DELETION_REQUESTS_COUNT_QUERY, variables, options);
}

export function adminAccountDeletionRequestRequest(
  variables: AdminAccountDeletionRequestQueryVariables,
  options?: GraphqlRequestOptions,
) {
  return client.request<
    AdminAccountDeletionRequestQuery,
    AdminAccountDeletionRequestQueryVariables
  >(ADMIN_ACCOUNT_DELETION_REQUEST_QUERY, variables, options);
}

export function submitAccountDeletionRequestRequest(
  variables: SubmitAccountDeletionRequestMutationVariables,
  options?: GraphqlRequestOptions,
) {
  return client.request<
    SubmitAccountDeletionRequestMutation,
    SubmitAccountDeletionRequestMutationVariables
  >(SUBMIT_ACCOUNT_DELETION_REQUEST_MUTATION, variables, options);
}

export function reviewAccountDeletionRequestRequest(
  variables: ReviewAccountDeletionRequestMutationVariables,
  options?: GraphqlRequestOptions,
) {
  return client.request<
    ReviewAccountDeletionRequestMutation,
    ReviewAccountDeletionRequestMutationVariables
  >(REVIEW_ACCOUNT_DELETION_REQUEST_MUTATION, variables, options);
}

export const useAdminAccountDeletionRequestsCountQuery = defineQuery<
  AdminAccountDeletionRequestsCountQuery,
  AdminAccountDeletionRequestsCountQueryVariables
>({
  queryFn: async (variables, context) => {
    const result = await adminAccountDeletionRequestsCountRequest(variables, {
      signal: context?.signal,
    });
    return unwrapGraphqlResult(result);
  },
  queryKey: (variables) => accountDeletionRequestsQueryKeys.count(variables),
});

export const useAdminAccountDeletionRequestsQuery = defineInfiniteQuery<
  AdminAccountDeletionRequestsQuery,
  AdminAccountDeletionRequestsQueryVariables
>({
  queryFn: async (variables, context) => {
    const normalizedVariables = normalizeListVariables(variables);
    const result = await adminAccountDeletionRequestsRequest(
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
    data.adminAccountDeletionRequests.pageInfo.hasNextPage
      ? (data.adminAccountDeletionRequests.pageInfo.endCursor ?? null)
      : null,
  queryKey: (variables) =>
    accountDeletionRequestsQueryKeys.list(normalizeListVariables(variables)),
});

export const useAdminAccountDeletionRequestQuery = defineQuery<
  AdminAccountDeletionRequestQuery,
  AdminAccountDeletionRequestQueryVariables
>({
  queryFn: async (variables, context) => {
    if (!variables) {
      throw new Error('Account deletion request id is required.');
    }

    const result = await adminAccountDeletionRequestRequest(variables, {
      signal: context?.signal,
    });

    return unwrapGraphqlResult(result);
  },
  queryKey: (variables) =>
    accountDeletionRequestsQueryKeys.detail(variables?.id ?? 'unknown'),
});

export const useSubmitAccountDeletionRequestMutation = defineMutation<
  SubmitAccountDeletionRequestMutation,
  SubmitAccountDeletionRequestMutationVariables
>({
  mutationFn: async (variables) => {
    if (!variables) {
      throw new Error('Account deletion request input is required.');
    }

    return unwrapGraphqlResult(
      await submitAccountDeletionRequestRequest(variables),
    );
  },
  mutationKey: [...accountDeletionRequestsQueryKeys.all, 'submit'],
});

export const useReviewAccountDeletionRequestMutation = defineMutation<
  ReviewAccountDeletionRequestMutation,
  ReviewAccountDeletionRequestMutationVariables
>({
  mutationFn: async (variables) => {
    if (!variables) {
      throw new Error('Review account deletion request input is required.');
    }

    return unwrapGraphqlResult(
      await reviewAccountDeletionRequestRequest(variables),
    );
  },
  mutationKey: [...accountDeletionRequestsQueryKeys.all, 'review'],
});
