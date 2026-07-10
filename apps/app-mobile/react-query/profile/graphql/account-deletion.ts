import { gql } from 'graphql-request';

export const SUBMIT_ACCOUNT_DELETION_REQUEST_MUTATION = gql`
  mutation SubmitAccountDeletionRequest(
    $input: SubmitAccountDeletionRequestInput!
  ) {
    submitAccountDeletionRequest(input: $input) {
      id
      status
      createdAt
    }
  }
`;
