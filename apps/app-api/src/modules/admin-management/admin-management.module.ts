import { Module } from '@nestjs/common';
import { OrganizationsModule } from '../organizations/organizations.module';
import { UsersModule } from '../users/users.module';
import { AdminManagementResolver } from './admin-management.resolver';
import { AdminManagementService } from './admin-management.service';

@Module({
  imports: [UsersModule, OrganizationsModule],
  providers: [AdminManagementService, AdminManagementResolver],
})
export class AdminManagementModule {}
