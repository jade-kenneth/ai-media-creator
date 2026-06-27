import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useThemeColors } from '@/hooks/use-theme-colors';
import { useTenant } from '@/providers/TenantProvider';

type MobileAuthDisabledNoticeProps = {
  title: string;
};

export function MobileAuthDisabledNotice({
  title,
}: MobileAuthDisabledNoticeProps) {
  const colors = useThemeColors();
  const { tenant } = useTenant();

  return (
    <View
      className="flex-1 items-center justify-center px-6"
      style={{ backgroundColor: colors.screenBg }}
    >
      <View
        className="w-full max-w-md gap-5 rounded-2xl border bg-white p-5"
        style={{ borderColor: colors.border, borderWidth: 0.5 }}
      >
        <View className="items-center gap-2">
          <View
            className="h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.subtleFill }}
          >
            <MaterialIcons
              color={colors.primary}
              name="lock-outline"
              size={22}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
          </View>
          {tenant?.organizationName ? (
            <Text className="text-xs" style={{ color: colors.mutedText }}>
              {tenant.organizationName}
            </Text>
          ) : null}
        </View>

        <Text
          className="text-center text-lg font-semibold"
          style={{ color: colors.bodyText }}
        >
          {title}
        </Text>

        <View
          className="rounded-lg border px-3 py-2"
          style={{
            borderColor: colors.isDark
              ? 'rgba(255,255,255,0.12)'
              : 'rgba(26,31,94,0.12)',
            backgroundColor: colors.isDark
              ? 'rgba(255,255,255,0.06)'
              : 'rgba(26,31,94,0.06)',
          }}
        >
          <Text className="text-center text-sm" style={{ color: colors.secondaryText }}>
            Mobile sign in is currently disabled for this organization. You can
            continue as a guest session.
          </Text>
        </View>

        <View className="gap-2">
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/(main)/(tabs)')}
            style={({ pressed }) => ({
              height: 40,
              borderRadius: 8,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <Text className="text-sm font-semibold text-white">
              Continue to app
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/(auth)/organization-picker')}
            style={({ pressed }) => ({
              height: 38,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.9 : 1,
              backgroundColor: colors.cardBg,
            })}
          >
            <Text className="text-xs font-semibold" style={{ color: colors.bodyText }}>
              Change organization
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
