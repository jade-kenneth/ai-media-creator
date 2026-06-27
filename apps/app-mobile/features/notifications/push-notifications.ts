import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Linking, Platform } from 'react-native';
import { z } from 'zod';

import { getSelectedOrganization } from '@/providers/TenantProvider/store';
import { PushPlatform } from '@/react-query/generated__types';
import {
  registerPushTokenRequest,
  unregisterPushTokenRequest,
} from '@/react-query/notifications/push-notifications-operations';
import {
  PUSH_PERMISSION_PROMPT_META_STORAGE_KEY,
  PUSH_TOKEN_REGISTRATION_META_STORAGE_KEY,
} from '@/utils/constants';

const PUSH_PERMISSION_REPROMPT_DELAY_MS = 3 * 24 * 60 * 60 * 1000;

const DEFAULT_LOCALE = new Intl.DateTimeFormat().resolvedOptions().locale;

const PushTokenRegistrationMetaSchema = z.object({
  appVersion: z.string().nullable().optional(),
  platform: z.enum(PushPlatform),
  projectId: z.string().nullable().optional(),
  registeredAt: z.string(),
  sessionKey: z.string(),
  token: z.string(),
});

const PushPermissionPromptMetaSchema = z.object({
  deferredAt: z.string(),
});

type PushTokenRegistrationMeta = z.infer<
  typeof PushTokenRegistrationMetaSchema
>;

type NotificationRouteTarget =
  | '/(main)/(tabs)'
  | '/(main)/(tabs)/notifications'
  | '/(auth)/registration-rejected'
  | `/(main)/announcements/${string}`
  | '/(main)/community-polls'
  | `/(main)/community-polls?${string}`
  | `/(main)/requests/${string}`
  | `/(main)/schedules/${string}`;

export type ParsedPushData = {
  announcementId: string | null;
  eventPostId: string | null;
  notificationId: string | null;
  pollSuggestionId: string | null;
  rawType: string;
  relatedEntityId: string | null;
  requestId: string | null;
  route: NotificationRouteTarget;
  scheduleId: string | null;
};

let isNotificationHandlerConfigured = false;

export type PushRegistrationResult =
  | { status: 'registered'; token: string }
  | { status: 'already-registered'; token: string }
  | {
      status: 'skipped';
      reason:
        | 'simulator'
        | 'expo-go-not-supported'
        | 'permission-denied'
        | 'missing-project-id';
    }
  | {
      status: 'failed';
      reason: 'token-fetch-failed' | 'server-registration-failed';
    };

function getPushPlatform(): PushPlatform {
  if (Platform.OS === 'android') return PushPlatform.Android;
  if (Platform.OS === 'ios') return PushPlatform.Ios;
  return PushPlatform.Web;
}

function getProjectId() {
  return (
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
    Constants.easConfig?.projectId ??
    Constants.expoConfig?.extra?.eas?.projectId ??
    null
  );
}

function shouldSkipPromptForEnvironment() {
  return Constants.appOwnership === 'expo' || !Device.isDevice;
}

