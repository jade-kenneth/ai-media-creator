import { gql } from 'graphql-request';

export const MY_CREDITS_QUERY = gql`
  query MyCredits {
    myCredits {
      balance
      held
      recentUsage {
        id
        label
        projectTitle
        amount
        kind
        createdAt
      }
    }
  }
`;
