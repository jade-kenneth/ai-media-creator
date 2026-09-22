import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentTenant } from 'src/common/decorators/current-tenant.decorator';
import { ServiceValidatedArgs } from 'src/common/decorators/service-validated-args.decorator';
import type {
  Connection,
  RepositoryFilter,
  RepositorySort,
} from 'src/libs/repository';
import {
  UserRole,
  type AccountDeletionRequest,
  type ReviewAccountDeletionRequestInput,
  type SubmitAccountDeletionRequestInput,
} from '../../graphql/generated/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { GraphqlAuthGuard } from '../auth/guards/graphql-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types/auth-context';
import { AccountDeletionRequestsService } from './account-deletion-requests.service';
import type { AccountDeletionRequestRecord } from './repositories/account-deletion-requests.repository';

@Resolver('AccountDeletionRequest')
export class AccountDeletionRequestsResolver {
  constructor(
    private readonly accountDeletionRequestsService: AccountDeletionRequestsService,
  ) {}

  @Mutation('submitAccountDeletionRequest')
  async submitAccountDeletionRequest(
    @ServiceValidatedArgs('input') input: SubmitAccountDeletionRequestInput,
  ): Promise<AccountDeletionRequest> {
    return this.accountDeletionRequestsService.submit(input);
  }

  @Query('adminAccountDeletionRequests')
  @UseGuards(GraphqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async adminAccountDeletionRequests(
    @Args('filter') filter?: RepositoryFilter<AccountDeletionRequestRecord>,
    @Args('sort') sort?: RepositorySort<AccountDeletionRequestRecord>,
    @Args('first') first?: number,
    @Args('after') after?: string,
    @CurrentTenant() tenantId?: string,
  ): Promise<Connection<AccountDeletionRequest>> {
    return this.accountDeletionRequestsService.list(
      filter,
      sort,
      first,
      after,
      tenantId,
    );
  }

  @Query('adminAccountDeletionRequest')
  @UseGuards(GraphqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async adminAccountDeletionRequest(
    @Args('id') id: string,
    @CurrentTenant() tenantId?: string,
  ): Promise<AccountDeletionRequest | null> {
    return this.accountDeletionRequestsService.findById(id, tenantId);
  }

  @Mutation('reviewAccountDeletionRequest')
  @UseGuards(GraphqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async reviewAccountDeletionRequest(
    @ServiceValidatedArgs('input') input: ReviewAccountDeletionRequestInput,
    @CurrentUser() user?: AuthenticatedUser,
    @CurrentTenant() tenantId?: string,
  ): Promise<AccountDeletionRequest> {
    return this.accountDeletionRequestsService.review(
      input,
      user!.id,
      tenantId,
    );
  }
}
