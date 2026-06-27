import { Injectable } from '@nestjs/common';
import { subDays } from 'date-fns';
import {
  AccountDeletionRequestStatus,
  type AdminDashboardSummary,
  type KpiTrend,
  type SuperAdminDashboardSummary,
} from '../../graphql/generated/graphql';
import { AccountDeletionRequestsService } from '../account-deletion-requests/account-deletion-requests.service';
import { AnnouncementsService } from '../announcements/announcements.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { MembersService } from '../members/members.service';
import { UsersService } from '../users/users.service';
import { WaitlistService } from '../waitlist/waitlist.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly accountDeletionRequestsService: AccountDeletionRequestsService,
    private readonly announcementsService: AnnouncementsService,
    private readonly organizationsService: OrganizationsService,
    private readonly membersService: MembersService,
    private readonly usersService: UsersService,
    private readonly waitlistService: WaitlistService,
  ) {}

  async getAdminDashboardSummary(
    organizationId?: string | null,
  ): Promise<AdminDashboardSummary> {
    const now = new Date();
    const currentPeriodStart = subDays(now, 30);
    const previousPeriodStart = subDays(now, 60);
    const previousPeriodEnd = currentPeriodStart;

    const [
      totalMembers,
      latestAnnouncements,
      membersLastPeriod,
      membersPreviousPeriod,
    ] = await Promise.all([
      this.membersService.count(organizationId),
      this.announcementsService.getLatestPublishedAnnouncements(
        undefined,
        organizationId,
      ),
      this.membersService.countCreatedBetween(
        currentPeriodStart,
        now,
        organizationId,
      ),
      this.membersService.countCreatedBetween(
        previousPeriodStart,
        previousPeriodEnd,
        organizationId,
      ),
    ]);

    return {
      totalMembers,
      latestAnnouncements,
      membersTrend: computeTrend(membersLastPeriod, membersPreviousPeriod),
    };
  }

  async getSuperAdminDashboardSummary(): Promise<SuperAdminDashboardSummary> {
    const [
      adminSummary,
      totalOrganizations,
      activeOrganizations,
      totalAdminAccounts,
      activeAdminAccounts,
      pendingDeletionRequests,
      waitlistStats,
      latestOrganizations,
    ] = await Promise.all([
      this.getAdminDashboardSummary(),
      this.organizationsService.count(),
      this.organizationsService.count({ isActive: true }),
      this.usersService.countAdminAccounts(),
      this.usersService.countAdminAccounts(true),
      this.accountDeletionRequestsService.count({
        status: {
          equal: AccountDeletionRequestStatus.PENDING,
        },
      }),
      this.waitlistService.stats(),
      this.organizationsService.findLatest(5),
    ]);

    return {
      totalOrganizations,
      activeOrganizations,
      inactiveOrganizations: Math.max(
        totalOrganizations - activeOrganizations,
        0,
      ),
      totalAdminAccounts,
      activeAdminAccounts,
      inactiveAdminAccounts: Math.max(
        totalAdminAccounts - activeAdminAccounts,
        0,
      ),
      pendingDeletionRequests,
      waitlistTotal: waitlistStats.total,
      waitlistByRole: waitlistStats.byRole,
      latestOrganizations,
      totalMembers: adminSummary.totalMembers,
      membersTrend: adminSummary.membersTrend,
    };
  }
}

function computeTrend(current: number, previous: number): KpiTrend {
  const delta = current - previous;
  const deltaPercent = previous === 0 ? 0 : (delta / previous) * 100;

  return {
    delta,
    deltaPercent: Math.round(deltaPercent * 10) / 10,
    direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'neutral',
  };
}
