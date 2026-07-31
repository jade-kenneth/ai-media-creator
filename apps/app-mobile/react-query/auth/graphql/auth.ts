import { gql } from 'graphql-request';

export const AUTH_USER_FRAGMENT = gql`
  fragment AuthUser on User {
    id
    email
    role
    organizationId
    isActive
    firstName
    lastName
    position
    googleLinked
    createdAt
    updatedAt
  }
`;

export const LOGIN_WITH_GOOGLE_MUTATION = gql`
  mutation LoginWithGoogle($input: GoogleAuthInput!) {
    loginWithGoogle(input: $input) {
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

export const LINK_GOOGLE_ACCOUNT_MUTATION = gql`
  mutation LinkGoogleAccount($input: GoogleAuthInput!) {
    linkGoogleAccount(input: $input) {
      ...AuthUser
    }
  }
  ${AUTH_USER_FRAGMENT}
`;

export const UNLINK_GOOGLE_ACCOUNT_MUTATION = gql`
  mutation UnlinkGoogleAccount {
    unlinkGoogleAccount {
      ...AuthUser
    }
  }
  ${AUTH_USER_FRAGMENT}
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

export const REGISTER_USER_MUTATION = gql`
  mutation RegisterUser($input: RegisterUserInput!) {
    registerUser(input: $input) {
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

export const REQUEST_PASSWORD_RESET_MUTATION = gql`
  mutation RequestPasswordReset($email: String!) {
    requestPasswordReset(email: $email) {
      accepted
      message
    }
  }
`;

export const VERIFY_RESET_CODE_MUTATION = gql`
  mutation VerifyResetCode($email: String!, $code: String!) {
    verifyResetCode(email: $email, code: $code) {
      status
    }
  }
`;

export const RESET_PASSWORD_MUTATION = gql`
  mutation ResetPassword($input: ResetPasswordInput!) {
    resetPassword(input: $input)
  }
`;
