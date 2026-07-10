import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function MainLayout() {
  const colors = useThemeColors();
  const { t } = useTranslation();

  return (
    <Stack
      screenOptions={{
        contentStyle: {
          backgroundColor: colors.screenBg,
        },
        headerBackButtonDisplayMode: 'minimal',
        headerShadowVisible: true,
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.cardBg,
        },
        headerTintColor: colors.bodyText,
        headerTitleStyle: {
          color: colors.bodyText,
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="profile/edit"
        options={{ title: t('navigation.editProfile') }}
      />
      <Stack.Screen
        name="profile/delete-account"
        options={{ title: t('navigation.deleteAccount') }}
      />
    </Stack>
  );
}
