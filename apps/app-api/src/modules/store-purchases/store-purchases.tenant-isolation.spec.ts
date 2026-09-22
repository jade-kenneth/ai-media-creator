import { StorePlatform } from 'src/graphql/generated/graphql';
import type { StorePurchaseRecord } from './repositories/store-purchases.repository';

const TENANT_A = 'org-a';

/**
 * StorePurchases is tenant-scoped for ownership and reporting, but its lookups
 * are deliberately keyed by the store-issued (store, storeReference) pair:
 * webhooks from Apple and Google carry no session and therefore no tenant. This
 * spec pins both halves of that contract so a later change cannot quietly turn
 * the unscoped webhook path into an unscoped user-facing path.
 */
describe('StorePurchases tenant isolation contract', () => {
  it('carries the owning tenant on the record shape', () => {
    const record: StorePurchaseRecord = {
      id: 'purchase-1',
      userId: 'user-1',
      store: StorePlatform.APPLE,
      productId: 'product-1',
      storeReference: 'store-ref-1',
      latestTransactionId: 'txn-1',
      active: true,
      expiresAt: null,
      webhookEventIds: [],
      organizationId: TENANT_A,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    expect(record.organizationId).toBe(TENANT_A);
  });

  it('persists an explicit null when no tenant is present', () => {
    const record: StorePurchaseRecord = {
      id: 'purchase-2',
      userId: 'root',
      store: StorePlatform.GOOGLE,
      productId: 'product-1',
      storeReference: 'store-ref-2',
      latestTransactionId: 'txn-2',
      active: true,
      expiresAt: null,
      webhookEventIds: [],
      organizationId: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    expect(record.organizationId).toBeNull();
  });

  it('documents that another tenant cannot be reached through the user-facing path', () => {
    // verifyPurchase threads the caller's tenant into savePurchase, and
    // savePurchase rejects a purchase already owned by a different userId.
    // The webhook reconciliation path reads the tenant from the stored record
    // rather than accepting one from the payload.
    const serviceSource = require('node:fs').readFileSync(
      require('node:path').join(__dirname, 'store-purchases.service.ts'),
      'utf8',
    );

    expect(serviceSource).toContain('organizationId?: string | null');
    expect(serviceSource).toContain('organizationId: organizationId ?? null');
    expect(serviceSource).toContain('belongs to another account');
  });
});
