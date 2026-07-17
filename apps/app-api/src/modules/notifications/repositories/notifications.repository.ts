import { Connection, Types } from 'mongoose';
import type { Notification } from 'src/graphql/generated/graphql';
import { MongooseRepository } from 'src/libs/mongoose-repository';
import { Repository } from 'src/libs/repository';

export interface NotificationRecord extends Notification {
  organizationId?: string | null;
}

export type NotificationsRepository = Repository<NotificationRecord>;

export async function NotificationsRepositoryFactory(
  connection: Connection,
): Promise<NotificationsRepository> {
  return new MongooseRepository<NotificationRecord>(
    connection,
    'Notifications',
    {
      id: Types.ObjectId,
      userId: String,
      title: String,
      message: String,
      type: String,
      isRead: Boolean,
      relatedEntityId: String,
      organizationId: String,
      createdAt: Date,
    },
    [
      [{ userId: 1, createdAt: -1, id: -1 }],
      [{ userId: 1, isRead: 1 }],
      [{ relatedEntityId: 1 }],
      [{ organizationId: 1 }],
    ],
  );
}
