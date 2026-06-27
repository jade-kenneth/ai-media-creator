import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { memo, useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useThemeColors } from '@/hooks/use-theme-colors';
import {
  announcementRequest,
  announcementsQueryKeys,
} from '@/react-query/announcements/announcements-operations';
import type { NotificationRecordFragment } from '@/react-query/generated__types';
import { NotificationType } from '@/react-query/generated__types';
import {
  notificationsQueryKeys,
  useMarkNotificationAsReadMutation,
} from '@/react-query/notifications/notifications-operations';
import { formatAnnouncementTime } from '@/utils/date';

type NotificationItemProps = {
  notification: NotificationRecordFragment;
};

const ANNOUNCEMENT_TYPES = new Set<NotificationType>([
  NotificationType.Announcement,
  NotificationType.EmergencyAnnouncement,
]);

const REGISTRATION_TYPES = new Set<NotificationType>([
  NotificationType.RegistrationApproved,
  NotificationType.RegistrationRejected,
]);

type TypeMeta = {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  iconColor: string;
  iconBg: string;
};

function getTypeMeta(
  type: NotificationType,
  colors: ReturnType<typeof useThemeColors>,
): TypeMeta {
  if (ANNOUNCEMENT_TYPES.has(type)) {
    return {
      icon: 'campaign',
      label: 'Announcement',
      iconColor: colors.accentDark,
      iconBg: colors.goldPillBg,
    };
  }
  if (REGISTRATION_TYPES.has(type)) {
    const isApproved = type === NotificationType.RegistrationApproved;

    return {
      icon: isApproved ? 'verified' : 'gpp-bad',
      label: 'Registration',
      iconColor: isApproved ? colors.successText : colors.error,
      iconBg: isApproved ? colors.successBg : colors.errorBg,
    };
  }
  return {
    icon: 'notifications',
    label: 'Notification',
    iconColor: colors.secondaryText,
    iconBg: colors.subtleFill,
  };
}

function resolveNavTarget(
  type: NotificationType,
  relatedEntityId?: string | null,
): string | null {
  if (type === NotificationType.RegistrationApproved) {
    return '/(main)/(tabs)';
  }
  if (type === NotificationType.RegistrationRejected) {
    return '/(auth)/registration-rejected';
  }
  if (!relatedEntityId) return null;
  if (ANNOUNCEMENT_TYPES.has(type))
    return `/(main)/announcements/${relatedEntityId}`;
  return null;
}

