import { PushPlatform } from 'src/graphql/generated/graphql';
import type {
  PushTokenRecord,
  PushTokensRepository,
} from './repositories/push-tokens.repository';
import { PushTokensService } from './push-tokens.service';

const TENANT_A = 'org-a';
const TENANT_B = 'org-b';

function pushToken(overrides: Partial<PushTokenRecord> = {}): PushTokenRecord {
  return {
    id: 'push-1',
    userId: 'user-1',
    token: 'token-a',
    platform: PushPlatform.IOS,
    deviceMetadata: null,
    organizationId: TENANT_A,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function fakeRepository(records: PushTokenRecord[]) {
  const matches = (
    record: PushTokenRecord,
    filter: Record<string, unknown> = {},
  ) =>
    Object.entries(filter).every(
      ([key, value]) => record[key as keyof PushTokenRecord] === value,
    );

  const find = (filter?: Record<string, unknown>) =>
    records.filter((record) => matches(record, filter));

  return {
    create: jest.fn(async (data: PushTokenRecord) => data),
    exists: jest.fn(
      async (filter?: Record<string, unknown>) => find(filter).length > 0,
    ),
    update: jest.fn(async () => undefined),
    delete: jest.fn(async () => undefined),
  };
}

describe('PushTokensService tenant isolation', () => {
  const records = [
    pushToken({ token: 'token-a', organizationId: TENANT_A }),
    pushToken({ token: 'token-b', organizationId: TENANT_B }),
  ];

  let repository: ReturnType<typeof fakeRepository>;
  let service: PushTokensService;

  beforeEach(() => {
    repository = fakeRepository(records);
    service = new PushTokensService(
      repository as unknown as PushTokensRepository,
    );
  });

  it('stamps the owning tenant when registering a device', async () => {
    await service.registerPushToken(
      { token: 'token-new', platform: PushPlatform.IOS } as never,
      'user-1',
      TENANT_A,
    );

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: TENANT_A }),
    );
  });

  it('will not unregister a device registered to another tenant', async () => {
    await expect(
      service.unregisterPushToken(
        { token: 'token-b', platform: PushPlatform.IOS } as never,
        'user-1',
        TENANT_A,
      ),
    ).resolves.toBe(false);
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it("still unregisters the caller's own device", async () => {
    await expect(
      service.unregisterPushToken(
        { token: 'token-a', platform: PushPlatform.IOS } as never,
        'user-1',
        TENANT_A,
      ),
    ).resolves.toBe(true);
    expect(repository.delete).toHaveBeenCalledWith({
      token: 'token-a',
      platform: PushPlatform.IOS,
      userId: 'user-1',
      organizationId: TENANT_A,
    });
  });

  it('re-registers an existing device across tenants rather than failing the unique index', async () => {
    // (token, platform) is globally unique, so the lookup is deliberately
    // unscoped: a device moving between tenants must update, not insert.
    await service.registerPushToken(
      { token: 'token-b', platform: PushPlatform.IOS } as never,
      'user-2',
      TENANT_A,
    );

    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.update).toHaveBeenCalledWith(
      { token: 'token-b', platform: PushPlatform.IOS },
      expect.objectContaining({ organizationId: TENANT_A, userId: 'user-2' }),
    );
  });
});
