import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Text, View } from "react-native";

import { useThemeColors } from "@/hooks/use-theme-colors";

export function PinnedBadge() {
  const colors = useThemeColors();
  const pinnedTone = colors.isDark ? colors.bodyText : colors.primary;

  return (
    <View
      className="flex-row items-center gap-1 self-start rounded-full border px-2 py-0.5"
      style={{
        backgroundColor: colors.subtleFill,
        borderColor: colors.cardBorder,
        borderWidth: 0.5,
      }}
    >
      <MaterialIcons color={pinnedTone} name="push-pin" size={12} />
      <Text className="text-xs font-semibold" style={{ color: pinnedTone }}>
        Pinned
      </Text>
    </View>
  );
}
