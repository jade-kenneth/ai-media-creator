import { gql } from 'graphql-request';

export const ACCOUNT_DELETION_REQUEST_RECORD_FRAGMENT = gql`
  fragment AccountDeletionRequestRecord on AccountDeletionRequest {
    id
    fullName
    email
    organizationId
    organizationName
    status
    reviewNote
    reviewedBy
    reviewedAt
    createdAt
    updatedAt
  }
`;

export const ADMIN_ACCOUNT_DELETION_REQUESTS_QUERY = gql`
  query AdminAccountDeletionRequests(
    $filter: AccountDeletionRequestFilterInput
    $sort: AccountDeletionRequestSortInput
    $first: Int
    $after: Cursor
  ) {
    adminAccountDeletionRequests(
      filter: $filter
      sort: $sort
      first: $first
      after: $after
    ) {
      totalCount
      edges {
        cursor
        node {
          ...AccountDeletionRequestRecord
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  ${ACCOUNT_DELETION_REQUEST_RECORD_FRAGMENT}
`;

export const ADMIN_ACCOUNT_DELETION_REQUESTS_COUNT_QUERY = gql`
  query AdminAccountDeletionRequestsCount($filter: AccountDeletionRequestFilterInput) {
    adminAccountDeletionRequests(filter: $filter) {
      totalCount
    }
  }
`;

export const ADMIN_ACCOUNT_DELETION_REQUEST_QUERY = gql`
  query AdminAccountDeletionRequest($id: ID!) {
    adminAccountDeletionRequest(id: $id) {
      ...AccountDeletionRequestRecord
    }
  }
  ${ACCOUNT_DELETION_REQUEST_RECORD_FRAGMENT}
`;

export const SUBMIT_ACCOUNT_DELETION_REQUEST_MUTATION = gql`
  mutation SubmitAccountDeletionRequest(
    $input: SubmitAccountDeletionRequestInput!
  ) {
    submitAccountDeletionRequest(input: $input) {
      ...AccountDeletionRequestRecord
    }
  }
  ${ACCOUNT_DELETION_REQUEST_RECORD_FRAGMENT}
`;

export const REVIEW_ACCOUNT_DELETION_REQUEST_MUTATION = gql`
  mutation ReviewAccountDeletionRequest(
    $input: ReviewAccountDeletionRequestInput!
  ) {
    reviewAccountDeletionRequest(input: $input) {
      ...AccountDeletionRequestRecord
    }
  }
  ${ACCOUNT_DELETION_REQUEST_RECORD_FRAGMENT}
`;
