import type { Metadata } from 'next';

import { DeleteAccountPageView } from '@/features/delete-account';

export const metadata: Metadata = {
  title: 'Request Account Deletion',
};

export default function DeleteAccountPage() {
  return <DeleteAccountPageView />;
}
