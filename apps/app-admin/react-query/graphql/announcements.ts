import { gql } from 'graphql-request';

export const ANNOUNCEMENT_RECORD_FRAGMENT = gql`
  fragment Announcement on Announcement {
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

export const ADMIN_ANNOUNCEMENTS_QUERY = gql`
  query AdminAnnouncements(
    $filter: AdminAnnouncementsFilterInput
    $sort: AnnouncementSortInput
    $first: Int
    $after: Cursor
  ) {
    adminAnnouncements(
      filter: $filter
      sort: $sort
      first: $first
      after: $after
    ) {
      totalCount
      edges {
        cursor
        node {
          ...Announcement
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  ${ANNOUNCEMENT_RECORD_FRAGMENT}
`;

export const SEARCH_ADMIN_ANNOUNCEMENTS_QUERY = gql`
  query SearchByAdminAnnouncements($search: String!, $first: Int) {
    searchByAdminAnnouncements(search: $search, first: $first) {
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
  }
`;

export const CREATE_ANNOUNCEMENT_MUTATION = gql`
  mutation CreateAnnouncement($input: CreateAnnouncementInput!) {
    createAnnouncement(input: $input) {
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
  }
`;

export const UPDATE_ANNOUNCEMENT_MUTATION = gql`
  mutation UpdateAnnouncement($id: ID!, $input: UpdateAnnouncementInput!) {
    updateAnnouncement(id: $id, input: $input) {
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
  }
`;

export const DELETE_ANNOUNCEMENT_MUTATION = gql`
  mutation DeleteAnnouncement($id: ID!) {
    deleteAnnouncement(id: $id)
  }
`;

export const PUBLISH_ANNOUNCEMENT_MUTATION = gql`
  mutation PublishAnnouncement($id: ID!, $isPublished: Boolean!) {
    publishAnnouncement(id: $id, isPublished: $isPublished) {
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
  }
`;

export const PIN_ANNOUNCEMENT_MUTATION = gql`
  mutation PinAnnouncement($id: ID!, $isPinned: Boolean!) {
    pinAnnouncement(id: $id, isPinned: $isPinned) {
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
  }
`;
