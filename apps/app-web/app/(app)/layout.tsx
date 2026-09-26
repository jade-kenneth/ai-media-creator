import { Suspense, type ReactNode } from 'react';

import { AppShell } from '@/features/app-shell/app-shell';

/** Signed-in screens: the guard, top bar and offline banner (client leaf). */
export default function SignedInLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-canvas" />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
