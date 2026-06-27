import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/ui/form-input';
import { PasswordInput } from '@/components/ui/password-input';
import { notifyAuthChange } from '@/providers/AuthProvider/store';
import { useTenant } from '@/providers/TenantProvider';
import {
  useMeQuery,
  useLoginMutation,
  useRegisterMemberMutation,
} from '@/react-query/auth/auth-operations';
import {
  type OrganizationPickerRecord,
  useOrganizationsQuery,
} from '@/react-query/organizations/organizations-operations';
import { RegistrationStatus } from '@/react-query/generated__types';
import { explainGraphqlErrorMessage } from '@/react-query/graphql-error';
import { colors } from '@/theme/colors';
import { GuideBubble } from './components/guide-bubble';
import { OnboardingProgress } from './components/onboarding-progress';
import { OnboardingShell } from './components/onboarding-shell';
import { RegistrationStatusModal } from './components/registration-status-modal';

const AVATARS = {
  welcome: require('../../assets/onboarding_1.png'),
  fullPoint: require('../../assets/onboarding_2.png'),
  miniPoint: require('../../assets/onboarding_3.png'),
  crossed: require('../../assets/onboarding_4.png'),
  thumbs: require('../../assets/onboarding_5.png'),
} as const;
const CHOOSE_ORGANIZATION_BLUE = '#0b5ed7';

export type OnboardingStep =
  | 'welcome'
  | 'organization'
  | 'choice'
  | 'login'
  | 'register-name'
  | 'register-contact'
  | 'register-security'
  | 'submitted';

type GuidedOnboardingScreenProps = {
  initialStep?: OnboardingStep;
};

type RegistrationErrorModal =
  | { type: 'pending' }
  | {
      type: 'rejected';
      rejectionReason?: string | null;
      rejectionNote?: string | null;
    };

type OrganizationRowProps = {
  isSelected: boolean;
  item: OrganizationPickerRecord;
  onPress: () => void;
  themeColors: typeof colors;
};

const loginSchema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

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

const STEP_COPY: Record<
  OnboardingStep,
  {
    avatar: (typeof AVATARS)[keyof typeof AVATARS];
    layout: 'hero' | 'standard' | 'compact';
    message: string;
    title: string;
  }
> = {
  welcome: {
    title: 'Hello,\nKa-Organization!',
    message:
      'Welcome! I am here to help you get started. Let us set up your access step by step.',
    layout: 'hero',
    avatar: AVATARS.welcome,
  },
  organization: {
    title: 'Choose Your\nOrganization',
    message:
      'Select your organization first so we can connect you to the right local community page.',
    layout: 'standard',
    avatar: AVATARS.fullPoint,
  },
  choice: {
    title: "Let's Get You In",
    message:
      'Already have an account? Log in. New here? Create an account to continue.',
    layout: 'standard',
    avatar: AVATARS.fullPoint,
  },
  login: {
    title: 'Welcome Back!',
    message:
      'Log in to check announcements, services, and updates from your organization.',
    layout: 'compact',
    avatar: AVATARS.fullPoint,
  },
  'register-name': {
    title: "Let's Start with\nYour Name",
    message: 'Enter your name so we can begin creating your account.',
    layout: 'standard',
    avatar: AVATARS.fullPoint,
  },
  'register-contact': {
    title: 'How Can We\nReach You?',
    message:
      'Add your email and mobile number so we can send important updates about your account.',
    layout: 'standard',
    avatar: AVATARS.fullPoint,
  },
  'register-security': {
    title: 'Create Your\nPassword',
    message:
      'Choose a secure password that only you know. Keep it private and easy for you to remember.',
    layout: 'compact',
    avatar: AVATARS.crossed,
  },
  submitted: {
    title: 'Registration\nSent',
    message:
      'Your application is now under review. A organization admin will check your details first.',
    layout: 'compact',
    avatar: AVATARS.thumbs,
  },
};