function isPermissionGranted(
  permission: Notifications.NotificationPermissionsStatus,
) {
  return (
    permission.status === 'granted' ||
    permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

async function readStorageMeta<T>(
  key: string,
  schema: z.ZodSchema<T>,
): Promise<T | null> {
  const raw = await SecureStore.getItemAsync(key);
  if (!raw) return null;
  try {
    return schema.parse(JSON.parse(raw) as unknown);
  } catch {
    await SecureStore.deleteItemAsync(key);
    return null;
  }
}

const readRegistrationMeta = () =>
  readStorageMeta(
    PUSH_TOKEN_REGISTRATION_META_STORAGE_KEY,
    PushTokenRegistrationMetaSchema,
  );

const readPushPermissionPromptMeta = () =>
  readStorageMeta(
    PUSH_PERMISSION_PROMPT_META_STORAGE_KEY,
    PushPermissionPromptMetaSchema,
  );

async function persistRegistrationMeta(meta: PushTokenRegistrationMeta) {
  await SecureStore.setItemAsync(
    PUSH_TOKEN_REGISTRATION_META_STORAGE_KEY,
    JSON.stringify(meta),
  );
}

async function registerPushTokenWithServer(input: {
  sessionKey: string;
  token: string;
}) {
  const { token, sessionKey } = input;
  const platform = getPushPlatform();
  const projectId = getProjectId();
  const appVersion = Constants.expoConfig?.version ?? null;
  const existingMeta = await readRegistrationMeta();

  if (
    existingMeta &&
    existingMeta.token === token &&
    existingMeta.platform === platform &&
    existingMeta.projectId === projectId &&
    existingMeta.sessionKey === sessionKey
  ) {
    return { didRegister: false, token };
  }

  const response = await registerPushTokenRequest({
    input: {
      token,
      platform,
      deviceMetadata: {
        appOwnership:
          Constants.appOwnership ?? Constants.executionEnvironment ?? null,
        appVersion,
        buildVersion:
          Platform.OS === 'ios'
            ? (Constants.expoConfig?.ios?.buildNumber ?? null)
            : (Constants.expoConfig?.android?.versionCode?.toString() ?? null),
        deviceName: Device.deviceName ?? null,
        locale: DEFAULT_LOCALE ?? null,
        osName: Platform.OS,
        osVersion:
          typeof Platform.Version === 'string'
            ? Platform.Version
            : String(Platform.Version),
      },
    },
  });

  if (!response.ok) {
    console.warn(
      '[push-notifications] Server rejected registerPushToken:',
      response.error.name,
      response.error.message,
      '\n  → token:',
      token.slice(0, 30) + '…',
      '\n  → platform:',
      platform,
      '\n  → This may indicate an auth issue (expired/missing accessToken) or a server-side error.',
    );
    return { didRegister: false, token };
  }

  await persistRegistrationMeta({
    appVersion,
    platform,
    projectId,
    registeredAt: new Date().toISOString(),
    sessionKey,
    token,
  });

  return { didRegister: true, token };
}

export function parsePushNotificationData(data: unknown): ParsedPushData {
  if (!data || typeof data !== 'object') {
    return {
      announcementId: null,
      eventPostId: null,
      notificationId: null,
      pollSuggestionId: null,
      rawType: '',
      relatedEntityId: null,
      requestId: null,
      route: '/(main)/(tabs)/notifications',
      scheduleId: null,
    };
  }

  const source = data as Record<string, unknown>;
  const rawType =
    typeof source.type === 'string'
      ? source.type
      : typeof source.notificationType === 'string'
        ? source.notificationType
        : '';

  const announcementId =
    typeof source.announcementId === 'string' ? source.announcementId : null;
  const requestId =
    typeof source.requestId === 'string' ? source.requestId : null;
  const scheduleId =
    typeof source.scheduleId === 'string' ? source.scheduleId : null;
  const eventPostId =
    typeof source.eventPostId === 'string' ? source.eventPostId : null;
  const pollSuggestionId =
    typeof source.pollSuggestionId === 'string'
      ? source.pollSuggestionId
      : null;

  // V1 legacy fallback field names
  const relatedEntityId =
    typeof source.relatedEntityId === 'string'
      ? source.relatedEntityId
      : typeof source.entityId === 'string'
        ? source.entityId
        : typeof source.id === 'string'
          ? source.id
          : null;

  const notificationId =
    typeof source.notificationId === 'string'
      ? source.notificationId
      : typeof source.notificationRecordId === 'string'
        ? source.notificationRecordId
        : null;

  switch (rawType) {
    case 'announcement':
      return {
        announcementId,
        eventPostId,
        notificationId,
        pollSuggestionId,
        rawType,
        relatedEntityId,
        requestId,
        route: `/(main)/announcements/${
          announcementId ?? relatedEntityId ?? ''
        }` as NotificationRouteTarget,
        scheduleId,
      };
    case 'document_request':
      return {
        announcementId,
        eventPostId,
        notificationId,
        pollSuggestionId,
        rawType,
        relatedEntityId,
        requestId,
        route: `/(main)/requests/${
          requestId ?? relatedEntityId ?? ''
        }` as NotificationRouteTarget,
        scheduleId,
      };
    case 'schedule':
      return {
        announcementId,
        eventPostId,
        notificationId,
        pollSuggestionId,
        rawType,
        relatedEntityId,
        requestId,
        route: `/(main)/schedules/${
          scheduleId ?? relatedEntityId ?? ''
        }` as NotificationRouteTarget,
        scheduleId,
      };
    case 'event_post':
      return {
        announcementId,
        eventPostId,
        notificationId,
        pollSuggestionId,
        rawType,
        relatedEntityId,
        requestId,
        route: '/(main)/(tabs)',
        scheduleId,
      };
    case 'POLL_SUGGESTION_STATUS':
      return {
        announcementId,
        eventPostId,
        notificationId,
        pollSuggestionId,
        rawType,
        relatedEntityId,
        requestId,
        route: '/(main)/community-polls?filter=my-suggestions',
        scheduleId,
      };
    case 'test':
      return {
        announcementId,
        eventPostId,
        notificationId,
        pollSuggestionId,
        rawType,
        relatedEntityId,
        requestId,
        route: '/(main)/(tabs)/notifications',
        scheduleId,
      };
    case 'REGISTRATION_APPROVED':
      return {
        announcementId,
        eventPostId,
        notificationId,
        pollSuggestionId,
        rawType,
        relatedEntityId,
        requestId,
        route: '/(main)/(tabs)',
        scheduleId,
      };
    case 'REGISTRATION_REJECTED':
      return {
        announcementId,
        eventPostId,
        notificationId,
        pollSuggestionId,
        rawType,
        relatedEntityId,
        requestId,
        route: '/(auth)/registration-rejected',
        scheduleId,
      };
    default:
      break;
  }

  // V1 fallback: match against uppercase NotificationType enum values
  const normalizedType = rawType.toUpperCase();

  if (relatedEntityId && normalizedType.includes('ANNOUNCEMENT')) {
    return {
      announcementId,
      eventPostId,
      notificationId,
      pollSuggestionId,
      rawType,
      relatedEntityId,
      requestId,
      route: `/(main)/announcements/${relatedEntityId}`,
      scheduleId,
    };
  }

  if (relatedEntityId && normalizedType.includes('REQUEST')) {
    return {
      announcementId,
      eventPostId,
      notificationId,
      pollSuggestionId,
      rawType,
      relatedEntityId,
      requestId,
      route: `/(main)/requests/${relatedEntityId}`,
      scheduleId,
    };
  }

  if (
    relatedEntityId &&
    (normalizedType.includes('EVENT_POST') ||
      normalizedType.includes('SCHEDULE_POST'))
  ) {
    return {
      announcementId,
      eventPostId,
      notificationId,
      pollSuggestionId,
      rawType,
      relatedEntityId,
      requestId,
      route: '/(main)/(tabs)',
      scheduleId,
    };
  }

  if (relatedEntityId && normalizedType.includes('SCHEDULE')) {
    return {
      announcementId,
      eventPostId,
      notificationId,
      pollSuggestionId,
      rawType,
      relatedEntityId,
      requestId,
      route: `/(main)/schedules/${relatedEntityId}`,
      scheduleId,
    };
  }

  if (normalizedType.includes('REGISTRATION_APPROVED')) {
    return {
      announcementId,
      eventPostId,
      notificationId,
      pollSuggestionId,
      rawType,
      relatedEntityId,
      requestId,
      route: '/(main)/(tabs)',
      scheduleId,
    };
  }

  if (normalizedType.includes('REGISTRATION_REJECTED')) {
    return {
      announcementId,
      eventPostId,
      notificationId,
      pollSuggestionId,
      rawType,
      relatedEntityId,
      requestId,
      route: '/(auth)/registration-rejected',
      scheduleId,
    };
  }

  return {
    announcementId,
    eventPostId,
    notificationId,
    pollSuggestionId,
    rawType,
    relatedEntityId,
    requestId,
    route: '/(main)/(tabs)/notifications',
    scheduleId,
  };
}

export function resolveRouteTargetFromData(
  data: unknown,
): NotificationRouteTarget {
  return parsePushNotificationData(data).route;
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  const tenant = await getSelectedOrganization();
  const channelName = tenant?.organizationName
    ? `${tenant.organizationName} Portal`
    : 'Organization Portal';
  await Notifications.setNotificationChannelAsync('default', {
    name: channelName,
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#22c55eFF',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    showBadge: true,
    sound: undefined,
  });
}

async function getExpoPushToken() {
  // Expo Go does not support production-style push token registration on
  // modern SDKs; require a development/preview/production build instead.
  if (Constants.appOwnership === 'expo') {
    console.log('[push-notifications] Skipping: Expo Go not supported');
    return { ok: false, reason: 'expo-go-not-supported' } as const;
  }

  // Skip push token registration on simulators and unsupported environments.
  // Device.isDevice is false on iOS Simulator and Android Emulator.
  if (!Device.isDevice) {
    console.log('[push-notifications] Skipping: not a physical device');
    return { ok: false, reason: 'simulator' } as const;
  }

  const existingPermission = await Notifications.getPermissionsAsync();
  console.log(
    '[push-notifications] Existing permission status:',
    existingPermission.status,
  );
  const finalPermission =
    existingPermission.status === 'granted'
      ? existingPermission
      : await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });

  if (!isPermissionGranted(finalPermission)) {
    console.log(
      '[push-notifications] Permission denied:',
      finalPermission.status,
    );
    return { ok: false, reason: 'permission-denied' } as const;
  }

  const projectId = getProjectId();
  if (!projectId) {
    console.warn('[push-notifications] No projectId found in Constants');
    return { ok: false, reason: 'missing-project-id' } as const;
  }

  console.log(
    '[push-notifications] Requesting Expo push token with projectId:',
    projectId,
  );
  console.log(
    '[push-notifications] appOwnership:',
    Constants.appOwnership,
    'executionEnvironment:',
    Constants.executionEnvironment,
  );
  try {
    const tokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    console.log('[push-notifications] Got token:', tokenResponse.data);
    return { ok: true, token: tokenResponse.data } as const;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(
      '[push-notifications] Token fetch failed:',
      errorMessage,
      '\n  → If running Expo Go, push tokens require a dev client (EAS) build.',
      '\n  → Run: npx eas build --platform android --profile development',
    );
    return { ok: false, reason: 'token-fetch-failed' } as const;
  }
}

