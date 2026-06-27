import { Module } from '@nestjs/common';
import { AccountDeletionRequestsModule } from '../account-deletion-requests/account-deletion-requests.module';
import { AnnouncementsModule } from '../announcements/announcements.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { MembersModule } from '../members/members.module';
import { UsersModule } from '../users/users.module';
import { WaitlistModule } from '../waitlist/waitlist.module';
import { DashboardResolver } from './dashboard.resolver';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    AccountDeletionRequestsModule,
    AnnouncementsModule,
    OrganizationsModule,
    MembersModule,
    UsersModule,
    WaitlistModule,
  ],
  providers: [DashboardResolver, DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
