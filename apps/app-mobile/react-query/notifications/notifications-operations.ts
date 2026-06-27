import type {
  MarkAllNotificationsAsReadMutation,
  MarkAllNotificationsAsReadMutationVariables,
  MarkNotificationAsReadMutation,
  MarkNotificationAsReadMutationVariables,
  MyNotificationsQuery,
  MyNotificationsQueryVariables,
  NotificationRecordFragment,
} from "@/react-query/generated__types";
import type {
  GraphqlRequestOptions,
  GraphqlRequestResult,
} from "@/react-query/graphql-client";

import { client } from "@/react-query/graphql-client";
import { defineInfiniteQuery, defineMutation } from "@/react-query/utils";

import {
  MARK_ALL_NOTIFICATIONS_AS_READ_MUTATION,
  MARK_NOTIFICATION_AS_READ_MUTATION,
  MY_NOTIFICATIONS_QUERY,
} from "./graphql/notifications";

export type NotificationRecord = NotificationRecordFragment;

export const notificationsQueryKeys = {
  all: ["notifications"] as const,
  list: (variables?: Omit<MyNotificationsQueryVariables, "after">) =>
    [...notificationsQueryKeys.all, "list", variables ?? {}] as const,
};

function unwrapGraphqlResult<Data extends Record<string, unknown>>(
  result: GraphqlRequestResult<Data>
) {
  if (result.ok) {
    return result.data;
  }
  const error = new Error(result.error.message);
  error.name = result.error.name;
  throw error;
}

function normalizeListVariables(variables?: MyNotificationsQueryVariables) {
  if (!variables) return undefined;
  const { after: _after, ...rest } = variables;
  return rest;
}

/* ------------------------------------------------------------------ */
/*  Request helpers                                                    */
/* ------------------------------------------------------------------ */

export function myNotificationsRequest(
  variables?: MyNotificationsQueryVariables,
  options?: GraphqlRequestOptions
) {
  return client.request<MyNotificationsQuery, MyNotificationsQueryVariables>(
    MY_NOTIFICATIONS_QUERY,
    variables,
    options
  );
}

export function markNotificationAsReadRequest(
  variables: MarkNotificationAsReadMutationVariables,
  options?: GraphqlRequestOptions
) {
  return client.request<
    MarkNotificationAsReadMutation,
    MarkNotificationAsReadMutationVariables
  >(MARK_NOTIFICATION_AS_READ_MUTATION, variables, options);
}

export function markAllNotificationsAsReadRequest(
  options?: GraphqlRequestOptions
) {
  return client.request<
    MarkAllNotificationsAsReadMutation,
    MarkAllNotificationsAsReadMutationVariables
  >(MARK_ALL_NOTIFICATIONS_AS_READ_MUTATION, undefined, options);
}

/* ------------------------------------------------------------------ */
/*  Query hooks                                                        */
/* ------------------------------------------------------------------ */

export const useMyNotificationsQuery = defineInfiniteQuery<
  MyNotificationsQuery,
  MyNotificationsQueryVariables
>({
  queryFn: async (variables, context) => {
    const normalized = normalizeListVariables(variables);
    const result = await myNotificationsRequest(
      { ...normalized, after: context?.pageParam ?? null },
      { signal: context?.signal }
    );
    return unwrapGraphqlResult(result);
  },
  getNextPageParam: (data) =>
    data.myNotifications.pageInfo.hasNextPage
      ? data.myNotifications.pageInfo.endCursor ?? null
      : null,
  queryKey: (variables) =>
    notificationsQueryKeys.list(normalizeListVariables(variables)),
  staleTime: 30_000,
});

/* ------------------------------------------------------------------ */
/*  Mutation hooks                                                     */
/* ------------------------------------------------------------------ */

export const useMarkNotificationAsReadMutation = defineMutation<
  MarkNotificationAsReadMutation,
  MarkNotificationAsReadMutationVariables
>({
  mutationFn: async (variables) => {
    if (!variables) throw new Error("Notification ID is required.");
    return unwrapGraphqlResult(await markNotificationAsReadRequest(variables));
  },
  mutationKey: [...notificationsQueryKeys.all, "mark-read"],
});

export const useMarkAllNotificationsAsReadMutation = defineMutation<
  MarkAllNotificationsAsReadMutation,
  void
>({
  mutationFn: async () =>
    unwrapGraphqlResult(await markAllNotificationsAsReadRequest()),
  mutationKey: [...notificationsQueryKeys.all, "mark-all-read"],
});
