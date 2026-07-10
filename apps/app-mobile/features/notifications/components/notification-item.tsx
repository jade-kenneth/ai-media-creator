import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useQueryClient } from '@tanstack/react-query';
import { memo, useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useThemeColors } from '@/hooks/use-theme-colors';
import {
  NotificationType,
  type NotificationRecordFragment,
  type MyNotificationsQuery,
} from '@/react-query/generated__types';
import {
  notificationsQueryKeys,
  useMarkNotificationAsReadMutation,
} from '@/react-query/notifications/notifications-operations';

function formatNotificationTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown time';

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function getTypeMeta(type: NotificationType) {
  switch (type) {
    case NotificationType.Success:
      return { color: '#15803d', backgroundColor: '#dcfce7', icon: 'check-circle' as const };
    case NotificationType.Warning:
      return { color: '#a16207', backgroundColor: '#fef3c7', icon: 'warning-amber' as const };
    case NotificationType.Error:
      return { color: '#b91c1c', backgroundColor: '#fee2e2', icon: 'error-outline' as const };
    case NotificationType.Info:
      return { color: '#1d4ed8', backgroundColor: '#dbeafe', icon: 'info-outline' as const };
    case NotificationType.System:
    default:
      return { color: '#475569', backgroundColor: '#e2e8f0', icon: 'notifications-none' as const };
  }
}

function NotificationItemComponent({
  notification,
}: {
  notification: NotificationRecordFragment;
}) {
  const colors = useThemeColors();
  const queryClient = useQueryClient();
  const typeMeta = getTypeMeta(notification.type);
  const markAsRead = useMarkNotificationAsReadMutation({
    onSuccess: (data) => {
      queryClient.setQueriesData<MyNotificationsQuery>(
        { queryKey: notificationsQueryKeys.all },
        (current) => {
          if (!current) return current;
          return {
            ...current,
            myNotifications: {
              ...current.myNotifications,
              unreadCount: Math.max(current.myNotifications.unreadCount - 1, 0),
              edges: current.myNotifications.edges.map((edge) =>
                edge.node.id === data.markNotificationAsRead.id
                  ? { ...edge, node: data.markNotificationAsRead }
                  : edge,
              ),
            },
          };
        },
      );
      void queryClient.invalidateQueries({ queryKey: notificationsQueryKeys.all });
    },
  });

  const handlePress = useCallback(() => {
    if (notification.isRead || markAsRead.isPending) return;
    markAsRead.mutate({ id: notification.id });
  }, [markAsRead, notification.id, notification.isRead]);

  return (
    <Pressable
      accessibilityHint={
        notification.isRead ? undefined : 'Marks this notification as read'
      }
      accessibilityLabel={notification.title}
      accessibilityRole="button"
      accessibilityState={{ busy: markAsRead.isPending }}
      className="rounded-3xl border p-4 active:opacity-85"
      onPress={handlePress}
      style={{
        backgroundColor: notification.isRead ? colors.cardBg : colors.elevatedCard,
        borderColor: notification.isRead ? colors.border : typeMeta.color,
      }}
    >
      <View className="flex-row items-start gap-3">
        <View
          className="h-11 w-11 items-center justify-center rounded-2xl"
          style={{ backgroundColor: typeMeta.backgroundColor }}
        >
          <MaterialIcons color={typeMeta.color} name={typeMeta.icon} size={22} />
        </View>
        <View className="min-w-0 flex-1 gap-1.5">
          <View className="flex-row items-start gap-2">
            <Text
              className="min-w-0 flex-1 text-base leading-6"
              numberOfLines={2}
              style={{
                color: notification.isRead ? colors.secondaryText : colors.bodyText,
                fontWeight: notification.isRead ? '500' : '700',
              }}
            >
              {notification.title}
            </Text>
            {!notification.isRead ? (
              <View
                accessibilityLabel="Unread"
                className="mt-2 h-2 w-2 rounded-full"
                style={{ backgroundColor: typeMeta.color }}
              />
            ) : null}
          </View>
          <Text
            className="text-sm leading-5"
            numberOfLines={3}
            selectable
            style={{ color: colors.secondaryText }}
          >
            {notification.message}
          </Text>
          <Text className="text-xs" style={{ color: colors.mutedText }}>
            {formatNotificationTime(notification.createdAt)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export const NotificationItem = memo(NotificationItemComponent);
