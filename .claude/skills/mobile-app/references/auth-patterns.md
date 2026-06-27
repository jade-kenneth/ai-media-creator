# Auth Patterns

## Architecture Overview

```
SecureStore (persistent)
    ↓
store object  ←  setexp / getexp / set / del (internal helpers)
    ↓
useAuth hook  ←  owns all session logic, refresh, visibility listener
    ↓
AuthProvider  ←  thin context wrapper, calls useAuth internally
    ↓
useSession    ←  read-only access for consumers, optional onAuthenticated callback
    ↓
withAuthGuard / RouteGuard  ←  redirect unauthenticated users
```

---

## Token Store

The store is a typed object interface backed by `expo-secure-store`. Tokens with expiry are stored with a `{ __v, __t }` envelope:

```ts
// Internal helpers (not exported)
function setexp(key: string, val: string | null | undefined, exp: number): Promise<void>
async function getexp(key: string): Promise<string | undefined>

// Public store interface
export const store: {
  get(): Promise<StoreValue>;
  get<T extends StoreKey>(key: T): Promise<StoreValue[T]>;
  set(value: StoreValue): Promise<void>;
  set<T extends AuthIdWithoutExpiration>(key: T, value: StoreValue[T]): Promise<void>;
  set<T extends AuthIdWithExpiration>(key: T, value: StoreValue[T], expires: number): Promise<void>;
  clearSession(): Promise<void>;
};
```

`setexp` writes `JSON.stringify({ __v: value, __t: expTimestamp })` to SecureStore.
`getexp` reads the envelope, checks `isAfter(obj.__t, new Date())`, deletes the key if expired, and returns `undefined`.

Expiry conventions:
- `accessToken` — 15 minutes (`addMinutes(new Date(), 15).getTime()`)
- `refreshToken` — 30 days (`addDays(new Date(), 30).getTime()`)

When `store.set(value)` is called with a plain object it writes all fields. `store.clearSession()` deletes all auth keys.

---

## Session Type

```ts
type Session =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'error'; reason: string }
  | { status: 'authenticated'; accessToken: string; refreshToken: string; role: UserRole };
```

Consumers narrow with `session.status === 'authenticated'` before reading `session.accessToken` etc.

---

## useAuth Hook

Owns session initialization, background refresh, and app visibility listening:

```ts
export function useAuth() {
  // isMountedRef — prevents setState after unmount
  // isRefreshingRef — prevents concurrent refresh calls
  // DeviceEventEmitter listener for AUTH_STATE_CHANGE_EVENT
  // AppState / document visibilitychange listener to re-check on foreground
  return { session };
}
```

Key behaviors:
- On mount: reads tokens from store, calls `getSession()` to validate/refresh
- On visibility change (`active` / `visibilitychange`): re-calls `getSession()` if not already refreshing
- On `AUTH_STATE_CHANGE_EVENT` (emitted after login/logout): re-reads the store
- Uses `isMountedRef` to guard all `setState` calls

This hook is only called once — inside `AuthProvider`. Never call `useAuth` in components.

---

## AuthProvider

Thin context wrapper. Calls `useAuth()` once and exposes the session via context:

```ts
export const AuthProvider = ({ children }: PropsWithChildren) => {
  const { session } = useAuth();
  return (
    <AuthContext.Provider value={{ session }}>
      {children}
    </AuthContext.Provider>
  );
};
```

Mount once at the root layout. Never nest multiple `AuthProvider` instances.

---

## useSession

Consumer hook. Reads from context and optionally fires a callback when the session becomes authenticated:

```ts
export function useSession(config?: { onAuthenticated?(session: Session__Authenticated): void }) {
  const context = useContext(AuthContext);
  invariant(context, "'useSession' must be used within 'AuthProvider'");

  useEffect(() => {
    if (context.session.status === 'authenticated') {
      config?.onAuthenticated?.(context.session);
    }
  }, [config, context.session]);

  return context.session;
}
```

The `onAuthenticated` callback fires whenever the session transitions to authenticated. Useful for post-login side effects (e.g. registering push tokens).

---

## resolveGuardState

Pure function — no hooks, no side effects. Maps a session to the route guard state:

```ts
export function resolveGuardState(session: LazySession): GuardState {
  if (session.status === 'loading') return 'loading';
  if (session.status === 'unauthenticated' || session.status === 'error') return 'unauthenticated';
  return 'authenticated';
}
```

Test this function in isolation — it contains all the guard logic.

---

## RouteGuard / withAuthGuard

Apply at the layout level, not individual screens. The guard reads session state, shows a loading UI or redirects, and renders the protected content only when `guardState === 'authenticated'`:

```ts
// HOC approach
export function withAuthGuard<P extends object>(Component: ComponentType<P>) {
  function GuardedComponent(props: P) {
    const session = useSession();
    const guardState = resolveGuardState(session);

    useEffect(() => {
      if (guardState !== 'unauthenticated') return;
      router.replace(LOGIN_ROUTE);
    }, [guardState]);

    if (guardState !== 'authenticated') return <RouteGuard state={guardState} />;
    return <Component {...props} />;
  }

  GuardedComponent.displayName = `withAuthGuard(${Component.displayName ?? Component.name})`;
  return GuardedComponent;
}
```

`RouteGuard` renders:
- `'loading'` → spinner with "Checking your session"
- `'unauthenticated'` → shield icon with "Redirecting to sign in" (briefly visible before redirect)

---

## Auth State Change Events

After login or logout, emit `AUTH_STATE_CHANGE_EVENT` via `DeviceEventEmitter` to notify `useAuth` to re-read the store:

```ts
// After successful login:
await store.set({ accessToken, refreshToken, role });
DeviceEventEmitter.emit(AUTH_STATE_CHANGE_EVENT);

// After logout:
await store.clearSession();
DeviceEventEmitter.emit(AUTH_STATE_CHANGE_EVENT);
```

Never read the store directly in components — always go through `useSession`.

---

## Rules

- `useAuth` is called once, inside `AuthProvider` only
- Components read session via `useSession`, never via `useAuth`
- `resolveGuardState` is a pure function — keep all guard logic there
- Apply `withAuthGuard` at the layout level, not on individual screen files
- `store.get()` / `store.set()` / `store.clearSession()` are the only public store API
- Never read raw SecureStore keys directly in feature code
- `setexp` / `getexp` are internal helpers — do not use them outside the store module
