import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  SectionList,
  Text,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/ui/empty-state';
import { ErrorScreen } from '@/components/ui/error-screen';
import { PageHeader } from '@/components/ui/page-header';
import { SectionHeader } from '@/components/ui/section-header';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type { NotificationRecordFragment } from '@/react-query/generated__types';
import {
  notificationsQueryKeys,
  useMarkAllNotificationsAsReadMutation,
} from '@/react-query/notifications/notifications-operations';

import { NotificationItem } from './components/notification-item';
import { NotificationsListSkeleton } from './components/notifications-list-skeleton';
import { useNotificationsData } from './hooks/use-notifications-data';

type NotificationSection = {
  title: string;
  data: NotificationRecordFragment[];
};

type NotificationFilter = 'all' | 'unread' | 'read';

const FILTER_OPTIONS: {
  labelKey: 'all' | 'unread' | 'read';
  value: NotificationFilter;
}[] = [
  { labelKey: 'all', value: 'all' },
  { labelKey: 'unread', value: 'unread' },
  { labelKey: 'read', value: 'read' },
];

type NotificationSummaryCardProps = {
  isUpdating: boolean;
  onMarkAllRead: () => void;
  readCount: number;
  totalCount: number;
  unreadCount: number;
};

type NotificationMetricCardProps = {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  tone: 'neutral' | 'success' | 'warning';
  value: number;
};

function NotificationMetricCard({
  icon,
  label,
  tone,
  value,
}: NotificationMetricCardProps) {
  const colors = useThemeColors();
  const toneMap = {
    neutral: {
      backgroundColor: colors.subtleFill,
      color: colors.secondaryText,
    },
    success: {
      backgroundColor: colors.successBg,
      color: colors.successText,
    },
    warning: {
      backgroundColor: colors.goldPillBg,
      color: colors.goldPillText,
    },
  }[tone];

  return (
    <View
      className="min-h-[68px] flex-1 justify-between rounded-2xl px-3 py-2.5"
      style={{
        backgroundColor: toneMap.backgroundColor,
        borderCurve: 'continuous',
      }}
    >
      <View className="flex-row items-center justify-between gap-2">
        <Text
          selectable
          className="text-[11px] font-semibold uppercase"
          numberOfLines={1}
          style={{ color: colors.mutedText, letterSpacing: 0.5 }}
        >
          {label}
        </Text>
        <MaterialIcons
          accessibilityElementsHidden
          color={toneMap.color}
          importantForAccessibility="no"
          name={icon}
          size={16}
        />
      </View>
      <Text
        selectable
        className="text-[22px] font-bold leading-7"
        style={{ color: toneMap.color, fontVariant: ['tabular-nums'] }}
      >
        {value}
      </Text>
    </View>
  );
}

