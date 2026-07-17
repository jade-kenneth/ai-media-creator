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
