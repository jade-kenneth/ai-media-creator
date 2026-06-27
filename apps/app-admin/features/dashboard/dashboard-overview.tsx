'use client';

import { Megaphone, TrendingDown, TrendingUp, Users } from 'lucide-react';

import { StatCard, StatsCardsSkeleton } from '@/components/core';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAdminDashboardSummaryQuery } from '@/react-query/dashboard/dashboard-operations';
import { explainGraphqlErrorMessage } from '@/react-query/graphql-error';
import { formatAnnouncementTime, formatCount } from '@/utils/date';

/**
 * Example admin dashboard. It reads the simplified `adminDashboardSummary`
 * query (members count + 30-day trend + latest announcements) and renders a
 * couple of KPI cards plus a recent-activity list. Extend this with your own
 * metrics as you add modules to the API.
 */
export function DashboardOverview() {
  const summaryQuery = useAdminDashboardSummaryQuery();

  if (summaryQuery.isLoading) {
    return <StatsCardsSkeleton />;
  }

  if (summaryQuery.isError || !summaryQuery.data) {
    return (
      <Card className="admin-surface rounded-2xl border-border/60">
        <CardHeader className="border-b border-border/60 pb-5">
          <CardTitle>Dashboard unavailable</CardTitle>
          <CardDescription>
            Metrics could not be loaded right now.
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

  const summary = summaryQuery.data.adminDashboardSummary;
  const trend = summary.membersTrend;
  const TrendIcon = trend.direction === 'down' ? TrendingDown : TrendingUp;

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          icon={Users}
          label="Total members"
          value={formatCount(summary.totalMembers)}
          iconClassName="text-primary"
          caption="All members across your organization."
        />
        <StatCard
          icon={TrendIcon}
          label="Members (30-day trend)"
          value={`${trend.delta >= 0 ? '+' : ''}${formatCount(trend.delta)}`}
          iconClassName={
            trend.direction === 'down' ? 'text-destructive' : 'text-emerald-500'
          }
          caption={`${trend.deltaPercent}% vs the previous 30 days.`}
        />
      </section>

      <Card className="admin-surface rounded-2xl border-border/60">
        <CardHeader className="border-b border-border/60 pb-5">
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="size-5 text-primary" />
            Latest announcements
          </CardTitle>
          <CardDescription>
            The most recent published announcements.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-5 py-5">
          {summary.latestAnnouncements.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No announcements published yet.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-border/60">
              {summary.latestAnnouncements.map((announcement) => (
                <li
                  key={announcement.id}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <span className="text-sm font-medium">
                    {announcement.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatAnnouncementTime(announcement.publishedAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
