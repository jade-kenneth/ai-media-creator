import { Image } from 'expo-image';
import { ActivityIndicator, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/ui/screen-container';
import { useThemeColors } from '@/hooks/use-theme-colors';

type LoadingScreenProps = {
  message?: string;
  logoUrl?: string | null;
  organizationName?: string | null;
};

export function LoadingScreen({
  message = 'Loading your dashboard...',
  logoUrl,
  organizationName,
}: LoadingScreenProps) {
  const colors = useThemeColors();

  return (
    <ScreenContainer className="items-center justify-center">
      <View
        className="items-center gap-4 rounded-3xl px-8 py-8"
        style={{
          backgroundColor: colors.cardBg,
          borderColor: colors.border,
          borderWidth: 0.5,
        }}
      >
        {logoUrl ? (
          <Image
            accessibilityLabel={organizationName ? `${organizationName} logo` : 'Organization logo'}
            contentFit="contain"
            source={{ uri: logoUrl }}
            style={{ height: 72, width: 72, borderRadius: 16 }}
          />
        ) : (
          <View
            className="h-16 w-16 items-center justify-center rounded-2xl"
            style={{ backgroundColor: colors.subtleFill }}
          >
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        )}
        {logoUrl ? (
          <ActivityIndicator color={colors.primary} size="small" />
        ) : null}
        {organizationName ? (
          <Text
            className="text-center text-base font-semibold"
            style={{ color: colors.bodyText }}
          >
            {organizationName}
          </Text>
        ) : null}
        <Text
          selectable
          className="text-center text-sm leading-6"
          style={{ color: colors.secondaryText }}
        >
          {message}
        </Text>
      </View>
    </ScreenContainer>
  );
}
