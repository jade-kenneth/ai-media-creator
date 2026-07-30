import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  resolveStoreProductType,
  shouldRecoverAndroidPurchase,
  type StorePurchaseCatalog,
} from './store-purchases.ts';

const catalog = {
  nonConsumableProductIds: ['product.lifetime'],
  subscriptionProductIds: ['subscription.yearly'],
} satisfies StorePurchaseCatalog;

test('resolves only products supplied by the caller catalog', () => {
  assert.equal(resolveStoreProductType(catalog, 'subscription.yearly'), 'subs');
  assert.equal(resolveStoreProductType(catalog, 'product.lifetime'), 'in-app');
  assert.equal(resolveStoreProductType(catalog, 'product.unknown'), null);
});

test('recovers only purchased and unacknowledged Android transactions', () => {
  assert.equal(
    shouldRecoverAndroidPurchase({
      isAcknowledgedAndroid: false,
      purchaseState: 'purchased',
    }),
    true,
  );
  assert.equal(
    shouldRecoverAndroidPurchase({
      isAcknowledgedAndroid: true,
      purchaseState: 'purchased',
    }),
    false,
  );
  assert.equal(
    shouldRecoverAndroidPurchase({
      isAcknowledgedAndroid: false,
      purchaseState: 'pending',
    }),
    false,
  );
});

test('keeps the foundation provider free of Forever product dependencies', async () => {
  const provider = await readFile(
    join(
      dirname(fileURLToPath(import.meta.url)),
      'store-purchases-provider.tsx',
    ),
    'utf8',
  );

  assert.doesNotMatch(provider, /features\/store-purchases/);
  assert.doesNotMatch(provider, /foreverKeys|useForever/);
});
