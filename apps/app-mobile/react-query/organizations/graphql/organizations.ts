import { gql } from 'graphql-request';

export const ORGANIZATION_PICKER_FRAGMENT = gql`
  fragment OrganizationPickerRecord on Organization {
    id
    name
    slug
    logoUrl
    primaryColor
    contactNumber
    address
    features
    isActive
  }
`;

export const ORGANIZATIONS_QUERY = gql`
  query Organizations($filter: OrganizationFilterInput) {
    organizations(filter: $filter) {
      ...OrganizationPickerRecord
    }
  }
  ${ORGANIZATION_PICKER_FRAGMENT}
`;
