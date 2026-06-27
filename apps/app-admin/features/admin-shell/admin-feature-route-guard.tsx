'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { useFeatureFlag } from '@/hooks/use-feature-flag';
import type { FeatureFlag } from '@/utils/feature-flags';

type AdminFeatureRouteGuardProps = {
  flag: FeatureFlag;
  children: ReactNode;
};

export function AdminFeatureRouteGuard({
  flag,
  children,
}: AdminFeatureRouteGuardProps) {
  const isEnabled = useFeatureFlag(flag);
  const router = useRouter();

  useEffect(() => {
    if (!isEnabled) {
      router.replace('/admin/dashboard');
    }
  }, [isEnabled, router]);

  if (!isEnabled) return null;
  return <>{children}</>;
}
