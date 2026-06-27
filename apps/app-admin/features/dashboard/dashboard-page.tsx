'use client';

import { useFeatureFlag } from '@/hooks/use-feature-flag';
import { FEATURE_FLAGS } from '@/utils/feature-flags';

import { DashboardOverview } from './dashboard-overview';

export function DashboardPageView() {
  useFeatureFlag(FEATURE_FLAGS.ADMIN_REQUESTS);

  return (
    <div className="flex flex-col gap-6">
      <DashboardOverview />
    </div>
  );
}
