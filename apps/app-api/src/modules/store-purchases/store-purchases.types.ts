import type { StoreProductKind } from './ports/store-product-catalog';

export type StorePurchaseReference = {
  product: { kind: StoreProductKind };
  productId: string;
  purchaseToken: string;
};

export type VerifiedPurchase = {
  acknowledged: boolean;
  active: boolean;
  expiresAt: Date | null;
  productId: string;
  storeReference: string;
  transactionId: string;
};
