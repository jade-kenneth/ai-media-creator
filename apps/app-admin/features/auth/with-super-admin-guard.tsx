'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { ComponentType } from 'react';
import { useEffect } from 'react';

import { useSession } from '@/providers/AuthProvider';
import { UserRole } from '@/react-query/generated__types';
import { buildCurrentPath, buildLoginRedirectUrl } from '@/react-query/session';
import { LazyRouteGuard } from './lazy-route-guard';

export function withSuperAdminGuard<P extends object>(
  Component: ComponentType<P>,
) {
  function GuardedComponent(props: P) {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const session = useSession();

    const callback = buildCurrentPath(pathname, searchParams);

    useEffect(() => {
      if (session.status === 'loading') return;

      if (session.status === 'unauthenticated' || session.status === 'error') {
        router.replace(buildLoginRedirectUrl('unauthenticated', callback));
        return;
      }

      if (session.role !== UserRole.SuperAdmin) {
        router.replace('/admin/dashboard');
      }
    }, [session, callback, router]);

    if (session.status === 'loading') {
      return <LazyRouteGuard state="loading" />;
    }

    if (
      session.status === 'unauthenticated' ||
      session.status === 'error' ||
      session.role !== UserRole.SuperAdmin
    ) {
      return <LazyRouteGuard state="unauthenticated" />;
    }

    return <Component {...props} />;
  }

  const componentName = Component.displayName ?? Component.name ?? 'Component';

  GuardedComponent.displayName = `withSuperAdminGuard(${componentName})`;

  return GuardedComponent;
}
