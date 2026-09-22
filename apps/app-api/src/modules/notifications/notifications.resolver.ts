import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import type {
  MarkAllNotificationsAsReadResult,
  Notification,
  NotificationConnection,
  NotificationsFilterInput,
} from '../../graphql/generated/graphql';
import { CurrentTenant } from 'src/common/decorators/current-tenant.decorator';
import type { RepositorySort } from 'src/libs/repository';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GraphqlAuthGuard } from '../auth/guards/graphql-auth.guard';
import type { AuthenticatedUser } from '../auth/types/auth-context';
import { NotificationsService } from './notifications.service';

@Resolver('Notification')
export class NotificationsResolver {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Query('myNotifications')
  @UseGuards(GraphqlAuthGuard)
  async myNotifications(
    @Args('filter') filter?: NotificationsFilterInput,
    @Args('sort') sort?: RepositorySort<Notification>,
    @Args('first') first?: number,
    @Args('after') after?: string,
    @CurrentUser() user?: AuthenticatedUser,
    @CurrentTenant() tenantId?: string,
  ): Promise<NotificationConnection> {
    return this.notificationsService.myNotifications(
      user!.id,
      filter,
      sort,
      first,
      after,
      tenantId,
    );
  }

  @Mutation('markNotificationAsRead')
  @UseGuards(GraphqlAuthGuard)
  async markNotificationAsRead(
    @Args('id') id: string,
    @CurrentUser() user?: AuthenticatedUser,
    @CurrentTenant() tenantId?: string,
  ): Promise<Notification> {
    return this.notificationsService.markNotificationAsRead(
      id,
      user!.id,
      tenantId,
    );
  }

  @Mutation('markAllNotificationsAsRead')
  @UseGuards(GraphqlAuthGuard)
  async markAllNotificationsAsRead(
    @CurrentUser() user?: AuthenticatedUser,
    @CurrentTenant() tenantId?: string,
  ): Promise<MarkAllNotificationsAsReadResult> {
    return this.notificationsService.markAllNotificationsAsRead(
      user!.id,
      tenantId,
    );
  }
}
