import { Inject, Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { NotFoundError } from 'src/common/errors/app.error';
import type { RepositoryFilter, RepositorySort } from 'src/libs/repository';
import { TOKENS } from 'src/types/tokens';
import {
  AnnouncementCategory,
  NotificationType,
  type Announcement,
  type MarkAllNotificationsAsReadResult,
  type Notification,
  type NotificationConnection,
  type NotificationsFilterInput,
} from '../../graphql/generated/graphql';
import { PushNotificationsService } from '../push-notifications/push-notifications.service';
import { UsersService } from '../users/users.service';
import type { NotificationsRepository } from './repositories/notifications.repository';

const DEFAULT_MY_NOTIFICATIONS_SORT: RepositorySort<Notification> = {
  createdAt: 'DESC',
  id: 'DESC',
};

interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  relatedEntityId?: string | null;
  createdAt?: Date;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @Inject(TOKENS.NOTIFICATIONS_REPOSITORY)
    private readonly notificationsRepository: NotificationsRepository,
    private readonly usersService: UsersService,
    private readonly pushNotificationsService: PushNotificationsService,
  ) {}

  async myNotifications(
    userId: string,
    filter?: NotificationsFilterInput | null,
    sort?: RepositorySort<Notification>,
    first?: number,
    after?: string,
  ): Promise<NotificationConnection> {
    const [connection, unreadCount] = await Promise.all([
      this.notificationsRepository
        .list(buildNotificationsFilter(userId, filter), {
          sort: sort ?? DEFAULT_MY_NOTIFICATIONS_SORT,
        })
        .connection({ first, after }),
      this.notificationsRepository.count({
        userId,
        isRead: false,
      }),
    ]);

    return {
      ...connection,
      unreadCount,
    };
  }

  async markNotificationAsRead(
    id: string,
    userId: string,
  ): Promise<Notification> {
    const notification = await this.findNotificationForUserOrThrow(id, userId);

    if (!notification.isRead) {
      await this.notificationsRepository.update(
        {
          id,
          userId,
        },
        {
          isRead: true,
        },
      );
    }

    return this.notificationsRepository.find({ id, userId });
  }

  async markAllNotificationsAsRead(
    userId: string,
  ): Promise<MarkAllNotificationsAsReadResult> {
    const unreadFilter: RepositoryFilter<Notification> = {
      userId,
      isRead: false,
    };
    const updatedCount = await this.notificationsRepository.count(unreadFilter);

    if (updatedCount === 0) {
      return { updatedCount: 0 };
    }

    await this.notificationsRepository.update(unreadFilter, {
      isRead: true,
    });

    return { updatedCount };
  }

  async createNotification(
    input: CreateNotificationInput,
  ): Promise<Notification> {
    return this.notificationsRepository.create({
      id: new Types.ObjectId().toHexString(),
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type,
      isRead: false,
      relatedEntityId: input.relatedEntityId ?? null,
      createdAt: input.createdAt ?? new Date(),
    });
  }

  /**
   * Example fan-out notification: when an announcement is published, create an
   * in-app notification for every active member of the organization and send a
   * matching push notification. Use this as the template for your own
   * domain-specific notifications.
   */
  async createAnnouncementPublishedNotifications(
    announcement: Pick<Announcement, 'id' | 'title' | 'category'>,
    organizationId?: string | null,
  ): Promise<number> {
    const recipientIds =
      await this.usersService.findActiveMemberUserIds(organizationId);

    if (recipientIds.length === 0) {
      return 0;
    }

    const createdAt = new Date();
    const type =
      announcement.category === AnnouncementCategory.EMERGENCY
        ? NotificationType.EMERGENCY_ANNOUNCEMENT
        : NotificationType.ANNOUNCEMENT;
    const title =
      type === NotificationType.EMERGENCY_ANNOUNCEMENT
        ? 'Emergency announcement'
        : 'New announcement';
    const message = `"${announcement.title}" is now available.`;

    await Promise.all(
      recipientIds.map((userId) =>
        this.createNotification({
          userId,
          title,
          message,
          type,
          relatedEntityId: announcement.id,
          createdAt,
        }),
      ),
    );

    try {
      await this.pushNotificationsService.sendAnnouncementPublished({
        userIds: recipientIds,
        title,
        body: message,
        announcementId: announcement.id,
      });
    } catch (error) {
      const reason =
        error instanceof Error
          ? error.message
          : 'Unknown push notification error.';

      this.logger.warn(
        `Push notifications failed for announcement ${announcement.id}: ${reason}`,
      );
    }

    return recipientIds.length;
  }

  private async findNotificationForUserOrThrow(
    id: string,
    userId: string,
  ): Promise<Notification> {
    const filter: RepositoryFilter<Notification> = { id, userId };
    const exists = await this.notificationsRepository.exists(filter);

    if (!exists) {
      throw new NotFoundError('Notification not found.');
    }

    return this.notificationsRepository.find(filter);
  }
}

function buildNotificationsFilter(
  userId: string,
  filter?: NotificationsFilterInput | null,
): RepositoryFilter<Notification> {
  return {
    userId,
    ...(filter?.unreadOnly === true ? { isRead: false } : {}),
  };
}
