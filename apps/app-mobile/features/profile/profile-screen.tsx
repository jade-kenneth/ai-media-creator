import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AlertModal } from '@/components/ui/alert-modal';
import { ErrorScreen } from '@/components/ui/error-screen';
import { InfoRow } from '@/components/ui/info-row';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { SectionHeader } from '@/components/ui/section-header';
import { showToast } from '@/components/ui/toast';
import {
  enablePushNotificationsForSession,
  isPushNotificationsEnabledForSession,
} from '@/features/notifications/push-notifications';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useSession } from '@/providers/AuthProvider';
import {
  type LanguagePreference,
  useLanguagePreference,
} from '@/providers/LanguagePreferenceProvider';
import { useTenant } from '@/providers/TenantProvider';
import {
  type ThemePreference,
  useThemePreference,
} from '@/providers/ThemePreferenceProvider';
import {
  useLogoutMutation,
  useMeQuery,
} from '@/react-query/auth/auth-operations';

type ActionRowProps = {
  description?: string;
  disabled?: boolean;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: () => void;
  tone?: 'default' | 'destructive';
  value?: string;
};

function ActionRow({
  description,
  disabled,
  icon,
  label,
  onPress,
  tone = 'default',
  value,
}: ActionRowProps) {
  const colors = useThemeColors();
  const foreground = tone === 'destructive' ? colors.error : colors.bodyText;

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      className="flex-row items-center gap-3 px-4 py-3.5 active:opacity-80"
      disabled={disabled}
      onPress={onPress}
      style={{ opacity: disabled ? 0.55 : 1 }}
    >
      <View
        className="h-10 w-10 items-center justify-center rounded-2xl"
        style={{
          backgroundColor:
            tone === 'destructive' ? colors.errorBg : colors.subtleFill,
        }}
      >
        <MaterialIcons color={foreground} name={icon} size={19} />
      </View>
      <View className="min-w-0 flex-1 gap-0.5">
        <Text className="text-sm font-medium" style={{ color: foreground }}>
          {label}
        </Text>
        {description ? (
          <Text
            className="text-xs"
            numberOfLines={2}
            style={{ color: colors.mutedText }}
          >
            {description}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text className="text-xs" style={{ color: colors.mutedText }}>
          {value}
        </Text>
      ) : null}
      <MaterialIcons color={colors.mutedText} name="chevron-right" size={20} />
    </Pressable>
  );
}

function Divider() {
  const colors = useThemeColors();
  return <View className="mx-4 h-px" style={{ backgroundColor: colors.border }} />;
}

