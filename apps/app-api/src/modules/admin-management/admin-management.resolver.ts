import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ServiceValidatedArgs } from 'src/common/decorators/service-validated-args.decorator';
import type {
  AdminAccount,
  CreateAdminAccountInput,
  UpdateAdminAccountInput,
} from '../../graphql/generated/graphql';
import { UserRole } from '../../graphql/generated/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { GraphqlAuthGuard } from '../auth/guards/graphql-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types/auth-context';
import { AdminManagementService } from './admin-management.service';

@Resolver('AdminAccount')
export class AdminManagementResolver {
  constructor(
    private readonly adminManagementService: AdminManagementService,
  ) {}

  @Query('adminAccounts')
  @UseGuards(GraphqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async adminAccounts(): Promise<AdminAccount[]> {
    return this.adminManagementService.findAll();
  }

  @Mutation('createAdminAccount')
  @UseGuards(GraphqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async createAdminAccount(
    @ServiceValidatedArgs('input') input: CreateAdminAccountInput,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<AdminAccount> {
    return this.adminManagementService.createAdminAccount(
      input,
      currentUser.id,
    );
  }

  @Mutation('updateAdminAccount')
  @UseGuards(GraphqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async updateAdminAccount(
    @Args('id') id: string,
    @ServiceValidatedArgs('input') input: UpdateAdminAccountInput,
  ): Promise<AdminAccount> {
    return this.adminManagementService.updateAdminAccount(id, input);
  }

  @Mutation('deactivateAdminAccount')
  @UseGuards(GraphqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async deactivateAdminAccount(@Args('id') id: string): Promise<AdminAccount> {
    return this.adminManagementService.deactivateAdminAccount(id);
  }

  @Mutation('reactivateAdminAccount')
  @UseGuards(GraphqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async reactivateAdminAccount(@Args('id') id: string): Promise<AdminAccount> {
    return this.adminManagementService.reactivateAdminAccount(id);
  }
}
