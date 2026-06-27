import {
  RegistrationPendingError,
  RegistrationRejectedError,
} from '../../common/errors/app.error';
import {
  RegistrationRejectionReason,
  RegistrationStatus,
  UserRole,
} from '../../graphql/generated/graphql';
import type { UserRecord } from '../users/repositories/users.repository';

const REGISTRATION_REJECTION_REASON_MESSAGES: Record<
  RegistrationRejectionReason,
  string
> = {
  [RegistrationRejectionReason.INCOMPLETE_INFORMATION]:
    'Incomplete or missing registration information',
  [RegistrationRejectionReason.INVALID_IDENTITY]:
    'Provided identity details could not be verified',
  [RegistrationRejectionReason.NOT_A_MEMBER]:
    'Applicant does not appear to be a registered organization member',
  [RegistrationRejectionReason.DUPLICATE_ACCOUNT]:
    'An account already exists for this individual',
  [RegistrationRejectionReason.UNDERAGE]:
    'Applicant does not meet the minimum age requirement',
  [RegistrationRejectionReason.INVALID_CONTACT_DETAILS]:
    'Provided contact number or email could not be verified',
  [RegistrationRejectionReason.SUSPICIOUS_ACTIVITY]:
    'Registration flagged for suspicious or fraudulent activity',
  [RegistrationRejectionReason.OTHER]:
    'Other reason (admin must provide a free-text note)',
};

export function assertMemberCanAuthenticate(
  user: Pick<
    UserRecord,
    'role' | 'isActive' | 'registrationStatus' | 'registrationReview'
  >,
): void {
  if (user.role !== UserRole.MEMBER) {
    return;
  }

  const registrationStatus =
    user.registrationStatus ??
    (user.isActive
      ? RegistrationStatus.approved
      : RegistrationStatus.pending_approval);

  if (registrationStatus === RegistrationStatus.pending_approval) {
    throw new RegistrationPendingError(
      'Your registration is pending approval. Please wait for an administrator to review your account.',
    );
  }

  if (registrationStatus === RegistrationStatus.rejected) {
    const rejectionReasonCode = user.registrationReview?.rejectionReason as
      | RegistrationRejectionReason
      | undefined;

    const rejectionReason = rejectionReasonCode
      ? REGISTRATION_REJECTION_REASON_MESSAGES[rejectionReasonCode]
      : 'No rejection reason was provided.';

    throw new RegistrationRejectedError(
      `Your registration was rejected. Reason: ${rejectionReason}`,
      {
        rejectionReason: rejectionReasonCode ?? null,
        rejectionNote: user.registrationReview?.rejectionNote ?? null,
      },
    );
  }

  if (registrationStatus !== RegistrationStatus.approved || !user.isActive) {
    throw new RegistrationPendingError(
      'Your registration is not active yet. Please contact the organization administrator.',
    );
  }
}
