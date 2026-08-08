import { PaymentChannel, PaymentStatus } from 'src/graphql/generated/graphql';
import type { AuthenticatedUser } from '../auth/types/auth-context';
import type {
  PaymentRecord,
  PaymentsRepository,
} from './repositories/payments.repository';
import { PaymentsService } from './payments.service';

const TENANT_A = 'org-a';
const TENANT_B = 'org-b';

function payment(overrides: Partial<PaymentRecord> = {}): PaymentRecord {
  return {
    id: 'payment-1',
    userId: 'user-1',
    referenceId: 'payment-payment-1',
    gatewayReference: null,
    channel: PaymentChannel.GCASH,
    status: PaymentStatus.PENDING,
    amount: 1000,
    currency: 'PHP',
    description: null,
    redirectUrl: null,
    webhookEventIds: [],
    organizationId: TENANT_A,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function fakeRepository(records: PaymentRecord[]) {
  const matches = (
    record: PaymentRecord,
    filter: Record<string, unknown> = {},
  ) =>
    Object.entries(filter).every(
      ([key, value]) => record[key as keyof PaymentRecord] === value,
    );

  const find = (filter?: Record<string, unknown>) =>
    records.filter((record) => matches(record, filter));

  return {
    create: jest.fn(async (data: PaymentRecord) => data),
    list: jest.fn((filter?: Record<string, unknown>) => ({
      collect: jest.fn(async () => find(filter)),
    })),
    exists: jest.fn(
      async (filter?: Record<string, unknown>) => find(filter).length > 0,
    ),
    find: jest.fn(async (filter?: Record<string, unknown>) => find(filter)[0]),
    update: jest.fn(async () => undefined),
    updateOne: jest.fn(async () => true),
  };
}

const user = { id: 'user-1' } as AuthenticatedUser;

describe('PaymentsService tenant isolation', () => {
  const records = [
    payment({ id: 'p-a', organizationId: TENANT_A }),
    payment({ id: 'p-b', organizationId: TENANT_B }),
  ];

  let repository: ReturnType<typeof fakeRepository>;
  let service: PaymentsService;

  beforeEach(() => {
    repository = fakeRepository(records);
    service = new PaymentsService(
      { get: jest.fn(() => 'https://example.test') } as never,
      {} as never,
      repository as unknown as PaymentsRepository,
    );
  });

  it('does not return a payment belonging to another tenant', async () => {
    await expect(
      service.findByIdForUser(user, 'p-b', TENANT_A),
    ).rejects.toThrow('Payment not found.');
  });

  it('still returns the payment for its own tenant', async () => {
    await expect(
      service.findByIdForUser(user, 'p-a', TENANT_A),
    ).resolves.toMatchObject({ id: 'p-a' });
  });

  it('composes tenant scope with the user filter when listing', async () => {
    await service.listForUser(user, TENANT_A);

    expect(repository.list).toHaveBeenCalledWith(
      { userId: 'user-1', organizationId: TENANT_A },
      expect.anything(),
    );
  });

  it('stamps the owning tenant on a new payment', async () => {
    const gateway = {
      createPayment: jest.fn(async () => ({
        gatewayReference: 'gw-1',
        status: PaymentStatus.PENDING,
        redirectUrl: 'https://pay.test/1',
      })),
    };

    service = new PaymentsService(
      { get: jest.fn(() => 'https://example.test') } as never,
      gateway as never,
      repository as unknown as PaymentsRepository,
    );

    await service.createPayment(
      user,
      { amount: 1000, channel: PaymentChannel.GCASH } as never,
      TENANT_A,
    );

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: TENANT_A }),
    );
  });
});
