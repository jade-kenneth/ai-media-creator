import { ConfigService } from '@nestjs/config';
import {
  PaymentChannel,
  PaymentStatus,
  UserRole,
} from '../../graphql/generated/graphql';
import type { AuthenticatedUser } from '../auth/types/auth-context';
import type { XenditGateway } from './gateways/xendit.gateway';
import { PaymentsService } from './payments.service';
import type {
  PaymentRecord,
  PaymentsRepository,
} from './repositories/payments.repository';

describe('PaymentsService', () => {
  it('generates its own reference instead of trusting the caller', async () => {
    const fixture = createService();

    const payment = await fixture.service.createPayment(currentUser(), {
      channel: PaymentChannel.GCASH,
      amount: 10000,
    });

    const created = fixture.repository.create.mock
      .calls[0]?.[0] as PaymentRecord;
    expect(created.referenceId).toBe(`payment-${created.id}`);
    expect(created.userId).toBe('user-1');
    expect(fixture.gateway.createPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        referenceId: created.referenceId,
        amount: 10000,
      }),
    );
    expect(payment.redirectUrl).toBe('https://checkout.example.com/pay');
  });

  it('rejects an amount that is not a whole minor unit', async () => {
    const fixture = createService();

    await expect(
      fixture.service.createPayment(currentUser(), {
        channel: PaymentChannel.GCASH,
        amount: 10.5,
      }),
    ).rejects.toMatchObject({ code: 'BAD_USER_INPUT' });
    expect(fixture.repository.create).not.toHaveBeenCalled();
  });

  it('marks the payment failed when the gateway call fails', async () => {
    const fixture = createService({ gatewayFails: true });

    await expect(
      fixture.service.createPayment(currentUser(), {
        channel: PaymentChannel.GCASH,
        amount: 10000,
      }),
    ).rejects.toThrow('gateway down');
    expect(fixture.repository.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({ id: expect.any(String) }),
      expect.objectContaining({ status: PaymentStatus.FAILED }),
    );
  });

  it('applies a callback that advances a pending payment', async () => {
    const fixture = createService({ record: paymentRecord() });

    await fixture.service.receiveXenditCallback(callback());

    expect(fixture.repository.update).toHaveBeenCalledWith(
      { id: 'payment-1' },
      expect.objectContaining({
        status: PaymentStatus.SUCCEEDED,
        webhookEventIds: ['evt-1'],
      }),
    );
  });

  it('ignores a redelivered callback', async () => {
    const fixture = createService({
      record: paymentRecord({ webhookEventIds: ['evt-1'] }),
    });

    await fixture.service.receiveXenditCallback(callback());

    expect(fixture.repository.update).not.toHaveBeenCalled();
  });

  it('never moves a payment that already settled', async () => {
    const fixture = createService({
      record: paymentRecord({ status: PaymentStatus.SUCCEEDED }),
    });

    await fixture.service.receiveXenditCallback(
      callback({ status: 'FAILED', id: 'evt-2' }),
    );

    expect(fixture.repository.update).not.toHaveBeenCalled();
  });

  it('ignores a callback for a reference it does not know', async () => {
    const fixture = createService({ record: null });

    await fixture.service.receiveXenditCallback(callback());

    expect(fixture.repository.update).not.toHaveBeenCalled();
  });

  it('does not return another user’s payment', async () => {
    const fixture = createService({ record: null });

    await expect(
      fixture.service.findByIdForUser(currentUser(), 'payment-1'),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(fixture.repository.exists).toHaveBeenCalledWith({
      id: 'payment-1',
      userId: 'user-1',
    });
  });
});

function createService({
  record = paymentRecord(),
  gatewayFails = false,
}: {
  record?: PaymentRecord | null;
  gatewayFails?: boolean;
} = {}) {
  const configService = {
    get: (key: string) =>
      ({
        PAYMENTS_CURRENCY: 'PHP',
        PAYMENTS_COUNTRY: 'PH',
        PAYMENTS_SUCCESS_RETURN_URL: 'https://app.example.com/paid',
        PAYMENTS_FAILURE_RETURN_URL: 'https://app.example.com/failed',
      })[key],
  } as unknown as ConfigService;

  const repository = {
    create: jest.fn(async (data: PaymentRecord) => data),
    update: jest.fn().mockResolvedValue(undefined),
    updateOne: jest.fn().mockResolvedValue(true),
    exists: jest.fn().mockResolvedValue(record !== null),
    find: jest.fn().mockResolvedValue(record),
    list: jest.fn(),
  } as unknown as jest.Mocked<PaymentsRepository>;

  const gateway = {
    createPayment: gatewayFails
      ? jest.fn().mockRejectedValue(new Error('gateway down'))
      : jest.fn().mockResolvedValue({
          gatewayReference: 'pr-1',
          status: PaymentStatus.REQUIRES_ACTION,
          redirectUrl: 'https://checkout.example.com/pay',
        }),
    getPayment: jest.fn(),
    verifyCallbackToken: jest.fn().mockReturnValue(true),
  } as unknown as jest.Mocked<XenditGateway>;

  return {
    service: new PaymentsService(configService, gateway, repository),
    repository,
    gateway,
  };
}

function currentUser(): AuthenticatedUser {
  return {
    id: 'user-1',
    email: 'user@example.com',
    role: UserRole.USER,
    isActive: true,
    jti: 'jti-1',
  };
}

function paymentRecord(overrides: Partial<PaymentRecord> = {}): PaymentRecord {
  return {
    id: 'payment-1',
    userId: 'user-1',
    referenceId: 'payment-payment-1',
    gatewayReference: 'pr-1',
    channel: PaymentChannel.GCASH,
    status: PaymentStatus.PENDING,
    amount: 10000,
    currency: 'PHP',
    description: null,
    redirectUrl: 'https://checkout.example.com/pay',
    webhookEventIds: [],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function callback({
  status = 'SUCCEEDED',
  id = 'evt-1',
}: { status?: string; id?: string } = {}) {
  return {
    id,
    event: 'payment.succeeded',
    data: {
      reference_id: 'payment-payment-1',
      status,
      payment_request_id: 'pr-1',
    },
  };
}
