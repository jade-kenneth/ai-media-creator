import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import { z } from 'zod';

import { FormInput } from '@/components/ui/form-input';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { KeyboardAvoidingContainer } from '@/components/ui/keyboard-avoiding-container';
import { PasswordInput } from '@/components/ui/password-input';
import { useTenant } from '@/providers/TenantProvider';
import { useRegisterMemberMutation } from '@/react-query/auth/auth-operations';
import { explainGraphqlErrorMessage } from '@/react-query/graphql-error';
import { useTenantColors } from '@/theme/use-tenant-colors';

const registerSchema = z
  .object({
    firstName: z.string().trim().min(1, 'First name is required.'),
    lastName: z.string().trim().min(1, 'Last name is required.'),
    email: z.email('Enter a valid email address.'),
    contactNumber: z
      .union([
        z.literal(''),
        z
          .string()
          .trim()
          .min(7, 'Enter a valid contact number.')
          .regex(/^[0-9+\-()\s]+$/, 'Enter a valid contact number.'),
      ])
      .optional(),
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    confirmPassword: z.string().min(8, 'Confirm your password.'),
  })
  .superRefine((value, context) => {
    if (value.password !== value.confirmPassword) {
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
  const tenantColors = useTenantColors();
  const registerMutation = useRegisterMemberMutation();

  useEffect(() => {
    if (!tenant) {
      router.replace('/(auth)/organization-picker' as any);
    }
  }, [tenant]);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      contactNumber: '',
      password: '',
      confirmPassword: '',
    },
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!tenant) return;
    try {
      await registerMutation.mutateAsync({
        input: {
          organizationSlug: tenant.organizationSlug,
          confirmPassword: values.confirmPassword,
          contactNumber: values.contactNumber || undefined,
          email: values.email,
          firstName: values.firstName,
          lastName: values.lastName,
          password: values.password,
        },
      });
      router.replace('/(auth)/registration-pending');
    } catch {
      // Mutation state is rendered below.
    }
  });

  return (
    <KeyboardAvoidingContainer contentContainerClassName="bg-brand-screen-bg">
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
          accessibilityLabel="Back to organization picker"
          className="h-10 w-10 items-center justify-center rounded-full active:opacity-80"
          disabled={registerMutation.isPending}
          onPress={() => router.replace('/(auth)/organization-picker')}
          style={{
            backgroundColor: colors.subtleFill,
            opacity: registerMutation.isPending ? 0.55 : 1,
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
              Member Portal
            </Text>
            {tenant?.organizationName ? (
              <Text className="text-sm" style={{ color: colors.mutedText }}>
                {tenant.organizationName}
              </Text>
            ) : null}
          </View>
        </View>

        <View className="gap-1">
          <Text
            className="text-[22px] mx-auto font-semibold"
            style={{ color: colors.bodyText }}
          >
            Create Your Account
          </Text>
          <Text
            className="text-sm text-center"
            style={{ color: colors.secondaryText }}
          >
            Register to submit requests and access member services.
          </Text>
        </View>

        {/* Basic Profile */}
        <View
          className="gap-4 rounded-xl border p-5"
          style={{
            backgroundColor: colors.cardBg,
            borderColor: colors.border,
            borderWidth: 0.5,
          }}
        >
          <View className="flex-row items-center gap-3 pb-1">
            <View
              className="rounded-xl p-2"
              style={{ backgroundColor: colors.subtleFill }}
            >
              <MaterialIcons
                accessibilityElementsHidden
                importantForAccessibility="no"
                color={colors.primary}
                name="person"
                size={18}
              />
            </View>
            <Text
              className="text-sm font-semibold"
              style={{ color: colors.bodyText }}
            >
              Personal Info
            </Text>
          </View>
          <Controller
            control={control}
            name="firstName"
            render={({ field: { onBlur, onChange, value } }) => (
              <FormInput
                error={errors.firstName?.message}
                label="First name"
                placeholder="Enter your first name"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          <Controller
            control={control}
            name="lastName"
            render={({ field: { onBlur, onChange, value } }) => (
              <FormInput
                error={errors.lastName?.message}
                label="Last name"
                placeholder="Enter your last name"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
        </View>

        {/* Contact Info */}
        <View
          className="gap-4 rounded-xl border p-5"
          style={{
            backgroundColor: colors.cardBg,
            borderColor: colors.border,
            borderWidth: 0.5,
          }}
        >
          <View className="flex-row items-center gap-3 pb-1">
            <View
              className="rounded-xl p-2"
              style={{ backgroundColor: colors.subtleFill }}
            >
              <MaterialIcons
                accessibilityElementsHidden
                importantForAccessibility="no"
                color={colors.primary}
                name="contacts"
                size={18}
              />
            </View>
            <Text
              className="text-sm font-semibold"
              style={{ color: colors.bodyText }}
            >
              Contact Info
            </Text>
          </View>
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
                placeholder="Enter your email"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          <Controller
            control={control}
            name="contactNumber"
            render={({ field: { onBlur, onChange, value } }) => (
              <FormInput
                error={errors.contactNumber?.message}
                keyboardType="phone-pad"
                label="Contact number (optional)"
                placeholder="e.g. 09123456789"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
        </View>

        {/* Security */}
        <View
          className="gap-4 rounded-xl border p-5"
          style={{
            backgroundColor: colors.cardBg,
            borderColor: colors.border,
            borderWidth: 0.5,
          }}
        >
          <View className="flex-row items-center gap-3 pb-1">
            <View
              className="rounded-xl p-2"
              style={{ backgroundColor: colors.subtleFill }}
            >
              <MaterialIcons
                accessibilityElementsHidden
                importantForAccessibility="no"
                color={colors.primary}
                name="lock"
                size={18}
              />
            </View>
            <Text
              className="text-sm font-semibold"
              style={{ color: colors.bodyText }}
            >
              Security
            </Text>
          </View>
          <Controller
            control={control}
            name="password"
            render={({ field: { onBlur, onChange, value } }) => (
              <PasswordInput
                error={errors.password?.message}
                label="Password"
                placeholder="Enter your password"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onBlur, onChange, value } }) => (
              <PasswordInput
                error={errors.confirmPassword?.message}
                label="Confirm password"
                placeholder="Re-enter your password"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
        </View>

        {/* Submit */}
        <View className="gap-4">
          {registerMutation.error ? (
            <Text
              accessibilityRole="alert"
              selectable
              className="text-sm"
              style={{ color: colors.error }}
            >
              {explainGraphqlErrorMessage(
                registerMutation.error,
                'Unable to complete registration.',
              )}
            </Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create account"
            accessibilityState={{ busy: registerMutation.isPending }}
            className="min-h-[52px] items-center justify-center rounded-xl px-4 active:opacity-85"
            disabled={registerMutation.isPending}
            onPress={onSubmit}
            style={{
              backgroundColor: colors.primary,
              opacity: registerMutation.isPending ? 0.9 : 1,
            }}
          >
            {registerMutation.isPending ? (
              <ActivityIndicator color={colors.cardBg} />
            ) : (
              <Text className="text-base font-semibold text-white">
                Create Account
              </Text>
            )}
          </Pressable>
        </View>

        <View className="flex-row flex-wrap justify-center gap-1 pt-1">
          <Text className="text-sm" style={{ color: colors.secondaryText }}>
            Already have an account?
          </Text>
          <Link
            accessibilityHint="Opens the login screen."
            accessibilityLabel="Log in"
            href="/login"
            role="link"
          >
            <Text
              className="text-sm font-semibold"
              style={{ color: colors.primary, opacity: 0.7 }}
            >
              Log in
            </Text>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingContainer>
  );
}
