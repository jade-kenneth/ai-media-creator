import type {
  SendTestPushNotificationMutation,
  SendTestPushNotificationMutationVariables,
} from '@/react-query/generated__types';
import type {
  GraphqlRequestOptions,
  GraphqlRequestResult,
} from '@/react-query/graphql-client';

import { client } from '@/react-query/graphql-client';
import { defineMutation } from '@/react-query/utils';

import {
  REGISTER_TEST_PUSH_TOKEN_MUTATION,
  SEND_TEST_PUSH_NOTIFICATION_MUTATION,
} from '../graphql/push-notifications';

type RegisterTestPushTokenPlatform = 'ANDROID' | 'IOS' | 'WEB';

export interface RegisterTestPushTokenMutationVariables {
  input: {
    token: string;
    platform: RegisterTestPushTokenPlatform;
  };
}

export type RegisterTestPushTokenMutation = {
  registerTestPushToken: boolean;
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

export function sendTestPushNotificationRequest(
  variables: SendTestPushNotificationMutationVariables,
  options?: GraphqlRequestOptions,
) {
  return client.request<
    SendTestPushNotificationMutation,
    SendTestPushNotificationMutationVariables
  >(SEND_TEST_PUSH_NOTIFICATION_MUTATION, variables, options);
}

export function registerTestPushTokenRequest(
  variables: RegisterTestPushTokenMutationVariables,
  options?: GraphqlRequestOptions,
) {
  return client.request<
    RegisterTestPushTokenMutation,
    RegisterTestPushTokenMutationVariables
  >(REGISTER_TEST_PUSH_TOKEN_MUTATION, variables, options);
}

export const useSendTestPushNotificationMutation = defineMutation<
  SendTestPushNotificationMutation,
  SendTestPushNotificationMutationVariables
>({
  mutationFn: async (variables) => {
    if (!variables) {
      throw new Error('Test push notification variables are required.');
    }

    return unwrapGraphqlResult(
      await sendTestPushNotificationRequest(variables),
    );
  },
  mutationKey: ['push-notifications', 'send-test'],
});

export const useRegisterTestPushTokenMutation = defineMutation<
  RegisterTestPushTokenMutation,
  RegisterTestPushTokenMutationVariables
>({
  mutationFn: async (variables) => {
    if (!variables) {
      throw new Error('Push token variables are required.');
    }

    return unwrapGraphqlResult(await registerTestPushTokenRequest(variables));
  },
  mutationKey: ['push-notifications', 'register-test-token'],
});
