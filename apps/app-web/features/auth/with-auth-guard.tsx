'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { ComponentType } from 'react';
import { useEffect } from 'react';

import {
  LazyRouteGuard,
  type LazyRouteGuardState,
} from '@/features/auth/lazy-route-guard';
import type { LazySession } from '@/providers/AuthProvider';
import { useSession } from '@/providers/AuthProvider';
import { buildCurrentPath, buildLoginRedirectUrl } from '@/react-query/session';

export type WithAuthGuardState = LazyRouteGuardState | 'authenticated';

export function resolveWithAuthGuardState(
  session: LazySession,
): WithAuthGuardState {
  if (session.status === 'loading') {
    return 'loading';
  }

  if (session.status === 'unauthenticated' || session.status === 'error') {
    return 'unauthenticated';
  }

  return 'authenticated';
}

export function withAuthGuard<P extends object>(Component: ComponentType<P>) {
  function GuardedComponent(props: P) {
    const pathname = usePathname();

    const router = useRouter();

    const searchParams = useSearchParams();

    const session = useSession();

    const guardState = resolveWithAuthGuardState(session);

    const callback = buildCurrentPath(pathname, searchParams);

    const redirectTarget = buildLoginRedirectUrl('unauthenticated', callback);

    useEffect(() => {
      if (guardState !== 'unauthenticated') return;

      router.replace(redirectTarget);
    }, [guardState, redirectTarget, router]);

    if (guardState !== 'authenticated') {
      return <LazyRouteGuard state={guardState} />;
    }

    return <Component {...props} />;
  }

  const componentName = Component.displayName ?? Component.name ?? 'Component';

  GuardedComponent.displayName = `withAuthGuard(${componentName})`;

  return GuardedComponent;
}
