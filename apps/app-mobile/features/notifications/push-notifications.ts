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

export type NotificationRouteTarget =
  | '/(main)/(tabs)'
  | '/(main)/(tabs)/notifications'
  | '/(main)/(tabs)/profile';

export type ParsedPushData = {
  notificationId: string | null;
  rawType: string;
  relatedEntityId: string | null;
  route: NotificationRouteTarget;
};

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

let isNotificationHandlerConfigured = false;

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
    permission.ios?.status ===
      Notifications.IosAuthorizationStatus.PROVISIONAL
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
  const platform = getPushPlatform();
  const projectId = getProjectId();
  const appVersion = Constants.expoConfig?.version ?? null;
  const existingMeta = await readRegistrationMeta();

  if (
    existingMeta?.token === input.token &&
    existingMeta.platform === platform &&
    existingMeta.projectId === projectId &&
    existingMeta.sessionKey === input.sessionKey
  ) {
    return 'cached' as const;
  }

  const response = await registerPushTokenRequest({
    input: {
      token: input.token,
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
        osVersion: String(Platform.Version),
      },
    },
  });

  if (!response.ok) return 'failed' as const;

  await persistRegistrationMeta({
    appVersion,
    platform,
    projectId,
    registeredAt: new Date().toISOString(),
    sessionKey: input.sessionKey,
    token: input.token,
  });
  return 'registered' as const;
}

function parseRoute(value: unknown): NotificationRouteTarget {
  switch (value) {
    case 'home':
    case '/(main)/(tabs)':
      return '/(main)/(tabs)';
    case 'profile':
    case '/(main)/(tabs)/profile':
      return '/(main)/(tabs)/profile';
    case 'notifications':
    case '/(main)/(tabs)/notifications':
    default:
      return '/(main)/(tabs)/notifications';
  }
}

export function parsePushNotificationData(data: unknown): ParsedPushData {
  if (!data || typeof data !== 'object') {
    return {
      notificationId: null,
      rawType: '',
      relatedEntityId: null,
      route: '/(main)/(tabs)/notifications',
    };
  }

  const source = data as Record<string, unknown>;
  return {
    notificationId:
      typeof source.notificationId === 'string'
        ? source.notificationId
        : null,
    rawType:
      typeof source.type === 'string'
        ? source.type
        : typeof source.notificationType === 'string'
          ? source.notificationType
          : '',
    relatedEntityId:
      typeof source.relatedEntityId === 'string'
        ? source.relatedEntityId
        : null,
    route: parseRoute(source.route),
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
  await Notifications.setNotificationChannelAsync('default', {
    name: tenant?.organizationName
      ? `${tenant.organizationName} notifications`
      : 'App notifications',
    importance: Notifications.AndroidImportance.MAX,
    lightColor: '#2563ebFF',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    showBadge: true,
    vibrationPattern: [0, 250, 250, 250],
  });
}

async function getExpoPushToken() {
  if (Constants.appOwnership === 'expo') {
    return { ok: false, reason: 'expo-go-not-supported' } as const;
  }
  if (!Device.isDevice) {
    return { ok: false, reason: 'simulator' } as const;
  }

  const existingPermission = await Notifications.getPermissionsAsync();
  const finalPermission = isPermissionGranted(existingPermission)
    ? existingPermission
    : await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true },
      });

  if (!isPermissionGranted(finalPermission)) {
    return { ok: false, reason: 'permission-denied' } as const;
  }

  const projectId = getProjectId();
  if (!projectId) {
    return { ok: false, reason: 'missing-project-id' } as const;
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return { ok: true, token: token.data } as const;
  } catch {
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
  return (
    Number.isNaN(deferredAtMs) ||
    Date.now() - deferredAtMs >= PUSH_PERMISSION_REPROMPT_DELAY_MS
  );
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
      return tokenResult.reason === 'token-fetch-failed'
        ? { status: 'failed', reason: tokenResult.reason }
        : { status: 'skipped', reason: tokenResult.reason };
    }

    const status = await registerPushTokenWithServer({
      sessionKey,
      token: tokenResult.token,
    });
    if (status === 'failed') {
      return { status: 'failed', reason: 'server-registration-failed' };
    }

    await clearNotificationPermissionPromptMeta();
    return {
      status: status === 'cached' ? 'already-registered' : 'registered',
      token: tokenResult.token,
    };
  } catch {
    return { status: 'failed', reason: 'server-registration-failed' };
  }
}

export async function enablePushNotificationsForSession(sessionKey: string) {
  const result = await registerPushNotificationsForSession(sessionKey);
  if (result.status === 'skipped' && result.reason === 'permission-denied') {
    await Linking.openSettings().catch(() => undefined);
  }
  return result;
}

export async function isPushNotificationsEnabledForSession(
  sessionKey: string,
) {
  const existingMeta = await readRegistrationMeta();
  if (!existingMeta || existingMeta.sessionKey !== sessionKey) return false;

  return isPermissionGranted(await Notifications.getPermissionsAsync());
}

export function subscribeToPushTokenRefresh(sessionKey: string) {
  const subscription = Notifications.addPushTokenListener((token) => {
    void registerPushTokenWithServer({ sessionKey, token: token.data });
  });
  return () => subscription.remove();
}

export function subscribeToForegroundNotifications(
  onReceived?: (notification: Notifications.Notification) => void,
) {
  const subscription = Notifications.addNotificationReceivedListener(
    (notification) => onReceived?.(notification),
  );
  return () => subscription.remove();
}

export function subscribeToPushNotificationResponses(
  onResponse?: (response: Notifications.NotificationResponse) => void,
) {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => onResponse?.(response),
  );
  return () => subscription.remove();
}

export async function unregisterPushTokenForCurrentDevice() {
  const existingMeta = await readRegistrationMeta();
  if (!existingMeta) return;

  try {
    await unregisterPushTokenRequest({
      input: {
        platform: existingMeta.platform,
        token: existingMeta.token,
      },
    });
  } catch {
    // Do not block logout when remote cleanup is unavailable.
  } finally {
    await SecureStore.deleteItemAsync(
      PUSH_TOKEN_REGISTRATION_META_STORAGE_KEY,
    );
  }
}
