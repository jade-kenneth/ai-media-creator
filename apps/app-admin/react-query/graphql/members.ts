import { gql } from 'graphql-request';

export const REGISTRATION_REVIEW_FRAGMENT = gql`
  fragment RegistrationReviewRecord on RegistrationReview {
    reviewedBy
    reviewedAt
    rejectionReason
    rejectionNote
    reviewedByUser {
      id
      email
      role
      isActive
    }
  }
`;

export const MEMBER_ACCOUNT_REVIEW_FRAGMENT = gql`
  fragment MemberAccountReview on User {
    id
    email
    role
    isActive
    registrationStatus
    registrationReview {
      ...RegistrationReviewRecord
    }
  }
  ${REGISTRATION_REVIEW_FRAGMENT}
`;

export const MEMBER_DIRECTORY_RECORD_FRAGMENT = gql`
  fragment MemberDirectoryRecord on MemberProfile {
    id
    userId
    firstName
    lastName
    middleName
    fullName
    birthdate
    gender
    address
    purok
    contactNumber
    createdAt
    updatedAt
    user {
      ...MemberAccountReview
    }
  }
  ${MEMBER_ACCOUNT_REVIEW_FRAGMENT}
`;

export const ADMIN_MEMBERS_QUERY = gql`
  query AdminMembers(
    $filter: AdminMembersActiveFilterInput
    $sort: AdminMembersSortInput
    $first: Int
    $after: Cursor
  ) {
    adminMembers(filter: $filter, sort: $sort, first: $first, after: $after) {
      totalCount
      edges {
        cursor
        node {
          ...MemberDirectoryRecord
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  ${MEMBER_DIRECTORY_RECORD_FRAGMENT}
`;

export const ADMIN_MEMBERS_COUNT_QUERY = gql`
  query AdminMembersCount($filter: AdminMembersActiveFilterInput) {
    adminMembers(filter: $filter) {
      totalCount
    }
  }
`;

export const SEARCH_MEMBERS_QUERY = gql`
  query SearchByMembers($search: String!, $first: Int) {
    searchByMembers(search: $search, first: $first)
  }
`;

export const APPROVE_MEMBER_MUTATION = gql`
  mutation ApproveMember($userId: ID!) {
    approveMember(userId: $userId) {
      ...MemberAccountReview
    }
  }
  ${MEMBER_ACCOUNT_REVIEW_FRAGMENT}
`;

export const REJECT_MEMBER_MUTATION = gql`
  mutation RejectMember(
    $userId: ID!
    $rejectionReason: RegistrationRejectionReason!
    $rejectionNote: String
  ) {
    rejectMember(
      userId: $userId
      rejectionReason: $rejectionReason
      rejectionNote: $rejectionNote
    ) {
      ...MemberAccountReview
    }
  }
  ${MEMBER_ACCOUNT_REVIEW_FRAGMENT}
`;

export const RETRIGGER_APPROVAL_NOTIFICATION_MUTATION = gql`
  mutation RetriggerApprovalNotification($userId: ID!) {
    retriggerApprovalNotification(userId: $userId)
  }
`;

export const ADMIN_MEMBER_QUERY = gql`
  query AdminMember($id: ID!) {
    adminMember(id: $id) {
      ...MemberDirectoryRecord
    }
  }
  ${MEMBER_DIRECTORY_RECORD_FRAGMENT}
`;
