import type { GraphqlRequestOptions } from '@/react-query/graphql-client';

import { client } from '@/react-query/graphql-client';
import { defineQuery } from '@/react-query/utils';

import {
  AdminDashboardSummaryQuery,
  AdminDashboardSummaryQueryVariables,
  SuperAdminDashboardSummaryQuery,
  SuperAdminDashboardSummaryQueryVariables,
} from '../generated__types';
import {
  ADMIN_DASHBOARD_SUMMARY_QUERY,
  SUPER_ADMIN_DASHBOARD_SUMMARY_QUERY,
} from '../graphql/dashboard';

export const dashboardQueryKeys = {
  summary: ['dashboard', 'summary'] as const,
  superAdminSummary: ['dashboard', 'super-admin-summary'] as const,
};

export function adminDashboardSummaryRequest(
  variables?: AdminDashboardSummaryQueryVariables,
  options?: GraphqlRequestOptions,
) {
  return client.request<
    AdminDashboardSummaryQuery,
    AdminDashboardSummaryQueryVariables
  >(ADMIN_DASHBOARD_SUMMARY_QUERY, variables, options);
}

export function superAdminDashboardSummaryRequest(
  variables?: SuperAdminDashboardSummaryQueryVariables,
  options?: GraphqlRequestOptions,
) {
  return client.request<
    SuperAdminDashboardSummaryQuery,
    SuperAdminDashboardSummaryQueryVariables
  >(SUPER_ADMIN_DASHBOARD_SUMMARY_QUERY, variables, options);
}

export const useAdminDashboardSummaryQuery =
  defineQuery<AdminDashboardSummaryQuery>({
    queryFn: async () => {
      const res = await adminDashboardSummaryRequest();

      if (!res.ok) {
        const err = new Error();
        err.name = res.error.name;
        err.message = res.error.message;
        throw err;
      }

      return res.data;
    },
    queryKey: dashboardQueryKeys.summary,
  });

export const useSuperAdminDashboardSummaryQuery =
  defineQuery<SuperAdminDashboardSummaryQuery>({
    queryFn: async () => {
      const res = await superAdminDashboardSummaryRequest();

      if (!res.ok) {
        const err = new Error();
        err.name = res.error.name;
        err.message = res.error.message;
        throw err;
      }

      return res.data;
    },
    queryKey: dashboardQueryKeys.superAdminSummary,
  });
