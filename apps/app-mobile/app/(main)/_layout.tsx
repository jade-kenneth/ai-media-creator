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
        name="announcements/index"
        options={{ title: t('navigation.announcements') }}
      />
      <Stack.Screen
        name="announcements/[id]"
        options={{ title: t('navigation.announcementDetails') }}
      />
      <Stack.Screen
        name="requests/[id]"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="schedules/index"
        options={{ title: t('navigation.schedules') }}
      />
      <Stack.Screen
        name="schedules/[id]"
        options={{ title: t('navigation.scheduleDetails') }}
      />
      <Stack.Screen
        name="emergency-contacts/index"
        options={{ title: t('navigation.emergencyContacts') }}
      />
      <Stack.Screen
        name="community-polls/index"
        options={{ title: t('navigation.communityPoll') }}
      />
      <Stack.Screen
        name="event-recaps/index"
        options={{ title: t('navigation.eventRecaps') }}
      />
      <Stack.Screen
        name="profile/edit"
        options={{ title: t('navigation.editProfile') }}
      />
    </Stack>
  );
}
