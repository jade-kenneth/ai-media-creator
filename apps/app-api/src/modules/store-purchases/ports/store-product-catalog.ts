export type StoreProductKind = 'SUBSCRIPTION' | 'NON_CONSUMABLE';

export interface StoreProductCatalog {
  resolve(productId: string): { kind: StoreProductKind } | null;
}
