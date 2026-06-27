import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Linking, Modal, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { colors } from '@/theme/colors';

const REJECTION_REASON_LABELS: Record<string, string> = {
  INCOMPLETE_INFORMATION: 'Incomplete or missing registration information',
  INVALID_IDENTITY: 'Provided identity details could not be verified',
  NOT_A_MEMBER: 'Applicant does not appear to be a registered organization member',
  DUPLICATE_ACCOUNT: 'An account already exists for this individual',
  UNDERAGE: 'Applicant does not meet the minimum age requirement',
  INVALID_CONTACT_DETAILS: 'Provided contact number or email could not be verified',
  SUSPICIOUS_ACTIVITY: 'Registration flagged for suspicious or fraudulent activity',
  OTHER: 'Other reason',
};

type PendingModalProps = {
  type: 'pending';
  visible: boolean;
  onDismiss: () => void;
};

type RejectedModalProps = {
  type: 'rejected';
  visible: boolean;
  rejectionReason?: string | null;
  rejectionNote?: string | null;
  onDismiss: () => void;
  onContactOrganization?: () => void;
};

type RegistrationStatusModalProps = PendingModalProps | RejectedModalProps;

export function RegistrationStatusModal(props: RegistrationStatusModalProps) {
  const { visible, onDismiss } = props;

  if (props.type === 'pending') {
    return (
      <Modal
        animationType="fade"
        onRequestClose={onDismiss}
        transparent
        visible={visible}
      >
        <View
          className="flex-1 items-center justify-center px-6"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
        >
          <View
            accessibilityRole="alert"
            className="w-full max-w-sm rounded-2xl border p-6"
            style={{
              backgroundColor: colors.cardBg,
              borderColor: colors.border,
              borderWidth: 0.5,
            }}
          >
            <View className="items-center gap-4">
              <View className="rounded-full p-4" style={{ backgroundColor: colors.goldPillBg }}>
                <MaterialIcons
                  color={colors.goldPillText}
                  name="hourglass-empty"
                  size={32}
                />
              </View>

              <View className="gap-2">
                <Text
                  className="text-center text-xl font-semibold"
                  style={{ color: colors.bodyText }}
                >
                  Registration Under Review
                </Text>
                <Text
                  className="text-center text-sm leading-6"
                  style={{ color: colors.secondaryText }}
                >
                  Your registration is currently being reviewed by our organization
                  staff. You will be notified once your account has been
                  approved.
                </Text>
              </View>

              <Button
                className="w-full"
                label="Back to Login"
                onPress={onDismiss}
              />
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  const { rejectionReason, rejectionNote } = props;
  const reasonLabel = rejectionReason
    ? (REJECTION_REASON_LABELS[rejectionReason] ?? rejectionReason)
    : null;

  const handleContactOrganization = () => {
    if ('onContactOrganization' in props && props.onContactOrganization) {
      props.onContactOrganization();
    } else {
      void Linking.openURL('tel:');
    }
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={onDismiss}
      transparent
      visible={visible}
    >
      <View
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
      >
        <View
          accessibilityRole="alert"
          className="w-full max-w-sm rounded-2xl border p-6"
          style={{
            backgroundColor: colors.cardBg,
            borderColor: colors.border,
            borderWidth: 0.5,
          }}
        >
          <View className="gap-4">
            <View className="items-center gap-4">
              <View className="rounded-full p-4" style={{ backgroundColor: colors.errorBg }}>
                <MaterialIcons color={colors.error} name="cancel" size={32} />
              </View>

              <Text
                className="text-center text-xl font-semibold"
                style={{ color: colors.bodyText }}
              >
                Registration Rejected
              </Text>
            </View>

            <Text
              className="text-center text-sm leading-6"
              style={{ color: colors.secondaryText }}
            >
              Your registration request has been rejected.
            </Text>

            {reasonLabel ? (
              <View className="rounded-xl border px-4 py-3" style={{ borderColor: colors.errorBorder, backgroundColor: colors.errorBg }}>
                <Text className="text-sm font-medium" style={{ color: colors.error }}>
                  Reason: {reasonLabel}
                </Text>
                {rejectionReason === 'OTHER' && rejectionNote ? (
                  <Text className="mt-1 text-sm leading-5" style={{ color: colors.error }}>
                    {rejectionNote}
                  </Text>
                ) : null}
              </View>
            ) : null}

            <View className="gap-3">
              <Button label="Contact Organization" onPress={handleContactOrganization} variant="outline" />
              <Button label="OK" onPress={onDismiss} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
