import { ConflictError } from 'src/common/errors/app.error';
import { CreditEntryKind } from 'src/graphql/generated/graphql';
import { CreditsService } from './credits.service';
import type {
  CreditEntryRecord,
  CreditsLedgerRepository,
} from './repositories/credits-ledger.repository';
import type {
  CreditAccountRecord,
  CreditChange,
  CreditsRepository,
} from './repositories/credits.repository';

const TENANT_A = 'org-a';
const TENANT_B = 'org-b';

function matches<T extends object>(record: T, filter: Record<string, unknown>) {
  return Object.entries(filter).every(([key, value]) => {
    const actual = record[key as keyof T];
    if (value && typeof value === 'object' && 'in' in value) {
      return (value as { in: unknown[] }).in.includes(actual);
    }
    return actual === value;
  });
}

function createService() {
  const accounts: CreditAccountRecord[] = [];
  const entries: CreditEntryRecord[] = [];

  const accountsRepo = {
    exists: jest.fn(async (filter: Record<string, unknown>) =>
      accounts.some((account) => matches(account, filter)),
    ),
    create: jest.fn(async (data: CreditAccountRecord) => {
      accounts.push(data);
      return data;
    }),
    list: jest.fn((filter: Record<string, unknown>) => ({
      collect: async () =>
        accounts.filter((account) => matches(account, filter)),
    })),
    adjust: jest.fn(
      async (
        filter: Record<string, unknown>,
        change: CreditChange,
        minimumBalance?: number,
      ) => {
        const account = accounts.find((candidate) =>
          matches(candidate, filter),
        );
        if (!account) return false;
        if (minimumBalance !== undefined && account.balance < minimumBalance) {
          return false;
        }
        account.balance += change.balance;
        account.held += change.held;
        return true;
      },
    ),
  } as unknown as CreditsRepository;

  const ledgerRepo = {
    create: jest.fn(async (data: CreditEntryRecord) => {
      entries.push(data);
      return data;
    }),
    list: jest.fn((filter: Record<string, unknown>) => ({
      connection: async () => {
        const nodes = entries
          .filter((entry) => matches(entry, filter))
          .reverse();
        return {
          totalCount: nodes.length,
          edges: nodes.map((node) => ({ cursor: node.id, node })),
          pageInfo: { endCursor: null, hasNextPage: false },
        };
      },
    })),
  } as unknown as CreditsLedgerRepository;

  return {
    service: new CreditsService(accountsRepo, ledgerRepo),
    accounts,
    entries,
  };
}

const owner = { ownerId: 'user-1', organizationId: TENANT_A };
const movement = {
  ...owner,
  amount: 3,
  jobId: 'job-1',
  projectId: 'project-1',
  projectTitle: 'Portable Blender, Morning Smoothie Hook',
  label: 'Write hooks & script',
};

describe('CreditsService', () => {
  it('holds a job cost and lists it as recent usage', async () => {
    const { service } = createService();
    await service.grant(owner, 10, 'Starter credits');

    await service.hold(movement);

    const summary = await service.summary(owner);
    expect(summary.balance).toBe(7);
    expect(summary.held).toBe(3);
    expect(summary.recentUsage[0]).toMatchObject({
      label: 'Write hooks & script',
      amount: -3,
      kind: CreditEntryKind.HOLD,
    });
  });

  it('refuses a hold the balance cannot cover and changes nothing', async () => {
    const { service, entries } = createService();
    await service.grant(owner, 2, 'Starter credits');

    await expect(service.hold(movement)).rejects.toThrow(ConflictError);
    await expect(service.hold(movement)).rejects.toThrow(
      'You need 3 credits. You have 2.',
    );
    expect(await service.getBalance(owner)).toBe(2);
    expect(
      entries.filter((entry) => entry.kind === CreditEntryKind.HOLD),
    ).toHaveLength(0);
  });

  it('captures on completion without changing the balance', async () => {
    const { service } = createService();
    await service.grant(owner, 10, 'Starter credits');
    await service.hold(movement);

    await service.capture(movement);

    const summary = await service.summary(owner);
    expect(summary.balance).toBe(7);
    expect(summary.held).toBe(0);
  });

  it('releases a failed job so it is not charged', async () => {
    const { service } = createService();
    await service.grant(owner, 10, 'Starter credits');
    await service.hold(movement);

    await service.release(movement);

    const summary = await service.summary(owner);
    expect(summary.balance).toBe(10);
    expect(summary.held).toBe(0);
    expect(summary.recentUsage[0]).toMatchObject({
      label: 'Refunded: job failed',
      amount: 3,
    });
  });

  it('does not read or spend credits from a wrong tenant', async () => {
    const { service } = createService();
    await service.grant(owner, 10, 'Starter credits');
    const otherTenant = { ...owner, organizationId: TENANT_B };

    expect(await service.getBalance(otherTenant)).toBe(0);
    await expect(
      service.hold({ ...movement, organizationId: TENANT_B }),
    ).rejects.toThrow(ConflictError);
    expect(await service.getBalance(owner)).toBe(10);
  });
});
