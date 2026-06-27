import type {
  LoginMutation,
  LoginMutationVariables,
  LogoutMutation,
  MeQuery,
  RegisterMemberMutation,
  RegisterMemberMutationVariables,
} from '@/react-query/generated__types';
import { client, GraphqlRequestOptions } from '../graphql-client';
import {
  LOGIN_MUTATION,
  LOGOUT_MUTATION,
  ME_QUERY,
  REGISTER_MEMBER_MUTATION,
  VALIDATE_SESSION_QUERY,
} from '../graphql/auth';
import { defineMutation, defineQuery } from '../utils';

export const authQueryKeys = {
  me: ['auth', 'me'] as const,
  registerMember: ['auth', 'register-member'] as const,
};

/*
 *------------------------------------------------------------------
 *	LOGIN / SIGN UP / LOGOUT / USER QUERY
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

export function logoutRequest() {
  return client.request<LogoutMutation>(LOGOUT_MUTATION, undefined);
}

export function registerMemberRequest(
  variables: RegisterMemberMutationVariables,
  options?: GraphqlRequestOptions,
) {
  return client.request<
    RegisterMemberMutation,
    RegisterMemberMutationVariables
  >(REGISTER_MEMBER_MUTATION, variables, options);
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

export const useRegisterMemberMutation = defineMutation<
  RegisterMemberMutation,
  RegisterMemberMutationVariables
>({
  mutationFn: async (variables?: RegisterMemberMutationVariables) => {
    if (!variables) {
      return Promise.reject(
        new Error('Register member variables are required.'),
      );
    }

    const res = await registerMemberRequest(variables);

    if (!res.ok) {
      const err = new Error();
      err.name = res.error.name;
      err.message = res.error.message;
      throw err;
    }

    return res.data;
  },
  mutationKey: authQueryKeys.registerMember,
});

export const useLogoutMutation = defineMutation<LogoutMutation>({
  mutationFn: async () => {
    const res = await logoutRequest();

    if (!res.ok) {
      const err = new Error();
      err.name = res.error.name;
      err.message = res.error.message;
      throw err;
    }
    return res.data;
  },
  mutationKey: [...authQueryKeys.me, 'logout'],
});

export const useValidateSessionQuery = defineQuery({
  queryFn: async () => {
    const res = await client.request(VALIDATE_SESSION_QUERY);
    if (!res.ok) {
      const err = new Error();
      err.name = res.error.name;
      err.message = res.error.message;
      throw err;
    }
    return res.data;
  },
  queryKey: [...authQueryKeys.me, 'validate-session'],
});
