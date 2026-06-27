# Auth Patterns — Next.js App Router (Client-Side)

## Overview

Client-side auth: tokens in localStorage with expiry envelopes, session loaded on mount, route protection via HOC. No Next.js `middleware.ts` involved.

---

## Session State Shape

```ts
type Session =
  | { status: 'loading' }
  | { status: 'authenticated'; accessToken: string; refreshToken?: string; role: string }
  | { status: 'unauthenticated' }
  | { status: 'error' };
```

---

## Token Store — Abstract Behind an Interface

All localStorage reads/writes go through a single store module. Nothing outside this module touches localStorage directly.

```ts
// lib/session-store.ts

type TokenPair = { accessToken?: string | null; refreshToken?: string | null };

type SessionStore = {
  get(): Promise<TokenPair>;
  set(tokens: TokenPair): Promise<void>;
  clearSession(): Promise<void>;
};

// Tokens are stored with an expiry envelope: { __v: value, __t: expiresAtMs }
function setexp(key: string, value: string, expiresAt: number) {
  localStorage.setItem(key, JSON.stringify({ __v: value, __t: expiresAt }));
}

function getexp(key: string): string | undefined {
  const raw = localStorage.getItem(key);
  if (!raw) return undefined;
  try {
    const { __v, __t } = JSON.parse(raw);
    if (Date.now() < __t) return __v;
  } catch { /* */ }
  localStorage.removeItem(key);
  return undefined;
}

export const store: SessionStore = {
  get: () => Promise.resolve({
    accessToken: getexp('access_token'),
    refreshToken: getexp('refresh_token'),
  }),
  set: ({ accessToken, refreshToken }) => new Promise((resolve) => {
    if (accessToken) setexp('access_token', accessToken, Date.now() + 15 * 60 * 1000);
    if (refreshToken) setexp('refresh_token', refreshToken, Date.now() + 30 * 24 * 60 * 60 * 1000);
    resolve();
  }),
  clearSession: () => new Promise((resolve) => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    resolve();
  }),
};
```

---

## useAuth Hook — Session Logic Lives Here

`useAuth` owns all session fetching. `AuthProvider` is kept thin and just wires context.

```ts
// providers/AuthProvider/useAuth.ts
import { createContext, useEffect, useRef, useState } from 'react';

export const AuthContext = createContext<{ session: Session } | null>(null);

export function useAuth() {
  const [session, setSession] = useState<Session>({ status: 'loading' });
  const isMountedRef = useRef(true);
  const isRefreshingRef = useRef(false);

  const fetchSession = async () => {
    // Guard: skip if already refreshing
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;

    try {
      const nextSession = await getSession(); // reads from store, validates token

      if (!isMountedRef.current) return; // guard: skip stale update after unmount
      setSession(nextSession);
    } catch {
      if (!isMountedRef.current) return;
      setSession({ status: 'error' });
    } finally {
      isRefreshingRef.current = false;
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    // Re-validate when the user returns to the tab (catches expiry while hidden)
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      void fetchSession();
    };

    void fetchSession();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMountedRef.current = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return { session };
}
```

**`isMountedRef`** — prevents calling `setSession` after the component unmounts.  
**`isRefreshingRef`** — prevents concurrent fetches (e.g., two rapid visibility events).

---

## AuthProvider — Thin Context Wrapper

`AuthProvider` calls `useAuth` and wraps context. No session logic here.

```tsx
// providers/AuthProvider/AuthProvider.tsx
'use client';

import { PropsWithChildren, useContext, useEffect } from 'react';
import { AuthContext, useAuth } from './useAuth';

export function AuthProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  return <AuthContext.Provider value={{ session }}>{children}</AuthContext.Provider>;
}
```

---

## useSession — Reading Session + Lifecycle Callback

