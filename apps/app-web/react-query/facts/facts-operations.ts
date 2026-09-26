import type {
  AddProductFactMutation,
  AddProductFactMutationVariables,
  ContinueToFactsMutation,
  ContinueToFactsMutationVariables,
  ProductFactRecordFragment,
  ProductFactsQuery,
  ProductFactsQueryVariables,
  RemoveProductFactMutation,
  RemoveProductFactMutationVariables,
  SetProductFactStatusMutation,
  SetProductFactStatusMutationVariables,
  UpdateProductFactTextMutation,
  UpdateProductFactTextMutationVariables,
} from '@/react-query/generated__types';
import { client } from '@/react-query/graphql-client';
import { unwrapGraphqlResult } from '@/react-query/graphql-error';
import { defineMutation, defineQuery } from '@/react-query/utils';

import {
  ADD_PRODUCT_FACT_MUTATION,
  CONTINUE_TO_FACTS_MUTATION,
  PRODUCT_FACTS_QUERY,
  REMOVE_PRODUCT_FACT_MUTATION,
  SET_PRODUCT_FACT_STATUS_MUTATION,
  UPDATE_PRODUCT_FACT_TEXT_MUTATION,
} from './graphql/facts';

export type ProductFact = ProductFactRecordFragment;

export const factsQueryKeys = {
  all: ['facts'] as const,
  list: (projectId: string) => ['facts', 'list', projectId] as const,
};

export const useProductFactsQuery = defineQuery<
  ProductFactsQuery,
  ProductFactsQueryVariables
>({
  queryKey: (input) => factsQueryKeys.list(input?.projectId ?? ''),
  queryFn: async (input, context) => {
    if (!input) throw new Error('A project id is required.');

    return unwrapGraphqlResult(
      await client.request<ProductFactsQuery, ProductFactsQueryVariables>(
        PRODUCT_FACTS_QUERY,
        input,
        { signal: context?.signal },
      ),
    );
  },
});

export const useContinueToFactsMutation = defineMutation<
  ContinueToFactsMutation,
  ContinueToFactsMutationVariables
>({
  mutationKey: ['facts', 'continue'],
  mutationFn: async (variables) => {
    if (!variables) throw new Error('A project id is required.');

    return unwrapGraphqlResult(
      await client.request<
        ContinueToFactsMutation,
        ContinueToFactsMutationVariables
      >(CONTINUE_TO_FACTS_MUTATION, variables),
    );
  },
});

export const useAddProductFactMutation = defineMutation<
  AddProductFactMutation,
  AddProductFactMutationVariables
>({
  mutationKey: ['facts', 'add'],
  mutationFn: async (variables) => {
    if (!variables) throw new Error('A fact is required.');

    return unwrapGraphqlResult(
      await client.request<AddProductFactMutation, AddProductFactMutationVariables>(
        ADD_PRODUCT_FACT_MUTATION,
        variables,
      ),
    );
  },
});

export const useUpdateProductFactTextMutation = defineMutation<
  UpdateProductFactTextMutation,
  UpdateProductFactTextMutationVariables
>({
  mutationKey: ['facts', 'update-text'],
  mutationFn: async (variables) => {
    if (!variables) throw new Error('New wording is required.');

    return unwrapGraphqlResult(
      await client.request<
        UpdateProductFactTextMutation,
        UpdateProductFactTextMutationVariables
      >(UPDATE_PRODUCT_FACT_TEXT_MUTATION, variables),
    );
  },
});

export const useSetProductFactStatusMutation = defineMutation<
  SetProductFactStatusMutation,
  SetProductFactStatusMutationVariables
>({
  mutationKey: ['facts', 'set-status'],
  mutationFn: async (variables) => {
    if (!variables) throw new Error('A status is required.');

    return unwrapGraphqlResult(
      await client.request<
        SetProductFactStatusMutation,
        SetProductFactStatusMutationVariables
      >(SET_PRODUCT_FACT_STATUS_MUTATION, variables),
    );
  },
});

export const useRemoveProductFactMutation = defineMutation<
  RemoveProductFactMutation,
  RemoveProductFactMutationVariables
>({
  mutationKey: ['facts', 'remove'],
  mutationFn: async (variables) => {
    if (!variables) throw new Error('A fact id is required.');

    return unwrapGraphqlResult(
      await client.request<
        RemoveProductFactMutation,
        RemoveProductFactMutationVariables
      >(REMOVE_PRODUCT_FACT_MUTATION, variables),
    );
  },
});
