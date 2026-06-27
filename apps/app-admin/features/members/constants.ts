import {
  Gender,
  RegistrationRejectionReason,
  RegistrationStatus,
} from '@/react-query/generated__types';

export const MEMBERS_PAGE_SIZE = 10;

export const memberActivityOptions = [
  {
    value: 'true',
    label: 'Active',
  },
  {
    value: 'false',
    label: 'Inactive',
  },
] as const;

export const memberRegistrationStatusOptions = [
  {
    value: RegistrationStatus.PendingApproval,
    label: 'Pending Approval',
  },
  {
    value: RegistrationStatus.Approved,
    label: 'Approved',
  },
  {
    value: RegistrationStatus.Rejected,
    label: 'Rejected',
  },
] as const;

export const memberRegistrationRejectionReasonOptions = [
  {
    value: RegistrationRejectionReason.IncompleteInformation,
    label: 'Incomplete or missing information',
  },
  {
    value: RegistrationRejectionReason.InvalidIdentity,
    label: 'Identity could not be verified',
  },
  {
    value: RegistrationRejectionReason.NotAMember,
    label: 'Not a registered organization member',
  },
  {
    value: RegistrationRejectionReason.DuplicateAccount,
    label: 'Duplicate account',
  },
  {
    value: RegistrationRejectionReason.Underage,
    label: 'Does not meet age requirement',
  },
  {
    value: RegistrationRejectionReason.InvalidContactDetails,
    label: 'Invalid contact details',
  },
  {
    value: RegistrationRejectionReason.SuspiciousActivity,
    label: 'Suspicious or fraudulent activity',
  },
  {
    value: RegistrationRejectionReason.Other,
    label: 'Other (please specify)',
  },
] as const;

export const memberGenderOptions = [
  {
    value: Gender.Female,
    label: 'Female',
  },
  {
    value: Gender.Male,
    label: 'Male',
  },
  {
    value: Gender.Other,
    label: 'Other',
  },
  {
    value: Gender.PreferNotToSay,
    label: 'Prefer not to say',
  },
] as const;

export type MemberActivityFilterValue =
  (typeof memberActivityOptions)[number]['value'];

export type MemberRegistrationStatusFilterValue = RegistrationStatus;

export function formatGender(value?: Gender | null) {
  switch (value) {
    case Gender.Female:
      return 'Female';
    case Gender.Male:
      return 'Male';
    case Gender.Other:
      return 'Other';
    case Gender.PreferNotToSay:
      return 'Prefer not to say';
    default:
      return '—';
  }
}

export function formatMemberRegistrationStatus(
  value?: RegistrationStatus | null,
) {
  switch (value) {
    case RegistrationStatus.PendingApproval:
      return 'Pending';
    case RegistrationStatus.Approved:
      return 'Approved';
    case RegistrationStatus.Rejected:
      return 'Rejected';
    default:
      return '—';
  }
}

export function getMemberRegistrationStatusBadgeClassName(
  value?: RegistrationStatus | null,
) {
  switch (value) {
    case RegistrationStatus.PendingApproval:
      return 'border-amber-200 bg-amber-500/10 text-amber-700 dark:border-amber-500/30 dark:text-amber-300';
    case RegistrationStatus.Approved:
      return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
    case RegistrationStatus.Rejected:
      return 'bg-destructive/10 text-destructive';
    default:
      return 'text-muted-foreground';
  }
}

export function getMemberRegistrationStatusBadgeVariant(
  value?: RegistrationStatus | null,
) {
  switch (value) {
    case RegistrationStatus.PendingApproval:
      return 'outline' as const;
    case RegistrationStatus.Approved:
      return 'default' as const;
    case RegistrationStatus.Rejected:
      return 'destructive' as const;
    default:
      return 'outline' as const;
  }
}

export function formatMemberRegistrationRejectionReason(
  value?: RegistrationRejectionReason | null,
) {
  const match = memberRegistrationRejectionReasonOptions.find(
    (option) => option.value === value,
  );

  return match?.label ?? '—';
}

export function getMemberRegistrationEmptyState(
  value: MemberRegistrationStatusFilterValue,
) {
  switch (value) {
    case RegistrationStatus.PendingApproval:
      return {
        title: 'No pending registrations',
        description:
          'New member sign-ups will appear here when they are waiting for approval.',
      };
    case RegistrationStatus.Approved:
      return {
        title: 'No approved members yet',
        description:
          'Approved member registrations will appear here after review.',
      };
    case RegistrationStatus.Rejected:
      return {
        title: 'No rejected registrations',
        description:
          'Rejected member registrations will appear here after review.',
      };
    default:
      return {
        title: 'No members found',
        description:
          'Member profiles will appear here once registrations are available in the admin directory.',
      };
  }
}

export function isOtherRegistrationRejectionReason(
  value?: RegistrationRejectionReason | '' | null,
) {
  return value === RegistrationRejectionReason.Other;
}

export function formatMemberReviewer(
  review?: {
    reviewedBy?: string | null;
    reviewedByUser?: {
      email: string;
    } | null;
  } | null,
) {
  if (review?.reviewedByUser?.email) {
    return review.reviewedByUser.email;
  }

  if (review?.reviewedBy) {
    return 'Admin account unavailable';
  }

  return '—';
}
