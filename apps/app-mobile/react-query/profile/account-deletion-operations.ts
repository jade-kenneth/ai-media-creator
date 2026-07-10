import type {
  SubmitAccountDeletionRequestMutation,
  SubmitAccountDeletionRequestMutationVariables,
} from '@/react-query/generated__types';
import type { GraphqlRequestOptions } from '@/react-query/graphql-client';

import { client } from '@/react-query/graphql-client';
import { defineMutation } from '@/react-query/utils';

import { SUBMIT_ACCOUNT_DELETION_REQUEST_MUTATION } from './graphql/account-deletion';

export function submitAccountDeletionRequest(
  variables: SubmitAccountDeletionRequestMutationVariables,
  options?: GraphqlRequestOptions,
) {
  return client.request<
    SubmitAccountDeletionRequestMutation,
    SubmitAccountDeletionRequestMutationVariables
  >(SUBMIT_ACCOUNT_DELETION_REQUEST_MUTATION, variables, options);
}

export const useSubmitAccountDeletionRequestMutation = defineMutation<
  SubmitAccountDeletionRequestMutation,
  SubmitAccountDeletionRequestMutationVariables
>({
  mutationFn: async (variables) => {
    if (!variables) {
      throw new Error('Account deletion request input is required.');
    }

    const result = await submitAccountDeletionRequest(variables);
    if (result.ok) return result.data;

    const error = new Error(result.error.message);
    error.name = result.error.name;
    throw error;
  },
  mutationKey: ['account-deletion', 'submit'],
  suppressGlobalErrorToast: true,
});
