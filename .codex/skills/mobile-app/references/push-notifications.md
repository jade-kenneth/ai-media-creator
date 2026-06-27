# Push Notifications

## Architecture

```
expo-notifications + expo-device + expo-secure-store
        ↓
push-notifications.ts  ←  pure functions, no React
        ↓
PushNotificationsProvider  ←  React lifecycle, session awareness
        ↓
NotificationPermissionPrompt  ←  UI overlay (modal/sheet)
```

The provider mounts once at the root layout, inside `AuthProvider`, so it has access to `useSession`.

---

## Core Functions (push-notifications.ts)

### Configuration

```ts
export function configureForegroundNotificationHandler(): void
```
Call once on provider mount. Sets `Notifications.setNotificationHandler` so foreground notifications show a banner, play sound, and update the badge. Guards with an `isNotificationHandlerConfigured` boolean to prevent double registration.

### Registration

```ts
export type PushRegistrationResult =
  | { status: 'registered'; token: string }
  | { status: 'already-registered'; token: string }
  | { status: 'skipped'; reason: 'simulator' | 'expo-go-not-supported' | 'permission-denied' | 'missing-project-id' }
  | { status: 'failed'; reason: 'token-fetch-failed' | 'server-registration-failed' };

export async function registerPushNotificationsForSession(
  sessionKey: string,
): Promise<PushRegistrationResult>
```

Internally:
1. Skips on Expo Go (`Constants.appOwnership === 'expo'`) and non-physical devices (`!Device.isDevice`)
2. Calls `Notifications.getPermissionsAsync()` then `requestPermissionsAsync()` if not granted
3. Gets the Expo push token via `Notifications.getExpoPushTokenAsync({ projectId })`
4. Registers with the server only if the token+sessionKey+platform combination has changed (cached in SecureStore)
5. Returns a typed result — never throws

### Android Channel

```ts
// Called inside registerPushNotificationsForSession
async function ensureAndroidChannel(): Promise<void>
```
Creates the default notification channel for Android with MAX importance, vibration pattern, and public lockscreen visibility. Skips on iOS.

### Permission Prompt Logic

```ts
export async function shouldShowNotificationPermissionPrompt(): Promise<boolean>
export async function markNotificationPermissionPromptDeferred(): Promise<void>
export async function clearNotificationPermissionPromptMeta(): Promise<void>
```

The prompt is shown when:
- Permission is not yet granted
- AND either no deferral record exists OR the deferral was more than 3 days ago

Deferral timestamp is stored in SecureStore as `{ deferredAt: ISO string }`.

### Subscriptions

All subscription functions return an unsubscribe function:

```ts
export function subscribeToPushTokenRefresh(sessionKey: string): () => void
export function subscribeToForegroundNotifications(onReceived?: (n: Notification) => void): () => void
export function subscribeToPushNotificationResponses(onResponse?: (r: NotificationResponse) => void): () => void
```

`subscribeToPushNotificationResponses` also navigates to the target route on tap.

### Payload Parsing

```ts
export function parsePushNotificationData(data: unknown): ParsedPushData
export function resolveRouteTargetFromData(data: unknown): NotificationRouteTarget
```

Extracts typed fields (`announcementId`, `requestId`, `scheduleId`, etc.) from the raw notification payload and resolves the navigation route. Handles legacy V1 field names and normalized type matching.

---

## PushNotificationsProvider

```tsx
export function PushNotificationsProvider({ children }: PropsWithChildren) {
  const session = useSession();
  const sessionKey = useMemo(() => /* derive from session */ null, [session]);
  const sessionKeyRef = useRef(sessionKey); // always up-to-date in listeners

  // Cold-start routing (killed → tapped notification)
  const lastResponse = Notifications.useLastNotificationResponse();
  useEffect(() => {
    // 500ms delay so navigator mounts first
    // Dedup by notification identifier using handledNotifIdRef
  }, [lastResponse]);

  // Foreground handler + tap listener
  useEffect(() => {
    configureForegroundNotificationHandler();
    const unsub1 = subscribeToPushNotificationResponses(...);
    const unsub2 = subscribeToForegroundNotifications(...);
    return () => { unsub1(); unsub2(); };
  }, []);

  // Register when session changes
  useEffect(() => {
    if (!sessionKey) { setPermissionPromptVisible(false); return; }
    void maybeRegisterOrPromptForPermission(sessionKey);
    const unsub = subscribeToPushTokenRefresh(sessionKey);
    return unsub;
  }, [sessionKey]);

  // Re-register on app foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') return;
      void clearAppBadgeCount();
      if (sessionKeyRef.current) void maybeRegisterOrPromptForPermission(sessionKeyRef.current);
    });
    return () => sub.remove();
  }, []);

  return (
    <>
      {children}
      <NotificationPermissionPrompt
        visible={isPermissionPromptVisible}
        isLoading={isPromptEnabling}
        onEnable={handleEnablePrompt}
        onMaybeLater={handleMaybeLaterPrompt}
      />
    </>
  );
}
```

Key patterns:
- `sessionKeyRef` keeps listeners in sync without re-subscribing
- `useLastNotificationResponse` handles cold-start taps (killed app)
- All subscription cleanups are returned from `useEffect`
- Badge count is cleared on every app foreground
- Permission prompt show/hide is driven by the provider, not the UI component

---

## Session Key Pattern

Derive a session key from the access token prefix + role:

```ts
function buildSessionKey(accessToken: string, role: string): string {
  return `${role}:${accessToken.slice(0, 16)}`;
}
```

This key is stored with the registered token in SecureStore. If the session key changes (new login, role change) the token is re-registered with the server.

---

## Badge Count Sync

After any notification interaction (tap, foreground arrival), sync the badge count with the server's unread count:

```ts
async function syncAppBadgeCount() {
  const response = await myNotificationsRequest({ first: 1 });
  if (!response.ok) return;
  await Notifications.setBadgeCountAsync(response.data.myNotifications.unreadCount)
    .catch(() => {}); // ignore badge failures
}

async function clearAppBadgeCount() {
  await Notifications.setBadgeCountAsync(0).catch(() => {});
}
```

Always wrap `setBadgeCountAsync` in a `.catch(() => {})` — badge permissions can be revoked independently.

---

## Notification Navigation

When the user taps a notification (foreground or cold-start), call `resolveRouteTargetFromData` then `router.push(route)`. Before navigating, mark the notification as read — either by explicit `notificationId` in the payload or by matching the entity ID against the unread list.

---

## Error Handling

- Token fetch failures return `{ status: 'failed', reason: 'token-fetch-failed' }` — do not show a user-facing error
- Server registration failures return `{ status: 'failed', reason: 'server-registration-failed' }` — log a warning but do not block
- Permission denial returns `{ status: 'skipped', reason: 'permission-denied' }` — show the "Maybe Later" path
- All SecureStore operations are wrapped in try/catch — storage errors must not crash the app

---

## Rules

- Never call `Notifications.requestPermissionsAsync()` directly in a component — always go through `registerPushNotificationsForSession`
- Never duplicate the registration registration-meta check — it lives in `push-notifications.ts`
- `configureForegroundNotificationHandler` is idempotent — call it once in the provider's mount effect
- Cold-start routing requires a 500ms delay — the navigator must mount before `router.push` is called
- Unsubscribe all `Notifications.add*Listener` subscriptions in `useEffect` cleanup
- `Device.isDevice` is `false` on simulators — always check before requesting tokens
