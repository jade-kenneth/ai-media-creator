import type { Metadata } from 'next';

import { AdminFeatureRouteGuard } from '@/features/admin-shell/admin-feature-route-guard';
import { MembersPageView } from '@/features/members';
import { FEATURE_FLAGS } from '@/utils/feature-flags';

export const metadata: Metadata = {
  title: 'Members',
};

export default function MembersPage() {
  return (
    <AdminFeatureRouteGuard flag={FEATURE_FLAGS.ADMIN_MEMBERS}>
      <MembersPageView />
    </AdminFeatureRouteGuard>
  );
}
