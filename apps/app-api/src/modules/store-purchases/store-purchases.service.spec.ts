import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { StorePlatform, UserRole } from '../../graphql/generated/graphql';
import type { AuthenticatedUser } from '../auth/types/auth-context';
import { AppleStoreGateway } from './gateways/apple-store.gateway';
import { GoogleStoreGateway } from './gateways/google-store.gateway';
import type { StoreProductCatalog } from './ports/store-product-catalog';
import type { StoreEntitlements } from './ports/store-entitlements';
import type {
  StorePurchaseRecord,
  StorePurchasesRepository,
} from './repositories/store-purchases.repository';
import { StorePurchasesService } from './store-purchases.service';

const PRODUCT_ID = 'test.product.lifetime';
const SUBSCRIPTION_ID = 'test.subscription.family';

const user: AuthenticatedUser = {
  email: 'ana@example.com',
  id: 'user-1',
  isActive: true,
  jti: 'session-1',
  role: UserRole.USER,
};

function createConfigService() {
  return {
    get: jest.fn((name: string) => {
      const values: Record<string, boolean | string> = {
        GOOGLE_PLAY_PACKAGE_NAME: 'com.example.product',
        GOOGLE_PLAY_SERVICE_ACCOUNT_BASE64:
          Buffer.from('{}').toString('base64'),
        STORE_IAP_ENABLED: true,
      };
      return values[name];
    }),
  } as unknown as ConfigService;
}

function createService(options?: {
  existingPurchase?: StorePurchaseRecord;
  eventProcessed?: boolean;
  googleGateway?: GoogleStoreGateway;
}) {
  const purchasesRepository = {
    create: jest.fn().mockResolvedValue(undefined),
    exists: jest.fn().mockResolvedValue(options?.eventProcessed ?? false),
    list: jest.fn(() => ({
      collect: jest
        .fn()
        .mockResolvedValue(
          options?.existingPurchase ? [options.existingPurchase] : [],
        ),
    })),
    update: jest.fn().mockResolvedValue(undefined),
  };
  const catalog: StoreProductCatalog = {
    resolve: jest.fn((productId: string) => {
      if (productId === PRODUCT_ID) return { kind: 'NON_CONSUMABLE' };
      if (productId === SUBSCRIPTION_ID) return { kind: 'SUBSCRIPTION' };
      return null;
    }),
  };
  const entitlements = {
    grant: jest.fn().mockResolvedValue({ entitlementGranted: true }),
    reconcile: jest.fn().mockResolvedValue(undefined),
  };
  const configService = createConfigService();
  const googleGateway =
    options?.googleGateway ?? new GoogleStoreGateway(configService);

  return {
    catalog,
    entitlements,
    purchasesRepository,
    service: new StorePurchasesService(
      purchasesRepository as unknown as StorePurchasesRepository,
      catalog,
      entitlements as StoreEntitlements,
      new AppleStoreGateway(configService),
      googleGateway,
    ),
  };
}

