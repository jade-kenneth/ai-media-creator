import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/ui/empty-state';
import { ErrorScreen } from '@/components/ui/error-screen';
import { SectionHeader } from '@/components/ui/section-header';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type { AnnouncementRecordFragment } from '@/react-query/generated__types';

import { AnnouncementListItem } from './components/announcement-list-item';
import { FilterChips } from './components/filter-chips';
import { SkeletonCard } from './components/skeleton-card';
import { useAnnouncementsListData } from './hooks/use-announcements-list-data';

const SKELETON_ITEMS = Array.from({ length: 6 }, (_, i) => `skeleton-${i}`);

type ListItem =
  | { type: 'pinned-header' }
  | { type: 'regular-header' }
  | { type: 'announcement'; data: AnnouncementRecordFragment };

export function AnnouncementsScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const router = useRouter();

  const {
    pinned,
    regular,
    selectedCategory,
    onSelectCategory,
    isLoading,
    isRefreshing,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    onRefresh,
    retry,
    totalCount,
  } = useAnnouncementsListData();

  const navigateToDetail = useCallback(
    (id: string) => {
      router.push(`/announcements/${id}`);
    },
    [router],
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Combine pinned + regular into a single list with section markers
  const listData: ListItem[] = useMemo(() => {
    const items: ListItem[] = [];

    if (pinned.length > 0) {
      items.push({ type: 'pinned-header' });
      for (const item of pinned) {
        items.push({ type: 'announcement', data: item });
      }
    }

    if (regular.length > 0 && pinned.length > 0) {
      items.push({ type: 'regular-header' });
    }

    for (const item of regular) {
      items.push({ type: 'announcement', data: item });
    }

    return items;
  }, [pinned, regular]);

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      switch (item.type) {
        case 'pinned-header':
          return (
            <View className="px-5 pb-1 pt-2">
              <SectionHeader title={t('announcements.pinned')} />
            </View>
          );
        case 'regular-header':
          return (
            <View className="px-5 pb-1 pt-4">
              <SectionHeader title={t('announcements.latest')} />
            </View>
          );
        case 'announcement':
          return (
            <View className="px-5">
              <AnnouncementListItem
                announcement={item.data}
                onPress={navigateToDetail}
              />
            </View>
          );
      }
    },
    [navigateToDetail, t],
  );

  const renderSkeletonItem = useCallback(
    ({ index }: { index: number }) => (
      <SkeletonCard withImage={index === 0 || index === 2} />
    ),
    [],
  );

  const keyExtractor = useCallback((item: ListItem, index: number) => {
    if (item.type === 'announcement') return item.data.id;
    return `${item.type}-${index}`;
  }, []);

  const ListFooter = useCallback(() => {
    if (isFetchingNextPage) {
      return (
        <View className="items-center py-6">
          <ActivityIndicator color={colors.primary} size="small" />
        </View>
      );
    }
    return <View className="h-6" />;
  }, [colors.primary, isFetchingNextPage]);

  // Error state
  if (isError && !isLoading) {
    return (
      <ErrorScreen
        description={t('announcements.unableToLoadDescription')}
        onRetry={() => retry()}
        title={t('announcements.unableToLoadTitle')}
      />
    );
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <SafeAreaView
        className="flex-1"
        edges={['top']}
        style={{ backgroundColor: colors.screenBg }}
      >
        <View className="py-3">
          <FilterChips selected={null} onSelect={() => undefined} />
        </View>
        <FlatList
          data={SKELETON_ITEMS}
          contentContainerClassName="gap-3 px-5 pb-6"
          keyExtractor={(item) => item}
          renderItem={renderSkeletonItem}
          scrollEnabled={false}
        />
      </SafeAreaView>
    );
  }

  // Empty state
  const isEmpty = listData.length === 0;

  return (
    <SafeAreaView
      className="flex-1"
      edges={['bottom']}
      style={{ backgroundColor: colors.screenBg }}
    >
      {/* Category filter chips */}
      <View className="py-3">
        <FilterChips selected={selectedCategory} onSelect={onSelectCategory} />
      </View>

      {isEmpty ? (
        <View className="flex-1 justify-center px-5">
          <EmptyState
            description={
              selectedCategory
                ? 'No announcements match the selected category. Try another filter.'
                : 'No announcements have been published yet. Check back later!'
            }
            icon="megaphone.fill"
            iconFallback={
              <Text
                className="text-2xl font-semibold"
                style={{ color: colors.primary }}
              >
                📢
              </Text>
            }
            title={
              selectedCategory
                ? 'No matching announcements'
                : 'No announcements'
            }
            actionLabel={selectedCategory ? 'Clear filter' : undefined}
            onAction={
              selectedCategory ? () => onSelectCategory(null) : undefined
            }
          />
        </View>
      ) : (
        <FlatList
          data={listData}
          contentContainerClassName="gap-3 pb-6"
          keyExtractor={keyExtractor}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          renderItem={renderItem}
          ListFooterComponent={ListFooter}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Total count indicator */}
      {!isEmpty && totalCount > 0 ? (
        <View
          className="border-t px-5 py-2"
          style={{
            backgroundColor: colors.cardBg,
            borderColor: colors.border,
            borderTopWidth: 0.5,
          }}
        >
          <Text
            className="text-center text-xs"
            style={{ color: colors.mutedText }}
          >
            {totalCount} announcement{totalCount !== 1 ? 's' : ''}
          </Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
