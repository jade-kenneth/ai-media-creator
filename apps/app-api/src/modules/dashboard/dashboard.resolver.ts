import { UseGuards } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import {
  UserRole,
  type AdminDashboardSummary,
  type SuperAdminDashboardSummary,
} from '../../graphql/generated/graphql';
import { CurrentTenant } from 'src/common/decorators/current-tenant.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { GraphqlAuthGuard } from '../auth/guards/graphql-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { DashboardService } from './dashboard.service';

@Resolver()
export class DashboardResolver {
  constructor(private readonly dashboardService: DashboardService) {}

  @Query('adminDashboardSummary')
  @UseGuards(GraphqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async adminDashboardSummary(
    @CurrentTenant() tenantId?: string,
  ): Promise<AdminDashboardSummary> {
    return this.dashboardService.getAdminDashboardSummary(tenantId);
  }

  @Query('superAdminDashboardSummary')
  @UseGuards(GraphqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async superAdminDashboardSummary(): Promise<SuperAdminDashboardSummary> {
    return this.dashboardService.getSuperAdminDashboardSummary();
  }
}
