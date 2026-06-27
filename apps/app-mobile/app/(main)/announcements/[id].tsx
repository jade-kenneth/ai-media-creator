import { AnnouncementDetailScreen } from '@/features/announcements/announcement-detail-screen';
import { useThemeColors } from '@/hooks/use-theme-colors';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Stack, useRouter } from 'expo-router';
import { Pressable } from 'react-native';

export default function AnnouncementDetailRoute() {
  const router = useRouter();
  const colors = useThemeColors();

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Announcement Details',
          headerBackVisible: false,
          headerLeftContainerStyle: { paddingLeft: 4, paddingRight: 8 },
          headerLeft: () => (
            <Pressable
              accessibilityLabel="Go back"
              accessibilityRole="button"
              className="size-10 mr-5 items-center justify-center rounded-full"
              onPress={() => router.back()}
              style={{
                backgroundColor: colors.isDark ? colors.subtleFill : '#e8f1ff',
              }}
            >
              <MaterialIcons
                color={colors.isDark ? colors.bodyText : colors.primary}
                name="arrow-back-ios-new"
                size={18}
              />
            </Pressable>
          ),
        }}
      />
      <AnnouncementDetailScreen />
    </>
  );
}
