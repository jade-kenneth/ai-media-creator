import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { useThemeColors } from "@/hooks/use-theme-colors";

type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  actionAccessibilityLabel?: string;
  actionAccessibilityHint?: string;
  onAction?: () => void;
  rightSlot?: ReactNode;
};

export function SectionHeader({
  actionAccessibilityHint,
  actionAccessibilityLabel,
  title,
  actionLabel,
  onAction,
  rightSlot,
}: SectionHeaderProps) {
  const colors = useThemeColors();

  return (
    <View className="flex-row items-center justify-between pb-1">
      <Text
        className="text-[11px] font-medium uppercase"
        style={{ color: colors.mutedText, letterSpacing: 0.77 }}
      >
        {title}
      </Text>
      {rightSlot ? (
        <View>{rightSlot}</View>
      ) : actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityHint={actionAccessibilityHint}
          accessibilityLabel={actionAccessibilityLabel ?? actionLabel}
          hitSlop={8}
          onPress={onAction}
        >
          <Text
            className="text-xs"
            style={{ color: colors.secondaryText }}
          >
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
