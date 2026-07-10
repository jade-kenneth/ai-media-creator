import { AccountDeletionRequestStatus } from '@/react-query/generated__types';

export const ACCOUNT_DELETION_REQUESTS_PAGE_SIZE = 10;

export const accountDeletionStatusOptions = [
  { value: AccountDeletionRequestStatus.Pending, label: 'Pending' },
  { value: AccountDeletionRequestStatus.Approved, label: 'Approved' },
  { value: AccountDeletionRequestStatus.Rejected, label: 'Rejected' },
] as const;

export type AccountDeletionStatusFilterValue =
  (typeof accountDeletionStatusOptions)[number]['value'];

export function formatAccountDeletionStatus(
  status: AccountDeletionRequestStatus,
): string {
  switch (status) {
    case AccountDeletionRequestStatus.Pending:
      return 'Pending';
    case AccountDeletionRequestStatus.Approved:
      return 'Approved';
    case AccountDeletionRequestStatus.Rejected:
      return 'Rejected';
    default:
      return 'Unknown';
  }
}
