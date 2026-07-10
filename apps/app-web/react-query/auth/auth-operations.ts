import type {
  LoginMutation,
  LoginMutationVariables,
  MeQuery,
} from '@/react-query/generated__types';
import { client, type GraphqlRequestOptions } from '../graphql-client';
import { LOGIN_MUTATION, ME_QUERY } from '../graphql/auth';
import { defineMutation, defineQuery } from '../utils';

export const authQueryKeys = {
  me: ['auth', 'me'] as const,
};

/*
 *------------------------------------------------------------------
 * LOGIN / CURRENT USER
 *------------------------------------------------------------------
 */

export function loginRequest(
  variables: LoginMutationVariables,
  options?: GraphqlRequestOptions,
) {
  return client.request<LoginMutation, LoginMutationVariables>(
    LOGIN_MUTATION,
    variables,
    options,
  );
}

export function getCurrentUser() {
  return client.request<MeQuery>(ME_QUERY);
}

export const useCurrentQuery = defineQuery<MeQuery>({
  queryFn: async () => {
    const res = await getCurrentUser();
    if (!res.ok) {
      const err = new Error();
      err.name = res.error.name;
      err.message = res.error.message;
      throw err;
    }
    return res.data;
  },
  queryKey: [...authQueryKeys.me, 'current'],
});

export const useLoginMutation = defineMutation<
  LoginMutation,
  LoginMutationVariables
>({
  mutationFn: async (variables?: LoginMutationVariables) => {
    if (!variables) {
      return Promise.reject(new Error('Login variables are required.'));
    }
    const res = await loginRequest(variables);

    if (!res.ok) {
      const err = new Error();
      err.name = res.error.name;
      err.message = res.error.message;
      throw err;
    }
    return res.data;
  },
  mutationKey: [...authQueryKeys.me, 'login'],
});