describe('StorePurchasesService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('persists, grants, and then acknowledges an unacknowledged product', async () => {
    const acknowledge = jest.fn().mockResolvedValue({ data: {} });
    jest.spyOn(google, 'androidpublisher').mockReturnValue({
      purchases: {
        products: { acknowledge },
        productsv2: {
          getproductpurchasev2: jest.fn().mockResolvedValue({
            data: {
              acknowledgementState: 'ACKNOWLEDGEMENT_STATE_PENDING',
              orderId: 'GPA.1',
              productLineItem: [{ productId: PRODUCT_ID }],
              purchaseStateContext: { purchaseState: 'PURCHASED' },
            },
          }),
        },
      },
    } as never);
    const { entitlements, purchasesRepository, service } = createService();

    await expect(
      service.verifyPurchase(
        {
          productId: PRODUCT_ID,
          purchaseToken: 'purchase-token',
          store: StorePlatform.GOOGLE,
        },
        user,
      ),
    ).resolves.toMatchObject({
      entitlementGranted: true,
      productId: PRODUCT_ID,
      status: 'VERIFIED',
    });

    expect(acknowledge).toHaveBeenCalledWith({
      packageName: 'com.example.product',
      productId: PRODUCT_ID,
      requestBody: {},
      token: 'purchase-token',
    });
    expect(purchasesRepository.create.mock.invocationCallOrder[0]).toBeLessThan(
      entitlements.grant.mock.invocationCallOrder[0],
    );
    expect(entitlements.grant.mock.invocationCallOrder[0]).toBeLessThan(
      acknowledge.mock.invocationCallOrder[0],
    );
  });

  it('does not acknowledge a subscription Google already marked acknowledged', async () => {
    const acknowledge = jest.fn();
    jest.spyOn(google, 'androidpublisher').mockReturnValue({
      purchases: {
        subscriptions: { acknowledge },
        subscriptionsv2: {
          get: jest.fn().mockResolvedValue({
            data: {
              acknowledgementState: 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED',
              lineItems: [
                {
                  expiryTime: '2099-01-01T00:00:00.000Z',
                  latestSuccessfulOrderId: 'GPA.2',
                  productId: SUBSCRIPTION_ID,
                },
              ],
              subscriptionState: 'SUBSCRIPTION_STATE_ACTIVE',
            },
          }),
        },
      },
    } as never);
    const { service } = createService();

    await service.verifyPurchase(
      {
        productId: SUBSCRIPTION_ID,
        purchaseToken: 'subscription-token',
        store: StorePlatform.GOOGLE,
      },
      user,
    );

    expect(acknowledge).not.toHaveBeenCalled();
  });

  it('keeps acknowledgement retryable when Google rejects the request', async () => {
    const acknowledge = jest.fn().mockRejectedValue(new Error('unavailable'));
    jest.spyOn(google, 'androidpublisher').mockReturnValue({
      purchases: {
        products: { acknowledge },
        productsv2: {
          getproductpurchasev2: jest.fn().mockResolvedValue({
            data: {
              acknowledgementState: 'ACKNOWLEDGEMENT_STATE_PENDING',
              orderId: 'GPA.3',
              productLineItem: [{ productId: PRODUCT_ID }],
              purchaseStateContext: { purchaseState: 'PURCHASED' },
            },
          }),
        },
      },
    } as never);
    const { entitlements, purchasesRepository, service } = createService();

    await expect(
      service.verifyPurchase(
        {
          productId: PRODUCT_ID,
          purchaseToken: 'retry-token',
          store: StorePlatform.GOOGLE,
        },
        user,
      ),
    ).rejects.toThrow('Google Play could not acknowledge this purchase.');
    expect(purchasesRepository.create).toHaveBeenCalled();
    expect(entitlements.grant).toHaveBeenCalled();
  });

  it('rejects a purchase ledger entry owned by another account', async () => {
    jest.spyOn(google, 'androidpublisher').mockReturnValue({
      purchases: {
        products: { acknowledge: jest.fn() },
        productsv2: {
          getproductpurchasev2: jest.fn().mockResolvedValue({
            data: {
              acknowledgementState: 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED',
              orderId: 'GPA.4',
              productLineItem: [{ productId: PRODUCT_ID }],
              purchaseStateContext: { purchaseState: 'PURCHASED' },
            },
          }),
        },
      },
    } as never);
    const { entitlements, service } = createService({
      existingPurchase: {
        active: true,
        createdAt: new Date(),
        expiresAt: null,
        id: 'purchase-1',
        latestTransactionId: 'GPA.4',
        productId: PRODUCT_ID,
        store: StorePlatform.GOOGLE,
        storeReference: 'shared-token',
        updatedAt: new Date(),
        userId: 'another-user',
        webhookEventIds: [],
      },
    });

    await expect(
      service.verifyPurchase(
        {
          productId: PRODUCT_ID,
          purchaseToken: 'shared-token',
          store: StorePlatform.GOOGLE,
        },
        user,
      ),
    ).rejects.toThrow('This store purchase belongs to another account.');
    expect(entitlements.grant).not.toHaveBeenCalled();
  });

  it('does not decode or reconcile a webhook event already in the ledger', async () => {
    const googleGateway = {
      assertEnabled: jest.fn(),
      decodeNotification: jest.fn(),
      verifyPubSubIdentity: jest.fn().mockResolvedValue(undefined),
    } as unknown as GoogleStoreGateway;
    const { entitlements, service } = createService({
      eventProcessed: true,
      googleGateway,
    });

    await service.receiveGoogleNotification(
      {
        message: { data: 'e30=', messageId: 'event-1' },
        subscription: 'projects/example/subscriptions/store',
      },
      'Bearer token',
    );

    expect(googleGateway.verifyPubSubIdentity).toHaveBeenCalledWith(
      'Bearer token',
    );
    expect(googleGateway.decodeNotification).not.toHaveBeenCalled();
    expect(entitlements.reconcile).not.toHaveBeenCalled();
  });

  it('rejects products the injected catalog does not recognize', async () => {
    const { service } = createService();

    await expect(
      service.verifyPurchase(
        {
          productId: 'unknown-product',
          purchaseToken: 'token',
          store: StorePlatform.GOOGLE,
        },
        user,
      ),
    ).rejects.toThrow('Unknown store product.');
  });
});
