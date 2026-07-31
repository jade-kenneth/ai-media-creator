import type {
  LinkGoogleAccountMutation,
  LinkGoogleAccountMutationVariables,
  LoginMutation,
  LoginMutationVariables,
  LoginWithGoogleMutation,
  LoginWithGoogleMutationVariables,
  MeQuery,
  UnlinkGoogleAccountMutation,
} from '@/react-query/generated__types';
import { client, type GraphqlRequestOptions } from '../graphql-client';
import { turnstileHeaders } from '../turnstile';
import {
  LINK_GOOGLE_ACCOUNT_MUTATION,
  LOGIN_MUTATION,
  LOGIN_WITH_GOOGLE_MUTATION,
  ME_QUERY,
  UNLINK_GOOGLE_ACCOUNT_MUTATION,
} from './graphql/auth';
import { defineMutation, defineQuery } from '../utils';

/** Variables plus the Turnstile token, which travels as a header. */
type WithTurnstileToken<Variables> = Variables & {
  turnstileToken?: string | null;
};

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
  WithTurnstileToken<LoginMutationVariables>
>({
  mutationFn: async (variables?: WithTurnstileToken<LoginMutationVariables>) => {
    if (!variables) {
      return Promise.reject(new Error('Login variables are required.'));
    }
    const { turnstileToken, ...rest } = variables;
    const res = await loginRequest(rest, {
      headers: turnstileHeaders(turnstileToken),
    });

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

/*
 *------------------------------------------------------------------
 * GOOGLE SIGN-IN
 *------------------------------------------------------------------
 */

export const useLoginWithGoogleMutation = defineMutation<
  LoginWithGoogleMutation,
  WithTurnstileToken<LoginWithGoogleMutationVariables>
>({
  mutationFn: async (
    variables?: WithTurnstileToken<LoginWithGoogleMutationVariables>,
  ) => {
    if (!variables) {
      return Promise.reject(new Error('A Google ID token is required.'));
    }
    const { turnstileToken, ...rest } = variables;
    const res = await client.request<
      LoginWithGoogleMutation,
      LoginWithGoogleMutationVariables
    >(LOGIN_WITH_GOOGLE_MUTATION, rest, {
      headers: turnstileHeaders(turnstileToken),
    });

    if (!res.ok) {
      const err = new Error();
      err.name = res.error.name;
      err.message = res.error.message;
      throw err;
    }
    return res.data;
  },
  mutationKey: [...authQueryKeys.me, 'login-with-google'],
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
      const err = new Error();
      err.name = res.error.name;
      err.message = res.error.message;
      throw err;
    }
    return res.data;
  },
  mutationKey: [...authQueryKeys.me, 'link-google-account'],
});

export const useUnlinkGoogleAccountMutation =
  defineMutation<UnlinkGoogleAccountMutation>({
    mutationFn: async () => {
      const res = await client.request<UnlinkGoogleAccountMutation>(
        UNLINK_GOOGLE_ACCOUNT_MUTATION,
      );

      if (!res.ok) {
        const err = new Error();
        err.name = res.error.name;
        err.message = res.error.message;
        throw err;
      }
      return res.data;
    },
    mutationKey: [...authQueryKeys.me, 'unlink-google-account'],
  });
