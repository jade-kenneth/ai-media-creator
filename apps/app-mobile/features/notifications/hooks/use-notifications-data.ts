import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import {
  SortDirection,
  type MyNotificationsQueryVariables,
} from "@/react-query/generated__types";
import type { NotificationRecord } from "@/react-query/notifications/notifications-operations";
import {
  notificationsQueryKeys,
  useMyNotificationsQuery,
} from "@/react-query/notifications/notifications-operations";

const PAGE_SIZE = 20;

const LIST_VARIABLES: MyNotificationsQueryVariables = {
  first: PAGE_SIZE,
  sort: { createdAt: SortDirection.Desc },
};

export function useNotificationsData() {
  const queryClient = useQueryClient();

  const query = useMyNotificationsQuery(LIST_VARIABLES);

  const notifications: NotificationRecord[] =
    query.data?.pages.flatMap((page) =>
      page.myNotifications.edges.map((edge) => edge.node)
    ) ?? [];

  // unreadCount comes from the first page (consistent across pages)
  const unreadCount = query.data?.pages[0]?.myNotifications.unreadCount ?? 0;
  const totalCount =
    query.data?.pages[0]?.myNotifications.totalCount ?? notifications.length;

  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: notificationsQueryKeys.all,
    });
  }, [queryClient]);

  const handleEndReached = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage();
    }
  }, [query]);

  return {
    notifications,
    totalCount,
    unreadCount,
    isLoading: query.isLoading,
    isRefreshing: query.isRefetching && !query.isFetchingNextPage,
    isError: query.isError,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    onRefresh,
    handleEndReached,
    retry: query.refetch,
  };
}
