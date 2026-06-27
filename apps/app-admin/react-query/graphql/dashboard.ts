import { gql } from 'graphql-request';

export const ADMIN_DASHBOARD_SUMMARY_QUERY = gql`
  query AdminDashboardSummary {
    adminDashboardSummary {
      totalMembers
      membersTrend {
        delta
        deltaPercent
        direction
      }
      latestAnnouncements {
        id
        title
        category
        publishedAt
      }
    }
  }
`;

export const SUPER_ADMIN_DASHBOARD_SUMMARY_QUERY = gql`
  query SuperAdminDashboardSummary {
    superAdminDashboardSummary {
      totalOrganizations
      activeOrganizations
      inactiveOrganizations
      totalAdminAccounts
      activeAdminAccounts
      inactiveAdminAccounts
      pendingDeletionRequests
      waitlistTotal
      waitlistByRole {
        role
        count
      }
      latestOrganizations {
        id
        name
        slug
        isActive
        createdAt
      }
      totalMembers
      membersTrend {
        delta
        deltaPercent
        direction
      }
    }
  }
`;