export function configureForegroundNotificationHandler() {
  if (isNotificationHandlerConfigured) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  isNotificationHandlerConfigured = true;
}

export async function shouldShowNotificationPermissionPrompt() {
  if (shouldSkipPromptForEnvironment()) return false;

  const permission = await Notifications.getPermissionsAsync();
  if (isPermissionGranted(permission)) return false;

  const meta = await readPushPermissionPromptMeta();
  if (!meta) return true;

  const deferredAtMs = Date.parse(meta.deferredAt);
  if (Number.isNaN(deferredAtMs)) return true;

  return Date.now() - deferredAtMs >= PUSH_PERMISSION_REPROMPT_DELAY_MS;
}

export async function markNotificationPermissionPromptDeferred() {
  await SecureStore.setItemAsync(
    PUSH_PERMISSION_PROMPT_META_STORAGE_KEY,
    JSON.stringify({ deferredAt: new Date().toISOString() }),
  );
}

export async function clearNotificationPermissionPromptMeta() {
  await SecureStore.deleteItemAsync(PUSH_PERMISSION_PROMPT_META_STORAGE_KEY);
}

export async function registerPushNotificationsForSession(
  sessionKey: string,
): Promise<PushRegistrationResult> {
  try {
    const [, tokenResult] = await Promise.all([
      ensureAndroidChannel(),
      getExpoPushToken(),
    ]);
    if (!tokenResult.ok) {
      console.log(
        '[push-notifications] Token retrieval skipped:',
        tokenResult.reason,
      );
      if (tokenResult.reason === 'token-fetch-failed') {
        return {
          status: 'failed',
          reason: 'token-fetch-failed',
        };
      }

      return {
        status: 'skipped',
        reason: tokenResult.reason,
      };
    }

    console.log(
      '[push-notifications] Token obtained, registering with server…',
    );
    const response = await registerPushTokenWithServer({
      token: tokenResult.token,
      sessionKey,
    });

    if (response.didRegister) {
      await clearNotificationPermissionPromptMeta();
      console.log('[push-notifications] ✅ Registered:', tokenResult.token);
      return { status: 'registered', token: response.token };
    }

    const existingMeta = await readRegistrationMeta();
    if (existingMeta?.token === tokenResult.token) {
      console.log('[push-notifications] Already registered (cached match)');
      return { status: 'already-registered', token: tokenResult.token };
    }

    console.warn('[push-notifications] ❌ Server registration failed');
    return {
      status: 'failed',
      reason: 'server-registration-failed',
    };
  } catch (error) {
    console.warn('[push-notifications] Registration failed:', error);
    return {
      status: 'failed',
      reason: 'server-registration-failed',
    };
  }
}

