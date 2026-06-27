import { gql } from "graphql-request";

export const NOTIFICATION_RECORD_FRAGMENT = gql`
  fragment NotificationRecord on Notification {
    id
    userId
    title
    message
    type
    isRead
    relatedEntityId
    createdAt
  }
`;

export const MY_NOTIFICATIONS_QUERY = gql`
  query MyNotifications(
    $filter: NotificationsFilterInput
    $sort: NotificationSortInput
    $first: Int
    $after: Cursor
  ) {
    myNotifications(filter: $filter, sort: $sort, first: $first, after: $after) {
      totalCount
      unreadCount
      edges {
        cursor
        node {
          ...NotificationRecord
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  ${NOTIFICATION_RECORD_FRAGMENT}
`;

export const MARK_NOTIFICATION_AS_READ_MUTATION = gql`
  mutation MarkNotificationAsRead($id: ID!) {
    markNotificationAsRead(id: $id) {
      ...NotificationRecord
    }
  }
  ${NOTIFICATION_RECORD_FRAGMENT}
`;

export const MARK_ALL_NOTIFICATIONS_AS_READ_MUTATION = gql`
  mutation MarkAllNotificationsAsRead {
    markAllNotificationsAsRead {
      updatedCount
    }
  }
`;
