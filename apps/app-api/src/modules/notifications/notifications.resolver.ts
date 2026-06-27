import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  UserRole,
  type MarkAllNotificationsAsReadResult,
  type Notification,
  type NotificationConnection,
  type NotificationsFilterInput,
} from '../../graphql/generated/graphql';
import type { RepositorySort } from 'src/libs/repository';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { GraphqlAuthGuard } from '../auth/guards/graphql-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types/auth-context';
import { NotificationsService } from './notifications.service';

@Resolver('Notification')
export class NotificationsResolver {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Query('myNotifications')
  @UseGuards(GraphqlAuthGuard, RolesGuard)
  @Roles(UserRole.MEMBER)
  async myNotifications(
    @Args('filter') filter?: NotificationsFilterInput,
    @Args('sort') sort?: RepositorySort<Notification>,
    @Args('first') first?: number,
    @Args('after') after?: string,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<NotificationConnection> {
    return this.notificationsService.myNotifications(
      user!.id,
      filter,
      sort,
      first,
      after,
    );
  }

  @Mutation('markNotificationAsRead')
  @UseGuards(GraphqlAuthGuard, RolesGuard)
  @Roles(UserRole.MEMBER)
  async markNotificationAsRead(
    @Args('id') id: string,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<Notification> {
    return this.notificationsService.markNotificationAsRead(id, user!.id);
  }

  @Mutation('markAllNotificationsAsRead')
  @UseGuards(GraphqlAuthGuard, RolesGuard)
  @Roles(UserRole.MEMBER)
  async markAllNotificationsAsRead(
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<MarkAllNotificationsAsReadResult> {
    return this.notificationsService.markAllNotificationsAsRead(user!.id);
  }
}
