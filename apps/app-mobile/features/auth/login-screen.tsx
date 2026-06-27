import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import { z } from 'zod';

import { FormInput } from '@/components/ui/form-input';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { KeyboardAvoidingContainer } from '@/components/ui/keyboard-avoiding-container';
import { PasswordInput } from '@/components/ui/password-input';
import { useTenant } from '@/providers/TenantProvider';
import { useLoginMutation } from '@/react-query/auth/auth-operations';
import { explainGraphqlErrorMessage } from '@/react-query/graphql-error';
import { useTenantColors } from '@/theme/use-tenant-colors';
import { RegistrationStatusModal } from './components/registration-status-modal';

type LoginFormValues = {
  email: string;
  password: string;
};

type RegistrationErrorModal =
  | { type: 'pending' }
  | {
      type: 'rejected';
      rejectionReason?: string | null;
      rejectionNote?: string | null;
    };

export function LoginScreen() {
  const { t } = useTranslation();
  const loginSchema = useMemo(
    () =>
      z.object({
        email: z.email(t('auth.validEmail')),
        password: z.string().min(8, t('auth.passwordMin')),
      }),
    [t],
  );
  const colors = useThemeColors();
  const { reason } = useLocalSearchParams<{ reason?: string }>();
  const { tenant } = useTenant();
  const tenantColors = useTenantColors();
  const loginMutation = useLoginMutation();
  const [registrationModal, setRegistrationModal] =
    useState<RegistrationErrorModal | null>(null);
  const [notAffiliatedError, setNotAffiliatedError] = useState<string | null>(
    null,
  );
  const [invalidCredentialsError, setInvalidCredentialsError] = useState<
    string | null
  >(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: '',
      password: '',
    },
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setNotAffiliatedError(null);
    setInvalidCredentialsError(null);

    try {
      await loginMutation.mutateAsync({
        input: {
          email: values.email,
          password: values.password,
          organizationSlug: tenant?.organizationSlug,
        },
      });
      // Navigation is handled by the root layout's routing effect,
      // which fires when authState becomes 'authenticated' via subscribeToAuthStore.
    } catch (err) {
      const error = err as {
        name?: string;
        details?: Record<string, unknown>;
      } | null;
      if (error?.name === 'InvalidCredentialsError') {
        setInvalidCredentialsError(t('auth.invalidCredentials'));
        return;
      }
      if (error?.name === 'RegistrationPendingError') {
        setRegistrationModal({ type: 'pending' });
        return;
      }
      if (error?.name === 'RegistrationRejectedError') {
        setRegistrationModal({
          type: 'rejected',
          rejectionReason: error.details?.rejectionReason as
            | string
            | null
            | undefined,
          rejectionNote: error.details?.rejectionNote as
            | string
            | null
            | undefined,
        });
        return;
      }
      if (error?.name === 'NotAffiliatedMemberError') {
        setNotAffiliatedError(
          t('auth.notAffiliated'),
        );
        return;
      }
      // Other errors are rendered via loginMutation.error below.
    }
  });

  function handleBackToOrganizationPicker() {
    router.replace('/(auth)/organization-picker');
  }

  return (
    <KeyboardAvoidingContainer contentContainerClassName="justify-center bg-brand-screen-bg">
      <View
        className="gap-5 rounded-2xl border p-5 shadow-sm"
        style={{
          backgroundColor: colors.cardBg,
          borderColor: colors.border,
          borderWidth: 0.5,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('auth.backToOrganizationPicker')}
          className="h-10 w-10 items-center justify-center rounded-full active:opacity-80"
          disabled={loginMutation.isPending}
          onPress={handleBackToOrganizationPicker}
          style={{
            backgroundColor: colors.subtleFill,
            opacity: loginMutation.isPending ? 0.55 : 1,
          }}
        >
          <MaterialIcons
            accessibilityElementsHidden
            importantForAccessibility="no"
            color={colors.primary}
            name="arrow-back"
            size={22}
          />
        </Pressable>

        <View
          className="gap-4 rounded-xl border p-4"
          style={{
            backgroundColor: colors.subtleFill,
            borderColor: colors.cardBorder,
            borderWidth: 0.5,
          }}
        >
          <View className="items-center gap-2">
            <View
              className="h-16 w-16 items-center justify-center rounded-full border"
              style={{
                backgroundColor: tenantColors.subtleFill,
                borderColor: tenantColors.cardBorder,
              }}
            >
              {tenant?.organizationLogoUrl ? (
                <Image
                  accessibilityIgnoresInvertColors
                  className="h-14 w-14 rounded-full"
                  resizeMode="cover"
                  source={{ uri: tenant.organizationLogoUrl }}
                />
              ) : (
                <MaterialIcons
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                  color={tenantColors.primary}
                  name="location-city"
                  size={32}
                />
              )}
            </View>
            <Text
              className="text-center text-3xl font-semibold"
              style={{ color: colors.bodyText }}
            >
              {t('auth.memberPortal')}
            </Text>
            {tenant?.organizationName ? (
              <Text className="text-sm" style={{ color: colors.mutedText }}>
                {tenant.organizationName}
              </Text>
            ) : null}
          </View>
        </View>

        <Text
          className="text-[22px] mx-auto font-semibold"
          style={{ color: colors.bodyText }}
        >
          {t('auth.loginToAccount')}
        </Text>

        {reason === 'session-expired' ? (
          <View
            accessibilityRole="alert"
            className="flex-row items-center gap-2 rounded-xl border px-3 py-2"
            style={{
              borderColor: colors.goldPillBorder,
              backgroundColor: colors.goldPillBg,
            }}
          >
            <MaterialIcons
              accessibilityElementsHidden
              importantForAccessibility="no"
              color={colors.goldPillText}
              name="schedule"
              size={16}
            />
            <Text
              className="flex-1 text-sm"
              style={{ color: colors.goldPillText }}
            >
              {t('auth.sessionExpired')}
            </Text>
          </View>
        ) : null}

        <Controller
          control={control}
          name="email"
          render={({ field: { onBlur, onChange, value } }) => (
            <FormInput
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email?.message}
              keyboardType="email-address"
              label={t('auth.email')}
              placeholder={t('auth.enterEmail')}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onBlur, onChange, value } }) => (
            <PasswordInput
              autoComplete="password"
              error={errors.password?.message}
              label={t('auth.password')}
              placeholder={t('auth.enterPassword')}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />

        {notAffiliatedError ? (
          <Text
            accessibilityRole="alert"
            selectable
            className="text-sm"
            style={{ color: colors.error }}
          >
            {notAffiliatedError}
          </Text>
        ) : null}

        {invalidCredentialsError ? (
          <Text
            accessibilityRole="alert"
            selectable
            className="text-sm"
            style={{ color: colors.error }}
          >
            {invalidCredentialsError}
          </Text>
        ) : null}

        {loginMutation.error &&
        loginMutation.error.name !== 'InvalidCredentialsError' &&
        loginMutation.error.name !== 'RegistrationPendingError' &&
        loginMutation.error.name !== 'RegistrationRejectedError' &&
        loginMutation.error.name !== 'NotAffiliatedMemberError' ? (
          <Text
            accessibilityRole="alert"
            selectable
            className="text-sm"
            style={{ color: colors.error }}
          >
            {explainGraphqlErrorMessage(
              loginMutation.error,
              t('auth.invalidCredentials'),
            )}
          </Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('auth.login')}
          accessibilityState={{ busy: loginMutation.isPending }}
          className="min-h-[52px] items-center justify-center rounded-xl px-4 active:opacity-85"
          disabled={loginMutation.isPending}
          onPress={onSubmit}
          style={{
            backgroundColor: colors.primary,
            opacity: loginMutation.isPending ? 0.9 : 1,
          }}
        >
          {loginMutation.isPending ? (
            <ActivityIndicator color={colors.cardBg} />
          ) : (
            <Text className="text-base font-semibold text-white">
              {t('auth.login')}
            </Text>
          )}
        </Pressable>

        <View className="flex-row flex-wrap justify-center gap-1 pt-1">
          <Text className="text-sm" style={{ color: colors.secondaryText }}>
            Don&apos;t have an account?
          </Text>
          <Link
            accessibilityHint="Opens the registration screen."
            accessibilityLabel={t('auth.register')}
            href="/register"
            role="link"
          >
            <Text
              className="text-sm font-semibold"
              style={{ color: colors.primary, opacity: 0.7 }}
            >
              {t('auth.register')}
            </Text>
          </Link>
        </View>
      </View>

      {registrationModal?.type === 'pending' ? (
        <RegistrationStatusModal
          type="pending"
          visible
          onDismiss={() => setRegistrationModal(null)}
        />
      ) : null}

      {registrationModal?.type === 'rejected' ? (
        <RegistrationStatusModal
          type="rejected"
          visible
          rejectionReason={registrationModal.rejectionReason}
          rejectionNote={registrationModal.rejectionNote}
          onDismiss={() => setRegistrationModal(null)}
        />
      ) : null}
    </KeyboardAvoidingContainer>
  );
}
