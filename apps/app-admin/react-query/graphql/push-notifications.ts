import { gql } from 'graphql-request';

export const REGISTER_TEST_PUSH_TOKEN_MUTATION = gql`
  mutation RegisterTestPushToken($input: RegisterPushTokenInput!) {
    registerTestPushToken: registerPushToken(input: $input)
  }
`;

export const SEND_TEST_PUSH_NOTIFICATION_MUTATION = gql`
  mutation SendTestPushNotification(
    $input: SendTestPushNotificationInput!
  ) {
    sendTestPushNotification(input: $input) {
      tokenCount
    }
  }
`;
