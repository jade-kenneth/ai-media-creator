import type {
  OrganizationPickerRecordFragment,
  OrganizationsQuery,
  OrganizationsQueryVariables,
} from '@/react-query/generated__types';
import type { GraphqlRequestOptions } from '@/react-query/graphql-client';

import { publicClient } from '../graphql-client';
import { defineQuery } from '../utils';
import { ORGANIZATIONS_QUERY } from './graphql/organizations';

export type OrganizationPickerRecord = OrganizationPickerRecordFragment;

export const organizationsQueryKeys = {
  all: ['organizations'] as const,
  list: (variables?: OrganizationsQueryVariables) =>
    [...organizationsQueryKeys.all, 'list', variables ?? {}] as const,
};

export function organizationsRequest(
  variables?: OrganizationsQueryVariables,
  options?: GraphqlRequestOptions,
) {
  return publicClient.request<OrganizationsQuery, OrganizationsQueryVariables>(
    ORGANIZATIONS_QUERY,
    variables,
    options,
  );
}

export const useOrganizationsQuery = defineQuery<
  OrganizationsQuery,
  OrganizationsQueryVariables
>({
  queryFn: async (variables, context) => {
    const result = await organizationsRequest(variables, {
      signal: context?.signal,
    });
    if (result.ok) return result.data;
    const error = new Error(result.error.message);
    error.name = result.error.name;
    throw error;
  },
  queryKey: (variables) => organizationsQueryKeys.list(variables),
  staleTime: 24 * 60 * 60 * 1000,
  gcTime: 24 * 60 * 60 * 1000,
  // The global default is `refetchOnMount: 'always'`, which fires a network
  // request every time the picker mounts even though the list rarely changes.
  // Respect staleTime instead so reopening the picker shows the cached list
  // instantly and keeps the "Proceed" button from spinning on a background
  // refetch.
  refetchOnMount: true,
  // First screen in the app: fail fast to the visible "Try again" UI rather
  // than burning ~45s on three timed-out attempts.
  retry: 1,
});
