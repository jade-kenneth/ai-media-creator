import {
  registerPushNotificationsForSession,
  unregisterPushTokenForCurrentDevice,
} from '@/features/notifications/push-notifications';
import { notifyAuthChange, store } from '@/providers/AuthProvider/store';
import { queryClient } from '@/providers/query-provider';
import type {
  LinkGoogleAccountMutation,
  LinkGoogleAccountMutationVariables,
  LoginMutation,
  LoginMutationVariables,
  LoginWithGoogleMutation,
  LoginWithGoogleMutationVariables,
  LogoutMutation,
  MeQuery,
  RegisterUserMutation,
  RegisterUserMutationVariables,
  RequestPasswordResetMutation,
  RequestPasswordResetMutationVariables,
  ResetPasswordMutation,
  ResetPasswordMutationVariables,
  UnlinkGoogleAccountMutation,
  VerifyResetCodeMutation,
  VerifyResetCodeMutationVariables,
} from '@/react-query/generated__types';

import { client, GraphqlRequestOptions, publicClient } from '../graphql-client';
import { defineMutation, defineQuery } from '../utils';
import {
  LINK_GOOGLE_ACCOUNT_MUTATION,
  LOGIN_MUTATION,
  LOGIN_WITH_GOOGLE_MUTATION,
  LOGOUT_MUTATION,
  ME_QUERY,
  REGISTER_USER_MUTATION,
  REQUEST_PASSWORD_RESET_MUTATION,
  RESET_PASSWORD_MUTATION,
  UNLINK_GOOGLE_ACCOUNT_MUTATION,
  VERIFY_RESET_CODE_MUTATION,
} from './graphql/auth';

export const authQueryKeys = {
  me: ['auth', 'me'] as const,
  registerUser: ['auth', 'register-user'] as const,
  passwordReset: ['auth', 'password-reset'] as const,
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

/** The part of any auth payload the session layer needs. */
type PersistableAuthPayload = {
  accessToken: string;
  refreshToken: string;
  user: MeQuery['me'];
};

/** Everything that has to happen once any sign-in returns an auth payload. */
async function persistAuthSession(payload: PersistableAuthPayload) {
  await store.set({
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
    role: payload.user.role,
  });
  notifyAuthChange();

  queryClient.setQueryData(meQueryKey, {
    me: payload.user,
  } satisfies MeQuery);

  registerPushAfterAuth(payload.accessToken, payload.user.role);
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
  return client.request<RegisterUserMutation, RegisterUserMutationVariables>(
    REGISTER_USER_MUTATION,
    variables,
    options,
  );
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

    await persistAuthSession(res.data.login);

    return res.data;
  },
  mutationKey: [...authQueryKeys.me, 'login'],
  suppressGlobalErrorToast: true,
});

/*
 *------------------------------------------------------------------
 * GOOGLE SIGN-IN
 *------------------------------------------------------------------
 */

export const useLoginWithGoogleMutation = defineMutation<
  LoginWithGoogleMutation,
  LoginWithGoogleMutationVariables
>({
  mutationFn: async (variables?: LoginWithGoogleMutationVariables) => {
    if (!variables) {
      return Promise.reject(new Error('A Google ID token is required.'));
    }

    const res = await publicClient.request<
      LoginWithGoogleMutation,
      LoginWithGoogleMutationVariables
    >(LOGIN_WITH_GOOGLE_MUTATION, variables);

    if (!res.ok) {
      throw toError(res.error.name, res.error.message);
    }

    await persistAuthSession(res.data.loginWithGoogle);

    return res.data;
  },
  mutationKey: [...authQueryKeys.me, 'login-with-google'],
  suppressGlobalErrorToast: true,
});

export const useLinkGoogleAccountMutation = defineMutation<
  LinkGoogleAccountMutation,
  LinkGoogleAccountMutationVariables
>({
  mutationFn: async (variables?: LinkGoogleAccountMutationVariables) => {
    if (!variables) {
      return Promise.reject(new Error('A Google ID token is required.'));
    }

    const res = await client.request<
      LinkGoogleAccountMutation,
      LinkGoogleAccountMutationVariables
    >(LINK_GOOGLE_ACCOUNT_MUTATION, variables);

    if (!res.ok) {
      throw toError(res.error.name, res.error.message);
    }

    queryClient.setQueryData(meQueryKey, {
      me: res.data.linkGoogleAccount,
    } satisfies MeQuery);

    return res.data;
  },
  mutationKey: [...authQueryKeys.me, 'link-google-account'],
  suppressGlobalErrorToast: true,
});

export const useUnlinkGoogleAccountMutation =
  defineMutation<UnlinkGoogleAccountMutation>({
    mutationFn: async () => {
      const res = await client.request<UnlinkGoogleAccountMutation>(
        UNLINK_GOOGLE_ACCOUNT_MUTATION,
      );

      if (!res.ok) {
        throw toError(res.error.name, res.error.message);
      }

      queryClient.setQueryData(meQueryKey, {
        me: res.data.unlinkGoogleAccount,
      } satisfies MeQuery);

      return res.data;
    },
    mutationKey: [...authQueryKeys.me, 'unlink-google-account'],
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

    await persistAuthSession(res.data.registerUser);

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

export const useRequestPasswordResetMutation = defineMutation<
  RequestPasswordResetMutation,
  RequestPasswordResetMutationVariables
>({
  mutationKey: [...authQueryKeys.passwordReset, 'request'],
  suppressGlobalErrorToast: true,
  mutationFn: async (variables) => {
    if (!variables) throw new Error('Email is required.');
    const result = await publicClient.request<
      RequestPasswordResetMutation,
      RequestPasswordResetMutationVariables
    >(REQUEST_PASSWORD_RESET_MUTATION, variables);
    if (!result.ok) throw toError(result.error.name, result.error.message);
    return result.data;
  },
});

export const useVerifyResetCodeMutation = defineMutation<
  VerifyResetCodeMutation,
  VerifyResetCodeMutationVariables
>({
  mutationKey: [...authQueryKeys.passwordReset, 'verify'],
  suppressGlobalErrorToast: true,
  mutationFn: async (variables) => {
    if (!variables) throw new Error('Code is required.');
    const result = await publicClient.request<
      VerifyResetCodeMutation,
      VerifyResetCodeMutationVariables
    >(VERIFY_RESET_CODE_MUTATION, variables);
    if (!result.ok) throw toError(result.error.name, result.error.message);
    return result.data;
  },
});

export const useResetPasswordMutation = defineMutation<
  ResetPasswordMutation,
  ResetPasswordMutationVariables
>({
  mutationKey: [...authQueryKeys.passwordReset, 'reset'],
  suppressGlobalErrorToast: true,
  mutationFn: async (variables) => {
    if (!variables) throw new Error('Password reset input is required.');
    const result = await publicClient.request<
      ResetPasswordMutation,
      ResetPasswordMutationVariables
    >(RESET_PASSWORD_MUTATION, variables);
    if (!result.ok) throw toError(result.error.name, result.error.message);
    return result.data;
  },
});
