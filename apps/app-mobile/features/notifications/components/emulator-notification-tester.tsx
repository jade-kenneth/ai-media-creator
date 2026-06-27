/**
 * Dev-only panel that appears on emulators/simulators to fire local
 * notifications. This exercises the same foreground handler and tap-routing
 * code paths as real push notifications.
 *
 * The component renders nothing on physical devices.
 */
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useCallback, useState } from "react";
import { Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/toast";

import {
  isEmulatorNotificationTestingAvailable,
  scheduleLocalTestNotification,
  TEST_NOTIFICATION_OPTIONS,
  type TestNotificationType,
} from "../local-notification-testing";

export function EmulatorNotificationTester() {
  const [lastFired, setLastFired] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleFire = useCallback(async (type: TestNotificationType) => {
    setIsPending(true);
    try {
      await scheduleLocalTestNotification(type, 2);
      setLastFired(type);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to schedule notification.";
      showToast({ type: "error", message });
      console.warn("[EmulatorNotificationTester]", error);
    } finally {
      setIsPending(false);
    }
  }, []);

  if (!__DEV__ || !isEmulatorNotificationTestingAvailable()) return null;

  return (
    <View className="mx-5 gap-3 rounded-3xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/40">
      <View className="flex-row items-center gap-2">
        <MaterialIcons color="#d97706" name="bug-report" size={18} />
        <Text className="text-sm font-semibold text-amber-800 dark:text-amber-300">
          Emulator — Local Notification Tester
        </Text>
      </View>

      <Text className="text-xs leading-5 text-amber-700 dark:text-amber-400">
        Push tokens are unavailable on emulators. Use these buttons to fire
        local notifications that exercise the same foreground and tap-routing
        paths.
      </Text>

      <View className="flex-row flex-wrap gap-2">
        {TEST_NOTIFICATION_OPTIONS.map((option) => (
          <Button
            key={option.value}
            disabled={isPending}
            label={option.label}
            variant="secondary"
            onPress={() => handleFire(option.value)}
          />
        ))}
      </View>

      {lastFired ? (
        <Text className="text-xs text-amber-600 dark:text-amber-500">
          ✓ Scheduled {lastFired} — arrives in ~2 s
        </Text>
      ) : null}
    </View>
  );
}
