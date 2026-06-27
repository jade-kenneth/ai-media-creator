'use client';

import { Loader2, ShieldAlert } from 'lucide-react';

export type LazyRouteGuardState = 'loading' | 'unauthenticated';

type LazyRouteGuardProps = {
  state: LazyRouteGuardState;
};

export function LazyRouteGuard({ state }: LazyRouteGuardProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 rounded-[28px] border border-border/70 bg-card/80 px-6 py-12 text-center shadow-sm">
      {state === 'loading' ? (
        <>
          <Loader2 className="size-8 animate-spin text-primary" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Checking your session
            </p>
            <p className="text-sm text-muted-foreground">
              Loading the admin workspace.
            </p>
          </div>
        </>
      ) : (
        <>
          <ShieldAlert className="size-8 text-amber-600 dark:text-amber-400" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Redirecting to sign in
            </p>
            <p className="text-sm text-muted-foreground">
              Your session is no longer available.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
