import type {
  AdminMemberQuery,
  AdminMemberQueryVariables,
  AdminMembersActiveFilterInput,
  AdminMembersQuery,
  AdminMembersQueryVariables,
  ApproveMemberMutation,
  ApproveMemberMutationVariables,
  RejectMemberMutation,
  RejectMemberMutationVariables,
  MemberDirectoryRecordFragment,
  RetriggerApprovalNotificationMutation,
  RetriggerApprovalNotificationMutationVariables,
  SearchByMembersQuery,
  SearchByMembersQueryVariables,
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
  ADMIN_MEMBER_QUERY,
  ADMIN_MEMBERS_COUNT_QUERY,
  ADMIN_MEMBERS_QUERY,
  APPROVE_MEMBER_MUTATION,
  REJECT_MEMBER_MUTATION,
  RETRIGGER_APPROVAL_NOTIFICATION_MUTATION,
  SEARCH_MEMBERS_QUERY,
} from '../graphql/members';

type AdminMembersCountQuery = { adminMembers: { totalCount: number } };
type AdminMembersCountQueryVariables = {
  filter?: AdminMembersActiveFilterInput | null;
};

export type MemberRecord = MemberDirectoryRecordFragment;
export type MemberDetail = MemberDirectoryRecordFragment;

export const membersQueryKeys = {
  all: ['members'] as const,
  list: (variables?: AdminMembersQueryVariables) =>
    [...membersQueryKeys.all, 'list', variables ?? {}] as const,
  count: (variables?: AdminMembersCountQueryVariables) =>
    [...membersQueryKeys.all, 'count', variables ?? {}] as const,
  detail: (id: string) => [...membersQueryKeys.all, 'detail', id] as const,
  search: (variables: SearchByMembersQueryVariables) =>
    [...membersQueryKeys.all, 'search', variables] as const,
};

function normalizeAdminMembersListVariables(
  variables?: AdminMembersQueryVariables,
) {
  if (!variables) {
    return undefined;
  }

  const { after: _after, ...rest } = variables;

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

export function adminMembersRequest(
  variables?: AdminMembersQueryVariables,
  options?: GraphqlRequestOptions,
) {
  return client.request<AdminMembersQuery, AdminMembersQueryVariables>(
    ADMIN_MEMBERS_QUERY,
    variables,
    options,
  );
}

export function adminMembersCountRequest(
  variables?: AdminMembersCountQueryVariables,
  options?: GraphqlRequestOptions,
) {
  return client.request<AdminMembersCountQuery, AdminMembersCountQueryVariables>(
    ADMIN_MEMBERS_COUNT_QUERY,
    variables,
    options,
  );
}

export function adminMemberRequest(
  variables: AdminMemberQueryVariables,
  options?: GraphqlRequestOptions,
) {
  return client.request<AdminMemberQuery, AdminMemberQueryVariables>(
    ADMIN_MEMBER_QUERY,
    variables,
    options,
  );
}

export function searchMembersRequest(
  variables: SearchByMembersQueryVariables,
  options?: GraphqlRequestOptions,
) {
  return client.request<
    SearchByMembersQuery,
    SearchByMembersQueryVariables
  >(SEARCH_MEMBERS_QUERY, variables, options);
}

export function approveMemberRequest(
  variables: ApproveMemberMutationVariables,
  options?: GraphqlRequestOptions,
) {
  return client.request<
    ApproveMemberMutation,
    ApproveMemberMutationVariables
  >(APPROVE_MEMBER_MUTATION, variables, options);
}

export function rejectMemberRequest(
  variables: RejectMemberMutationVariables,
  options?: GraphqlRequestOptions,
) {
  return client.request<
    RejectMemberMutation,
    RejectMemberMutationVariables
  >(REJECT_MEMBER_MUTATION, variables, options);
}

export const useAdminMembersCountQuery = defineQuery<
  AdminMembersCountQuery,
  AdminMembersCountQueryVariables
>({
  queryFn: async (variables, context) => {
    const result = await adminMembersCountRequest(variables, { signal: context?.signal });
    return unwrapGraphqlResult(result);
  },
  queryKey: (variables) => membersQueryKeys.count(variables),
});

export const useAdminMembersQuery = defineInfiniteQuery<
  AdminMembersQuery,
  AdminMembersQueryVariables
>({
  queryFn: async (variables, context) => {
    const normalizedVariables = normalizeAdminMembersListVariables(variables);
    const result = await adminMembersRequest(
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
    data.adminMembers.pageInfo.hasNextPage
      ? (data.adminMembers.pageInfo.endCursor ?? null)
      : null,
  queryKey: (variables) =>
    membersQueryKeys.list(normalizeAdminMembersListVariables(variables)),
});

export const useAdminMemberQuery = defineQuery<
  AdminMemberQuery,
  AdminMemberQueryVariables
>({
  queryFn: async (variables, context) => {
    if (!variables) {
      throw new Error('Member id is required.');
    }

    const result = await adminMemberRequest(variables, {
      signal: context?.signal,
    });

    return unwrapGraphqlResult(result);
  },
  queryKey: (variables) =>
    membersQueryKeys.detail(variables?.id ?? 'unknown'),
});

export const useSearchMembersQuery = defineQuery<
  SearchByMembersQuery,
  SearchByMembersQueryVariables
>({
  queryFn: async (variables, context) => {
    if (!variables) {
      throw new Error('Search variables are required.');
    }

    const result = await searchMembersRequest(variables, {
      signal: context?.signal,
    });

    return unwrapGraphqlResult(result);
  },
  queryKey: (variables) =>
    membersQueryKeys.search(variables ?? { search: '', first: 0 }),
});

export const useApproveMemberMutation = defineMutation<
  ApproveMemberMutation,
  ApproveMemberMutationVariables
>({
  mutationFn: async (variables) => {
    if (!variables) {
      throw new Error('Approve member variables are required.');
    }

    return unwrapGraphqlResult(await approveMemberRequest(variables));
  },
  mutationKey: [...membersQueryKeys.all, 'approve'],
});

export const useRejectMemberMutation = defineMutation<
  RejectMemberMutation,
  RejectMemberMutationVariables
>({
  mutationFn: async (variables) => {
    if (!variables) {
      throw new Error('Reject member variables are required.');
    }

    return unwrapGraphqlResult(await rejectMemberRequest(variables));
  },
  mutationKey: [...membersQueryKeys.all, 'reject'],
});

export function retriggerApprovalNotificationRequest(
  variables: RetriggerApprovalNotificationMutationVariables,
  options?: GraphqlRequestOptions,
) {
  return client.request<
    RetriggerApprovalNotificationMutation,
    RetriggerApprovalNotificationMutationVariables
  >(RETRIGGER_APPROVAL_NOTIFICATION_MUTATION, variables, options);
}

export const useRetriggerApprovalNotificationMutation = defineMutation<
  RetriggerApprovalNotificationMutation,
  RetriggerApprovalNotificationMutationVariables
>({
  mutationFn: async (variables) => {
    if (!variables) {
      throw new Error('User ID is required.');
    }

    return unwrapGraphqlResult(
      await retriggerApprovalNotificationRequest(variables),
    );
  },
  mutationKey: [...membersQueryKeys.all, 'retrigger-approval'],
});
