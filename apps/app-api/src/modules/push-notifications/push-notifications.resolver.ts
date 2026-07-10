import { ForbiddenException, UseGuards } from '@nestjs/common';
import { Mutation, Resolver } from '@nestjs/graphql';
import { CurrentTenant } from 'src/common/decorators/current-tenant.decorator';
import { ServiceValidatedArgs } from 'src/common/decorators/service-validated-args.decorator';
import {
  UserRole,
  type SendTestPushNotificationInput,
  type SendTestPushNotificationResult,
} from 'src/graphql/generated/graphql';
import { Roles } from '../auth/decorators/roles.decorator';
import { GraphqlAuthGuard } from '../auth/guards/graphql-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PushNotificationsService } from './push-notifications.service';

@Resolver()
export class PushNotificationsResolver {
  constructor(
    private readonly pushNotificationsService: PushNotificationsService,
  ) {}

  @Mutation('sendTestPushNotification')
  @UseGuards(GraphqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async sendTestPushNotification(
    @ServiceValidatedArgs('input') input: SendTestPushNotificationInput,
    @CurrentTenant() tenantId?: string,
  ): Promise<SendTestPushNotificationResult> {
    if (!tenantId) {
      throw new ForbiddenException('An active tenant is required.');
    }

    return this.pushNotificationsService.sendTestPush({
      title: input.title,
      body: input.body,
      userId: input.userId,
      organizationId: tenantId,
    });
  }
}
