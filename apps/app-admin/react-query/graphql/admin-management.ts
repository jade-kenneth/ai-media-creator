import { gql } from 'graphql-request';

export const ADMIN_ACCOUNT_FRAGMENT = gql`
  fragment AdminAccountRecord on AdminAccount {
    id
    email
    isActive
    organizationId
    firstName
    lastName
    position
    createdAt
    updatedAt
  }
`;

export const ADMIN_ACCOUNTS_QUERY = gql`
  query AdminAccounts {
    adminAccounts {
      ...AdminAccountRecord
    }
  }
  ${ADMIN_ACCOUNT_FRAGMENT}
`;

export const CREATE_ADMIN_ACCOUNT_MUTATION = gql`
  mutation CreateAdminAccount($input: CreateAdminAccountInput!) {
    createAdminAccount(input: $input) {
      ...AdminAccountRecord
    }
  }
  ${ADMIN_ACCOUNT_FRAGMENT}
`;

export const UPDATE_ADMIN_ACCOUNT_MUTATION = gql`
  mutation UpdateAdminAccount($id: ID!, $input: UpdateAdminAccountInput!) {
    updateAdminAccount(id: $id, input: $input) {
      ...AdminAccountRecord
    }
  }
  ${ADMIN_ACCOUNT_FRAGMENT}
`;

export const DEACTIVATE_ADMIN_ACCOUNT_MUTATION = gql`
  mutation DeactivateAdminAccount($id: ID!) {
    deactivateAdminAccount(id: $id) {
      ...AdminAccountRecord
    }
  }
  ${ADMIN_ACCOUNT_FRAGMENT}
`;

export const REACTIVATE_ADMIN_ACCOUNT_MUTATION = gql`
  mutation ReactivateAdminAccount($id: ID!) {
    reactivateAdminAccount(id: $id) {
      ...AdminAccountRecord
    }
  }
  ${ADMIN_ACCOUNT_FRAGMENT}
`;
