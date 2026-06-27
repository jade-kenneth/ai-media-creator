import { gql } from 'graphql-request';

export const ANNOUNCEMENT_FRAGMENT = gql`
  fragment AnnouncementRecord on Announcement {
    id
    title
    content
    category
    coverImageUrl
    isPinned
    isPublished
    publishedAt
    createdAt
    updatedAt
  }
`;

export const ANNOUNCEMENTS_QUERY = gql`
  query Announcements(
    $filter: AnnouncementsFilterInput
    $sort: AnnouncementSortInput
    $first: Int
    $after: Cursor
  ) {
    announcements(filter: $filter, sort: $sort, first: $first, after: $after) {
      totalCount
      edges {
        cursor
        node {
          ...AnnouncementRecord
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  ${ANNOUNCEMENT_FRAGMENT}
`;

export const ANNOUNCEMENT_QUERY = gql`
  query Announcement($id: ID!) {
    announcement(id: $id) {
      ...AnnouncementRecord
    }
  }
  ${ANNOUNCEMENT_FRAGMENT}
`;