function NotificationSummaryCard({
  isUpdating,
  onMarkAllRead,
  readCount,
  totalCount,
  unreadCount,
}: NotificationSummaryCardProps) {
  const colors = useThemeColors();
  const hasUnread = unreadCount > 0;
  const readProgress =
    totalCount > 0 ? Math.min(Math.max(readCount / totalCount, 0), 1) : 1;
  const readPercent = Math.round(readProgress * 100);

  return (
    <View
      className="overflow-hidden rounded-[28px]"
      style={{
        backgroundColor: colors.cardBg,
        borderCurve: 'continuous',
        ...(Platform.OS === 'ios'
          ? {
              shadowColor: colors.cardShadowColor,
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: colors.isDark ? 0.18 : 0.1,
              shadowRadius: 22,
            }
          : {}),
        ...(Platform.OS === 'android' && !colors.isDark ? { elevation: 3 } : {}),
      }}
    >
      <LinearGradient
        colors={
          colors.isDark
            ? ['#1f2937', '#111827']
            : [colors.primary, '#1e40af']
        }
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
      >
        <View className="gap-4 px-4 py-4">
          <View className="flex-row items-start gap-3">
            <View
              className="h-12 w-12 items-center justify-center rounded-2xl"
              style={{
                backgroundColor: hasUnread
                  ? 'rgba(245,196,0,0.18)'
                  : 'rgba(255,255,255,0.12)',
                borderColor: 'rgba(255,255,255,0.18)',
                borderWidth: 0.5,
              }}
            >
              <MaterialIcons
                accessibilityElementsHidden
                color={hasUnread ? colors.accent : '#ffffff'}
                importantForAccessibility="no"
                name={hasUnread ? 'notifications-active' : 'verified'}
                size={25}
              />
            </View>

            <View className="min-w-0 flex-1 gap-1.5">
              <Text
                className="text-[11px] font-semibold uppercase"
                style={{ color: 'rgba(255,255,255,0.62)', letterSpacing: 0.8 }}
              >
                Notification inbox
              </Text>
              <Text
                selectable
                className="text-2xl font-bold leading-8"
                style={{ color: '#ffffff' }}
              >
                {hasUnread ? `${unreadCount} unread` : 'All caught up'}
              </Text>
              <Text
                selectable
                className="text-sm leading-5"
                numberOfLines={2}
                style={{ color: 'rgba(255,255,255,0.72)' }}
              >
                {hasUnread
                  ? 'Review organization updates and service request changes that need attention.'
                  : 'No pending alerts. New community updates will appear here.'}
              </Text>
            </View>
          </View>

          {hasUnread ? (
            <Pressable
              accessibilityLabel="Mark all unread notifications as read"
              accessibilityRole="button"
              className="min-h-12 flex-row items-center justify-center gap-2 rounded-2xl px-4 active:opacity-80"
              disabled={isUpdating}
              onPress={onMarkAllRead}
              style={{
                backgroundColor: isUpdating
                  ? 'rgba(255,255,255,0.12)'
                  : colors.accent,
                borderCurve: 'continuous',
              }}
            >
              {isUpdating ? (
                <ActivityIndicator
                  color="rgba(255,255,255,0.72)"
                  size="small"
                />
              ) : (
                <MaterialIcons
                  accessibilityElementsHidden
                  color={colors.primary}
                  importantForAccessibility="no"
                  name="done-all"
                  size={18}
                />
              )}
              <Text
                className="text-sm font-bold"
                style={{
                  color: isUpdating ? 'rgba(255,255,255,0.72)' : colors.primary,
                }}
              >
                {isUpdating ? 'Updating...' : 'Mark all as read'}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </LinearGradient>

      <View className="gap-4 px-4 py-4">
        <View className="flex-row gap-2">
          <NotificationMetricCard
            icon="inbox"
            label="Total"
            tone="neutral"
            value={totalCount}
          />
          <NotificationMetricCard
            icon="done-all"
            label="Read"
            tone="success"
            value={readCount}
          />
          <NotificationMetricCard
            icon="priority-high"
            label="Unread"
            tone={hasUnread ? 'warning' : 'neutral'}
            value={unreadCount}
          />
        </View>

        <View
          className="rounded-2xl px-3 py-3"
          style={{ backgroundColor: colors.subtleFill, borderCurve: 'continuous' }}
        >
          <View className="flex-row items-center justify-between gap-3">
            <Text
              selectable
              className="text-xs font-semibold"
              style={{ color: colors.secondaryText }}
            >
              Read progress
            </Text>
            <Text
              selectable
              className="text-xs font-bold"
              style={{ color: colors.bodyText, fontVariant: ['tabular-nums'] }}
            >
              {readPercent}%
            </Text>
          </View>
          <View
            className="mt-2 h-1.5 overflow-hidden rounded-full"
            style={{ backgroundColor: colors.cardBg }}
          >
            <View
              className="h-full rounded-full"
              style={{
                backgroundColor: hasUnread ? colors.accent : colors.successText,
                width: `${readProgress * 100}%`,
              }}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

type NotificationFilterChipsProps = {
  activeFilter: NotificationFilter;
  readCount: number;
  totalCount: number;
  unreadCount: number;
  onChange: (filter: NotificationFilter) => void;
};

function NotificationFilterChips({
  activeFilter,
  readCount,
  totalCount,
  unreadCount,
  onChange,
}: NotificationFilterChipsProps) {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const counts: Record<NotificationFilter, number> = {
    all: totalCount,
    unread: unreadCount,
    read: readCount,
  };

  return (
    <View
      className="mx-5 flex-row gap-1 rounded-[18px] border p-1"
      style={{
        backgroundColor: colors.cardBg,
        borderColor: colors.cardBorder,
        borderWidth: 0.5,
        borderCurve: 'continuous',
      }}
    >
      {FILTER_OPTIONS.map((option) => {
        const isSelected = activeFilter === option.value;
        return (
          <Pressable
            key={option.value}
            accessibilityLabel={t(`notifications.${option.labelKey}`)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            className="min-h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-[14px] px-2 active:opacity-80"
            onPress={() => onChange(option.value)}
            style={{
              backgroundColor: isSelected ? colors.primary : 'transparent',
              borderCurve: 'continuous',
            }}
          >
            <Text
              className="text-sm font-semibold"
              numberOfLines={1}
              style={{ color: isSelected ? '#ffffff' : colors.secondaryText }}
            >
              {t(`notifications.${option.labelKey}`)}
            </Text>
            <View
              className="min-w-6 items-center rounded-full px-1.5 py-0.5"
              style={{
                backgroundColor: isSelected
                  ? 'rgba(255,255,255,0.18)'
                  : colors.subtleFill,
              }}
            >
              <Text
                className="text-[11px] font-semibold"
                style={{ color: isSelected ? '#ffffff' : colors.mutedText }}
              >
                {counts[option.value]}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export function NotificationsScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const [activeFilter, setActiveFilter] =
    useState<NotificationFilter>('all');

  const {
    notifications,
    totalCount,
    unreadCount,
    isLoading,
    isRefreshing,
    isError,
    isFetchingNextPage,
    onRefresh,
    handleEndReached,
    retry,
  } = useNotificationsData();

  const markAllRead = useMarkAllNotificationsAsReadMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsQueryKeys.all });
    },
  });

  useFocusEffect(
    useCallback(() => {
      void Notifications.setBadgeCountAsync(0).catch(() => {
        // Ignore badge update failures.
      });
    }, []),
  );

  const unreadItems = useMemo(
    () => notifications.filter((notification) => !notification.isRead),
    [notifications],
  );
  const readItems = useMemo(
    () => notifications.filter((notification) => notification.isRead),
    [notifications],
  );
  const readCount = Math.max(totalCount - unreadCount, 0);

  const sections: NotificationSection[] = useMemo(
    () => [
      ...(activeFilter !== 'read' && unreadItems.length > 0
        ? [{ title: t('notifications.new'), data: unreadItems }]
        : []),
      ...(activeFilter !== 'unread' && readItems.length > 0
        ? [{ title: t('notifications.earlier'), data: readItems }]
        : []),
    ],
    [activeFilter, readItems, t, unreadItems],
  );

  const renderItem = useCallback(
    ({ item }: { item: NotificationRecordFragment }) => (
      <View className="px-5 pb-3">
        <NotificationItem notification={item} />
      </View>
    ),
    [],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: NotificationSection }) => (
      <View className="px-5 pb-2 pt-5">
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-row items-center gap-2">
            <View
              className="h-7 w-7 items-center justify-center rounded-full"
              style={{
                backgroundColor:
                  section.title === t('notifications.new')
                    ? colors.goldPillBg
                    : colors.subtleFill,
              }}
            >
              <MaterialIcons
                accessibilityElementsHidden
                color={
                  section.title === t('notifications.new')
                    ? colors.goldPillText
                    : colors.secondaryText
                }
                importantForAccessibility="no"
                name={section.title === 'New' ? 'bolt' : 'history'}
                size={15}
              />
            </View>
            <SectionHeader title={section.title} />
          </View>
          <View
            className="rounded-full px-2.5 py-1"
            style={{ backgroundColor: colors.subtleFill }}
          >
            <Text
              selectable
              className="text-[11px] font-semibold"
              style={{ color: colors.secondaryText }}
            >
              {section.data.length}
            </Text>
          </View>
        </View>
      </View>
    ),
    [
      colors.goldPillBg,
      colors.goldPillText,
      colors.secondaryText,
      colors.subtleFill,
      t,
    ],
  );

  const keyExtractor = useCallback(
    (item: NotificationRecordFragment) => item.id,
    [],
  );

  const ListFooter = useCallback(() => {
    if (isFetchingNextPage) {
      return (
        <View className="items-center py-6">
          <ActivityIndicator color={colors.primary} size="small" />
        </View>
      );
    }
    return <View className="h-4" />;
  }, [isFetchingNextPage, colors.primary]);

  if (isError && !isLoading) {
    return (
      <ErrorScreen
        description={t('notifications.unableToLoadDescription')}
        onRetry={() => retry()}
        title={t('notifications.unableToLoadTitle')}
      />
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView
        edges={['top']}
        className="flex-1"
        style={{ backgroundColor: colors.screenBg }}
      >
        <View className="px-5 pb-3 pt-4">
          <View
            className="h-7 w-44 rounded-md"
            style={{ backgroundColor: colors.subtleFill }}
          />
          <View
            className="mt-1.5 h-4 w-24 rounded-md"
            style={{ backgroundColor: colors.subtleFill }}
          />
        </View>
        <NotificationsListSkeleton />
      </SafeAreaView>
    );
  }

  const isEmpty = notifications.length === 0;
  const isFilteredEmpty = sections.length === 0;

  return (
    <SafeAreaView
      edges={['top']}
      className="flex-1"
      style={{ backgroundColor: colors.screenBg }}
    >
      <PageHeader
        title={t('notifications.title')}
        subtitle={
          unreadCount > 0
            ? t('notifications.unreadSummary', {
                unread: unreadCount,
                total: totalCount,
              })
            : t('notifications.caughtUpSummary', { total: totalCount })
        }
      />

      {isEmpty ? (
        <View className="flex-1 justify-center px-5">
          <EmptyState
            description={t('notifications.emptyDescription')}
            icon="bell.fill"
            iconFallback={
              <MaterialIcons
                color={colors.primary}
                name="notifications"
                size={28}
              />
            }
            title={t('notifications.emptyTitle')}
          />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled={false}
          ListEmptyComponent={
            isFilteredEmpty ? (
              <View className="px-5 py-12">
                <EmptyState
                  description={
                    activeFilter === 'unread'
                      ? t('notifications.noUnreadDescription')
                      : t('notifications.nothingReadDescription')
                  }
                  icon="bell.badge.fill"
                  iconFallback={
                    <MaterialIcons
                      color={colors.primary}
                      name={
                        activeFilter === 'unread'
                          ? 'notifications-none'
                          : 'done-all'
                      }
                      size={28}
                    />
                  }
                  title={
                    activeFilter === 'unread'
                      ? t('notifications.noUnreadTitle')
                      : t('notifications.nothingReadTitle')
                  }
                />
              </View>
            ) : null
          }
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={
            <View className="gap-4 pb-1 pt-2">
              <View className="px-5">
                <NotificationSummaryCard
                  isUpdating={markAllRead.isPending}
                  onMarkAllRead={() => markAllRead.mutate()}
                  readCount={readCount}
                  totalCount={totalCount}
                  unreadCount={unreadCount}
                />
              </View>
              <NotificationFilterChips
                activeFilter={activeFilter}
                onChange={setActiveFilter}
                readCount={readCount}
                totalCount={totalCount}
                unreadCount={unreadCount}
              />
            </View>
          }
          ListFooterComponent={ListFooter}
          contentContainerStyle={{
            paddingBottom: tabBarHeight + insets.bottom,
          }}
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
    </SafeAreaView>
  );
}
