import { gql } from "graphql-request";

export const REGISTER_PUSH_TOKEN_MUTATION = gql`
  mutation RegisterPushToken($input: RegisterPushTokenInput!) {
    registerPushToken(input: $input)
  }
`;

export const UNREGISTER_PUSH_TOKEN_MUTATION = gql`
  mutation UnregisterPushToken($input: UnregisterPushTokenInput!) {
    unregisterPushToken(input: $input)
  }
`;
