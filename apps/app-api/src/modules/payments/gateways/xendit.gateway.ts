import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import { ExternalServiceError } from 'src/common/errors/app.error';
import { z } from 'zod';
import { PaymentStatus } from '../../../graphql/generated/graphql';
import type {
  CreateGatewayPaymentRequest,
  GatewayPayment,
} from '../payments.types';
import { PaymentGateway } from './payment.gateway';

const XENDIT_BASE_URL = 'https://api.xendit.co';
const XENDIT_API_VERSION = '2024-11-11';
const REQUEST_TIMEOUT_MS = 15000;

/** Currencies whose smallest unit is not 1/100 of the major unit. */
const ZERO_DECIMAL_CURRENCIES = new Set(['JPY', 'KRW', 'VND', 'IDR']);

const paymentRequestResponseSchema = z.object({
  payment_request_id: z.string().min(1),
  status: z.string().min(1),
  actions: z
    .array(
      z.object({
        url: z.string().nullish(),
        url_type: z.string().nullish(),
        action: z.string().nullish(),
      }),
    )
    .nullish(),
});

@Injectable()
export class XenditGateway extends PaymentGateway {
  protected readonly enabledFlag = 'XENDIT_ENABLED';
  private readonly logger = new Logger(XenditGateway.name);

  constructor(configService: ConfigService) {
    super(configService);
  }

  async createPayment(
    request: CreateGatewayPaymentRequest,
  ): Promise<GatewayPayment> {
    this.assertEnabled();

    const payload = await this.send('POST', '/v3/payment_requests', {
      reference_id: request.referenceId,
      type: 'PAY',
      country: request.country,
      currency: request.currency,
      request_amount: toMajorUnits(request.amount, request.currency),
      capture_method: 'AUTOMATIC',
      channel_code: request.channel,
      channel_properties: {
        success_return_url: request.successReturnUrl,
        failure_return_url: request.failureReturnUrl,
      },
      description: request.description,
    });

    return toGatewayPayment(payload);
  }

  async getPayment(gatewayReference: string): Promise<GatewayPayment> {
    this.assertEnabled();

    const payload = await this.send(
      'GET',
      `/v3/payment_requests/${encodeURIComponent(gatewayReference)}`,
    );

    return toGatewayPayment(payload);
  }

  /**
   * Xendit authenticates its callbacks with a shared token rather than a
   * signature, so the comparison must be constant time to keep the token from
   * leaking through response timing.
   */
  verifyCallbackToken(callbackToken?: string): boolean {
    const expected = this.requiredConfig('XENDIT_CALLBACK_TOKEN');
    const received = callbackToken?.trim() ?? '';

    const expectedBuffer = Buffer.from(expected, 'utf8');
    const receivedBuffer = Buffer.from(received, 'utf8');

    if (expectedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, receivedBuffer);
  }

  private async send(
    method: 'GET' | 'POST',
    path: string,
    body?: Record<string, unknown>,
  ): Promise<z.infer<typeof paymentRequestResponseSchema>> {
    const secretKey = this.requiredConfig('XENDIT_SECRET_KEY');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'api-version': XENDIT_API_VERSION,
      Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
    };

    if (typeof body?.reference_id === 'string') {
      headers['Idempotency-key'] = body.reference_id;
    }

    let response: Response;

    try {
      response = await fetch(`${XENDIT_BASE_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      this.logger.error(`Xendit request to ${path} failed.`, error);
      throw new ExternalServiceError('The payment provider is unavailable.');
    }

    if (!response.ok) {
      this.logger.error(
        `Xendit responded with ${response.status} for ${path}: ${await response
          .text()
          .catch(() => '<unreadable body>')}`,
      );
      throw new ExternalServiceError(
        'The payment provider rejected the request.',
      );
    }

    const parsed = paymentRequestResponseSchema.safeParse(
      await response.json().catch(() => null),
    );

    if (!parsed.success) {
      this.logger.error(`Xendit returned an unexpected payload for ${path}.`);
      throw new ExternalServiceError('The payment provider is unavailable.');
    }

    return parsed.data;
  }
}

export function toPaymentStatus(status: string): PaymentStatus {
  switch (status.toUpperCase()) {
    case 'SUCCEEDED':
    case 'CAPTURED':
      return PaymentStatus.SUCCEEDED;
    case 'REQUIRES_ACTION':
      return PaymentStatus.REQUIRES_ACTION;
    case 'PENDING':
    case 'AWAITING_CAPTURE':
      return PaymentStatus.PENDING;
    case 'EXPIRED':
      return PaymentStatus.EXPIRED;
    case 'FAILED':
    case 'VOIDED':
      return PaymentStatus.FAILED;
    default:
      return PaymentStatus.PENDING;
  }
}

export function toMajorUnits(amount: number, currency: string): number {
  if (ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase())) {
    return amount;
  }

  return amount / 100;
}

function toGatewayPayment(
  payload: z.infer<typeof paymentRequestResponseSchema>,
): GatewayPayment {
  const redirectUrl = payload.actions?.find(
    (action) => typeof action.url === 'string' && action.url.length > 0,
  )?.url;

  return {
    gatewayReference: payload.payment_request_id,
    status: toPaymentStatus(payload.status),
    redirectUrl: redirectUrl ?? null,
  };
}
