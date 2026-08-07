import { NotificationType } from 'src/graphql/generated/graphql';
import type {
  NotificationRecord,
  NotificationsRepository,
} from './repositories/notifications.repository';
import { NotificationsService } from './notifications.service';

const TENANT_A = 'org-a';
const TENANT_B = 'org-b';

function notification(
  overrides: Partial<NotificationRecord> = {},
): NotificationRecord {
  return {
    id: 'notification-1',
    userId: 'user-1',
    title: 'Title',
    message: 'Message',
    type: NotificationType.SYSTEM,
    isRead: false,
    relatedEntityId: null,
    organizationId: TENANT_A,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  } as NotificationRecord;
}

function fakeRepository(records: NotificationRecord[]) {
  const matches = (
    record: NotificationRecord,
    filter: Record<string, unknown> = {},
  ) =>
    Object.entries(filter).every(
      ([key, value]) => record[key as keyof NotificationRecord] === value,
    );

  const find = (filter?: Record<string, unknown>) =>
    records.filter((record) => matches(record, filter));

  return {
    list: jest.fn((filter?: Record<string, unknown>) => ({
      connection: jest.fn(async () => ({
        totalCount: find(filter).length,
        edges: find(filter).map((node) => ({ cursor: node.id, node })),
        pageInfo: { endCursor: null, hasNextPage: false },
      })),
    })),
    exists: jest.fn(
      async (filter?: Record<string, unknown>) => find(filter).length > 0,
    ),
    find: jest.fn(async (filter?: Record<string, unknown>) => find(filter)[0]),
    count: jest.fn(
      async (filter?: Record<string, unknown>) => find(filter).length,
    ),
    update: jest.fn(async () => undefined),
    create: jest.fn(async () => records[0]),
  };
}

describe('NotificationsService tenant isolation', () => {
  const records = [
    notification({ id: 'n-a', organizationId: TENANT_A }),
    notification({ id: 'n-b', organizationId: TENANT_B }),
  ];

  let repository: ReturnType<typeof fakeRepository>;
  let service: NotificationsService;

  beforeEach(() => {
    repository = fakeRepository(records);
    service = new NotificationsService(
      repository as unknown as NotificationsRepository,
    );
  });

  it("treats another tenant's notification as not-found", async () => {
    await expect(
      service.markNotificationAsRead('n-b', 'user-1', TENANT_A),
    ).rejects.toThrow('Notification not found.');
    expect(repository.update).not.toHaveBeenCalled();
  });

  it("still marks the caller's own notification as read", async () => {
    await expect(
      service.markNotificationAsRead('n-a', 'user-1', TENANT_A),
    ).resolves.toMatchObject({ id: 'n-a' });
    expect(repository.update).toHaveBeenCalledWith(
      { id: 'n-a', userId: 'user-1', organizationId: TENANT_A },
      { isRead: true },
    );
  });

  it('composes tenant scope into the list and unread count', async () => {
    await service.myNotifications(
      'user-1',
      null,
      undefined,
      undefined,
      undefined,
      TENANT_A,
    );

    expect(repository.list).toHaveBeenCalledWith(
      { userId: 'user-1', organizationId: TENANT_A },
      expect.anything(),
    );
    expect(repository.count).toHaveBeenCalledWith({
      userId: 'user-1',
      isRead: false,
      organizationId: TENANT_A,
    });
  });

  it('scopes the bulk mark-all so it cannot reach another tenant', async () => {
    await service.markAllNotificationsAsRead('user-1', TENANT_A);

    expect(repository.count).toHaveBeenCalledWith({
      userId: 'user-1',
      isRead: false,
      organizationId: TENANT_A,
    });
  });
});
