import type {
  SessionRecord,
  SessionsRepository,
} from './repositories/sessions.repository';
import { SessionsService } from './sessions.service';

const TENANT_A = 'org-a';
const TENANT_B = 'org-b';

function session(overrides: Partial<SessionRecord> = {}): SessionRecord {
  return {
    accountId: 'user-1',
    jti: 'jti-1',
    organizationId: TENANT_A,
    dateTimeCreated: new Date('2026-01-01T00:00:00.000Z'),
    dateTimeLastRefreshed: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function fakeRepository(records: SessionRecord[]) {
  const matches = (
    record: SessionRecord,
    filter: Record<string, unknown> = {},
  ) =>
    Object.entries(filter).every(
      ([key, value]) => record[key as keyof SessionRecord] === value,
    );

  const find = (filter?: Record<string, unknown>) =>
    records.filter((record) => matches(record, filter));

  return {
    create: jest.fn(async (data: SessionRecord) => data),
    exists: jest.fn(
      async (filter?: Record<string, unknown>) => find(filter).length > 0,
    ),
    find: jest.fn(async (filter?: Record<string, unknown>) => find(filter)[0]),
    update: jest.fn(async () => undefined),
    delete: jest.fn(async () => undefined),
  };
}

describe('SessionsService tenant isolation', () => {
  const records = [
    session({ jti: 'jti-a', organizationId: TENANT_A }),
    session({ jti: 'jti-b', organizationId: TENANT_B }),
  ];

  let repository: ReturnType<typeof fakeRepository>;
  let service: SessionsService;

  beforeEach(() => {
    repository = fakeRepository(records);
    service = new SessionsService(repository as unknown as SessionsRepository);
  });

  // Regression: the schema declared and indexed organizationId, but nothing
  // ever wrote it, so every session row carried an undefined tenant.
  it('persists the owning tenant when a session is created', async () => {
    await service.createSession({
      accountId: 'user-1',
      jti: 'jti-new',
      organizationId: TENANT_A,
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: TENANT_A }),
    );
  });

  it('records an explicit null for a super-admin carrying no tenant', async () => {
    await service.createSession({ accountId: 'root', jti: 'jti-root' });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: null }),
    );
  });

  it('does not resolve a session belonging to another tenant', async () => {
    await expect(service.findByJti('jti-b', TENANT_A)).resolves.toBeNull();
  });

  it('still resolves a session for its own tenant', async () => {
    await expect(service.findByJti('jti-a', TENANT_A)).resolves.toMatchObject({
      jti: 'jti-a',
    });
  });

  it('refuses to refresh or delete across the tenant boundary', async () => {
    await expect(
      service.refreshSession('jti-b', new Date(), TENANT_A),
    ).resolves.toBeNull();
    await expect(service.deleteSessionByJti('jti-b', TENANT_A)).resolves.toBe(
      false,
    );
    expect(repository.update).not.toHaveBeenCalled();
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it('scopes account-wide session revocation to the tenant', async () => {
    await service.deleteSessionsByAccountId('user-1', TENANT_A);

    expect(repository.delete).toHaveBeenCalledWith({
      accountId: 'user-1',
      organizationId: TENANT_A,
    });
  });
});
