import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";

import { useThemeColors } from "@/hooks/use-theme-colors";

type NotificationPermissionPromptProps = {
  isLoading?: boolean;
  onEnable: () => void;
  onMaybeLater: () => void;
  visible: boolean;
};

export function NotificationPermissionPrompt({
  isLoading = false,
  onEnable,
  onMaybeLater,
  visible,
}: NotificationPermissionPromptProps) {
  const colors = useThemeColors();

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <Pressable className="flex-1 items-center justify-center bg-black/50 px-6">
        <Pressable
          className="w-full max-w-sm rounded-xl border p-5"
          onPress={(event) => event.stopPropagation()}
          style={{
            backgroundColor: colors.cardBg,
            borderColor: colors.border,
            borderWidth: 0.5,
          }}
        >
          <View className="gap-4">
            <View className="gap-2">
              <Text className="text-xl font-semibold" style={{ color: colors.bodyText }}>
                Stay updated in real time
              </Text>
              <Text className="text-sm leading-6" style={{ color: colors.secondaryText }}>
                Turn on notifications to get alerts for new announcements,
                schedule updates, and your request status.
              </Text>
            </View>

            <View className="gap-3">
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ busy: isLoading }}
                className="min-h-12 items-center justify-center rounded-xl px-4 active:opacity-85"
                disabled={isLoading}
                onPress={onEnable}
                style={{
                  backgroundColor: colors.primary,
                  opacity: isLoading ? 0.9 : 1,
                }}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-base font-semibold text-white">
                    Enable Notifications
                  </Text>
                )}
              </Pressable>
              <Pressable
                accessibilityRole="button"
                className="min-h-12 items-center justify-center rounded-xl border px-4 active:opacity-85"
                disabled={isLoading}
                onPress={onMaybeLater}
                style={{ borderColor: colors.border, borderWidth: 0.5 }}
              >
                <Text className="text-base font-medium" style={{ color: colors.bodyText }}>
                  Maybe Later
                </Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
