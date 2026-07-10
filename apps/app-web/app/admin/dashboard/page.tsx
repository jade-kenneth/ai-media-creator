import type { Metadata } from 'next';

import { DashboardPageView } from '@/features/dashboard';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default function DashboardPage() {
  return <DashboardPageView />;
}
