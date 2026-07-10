import { gql } from 'graphql-request';

export const USER_PROFILE_FRAGMENT = gql`
  fragment UserProfileRecord on User {
    id
    email
    role
    organizationId
    isActive
    firstName
    lastName
    position
    createdAt
    updatedAt
  }
`;

export const UPDATE_MY_PROFILE_MUTATION = gql`
  mutation UpdateMyProfile($input: UpdateMyProfileInput!) {
    updateMyProfile(input: $input) {
      ...UserProfileRecord
    }
  }
  ${USER_PROFILE_FRAGMENT}
`;
