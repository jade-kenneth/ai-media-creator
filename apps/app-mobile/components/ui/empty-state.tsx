import { SymbolView } from "expo-symbols";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import type { SFSymbol } from "sf-symbols-typescript";

import { useThemeColors } from "@/hooks/use-theme-colors";

type EmptyStateProps = {
  actionLabel?: string;
  description: string;
  icon: SFSymbol;
  iconFallback?: ReactNode;
  onAction?: () => void;
  title: string;
};

export function EmptyState({
  actionLabel,
  description,
  icon,
  iconFallback,
  onAction,
  title,
}: EmptyStateProps) {
  const colors = useThemeColors();

  return (
    <View
      className="items-center gap-4 rounded-xl px-6 py-8"
      style={{
        backgroundColor: colors.isDark ? colors.elevatedCard : colors.cardBg,
        borderColor: colors.isDark ? colors.cardBorder : colors.border,
        borderWidth: colors.isDark ? 1 : 0.5,
      }}
    >
      <View
        className="h-16 w-16 items-center justify-center rounded-full"
        style={{ backgroundColor: colors.subtleFill }}
      >
        <SymbolView
          fallback={iconFallback}
          name={icon}
          size={30}
          tintColor={colors.primary}
        />
      </View>

      <View className="items-center gap-2">
        <Text
          selectable
          className="text-center text-xl font-semibold"
          style={{ color: colors.bodyText }}
        >
          {title}
        </Text>
        <Text
          selectable
          className="text-center text-base leading-6"
          style={{ color: colors.mutedText }}
        >
          {description}
        </Text>
      </View>

      {actionLabel && onAction ? (
        <Pressable
          accessibilityLabel={actionLabel}
          accessibilityRole="button"
          className="w-full items-center rounded-xl px-4 py-3 active:opacity-80"
          onPress={onAction}
          style={{
            backgroundColor: colors.isDark ? colors.bodyText : colors.primary,
          }}
        >
          <Text
            className="text-base font-semibold"
            style={{ color: colors.isDark ? colors.screenBg : colors.cardBg }}
          >
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
