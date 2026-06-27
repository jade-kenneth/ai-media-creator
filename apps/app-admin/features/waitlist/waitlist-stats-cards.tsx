import { Building2, Handshake, UserRound, Users } from 'lucide-react';

import { StatCard, StatsCardsSkeleton } from '@/components/core';
import { WaitlistRole } from '@/react-query/generated__types';
import { formatCount } from '@/utils/date';

type RoleCount = {
  role: WaitlistRole;
  count: number;
};

type WaitlistStatsCardsProps = {
  isLoading: boolean;
  total: number;
  byRole: RoleCount[];
};

function getRoleCount(byRole: RoleCount[], role: WaitlistRole) {
  return byRole.find((item) => item.role === role)?.count ?? 0;
}

export function WaitlistStatsCards({
  isLoading,
  total,
  byRole,
}: WaitlistStatsCardsProps) {
  if (isLoading) {
    return <StatsCardsSkeleton count={4} />;
  }

  const memberCount = getRoleCount(byRole, WaitlistRole.Member);
  const officialCount = getRoleCount(byRole, WaitlistRole.OrganizationOfficial);
  const lguAndOtherCount =
    getRoleCount(byRole, WaitlistRole.LguStaff) +
    getRoleCount(byRole, WaitlistRole.Other);

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        icon={Users}
        label="Total Signups"
        value={formatCount(total)}
        iconClassName="text-primary"
        caption="All early-access emails collected from the landing page."
      />
      <StatCard
        icon={UserRound}
        label="Members"
        value={formatCount(memberCount)}
        iconClassName="text-emerald-600 dark:text-emerald-400"
        caption="Members who want launch updates for their organization."
      />
      <StatCard
        icon={Building2}
        label="Officials"
        value={formatCount(officialCount)}
        iconClassName="text-[#171B5A]"
        caption="Organization officials interested in operational onboarding."
      />
      <StatCard
        icon={Handshake}
        label="Org Staff / Other"
        value={formatCount(lguAndOtherCount)}
        iconClassName="text-amber-600 dark:text-amber-400"
        caption="Signups from Org support staff and other stakeholders."
      />
    </section>
  );
}
