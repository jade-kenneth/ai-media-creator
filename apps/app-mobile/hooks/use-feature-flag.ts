import { useTenant } from '@/providers/TenantProvider';
import type { FeatureFlag } from '@/utils/feature-flags';

export function useFeatureFlag(flag: FeatureFlag): boolean {
  const { tenant } = useTenant();
  if (!tenant) return false;
  return tenant.features.includes(flag);
}
