import type {
  OrganizationRecordFragment,
  OrganizationsQuery,
  OrganizationsQueryVariables,
  OrganizationQuery,
  OrganizationQueryVariables,
  CreateOrganizationMutation,
  CreateOrganizationMutationVariables,
  UpdateOrganizationMutation,
  UpdateOrganizationMutationVariables,
  DeactivateOrganizationMutation,
  DeactivateOrganizationMutationVariables,
  ReactivateOrganizationMutation,
  ReactivateOrganizationMutationVariables,
} from '@/react-query/generated__types';
import type {
  GraphqlRequestOptions,
  GraphqlRequestResult,
} from '@/react-query/graphql-client';

import { client } from '@/react-query/graphql-client';
import { defineMutation, defineQuery } from '@/react-query/utils';

import {
  ORGANIZATIONS_QUERY,
  ORGANIZATION_QUERY,
  CREATE_ORGANIZATION_MUTATION,
  DEACTIVATE_ORGANIZATION_MUTATION,
  REACTIVATE_ORGANIZATION_MUTATION,
  UPDATE_ORGANIZATION_MUTATION,
} from '../graphql/organizations';

export type OrganizationRecord = OrganizationRecordFragment;

export const organizationsQueryKeys = {
  all: ['organizations'] as const,
  list: (variables?: OrganizationsQueryVariables) =>
    [...organizationsQueryKeys.all, 'list', variables ?? {}] as const,
  detail: (id: string) => [...organizationsQueryKeys.all, 'detail', id] as const,
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

export function organizationsRequest(
  variables?: OrganizationsQueryVariables,
  options?: GraphqlRequestOptions,
) {
  return client.request<OrganizationsQuery, OrganizationsQueryVariables>(
    ORGANIZATIONS_QUERY,
    variables,
    options,
  );
}

export function organizationRequest(
  variables: OrganizationQueryVariables,
  options?: GraphqlRequestOptions,
) {
  return client.request<OrganizationQuery, OrganizationQueryVariables>(
    ORGANIZATION_QUERY,
    variables,
    options,
  );
}

export function createOrganizationRequest(
  variables: CreateOrganizationMutationVariables,
  options?: GraphqlRequestOptions,
) {
  return client.request<CreateOrganizationMutation, CreateOrganizationMutationVariables>(
    CREATE_ORGANIZATION_MUTATION,
    variables,
    options,
  );
}

export function updateOrganizationRequest(
  variables: UpdateOrganizationMutationVariables,
  options?: GraphqlRequestOptions,
) {
  return client.request<UpdateOrganizationMutation, UpdateOrganizationMutationVariables>(
    UPDATE_ORGANIZATION_MUTATION,
    variables,
    options,
  );
}

export function deactivateOrganizationRequest(
  variables: DeactivateOrganizationMutationVariables,
  options?: GraphqlRequestOptions,
) {
  return client.request<
    DeactivateOrganizationMutation,
    DeactivateOrganizationMutationVariables
  >(DEACTIVATE_ORGANIZATION_MUTATION, variables, options);
}

export function reactivateOrganizationRequest(
  variables: ReactivateOrganizationMutationVariables,
  options?: GraphqlRequestOptions,
) {
  return client.request<
    ReactivateOrganizationMutation,
    ReactivateOrganizationMutationVariables
  >(REACTIVATE_ORGANIZATION_MUTATION, variables, options);
}

export const useOrganizationsQuery = defineQuery<
  OrganizationsQuery,
  OrganizationsQueryVariables
>({
  queryFn: async (variables, context) => {
    const result = await organizationsRequest(variables, {
      signal: context?.signal,
    });
    return unwrapGraphqlResult(result);
  },
  queryKey: (variables) => organizationsQueryKeys.list(variables),
});

export const useOrganizationQuery = defineQuery<
  OrganizationQuery,
  OrganizationQueryVariables
>({
  queryFn: async (variables, context) => {
    if (!variables) {
      throw new Error('Organization query variables are required.');
    }

    const result = await organizationRequest(variables, {
      signal: context?.signal,
    });
    return unwrapGraphqlResult(result);
  },
  queryKey: (variables) => organizationsQueryKeys.detail(variables?.id ?? ''),
});

export const useCreateOrganizationMutation = defineMutation<
  CreateOrganizationMutation,
  CreateOrganizationMutationVariables
>({
  mutationFn: async (variables) => {
    if (!variables) throw new Error('Create organization variables are required.');
    return unwrapGraphqlResult(await createOrganizationRequest(variables));
  },
  mutationKey: [...organizationsQueryKeys.all, 'create'],
});

export const useUpdateOrganizationMutation = defineMutation<
  UpdateOrganizationMutation,
  UpdateOrganizationMutationVariables
>({
  mutationFn: async (variables) => {
    if (!variables) throw new Error('Update organization variables are required.');
    return unwrapGraphqlResult(await updateOrganizationRequest(variables));
  },
  mutationKey: [...organizationsQueryKeys.all, 'update'],
});

export const useDeactivateOrganizationMutation = defineMutation<
  DeactivateOrganizationMutation,
  DeactivateOrganizationMutationVariables
>({
  mutationFn: async (variables) => {
    if (!variables)
      throw new Error('Deactivate organization variables are required.');
    return unwrapGraphqlResult(await deactivateOrganizationRequest(variables));
  },
  mutationKey: [...organizationsQueryKeys.all, 'deactivate'],
});

export const useReactivateOrganizationMutation = defineMutation<
  ReactivateOrganizationMutation,
  ReactivateOrganizationMutationVariables
>({
  mutationFn: async (variables) => {
    if (!variables)
      throw new Error('Reactivate organization variables are required.');
    return unwrapGraphqlResult(await reactivateOrganizationRequest(variables));
  },
  mutationKey: [...organizationsQueryKeys.all, 'reactivate'],
});
