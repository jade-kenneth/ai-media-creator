import {
  registerPushNotificationsForSession,
  unregisterPushTokenForCurrentDevice,
} from '@/features/notifications/push-notifications';
import { notifyAuthChange, store } from '@/providers/AuthProvider/store';
import { queryClient } from '@/providers/query-provider';
import type {
  LoginMutation,
  LoginMutationVariables,
  LogoutMutation,
  MeQuery,
  RegisterUserMutation,
  RegisterUserMutationVariables,
} from '@/react-query/generated__types';

import { client, GraphqlRequestOptions } from '../graphql-client';
import { defineMutation, defineQuery } from '../utils';
import {
  LOGIN_MUTATION,
  LOGOUT_MUTATION,
  ME_QUERY,
  REGISTER_USER_MUTATION,
} from './graphql/auth';

export const authQueryKeys = {
  me: ['auth', 'me'] as const,
  registerUser: ['auth', 'register-user'] as const,
};

function toError(name: string, message: string) {
  const error = new Error(message);
  error.name = name;
  return error;
}

function registerPushAfterAuth(accessToken: string, role: string) {
  const sessionKey = `${role}:${accessToken.slice(0, 16)}`;
  void registerPushNotificationsForSession(sessionKey);
}

const meQueryKey = [...authQueryKeys.me, 'current'] as const;

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

export function registerUserRequest(
  variables: RegisterUserMutationVariables,
  options?: GraphqlRequestOptions,
) {
  return client.request<
    RegisterUserMutation,
    RegisterUserMutationVariables
  >(REGISTER_USER_MUTATION, variables, options);
}

export function getCurrentUser() {
  return client.request<MeQuery>(ME_QUERY);
}

export const useMeQuery = defineQuery<MeQuery>({
  queryFn: async () => {
    const res = await getCurrentUser();

    if (!res.ok) {
      throw toError(res.error.name, res.error.message);
    }

    return res.data;
  },
  queryKey: meQueryKey,
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
      throw toError(res.error.name, res.error.message);
    }

    await store.set({
      accessToken: res.data.login.accessToken,
      refreshToken: res.data.login.refreshToken,
      role: res.data.login.user.role,
    });
    notifyAuthChange();

    queryClient.setQueryData(meQueryKey, {
      me: res.data.login.user,
    } satisfies MeQuery);

    registerPushAfterAuth(res.data.login.accessToken, res.data.login.user.role);

    return res.data;
  },
  mutationKey: [...authQueryKeys.me, 'login'],
  suppressGlobalErrorToast: true,
});

export const useRegisterUserMutation = defineMutation<
  RegisterUserMutation,
  RegisterUserMutationVariables
>({
  mutationFn: async (variables?: RegisterUserMutationVariables) => {
    if (!variables) {
      return Promise.reject(new Error('Registration variables are required.'));
    }

    const res = await registerUserRequest(variables);

    if (!res.ok) {
      throw toError(res.error.name, res.error.message);
    }

    await store.set({
      accessToken: res.data.registerUser.accessToken,
      refreshToken: res.data.registerUser.refreshToken,
      role: res.data.registerUser.user.role,
    });
    notifyAuthChange();

    queryClient.setQueryData(meQueryKey, {
      me: res.data.registerUser.user,
    } satisfies MeQuery);

    registerPushAfterAuth(
      res.data.registerUser.accessToken,
      res.data.registerUser.user.role,
    );

    return res.data;
  },
  mutationKey: authQueryKeys.registerUser,
  suppressGlobalErrorToast: true,
});

export const useLogoutMutation = defineMutation<LogoutMutation>({
  mutationFn: async () => {
    await unregisterPushTokenForCurrentDevice();

    try {
      const res = await logoutRequest();

      if (!res.ok) {
        throw toError(res.error.name, res.error.message);
      }

      return res.data;
    } finally {
      await store.clearSession();
      notifyAuthChange();
      queryClient.removeQueries({ queryKey: authQueryKeys.me });
    }
  },
  mutationKey: [...authQueryKeys.me, 'logout'],
});