const REGISTRATION_STEP_INDEX: Record<
  'register-name' | 'register-contact' | 'register-security',
  number
> = {
  'register-name': 0,
  'register-contact': 1,
  'register-security': 2,
};

function OrganizationRow({
  item,
  isSelected,
  onPress,
  themeColors,
}: OrganizationRowProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={item.name}
      android_ripple={{ color: 'rgba(26,31,94,0.08)' }}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
    >
      <View
        className="mx-3 my-1.5 flex-row items-center gap-3 rounded-xl border px-4 py-3.5"
        style={
          isSelected
            ? {
                borderColor: CHOOSE_ORGANIZATION_BLUE,
                borderWidth: 1,
                backgroundColor: '#0b5ed712',
              }
            : {
                borderColor: themeColors.border,
                borderWidth: 1,
                backgroundColor: themeColors.cardBg,
              }
        }
      >
        <View
          className="h-10 w-10 items-center justify-center overflow-hidden rounded-full border"
          style={{
            borderColor: isSelected
              ? `${themeColors.primary}40`
              : themeColors.border,
            backgroundColor: isSelected
              ? `${themeColors.primary}14`
              : themeColors.subtleFill,
          }}
        >
          {item.logoUrl ? (
            <Image
              accessibilityIgnoresInvertColors
              source={{ uri: item.logoUrl }}
              className="h-full w-full"
              resizeMode="cover"
            />
          ) : (
            <MaterialIcons
              accessibilityElementsHidden
              importantForAccessibility="no"
              color={isSelected ? themeColors.primary : themeColors.mutedText}
              name="location-city"
              size={18}
            />
          )}
        </View>
        <View className="flex-1 gap-0.5">
          <Text
            className="text-sm font-semibold"
            style={{
              color: isSelected ? themeColors.primary : themeColors.bodyText,
            }}
          >
            {item.name}
          </Text>
          <Text
            className="text-xs"
            style={{ color: themeColors.secondaryText }}
          >
            {isSelected ? 'Selected organization' : 'Tap to select'}
          </Text>
        </View>
        <MaterialIcons
          accessibilityElementsHidden
          importantForAccessibility="no"
          color={isSelected ? CHOOSE_ORGANIZATION_BLUE : themeColors.mutedText}
          name={isSelected ? 'check-circle' : 'radio-button-unchecked'}
          size={19}
        />
      </View>
    </Pressable>
  );
}

function resolveStepAfterOrganization(initialStep: OnboardingStep): OnboardingStep {
  if (initialStep === 'login') return 'login';
  if (
    initialStep === 'register-name' ||
    initialStep === 'register-contact' ||
    initialStep === 'register-security'
  ) {
    return 'register-name';
  }
  if (initialStep === 'choice') return 'choice';
  return 'choice';
}

