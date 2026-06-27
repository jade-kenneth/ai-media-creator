'use client';

import { format } from 'date-fns';
import { Building2, ListChecks, UserCog, UserX, Users } from 'lucide-react';

import { StatCard, StatsCardsSkeleton } from '@/components/core';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useSuperAdminDashboardSummaryQuery } from '@/react-query/dashboard/dashboard-operations';
import type { SuperAdminDashboardSummaryQuery } from '@/react-query/generated__types';
import { explainGraphqlErrorMessage } from '@/react-query/graphql-error';
import { formatCount } from '@/utils/date';

type SuperAdminSummary =
  SuperAdminDashboardSummaryQuery['superAdminDashboardSummary'];

/**
 * Example super-admin (platform) dashboard. It reads the simplified
 * `superAdminDashboardSummary` query and renders platform-wide KPIs:
 * organizations, admin accounts, deletion requests, waitlist and members.
 */
export function SuperAdminDashboardPageView() {
  const summaryQuery = useSuperAdminDashboardSummaryQuery();

  if (summaryQuery.isLoading) {
    return <StatsCardsSkeleton />;
  }

  if (summaryQuery.isError || !summaryQuery.data) {
    return (
      <Card className="admin-surface rounded-2xl border-border/60">
        <CardHeader className="border-b border-border/60 pb-5">
          <CardTitle>Dashboard unavailable</CardTitle>
          <CardDescription>
            Platform metrics could not be loaded right now.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-muted-foreground">
            {explainGraphqlErrorMessage(summaryQuery.error)}
          </p>
          <Button onClick={() => summaryQuery.refetch()} size="lg">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const summary: SuperAdminSummary =
    summaryQuery.data.superAdminDashboardSummary;

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          icon={Building2}
          label="Organizations"
          value={formatCount(summary.totalOrganizations)}
          iconClassName="text-primary"
          caption={`${formatCount(summary.activeOrganizations)} active · ${formatCount(
            summary.inactiveOrganizations,
          )} inactive`}
        />
        <StatCard
          icon={UserCog}
          label="Admin accounts"
          value={formatCount(summary.totalAdminAccounts)}
          iconClassName="text-primary"
          caption={`${formatCount(summary.activeAdminAccounts)} active · ${formatCount(
            summary.inactiveAdminAccounts,
          )} inactive`}
        />
        <StatCard
          icon={Users}
          label="Total members"
          value={formatCount(summary.totalMembers)}
          iconClassName="text-primary"
          caption={`${summary.membersTrend.deltaPercent}% vs previous 30 days`}
        />
        <StatCard
          icon={UserX}
          label="Pending deletions"
          value={formatCount(summary.pendingDeletionRequests)}
          iconClassName="text-destructive"
          caption="Account deletion requests awaiting review."
        />
        <StatCard
          icon={ListChecks}
          label="Waitlist signups"
          value={formatCount(summary.waitlistTotal)}
          iconClassName="text-primary"
          caption="Total leads captured via the waitlist form."
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card className="admin-surface rounded-2xl border-border/60">
          <CardHeader className="border-b border-border/60 pb-5">
            <CardTitle>Latest organizations</CardTitle>
            <CardDescription>Most recently created tenants.</CardDescription>
          </CardHeader>
          <CardContent className="px-5 py-5">
            {summary.latestOrganizations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No organizations yet.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-border/60">
                {summary.latestOrganizations.map((organization) => (
                  <li
                    key={organization.id}
                    className="flex items-center justify-between gap-4 py-3"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {organization.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {organization.slug}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          organization.isActive ? 'default' : 'secondary'
                        }
                      >
                        {organization.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(organization.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="admin-surface rounded-2xl border-border/60">
          <CardHeader className="border-b border-border/60 pb-5">
            <CardTitle>Waitlist by role</CardTitle>
            <CardDescription>Signups grouped by selected role.</CardDescription>
          </CardHeader>
          <CardContent className="px-5 py-5">
            {summary.waitlistByRole.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No waitlist signups yet.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-border/60">
                {summary.waitlistByRole.map((entry) => (
                  <li
                    key={entry.role}
                    className="flex items-center justify-between gap-4 py-3"
                  >
                    <span className="text-sm font-medium capitalize">
                      {entry.role.toLowerCase().replaceAll('_', ' ')}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatCount(entry.count)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
