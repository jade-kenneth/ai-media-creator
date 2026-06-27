import {
  ActivityIndicator,
  Pressable,
  Text,
  type PressableProps,
} from "react-native";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { colors as lightColors } from "@/theme/colors";

const variantStyles = {
  primary: {
    container: "bg-brand-primary active:opacity-90",
    text: "text-white",
  },
  secondary: {
    container:
      "border border-brand-border bg-brand-subtle-fill active:opacity-90 dark:border-brand-dark-border dark:bg-brand-dark-elevated",
    text: "text-brand-primary dark:text-brand-dark-text",
  },
  outline: {
    container:
      "border border-brand-border bg-white active:opacity-90 dark:border-brand-dark-border dark:bg-brand-dark-card",
    text: "text-brand-primary dark:text-brand-dark-text",
  },
  destructive: {
    container: "bg-brand-error active:opacity-90",
    text: "text-white",
  },
  ghost: {
    container:
      "bg-transparent active:bg-brand-subtle-fill dark:active:bg-brand-dark-elevated",
    text: "text-brand-primary dark:text-brand-dark-text",
  },
} as const;

const lightVariantStyles = {
  primary: {
    container: "bg-brand-primary active:opacity-90",
    text: "text-white",
  },
  secondary: {
    container: "border border-brand-border bg-brand-subtle-fill active:opacity-90",
    text: "text-brand-primary",
  },
  outline: {
    container: "border border-brand-border bg-white active:opacity-90",
    text: "text-brand-primary",
  },
  destructive: {
    container: "bg-brand-error active:opacity-90",
    text: "text-white",
  },
  ghost: {
    container: "bg-transparent active:bg-brand-subtle-fill",
    text: "text-brand-primary",
  },
} as const;

type ButtonVariant = keyof typeof variantStyles;

type ButtonProps = PressableProps & {
  className?: string;
  forceLight?: boolean;
  label: string;
  loading?: boolean;
  variant?: ButtonVariant;
};

export function Button({
  className = "",
  disabled,
  forceLight = false,
  label,
  loading,
  variant = "primary",
  ...props
}: ButtonProps) {
  const colors = useThemeColors();
  const styles = forceLight ? lightVariantStyles[variant] : variantStyles[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      className={`min-h-12 items-center justify-center rounded-2xl px-4 ${
        styles.container
      } ${isDisabled ? "opacity-50" : ""} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === "secondary" || variant === "outline" || variant === "ghost"
              ? forceLight
                ? lightColors.bodyText
                : colors.bodyText
              : forceLight
                ? lightColors.cardBg
                : colors.cardBg
          }
        />
      ) : (
        <Text className={`text-base font-semibold ${styles.text}`}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
