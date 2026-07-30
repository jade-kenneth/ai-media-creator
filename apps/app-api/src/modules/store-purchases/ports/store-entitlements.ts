import type { VerifiedPurchase } from '../store-purchases.types';

export interface StoreEntitlements {
  grant(
    userId: string,
    productId: string,
    verified: VerifiedPurchase,
  ): Promise<Record<string, unknown>>;
  reconcile(
    userId: string,
    previousTransactionId: string,
    verified: VerifiedPurchase,
  ): Promise<void>;
}
