import { gql } from 'graphql-request';

export const WAITLIST_ENTRY_RECORD_FRAGMENT = gql`
  fragment WaitlistEntryRecord on WaitlistEntry {
    id
    email
    role
    firstName
    lastName
    organizationName
    city
    mobile
    message
    createdAt
  }
`;

export const ADMIN_WAITLIST_ENTRIES_QUERY = gql`
  query AdminWaitlistEntries(
    $filter: WaitlistFilterInput
    $sort: WaitlistEntrySortInput
    $first: Int
    $after: Cursor
  ) {
    adminWaitlistEntries(
      filter: $filter
      sort: $sort
      first: $first
      after: $after
    ) {
      totalCount
      edges {
        cursor
        node {
          ...WaitlistEntryRecord
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  ${WAITLIST_ENTRY_RECORD_FRAGMENT}
`;

export const ADMIN_WAITLIST_STATS_QUERY = gql`
  query AdminWaitlistStats {
    adminWaitlistStats {
      total
      byRole {
        role
        count
      }
    }
  }
`;

export const JOIN_WAITLIST_MUTATION = gql`
  mutation JoinWaitlist($input: JoinWaitlistInput!) {
    joinWaitlist(input: $input) {
      ...WaitlistEntryRecord
    }
  }
  ${WAITLIST_ENTRY_RECORD_FRAGMENT}
`;

export const DELETE_WAITLIST_ENTRY_MUTATION = gql`
  mutation DeleteWaitlistEntry($id: ID!) {
    deleteWaitlistEntry(id: $id)
  }
`;
