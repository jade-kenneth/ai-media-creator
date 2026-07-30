import { getAvailablePurchases, useIAP, type Purchase } from 'expo-iap';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform } from 'react-native';

import { useSession } from './AuthProvider';
import {
  resolveStoreProductType,
  shouldRecoverAndroidPurchase,
  type StorePurchaseCatalog,
} from './store-purchases';

export type StorePurchasePlatform = 'APPLE' | 'GOOGLE';

export type StorePurchaseVerificationInput = {
  input: {
    productId: string;
    purchaseToken: string;
    store: StorePurchasePlatform;
    transactionId?: string;
  };
};

export type StorePurchaseVerification = {
  isPending: boolean;
  mutateAsync(input: StorePurchaseVerificationInput): Promise<unknown>;
};

type StorePurchasesProviderProps = {
  catalog: StorePurchaseCatalog;
  children: ReactNode;
  onVerified?(productId: string): Promise<void> | void;
  verification: StorePurchaseVerification;
};

type StorePurchaseContextValue = {
  connected: boolean;
  error: string | null;
  pending: boolean;
  lastVerifiedProductId: string | null;
  verificationSequence: number;
  price(productId: string): string | undefined;
  purchase(productId: string): Promise<void>;
  restore(): Promise<void>;
};

const StorePurchaseContext = createContext<StorePurchaseContextValue | null>(
  null,
);

export function StorePurchasesProvider({
  catalog,
  children,
  onVerified,
  verification,
}: StorePurchasesProviderProps) {
  const session = useSession();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [pendingPurchase, setPendingPurchase] = useState<Purchase | null>(null);
  const [lastVerifiedProductId, setLastVerifiedProductId] = useState<
    string | null
  >(null);
  const [verificationSequence, setVerificationSequence] = useState(0);
  const processingTokens = useRef(new Set<string>());
  const recoveredSession = useRef<string | null>(null);

  const {
    connected,
    fetchProducts,
    finishTransaction,
    products,
    requestPurchase,
    subscriptions,
  } = useIAP({
    onError: () => setError('The App Store or Play Store is unavailable.'),
    onPurchaseError: (purchaseError) => {
      if (purchaseError.code !== 'user-cancelled') {
        setError('The purchase was not completed. Please try again.');
      }
    },
    onPurchaseSuccess: setPendingPurchase,
  });

  const verifyAndFinish = useCallback(
    async (purchase: Purchase) => {
      if (Platform.OS === 'android' && purchase.purchaseState !== 'purchased') {
        return;
      }
      if (!purchase.purchaseToken) {
        setError('The store did not return a verifiable purchase receipt.');
        return;
      }
      if (processingTokens.current.has(purchase.purchaseToken)) return;
      processingTokens.current.add(purchase.purchaseToken);
      setProcessing(true);
      setError(null);
      try {
        await verification.mutateAsync({
          input: {
            productId: purchase.productId,
            purchaseToken: purchase.purchaseToken,
            store: Platform.OS === 'ios' ? 'APPLE' : 'GOOGLE',
            transactionId: purchase.transactionId ?? undefined,
          },
        });
        await finishTransaction({ purchase, isConsumable: false });
        setLastVerifiedProductId(purchase.productId);
        setVerificationSequence((sequence) => sequence + 1);
        await onVerified?.(purchase.productId);
      } catch {
        setError(
          'We could not verify this purchase. It remains recoverable from Restore Purchases.',
        );
      } finally {
        processingTokens.current.delete(purchase.purchaseToken);
        setProcessing(processingTokens.current.size > 0);
      }
    },
    [finishTransaction, onVerified, verification],
  );

  useEffect(() => {
    if (!pendingPurchase) return;
    setPendingPurchase(null);
    void verifyAndFinish(pendingPurchase);
  }, [pendingPurchase, verifyAndFinish]);

  useEffect(() => {
    if (!connected) return;
    void Promise.all([
      fetchProducts({
        skus: [...catalog.subscriptionProductIds],
        type: 'subs',
      }),
      fetchProducts({
        skus: [...catalog.nonConsumableProductIds],
        type: 'in-app',
      }),
    ]);
  }, [catalog, connected, fetchProducts]);

  useEffect(() => {
    if (!connected || session.status !== 'authenticated') {
      recoveredSession.current = null;
      return;
    }
    if (recoveredSession.current === session.accessToken) return;
    recoveredSession.current = session.accessToken;
    void getAvailablePurchases()
      .then(async (purchases) => {
        for (const purchase of purchases) {
          if (
            Platform.OS === 'android' &&
            shouldRecoverAndroidPurchase(purchase)
          ) {
            await verifyAndFinish(purchase);
          }
        }
      })
      .catch(() => {
        setError(
          'We could not recover unfinished purchases. Please try Restore Purchases.',
        );
      });
  }, [connected, session, verifyAndFinish]);

  const purchase = useCallback(
    async (productId: string) => {
      setError(null);
      if (!connected) {
        setError('Connect to the App Store or Play Store before purchasing.');
        return;
      }
      const type = resolveStoreProductType(catalog, productId);
      if (!type) {
        setError('This product is not available in the store catalog.');
        return;
      }
      await requestPurchase({
        type,
        request:
          Platform.OS === 'ios'
            ? { apple: { sku: productId } }
            : { google: { skus: [productId] } },
      });
    },
    [catalog, connected, requestPurchase],
  );

  const restore = useCallback(async () => {
    setError(null);
    const restoredPurchases = await getAvailablePurchases({
      onlyIncludeActiveItemsIOS: true,
    });
    for (const restoredPurchase of restoredPurchases) {
      await verifyAndFinish(restoredPurchase);
    }
  }, [verifyAndFinish]);

  const value = useMemo<StorePurchaseContextValue>(
    () => ({
      connected,
      error,
      lastVerifiedProductId,
      pending: processing || verification.isPending,
      price: (productId) =>
        [...products, ...subscriptions].find(
          (product) => product.id === productId,
        )?.displayPrice,
      purchase,
      restore,
      verificationSequence,
    }),
    [
      connected,
      error,
      lastVerifiedProductId,
      processing,
      products,
      purchase,
      restore,
      subscriptions,
      verification.isPending,
      verificationSequence,
    ],
  );

  return (
    <StorePurchaseContext.Provider value={value}>
      {children}
    </StorePurchaseContext.Provider>
  );
}

export function useStorePurchases(): StorePurchaseContextValue {
  const context = useContext(StorePurchaseContext);
  if (!context)
    throw new Error('useStorePurchases requires StorePurchasesProvider.');
  return context;
}
