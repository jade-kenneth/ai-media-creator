import type {
  AdminAccountRecordFragment,
  AdminAccountsQuery,
  CreateAdminAccountMutation,
  CreateAdminAccountMutationVariables,
  DeactivateAdminAccountMutation,
  DeactivateAdminAccountMutationVariables,
  ReactivateAdminAccountMutation,
  ReactivateAdminAccountMutationVariables,
  UpdateAdminAccountMutation,
  UpdateAdminAccountMutationVariables,
} from '@/react-query/generated__types';
import type {
  GraphqlRequestOptions,
  GraphqlRequestResult,
} from '@/react-query/graphql-client';

import { client } from '@/react-query/graphql-client';
import { defineMutation, defineQuery } from '@/react-query/utils';

import {
  ADMIN_ACCOUNTS_QUERY,
  CREATE_ADMIN_ACCOUNT_MUTATION,
  DEACTIVATE_ADMIN_ACCOUNT_MUTATION,
  REACTIVATE_ADMIN_ACCOUNT_MUTATION,
  UPDATE_ADMIN_ACCOUNT_MUTATION,
} from '../graphql/admin-management';

export type AdminAccountRecord = AdminAccountRecordFragment;

export const adminAccountsQueryKeys = {
  all: ['admin-accounts'] as const,
};

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

export function adminAccountsRequest(options?: GraphqlRequestOptions) {
  return client.request<AdminAccountsQuery>(
    ADMIN_ACCOUNTS_QUERY,
    undefined,
    options,
  );
}

export function createAdminAccountRequest(
  variables: CreateAdminAccountMutationVariables,
  options?: GraphqlRequestOptions,
) {
  return client.request<
    CreateAdminAccountMutation,
    CreateAdminAccountMutationVariables
  >(CREATE_ADMIN_ACCOUNT_MUTATION, variables, options);
}

export function updateAdminAccountRequest(
  variables: UpdateAdminAccountMutationVariables,
  options?: GraphqlRequestOptions,
) {
  return client.request<
    UpdateAdminAccountMutation,
    UpdateAdminAccountMutationVariables
  >(UPDATE_ADMIN_ACCOUNT_MUTATION, variables, options);
}

export function deactivateAdminAccountRequest(
  variables: DeactivateAdminAccountMutationVariables,
  options?: GraphqlRequestOptions,
) {
  return client.request<
    DeactivateAdminAccountMutation,
    DeactivateAdminAccountMutationVariables
  >(DEACTIVATE_ADMIN_ACCOUNT_MUTATION, variables, options);
}

export function reactivateAdminAccountRequest(
  variables: ReactivateAdminAccountMutationVariables,
  options?: GraphqlRequestOptions,
) {
  return client.request<
    ReactivateAdminAccountMutation,
    ReactivateAdminAccountMutationVariables
  >(REACTIVATE_ADMIN_ACCOUNT_MUTATION, variables, options);
}

export const useAdminAccountsQuery = defineQuery<AdminAccountsQuery>({
  queryFn: async (_, context) => {
    const result = await adminAccountsRequest({
      signal: context?.signal,
    });
    return unwrapGraphqlResult(result);
  },
  queryKey: adminAccountsQueryKeys.all,
});

export const useCreateAdminAccountMutation = defineMutation<
  CreateAdminAccountMutation,
  CreateAdminAccountMutationVariables
>({
  mutationFn: async (variables) => {
    if (!variables) {
      throw new Error('Create admin account variables are required.');
    }

    return unwrapGraphqlResult(await createAdminAccountRequest(variables));
  },
  mutationKey: [...adminAccountsQueryKeys.all, 'create'],
});

export const useUpdateAdminAccountMutation = defineMutation<
  UpdateAdminAccountMutation,
  UpdateAdminAccountMutationVariables
>({
  mutationFn: async (variables) => {
    if (!variables) {
      throw new Error('Update admin account variables are required.');
    }

    return unwrapGraphqlResult(await updateAdminAccountRequest(variables));
  },
  mutationKey: [...adminAccountsQueryKeys.all, 'update'],
});

export const useDeactivateAdminAccountMutation = defineMutation<
  DeactivateAdminAccountMutation,
  DeactivateAdminAccountMutationVariables
>({
  mutationFn: async (variables) => {
    if (!variables) {
      throw new Error('Deactivate admin account variables are required.');
    }

    return unwrapGraphqlResult(await deactivateAdminAccountRequest(variables));
  },
  mutationKey: [...adminAccountsQueryKeys.all, 'deactivate'],
});

export const useReactivateAdminAccountMutation = defineMutation<
  ReactivateAdminAccountMutation,
  ReactivateAdminAccountMutationVariables
>({
  mutationFn: async (variables) => {
    if (!variables) {
      throw new Error('Reactivate admin account variables are required.');
    }

    return unwrapGraphqlResult(await reactivateAdminAccountRequest(variables));
  },
  mutationKey: [...adminAccountsQueryKeys.all, 'reactivate'],
});
