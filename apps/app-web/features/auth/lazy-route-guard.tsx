'use client';

export type LazyRouteGuardState = 'loading' | 'unauthenticated';

/**
 * Shown while a guarded route reads the session or redirects to sign-in:
 * only the canvas, so there is no spinner flash.
 */
export function LazyRouteGuard({ state }: { state: LazyRouteGuardState }) {
  return (
    <div
      className="min-h-dvh bg-canvas"
      aria-busy={state === 'loading'}
      aria-label={state === 'loading' ? 'Checking your session' : 'Redirecting to sign in'}
    />
  );
}
