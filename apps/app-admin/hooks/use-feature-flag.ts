'use client';

import { useCurrentQuery } from '@/react-query/auth/auth-operations';
import { useOrganizationQuery } from '@/react-query/organizations/organizations-operations';
import type { FeatureFlag } from '@/utils/feature-flags';

export function useFeatureFlag(flag: FeatureFlag): boolean {
  const currentUser = useCurrentQuery();
  const organizationId = currentUser.data?.me.organizationId;
  const organizationQuery = useOrganizationQuery(
    organizationId ? { id: organizationId } : undefined,
    { enabled: Boolean(organizationId) },
  );

  const features = organizationQuery?.data?.organization?.features ?? [];
  return features.includes(flag);
}
