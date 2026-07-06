# Zustand Patterns

## When to Use Zustand

Zustand is for **high-frequency cross-feature global state** that cannot be cleanly shared through React context without causing excessive re-renders.

State selection guide — pick the simplest tool that fits:

| State type | Tool |
|---|---|
| Server data (fetched from API) | TanStack Query / SWR |
| Feature-local UI state | `useState` / `useReducer` |
| Shared structured state across a feature | `useReducer` + Context |
| Cross-feature, high-frequency global state | Zustand |

Do not reach for Zustand for server state or feature-scoped UI state.

---

## Store Shape

Always use `devtools` and `subscribeWithSelector` middleware. Namespace state by domain — never put flat keys at the root level.

```ts
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

interface AppState {
  auth: {
    isAuthenticated: boolean;
    setIsAuthenticated: (value: boolean) => void;
  };
  ui: {
    sidebarOpen: boolean;
    setSidebarOpen: (value: boolean) => void;
  };
}

export const useAppStore = create<AppState>()(
  devtools(
    subscribeWithSelector((set) => ({
      auth: {
        isAuthenticated: false,
        setIsAuthenticated: (isAuthenticated) =>
          set((prev) => ({ auth: { ...prev.auth, isAuthenticated } })),
      },
      ui: {
        sidebarOpen: true,
        setSidebarOpen: (sidebarOpen) =>
          set((prev) => ({ ui: { ...prev.ui, sidebarOpen } })),
      },
    })),
  ),
);
```

**Always use:**
- `devtools` — for Redux DevTools inspection in development.
- `subscribeWithSelector` — enables scoped subscriptions outside React.

---

## Consuming the Store — Always Use a Selector

Never call the store hook without a selector — it subscribes to the entire store and re-renders on every state change.

```ts
// ✅ Scoped — only re-renders when auth.isAuthenticated changes
const isAuthenticated = useAppStore((state) => state.auth.isAuthenticated);

// ❌ Subscribes to everything
const store = useAppStore();
```

---

## Reading State Outside React

```ts
// One-time read (no subscription)
const { isAuthenticated } = useAppStore.getState().auth;

// Programmatic subscription (e.g., in a service module)
const unsub = useAppStore.subscribe(
  (state) => state.auth.isAuthenticated,
  (isAuthenticated) => {
    if (!isAuthenticated) clearLocalData();
  },
);

// Clean up when done
unsub();
```

---

## Adding a New Domain Slice

Extend the existing store with a new namespace — do not create a second `create()` call unless the state is truly isolated from the rest.

```ts
interface AppState {
  // ...existing domains...
  notifications: {
    unreadCount: number;
    setUnreadCount: (count: number) => void;
  };
}

// In the create() call:
notifications: {
  unreadCount: 0,
  setUnreadCount: (unreadCount) =>
    set((prev) => ({ notifications: { ...prev.notifications, unreadCount } })),
},
```

Always spread the existing domain slice when updating: `{ ...prev.myDomain, changedKey: value }` — never mutate in place.

---

## Persisting State (localStorage)

Use the `persist` middleware only for state that must survive a page reload (e.g., theme preference, sidebar collapsed state):

```ts
import { persist } from 'zustand/middleware';

const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'user-preferences' },
  ),
);
```

Do not persist auth tokens or sensitive data in Zustand — use a dedicated, expiry-aware token store.

---

## Anti-Patterns

- Do not store server data (API responses) in Zustand — use TanStack Query.
- Do not store feature-local UI state (dialog open, form step, tab index) in Zustand.
- Do not call `useAppStore()` without a selector.
- Do not create multiple Zustand stores unless they are genuinely independent subsystems.
- Do not omit `devtools` or `subscribeWithSelector`.
- Do not mutate state directly — always use `set()`.

---

## Related References

- `references/state-management.md` — confirm an external store is the right layer before adding a slice
- `references/reducer-context.md` — the lighter alternative for subtree-scoped shared state
- `references/auth-patterns.md` — the token store consumed through an interface
