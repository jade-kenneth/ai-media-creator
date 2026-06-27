import { gql } from 'graphql-request';

export const ORGANIZATION_FRAGMENT = gql`
  fragment OrganizationRecord on Organization {
    id
    name
    slug
    logoUrl
    primaryColor
    contactNumber
    address
    features
    isActive
    createdAt
    updatedAt
  }
`;

export const ORGANIZATIONS_QUERY = gql`
  query Organizations($filter: OrganizationFilterInput) {
    organizations(filter: $filter) {
      ...OrganizationRecord
    }
  }
  ${ORGANIZATION_FRAGMENT}
`;

export const ORGANIZATION_QUERY = gql`
  query Organization($id: ID!) {
    organization(id: $id) {
      ...OrganizationRecord
    }
  }
  ${ORGANIZATION_FRAGMENT}
`;

export const CREATE_ORGANIZATION_MUTATION = gql`
  mutation CreateOrganization($input: CreateOrganizationInput!) {
    createOrganization(input: $input) {
      ...OrganizationRecord
    }
  }
  ${ORGANIZATION_FRAGMENT}
`;

export const UPDATE_ORGANIZATION_MUTATION = gql`
  mutation UpdateOrganization($id: ID!, $input: UpdateOrganizationInput!) {
    updateOrganization(id: $id, input: $input) {
      ...OrganizationRecord
    }
  }
  ${ORGANIZATION_FRAGMENT}
`;

export const DEACTIVATE_ORGANIZATION_MUTATION = gql`
  mutation DeactivateOrganization($id: ID!) {
    deactivateOrganization(id: $id) {
      ...OrganizationRecord
    }
  }
  ${ORGANIZATION_FRAGMENT}
`;

export const REACTIVATE_ORGANIZATION_MUTATION = gql`
  mutation ReactivateOrganization($id: ID!) {
    reactivateOrganization(id: $id) {
      ...OrganizationRecord
    }
  }
  ${ORGANIZATION_FRAGMENT}
`;
