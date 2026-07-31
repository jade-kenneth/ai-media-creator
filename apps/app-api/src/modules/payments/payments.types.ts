import type {
  PaymentChannel,
  PaymentStatus,
} from '../../graphql/generated/graphql';

export interface CreateGatewayPaymentRequest {
  referenceId: string;
  channel: PaymentChannel;
  /** Smallest currency unit, for example centavos for PHP. */
  amount: number;
  currency: string;
  country: string;
  description: string;
  successReturnUrl: string;
  failureReturnUrl: string;
}

export interface GatewayPayment {
  gatewayReference: string;
  status: PaymentStatus;
  redirectUrl: string | null;
}
