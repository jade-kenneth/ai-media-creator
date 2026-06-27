import type { Metadata } from 'next';

import { SuperAdminDashboardPageView } from '@/features/dashboard';

export const metadata: Metadata = {
  title: 'Platform overview',
};

export default function SuperAdminDashboardPage() {
  return <SuperAdminDashboardPageView />;
}
