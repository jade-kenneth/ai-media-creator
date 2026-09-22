import { UserRole } from 'src/graphql/generated/graphql';
import type {
  UserRecord,
  UsersRepository,
} from './repositories/users.repository';
import { UsersService } from './users.service';

const TENANT_A = 'org-a';
const TENANT_B = 'org-b';

/**
 * A fake repository that behaves like the real one for tenant purposes: it only
 * returns a record when every key in the filter matches. That is what makes a
 * wrong-tenant read observably a not-found rather than a silent leak.
 */
function fakeRepository(records: UserRecord[]) {
  const matches = (record: UserRecord, filter: Record<string, unknown> = {}) =>
    Object.entries(filter).every(([key, value]) => {
      if (value && typeof value === 'object' && 'in' in value) {
        return (value.in as unknown[]).includes(
          record[key as keyof UserRecord],
        );
      }

      if (value && typeof value === 'object' && 'equal' in value) {
        return record[key as keyof UserRecord] === value.equal;
      }

      return record[key as keyof UserRecord] === value;
    });

  const find = (filter?: Record<string, unknown>) =>
    records.filter((record) => matches(record, filter));

  return {
    list: jest.fn((filter?: Record<string, unknown>) => ({
      collect: jest.fn(async () => find(filter)),
    })),
    exists: jest.fn(
      async (filter?: Record<string, unknown>) => find(filter).length > 0,
    ),
    find: jest.fn(async (filter?: Record<string, unknown>) => find(filter)[0]),
    count: jest.fn(
      async (filter?: Record<string, unknown>) => find(filter).length,
    ),
    update: jest.fn(async () => undefined),
    delete: jest.fn(async () => undefined),
  };
}

function userRecord(overrides: Partial<UserRecord> = {}): UserRecord {
  return {
    id: 'user-1',
    email: 'one@example.com',
    passwordHash: 'hash',
    role: UserRole.ADMIN,
    isActive: true,
    organizationId: TENANT_A,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('UsersService tenant isolation', () => {
  const records = [
    userRecord({
      id: 'user-a',
      email: 'a@example.com',
      organizationId: TENANT_A,
    }),
    userRecord({
      id: 'user-b',
      email: 'b@example.com',
      organizationId: TENANT_B,
    }),
  ];

  let repository: ReturnType<typeof fakeRepository>;
  let service: UsersService;

  beforeEach(() => {
    repository = fakeRepository(records);
    service = new UsersService(repository as unknown as UsersRepository);
  });

  it('returns not-found for a valid id belonging to another tenant', async () => {
    await expect(service.findById('user-b', TENANT_A)).resolves.toBeNull();
    await expect(
      service.findRecordById('user-b', TENANT_A),
    ).resolves.toBeNull();
  });

  it('still resolves the record for its own tenant', async () => {
    await expect(service.findById('user-a', TENANT_A)).resolves.toMatchObject({
      id: 'user-a',
    });
  });

  it('adds tenant scope to the filter rather than replacing it', async () => {
    await service.findById('user-a', TENANT_A);

    expect(repository.exists).toHaveBeenCalledWith({
      id: 'user-a',
      organizationId: TENANT_A,
    });
  });

  it("excludes another tenant's ids from a batch lookup", async () => {
    const result = await service.findManyRecordsByIds(
      ['user-a', 'user-b'],
      TENANT_A,
    );

    expect([...result.keys()]).toEqual(['user-a']);
  });

  it('scopes admin listing and counting to the tenant', async () => {
    await expect(service.findAdminRecords(TENANT_A)).resolves.toHaveLength(1);
    await expect(service.countAdminAccounts(undefined, TENANT_A)).resolves.toBe(
      1,
    );
    await expect(service.countAdminAccounts(undefined, null)).resolves.toBe(2);
  });

  it('does not write to a record owned by another tenant', async () => {
    const result = await service.updateRecordById(
      'user-b',
      { firstName: 'Mallory' },
      TENANT_A,
    );

    expect(result).toBeNull();
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('does not delete a record owned by another tenant', async () => {
    await service.deleteById('user-b', TENANT_A);

    expect(repository.delete).toHaveBeenCalledWith({
      id: 'user-b',
      organizationId: TENANT_A,
    });
  });

  it('leaves credential lookups unscoped so login can precede tenant context', async () => {
    await expect(service.findByEmail('b@example.com')).resolves.toMatchObject({
      id: 'user-b',
    });
    expect(repository.exists).toHaveBeenCalledWith({ email: 'b@example.com' });
  });

  it('passes through unscoped for a super-admin carrying no tenant', async () => {
    await expect(service.findById('user-b', null)).resolves.toMatchObject({
      id: 'user-b',
    });
  });
});
