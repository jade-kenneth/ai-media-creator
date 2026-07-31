import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/ui/form-input';
import { KeyboardAvoidingContainer } from '@/components/ui/keyboard-avoiding-container';
import { PasswordInput } from '@/components/ui/password-input';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useTenant } from '@/providers/TenantProvider';
import {
  useLoginMutation,
  useLoginWithGoogleMutation,
} from '@/react-query/auth/auth-operations';
import { explainGraphqlErrorMessage } from '@/react-query/graphql-error';
import { useGoogleSignIn } from './use-google-sign-in';

const loginSchema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginScreen() {
  const colors = useThemeColors();
  const { tenant } = useTenant();
  const { reason } = useLocalSearchParams<{ reason?: string }>();
  const loginMutation = useLoginMutation();
  const googleLoginMutation = useLoginWithGoogleMutation();
  const [googleError, setGoogleError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: { email: '', password: '' },
    resolver: zodResolver(loginSchema),
  });

  const handleGoogleIdToken = useCallback(
    async (idToken: string) => {
      setGoogleError(null);

      try {
        await googleLoginMutation.mutateAsync({ input: { idToken } });
        router.replace('/(main)/(tabs)');
      } catch (error) {
        setGoogleError(
          explainGraphqlErrorMessage(
            error instanceof Error ? error : null,
            'Unable to sign in with Google. Try again.',
          ),
        );
      }
    },
    [googleLoginMutation],
  );

  const googleSignIn = useGoogleSignIn({
    onIdToken: handleGoogleIdToken,
    onError: () => setGoogleError('Google sign-in was cancelled or failed.'),
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!tenant) {
      router.replace('/(auth)/organization-picker');
      return;
    }

    try {
      await loginMutation.mutateAsync({
        input: {
          email: values.email.trim().toLowerCase(),
          organizationSlug: tenant.organizationSlug,
          password: values.password,
        },
      });
      router.replace('/(main)/(tabs)');
    } catch {
      // The mutation error is rendered below.
    }
  });

  const errorMessage = loginMutation.error
    ? explainGraphqlErrorMessage(
        loginMutation.error,
        'Unable to sign in. Check your credentials and try again.',
      )
    : null;

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.screenBg }}
    >
      <KeyboardAvoidingContainer>
        <View className="flex-1 justify-center gap-6 py-8">
          <View className="gap-2">
            <Text
              accessibilityRole="header"
              className="text-3xl font-bold"
              style={{ color: colors.bodyText }}
            >
              Sign in
            </Text>
            <Text className="text-base" style={{ color: colors.secondaryText }}>
              {tenant
                ? `Continue to ${tenant.organizationName}.`
                : 'Choose an organization to continue.'}
            </Text>
          </View>

          {reason === 'session-expired' ? (
            <View
              className="rounded-2xl border px-4 py-3"
              style={{
                backgroundColor: colors.goldPillBg,
                borderColor: colors.goldPillBorder,
              }}
            >
              <Text className="text-sm" style={{ color: colors.goldPillText }}>
                Your session expired. Please sign in again.
              </Text>
            </View>
          ) : null}

          <View className="gap-4">
            <Controller
              control={control}
              name="email"
              render={({ field: { onBlur, onChange, value } }) => (
                <FormInput
                  autoCapitalize="none"
                  autoComplete="email"
                  error={errors.email?.message}
                  keyboardType="email-address"
                  label="Email"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="you@example.com"
                  value={value}
                />
              )}
            />
            <Controller
              control={control}
              name="password"
              render={({ field: { onBlur, onChange, value } }) => (
                <PasswordInput
                  autoComplete="current-password"
                  error={errors.password?.message}
                  label="Password"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="Enter your password"
                  value={value}
                />
              )}
            />

            {errorMessage ? (
              <Text
                accessibilityRole="alert"
                className="text-sm"
                selectable
                style={{ color: colors.error }}
              >
                {errorMessage}
              </Text>
            ) : null}

            <Button
              label="Sign in"
              loading={loginMutation.isPending}
              onPress={onSubmit}
            />

            {googleSignIn.isAvailable ? (
              <>
                <Button
                  label="Continue with Google"
                  loading={googleLoginMutation.isPending}
                  onPress={() => {
                    setGoogleError(null);
                    void googleSignIn.promptAsync?.();
                  }}
                  variant="secondary"
                />
                {googleError ? (
                  <Text
                    accessibilityRole="alert"
                    className="text-sm"
                    selectable
                    style={{ color: colors.error }}
                  >
                    {googleError}
                  </Text>
                ) : null}
              </>
            ) : null}
          </View>

          <View className="gap-3">
            <Link href="/(auth)/register" asChild>
              <Button label="Create account" variant="secondary" />
            </Link>
            <Link href="/(auth)/organization-picker" asChild>
              <Button label="Change organization" variant="ghost" />
            </Link>
          </View>
        </View>
      </KeyboardAvoidingContainer>
    </SafeAreaView>
  );
}
