import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { notifyAuthChange, store } from '@/providers/AuthProvider/store';
import { useTenant } from '@/providers/TenantProvider';
import { useMeQuery } from '@/react-query/auth/auth-operations';
import { RegistrationStatus } from '@/react-query/generated__types';

const REJECTION_REASON_LABELS: Record<string, string> = {
  INCOMPLETE_INFORMATION: 'Incomplete or missing registration information',
  INVALID_IDENTITY: 'Identity details could not be verified',
  NOT_A_MEMBER: 'You could not be verified as a member of this organization',
  DUPLICATE_ACCOUNT: 'A member account already exists for this person',
  UNDERAGE: 'You do not meet the age requirement',
  INVALID_CONTACT_DETAILS: 'Your contact details could not be verified',
  SUSPICIOUS_ACTIVITY: 'The registration needs further review',
  OTHER: 'Other reason',
};

export function RegistrationRejectedScreen() {
  const colors = useThemeColors();
  const { tenant } = useTenant();
  const meQuery = useMeQuery(undefined, { staleTime: 0 });
  const contactNumber = tenant?.contactNumber?.trim() || null;

  useFocusEffect(
    useCallback(() => {
      void meQuery.refetch();
      return undefined;
    }, [meQuery]),
  );

  useEffect(() => {
    const status = meQuery.data?.me.registrationStatus;

    if (
      status === RegistrationStatus.Approved ||
      status === RegistrationStatus.PendingApproval
    ) {
      notifyAuthChange();
    }
  }, [meQuery.data?.me.registrationStatus]);

  const review = meQuery.data?.me.registrationReview;
  const reasonLabel = review?.rejectionReason
    ? (REJECTION_REASON_LABELS[review.rejectionReason] ??
      review.rejectionReason)
    : 'Your registration was not approved.';

  async function handleStartNewRegistration() {
    await store.clearSession();
    notifyAuthChange();
    router.replace('/(auth)/onboarding');
  }

  async function handleContactOrganization() {
    if (!contactNumber) {
      return;
    }

    await Linking.openURL(`tel:${contactNumber}`);
  }

  return (
    <SafeAreaView
      className="flex-1 bg-brand-screen-bg"
      edges={['top', 'bottom']}
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-6 py-10"
        keyboardShouldPersistTaps="handled"
      >
        <View
          className="rounded-[28px] border px-5 py-6"
          style={{
            backgroundColor: colors.cardBg,
            borderColor: colors.border,
            borderWidth: 0.5,
          }}
        >
          <View className="items-center gap-4">
            <View
              className="rounded-full p-4"
              style={{ backgroundColor: colors.errorBg }}
            >
              <MaterialIcons
                accessibilityElementsHidden
                color={colors.error}
                importantForAccessibility="no"
                name="cancel"
                size={34}
              />
            </View>

            <View className="gap-2">
              <Text
                className="text-center text-[28px] font-semibold"
                style={{ color: colors.bodyText }}
              >
                Registration Not Approved
              </Text>
              <Text
                className="text-center text-sm leading-6"
                style={{ color: colors.secondaryText }}
              >
                {tenant?.organizationName
                  ? `${tenant.organizationName} was unable to approve your registration at this time.`
                  : 'Your organization was unable to approve your registration at this time.'}
              </Text>
            </View>
          </View>

          <View
            className="mt-6 rounded-2xl border px-4 py-4"
            style={{
              backgroundColor: colors.errorBg,
              borderColor: colors.errorBorder,
              borderWidth: 0.5,
            }}
          >
            <Text
              className="text-xs font-semibold uppercase"
              style={{ color: colors.error, letterSpacing: 0.6 }}
            >
              Reason
            </Text>
            <Text
              className="mt-2 text-sm font-medium leading-6"
              style={{ color: colors.error }}
            >
              {reasonLabel}
            </Text>

            {review?.rejectionNote ? (
              <Text
                className="mt-3 text-sm leading-6"
                style={{ color: colors.error }}
              >
                {review.rejectionNote}
              </Text>
            ) : null}
          </View>

          <View className="mt-5 gap-2">
            <Text
              className="text-sm font-semibold"
              style={{ color: colors.bodyText }}
            >
              Next steps
            </Text>
            <Text
              className="text-sm leading-6"
              style={{ color: colors.secondaryText }}
            >
              Review your details, prepare any missing information, and submit a
              new registration when ready.
            </Text>
            {contactNumber ? (
              <Text
                className="text-sm leading-6"
                style={{ color: colors.secondaryText }}
              >
                You can also call {tenant?.organizationName ?? 'your organization'} at{' '}
                {contactNumber}.
              </Text>
            ) : (
              <Text
                className="text-sm leading-6"
                style={{ color: colors.secondaryText }}
              >
                You can also visit your organization hall for help with the required
                updates.
              </Text>
            )}
            {tenant?.address ? (
              <Text
                className="text-sm leading-6"
                style={{ color: colors.secondaryText }}
              >
                Organization address: {tenant.address}
              </Text>
            ) : null}
          </View>

          <View className="mt-6 gap-3">
            {contactNumber ? (
              <Pressable
                accessibilityRole="button"
                className="min-h-[52px] items-center justify-center rounded-xl border px-4 active:opacity-85"
                onPress={() => {
                  void handleContactOrganization();
                }}
                style={{
                  borderColor: colors.border,
                  borderWidth: 0.5,
                  backgroundColor: colors.cardBg,
                }}
              >
                <Text
                  className="text-base font-semibold"
                  style={{ color: colors.bodyText }}
                >
                  Contact Organization
                </Text>
              </Pressable>
            ) : null}

            <Button
              forceLight
              label="Start New Registration"
              onPress={() => {
                void handleStartNewRegistration();
              }}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