function getDisplayName(user?: {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}) {
  const fullName = [user?.firstName, user?.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');
  return fullName || user?.email || 'User';
}

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function formatRole(value?: string) {
  if (!value) return '—';
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function ProfileScreen() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const tabBarHeight = useBottomTabBarHeight();
  const session = useSession();
  const { tenant, clearTenant } = useTenant();
  const {
    preference: languagePreference,
    setPreference: setLanguagePreference,
  } = useLanguagePreference();
  const {
    preference: themePreference,
    setPreference: setThemePreference,
  } = useThemePreference();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [changeOrganizationModalVisible, setChangeOrganizationModalVisible] =
    useState(false);
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [isCheckingPush, setIsCheckingPush] = useState(false);
  const [isEnablingPush, setIsEnablingPush] = useState(false);
  const meQuery = useMeQuery();
  const user = meQuery.data?.me;

  const sessionKey =
    session.status === 'authenticated'
      ? `${session.role}:${session.accessToken.slice(0, 16)}`
      : null;

  const logoutMutation = useLogoutMutation({
    onSuccess: () => queryClient.clear(),
  });

  const refreshPushStatus = useCallback(async () => {
    if (!sessionKey) {
      setIsPushEnabled(false);
      return;
    }

    setIsCheckingPush(true);
    try {
      setIsPushEnabled(await isPushNotificationsEnabledForSession(sessionKey));
    } finally {
      setIsCheckingPush(false);
    }
  }, [sessionKey]);

  const handleEnablePush = useCallback(async () => {
    if (!sessionKey) return;
    setIsEnablingPush(true);

    try {
      const result = await enablePushNotificationsForSession(sessionKey);
      const enabled =
        result.status === 'registered' ||
        result.status === 'already-registered';
      setIsPushEnabled(enabled);
      showToast({
        message: enabled
          ? 'Push notifications are enabled.'
          : 'Unable to enable push notifications. Check device permissions.',
        type: enabled ? 'success' : 'info',
      });
    } finally {
      setIsEnablingPush(false);
      void refreshPushStatus();
    }
  }, [refreshPushStatus, sessionKey]);

  const handleLogout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
      setLogoutModalVisible(false);
    } catch (error) {
      Alert.alert(
        'Logout failed',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  }, [logoutMutation]);

  const handleChangeOrganization = useCallback(async () => {
    setChangeOrganizationModalVisible(false);
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // Local session cleanup runs even when the remote logout fails.
    }
    await clearTenant();
    queryClient.clear();
    router.replace('/(auth)/organization-picker');
  }, [clearTenant, logoutMutation, queryClient, router]);

  useFocusEffect(
    useCallback(() => {
      void refreshPushStatus();
    }, [refreshPushStatus]),
  );

  if (meQuery.isLoading) {
    return <LoadingScreen message="Loading profile..." />;
  }

  if (meQuery.isError) {
    return (
      <ErrorScreen
        description={t('profile.unableToLoadDescription')}
        onRetry={() => meQuery.refetch()}
        title={t('profile.unableToLoadTitle')}
      />
    );
  }

  const displayName = getDisplayName(user);
  const languageOptions: Array<{
    label: string;
    value: LanguagePreference;
  }> = [
    { label: t('common.systemDefault'), value: 'system' },
    { label: t('common.english'), value: 'en' },
    { label: t('common.tagalog'), value: 'tl' },
  ];
  const themeOptions: Array<{ label: string; value: ThemePreference }> = [
    { label: t('common.systemDefault'), value: 'system' },
    { label: t('profile.light'), value: 'light' },
    { label: t('profile.dark'), value: 'dark' },
  ];

  return (
    <>
      <SafeAreaView
        className="flex-1"
        edges={['top']}
        style={{ backgroundColor: colors.screenBg }}
      >
        <ScrollView
          contentContainerClassName="gap-5 px-5 pt-5"
          contentContainerStyle={{ paddingBottom: tabBarHeight + 35 }}
          showsVerticalScrollIndicator={false}
        >
          <View
            className="flex-row items-center gap-4 rounded-3xl p-5"
            style={{ backgroundColor: colors.primary }}
          >
            <View
              className="h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
            >
              <Text className="text-xl font-bold text-white">
                {getInitials(displayName) || '?'}
              </Text>
            </View>
            <View className="min-w-0 flex-1 gap-1">
              <Text className="text-xl font-bold text-white" numberOfLines={2}>
                {displayName}
              </Text>
              <Text
                className="text-sm"
                numberOfLines={1}
                style={{ color: 'rgba(255,255,255,0.7)' }}
              >
                {user?.email}
              </Text>
              {tenant?.organizationName ? (
                <Text
                  className="text-xs"
                  numberOfLines={1}
                  style={{ color: 'rgba(255,255,255,0.6)' }}
                >
                  {tenant.organizationName}
                </Text>
              ) : null}
            </View>
          </View>

          <View className="gap-2">
            <SectionHeader title={t('profile.accountInformation')} />
            <View
              className="rounded-3xl border px-4"
              style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
            >
              <InfoRow label={t('profile.email')} value={user?.email} />
              <Divider />
              <InfoRow label={t('profile.role')} value={formatRole(user?.role)} />
              <Divider />
              <InfoRow label={t('profile.position')} value={user?.position} />
            </View>
          </View>

          <View className="gap-2">
            <SectionHeader title={t('profile.settings')} />
            <View
              className="overflow-hidden rounded-3xl border"
              style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
            >
              <ActionRow
                description={t('profile.editProfileDescription')}
                icon="edit"
                label={t('profile.editProfile')}
                onPress={() => router.push('/(main)/profile/edit')}
              />
              <Divider />
              <ActionRow
                description={
                  isPushEnabled
                    ? t('profile.pushEnabledDescription')
                    : t('profile.pushDisabledDescription')
                }
                disabled={isPushEnabled || isCheckingPush || isEnablingPush}
                icon={isPushEnabled ? 'notifications-active' : 'notifications-none'}
                label={t('profile.pushNotifications')}
                onPress={() => void handleEnablePush()}
                value={
                  isCheckingPush || isEnablingPush
                    ? t('profile.checking')
                    : isPushEnabled
                      ? t('profile.active')
                      : t('profile.enable')
                }
              />
              <Divider />
              <ActionRow
                description={tenant?.organizationName ?? undefined}
                icon="business"
                label={t('profile.changeOrganization')}
                onPress={() => setChangeOrganizationModalVisible(true)}
              />
            </View>
          </View>

          <View className="gap-2">
            <SectionHeader title={t('profile.language')} />
            <View
              className="overflow-hidden rounded-3xl border"
              style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
            >
              {languageOptions.map((option, index) => (
                <View key={option.value}>
                  <ActionRow
                    icon={
                      languagePreference === option.value
                        ? 'radio-button-checked'
                        : 'radio-button-unchecked'
                    }
                    label={option.label}
                    onPress={() => setLanguagePreference(option.value)}
                  />
                  {index < languageOptions.length - 1 ? <Divider /> : null}
                </View>
              ))}
            </View>
          </View>

          <View className="gap-2">
            <SectionHeader title={t('profile.appearance')} />
            <View
              className="overflow-hidden rounded-3xl border"
              style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
            >
              {themeOptions.map((option, index) => (
                <View key={option.value}>
                  <ActionRow
                    icon={
                      themePreference === option.value
                        ? 'radio-button-checked'
                        : 'radio-button-unchecked'
                    }
                    label={option.label}
                    onPress={() => setThemePreference(option.value)}
                  />
                  {index < themeOptions.length - 1 ? <Divider /> : null}
                </View>
              ))}
            </View>
          </View>

          <View className="gap-2">
            <SectionHeader title={t('profile.accountActions')} />
            <View
              className="overflow-hidden rounded-3xl border"
              style={{ backgroundColor: colors.cardBg, borderColor: colors.errorBorder }}
            >
              <ActionRow
                description={t('profile.deleteAccountDescription')}
                icon="person-remove"
                label={t('profile.deleteAccount')}
                onPress={() => router.push('/(main)/profile/delete-account')}
                tone="destructive"
              />
              <Divider />
              <ActionRow
                icon="logout"
                label={t('profile.logout')}
                onPress={() => setLogoutModalVisible(true)}
                tone="destructive"
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      <AlertModal
        confirmLabel={t('profile.logout')}
        confirmVariant="destructive"
        description={t('profile.logoutDescription')}
        loading={logoutMutation.isPending}
        title={t('profile.logoutQuestion')}
        visible={logoutModalVisible}
        onCancel={() => setLogoutModalVisible(false)}
        onConfirm={() => void handleLogout()}
      />
      <AlertModal
        confirmLabel={t('profile.changeOrganization')}
        confirmVariant="destructive"
        description={t('profile.changeOrganizationDescription')}
        loading={logoutMutation.isPending}
        title={t('profile.changeOrganizationQuestion')}
        visible={changeOrganizationModalVisible}
        onCancel={() => setChangeOrganizationModalVisible(false)}
        onConfirm={() => void handleChangeOrganization()}
      />
    </>
  );
}
