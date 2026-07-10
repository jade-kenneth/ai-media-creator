import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { ErrorScreen } from '@/components/ui/error-screen';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { SectionHeader } from '@/components/ui/section-header';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useTenant } from '@/providers/TenantProvider';
import { useMeQuery } from '@/react-query/auth/auth-operations';

function getDisplayName(user?: {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}) {
  const name = [user?.firstName, user?.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');

  return name || user?.email || 'User';
}

export function HomeScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { tenant } = useTenant();
  const meQuery = useMeQuery();

  if (meQuery.isLoading) {
    return <LoadingScreen message="Loading your workspace..." />;
  }

  if (meQuery.isError) {
    return <ErrorScreen onRetry={() => meQuery.refetch()} />;
  }

  const user = meQuery.data?.me;

  return (
    <SafeAreaView
      className="flex-1"
      edges={['top']}
      style={{ backgroundColor: colors.screenBg }}
    >
      <ScrollView
        contentContainerClassName="gap-6 px-5 pt-5"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View
          className="gap-4 overflow-hidden rounded-3xl p-6"
          style={{ backgroundColor: colors.primary }}
        >
          <View
            className="absolute -right-12 -top-12 h-40 w-40 rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
          />
          <View className="gap-1">
            <Text
              className="text-sm font-medium"
              style={{ color: 'rgba(255,255,255,0.68)' }}
            >
              {tenant?.organizationName ?? 'Workspace'}
            </Text>
            <Text
              accessibilityRole="header"
              className="text-2xl font-bold text-white"
            >
              Welcome, {getDisplayName(user)}
            </Text>
          </View>
          <Text
            className="max-w-[300px] text-sm leading-5"
            style={{ color: 'rgba(255,255,255,0.75)' }}
          >
            Authentication, tenant context, profile settings, and push
            notifications are ready for your product features.
          </Text>
        </View>

        <View className="gap-3">
          <SectionHeader title="Starter navigation" />
          <Card
            accessibilityHint="Opens your notification inbox"
            accessibilityLabel="Notifications"
            className="flex-row items-center gap-3"
            onPress={() => router.push('/(main)/(tabs)/notifications')}
          >
            <View
              className="h-11 w-11 items-center justify-center rounded-2xl"
              style={{ backgroundColor: colors.infoBg }}
            >
              <MaterialIcons
                color={colors.infoText}
                name="notifications-none"
                size={22}
              />
            </View>
            <View className="flex-1 gap-0.5">
              <Text
                className="text-base font-semibold"
                style={{ color: colors.bodyText }}
              >
                Notifications
              </Text>
              <Text className="text-sm" style={{ color: colors.secondaryText }}>
                Review push and in-app notifications.
              </Text>
            </View>
            <MaterialIcons
              color={colors.mutedText}
              name="chevron-right"
              size={22}
            />
          </Card>

          <Card
            accessibilityHint="Opens profile and app settings"
            accessibilityLabel="Profile and settings"
            className="flex-row items-center gap-3"
            onPress={() => router.push('/(main)/(tabs)/profile')}
          >
            <View
              className="h-11 w-11 items-center justify-center rounded-2xl"
              style={{ backgroundColor: colors.subtleFill }}
            >
              <MaterialIcons color={colors.primary} name="person" size={22} />
            </View>
            <View className="flex-1 gap-0.5">
              <Text
                className="text-base font-semibold"
                style={{ color: colors.bodyText }}
              >
                Profile and settings
              </Text>
              <Text className="text-sm" style={{ color: colors.secondaryText }}>
                Manage your profile, preferences, and account.
              </Text>
            </View>
            <MaterialIcons
              color={colors.mutedText}
              name="chevron-right"
              size={22}
            />
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
