import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text, View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/ui/form-input';
import { KeyboardAvoidingContainer } from '@/components/ui/keyboard-avoiding-container';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useTenant } from '@/providers/TenantProvider';
import { useMeQuery } from '@/react-query/auth/auth-operations';
import { explainGraphqlErrorMessage } from '@/react-query/graphql-error';
import { useSubmitAccountDeletionRequestMutation } from '@/react-query/profile/account-deletion-operations';

const deletionSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required.'),
});

type DeletionFormValues = z.infer<typeof deletionSchema>;

export function DeleteAccountScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { tenant } = useTenant();
  const meQuery = useMeQuery();
  const user = meQuery.data?.me;
  const submitMutation = useSubmitAccountDeletionRequestMutation();
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DeletionFormValues>({
    defaultValues: { fullName: '' },
    resolver: zodResolver(deletionSchema),
  });

  useEffect(() => {
    const fullName = [user?.firstName, user?.lastName]
      .map((part) => part?.trim())
      .filter(Boolean)
      .join(' ');
    reset({ fullName });
  }, [reset, user]);

  const onSubmit = handleSubmit((values) => {
    const organizationId = tenant?.organizationId ?? user?.organizationId;
    if (!user?.email || !organizationId) return;

    submitMutation.mutate({
      input: {
        email: user.email,
        fullName: values.fullName.trim(),
        organizationId,
      },
    });
  });

  if (meQuery.isLoading) {
    return <LoadingScreen message="Loading account..." />;
  }

  if (submitMutation.isSuccess) {
    return (
      <View
        className="flex-1 items-center justify-center gap-5 px-6"
        style={{ backgroundColor: colors.screenBg }}
      >
        <View
          className="h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.successBg }}
        >
          <MaterialIcons
            color={colors.successText}
            name="check-circle"
            size={34}
          />
        </View>
        <View className="gap-2">
          <Text
            accessibilityRole="header"
            className="text-center text-2xl font-bold"
            style={{ color: colors.bodyText }}
          >
            Request submitted
          </Text>
          <Text
            className="text-center text-sm leading-6"
            style={{ color: colors.secondaryText }}
          >
            Your request will be reviewed before the account is permanently
            deleted. You can continue using the app until it is approved.
          </Text>
        </View>
        <Button label="Back to settings" onPress={() => router.back()} />
      </View>
    );
  }

  const errorMessage = submitMutation.error
    ? explainGraphqlErrorMessage(
        submitMutation.error,
        'Unable to submit your deletion request. Please try again.',
      )
    : null;
  const isMissingContext =
    !user?.email || !(tenant?.organizationId ?? user?.organizationId);

  return (
    <KeyboardAvoidingContainer>
      <View
        className="gap-3 rounded-3xl border p-5"
        style={{
          backgroundColor: colors.errorBg,
          borderColor: colors.errorBorder,
        }}
      >
        <MaterialIcons color={colors.error} name="warning-amber" size={28} />
        <Text className="text-lg font-bold" style={{ color: colors.bodyText }}>
          Request account deletion
        </Text>
        <Text className="text-sm leading-6" style={{ color: colors.secondaryText }}>
          This submits a review request. Once approved, your account and access
          will be permanently removed. This cannot be undone.
        </Text>
      </View>

      <View className="gap-4">
        <Controller
          control={control}
          name="fullName"
          render={({ field: { onBlur, onChange, value } }) => (
            <FormInput
              error={errors.fullName?.message}
              label="Full name"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Enter the name on your account"
              value={value}
            />
          )}
        />
        <View className="gap-1">
          <Text className="text-sm font-medium" style={{ color: colors.bodyText }}>
            Email
          </Text>
          <Text selectable style={{ color: colors.secondaryText }}>
            {user?.email ?? 'Unavailable'}
          </Text>
        </View>
        <View className="gap-1">
          <Text className="text-sm font-medium" style={{ color: colors.bodyText }}>
            Organization
          </Text>
          <Text style={{ color: colors.secondaryText }}>
            {tenant?.organizationName ?? 'Current organization'}
          </Text>
        </View>
      </View>

      {isMissingContext ? (
        <Text accessibilityRole="alert" style={{ color: colors.error }}>
          Your account or organization details are unavailable. Refresh your
          session before submitting this request.
        </Text>
      ) : null}
      {errorMessage ? (
        <Text accessibilityRole="alert" style={{ color: colors.error }}>
          {errorMessage}
        </Text>
      ) : null}

      <Button
        disabled={isMissingContext}
        label="Submit deletion request"
        loading={submitMutation.isPending}
        onPress={onSubmit}
        variant="destructive"
      />
      <Button label="Cancel" onPress={() => router.back()} variant="ghost" />
    </KeyboardAvoidingContainer>
  );
}
