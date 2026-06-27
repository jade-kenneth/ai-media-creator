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
import { ComingSoonOverlay } from '@/components/ui/coming-soon-overlay';
import { ComingSoonPill } from '@/components/ui/coming-soon-pill';
import { ErrorScreen } from '@/components/ui/error-screen';
import { InfoRow } from '@/components/ui/info-row';
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
import { useLogoutMutation } from '@/react-query/auth/auth-operations';
import { useMyProfileQuery } from '@/react-query/profile/profile-operations';

import { ProfileSkeleton } from './components/profile-skeleton';

function getInitials(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function getYearsActive(createdAt?: string): string {
  if (!createdAt) return '0yr';

  const createdDate = new Date(createdAt);
  if (Number.isNaN(createdDate.getTime())) return '0yr';

  const years = Math.max(
    0,
    new Date().getFullYear() - createdDate.getFullYear(),
  );

  return `${years}yr`;
}

export function ProfileScreen() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const {
    preference: languagePreference,
    setPreference: setLanguagePreference,
  } = useLanguagePreference();
  const {
    preference: themePreference,
    setPreference: setThemePreference,
  } = useThemePreference();
  const router = useRouter();
  const queryClient = useQueryClient();
  const tabBarHeight = useBottomTabBarHeight();
  const session = useSession();
  const { tenant, clearTenant } = useTenant();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [changeOrganizationModalVisible, setChangeOrganizationModalVisible] =
    useState(false);
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [isCheckingPush, setIsCheckingPush] = useState(false);
  const [isEnablingPush, setIsEnablingPush] = useState(false);

  const profileQuery = useMyProfileQuery();
  const profile = profileQuery.data?.myProfile ?? null;
  const sessionKey =
    session.status === 'authenticated'
      ? `${session.role}:${session.accessToken.slice(0, 16)}`
      : null;

  const logoutMutation = useLogoutMutation({
    onSuccess: () => {
      queryClient.clear();
    },
  });

  const handleLogout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
      setLogoutModalVisible(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Please try again.';
      Alert.alert('Logout failed', message);
    }
  }, [logoutMutation]);

  const handleChangeOrganization = useCallback(async () => {
    setChangeOrganizationModalVisible(false);
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // Continue with tenant switch flow as local session is already cleared.
    }
    await clearTenant();
    queryClient.clear();
    router.replace('/(auth)/organization-picker');
  }, [clearTenant, logoutMutation, queryClient, router]);

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

  const handleEnablePushAlerts = useCallback(async () => {
    if (!sessionKey) {
      showToast({
        message: 'Please sign in again to enable push notifications.',
        type: 'error',
      });
      return;
    }

    setIsEnablingPush(true);
    try {
      const result = await enablePushNotificationsForSession(sessionKey);

      if (
        result.status === 'registered' ||
        result.status === 'already-registered'
      ) {
        setIsPushEnabled(true);
        showToast({
          message:
            result.status === 'registered'
              ? 'Push notifications are now enabled.'
              : 'Push notifications are already enabled on this device.',
          type: result.status === 'registered' ? 'success' : 'info',
        });
        return;
      }

      setIsPushEnabled(false);

      if (result.status === 'skipped') {
        if (result.reason === 'permission-denied') {
          showToast({
            message: 'Allow notifications in your device settings to continue.',
            type: 'info',
          });
          return;
        }
        if (result.reason === 'simulator') {
          showToast({
            message: 'Push notifications require a physical device.',
            type: 'info',
          });
          return;
        }
        if (result.reason === 'expo-go-not-supported') {
          showToast({
            message:
              'Push notifications require an installed development or production build.',
            type: 'info',
          });
          return;
        }
      }

      showToast({
        message: 'Unable to enable push notifications right now.',
        type: 'error',
      });
    } finally {
      setIsEnablingPush(false);
      void refreshPushStatus();
    }
  }, [refreshPushStatus, sessionKey]);

  useFocusEffect(
    useCallback(() => {
      void refreshPushStatus();
    }, [refreshPushStatus]),
  );

  if (profileQuery.isLoading) {
    return (
      <SafeAreaView
        edges={['top']}
        className="flex-1"
        style={{ backgroundColor: colors.screenBg }}
      >
        <ProfileSkeleton />
      </SafeAreaView>
    );
  }

  if (profileQuery.isError) {
    return (
      <ErrorScreen
        description={t('profile.unableToLoadDescription')}
        onRetry={() => profileQuery.refetch()}
        title={t('profile.unableToLoadTitle')}
      />
    );
  }

  const initials = profile ? getInitials(profile.fullName) : '?';
  const email = profile?.user?.email ?? '—';
  const isNotifActionDisabled =
    isPushEnabled ||
    isEnablingPush ||
    isCheckingPush ||
    session.status !== 'authenticated';

  const profileStats = [
    {
      icon: 'verified' as const,
      label: t('profile.verified'),
      value: profile ? '✓' : '—',
    },
    {
      icon: 'calendar-today' as const,
      label: t('profile.member'),
      value: getYearsActive(profile?.createdAt),
    },
  ];
  const appearanceOptions: {
    description: string;
    icon: keyof typeof MaterialIcons.glyphMap;
    label: string;
    value: ThemePreference;
  }[] = [
    {
      description: t('profile.followDeviceTheme'),
      icon: 'brightness-auto',
      label: t('common.systemDefault'),
      value: 'system',
    },
    {
      description: t('profile.alwaysLight'),
      icon: 'light-mode',
      label: t('profile.light'),
      value: 'light',
    },
    {
      description: t('profile.alwaysDark'),
      icon: 'dark-mode',
      label: t('profile.dark'),
      value: 'dark',
    },
  ];
  const languageOptions: {
    description: string;
    icon: keyof typeof MaterialIcons.glyphMap;
    label: string;
    value: LanguagePreference;
  }[] = [
    {
      description: t('profile.followDeviceLanguage'),
      icon: 'settings',
      label: t('common.systemDefault'),
      value: 'system',
    },
    {
      description: t('profile.alwaysEnglish'),
      icon: 'language',
      label: t('common.english'),
      value: 'en',
    },
    {
      description: t('profile.alwaysTagalog'),
      icon: 'translate',
      label: t('common.tagalog'),
      value: 'tl',
    },
  ];

  return (
    <>
      <SafeAreaView
        edges={['top']}
        className="flex-1"
        style={{ backgroundColor: colors.screenBg }}
      >
        <ScrollView
          contentContainerClassName="gap-5 px-5 pt-5"
          contentContainerStyle={{ paddingBottom: tabBarHeight + 35 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile hero card */}
          <View
            className="gap-4 overflow-hidden rounded-[20px] p-5"
            style={{
              backgroundColor: colors.primary,
              borderCurve: 'continuous',
            }}
          >
            <View
              className="absolute -right-10 -top-10 h-36 w-36 rounded-full opacity-10"
              style={{ backgroundColor: colors.accent }}
            />
            <View className="absolute -bottom-14 -left-14 h-44 w-44 rounded-full bg-white opacity-[0.04]" />

            {/* Avatar + name row */}
            <View className="flex-row items-center gap-4">
              <View
                className="h-20 w-20 items-center justify-center rounded-full"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.16)',
                  borderColor: colors.accent,
                  borderWidth: 2.5,
                }}
              >
                <Text className="text-2xl font-extrabold text-white">
                  {initials}
                </Text>
              </View>

              <View className="flex-1 gap-1">
                <Text
                  accessibilityRole="header"
                  className="text-[20px] font-bold text-white"
                  numberOfLines={2}
                >
                  {profile?.fullName ?? '—'}
                </Text>
                <Text
                  className="text-[13px]"
                  numberOfLines={1}
                  style={{ color: 'rgba(255,255,255,0.6)' }}
                >
                  {email}
                </Text>
                {tenant?.organizationName ? (
                  <View
                    className="mt-1 self-start flex-row items-center gap-1 rounded-full px-2.5 py-1"
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  >
                    <MaterialIcons
                      accessibilityElementsHidden
                      importantForAccessibility="no"
                      color={colors.accent}
                      name="location-city"
                      size={11}
                    />
                    <Text className="text-xs font-medium text-white">
                      {tenant.organizationName}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* Stats strip */}
            <View
              className="flex-row rounded-2xl px-2 py-3"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
            >
              {profileStats.map((stat, index) => (
                <View
                  className="flex-1 items-center gap-0.5"
                  key={stat.label}
                  style={
                    index === 0
                      ? undefined
                      : {
                          borderLeftColor: 'rgba(255,255,255,0.1)',
                          borderLeftWidth: 1,
                        }
                  }
                >
                  <Text
                    className="text-2xl font-bold"
                    style={{
                      color: colors.accent,
                      fontVariant: ['tabular-nums'],
                    }}
                  >
                    {stat.value}
                  </Text>
                  <Text
                    className="text-[11px] font-medium"
                    style={{ color: 'rgba(255,255,255,0.55)' }}
                  >
                    {stat.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Digital ID */}
          <View className="gap-1.5">
            <SectionHeader
              title={t('profile.digitalId')}
              rightSlot={<ComingSoonPill />}
            />
            <Pressable
              accessibilityLabel="Digital Member ID — Coming Soon"
              accessibilityRole="button"
              className="relative overflow-hidden rounded-[20px] p-4 active:opacity-80"
              onPress={() =>
                showToast({
                  message: 'Digital Member ID is coming soon!',
                  type: 'info',
                })
              }
              style={{
                backgroundColor: colors.primary,
                borderCurve: 'continuous',
              }}
            >
              <View
                className="absolute -right-5 -top-5 h-20 w-20 rounded-full opacity-20"
                style={{ backgroundColor: '#2d3494' }}
              />
              <View className="gap-4 opacity-40">
                <View className="flex-row items-start justify-between">
                  <View className="gap-1">
                    <Text className="text-[12px] font-semibold text-white">
                      {tenant?.organizationName ?? 'Organization Connect'}
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.62)' }}>
                      {t('profile.officialMemberId')}
                    </Text>
                  </View>
                  <MaterialIcons
                    color={colors.accent}
                    name="verified"
                    size={28}
                  />
                </View>
                <View className="gap-1">
                  <Text className="text-[17px] font-bold text-white">
                    {profile?.fullName ?? t('profile.memberName')}
                  </Text>
                  <Text
                    className="text-[11px]"
                    style={{ color: 'rgba(255,255,255,0.62)' }}
                  >
                    {t('profile.memberIdNumber')} •{' '}
                    {profile?.id?.slice(0, 8) ?? t('profile.pending')}
                  </Text>
                  <Text
                    className="text-[11px]"
                    numberOfLines={1}
                    style={{ color: 'rgba(255,255,255,0.62)' }}
                  >
                    {profile?.address ?? t('profile.addressOnFile')}
                  </Text>
                  <Text
                    className="text-[11px]"
                    style={{ color: 'rgba(255,255,255,0.62)' }}
                  >
                    {t('profile.validUntilPending')}
                  </Text>
                </View>
              </View>
              <ComingSoonOverlay
                icon="🪪"
                title={t('profile.featureComingSoon')}
                subtitle={t('profile.digitalIdComingSoon')}
              />
            </Pressable>
          </View>

          {/* Personal Information */}
          <View className="gap-1.5">
            <SectionHeader title={t('profile.personalInformation')} />
            <View
              className="rounded-[20px] border px-4"
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.border,
                borderWidth: 0.5,
                borderCurve: 'continuous',
              }}
            >
              <InfoRow label={t('profile.firstName')} value={profile?.firstName} />
              <View
                className="h-px"
                style={{ backgroundColor: colors.border }}
              />
              <InfoRow label={t('profile.lastName')} value={profile?.lastName} />
              <View
                className="h-px"
                style={{ backgroundColor: colors.border }}
              />
              <InfoRow label={t('profile.contact')} value={profile?.contactNumber} />
            </View>
          </View>

          {/* Settings */}
          <View className="gap-1.5">
            <SectionHeader title={t('profile.settings')} />
            <View
              className="rounded-[20px] border"
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.border,
                borderWidth: 0.5,
                borderCurve: 'continuous',
              }}
            >
              {/* Push Notifications */}
              <Pressable
                accessibilityLabel={
                  isPushEnabled
                    ? 'Push Notifications Active'
                    : 'Enable Push Notifications'
                }
                accessibilityRole="button"
                className="flex-row items-center gap-3 px-4 py-3.5 active:opacity-80"
                disabled={isNotifActionDisabled}
                onPress={handleEnablePushAlerts}
                style={{ opacity: isEnablingPush || isCheckingPush ? 0.55 : 1 }}
              >
                <View
                  className="h-10 w-10 items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor: isPushEnabled
                      ? colors.infoBg
                      : 'rgba(59,130,246,0.1)',
                  }}
                >
                  <MaterialIcons
                    accessibilityElementsHidden
                    importantForAccessibility="no"
                    color={isPushEnabled ? colors.infoText : '#3b82f6'}
                    name={
                      isPushEnabled
                        ? 'notifications-active'
                        : 'notifications-none'
                    }
                    size={18}
                  />
                </View>
                <Text
                  className="flex-1 text-sm font-medium"
                  style={{ color: colors.bodyText }}
                >
                  {t('profile.pushNotifications')}
                </Text>
                <View
                  className="rounded-full px-2.5 py-1"
                  style={{
                    backgroundColor: isPushEnabled
                      ? colors.infoBg
                      : colors.subtleFill,
                    borderWidth: isPushEnabled ? 1 : 0,
                    borderColor: isPushEnabled
                      ? colors.infoText
                      : 'transparent',
                  }}
                >
                  <Text
                    className="text-xs font-semibold"
                    style={{
                      color: isPushEnabled ? colors.infoText : colors.mutedText,
                    }}
                  >
                    {isPushEnabled ? t('profile.active') : t('profile.enable')}
                  </Text>
                </View>
              </Pressable>

              <View
                className="mx-4 h-px"
                style={{ backgroundColor: colors.border }}
              />

              {/* Change Organization */}
              <Pressable
                accessibilityLabel="Change Organization"
                accessibilityRole="button"
                className="flex-row items-center gap-3 px-4 py-3.5 active:opacity-80"
                onPress={() => setChangeOrganizationModalVisible(true)}
              >
                <View
                  className="h-10 w-10 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: 'rgba(20,184,166,0.1)' }}
                >
                  <MaterialIcons
                    accessibilityElementsHidden
                    importantForAccessibility="no"
                    color="#14b8a6"
                    name="location-city"
                    size={18}
                  />
                </View>
                <View className="flex-1 gap-0.5">
                  <Text
                    className="text-sm font-medium"
                    style={{ color: colors.bodyText }}
                  >
                    {t('profile.changeOrganization')}
                  </Text>
                  {tenant?.organizationName ? (
                    <Text
                      className="text-xs"
                      numberOfLines={1}
                      style={{ color: colors.mutedText }}
                    >
                      {tenant.organizationName}
                    </Text>
                  ) : null}
                </View>
                <MaterialIcons
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                  color={colors.mutedText}
                  name="chevron-right"
                  size={20}
                />
              </Pressable>

              <View
                className="mx-4 h-px"
                style={{ backgroundColor: colors.border }}
              />

              <View className="flex-row items-center gap-3 px-4 py-3.5">
                <View
                  className="h-10 w-10 items-center justify-center rounded-2xl border"
                  style={{
                    backgroundColor: colors.goldPillBg,
                    borderColor: colors.goldPillBorder,
                  }}
                >
                  <MaterialIcons
                    color={colors.goldPillText}
                    name="language"
                    size={18}
                  />
                </View>
                <View className="flex-1 gap-0.5">
                  <Text
                    className="text-sm font-medium"
                    style={{ color: colors.bodyText }}
                  >
                    {t('profile.language')}
                  </Text>
                  <Text className="text-xs" style={{ color: colors.mutedText }}>
                    {t('profile.languageDescription')}
                  </Text>
                </View>
              </View>

              {languageOptions.map((option) => {
                const isSelected = languagePreference === option.value;

                return (
                  <Pressable
                    accessibilityLabel={option.label}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    className="flex-row items-center gap-3 px-4 py-3.5 active:opacity-80"
                    key={option.value}
                    onPress={() => setLanguagePreference(option.value)}
                  >
                    <View
                      className="h-10 w-10 items-center justify-center rounded-2xl border"
                      style={{
                        backgroundColor: isSelected
                          ? colors.infoBg
                          : colors.subtleFill,
                        borderColor: isSelected
                          ? colors.infoBorder
                          : colors.border,
                      }}
                    >
                      <MaterialIcons
                        color={isSelected ? colors.infoText : colors.bodyText}
                        name={option.icon}
                        size={18}
                      />
                    </View>
                    <View className="flex-1 gap-0.5">
                      <Text
                        className="text-sm font-medium"
                        style={{ color: colors.bodyText }}
                      >
                        {option.label}
                      </Text>
                      <Text
                        className="text-xs"
                        style={{ color: colors.mutedText }}
                      >
                        {option.description}
                      </Text>
                    </View>
                    <MaterialIcons
                      color={isSelected ? colors.infoText : colors.mutedText}
                      name={
                        isSelected ? 'check-circle' : 'radio-button-unchecked'
                      }
                      size={20}
                    />
                  </Pressable>
                );
              })}

              <View
                className="mx-4 h-px"
                style={{ backgroundColor: colors.border }}
              />

              <View className="flex-row items-center gap-3 px-4 py-3.5">
                <View
                  className="h-10 w-10 items-center justify-center rounded-2xl border"
                  style={{
                    backgroundColor: colors.isDark
                      ? colors.elevatedCard
                      : colors.subtleFill,
                    borderColor: colors.isDark
                      ? colors.cardBorder
                      : 'transparent',
                    borderWidth: colors.isDark ? 1 : 0,
                  }}
                >
                  <MaterialIcons
                    color={colors.isDark ? colors.goldPillText : colors.primary}
                    name="palette"
                    size={18}
                  />
                </View>
                <View className="flex-1 gap-0.5">
                  <Text
                    className="text-sm font-medium"
                    style={{ color: colors.bodyText }}
                  >
                    {t('profile.appearance')}
                  </Text>
                  <Text className="text-xs" style={{ color: colors.mutedText }}>
                    {t('profile.appearanceDescription')}
                  </Text>
                </View>
              </View>

              {appearanceOptions.map((option, index) => {
                const isSelected = themePreference === option.value;

                return (
                  <View key={option.value}>
                    <Pressable
                      accessibilityLabel={option.label}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                      className="flex-row items-center gap-3 px-4 py-3.5 active:opacity-80"
                      onPress={() => setThemePreference(option.value)}
                    >
                      <View
                        className="h-10 w-10 items-center justify-center rounded-2xl border"
                        style={{
                          backgroundColor: isSelected
                            ? colors.infoBg
                            : colors.isDark
                              ? colors.elevatedCard
                              : colors.subtleFill,
                          borderColor:
                            isSelected || colors.isDark
                              ? isSelected
                                ? colors.infoBorder
                                : colors.cardBorder
                              : 'transparent',
                          borderWidth: isSelected || colors.isDark ? 1 : 0,
                        }}
                      >
                        <MaterialIcons
                          color={
                            isSelected
                              ? colors.infoText
                              : colors.isDark
                                ? colors.bodyText
                                : colors.secondaryText
                          }
                          name={option.icon}
                          size={18}
                        />
                      </View>
                      <View className="flex-1 gap-0.5">
                        <Text
                          className="text-sm font-medium"
                          style={{ color: colors.bodyText }}
                        >
                          {option.label}
                        </Text>
                        <Text
                          className="text-xs"
                          style={{ color: colors.mutedText }}
                        >
                          {option.description}
                        </Text>
                      </View>
                      {isSelected ? (
                        <MaterialIcons
                          color={colors.infoText}
                          name="check-circle"
                          size={20}
                        />
                      ) : (
                        <MaterialIcons
                          color={colors.mutedText}
                          name="radio-button-unchecked"
                          size={20}
                        />
                      )}
                    </Pressable>
                    {index < appearanceOptions.length - 1 ? (
                      <View
                        className="mx-4 h-px"
                        style={{ backgroundColor: colors.border }}
                      />
                    ) : null}
                  </View>
                );
              })}
            </View>
          </View>

          {/* Log Out */}
          <View
            className="overflow-hidden rounded-[20px] border"
            style={{
              backgroundColor: colors.cardBg,
              borderColor: colors.errorBorder,
              borderWidth: 0.5,
              borderCurve: 'continuous',
            }}
          >
            <Pressable
              accessibilityLabel="Log Out"
              accessibilityRole="button"
              className="flex-row items-center gap-3 px-4 py-4 active:opacity-80"
              onPress={() => setLogoutModalVisible(true)}
            >
              <View
                className="h-10 w-10 items-center justify-center rounded-2xl"
                style={{ backgroundColor: colors.errorBg }}
              >
                <MaterialIcons color={colors.error} name="logout" size={18} />
              </View>
              <Text
                className="flex-1 text-sm font-semibold"
                style={{ color: colors.error }}
              >
                Log Out
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>

      <AlertModal
        confirmLabel="Log Out"
        confirmVariant="destructive"
        description="You will be signed out of your account."
        loading={logoutMutation.isPending}
        title="Log out?"
        visible={logoutModalVisible}
        onCancel={() => setLogoutModalVisible(false)}
        onConfirm={handleLogout}
      />

      <AlertModal
        confirmLabel="Change Organization"
        confirmVariant="destructive"
        description="You will be signed out and returned to the organization selection screen."
        loading={logoutMutation.isPending}
        title="Change Organization?"
        visible={changeOrganizationModalVisible}
        onCancel={() => setChangeOrganizationModalVisible(false)}
        onConfirm={() => {
          void handleChangeOrganization();
        }}
      />
    </>
  );
}
