import { AccountDeletionRequestStatus } from 'src/graphql/generated/graphql';
import type {
  AccountDeletionRequestRecord,
  AccountDeletionRequestsRepository,
} from './repositories/account-deletion-requests.repository';
import { AccountDeletionRequestsService } from './account-deletion-requests.service';

const TENANT_A = 'org-a';
const TENANT_B = 'org-b';

function request(
  overrides: Partial<AccountDeletionRequestRecord> = {},
): AccountDeletionRequestRecord {
  return {
    id: 'request-1',
    fullName: 'Ana Example',
    email: 'ana@example.com',
    organizationId: TENANT_A,
    organizationName: 'Org A',
    status: AccountDeletionRequestStatus.PENDING,
    reviewNote: null,
    reviewedBy: null,
    reviewedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  } as AccountDeletionRequestRecord;
}

function fakeRepository(records: AccountDeletionRequestRecord[]) {
  const matches = (
    record: AccountDeletionRequestRecord,
    filter: Record<string, unknown> = {},
  ) =>
    Object.entries(filter).every(
      ([key, value]) =>
        record[key as keyof AccountDeletionRequestRecord] === value,
    );

  const find = (filter?: Record<string, unknown>) =>
    records.filter((record) => matches(record, filter));

  return {
    create: jest.fn(async (data: AccountDeletionRequestRecord) => data),
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
  };
}

describe('AccountDeletionRequestsService tenant isolation', () => {
  const records = [
    request({ id: 'r-a', organizationId: TENANT_A }),
    request({ id: 'r-b', organizationId: TENANT_B }),
  ];

  let repository: ReturnType<typeof fakeRepository>;
  let service: AccountDeletionRequestsService;

  beforeEach(() => {
    repository = fakeRepository(records);
    service = new AccountDeletionRequestsService(
      repository as unknown as AccountDeletionRequestsRepository,
      {} as never,
      {} as never,
      {} as never,
    );
  });

  it('does not resolve a request belonging to another tenant', async () => {
    await expect(service.findById('r-b', TENANT_A)).resolves.toBeNull();
  });

  it('still resolves a request for its own tenant', async () => {
    await expect(service.findById('r-a', TENANT_A)).resolves.toMatchObject({
      id: 'r-a',
    });
  });

  it('refuses to review across the tenant boundary', async () => {
    await expect(
      service.review(
        {
          requestId: 'r-b',
          status: AccountDeletionRequestStatus.APPROVED,
        } as never,
        'reviewer-1',
        TENANT_A,
      ),
    ).rejects.toThrow('Account deletion request not found.');
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('composes tenant scope on top of a caller-supplied filter', async () => {
    await service.list(
      { status: AccountDeletionRequestStatus.PENDING } as never,
      undefined,
      undefined,
      undefined,
      TENANT_A,
    );

    expect(repository.list).toHaveBeenCalledWith(
      {
        status: AccountDeletionRequestStatus.PENDING,
        organizationId: TENANT_A,
      },
      expect.anything(),
    );
  });

  it('does not let a caller-supplied filter override the tenant scope', async () => {
    await service.list(
      { organizationId: TENANT_B } as never,
      undefined,
      undefined,
      undefined,
      TENANT_A,
    );

    expect(repository.list).toHaveBeenCalledWith(
      { organizationId: TENANT_A },
      expect.anything(),
    );
  });

  it('passes through unscoped for a super-admin carrying no tenant', async () => {
    await expect(service.count(undefined, null)).resolves.toBe(2);
  });
});
