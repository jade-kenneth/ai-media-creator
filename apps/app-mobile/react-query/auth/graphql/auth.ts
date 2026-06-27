import { gql } from 'graphql-request';

export const AUTH_REGISTRATION_REVIEW_FRAGMENT = gql`
  fragment AuthRegistrationReview on RegistrationReview {
    reviewedBy
    reviewedAt
    rejectionReason
    rejectionNote
  }
`;

export const AUTH_USER_FRAGMENT = gql`
  fragment AuthUser on User {
    id
    email
    role
    isActive
    registrationStatus
    registrationReview {
      ...AuthRegistrationReview
    }
  }
  ${AUTH_REGISTRATION_REVIEW_FRAGMENT}
`;

export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      refreshToken
      tokenType
      expiresIn
      user {
        ...AuthUser
      }
    }
  }
  ${AUTH_USER_FRAGMENT}
`;

export const REGISTER_MEMBER_MUTATION = gql`
  mutation RegisterMember($input: RegisterMemberInput!) {
    registerMember(input: $input) {
      accessToken
      refreshToken
      user {
        ...AuthUser
      }
    }
  }
  ${AUTH_USER_FRAGMENT}
`;

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;

export const ME_QUERY = gql`
  query Me {
    me {
      ...AuthUser
    }
  }
  ${AUTH_USER_FRAGMENT}
`;

export const VALIDATE_SESSION_QUERY = gql`
  query ValidateSession {
    validateSession {
      ok
      status
    }
  }
`;
