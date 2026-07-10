import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
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
import { useRegisterUserMutation } from '@/react-query/auth/auth-operations';
import { explainGraphqlErrorMessage } from '@/react-query/graphql-error';

const registerSchema = z
  .object({
    firstName: z.string().trim().max(100, 'First name is too long.'),
    lastName: z.string().trim().max(100, 'Last name is too long.'),
    email: z.email('Enter a valid email address.'),
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    confirmPassword: z
      .string()
      .min(8, 'Confirm your password to continue.'),
  })
  .superRefine((values, context) => {
    if (values.password !== values.confirmPassword) {
      context.addIssue({
        code: 'custom',
        message: 'Passwords do not match.',
        path: ['confirmPassword'],
      });
    }
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterScreen() {
  const colors = useThemeColors();
  const { tenant } = useTenant();
  const registerMutation = useRegisterUserMutation();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    defaultValues: {
      confirmPassword: '',
      email: '',
      firstName: '',
      lastName: '',
      password: '',
    },
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!tenant) {
      router.replace('/(auth)/organization-picker');
      return;
    }

    try {
      await registerMutation.mutateAsync({
        input: {
          confirmPassword: values.confirmPassword,
          email: values.email.trim().toLowerCase(),
          firstName: values.firstName.trim() || null,
          lastName: values.lastName.trim() || null,
          organizationSlug: tenant.organizationSlug,
          password: values.password,
        },
      });
      router.replace('/(main)/(tabs)');
    } catch {
      // The mutation error is rendered below.
    }
  });

  const errorMessage = registerMutation.error
    ? explainGraphqlErrorMessage(
        registerMutation.error,
        'Unable to create your account. Please try again.',
      )
    : null;

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.screenBg }}
    >
      <KeyboardAvoidingContainer>
        <View className="gap-2 pt-4">
          <Text
            accessibilityRole="header"
            className="text-3xl font-bold"
            style={{ color: colors.bodyText }}
          >
            Create account
          </Text>
          <Text className="text-base" style={{ color: colors.secondaryText }}>
            {tenant
              ? `Create an account for ${tenant.organizationName}.`
              : 'Choose an organization to continue.'}
          </Text>
        </View>

        <View className="gap-4">
          <Controller
            control={control}
            name="firstName"
            render={({ field: { onBlur, onChange, value } }) => (
              <FormInput
                autoComplete="given-name"
                error={errors.firstName?.message}
                label="First name (optional)"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="First name"
                value={value}
              />
            )}
          />
          <Controller
            control={control}
            name="lastName"
            render={({ field: { onBlur, onChange, value } }) => (
              <FormInput
                autoComplete="family-name"
                error={errors.lastName?.message}
                label="Last name (optional)"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Last name"
                value={value}
              />
            )}
          />
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
                autoComplete="new-password"
                error={errors.password?.message}
                label="Password"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="At least 8 characters"
                value={value}
              />
            )}
          />
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onBlur, onChange, value } }) => (
              <PasswordInput
                autoComplete="new-password"
                error={errors.confirmPassword?.message}
                label="Confirm password"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Enter your password again"
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
            label="Create account"
            loading={registerMutation.isPending}
            onPress={onSubmit}
          />
        </View>

        <View className="gap-2 pb-4">
          <Link href="/(auth)/login" asChild>
            <Button label="Already have an account? Sign in" variant="ghost" />
          </Link>
          <Link href="/(auth)/organization-picker" asChild>
            <Button label="Change organization" variant="ghost" />
          </Link>
        </View>
      </KeyboardAvoidingContainer>
    </SafeAreaView>
  );
}
