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

export const REGISTER_MEMBER_MUTATION = gql`
  mutation RegisterMember($input: RegisterMemberInput!) {
    registerMember(input: $input) {
      user {
        id
        email
        role
        isActive
      }
    }
  }
`;

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
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
    }
  }
`;

export const VALIDATE_SESSION_QUERY = gql`
  query validateSession {
    validateSession {
      ok
      status
    }
  }
`;
