import type {
  UpdateMyProfileMutation,
  UpdateMyProfileMutationVariables,
} from '@/react-query/generated__types';
import type { GraphqlRequestOptions } from '@/react-query/graphql-client';

import { client } from '@/react-query/graphql-client';
import { defineMutation } from '@/react-query/utils';

import { UPDATE_MY_PROFILE_MUTATION } from './graphql/profile';

export const profileQueryKeys = {
  all: ['profile'] as const,
};

export function updateMyProfileRequest(
  variables: UpdateMyProfileMutationVariables,
  options?: GraphqlRequestOptions,
) {
  return client.request<
    UpdateMyProfileMutation,
    UpdateMyProfileMutationVariables
  >(UPDATE_MY_PROFILE_MUTATION, variables, options);
}

export const useUpdateMyProfileMutation = defineMutation<
  UpdateMyProfileMutation,
  UpdateMyProfileMutationVariables
>({
  mutationFn: async (variables) => {
    if (!variables) throw new Error('Update profile input is required.');

    const result = await updateMyProfileRequest(variables);
    if (result.ok) return result.data;

    const error = new Error(result.error.message);
    error.name = result.error.name;
    throw error;
  },
  mutationKey: [...profileQueryKeys.all, 'update'],
});
