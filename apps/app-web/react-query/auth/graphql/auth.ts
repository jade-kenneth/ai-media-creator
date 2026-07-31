import { gql } from 'graphql-request';

export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      refreshToken
      tokenType
      expiresIn
      user {
        id
        email
        role
        isActive
      }
    }
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
        id
        email
        role
        isActive
      }
    }
  }
`;

export const LINK_GOOGLE_ACCOUNT_MUTATION = gql`
  mutation LinkGoogleAccount($input: GoogleAuthInput!) {
    linkGoogleAccount(input: $input) {
      id
      email
      googleLinked
    }
  }
`;

export const UNLINK_GOOGLE_ACCOUNT_MUTATION = gql`
  mutation UnlinkGoogleAccount {
    unlinkGoogleAccount {
      id
      email
      googleLinked
    }
  }
`;

export const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      role
      organizationId
      isActive
      googleLinked
    }
  }
`;
