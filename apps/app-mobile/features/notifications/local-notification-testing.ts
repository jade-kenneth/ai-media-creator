/**
 * Local notification helpers for emulator / simulator testing.
 *
 * On a physical device push notifications arrive from the server via Expo Push.
 * On emulators `Device.isDevice` is false so the push token is never registered,
 * which means no remote pushes can arrive.
 *
 * These helpers use `Notifications.scheduleNotificationAsync` to fire local
 * notifications that travel through the same foreground-handler and tap-routing
 * code paths, letting you verify notification UI and navigation on an emulator.
 */
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { getSelectedOrganization } from "@/providers/TenantProvider/store";

import { configureForegroundNotificationHandler } from "./push-notifications";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TestNotificationPayload = {
  title: string;
  body: string;
  data: {
    /** V2 API type string (lowercase, matches backend contract) */
    type: string;
    /** V2 API field — announcement detail */
    announcementId?: string;
    /** V2 API field — document request detail */
    requestId?: string;
    /** V1 legacy fallback, kept for compatibility with the routing logic */
    relatedEntityId?: string;
    [key: string]: unknown;
  };
};

// ---------------------------------------------------------------------------
// Pre-built payloads
// ---------------------------------------------------------------------------

const TEST_PAYLOADS = {
  announcement: {
    title: "📢 New Organization Announcement",
    body: "A new community announcement has been posted. Tap to read more.",
    data: {
      type: "announcement",
      announcementId: "test-announcement-id",
      relatedEntityId: "test-announcement-id",
    },
  },
  emergencyAnnouncement: {
    title: "🚨 Emergency Alert",
    body: "An emergency announcement has been issued for your organization.",
    data: {
      type: "announcement",
      announcementId: "test-emergency-announcement-id",
      relatedEntityId: "test-emergency-announcement-id",
    },
  },
  requestApproved: {
    title: "✅ Request Approved",
    body: "Your document request has been approved.",
    data: {
      type: "document_request",
      requestId: "test-request-id",
      relatedEntityId: "test-request-id",
    },
  },
  requestRejected: {
    title: "❌ Request Rejected",
    body: "Your document request has been rejected. Tap for details.",
    data: {
      type: "document_request",
      requestId: "test-request-id",
      relatedEntityId: "test-request-id",
    },
  },
  requestReadyForPickup: {
    title: "📄 Ready for Pickup",
    body: "Your requested document is ready for pickup at the organization hall.",
    data: {
      type: "document_request",
      requestId: "test-request-id",
      relatedEntityId: "test-request-id",
    },
  },
  system: {
    title: "🔔 System Notification",
    body: "This is a system notification for testing purposes.",
    data: {
      type: "test",
    },
  },
} as const satisfies Record<string, TestNotificationPayload>;

export type TestNotificationType = keyof typeof TEST_PAYLOADS;

export const TEST_NOTIFICATION_OPTIONS: {
  label: string;
  value: TestNotificationType;
}[] = [
  { label: "Announcement", value: "announcement" },
  { label: "Emergency Alert", value: "emergencyAnnouncement" },
  { label: "Request Approved", value: "requestApproved" },
  { label: "Request Rejected", value: "requestRejected" },
  { label: "Request Ready for Pickup", value: "requestReadyForPickup" },
  { label: "System", value: "system" },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Whether local notification testing is available.
 * True only when running on a non-physical device (emulator/simulator).
 */
export function isEmulatorNotificationTestingAvailable(): boolean {
  return !Device.isDevice;
}

/**
 * Schedule a local notification that mimics a push notification payload.
 *
 * The notification flows through the same `setNotificationHandler` and
 * `addNotificationResponseReceivedListener` code paths as real pushes,
 * so foreground display and tap routing are exercised identically.
 *
 * @param type - One of the pre-built test payload keys, or "announcement" by default.
 * @param delaySeconds - Seconds to wait before showing the notification. Defaults to 1.
 */
export async function scheduleLocalTestNotification(
  type: TestNotificationType = "announcement",
  delaySeconds = 1
): Promise<string> {
  // Ensure the foreground handler is configured so the notification shows
  // as a banner when the app is open (important on emulators where the
  // normal registration flow is skipped).
  configureForegroundNotificationHandler();

  // Android 8+: create the channel before scheduling or the notification
  // is silently dropped. This is a no-op on iOS.
  if (Platform.OS === "android") {
    const tenant = await getSelectedOrganization();
    const channelName = tenant?.organizationName ? `${tenant.organizationName} Portal` : 'Organization Portal';
    await Notifications.setNotificationChannelAsync("default", {
      name: channelName,
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#22c55eFF",
      sound: "default",
    });
  }

  // Request permissions — required on Android 13+ and iOS even for local
  // notifications. On emulators this may silently be denied; check and throw
  // a readable error so the tester UI can surface it.
  const { status } = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });

  if (status !== "granted") {
    throw new Error(
      "Notification permission denied. Enable notifications for this app in device settings."
    );
  }

  const payload = TEST_PAYLOADS[type];

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: payload.title,
      body: payload.body,
      data: payload.data,
      sound: "default",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(delaySeconds, 1),
    },
  });

  return id;
}
