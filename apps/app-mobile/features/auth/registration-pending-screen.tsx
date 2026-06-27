import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useThemeColors } from '@/hooks/use-theme-colors';

export function RegistrationPendingScreen() {
  const colors = useThemeColors();

  return (
    <SafeAreaView className="flex-1 bg-brand-screen-bg" edges={['top', 'bottom']}>
      <ScrollView
        contentContainerClassName="flex-grow items-center justify-center gap-8 px-6 py-12"
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center gap-5">
          <View
            className="rounded-full p-6"
            style={{ backgroundColor: colors.subtleFill }}
          >
            <MaterialIcons color={colors.accent} name="hourglass-top" size={56} />
          </View>

          <View className="gap-3">
            <Text className="text-center text-3xl font-semibold" style={{ color: colors.bodyText }}>
              Registration Submitted!
            </Text>
            <Text className="text-center text-base leading-7" style={{ color: colors.secondaryText }}>
              Your registration has been submitted for review. Our organization staff
              will verify your information and notify you once your account is
              approved.
            </Text>
            <Text className="text-center text-sm" style={{ color: colors.mutedText }}>
              This usually takes 1–3 business days.
            </Text>
          </View>
        </View>

        <View className="w-full max-w-sm">
          <Pressable
            accessibilityRole="button"
            className="min-h-[52px] items-center justify-center rounded-xl px-4 active:opacity-85"
            onPress={() => router.replace('/(auth)/login')}
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-base font-semibold text-white">Go to Login</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
