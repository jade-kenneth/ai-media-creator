export const RegistrationRejectionReason = {
  INCOMPLETE_INFORMATION: 'Incomplete or missing registration information',
  INVALID_IDENTITY: 'Provided identity details could not be verified',
  NOT_A_MEMBER: 'Applicant does not appear to be a registered organization member',
  DUPLICATE_ACCOUNT: 'An account already exists for this individual',
  UNDERAGE: 'Applicant does not meet the minimum age requirement',
  INVALID_CONTACT_DETAILS:
    'Provided contact number or email could not be verified',
  SUSPICIOUS_ACTIVITY:
    'Registration flagged for suspicious or fraudulent activity',
  OTHER: 'Other reason (admin must provide a free-text note)',
} as const;

export type RegistrationRejectionReasonCode =
  keyof typeof RegistrationRejectionReason;

export const REGISTRATION_REJECTION_REASON_CODES = Object.freeze(
  Object.keys(RegistrationRejectionReason) as RegistrationRejectionReasonCode[],
);

export function getRegistrationRejectionReasonMessage(
  code: RegistrationRejectionReasonCode,
): string {
  return RegistrationRejectionReason[code];
}
