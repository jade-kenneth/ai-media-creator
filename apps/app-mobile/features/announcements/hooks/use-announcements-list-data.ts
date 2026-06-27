import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import {
  announcementsQueryKeys,
  useAnnouncementsQuery,
} from '@/react-query/announcements/announcements-operations';
import {
  type AnnouncementCategory,
  type AnnouncementRecordFragment,
  AnnouncementSortField,
  SortDirection,
} from '@/react-query/generated__types';

const PAGE_SIZE = 10;

export function useAnnouncementsListData() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] =
    useState<AnnouncementCategory | null>(null);

  const variables = {
    first: PAGE_SIZE,
    sort: {
      field: AnnouncementSortField.PublishedAt,
      direction: SortDirection.Desc,
    },
    ...(selectedCategory
      ? { filter: { category: { equal: selectedCategory } } }
      : {}),
  };

  const query = useAnnouncementsQuery(variables, {
    staleTime: 60_000,
  });

  const allAnnouncements: AnnouncementRecordFragment[] =
    query.data?.pages.flatMap((page) =>
      page.announcements.edges.map((edge) => edge.node),
    ) ?? [];

  // Separate pinned from non-pinned, but only when no filter is active
  // so pinned items always appear at the top of the "All" list
  const pinned = selectedCategory
    ? []
    : allAnnouncements.filter((a) => a.isPinned);
  const regular = selectedCategory
    ? allAnnouncements
    : allAnnouncements.filter((a) => !a.isPinned);

  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: announcementsQueryKeys.all });
  }, [queryClient]);

  const onSelectCategory = useCallback(
    (category: AnnouncementCategory | null) => {
      setSelectedCategory(category);
    },
    [],
  );

  return {
    pinned,
    regular,
    allAnnouncements,
    selectedCategory,
    onSelectCategory,
    isLoading: query.isLoading,
    isRefreshing: query.isRefetching && !query.isFetchingNextPage,
    isError: query.isError,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    onRefresh,
    retry: query.refetch,
    totalCount: query.data?.pages[0]?.announcements.totalCount ?? 0,
  };
}