export function GuidedOnboardingScreen({
  initialStep = 'welcome',
}: GuidedOnboardingScreenProps) {
  const { tenant, setTenant } = useTenant();
  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMemberMutation();
  const [step, setStep] = useState<OnboardingStep>(initialStep);
  const [history, setHistory] = useState<OnboardingStep[]>([]);
  const [search, setSearch] = useState('');
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(
    tenant?.organizationId ?? null,
  );
  const [registrationModal, setRegistrationModal] =
    useState<RegistrationErrorModal | null>(null);
  const [notAffiliatedError, setNotAffiliatedError] = useState<string | null>(
    null,
  );
  const [invalidCredentialsError, setInvalidCredentialsError] = useState<
    string | null
  >(null);

  const listQuery = useOrganizationsQuery({ filter: { isActive: true } });
  const registrationStatusQuery = useMeQuery(undefined, {
    enabled: step === 'submitted',
    refetchInterval: step === 'submitted' ? 15000 : false,
    staleTime: 0,
  });

  const allOrganizations = useMemo(
    () => listQuery.data?.organizations ?? [],
    [listQuery.data],
  );

  const selectedOrganization =
    allOrganizations.find((organization) => organization.id === selectedOrganizationId) ?? null;

  const filteredOrganizations = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return allOrganizations;
    return allOrganizations.filter((organization) =>
      organization.name.toLowerCase().includes(term),
    );
  }, [allOrganizations, search]);

  const nextStepAfterOrganization = resolveStepAfterOrganization(initialStep);

  const {
    control: loginControl,
    handleSubmit: submitLogin,
    formState: { errors: loginErrors },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: '',
      password: '',
    },
    resolver: zodResolver(loginSchema),
  });

  const {
    control: registerControl,
    handleSubmit: submitRegister,
    trigger: triggerRegister,
    watch: watchRegister,
    formState: { errors: registerErrors },
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

  const passwordValue = watchRegister('password');
  const confirmPasswordValue = watchRegister('confirmPassword');
  const hasStrongPassword = passwordValue.length >= 8;
  const passwordsMatch =
    hasStrongPassword && passwordValue === confirmPasswordValue;

  useEffect(() => {
    if (tenant?.organizationId) {
      setSelectedOrganizationId((current) => current ?? tenant.organizationId);
    }
  }, [tenant?.organizationId]);

  useFocusEffect(
    useCallback(() => {
      if (step !== 'submitted') {
        return undefined;
      }

      void registrationStatusQuery.refetch();

      return undefined;
    }, [registrationStatusQuery, step]),
  );

  useEffect(() => {
    if (step !== 'submitted') {
      return;
    }

    const status = registrationStatusQuery.data?.me.registrationStatus;

    if (
      status === RegistrationStatus.Approved ||
      status === RegistrationStatus.Rejected
    ) {
      notifyAuthChange();
    }
  }, [registrationStatusQuery.data?.me.registrationStatus, step]);

  useEffect(() => {
    const needsTenant =
      step === 'choice' ||
      step === 'login' ||
      step === 'register-name' ||
      step === 'register-contact' ||
      step === 'register-security';

    if (!tenant && needsTenant) {
      setStep('organization');
      setHistory([]);
    }
  }, [step, tenant]);

  function go(nextStep: OnboardingStep) {
    if (nextStep === step) return;
    setHistory((current) => [...current, step]);
    setStep(nextStep);
  }

  function goBack() {
    if (!history.length && step === 'organization' && tenant) {
      setStep('choice');
      return;
    }

    if (!history.length && step === 'choice' && tenant) {
      setStep('welcome');
      return;
    }

    if (!history.length && step === 'login' && tenant) {
      setStep('choice');
      return;
    }

    if (!history.length) return;
    setHistory((current) => {
      const copy = [...current];
      const previous = copy.pop();
      if (previous) {
        setStep(previous);
      }
      return copy;
    });
  }

  const onSubmitLogin = submitLogin(async (values) => {
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

      router.replace('/(main)/(tabs)');
    } catch (err) {
      const error = err as {
        details?: Record<string, unknown>;
        name?: string;
      } | null;

      if (error?.name === 'InvalidCredentialsError') {
        setInvalidCredentialsError('Invalid email or password.');
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
          'You are not a registered member of this organization.',
        );
      }
    }
  });

  const onSubmitRegister = submitRegister(async (values) => {
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
      // mutation error is rendered inline below
    }
  });

  async function handleContinueFromOrganization() {
    if (!selectedOrganization) return;

    await setTenant({
      address: selectedOrganization.address ?? null,
      organizationId: selectedOrganization.id,
      organizationSlug: selectedOrganization.slug,
      organizationName: selectedOrganization.name,
      organizationLogoUrl: selectedOrganization.logoUrl ?? null,
      contactNumber: selectedOrganization.contactNumber ?? null,
      primaryColor: selectedOrganization.primaryColor ?? null,
      features: selectedOrganization.features,
    });

    go(nextStepAfterOrganization);
  }

  async function continueNameStep() {
    const valid = await triggerRegister(['firstName', 'lastName']);
    if (!valid) return;
    go('register-contact');
  }

  async function continueContactStep() {
    const valid = await triggerRegister(['email', 'contactNumber']);
    if (!valid) return;
    go('register-security');
  }

  const activeContent = STEP_COPY[step];
  const canBack =
    step !== 'welcome' &&
    step !== 'submitted' &&
    (history.length > 0 ||
      ((step === 'organization' || step === 'choice' || step === 'login') &&
        !!tenant));

  return (
    <OnboardingShell
      title={activeContent.title}
      showBack={canBack}
      onBack={goBack}
      useScrollView={step !== 'organization'}
    >
      <GuideBubble
        avatarSource={activeContent.avatar}
        bubbleMinWidth={218}
        imageScale={1}
        layout={activeContent.layout}
        message={activeContent.message}
      />

      {step === 'welcome' ? (
        <View className="gap-3">
          <Button forceLight label="Next" onPress={() => go('organization')} />
        </View>
      ) : null}

      {step === 'organization' ? (
        <View className="flex-1 gap-4">
          <View
            className="flex-row items-center gap-3 rounded-2xl border px-4"
            style={{
              backgroundColor: colors.cardBg,
              borderColor: colors.border,
              borderWidth: 0.5,
              height: 48,
            }}
          >
            <MaterialIcons
              accessibilityElementsHidden
              importantForAccessibility="no"
              color={colors.mutedText}
              name="search"
              size={20}
            />
            <TextInput
              accessibilityLabel="Search organizations"
              autoCapitalize="none"
              autoCorrect={false}
              className="flex-1 text-sm"
              placeholder="Search organizations"
              placeholderTextColor={colors.mutedText}
              returnKeyType="search"
              value={search}
              onChangeText={setSearch}
              style={{ color: colors.bodyText, height: 48, paddingVertical: 0 }}
            />
            {search.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                hitSlop={8}
                onPress={() => setSearch('')}
              >
                <MaterialIcons
                  color={colors.mutedText}
                  name="close"
                  size={18}
                />
              </Pressable>
            ) : null}
          </View>

          <View
            className="flex-1 overflow-hidden rounded-2xl border"
            style={{
              backgroundColor: colors.cardBg,
              borderColor: colors.border,
              borderWidth: 0.5,
            }}
          >
            {listQuery.isLoading ? (
              <View className="flex-1 items-center justify-center gap-2 py-8">
                <ActivityIndicator color={colors.primary} />
                <Text
                  className="text-sm"
                  style={{ color: colors.secondaryText }}
                >
                  Loading organizations...
                </Text>
              </View>
            ) : listQuery.isError ? (
              <View className="items-center justify-center gap-2 px-5 py-7">
                <Text
                  className="text-center text-sm"
                  style={{ color: colors.secondaryText }}
                >
                  {explainGraphqlErrorMessage(
                    listQuery.error,
                    'Unable to load organizations. Please try again.',
                  )}
                </Text>
                <Button
                  forceLight
                  label="Try again"
                  onPress={() => void listQuery.refetch()}
                  variant="outline"
                />
              </View>
            ) : filteredOrganizations.length === 0 ? (
              <View className="items-center justify-center py-8">
                <Text
                  className="text-sm"
                  style={{ color: colors.secondaryText }}
                >
                  No organizations found.
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredOrganizations}
                extraData={selectedOrganizationId}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                contentInsetAdjustmentBehavior="automatic"
                contentContainerStyle={{ paddingBottom: 12 }}
                ListHeaderComponent={
                  <View className="px-4 py-3">
                    <Text
                      className="text-xs font-semibold"
                      style={{ color: colors.secondaryText }}
                    >
                      Organizations
                    </Text>
                    {search.trim().length > 0 ? (
                      <Text
                        className="mt-1 text-xs"
                        style={{ color: colors.mutedText }}
                      >
                        Search: {search.trim()}
                      </Text>
                    ) : null}
                  </View>
                }
                ItemSeparatorComponent={() => <View style={{ height: 2 }} />}
                renderItem={({ item }) => (
                  <OrganizationRow
                    item={item}
                    isSelected={selectedOrganizationId === item.id}
                    onPress={() => setSelectedOrganizationId(item.id)}
                    themeColors={colors}
                  />
                )}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>

          <Button
            forceLight
            disabled={!selectedOrganization || listQuery.isLoading}
            label="Proceed"
            loading={listQuery.isFetching || listQuery.isLoading}
            onPress={() => void handleContinueFromOrganization()}
          />
        </View>
      ) : null}

      {step === 'choice' ? (
        <View className="gap-3">
          <Button forceLight label="Log In" onPress={() => go('login')} />
          <Button
            forceLight
            label="Create Account"
            onPress={() => go('register-name')}
            variant="outline"
          />
        </View>
      ) : null}

      {step === 'login' ? (
        <View className="gap-4">
          <Controller
            control={loginControl}
            name="email"
            render={({ field: { onBlur, onChange, value } }) => (
              <FormInput
                forceLight
                autoCapitalize="none"
                autoComplete="email"
                error={loginErrors.email?.message}
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
            control={loginControl}
            name="password"
            render={({ field: { onBlur, onChange, value } }) => (
              <PasswordInput
                forceLight
                autoComplete="password"
                error={loginErrors.password?.message}
                label="Password"
                placeholder="Enter your password"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {notAffiliatedError ? (
            <Text
              selectable
              accessibilityRole="alert"
              className="text-sm"
              style={{ color: colors.error }}
            >
              {notAffiliatedError}
            </Text>
          ) : null}

          {invalidCredentialsError ? (
            <Text
              selectable
              accessibilityRole="alert"
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
              selectable
              accessibilityRole="alert"
              className="text-sm"
              style={{ color: colors.error }}
            >
              {explainGraphqlErrorMessage(
                loginMutation.error,
                'Invalid email or password.',
              )}
            </Text>
          ) : null}

          {/* <View className="items-end">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Forgot password"
              onPress={() =>
                Alert.alert(
                  'Coming soon',
                  'Password reset is not available yet in this build.',
                )
              }
            >
              <Text
                className="text-sm font-semibold"
                style={{ color: colors.primary }}
              >
                Forgot Password?
              </Text>
            </Pressable>
          </View> */}

          <Button
            forceLight
            label="Log In"
            loading={loginMutation.isPending}
            onPress={onSubmitLogin}
          />

          <View className="flex-row items-center justify-center gap-1">
            <Text className="text-sm" style={{ color: colors.secondaryText }}>
              Do not have an account yet?
            </Text>
            <Pressable onPress={() => go('register-name')}>
              <Text
                className="text-sm font-semibold"
                style={{ color: colors.primary }}
              >
                Register
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {step === 'register-name' ? (
        <View className="gap-4">
          <Controller
            control={registerControl}
            name="firstName"
            render={({ field: { onBlur, onChange, value } }) => (
              <FormInput
                forceLight
                error={registerErrors.firstName?.message}
                label="First Name"
                placeholder="Enter your first name"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />

          <Controller
            control={registerControl}
            name="lastName"
            render={({ field: { onBlur, onChange, value } }) => (
              <FormInput
                forceLight
                error={registerErrors.lastName?.message}
                label="Last Name"
                placeholder="Enter your last name"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />

          <Button
            forceLight
            label="Continue"
            onPress={() => void continueNameStep()}
          />
          <OnboardingProgress
            activeStep={REGISTRATION_STEP_INDEX['register-name']}
          />
        </View>
      ) : null}

      {step === 'register-contact' ? (
        <View className="gap-4">
          <Controller
            control={registerControl}
            name="email"
            render={({ field: { onBlur, onChange, value } }) => (
              <FormInput
                forceLight
                autoCapitalize="none"
                autoComplete="email"
                error={registerErrors.email?.message}
                keyboardType="email-address"
                label="Email Address"
                placeholder="Enter your email address"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />

          <Controller
            control={registerControl}
            name="contactNumber"
            render={({ field: { onBlur, onChange, value } }) => (
              <FormInput
                forceLight
                error={registerErrors.contactNumber?.message}
                keyboardType="phone-pad"
                label="Contact Number (Optional)"
                placeholder="Enter your mobile number"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />

          <Button
            forceLight
            label="Continue"
            onPress={() => void continueContactStep()}
          />
          <OnboardingProgress
            activeStep={REGISTRATION_STEP_INDEX['register-contact']}
          />
        </View>
      ) : null}

      {step === 'register-security' ? (
        <View className="gap-4">
          <Controller
            control={registerControl}
            name="password"
            render={({ field: { onBlur, onChange, value } }) => (
              <PasswordInput
                forceLight
                error={registerErrors.password?.message}
                label="Password"
                placeholder="Create your password"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />

          <View
            className="h-1.5 overflow-hidden rounded-full"
            style={{ backgroundColor: colors.border }}
          >
            <View
              className="h-full rounded-full"
              style={{
                width: hasStrongPassword ? '82%' : '16%',
                backgroundColor: hasStrongPassword ? '#1faf59' : colors.error,
              }}
            />
          </View>

          <Text
            className="text-xs"
            style={{
              color: hasStrongPassword ? '#1faf59' : colors.secondaryText,
            }}
          >
            {hasStrongPassword
              ? 'Strong password.'
              : 'Use at least 8 characters.'}
          </Text>

          <Controller
            control={registerControl}
            name="confirmPassword"
            render={({ field: { onBlur, onChange, value } }) => (
              <PasswordInput
                forceLight
                error={registerErrors.confirmPassword?.message}
                label="Confirm Password"
                placeholder="Re-enter your password"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />

          <Text
            className="text-xs"
            style={{ color: passwordsMatch ? '#1faf59' : colors.secondaryText }}
          >
            {passwordsMatch
              ? 'Passwords match.'
              : 'Please confirm your password.'}
          </Text>

          {registerMutation.error ? (
            <Text
              selectable
              accessibilityRole="alert"
              className="text-sm"
              style={{ color: colors.error }}
            >
              {explainGraphqlErrorMessage(
                registerMutation.error,
                'Unable to complete registration.',
              )}
            </Text>
          ) : null}

          <Button
            forceLight
            label="Continue"
            loading={registerMutation.isPending}
            onPress={onSubmitRegister}
          />
          <OnboardingProgress
            activeStep={REGISTRATION_STEP_INDEX['register-security']}
          />
        </View>
      ) : null}

      {step === 'submitted' ? (
        <View className="gap-5">
          <View
            className="mx-auto size-28 items-center justify-center rounded-full"
            style={{ backgroundColor: '#29b35b' }}
          >
            <MaterialIcons color="white" name="check" size={56} />
          </View>

          <Text
            className="text-center text-sm leading-6"
            style={{ color: colors.secondaryText }}
          >
            We will notify you by email or text once your account is approved.
          </Text>

          {registrationStatusQuery.isFetching ? (
            <Text
              className="text-center text-sm"
              style={{ color: colors.secondaryText }}
            >
              Checking your registration status...
            </Text>
          ) : null}

          {registrationStatusQuery.isError ? (
            <Text
              className="text-center text-sm"
              style={{ color: colors.secondaryText }}
            >
              We could not refresh your registration status right now. Open this
              screen again to re-check it.
            </Text>
          ) : null}

          <Button
            forceLight
            label="Back to Login"
            onPress={() => {
              setHistory([]);
              setStep('login');
            }}
          />
        </View>
      ) : null}

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
    </OnboardingShell>
  );
}