export async function enablePushNotificationsForSession(sessionKey: string) {
  const result = await registerPushNotificationsForSession(sessionKey);
  if (result.status === 'skipped' && result.reason === 'permission-denied') {
    await Linking.openSettings().catch(() => {
      // Ignore settings-open failures.
    });
  }
  return result;
}

export async function isPushNotificationsEnabledForSession(sessionKey: string) {
  const existingMeta = await readRegistrationMeta();
  if (!existingMeta || existingMeta.sessionKey !== sessionKey) return false;

  const permission = await Notifications.getPermissionsAsync();
  return isPermissionGranted(permission);
}

export function subscribeToPushTokenRefresh(sessionKey: string) {
  const subscription = Notifications.addPushTokenListener((token) => {
    void registerPushTokenWithServer({
      token: token.data,
      sessionKey,
    });
  });
  return () => {
    subscription.remove();
  };
}

export function subscribeToForegroundNotifications(
  onReceived?: (notification: Notifications.Notification) => void,
) {
  const subscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      onReceived?.(notification);
    },
  );
  return () => {
    subscription.remove();
  };
}

export function subscribeToPushNotificationResponses(
  onResponse?: (response: Notifications.NotificationResponse) => void,
) {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      onResponse?.(response);
    },
  );

  return () => {
    subscription.remove();
  };
}

export async function unregisterPushTokenForCurrentDevice() {
  const existingMeta = await readRegistrationMeta();
  if (!existingMeta) return;

  try {
    await unregisterPushTokenRequest({
      input: {
        token: existingMeta.token,
        platform: existingMeta.platform,
      },
    });
  } catch {
    // Ignore unregister failures to avoid blocking logout/session cleanup.
  } finally {
    await SecureStore.deleteItemAsync(PUSH_TOKEN_REGISTRATION_META_STORAGE_KEY);
  }
}
