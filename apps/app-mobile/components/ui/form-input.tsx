import { Text, TextInput, View, type TextInputProps } from "react-native";

import { useThemeColors } from "@/hooks/use-theme-colors";
import { colors as lightColors } from "@/theme/colors";

type FormInputProps = TextInputProps & {
  error?: string;
  forceLight?: boolean;
  label: string;
  rightSlot?: React.ReactNode;
};

export function FormInput({
  error,
  forceLight = false,
  label,
  rightSlot,
  ...props
}: FormInputProps) {
  const colors = useThemeColors();
  const palette = forceLight ? lightColors : colors;

  return (
    <View className="gap-2">
      <Text className="text-sm font-medium" style={{ color: palette.bodyText }}>
        {label}
      </Text>
      <View
        className="flex-row items-center rounded-2xl border px-4"
        style={{
          backgroundColor: palette.cardBg,
          borderColor: error ? palette.error : palette.border,
          borderWidth: 0.5,
        }}
      >
        <TextInput
          accessibilityLabel={label}
          className="flex-1 py-3 text-base"
          keyboardAppearance={
            forceLight ? "light" : colors.isDark ? "dark" : "light"
          }
          placeholderTextColor={palette.mutedText}
          style={{ color: palette.bodyText }}
          {...props}
        />
        {rightSlot}
      </View>
      {error ? (
        <Text selectable className="text-sm" style={{ color: palette.error }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
