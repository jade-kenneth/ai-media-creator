import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import type {
  StorePurchaseResult,
  VerifyStorePurchaseInput,
} from '../../graphql/generated/graphql';
import { CurrentTenant } from 'src/common/decorators/current-tenant.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GraphqlAuthGuard } from '../auth/guards/graphql-auth.guard';
import type { AuthenticatedUser } from '../auth/types/auth-context';
import { StorePurchasesService } from './store-purchases.service';

@Resolver()
@UseGuards(GraphqlAuthGuard)
export class StorePurchasesResolver {
  constructor(private readonly storePurchases: StorePurchasesService) {}

  @Mutation('verifyStorePurchase')
  verifyStorePurchase(
    @Args('input') input: VerifyStorePurchaseInput,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTenant() tenantId?: string,
  ): Promise<StorePurchaseResult> {
    return this.storePurchases.verifyPurchase(input, user, tenantId);
  }
}
