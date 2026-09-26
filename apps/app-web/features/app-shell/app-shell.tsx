'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { useSession } from '@/providers/AuthProvider';
import {
  buildCurrentPath,
  buildLoginRedirectUrl,
} from '@/react-query/session';

import { OfflineBannerProvider } from './offline-banner';
import { TopBar } from './top-bar';

/**
 * Every signed-in screen: guards the route (signed-out visitors go to sign-in
 * with `returnTo`), then renders the top bar and offline banner. While the
 * session is read, only the canvas shows (no spinner flash).
 */
export function AppShell({ children }: { children: ReactNode }) {
  const session = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const signedOut =
    session.status === 'unauthenticated' || session.status === 'error';

  useEffect(() => {
    if (!signedOut) return;

    router.replace(
      buildLoginRedirectUrl(
        'unauthenticated',
        buildCurrentPath(pathname, searchParams),
      ),
    );
  }, [pathname, router, searchParams, signedOut]);

  if (session.status !== 'authenticated') {
    return <div className="min-h-dvh bg-canvas" aria-busy="true" />;
  }

  return (
    <OfflineBannerProvider header={<TopBar />}>{children}</OfflineBannerProvider>
  );
}