function NotificationItemComponent({ notification }: NotificationItemProps) {
  const colors = useThemeColors();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isRead = notification.isRead;
  const typeMeta = getTypeMeta(notification.type, colors);
  const target = resolveNavTarget(
    notification.type,
    notification.relatedEntityId,
  );
  const hasTarget = Boolean(target);

  const markAsRead = useMarkNotificationAsReadMutation({
    onSuccess: (data) => {
      queryClient.setQueriesData(
        { queryKey: notificationsQueryKeys.list() },
        (old: unknown) => {
          if (!old || typeof old !== 'object') return old;
          const pages = (
            old as {
              pages: {
                myNotifications: {
                  edges: { node: NotificationRecordFragment }[];
                  unreadCount: number;
                };
              }[];
            }
          ).pages;
          const updatedPages = pages.map((page) => ({
            ...page,
            myNotifications: {
              ...page.myNotifications,
              unreadCount: Math.max(
                0,
                page.myNotifications.unreadCount -
                  (notification.isRead ? 0 : 1),
              ),
              edges: page.myNotifications.edges.map((edge) =>
                edge.node.id === data.markNotificationAsRead.id
                  ? { ...edge, node: data.markNotificationAsRead }
                  : edge,
              ),
            },
          }));
          return { ...old, pages: updatedPages };
        },
      );
    },
  });

  const prefetchTarget = useCallback(async () => {
    if (
      ANNOUNCEMENT_TYPES.has(notification.type) &&
      notification.relatedEntityId
    ) {
      const id = notification.relatedEntityId;
      await queryClient.prefetchQuery({
        queryKey: announcementsQueryKeys.detail(id),
        queryFn: async () => {
          const result = await announcementRequest({ id });
          if (!result.ok) {
            const error = new Error(result.error.message);
            error.name = result.error.name;
            throw error;
          }

          return result.data;
        },
      });
    }
  }, [notification.relatedEntityId, notification.type, queryClient]);

  const handlePress = useCallback(async () => {
    if (!notification.isRead) {
      markAsRead.mutate({ id: notification.id });
    }
    if (target) {
      await Promise.allSettled([prefetchTarget()]);
      router.push(target as Parameters<typeof router.push>[0]);
    }
  }, [notification, markAsRead, prefetchTarget, router, target]);

  return (
    <Pressable
      accessibilityHint={
        hasTarget
          ? 'Opens the related update.'
          : 'Marks this notification as read.'
      }
      accessibilityLabel={`${isRead ? '' : 'Unread — '}${notification.title}`}
      accessibilityRole="button"
      accessibilityState={{ busy: markAsRead.isPending }}
      android_ripple={{
        color: colors.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,31,94,0.06)',
      }}
      className="overflow-hidden rounded-[24px] active:opacity-80"
      onPress={handlePress}
      style={{
        backgroundColor: isRead ? colors.cardBg : colors.elevatedCard,
        borderColor: isRead
          ? colors.border
          : colors.isDark
            ? colors.goldPillBorder
            : 'rgba(26,31,94,0.16)',
        borderWidth: 0.5,
        borderCurve: 'continuous',
        boxShadow: !colors.isDark
          ? isRead
            ? '0 1px 4px rgba(26,31,94,0.06)'
            : '0 2px 10px rgba(26,31,94,0.10)'
          : undefined,
      }}
    >
      <View className="flex-row">
        <View
          className="w-1"
          style={{
            backgroundColor: isRead ? 'transparent' : typeMeta.iconColor,
          }}
        />

        <View className="flex-1 flex-row items-start gap-3 px-4 py-[18px]">
          <View
            className="h-12 w-12 items-center justify-center rounded-[18px] border"
            style={{
              backgroundColor: typeMeta.iconBg,
              borderColor: isRead ? colors.border : 'rgba(255,255,255,0.45)',
              borderWidth: 0.5,
            }}
          >
            {!isRead ? (
              <View
                className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor: typeMeta.iconColor,
                  borderColor: typeMeta.iconBg,
                  borderWidth: 1,
                }}
              />
            ) : null}
            <MaterialIcons
              accessibilityElementsHidden
              color={typeMeta.iconColor}
              importantForAccessibility="no"
              name={typeMeta.icon}
              size={22}
            />
          </View>

          <View className="min-w-0 flex-1 gap-1.5">
            <View className="flex-row items-center justify-between gap-2">
              <View className="min-w-0 flex-1 flex-row items-center gap-1.5">
                <Text
                  className="min-w-0 flex-1 text-[11px] font-semibold uppercase"
                  numberOfLines={1}
                  style={{ color: colors.mutedText, letterSpacing: 0.5 }}
                >
                  {typeMeta.label}
                </Text>
              </View>

              {!isRead ? (
                <View
                  className="rounded-full border px-2.5 py-1"
                  style={{
                    backgroundColor: colors.goldPillBg,
                    borderColor: colors.goldPillBorder,
                  }}
                >
                  <Text
                    className="text-[11px] font-semibold"
                    style={{ color: colors.goldPillText }}
                  >
                    New
                  </Text>
                </View>
              ) : null}
            </View>

            <Text
              selectable
              className="text-base leading-6"
              numberOfLines={2}
              style={{
                color: isRead ? colors.secondaryText : colors.bodyText,
                fontWeight: isRead ? '500' : '800',
              }}
            >
              {notification.title}
            </Text>

            <Text
              selectable
              className="text-sm leading-5"
              numberOfLines={2}
              style={{
                color: isRead ? colors.mutedText : colors.secondaryText,
              }}
            >
              {notification.message}
            </Text>

            <View className="flex-row items-center justify-between gap-2 pt-0.5">
              <View className="min-w-0 flex-1 flex-row items-center gap-1.5">
                <MaterialIcons
                  accessibilityElementsHidden
                  color={colors.mutedText}
                  importantForAccessibility="no"
                  name="schedule"
                  size={13}
                />
                <Text
                  selectable
                  className="min-w-0 flex-1 text-xs"
                  numberOfLines={1}
                  style={{ color: colors.mutedText }}
                >
                  {formatAnnouncementTime(notification.createdAt)}
                </Text>
              </View>

              {hasTarget ? (
                <View
                  className="h-8 min-w-8 flex-row items-center justify-center rounded-full pl-2.5 pr-1"
                  style={{
                    backgroundColor: isRead
                      ? colors.subtleFill
                      : typeMeta.iconBg,
                  }}
                >
                  <Text
                    className="text-[11px] font-semibold"
                    style={{
                      color: isRead ? colors.secondaryText : typeMeta.iconColor,
                    }}
                  >
                    View
                  </Text>
                  <MaterialIcons
                    accessibilityElementsHidden
                    color={isRead ? colors.secondaryText : typeMeta.iconColor}
                    importantForAccessibility="no"
                    name="chevron-right"
                    size={18}
                  />
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export const NotificationItem = memo(NotificationItemComponent);
