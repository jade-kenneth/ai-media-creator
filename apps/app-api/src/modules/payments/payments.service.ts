import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import { NotFoundError, ValidationError } from 'src/common/errors/app.error';
import { TOKENS } from 'src/types/tokens';
import {
  PaymentStatus,
  type CreatePaymentInput,
  type Payment,
} from '../../graphql/generated/graphql';
import type { AuthenticatedUser } from '../auth/types/auth-context';
import { toPaymentStatus, XenditGateway } from './gateways/xendit.gateway';
import type {
  PaymentRecord,
  PaymentsRepository,
} from './repositories/payments.repository';
import type { XenditCallbackBody } from './payments.validation';

const MINIMUM_AMOUNT = 1;
/** Statuses the provider can no longer move a payment away from. */
const TERMINAL_STATUSES = new Set<PaymentStatus>([
  PaymentStatus.SUCCEEDED,
  PaymentStatus.FAILED,
  PaymentStatus.EXPIRED,
]);

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly gateway: XenditGateway,
    @Inject(TOKENS.PAYMENTS_REPOSITORY)
    private readonly paymentsRepository: PaymentsRepository,
  ) {}

  async createPayment(
    currentUser: AuthenticatedUser,
    input: CreatePaymentInput,
  ): Promise<Payment> {
    if (!Number.isInteger(input.amount) || input.amount < MINIMUM_AMOUNT) {
      throw new ValidationError(
        'Amount must be a whole number of minor currency units.',
      );
    }

    const currency =
      this.configService.get<string>('PAYMENTS_CURRENCY') ?? 'PHP';
    const country = this.configService.get<string>('PAYMENTS_COUNTRY') ?? 'PH';
    const id = new Types.ObjectId().toHexString();
    const referenceId = `payment-${id}`;
    const now = new Date();

    // Persist before calling the provider so a callback that arrives during
    // the create round trip still finds a record to attach itself to.
    const record = await this.paymentsRepository.create({
      id,
      userId: currentUser.id,
      referenceId,
      gatewayReference: null,
      channel: input.channel,
      status: PaymentStatus.PENDING,
      amount: input.amount,
      currency,
      description: input.description?.trim() || null,
      redirectUrl: null,
      webhookEventIds: [],
      createdAt: now,
      updatedAt: now,
    });

    let gatewayPayment: Awaited<ReturnType<XenditGateway['createPayment']>>;

    try {
      gatewayPayment = await this.gateway.createPayment({
        referenceId,
        channel: input.channel,
        amount: input.amount,
        currency,
        country,
        description: record.description ?? 'Payment',
        successReturnUrl: this.returnUrl('PAYMENTS_SUCCESS_RETURN_URL'),
        failureReturnUrl: this.returnUrl('PAYMENTS_FAILURE_RETURN_URL'),
      });
    } catch (error) {
      await this.paymentsRepository
        .updateOne(
          { id },
          { status: PaymentStatus.FAILED, updatedAt: new Date() },
        )
        .catch(() => undefined);

      throw error;
    }

    const updated = await this.updateRecord(id, {
      gatewayReference: gatewayPayment.gatewayReference,
      status: gatewayPayment.status,
      redirectUrl: gatewayPayment.redirectUrl,
    });

    return toPayment(updated ?? record);
  }

  async findByIdForUser(
    currentUser: AuthenticatedUser,
    id: string,
  ): Promise<Payment> {
    const record = await this.findRecord({ id, userId: currentUser.id });

    if (!record) {
      throw new NotFoundError('Payment not found.');
    }

    return toPayment(record);
  }

  async listForUser(currentUser: AuthenticatedUser): Promise<Payment[]> {
    const records = await this.paymentsRepository
      .list(
        { userId: currentUser.id },
        { sort: { createdAt: 'DESC', id: 'DESC' } },
      )
      .collect();

    return records.map(toPayment);
  }

  /**
   * Applies a provider callback. Redeliveries are ignored by event id, and a
   * payment that already reached a terminal status is never moved again, so a
   * late or out-of-order callback cannot revive a settled payment.
   */
  async receiveXenditCallback(body: XenditCallbackBody): Promise<void> {
    const record = await this.findRecord({
      referenceId: body.data.reference_id,
    });

    if (!record) {
      this.logger.warn(
        'Ignored a Xendit callback for an unknown payment reference.',
      );
      return;
    }

    const eventId = body.id;

    if (eventId && record.webhookEventIds.includes(eventId)) {
      return;
    }

    const status = toPaymentStatus(body.data.status);

    if (TERMINAL_STATUSES.has(record.status)) {
      if (record.status !== status) {
        this.logger.warn(
          `Ignored a Xendit callback that would move payment ${record.id} out of ${record.status}.`,
        );
      }

      return;
    }

    await this.updateRecord(record.id, {
      status,
      ...(body.data.payment_request_id
        ? { gatewayReference: body.data.payment_request_id }
        : {}),
      ...(TERMINAL_STATUSES.has(status) ? { redirectUrl: null } : {}),
      ...(eventId
        ? { webhookEventIds: [...record.webhookEventIds, eventId] }
        : {}),
    });
  }

  verifyCallbackToken(callbackToken?: string): boolean {
    return this.gateway.verifyCallbackToken(callbackToken);
  }

  private returnUrl(key: string): string {
    const value = this.configService.get<string>(key)?.trim();

    if (!value) {
      throw new Error(`${key} is not configured.`);
    }

    return value;
  }

  private async updateRecord(
    id: string,
    patch: Partial<PaymentRecord>,
  ): Promise<PaymentRecord | null> {
    await this.paymentsRepository.update(
      { id },
      { ...patch, updatedAt: new Date() },
    );

    return this.findRecord({ id });
  }

  private async findRecord(
    filter: Partial<Pick<PaymentRecord, 'id' | 'userId' | 'referenceId'>>,
  ): Promise<PaymentRecord | null> {
    if (!(await this.paymentsRepository.exists(filter))) {
      return null;
    }

    return this.paymentsRepository.find(filter);
  }
}

function toPayment(record: PaymentRecord): Payment {
  return {
    id: record.id,
    referenceId: record.referenceId,
    status: record.status,
    channel: record.channel,
    amount: record.amount,
    currency: record.currency,
    description: record.description,
    redirectUrl: record.redirectUrl,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}
