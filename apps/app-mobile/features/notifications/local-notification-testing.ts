import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { getSelectedOrganization } from '@/providers/TenantProvider/store';

import { configureForegroundNotificationHandler } from './push-notifications';

const TEST_PAYLOADS = {
  info: {
    title: 'Information',
    body: 'This is a local informational notification.',
    data: { type: 'INFO', route: 'notifications' },
  },
  success: {
    title: 'Completed',
    body: 'This is a local success notification.',
    data: { type: 'SUCCESS', route: 'notifications' },
  },
  warning: {
    title: 'Action recommended',
    body: 'This is a local warning notification.',
    data: { type: 'WARNING', route: 'notifications' },
  },
  error: {
    title: 'Action failed',
    body: 'This is a local error notification.',
    data: { type: 'ERROR', route: 'notifications' },
  },
  system: {
    title: 'System notification',
    body: 'This verifies the generic push notification flow.',
    data: { type: 'SYSTEM', route: 'notifications' },
  },
} as const;

export type TestNotificationType = keyof typeof TEST_PAYLOADS;

export const TEST_NOTIFICATION_OPTIONS: Array<{
  label: string;
  value: TestNotificationType;
}> = [
  { label: 'Info', value: 'info' },
  { label: 'Success', value: 'success' },
  { label: 'Warning', value: 'warning' },
  { label: 'Error', value: 'error' },
  { label: 'System', value: 'system' },
];

export function isEmulatorNotificationTestingAvailable() {
  return !Device.isDevice;
}

export async function scheduleLocalTestNotification(
  type: TestNotificationType = 'system',
  delaySeconds = 1,
) {
  configureForegroundNotificationHandler();

  if (Platform.OS === 'android') {
    const tenant = await getSelectedOrganization();
    await Notifications.setNotificationChannelAsync('default', {
      name: tenant?.organizationName
        ? `${tenant.organizationName} notifications`
        : 'App notifications',
      importance: Notifications.AndroidImportance.MAX,
      lightColor: '#2563ebFF',
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const permission = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });

  if (permission.status !== 'granted') {
    throw new Error(
      'Notification permission denied. Enable notifications in device settings.',
    );
  }

  const payload = TEST_PAYLOADS[type];
  return Notifications.scheduleNotificationAsync({
    content: {
      body: payload.body,
      data: payload.data,
      sound: 'default',
      title: payload.title,
    },
    trigger: {
      seconds: Math.max(delaySeconds, 1),
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
    },
  });
}
