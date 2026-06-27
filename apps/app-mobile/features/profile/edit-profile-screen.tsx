import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { z } from "zod";

import { DatePickerField } from "@/components/ui/date-picker-field";
import { FormInput } from "@/components/ui/form-input";
import { KeyboardAvoidingContainer } from "@/components/ui/keyboard-avoiding-container";
import { ReadOnlyField } from "@/components/ui/read-only-field";
import { SectionHeader } from "@/components/ui/section-header";
import { SelectField } from "@/components/ui/select-field";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { authQueryKeys } from "@/react-query/auth/auth-operations";
import { Gender } from "@/react-query/generated__types";
import {
  profileQueryKeys,
  useMyProfileQuery,
  useUpdateMyProfileMutation,
} from "@/react-query/profile/profile-operations";

import { ProfileSkeleton } from "./components/profile-skeleton";

const GENDER_OPTIONS = [
  { label: "Male", value: Gender.Male },
  { label: "Female", value: Gender.Female },
  { label: "Other", value: Gender.Other },
  { label: "Prefer not to say", value: Gender.PreferNotToSay },
] as const;

const editProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  middleName: z.string().optional(),
  contactNumber: z.string().min(1, "Contact number is required."),
  address: z.string().min(1, "Address is required."),
  purok: z.string().optional(),
  gender: z.nativeEnum(Gender).optional(),
  birthdate: z.date({ error: "Birthdate is required." }),
});

type EditProfileFormValues = z.infer<typeof editProfileSchema>;

export function EditProfileScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const profileQuery = useMyProfileQuery();
  const profile = profileQuery.data?.myProfile ?? null;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditProfileFormValues>({
    resolver: zodResolver(editProfileSchema),
  });

  // Pre-fill once profile is loaded
  useEffect(() => {
    if (!profile) return;
    reset({
      firstName: profile.firstName,
      lastName: profile.lastName,
      middleName: profile.middleName ?? "",
      contactNumber: profile.contactNumber,
      address: profile.address,
      purok: profile.purok ?? "",
      gender: profile.gender ?? undefined,
      birthdate: new Date(profile.birthdate),
    });
  }, [profile, reset]);

  const updateMutation = useUpdateMyProfileMutation({
    onSuccess: () => {
      // Invalidate profile + me so both screens reflect the change
      queryClient.invalidateQueries({ queryKey: profileQueryKeys.me() });
      queryClient.invalidateQueries({ queryKey: authQueryKeys.me });
      Alert.alert("Profile updated", "Your profile has been saved.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: (error) => {
      setServerError(
        error.message ?? "Something went wrong. Please try again."
      );
    },
  });

  const onSubmit = useCallback(
    (values: EditProfileFormValues) => {
      setServerError(null);
      updateMutation.mutate({
        input: {
          firstName: values.firstName,
          lastName: values.lastName,
          middleName: values.middleName ?? "",
          contactNumber: values.contactNumber,
          address: values.address,
          purok: values.purok ?? "",
          gender: values.gender ?? Gender.PreferNotToSay,
          birthdate: values.birthdate.toISOString(),
        },
      });
    },
    [updateMutation]
  );

  if (profileQuery.isLoading) {
    return <ProfileSkeleton />;
  }

  return (
    <KeyboardAvoidingContainer contentContainerClassName="bg-brand-screen-bg">
      <ScrollView
        className="flex-1 bg-brand-screen-bg"
        contentContainerClassName="px-5 py-6 gap-6"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Account info (read-only) */}
        <View className="gap-3">
          <SectionHeader title="Account" />
          <ReadOnlyField label="Email" value={profile?.user?.email ?? "—"} />
        </View>

        {/* Personal info */}
        <View className="gap-4">
          <SectionHeader title="Personal Information" />

          <Controller
            control={control}
            name="firstName"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormInput
                error={errors.firstName?.message}
                label="First Name"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Enter your first name"
                value={value}
              />
            )}
          />

          <Controller
            control={control}
            name="lastName"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormInput
                error={errors.lastName?.message}
                label="Last Name"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Enter your last name"
                value={value}
              />
            )}
          />

          <Controller
            control={control}
            name="middleName"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormInput
                error={errors.middleName?.message}
                label="Middle Name (optional)"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Enter your middle name"
                value={value}
              />
            )}
          />

          <Controller
            control={control}
            name="birthdate"
            render={({ field: { onChange, value } }) => (
              <DatePickerField
                error={errors.birthdate?.message}
                label="Birthdate"
                maximumDate={new Date()}
                onChange={onChange}
                value={value ?? null}
              />
            )}
          />

          <Controller
            control={control}
            name="gender"
            render={({ field: { onChange, value } }) => (
              <SelectField
                error={errors.gender?.message}
                label="Gender (optional)"
                onChange={onChange}
                options={
                  GENDER_OPTIONS as unknown as {
                    label: string;
                    value: Gender;
                  }[]
                }
                placeholder="Select your gender"
                value={value}
              />
            )}
          />
        </View>

        {/* Contact & address */}
        <View className="gap-4">
          <SectionHeader title="Contact & Address" />

          <Controller
            control={control}
            name="contactNumber"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormInput
                error={errors.contactNumber?.message}
                keyboardType="phone-pad"
                label="Contact Number"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="+63 917 123 4567"
                value={value}
              />
            )}
          />

          <Controller
            control={control}
            name="address"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormInput
                error={errors.address?.message}
                label="Address"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Enter your full address"
                value={value}
              />
            )}
          />

          <Controller
            control={control}
            name="purok"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormInput
                error={errors.purok?.message}
                label="Purok / Zone (optional)"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="e.g. Purok 3"
                value={value}
              />
            )}
          />
        </View>

        {/* Server error */}
        {serverError ? (
          <View
            className="rounded-xl border px-4 py-3"
            style={{
              borderColor: colors.errorBorder,
              borderWidth: 0.5,
              backgroundColor: colors.errorBg,
            }}
          >
            <Text className="text-sm" style={{ color: colors.error }}>
              {serverError}
            </Text>
          </View>
        ) : null}

        {/* Submit */}
        <View className="pb-6">
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ busy: updateMutation.isPending }}
            className="min-h-12 items-center justify-center rounded-xl px-4 active:opacity-85"
            disabled={updateMutation.isPending}
            onPress={handleSubmit(onSubmit)}
            style={{
              backgroundColor: colors.primary,
              opacity: updateMutation.isPending ? 0.9 : 1,
            }}
          >
            {updateMutation.isPending ? (
              <ActivityIndicator color={colors.cardBg} />
            ) : (
              <Text className="text-base font-semibold text-white">Save Changes</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingContainer>
  );
}
