import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { useThemeColors } from '@/hooks/use-theme-colors';

/**
 * Boilerplate welcome screen (first launch, unauthenticated).
 *
 * This is intentionally minimal — replace it with your own onboarding. The
 * full guided login/registration flow lives in
 * `features/auth/guided-onboarding-screen.tsx` and is reached via the
 * `/(auth)/login` and `/(auth)/register` routes.
 */
export default function OnboardingRoute() {
  const colors = useThemeColors();

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.screenBg }}
      className="flex-1"
    >
      <View className="flex-1 justify-center gap-3 px-6">
        <View
          className="mb-2 self-start rounded-full px-3 py-1"
          style={{ backgroundColor: colors.subtleFill }}
        >
          <Text
            className="text-xs font-semibold uppercase"
            style={{ color: colors.primary, letterSpacing: 1 }}
          >
            Boilerplate
          </Text>
        </View>

        <Text className="text-3xl font-bold" style={{ color: colors.bodyText }}>
          App Boilerplate
        </Text>
        <Text className="text-base" style={{ color: colors.secondaryText }}>
          Expo · React Native · TanStack Query · NativeWind. A multi-tenant
          member app starter with auth, push notifications, theming and i18n
          already wired up.
        </Text>

        <View className="mt-8 gap-3">
          <Button
            label="Sign in"
            variant="primary"
            onPress={() => router.push('/(auth)/login')}
          />
          <Button
            label="Create account"
            variant="secondary"
            onPress={() => router.push('/(auth)/register')}
          />
        </View>

        <Text
          className="mt-6 text-center text-xs"
          style={{ color: colors.mutedText }}
        >
          Edit app/(auth)/onboarding.tsx to customize this screen.
        </Text>
      </View>
    </SafeAreaView>
  );
}
