import { UseGuards } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { CurrentTenant } from 'src/common/decorators/current-tenant.decorator';
import type { CreditSummary } from 'src/graphql/generated/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GraphqlAuthGuard } from '../auth/guards/graphql-auth.guard';
import type { AuthenticatedUser } from '../auth/types/auth-context';
import { CreditsService } from './credits.service';

@Resolver()
export class CreditsResolver {
  constructor(private readonly creditsService: CreditsService) {}

  @Query('myCredits')
  @UseGuards(GraphqlAuthGuard)
  myCredits(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTenant() tenantId?: string,
  ): Promise<CreditSummary> {
    return this.creditsService.summary({
      ownerId: user.id,
      organizationId: tenantId ?? null,
    });
  }
}
