import type {
  GraphqlRequestOptions,
  GraphqlRequestResult,
} from "@/react-query/graphql-client";

import { client } from "@/react-query/graphql-client";
import { defineMutation } from "@/react-query/utils";

import {
  RegisterPushTokenMutation,
  RegisterPushTokenMutationVariables,
  UnregisterPushTokenMutation,
  UnregisterPushTokenMutationVariables,
} from "../generated__types";
import {
  REGISTER_PUSH_TOKEN_MUTATION,
  UNREGISTER_PUSH_TOKEN_MUTATION,
} from "./graphql/push-notifications";

function unwrapGraphqlResult<Data>(result: GraphqlRequestResult<Data>) {
  if (result.ok) {
    return result.data;
  }

  const error = new Error(result.error.message);
  error.name = result.error.name;
  throw error;
}

export function registerPushTokenRequest(
  variables: RegisterPushTokenMutationVariables,
  options?: GraphqlRequestOptions
) {
  return client.request<
    RegisterPushTokenMutation,
    RegisterPushTokenMutationVariables
  >(REGISTER_PUSH_TOKEN_MUTATION, variables, options);
}

export function unregisterPushTokenRequest(
  variables: UnregisterPushTokenMutationVariables,
  options?: GraphqlRequestOptions
) {
  return client.request<
    UnregisterPushTokenMutation,
    UnregisterPushTokenMutationVariables
  >(UNREGISTER_PUSH_TOKEN_MUTATION, variables, options);
}

export const useRegisterPushTokenMutation = defineMutation<
  RegisterPushTokenMutation,
  RegisterPushTokenMutationVariables
>({
  mutationFn: async (variables) => {
    if (!variables) throw new Error("Push token input is required.");
    return unwrapGraphqlResult(await registerPushTokenRequest(variables));
  },
  mutationKey: ["notifications", "push-token", "register"],
  suppressGlobalErrorToast: true,
});

export const useUnregisterPushTokenMutation = defineMutation<
  UnregisterPushTokenMutation,
  UnregisterPushTokenMutationVariables
>({
  mutationFn: async (variables) => {
    if (!variables) throw new Error("Push token input is required.");
    return unwrapGraphqlResult(await unregisterPushTokenRequest(variables));
  },
  mutationKey: ["notifications", "push-token", "unregister"],
  suppressGlobalErrorToast: true,
});
