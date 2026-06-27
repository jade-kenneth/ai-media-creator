import { Text, View } from "react-native";

import { useThemeColors } from "@/hooks/use-theme-colors";

type InfoRowProps = {
  label: string;
  value: string | null | undefined;
  valueClassName?: string;
};

export function InfoRow({ label, value, valueClassName = "" }: InfoRowProps) {
  const colors = useThemeColors();

  if (!value) return null;

  return (
    <View className="flex-row items-start justify-between gap-3 py-2">
      <Text className="text-sm font-medium" style={{ color: colors.mutedText }}>
        {label}
      </Text>
      <Text
        selectable
        className={`flex-1 text-right text-sm leading-5 ${valueClassName}`}
        style={valueClassName ? undefined : { color: colors.bodyText }}
        numberOfLines={4}
      >
        {value}
      </Text>
    </View>
  );
}
