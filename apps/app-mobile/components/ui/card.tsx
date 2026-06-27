import type { PropsWithChildren } from "react";
import { Pressable, View, type PressableProps } from "react-native";

type CardProps = PropsWithChildren<{
  accessibilityHint?: string;
  accessibilityLabel?: string;
  className?: string;
  onPress?: PressableProps["onPress"];
}>;

export function Card({
  accessibilityHint,
  accessibilityLabel,
  children,
  className = "",
  onPress,
}: CardProps) {
  const baseStyles =
    "rounded-2xl border border-brand-border bg-brand-card-bg px-4 py-4 shadow-sm shadow-black/5 dark:border-brand-dark-border dark:bg-brand-dark-card dark:shadow-black/20";

  if (onPress) {
    return (
      <Pressable
        accessibilityHint={accessibilityHint}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        className={`${baseStyles} active:bg-brand-subtle-fill dark:active:bg-brand-dark-elevated ${className}`}
        onPress={onPress}
      >
        {children}
      </Pressable>
    );
  }

  return <View className={`${baseStyles} ${className}`}>{children}</View>;
}
