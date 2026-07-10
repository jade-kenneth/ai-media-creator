import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { PropsWithChildren, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { showToast } from '@/components/ui/toast';
import { NotificationPermissionPrompt } from '@/features/notifications/components/notification-permission-prompt';
import {
  clearNotificationPermissionPromptMeta,
  configureForegroundNotificationHandler,
  markNotificationPermissionPromptDeferred,
  parsePushNotificationData,
  registerPushNotificationsForSession,
  resolveRouteTargetFromData,
  shouldShowNotificationPermissionPrompt,
  subscribeToForegroundNotifications,
  subscribeToPushNotificationResponses,
  subscribeToPushTokenRefresh,
} from '@/features/notifications/push-notifications';
import { queryClient } from '@/providers/query-provider';
import { SortDirection } from '@/react-query/generated__types';
import {
  markNotificationAsReadRequest,
  myNotificationsRequest,
  notificationsQueryKeys,
} from '@/react-query/notifications/notifications-operations';
import { useSession } from './AuthProvider';

function buildSessionKey(accessToken: string, role: string) {
  return `${role}:${accessToken.slice(0, 16)}`;
}

async function syncAppBadgeCount() {
  const response = await myNotificationsRequest({
    first: 1,
    sort: { createdAt: SortDirection.Desc },
  });
  if (!response.ok) return;

  await Notifications.setBadgeCountAsync(
    response.data.myNotifications.unreadCount,
  ).catch(() => {
    // Ignore badge update failures.
  });
}

async function clearAppBadgeCount() {
  await Notifications.setBadgeCountAsync(0).catch(() => {
    // Ignore badge update failures.
  });
}

async function markNotificationAsReadFromPushData(data: unknown) {
  const parsed = parsePushNotificationData(data);

  const explicitNotificationId = parsed.notificationId;
  if (explicitNotificationId) {
    await markNotificationAsReadRequest({ id: explicitNotificationId }).catch(
      () => {
        // Ignore read sync errors during navigation.
      },
    );
    return;
  }

  const entityId = parsed.relatedEntityId;
  if (!entityId) return;

  const unreadResponse = await myNotificationsRequest({
    filter: { unreadOnly: true },
    first: 25,
    sort: { createdAt: SortDirection.Desc },
  });

  if (!unreadResponse.ok) return;

  const matchingRecord = unreadResponse.data.myNotifications.edges
    .map((edge) => edge.node)
    .find((notification) => notification.relatedEntityId === entityId);

  if (!matchingRecord || matchingRecord.isRead) return;

  await markNotificationAsReadRequest({ id: matchingRecord.id }).catch(() => {
    // Ignore read sync errors during navigation.
  });
}

export function PushNotificationsProvider({ children }: PropsWithChildren) {
  const session = useSession();
  const sessionKeyRef = useRef<string | null>(null);
  const [isPermissionPromptVisible, setPermissionPromptVisible] =
    useState(false);
  const [isPromptEnabling, setPromptEnabling] = useState(false);

  const sessionKey = useMemo(() => {
    if (session.status !== 'authenticated') return null;
    return buildSessionKey(session.accessToken, session.role);
  }, [session]);

  // Keep a ref in sync so listeners always have the latest session key.
  sessionKeyRef.current = sessionKey;

  // ── Cold-start routing ───────────────────────────────────────────────────
  // useLastNotificationResponse handles taps that launch the app from killed state.
  // A short delay lets the navigator mount first before routing.
  const lastResponse = Notifications.useLastNotificationResponse();
  const handledNotifIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!lastResponse) return;

    const notifId = lastResponse.notification.request.identifier;
    if (handledNotifIdRef.current === notifId) return;
    handledNotifIdRef.current = notifId;

    const timer = setTimeout(async () => {
      const data = lastResponse.notification.request.content.data;
      if (!data || typeof data !== 'object') return;

      await markNotificationAsReadFromPushData(data).finally(() => {
        void queryClient.invalidateQueries({
          queryKey: notificationsQueryKeys.all,
        });
        void syncAppBadgeCount();
      });

      const route = resolveRouteTargetFromData(data);
      router.push(route as Parameters<typeof router.push>[0]);
    }, 500);

    return () => clearTimeout(timer);
  }, [lastResponse]);

  const maybeRegisterOrPromptForPermission = async (
    currentSessionKey: string,
  ) => {
    const shouldPrompt = await shouldShowNotificationPermissionPrompt();
    if (shouldPrompt) {
      setPermissionPromptVisible(true);
      return;
    }

    setPermissionPromptVisible(false);
    await registerPushNotificationsForSession(currentSessionKey);
  };

  const handleEnablePrompt = async () => {
    const currentSessionKey = sessionKeyRef.current;
    if (!currentSessionKey) {
      setPermissionPromptVisible(false);
      return;
    }

    setPromptEnabling(true);

    try {
      const result =
        await registerPushNotificationsForSession(currentSessionKey);

      if (
        result.status === 'registered' ||
        result.status === 'already-registered'
      ) {
        await clearNotificationPermissionPromptMeta();
        setPermissionPromptVisible(false);
        return;
      }

      if (
        result.status === 'skipped' &&
        result.reason === 'permission-denied'
      ) {
        await markNotificationPermissionPromptDeferred();
        setPermissionPromptVisible(false);
        showToast({
          type: 'info',
          message:
            'Notifications stayed off. You can enable them later in settings.',
        });
      }
    } finally {
      setPromptEnabling(false);
    }
  };

  const handleMaybeLaterPrompt = async () => {
    await markNotificationPermissionPromptDeferred();
    setPermissionPromptVisible(false);
  };

  // ── Foreground handler + tap listener ────────────────────────────────────
  useEffect(() => {
    configureForegroundNotificationHandler();

    const unsubscribeResponses = subscribeToPushNotificationResponses(
      async (response) => {
        const data = response.notification.request.content.data;
        if (!data || typeof data !== 'object') return;

        await markNotificationAsReadFromPushData(data).finally(() => {
          void queryClient.invalidateQueries({
            queryKey: notificationsQueryKeys.all,
          });
          void syncAppBadgeCount();
        });

        const route = resolveRouteTargetFromData(data);
        router.push(route as Parameters<typeof router.push>[0]);
      },
    );

    const foregroundSub = subscribeToForegroundNotifications(() => {
      void queryClient.invalidateQueries({
        queryKey: notificationsQueryKeys.all,
      });
      void syncAppBadgeCount();
    });

    return () => {
      unsubscribeResponses();
      foregroundSub();
    };
  }, []);

  // Register push token when session changes.
  useEffect(() => {
    if (!sessionKey) {
      setPermissionPromptVisible(false);
      return;
    }

    void maybeRegisterOrPromptForPermission(sessionKey);
    const tokenSubscription = subscribeToPushTokenRefresh(sessionKey);

    return () => {
      tokenSubscription();
    };
  }, [sessionKey]);

  // Re-register when the app returns to the foreground.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') return;

      void clearAppBadgeCount();

      const currentKey = sessionKeyRef.current;
      if (!currentKey) return;

      void maybeRegisterOrPromptForPermission(currentKey);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <>
      {children}
      <NotificationPermissionPrompt
        isLoading={isPromptEnabling}
        onEnable={handleEnablePrompt}
        onMaybeLater={handleMaybeLaterPrompt}
        visible={isPermissionPromptVisible}
      />
    </>
  );
}
