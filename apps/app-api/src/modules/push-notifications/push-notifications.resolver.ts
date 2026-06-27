import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
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
    @Args('input') input: SendTestPushNotificationInput,
  ): Promise<SendTestPushNotificationResult> {
    return this.pushNotificationsService.sendTestPush({
      title: input.title,
      body: input.body,
      userId: input.userId,
    });
  }
}
