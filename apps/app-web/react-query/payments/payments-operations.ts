import type {
  CreatePaymentMutation,
  CreatePaymentMutationVariables,
  MyPaymentsQuery,
  PaymentQuery,
  PaymentQueryVariables,
} from '@/react-query/generated__types';
import { client } from '../graphql-client';
import { defineMutation, defineQuery } from '../utils';
import {
  CREATE_PAYMENT_MUTATION,
  MY_PAYMENTS_QUERY,
  PAYMENT_QUERY,
} from './graphql/payments';

export const paymentsQueryKeys = {
  all: ['payments'] as const,
  detail: (id: string) => ['payments', 'detail', id] as const,
};

export const useCreatePaymentMutation = defineMutation<
  CreatePaymentMutation,
  CreatePaymentMutationVariables
>({
  mutationFn: async (variables?: CreatePaymentMutationVariables) => {
    if (!variables) {
      return Promise.reject(new Error('Payment variables are required.'));
    }
    const res = await client.request<
      CreatePaymentMutation,
      CreatePaymentMutationVariables
    >(CREATE_PAYMENT_MUTATION, variables);

    if (!res.ok) {
      const err = new Error();
      err.name = res.error.name;
      err.message = res.error.message;
      throw err;
    }
    return res.data;
  },
  mutationKey: [...paymentsQueryKeys.all, 'create'],
});

export const usePaymentQuery = defineQuery<PaymentQuery, PaymentQueryVariables>(
  {
    queryFn: async (input?: PaymentQueryVariables) => {
      if (!input) {
        throw new Error('A payment id is required.');
      }
      const res = await client.request<PaymentQuery, PaymentQueryVariables>(
        PAYMENT_QUERY,
        input,
      );

      if (!res.ok) {
        const err = new Error();
        err.name = res.error.name;
        err.message = res.error.message;
        throw err;
      }
      return res.data;
    },
    queryKey: (input) => paymentsQueryKeys.detail(input?.id ?? ''),
  },
);

export const useMyPaymentsQuery = defineQuery<MyPaymentsQuery>({
  queryFn: async () => {
    const res = await client.request<MyPaymentsQuery>(MY_PAYMENTS_QUERY);

    if (!res.ok) {
      const err = new Error();
      err.name = res.error.name;
      err.message = res.error.message;
      throw err;
    }
    return res.data;
  },
  queryKey: [...paymentsQueryKeys.all, 'mine'],
});
