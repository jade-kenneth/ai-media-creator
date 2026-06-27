import type { PropsWithChildren } from "react";
import { Modal, Pressable, Text, View } from "react-native";

import { useThemeColors } from "@/hooks/use-theme-colors";
import { Button } from "./button";

type AlertModalProps = PropsWithChildren<{
  visible: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  confirmVariant?: "primary" | "destructive";
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}>;

export function AlertModal({
  visible,
  title,
  description,
  confirmLabel = "Confirm",
  confirmVariant = "primary",
  cancelLabel = "Cancel",
  loading = false,
  onConfirm,
  onCancel,
  children,
}: AlertModalProps) {
  const colors = useThemeColors();

  return (
    <Modal
      animationType="fade"
      onRequestClose={onCancel}
      transparent
      visible={visible}
    >
      <Pressable
        accessibilityLabel="Close dialog"
        className="flex-1 items-center justify-center px-6"
        style={{
          backgroundColor: colors.isDark
            ? 'rgba(0, 0, 0, 0.65)'
            : 'rgba(0, 0, 0, 0.4)',
        }}
        onPress={onCancel}
      >
        <Pressable
          className="w-full max-w-sm rounded-2xl p-5"
          style={{ backgroundColor: colors.cardBg, borderColor: colors.border, borderWidth: 0.5 }}
          onPress={(e) => e.stopPropagation()}
        >
          <View className="gap-3">
            <Text className="text-lg font-semibold" style={{ color: colors.bodyText }}>
              {title}
            </Text>
            {description ? (
              <Text className="text-sm leading-5" style={{ color: colors.secondaryText }}>
                {description}
              </Text>
            ) : null}

            {children ? <View className="mt-1">{children}</View> : null}

            <View className="mt-2 flex-row gap-3">
              <View className="flex-1">
                <Button
                  disabled={loading}
                  label={cancelLabel}
                  onPress={onCancel}
                  variant="outline"
                />
              </View>
              <View className="flex-1">
                <Button
                  label={confirmLabel}
                  loading={loading}
                  onPress={onConfirm}
                  variant={confirmVariant}
                />
              </View>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
