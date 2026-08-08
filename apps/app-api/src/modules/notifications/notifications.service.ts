import { Inject, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { NotFoundError } from 'src/common/errors/app.error';
import { applyTenantFilter } from 'src/common/utils/tenant-filter';
import type { RepositoryFilter, RepositorySort } from 'src/libs/repository';
import { TOKENS } from 'src/types/tokens';
import type {
  MarkAllNotificationsAsReadResult,
  Notification,
  NotificationConnection,
  NotificationsFilterInput,
  NotificationType,
} from '../../graphql/generated/graphql';
import type { NotificationsRepository } from './repositories/notifications.repository';

const DEFAULT_MY_NOTIFICATIONS_SORT: RepositorySort<Notification> = {
  createdAt: 'DESC',
  id: 'DESC',
};

export interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  relatedEntityId?: string | null;
  organizationId?: string | null;
  createdAt?: Date;
}

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(TOKENS.NOTIFICATIONS_REPOSITORY)
    private readonly notificationsRepository: NotificationsRepository,
  ) {}

  async myNotifications(
    userId: string,
    filter?: NotificationsFilterInput | null,
    sort?: RepositorySort<Notification>,
    first?: number,
    after?: string,
    organizationId?: string | null,
  ): Promise<NotificationConnection> {
    const [connection, unreadCount] = await Promise.all([
      this.notificationsRepository
        .list(
          applyTenantFilter(
            buildNotificationsFilter(userId, filter),
            organizationId,
          ),
          {
            sort: sort ?? DEFAULT_MY_NOTIFICATIONS_SORT,
          },
        )
        .connection({ first, after }),
      this.notificationsRepository.count(
        applyTenantFilter({ userId, isRead: false }, organizationId),
      ),
    ]);

    return {
      ...connection,
      unreadCount,
    };
  }

  async markNotificationAsRead(
    id: string,
    userId: string,
    organizationId?: string | null,
  ): Promise<Notification> {
    const scoped = applyTenantFilter({ id, userId }, organizationId);
    const notification = await this.findNotificationForUserOrThrow(
      id,
      userId,
      organizationId,
    );

    if (!notification.isRead) {
      await this.notificationsRepository.update(scoped, { isRead: true });
    }

    return this.notificationsRepository.find(scoped);
  }

  async markAllNotificationsAsRead(
    userId: string,
    organizationId?: string | null,
  ): Promise<MarkAllNotificationsAsReadResult> {
    const unreadFilter: RepositoryFilter<Notification> = applyTenantFilter(
      {
        userId,
        isRead: false,
      },
      organizationId,
    );
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
      organizationId: input.organizationId ?? null,
      createdAt: input.createdAt ?? new Date(),
    });
  }

  private async findNotificationForUserOrThrow(
    id: string,
    userId: string,
    organizationId?: string | null,
  ): Promise<Notification> {
    const filter: RepositoryFilter<Notification> = applyTenantFilter(
      { id, userId },
      organizationId,
    );
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
