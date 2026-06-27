import { Text, View } from "react-native";

import { useThemeColors } from "@/hooks/use-theme-colors";

type ReadOnlyFieldProps = {
  label: string;
  value: string;
};

export function ReadOnlyField({ label, value }: ReadOnlyFieldProps) {
  const colors = useThemeColors();

  return (
    <View className="gap-1">
      <Text className="text-sm font-medium" style={{ color: colors.mutedText }}>
        {label}
      </Text>
      <View
        className="rounded-2xl border px-4 py-3"
        style={{
          backgroundColor: colors.subtleFill,
          borderColor: colors.border,
          borderWidth: 0.5,
        }}
      >
        <Text
          selectable
          className="text-base"
          style={{ color: colors.bodyText }}
        >
          {value || "—"}
        </Text>
      </View>
    </View>
  );
}