```ts
export interface UseSessionConfig {
  onAuthenticated?(session: Session & { status: 'authenticated' }): void;
}

export function useSession(config?: UseSessionConfig) {
  const context = useContext(AuthContext);
  invariant(context, "'useSession' must be used within 'AuthProvider'");

  useEffect(() => {
    if (context.session.status === 'authenticated') {
      config?.onAuthenticated?.(context.session);
    }
  }, [context.session, config]);

  return context.session;
}
```

The optional `onAuthenticated` callback fires once the session resolves to authenticated — useful for triggering side effects (e.g., syncing user data to a global store).

---

## resolveGuardState — Pure Function

Map the session discriminated union to the guard's three states. Keep this as a pure, testable function separate from the HOC.

```ts
type GuardState = 'loading' | 'unauthenticated' | 'authenticated';

export function resolveGuardState(session: Session): GuardState {
  if (session.status === 'loading') return 'loading';
  if (session.status === 'unauthenticated' || session.status === 'error') return 'unauthenticated';
  return 'authenticated';
}
```

---

## RouteGuard Component — Loading + Redirect UI

A single component handles both the loading spinner and the redirecting state. It renders while `withAuthGuard` is still checking or redirecting — prevents a flash of blank content.

```tsx
type RouteGuardState = 'loading' | 'unauthenticated';

export function RouteGuard({ state }: { state: RouteGuardState }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      {state === 'loading' ? (
        <Loader2 className="size-8 animate-spin text-primary" />
      ) : (
        <ShieldAlert className="size-8 text-amber-600 dark:text-amber-400" />
      )}
    </div>
  );
}
```

---

## withAuthGuard HOC — Layout-Level Route Protection

Apply at the **layout level**, not inside individual page components.

```tsx
// features/auth/with-auth-guard.tsx
'use client';

export function withAuthGuard<P extends object>(Component: ComponentType<P>) {
  function GuardedComponent(props: P) {
    const session = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const guardState = resolveGuardState(session);

    const callback = encodeURIComponent(`${pathname}?${searchParams}`);
    const redirectTarget = `/login?callback=${callback}`;

    useEffect(() => {
      if (guardState !== 'unauthenticated') return;
      router.replace(redirectTarget);
    }, [guardState, redirectTarget, router]);

    // Render RouteGuard for both 'loading' and 'unauthenticated' states
    if (guardState !== 'authenticated') {
      return <RouteGuard state={guardState} />;
    }

    return <Component {...props} />;
  }

  GuardedComponent.displayName = `withAuthGuard(${Component.displayName ?? Component.name ?? 'Component'})`;
  return GuardedComponent;
}
```

```tsx
// app/admin/layout.tsx
export default withAuthGuard(AdminLayout);
```

---

## Role-Based Guard

Same HOC pattern, extends `resolveGuardState` with a role check:

```ts
type RoleGuardState = GuardState | 'forbidden';

export function resolveRoleGuardState(session: Session, requiredRole: string): RoleGuardState {
  const base = resolveGuardState(session);
  if (base !== 'authenticated') return base;
  if (session.role !== requiredRole) return 'forbidden';
  return 'authenticated';
}
```

---

## Login / Logout

```ts
// Login
async function login(credentials: LoginInput) {
  const { accessToken, refreshToken } = await loginRequest(credentials);
  await store.set({ accessToken, refreshToken });
}

// Logout — always clear then redirect
async function logout(router: AppRouterInstance) {
  await store.clearSession();
  router.replace('/login');
}
```

---

## Anti-Patterns

- Do not put session fetching logic inside `AuthProvider` — it belongs in `useAuth`.
- Do not check `user !== null` — check `session.status === 'authenticated'`.
- Do not read localStorage directly outside the store module.
- Do not guard individual page components — guard at the layout level with `withAuthGuard`.
- Do not store tokens without expiry — stale tokens persist indefinitely otherwise.
- Do not implement token refresh in individual query hooks — centralize in the HTTP client.
- Do not call `store.clearSession()` without redirecting afterward.
- Do not return `null` while redirecting in `withAuthGuard` — render `<RouteGuard>` to prevent a blank flash.
