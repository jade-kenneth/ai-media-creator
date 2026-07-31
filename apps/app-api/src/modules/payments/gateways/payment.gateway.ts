import { ConfigService } from '@nestjs/config';
import { ValidationError } from 'src/common/errors/app.error';
import type {
  CreateGatewayPaymentRequest,
  GatewayPayment,
} from '../payments.types';

/**
 * Contract every payment provider adapter implements. The payments service
 * depends on nothing beyond creating and reading a payment; webhook envelopes,
 * signature checks, and vendor request shapes stay on the concrete gateway.
 */
export abstract class PaymentGateway {
  protected abstract readonly enabledFlag: string;

  constructor(protected readonly configService: ConfigService) {}

  assertEnabled(): void {
    if (!this.configService.get<boolean>(this.enabledFlag)) {
      throw new ValidationError('Payments are not configured.');
    }
  }

  abstract createPayment(
    request: CreateGatewayPaymentRequest,
  ): Promise<GatewayPayment>;

  abstract getPayment(gatewayReference: string): Promise<GatewayPayment>;

  protected requiredConfig(name: string): string {
    const value = this.configService.get<string>(name)?.trim();

    if (!value) {
      throw new Error(`${name} is not configured.`);
    }

    return value;
  }
}
