import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Text, View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/ui/form-input';
import { KeyboardAvoidingContainer } from '@/components/ui/keyboard-avoiding-container';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { useThemeColors } from '@/hooks/use-theme-colors';
import {
  authQueryKeys,
  useMeQuery,
} from '@/react-query/auth/auth-operations';
import { explainGraphqlErrorMessage } from '@/react-query/graphql-error';
import { useUpdateMyProfileMutation } from '@/react-query/profile/profile-operations';

const editProfileSchema = z.object({
  firstName: z.string().trim().max(100, 'First name is too long.'),
  lastName: z.string().trim().max(100, 'Last name is too long.'),
  position: z.string().trim().max(120, 'Position is too long.'),
});

type EditProfileFormValues = z.infer<typeof editProfileSchema>;

export function EditProfileScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const queryClient = useQueryClient();
  const meQuery = useMeQuery();
  const user = meQuery.data?.me;
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditProfileFormValues>({
    defaultValues: { firstName: '', lastName: '', position: '' },
    resolver: zodResolver(editProfileSchema),
  });

  useEffect(() => {
    if (!user) return;
    reset({
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      position: user.position ?? '',
    });
  }, [reset, user]);

  const updateMutation = useUpdateMyProfileMutation({
    onSuccess: async (data) => {
      queryClient.setQueryData([...authQueryKeys.me, 'current'], {
        me: data.updateMyProfile,
      });
      await queryClient.invalidateQueries({ queryKey: authQueryKeys.me });
      Alert.alert('Profile updated', 'Your changes have been saved.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
  });

  const onSubmit = handleSubmit((values) => {
    updateMutation.mutate({
      input: {
        firstName: values.firstName.trim() || null,
        lastName: values.lastName.trim() || null,
        position: values.position.trim() || null,
      },
    });
  });

  if (meQuery.isLoading) {
    return <LoadingScreen message="Loading profile..." />;
  }

  const errorMessage = updateMutation.error
    ? explainGraphqlErrorMessage(
        updateMutation.error,
        'Unable to update your profile. Please try again.',
      )
    : null;

  return (
    <KeyboardAvoidingContainer>
      <View className="gap-1">
        <Text className="text-sm font-medium" style={{ color: colors.mutedText }}>
          Email
        </Text>
        <Text className="text-base" selectable style={{ color: colors.bodyText }}>
          {user?.email ?? '—'}
        </Text>
      </View>

      <View className="gap-4">
        <Controller
          control={control}
          name="firstName"
          render={({ field: { onBlur, onChange, value } }) => (
            <FormInput
              error={errors.firstName?.message}
              label="First name"
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
              error={errors.lastName?.message}
              label="Last name"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Last name"
              value={value}
            />
          )}
        />
        <Controller
          control={control}
          name="position"
          render={({ field: { onBlur, onChange, value } }) => (
            <FormInput
              error={errors.position?.message}
              label="Position"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Optional role or position"
              value={value}
            />
          )}
        />
      </View>

      {errorMessage ? (
        <Text accessibilityRole="alert" style={{ color: colors.error }}>
          {errorMessage}
        </Text>
      ) : null}

      <Button
        label="Save changes"
        loading={updateMutation.isPending}
        onPress={onSubmit}
      />
    </KeyboardAvoidingContainer>
  );
}
