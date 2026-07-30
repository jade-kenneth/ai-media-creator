export type StorePurchaseCatalog = {
  nonConsumableProductIds: readonly string[];
  subscriptionProductIds: readonly string[];
};

export type StoreProductType = 'in-app' | 'subs';

export function resolveStoreProductType(
  catalog: StorePurchaseCatalog,
  productId: string,
): StoreProductType | null {
  if (catalog.subscriptionProductIds.includes(productId)) return 'subs';
  if (catalog.nonConsumableProductIds.includes(productId)) return 'in-app';
  return null;
}

export function shouldRecoverAndroidPurchase(purchase: {
  isAcknowledgedAndroid?: boolean | null;
  purchaseState?: string | null;
}): boolean {
  return (
    purchase.purchaseState === 'purchased' &&
    purchase.isAcknowledgedAndroid === false
  );
}
