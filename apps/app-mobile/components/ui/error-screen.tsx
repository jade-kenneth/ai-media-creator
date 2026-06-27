import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { ScreenContainer } from "@/components/ui/screen-container";
import { useThemeColors } from "@/hooks/use-theme-colors";

type ErrorScreenProps = {
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  title?: string;
};

export function ErrorScreen({
  description,
  onRetry,
  retryLabel,
  title,
}: ErrorScreenProps) {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const resolvedDescription = description ?? t("common.unableToLoadDescription");
  const resolvedRetryLabel = retryLabel ?? t("common.retry");
  const resolvedTitle = title ?? t("common.unableToLoad");

  return (
    <ScreenContainer className="justify-center">
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
          style={{ backgroundColor: colors.errorBg }}
        >
          <MaterialIcons color={colors.error} name="error-outline" size={30} />
        </View>

        <View className="items-center gap-2">
          <Text
            selectable
            className="text-center text-xl font-semibold"
            style={{ color: colors.bodyText }}
          >
            {resolvedTitle}
          </Text>
          <Text
            selectable
            className="text-center text-base leading-6"
            style={{ color: colors.mutedText }}
          >
            {resolvedDescription}
          </Text>
        </View>

        {onRetry ? (
          <Pressable
            accessibilityLabel={resolvedRetryLabel}
            accessibilityRole="button"
            className="w-full items-center rounded-xl px-4 py-3 active:opacity-80"
            onPress={onRetry}
            style={{
              backgroundColor: colors.isDark ? colors.bodyText : colors.primary,
            }}
          >
            <Text
              className="text-base font-semibold"
              style={{ color: colors.isDark ? colors.screenBg : colors.accent }}
            >
              {resolvedRetryLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </ScreenContainer>
  );
}
