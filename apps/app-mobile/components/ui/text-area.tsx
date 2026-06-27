import { Text, TextInput, View, type TextInputProps } from "react-native";

import { useThemeColors } from "@/hooks/use-theme-colors";

type TextAreaProps = Omit<TextInputProps, "multiline"> & {
  error?: string;
  label: string;
};

export function TextArea({ error, label, ...props }: TextAreaProps) {
  const colors = useThemeColors();

  return (
    <View className="gap-2">
      <Text className="text-sm font-medium" style={{ color: colors.bodyText }}>
        {label}
      </Text>
      <View
        className="rounded-2xl border px-4"
        style={{
          backgroundColor: colors.cardBg,
          borderColor: error ? colors.error : colors.border,
          borderWidth: 0.5,
        }}
      >
        <TextInput
          accessibilityLabel={label}
          className="min-h-[100px] py-3 text-base leading-6"
          keyboardAppearance={colors.isDark ? "dark" : "light"}
          multiline
          placeholderTextColor={colors.mutedText}
          style={{ color: colors.bodyText }}
          textAlignVertical="top"
          {...props}
        />
      </View>
      {error ? (
        <Text selectable className="text-sm" style={{ color: colors.error }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
