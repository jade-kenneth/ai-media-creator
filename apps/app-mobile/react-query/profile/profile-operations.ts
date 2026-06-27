import type {
  MyProfileQuery,
  MyProfileQueryVariables,
  MemberProfileRecordFragment,
  UpdateMyProfileMutation,
  UpdateMyProfileMutationVariables,
} from '@/react-query/generated__types';
import type { GraphqlRequestOptions } from '@/react-query/graphql-client';

import { client } from '@/react-query/graphql-client';
import { defineMutation, defineQuery } from '@/react-query/utils';

import {
  MY_PROFILE_QUERY,
  UPDATE_MY_PROFILE_MUTATION,
} from './graphql/profile';

export type MemberProfile = MemberProfileRecordFragment;

export const profileQueryKeys = {
  all: ['profile'] as const,
  me: () => [...profileQueryKeys.all, 'me'] as const,
};

function unwrapGraphqlResult<Data extends Record<string, unknown>>(
  result:
    | { ok: true; data: Data }
    | { ok: false; error: { name: string; message: string }; data?: Data },
) {
  if (result.ok) return result.data;
  const error = new Error(result.error.message);
  error.name = result.error.name;
  throw error;
}

/* ------------------------------------------------------------------ */
/*  Request helpers                                                    */
/* ------------------------------------------------------------------ */

export function myProfileRequest(options?: GraphqlRequestOptions) {
  return client.request<MyProfileQuery, MyProfileQueryVariables>(
    MY_PROFILE_QUERY,
    undefined,
    options,
  );
}

export function updateMyProfileRequest(
  variables: UpdateMyProfileMutationVariables,
  options?: GraphqlRequestOptions,
) {
  return client.request<
    UpdateMyProfileMutation,
    UpdateMyProfileMutationVariables
  >(UPDATE_MY_PROFILE_MUTATION, variables, options);
}

/* ------------------------------------------------------------------ */
/*  Query hooks                                                        */
/* ------------------------------------------------------------------ */

export const useMyProfileQuery = defineQuery<MyProfileQuery>({
  queryFn: async (_input, context) => {
    const result = await myProfileRequest({ signal: context?.signal });
    return unwrapGraphqlResult(result);
  },
  queryKey: profileQueryKeys.me(),
  staleTime: 60_000,
});

/* ------------------------------------------------------------------ */
/*  Mutation hooks                                                     */
/* ------------------------------------------------------------------ */

export const useUpdateMyProfileMutation = defineMutation<
  UpdateMyProfileMutation,
  UpdateMyProfileMutationVariables
>({
  mutationFn: async (variables) => {
    if (!variables) throw new Error('Update profile input is required.');
    return unwrapGraphqlResult(await updateMyProfileRequest(variables));
  },
  mutationKey: [...profileQueryKeys.all, 'update'],
});
