import { useCallback, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';

import { queryClient } from '@/providers/query-provider';
import {
  paymentsQueryKeys,
  useCreatePaymentMutation,
} from '@/react-query/payments/payments-operations';
import type {
  CreatePaymentInput,
  PaymentStatus,
} from '@/react-query/generated__types';

export type PaymentCheckoutResult = {
  paymentId: string;
  /**
   * How the in-app browser closed. Dismissing it proves nothing about the
   * payment — only the provider webhook settles a payment, so always re-read
   * the payment before showing the payer a result.
   */
  browserOutcome: 'completed' | 'dismissed' | 'unavailable';
  status: PaymentStatus;
};

/**
 * Creates a payment and sends the payer to the provider's checkout page in an
 * in-app browser.
 */
export function usePaymentCheckout() {
  const createPaymentMutation = useCreatePaymentMutation();
  const [isOpeningCheckout, setIsOpeningCheckout] = useState(false);

  const startCheckout = useCallback(
    async (input: CreatePaymentInput): Promise<PaymentCheckoutResult> => {
      const created = await createPaymentMutation.mutateAsync({ input });
      const payment = created.createPayment;

      if (!payment.redirectUrl) {
        return {
          paymentId: payment.id,
          browserOutcome: 'unavailable',
          status: payment.status,
        };
      }

      setIsOpeningCheckout(true);

      try {
        const result = await WebBrowser.openBrowserAsync(payment.redirectUrl);

        // The payment record is now stale: settle it from the API, not from
        // how the browser closed.
        await queryClient.invalidateQueries({
          queryKey: paymentsQueryKeys.all,
        });

        return {
          paymentId: payment.id,
          browserOutcome:
            result.type === 'cancel' || result.type === 'dismiss'
              ? 'dismissed'
              : 'completed',
          status: payment.status,
        };
      } finally {
        setIsOpeningCheckout(false);
      }
    },
    [createPaymentMutation],
  );

  return {
    startCheckout,
    isPending: createPaymentMutation.isPending || isOpeningCheckout,
    error: createPaymentMutation.error,
  };
}
