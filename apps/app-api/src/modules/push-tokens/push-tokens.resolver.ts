import { UseGuards } from '@nestjs/common';
import { Mutation, Resolver } from '@nestjs/graphql';
import { ServiceValidatedArgs } from 'src/common/decorators/service-validated-args.decorator';
import type {
  RegisterPushTokenInput,
  UnregisterPushTokenInput,
} from 'src/graphql/generated/graphql';
import { CurrentTenant } from 'src/common/decorators/current-tenant.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GraphqlAuthGuard } from '../auth/guards/graphql-auth.guard';
import type { AuthenticatedUser } from '../auth/types/auth-context';
import { PushTokensService } from './push-tokens.service';

@Resolver()
export class PushTokensResolver {
  constructor(private readonly pushTokensService: PushTokensService) {}

  @Mutation('registerPushToken')
  @UseGuards(GraphqlAuthGuard)
  registerPushToken(
    @ServiceValidatedArgs('input') input: RegisterPushTokenInput,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTenant() tenantId?: string,
  ): Promise<boolean> {
    return this.pushTokensService.registerPushToken(input, user.id, tenantId);
  }

  @Mutation('unregisterPushToken')
  @UseGuards(GraphqlAuthGuard)
  unregisterPushToken(
    @ServiceValidatedArgs('input') input: UnregisterPushTokenInput,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<boolean> {
    return this.pushTokensService.unregisterPushToken(input, user.id);
  }
}
