# React Patterns Guide

## React and Frontend Rules

Apply these defaults for all frontend work:

- Keep user-facing interfaces responsive.
- Use `useForm` for frontend forms.
- Use `zod` for validation.
- Use `useFieldArray` for array-based form fields.
- Add loading, empty, and error states for async UI.
- Keep components focused on one responsibility.
- Prefer composition over deeply nested conditionals.
- Follow existing project UI patterns before introducing new ones.
- Prefer inline creation and editing with modals, drawers, or inline panels over navigating to new CRUD pages.
- Keep inline creation and editing flows responsive and accessible across screen sizes.
- Use visible close controls, focus management, Escape handling, and body scroll locking for overlays.

## Preferred React Patterns

Use these patterns by default:

- Use custom hooks for reusable logic.
- Use providers for app-wide services such as auth, theme, API, cache, and configuration.
- Organize code by feature and colocate related files.
- Use data hooks or server-state libraries for server state.
- Use HOCs only for page-level cross-cutting concerns such as auth gates, layout wrappers, or instrumentation.
- Use Suspense and route boundaries intentionally.
- Use `useMemo` and `useCallback` only when there is a real performance reason.
- Use `useReducer` for complex local state.
- Use `useReducer` with Context for moderate shared structured state.
- Use Zustand or another external store only when shared state is high-frequency and widely consumed.
- Use compound components or headless patterns when they make reusable UI APIs clearer.

## Component Discovery and Reuse Rules

Prefer reuse before custom implementation.

- Check project registries and existing shared components first.
- If the project registry does not already provide the component, use MCP to discover maintained components before building a new one.
- Build custom components only when existing registry options and MCP-discovered options do not fit the requirement.
- Avoid creating redundant components that overlap with the design system or shared primitives.

---

This document summarizes practical React patterns used in modern apps and highlights which ones fit this codebase (Next.js App Router + monorepo).

## Table of Contents

1. [How To Use This Guide](#how-to-use-this-guide)
2. [Pattern Priority for This Project](#pattern-priority-for-this-project)
3. [Custom Hooks Pattern](#1-custom-hooks-pattern)
4. [Compound Component Pattern](#2-compound-component-pattern)
5. [Controlled vs Uncontrolled Pattern](#3-controlled-vs-uncontrolled-pattern)
6. [Render Props Pattern](#4-render-props-pattern)
7. [Higher-Order Component (HOC) Pattern](#5-higher-order-component-hoc-pattern)
8. [Provider Pattern](#6-provider-pattern-beyond-basic-context)
9. [State Machine Pattern](#7-state-machine-pattern)
10. [Headless Component Pattern](#8-headless-component-pattern)
11. [Colocation Pattern](#9-colocation-pattern-feature-first-organization)
12. [Atomic Design Pattern](#10-atomic-design-pattern)
13. [Server State Pattern](#11-server-state-pattern-apollo--tanstack-query-style)
14. [Suspense Pattern](#12-suspense-pattern-concurrent-react--app-router)
15. [Inversion of Control Pattern](#13-inversion-of-control-pattern)
16. [Pattern Selection Decision Framework](#pattern-selection-decision-framework)
17. [Anti-Patterns to Avoid](#anti-patterns-to-avoid)

---

## How To Use This Guide

- Use this as a reference when designing new features.
- Prefer simple patterns first; add abstraction only when repetition becomes real.
- Match the existing project structure and conventions before introducing new patterns.
- Each pattern includes: **what it is**, **when to use it**, **when NOT to use it**, **code examples**, and **project-specific notes**.

---

## Pattern Priority for This Project

For this repo (Next.js App Router + Apollo + monorepo), these patterns are ranked by daily usage:

| Priority            | Pattern                             | When You'll Use It                              |
| ------------------- | ----------------------------------- | ----------------------------------------------- |
| **P0 — Daily**      | Custom Hooks                        | Every feature with reusable logic               |
| **P0 — Daily**      | Server State (Apollo hooks)         | Every data-fetching component                   |
| **P0 — Daily**      | Colocation by Feature               | Every new feature module                        |
| **P1 — Weekly**     | Provider Pattern                    | App-wide services (auth, cart, theme)           |
| **P1 — Weekly**     | Suspense + Client/Server boundaries | Loading states, streaming, App Router           |
| **P2 — As needed**  | HOC Pattern                         | Admin guards, layout wrappers, route protection |
| **P2 — As needed**  | Controlled/Uncontrolled             | Form-heavy features                             |
| **P3 — Occasional** | Compound Components                 | Shared UI library components                    |
| **P3 — Occasional** | State Machine                       | Complex async flows (checkout, multi-step)      |
| **P3 — Occasional** | Inversion of Control                | Highly configurable shared components           |

---

## 1. Custom Hooks Pattern

Custom hooks extract reusable logic out of UI components into composable functions.

### Why it is powerful

| Benefit                    | Description                                                             |
| -------------------------- | ----------------------------------------------------------------------- |
| **Reusable logic**         | Same behavior across multiple components without duplication            |
| **Cleaner components**     | UI components focus on rendering, hooks handle behavior                 |
| **Separation of concerns** | Logic is testable independently from UI                                 |
| **Composability**          | Hooks can call other hooks — compose complex behavior from simple parts |
| **Type safety**            | Return types are inferred, giving consumers strong typing               |

### Example — Feature-Specific Hook

```tsx
// filepath: features/auth/useAuth.ts
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from './types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const router = useRouter();

  useEffect(() => {
    checkSession()
      .then((session) => {
        setUser(session.user);
        setStatus('authenticated');
      })
      .catch(() => {
        setUser(null);
        setStatus('unauthenticated');
      });
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setStatus('loading');
    const session = await authenticate(credentials);
    setUser(session.user);
    setStatus('authenticated');
  };

  const logout = async () => {
    await clearSession();
    setUser(null);
    setStatus('unauthenticated');
    router.push('/login');
  };

  return { user, status, login, logout } as const;
}
```

```tsx
// filepath: features/auth/LoginPage.tsx
function LoginPage() {
  const { user, status, login } = useAuth();

  if (status === 'loading') return <Spinner />;
  if (status === 'authenticated') return <Redirect to="/dashboard" />;

  return <LoginForm onSubmit={login} />;
}
```

### Hook Naming and Placement Rules

| Rule                                     | Example                                                     |
| ---------------------------------------- | ----------------------------------------------------------- |
| Prefix with `use`                        | `useAuth`, `useCart`, `useProductFilters`                   |
| Feature-specific → colocate with feature | `features/auth/useAuth.ts`                                  |
| Shared across features → `libs/`         | `libs/hooks/useDebounce.ts`                                 |
| Data-fetching → wrap query hooks         | `features/notes/useNotes.ts` wrapping `useQuery(GET_NOTES)` |
| Never put unrelated hooks in one file    | One hook per file, matching the filename                    |

### When NOT to Use Custom Hooks

- Logic is used in exactly one component and is simple (inline it)
- Hook would only wrap a single `useState` with no transformation
- Logic is purely UI rendering (use a component instead)

### Project note

- This repo already uses hook-driven patterns (for example auth/session and store selectors).
- Prefer adding hooks under the relevant feature/module instead of a global `hooks/` dump when the hook is feature-specific.

---

## 2. Compound Component Pattern

Compound components expose a declarative API by grouping related subcomponents under a parent namespace.

### Example

```tsx
// Usage — declarative and flexible
<Modal>
  <Modal.Header title="Confirm Delete" />
  <Modal.Body>
    <p>Are you sure you want to delete this item?</p>
  </Modal.Body>
  <Modal.Footer>
    <Button variant="ghost" onClick={onCancel}>
      Cancel
    </Button>
    <Button variant="danger" onClick={onConfirm}>
      Delete
    </Button>
  </Modal.Footer>
</Modal>
```

### Implementation Pattern

```tsx
// filepath: libs/ui/components/Modal.tsx
import { createContext, useContext } from 'react';

type ModalContextValue = {
  isOpen: boolean;
  onClose: () => void;
};

const ModalContext = createContext<ModalContextValue | null>(null);

function useModalContext() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('Modal subcomponents must be used within <Modal>');
  return ctx;
}

function Modal({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null;
  return (
    <ModalContext.Provider value={{ isOpen, onClose }}>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      </div>
    </ModalContext.Provider>
  );
}

Modal.Header = function ModalHeader({ title }: { title: string }) {
  const { onClose } = useModalContext();
  return (
    <div className="modal-header">
      <h2>{title}</h2>
      <button onClick={onClose} aria-label="Close">
        ×
      </button>
    </div>
  );
};

Modal.Body = function ModalBody({ children }: { children: React.ReactNode }) {
  return <div className="modal-body">{children}</div>;
};

Modal.Footer = function ModalFooter({ children }: { children: React.ReactNode }) {
  return <div className="modal-footer">{children}</div>;
};

export { Modal };
```

### Why it is useful

| Benefit                   | Description                                                    |
| ------------------------- | -------------------------------------------------------------- |
| **Flexible API**          | Consumers compose subcomponents in any order                   |
| **Clean composition**     | No prop explosion on the parent                                |
| **Reduces prop drilling** | Shared state via context, not props                            |
| **Self-documenting**      | `<Modal.Header>` is clearer than `headerTitle` prop            |
| **Extensible**            | New subcomponents can be added without changing the parent API |

### When to use vs. when NOT to use

| Use when                                         | Avoid when                              |
| ------------------------------------------------ | --------------------------------------- |
| Building shared UI library components            | Component has a single, fixed layout    |
| Multiple layout variations are needed            | Only one configuration makes sense      |
| Consumers need to rearrange subcomponents        | Adding complexity to a simple component |
| Designing dropdown, accordion, tabs, modal, card | One-off feature component               |

---

## 3. Controlled vs Uncontrolled Pattern

This pattern is foundational for forms and interactive inputs.

### Comparison

| Aspect                   | Controlled                         | Uncontrolled                           |
| ------------------------ | ---------------------------------- | -------------------------------------- |
| **State ownership**      | Component state (via `useState`)   | DOM (via `ref`)                        |
| **Value access**         | Through state variable             | Through `ref.current.value`            |
| **Real-time validation** | ✅ Easy — validate on every change | ❌ Harder — need to read ref on events |
| **Form library support** | React Hook Form `Controller`       | React Hook Form `register` (default)   |
| **Performance**          | Re-renders on every keystroke      | No re-renders on input                 |
| **Synchronization**      | ✅ Easy to sync with other UI      | ❌ Harder to sync                      |

### Controlled Input

```tsx
// ✅ Use when you need real-time validation, conditional logic, or UI sync
function ControlledInput() {
  const [value, setValue] = useState('');
  const isValid = value.length >= 3;

  return (
    <div>
      <input value={value} onChange={(e) => setValue(e.target.value)} aria-invalid={!isValid} />
      {!isValid && <span className="error">Minimum 3 characters</span>}
    </div>
  );
}
```

### Uncontrolled Input

```tsx
// ✅ Use for simple forms or when performance matters (large forms)
function UncontrolledInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit() {
    const value = inputRef.current?.value;
    // validate and submit
  }

  return (
    <form onSubmit={handleSubmit}>
      <input ref={inputRef} defaultValue="" />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### With React Hook Form (Combines Both)

```tsx
// React Hook Form uses uncontrolled by default (register) but supports controlled (Controller)
function ProductForm() {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Uncontrolled — best performance */}
      <input {...form.register('name')} />

      {/* Controlled — needed for custom UI components */}
      <Controller control={form.control} name="category" render={({ field }) => <Select {...field} options={categories} />} />
    </form>
  );
}
```

### Decision Guide

| Situation                                            | Pattern                                       |
| ---------------------------------------------------- | --------------------------------------------- |
| Need real-time validation feedback                   | Controlled                                    |
| Need to conditionally show/hide fields               | Controlled                                    |
| Need to format input as user types (phone, currency) | Controlled                                    |
| Large form with 20+ fields                           | Uncontrolled (via React Hook Form `register`) |
| Custom UI component (Select, DatePicker)             | Controlled (via `Controller`)                 |
| Simple search input without real-time UI changes     | Uncontrolled                                  |

---

## 4. Render Props Pattern

Render props pass a function as a child (or prop) that receives data and returns JSX. Less common in new code since hooks often replace them.

### Example

```tsx
// Render prop component
function DataFetcher<T>({ url, children }: { url: string; children: (data: T) => ReactNode }) {
  const { data, loading, error } = useFetch<T>(url);

  if (loading) return <Spinner />;
  if (error) return <ErrorState error={error} />;
  return <>{children(data)}</>;
}

// Usage
<DataFetcher<Product[]> url="/api/products">
  {(products) => (
    <ul>
      {products.map((p) => (
        <li key={p.id}>{p.name}</li>
      ))}
    </ul>
  )}
</DataFetcher>;
```

### When to use vs. hooks alternative

| Use render props when                                        | Prefer hooks when                                     |
| ------------------------------------------------------------ | ----------------------------------------------------- |
| Interop with libraries exposing render-prop APIs             | Building new logic from scratch                       |
| Need to inject UI rendering flexibility into a logic wrapper | Hook can return the data and let the component render |
| Legacy code migration (intermediate pattern)                 | Greenfield development                                |

### Modern hook equivalent

```tsx
// Instead of a render-prop component:
function useProducts() {
  return useQuery({ queryKey: ['products'], queryFn: fetchProducts });
}

// Component uses the hook directly:
function ProductList() {
  const { data, isLoading, error } = useProducts();
  if (isLoading) return <Spinner />;
  if (error) return <ErrorState error={error} />;
  return (
    <ul>
      {data?.map((p) => (
        <li key={p.id}>{p.name}</li>
      ))}
    </ul>
  );
}
```

---

## 5. Higher-Order Component (HOC) Pattern

HOCs wrap a component and add behavior (auth, layout, permissions, analytics, etc.).

### Example — Auth Guard HOC

```tsx
// filepath: features/auth/withAuth.tsx
import { useAuth } from './useAuth';
import { redirect } from 'next/navigation';

export function withAuth<P extends Record<string, unknown>>(Component: React.ComponentType<P>, options?: { requiredRole?: string }) {
  return function AuthenticatedComponent(props: P) {
    const { user, status } = useAuth();

    if (status === 'loading') return <PageSkeleton />;
    if (status === 'unauthenticated') {
      redirect('/login');
      return null;
    }
    if (options?.requiredRole && user?.role !== options.requiredRole) {
      return <UnauthorizedPage />;
    }

    return <Component {...props} />;
  };
}

// Usage
const AdminDashboard = withAuth(DashboardContent, { requiredRole: 'ADMIN' });
```

### HOC vs Hook Decision

| Concern                              | Use HOC | Use Hook                                |
| ------------------------------------ | ------- | --------------------------------------- |
| Auth gate / route protection         | ✅      | ❌ (rendering logic belongs in wrapper) |
| Layout wrapper (sidebar, navbar)     | ✅      | ❌                                      |
| Role-based page access               | ✅      | ❌                                      |
| Page-level analytics/instrumentation | ✅      | ❌                                      |
| Data fetching                        | ❌      | ✅ (use query hooks)                    |
| Form logic / validation              | ❌      | ✅ (useForm)                            |
| Local toggle / UI state              | ❌      | ✅ (useState / custom hook)             |
| Debounce / throttle logic            | ❌      | ✅ (useDebounce)                        |

### Project note

- This repo uses an admin layout/guard HOC (`withLayout`) for access control and layout composition.
- Use HOCs when the concern is cross-cutting and page-level (auth, roles, route wrapper behavior).
- Prefer hooks for local reusable logic.

---

## 6. Provider Pattern (Beyond Basic Context)

Providers inject app-wide dependencies and services into the component tree without prop drilling.

### Common Providers in This App

| Provider          | Purpose                 | Location |
| ----------------- | ----------------------- | -------- |
| `ApolloProvider`  | GraphQL client + cache  | App root |
| `AuthProvider`    | Session / user state    | App root |
| `CartProvider`    | Cart state + operations | App root |
| `ThemeProvider`   | Theme configuration     | App root |
| `LicenseProvider` | License/feature flags   | App root |

### Implementation Pattern

```tsx
// filepath: features/cart/CartProvider.tsx
'use client';

import { createContext, useContext, useReducer, useMemo } from 'react';
import type { CartItem, CartAction } from './types';
import { cartReducer, initialCartState } from './cartReducer';

type CartContextValue = {
  items: CartItem[];
  total: number;
  itemCount: number;
  dispatch: React.Dispatch<CartAction>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialCartState);

  const value = useMemo<CartContextValue>(
    () => ({
      items: state.items,
      total: state.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      itemCount: state.items.length,
      dispatch,
    }),
    [state.items],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
```

### Provider Composition at App Root

```tsx
// filepath: app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ApolloProvider>
          <AuthProvider>
            <CartProvider>
              <ThemeProvider>{children}</ThemeProvider>
            </CartProvider>
          </AuthProvider>
        </ApolloProvider>
      </body>
    </html>
  );
}
```

### Provider Rules

| Rule                                      | Why                                                                |
| ----------------------------------------- | ------------------------------------------------------------------ |
| Keep provider responsibilities narrow     | One concern per provider — don't mix auth + cart + theme           |
| Memoize context values                    | Prevents all consumers from re-rendering on every parent render    |
| Provide a custom hook with error boundary | `useCart()` with a clear error message instead of raw `useContext` |
| Don't use providers for local state       | If only one component needs the state, use `useState`              |
| Compose at app boundaries                 | Root layout, not nested inside feature components                  |

---

## 7. State Machine Pattern

State machines (or reducer-driven finite states) help prevent impossible UI states by making transitions explicit.

### Problem — Scattered Booleans

```tsx
// ❌ BAD — multiple booleans create impossible combinations
const [isLoading, setIsLoading] = useState(false);
const [isError, setIsError] = useState(false);
const [isSuccess, setIsSuccess] = useState(false);
const [data, setData] = useState(null);

// Is it possible to have isLoading AND isSuccess both true? Yes. That's a bug.
```

### Solution — Explicit Status Enum

```tsx
// ✅ GOOD — discriminated union makes impossible states impossible
type AsyncState<T> = { status: 'idle' } | { status: 'loading' } | { status: 'success'; data: T } | { status: 'error'; error: string };

function useAsync<T>() {
  const [state, setState] = useState<AsyncState<T>>({ status: 'idle' });

  const run = async (promise: Promise<T>) => {
    setState({ status: 'loading' });
    try {
      const data = await promise;
      setState({ status: 'success', data });
    } catch (e) {
      setState({ status: 'error', error: e instanceof Error ? e.message : 'Unknown error' });
    }
  };

  return { state, run };
}
```

### State Machine with `useReducer`

```tsx
// filepath: features/checkout/checkoutReducer.ts
type CheckoutState = { step: 'shipping'; formData: Partial<ShippingData> } | { step: 'payment'; shipping: ShippingData; formData: Partial<PaymentData> } | { step: 'review'; shipping: ShippingData; payment: PaymentData } | { step: 'processing' } | { step: 'success'; orderId: string } | { step: 'error'; message: string };

type CheckoutAction = { type: 'SUBMIT_SHIPPING'; data: ShippingData } | { type: 'SUBMIT_PAYMENT'; data: PaymentData } | { type: 'CONFIRM_ORDER' } | { type: 'ORDER_SUCCESS'; orderId: string } | { type: 'ORDER_ERROR'; message: string } | { type: 'GO_BACK' };

function checkoutReducer(state: CheckoutState, action: CheckoutAction): CheckoutState {
  switch (action.type) {
    case 'SUBMIT_SHIPPING':
      return { step: 'payment', shipping: action.data, formData: {} };
    case 'SUBMIT_PAYMENT':
      if (state.step !== 'payment') return state;
      return { step: 'review', shipping: state.shipping, payment: action.data };
    case 'CONFIRM_ORDER':
      return { step: 'processing' };
    case 'ORDER_SUCCESS':
      return { step: 'success', orderId: action.orderId };
    case 'ORDER_ERROR':
      return { step: 'error', message: action.message };
    case 'GO_BACK':
      // Only allow going back from specific steps
      if (state.step === 'payment') return { step: 'shipping', formData: state.shipping };
      if (state.step === 'review') return { step: 'payment', shipping: state.shipping, formData: state.payment };
      return state;
    default:
      return state;
  }
}
```

### Where State Machines Help Most

| Use case                                | Why state machine works                           |
| --------------------------------------- | ------------------------------------------------- |
| Multi-step forms / wizards              | Clear step transitions, back/forward logic        |
| Payment / checkout flows                | Processing state prevents double-submit           |
| Authentication flows                    | Loading → authenticated / unauthenticated / error |
| Complex async UI with retries           | Retry logic depends on current state              |
| Modal/drawer systems with nested states | Open → confirming → closing transitions           |
| Optimistic UI updates                   | Optimistic → confirming → confirmed / rolled-back |

---

## 8. Headless Component Pattern

Headless components provide logic/behavior without enforcing styling. You own the UI; the library owns the interaction.

### Used by Libraries

| Library        | What it provides                                         | You provide                 |
| -------------- | -------------------------------------------------------- | --------------------------- |
| Radix UI       | Accessible behavior, focus management, keyboard handling | All styling and layout      |
| TanStack Table | Sorting, filtering, pagination state                     | Table HTML and styling      |
| Downshift      | Combobox/autocomplete interaction logic                  | Input, menu, item rendering |
| React Aria     | ARIA-compliant interaction primitives                    | Full UI implementation      |

### Example

```tsx
// Using Downshift (headless autocomplete)
function ProductSearch() {
  const { getInputProps, getMenuProps, getItemProps, isOpen, highlightedIndex, inputValue } = useCombobox({
    items: products.filter((p) => p.name.includes(inputValue)),
    onSelectedItemChange: ({ selectedItem }) => {
      router.push(`/product/${selectedItem.slug}`);
    },
  });

  return (
    <div className="relative">
      <input {...getInputProps()} className="w-full rounded border px-3 py-2" />
      {isOpen && (
        <ul {...getMenuProps()} className="absolute z-10 w-full rounded border bg-white shadow">
          {filteredItems.map((item, index) => (
            <li key={item.id} {...getItemProps({ item, index })} className={highlightedIndex === index ? 'bg-blue-100' : ''}>
              {item.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### When to Use

| Use when                                           | Avoid when                                                 |
| -------------------------------------------------- | ---------------------------------------------------------- |
| Need full visual control over interaction-heavy UI | A styled component library already matches your design     |
| Building a design system with custom styling       | Quick prototyping where pre-styled components are faster   |
| Need accessible behavior without style lock-in     | Simple interactions that don't need library-level handling |

---

## 9. Colocation Pattern (Feature-First Organization)

Colocate files by feature, not by file type.

### ❌ Avoid (type-based folders only)

```txt
components/
  ProductCard.tsx
  CartSummary.tsx
  AuthForm.tsx
hooks/
  useProducts.ts
  useCart.ts
  useAuth.ts
types/
  product.ts
  cart.ts
  auth.ts
```

**Problems:** Navigating between related files requires jumping across multiple directories. Ownership boundaries are unclear. Deleting a feature means hunting through every folder.

### ✅ Prefer (feature-based)

```txt
features/
  auth/
    AuthProvider.tsx
    useAuth.ts
    AuthForm.tsx
    types.ts
    utils.ts
  cart/
    CartProvider.tsx
    useCart.ts
    CartSummary.tsx
    cartReducer.ts
    types.ts
  products/
    useProducts.ts
    ProductCard.tsx
    ProductGrid.tsx
    types.ts
```

### Colocation Decision Guide

| File type                                 | Where to place                         |
| ----------------------------------------- | -------------------------------------- |
| Feature-specific hook                     | `features/<feature>/useX.ts`           |
| Feature-specific component                | `features/<feature>/ComponentName.tsx` |
| Feature-specific types                    | `features/<feature>/types.ts`          |
| Shared UI component (Button, Modal, Card) | `libs/ui/components/`                  |
| Shared hook used by 3+ features           | `libs/hooks/`                          |
| Shared type used across features          | `libs/types/`                          |
| Shared utility used across features       | `libs/utils/`                          |

### Why it scales better

| Benefit                  | Description                                       |
| ------------------------ | ------------------------------------------------- |
| **Easier navigation**    | All related files are in one directory            |
| **Better encapsulation** | Feature changes don't touch unrelated directories |
| **Cleaner ownership**    | One team/developer owns one feature directory     |
| **Safer deletion**       | Remove one directory to remove one feature        |
| **Monorepo friendly**    | Maps naturally to `libs/features/src/<feature>/`  |

### Project note

- This repo already leans toward feature modules (`libs/features/src/...`).
- Continue colocating hooks, types, and helpers with the feature that owns them.

---

## 10. Atomic Design Pattern

Atomic design is a UI architecture approach that organizes components by complexity level.

### Layers

| Level         | Description                     | Example                                                       |
| ------------- | ------------------------------- | ------------------------------------------------------------- |
| **Atoms**     | Smallest UI primitives          | Button, Input, Icon, Badge                                    |
| **Molecules** | Small groups of atoms           | SearchBar (input + button), FormField (label + input + error) |
| **Organisms** | Complex UI sections             | Navbar, ProductCard, CartSummary                              |
| **Templates** | Page-level layout structure     | DashboardLayout, CheckoutLayout                               |
| **Pages**     | Templates filled with real data | `/dashboard`, `/checkout`                                     |

### When it helps

- Shared design systems with many components
- Large UI libraries maintained by a dedicated design-system team
- Teams that need strong naming consistency and vocabulary

### When to skip

- Feature-based organization is clearer for your project size
- Team is small and moves fast — atomic layers add overhead
- Components don't naturally fit the hierarchy

> **This project's recommendation:** Use feature-based colocation as the primary organization. Apply atomic naming only within `libs/ui/` for truly shared, design-system-level components.

---

## 11. Server State Pattern (Apollo / TanStack Query Style)

Server state is **not** the same as local UI state. It lives on the server, can be stale, and should be managed by a dedicated caching layer.

### ❌ Avoid — Manual async state everywhere

```tsx
// Every component that fetches data repeats this pattern
function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchProducts()
      .then(setProducts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Problems:
  // - No caching (refetches every mount)
  // - No deduplication (two components = two requests)
  // - No background revalidation
  // - Manual loading/error state management
  // - No invalidation after mutations
}
```

### ✅ Prefer — Data hooks with caching

```tsx
// Apollo (GraphQL) — this project's primary pattern
import { useQuery } from '@apollo/client';
import { GET_PRODUCTS } from '~/graphql/queries/Product';

function ProductList() {
  const { data, loading, error } = useQuery(GET_PRODUCTS, {
    fetchPolicy: 'cache-and-network',
  });

  if (loading) return <ProductListSkeleton />;
  if (error) return <ErrorState message="Failed to load products" />;
  if (!data?.products?.length) return <EmptyState message="No products found" />;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {data.products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

```tsx
// TanStack Query (REST) — for non-GraphQL endpoints
const { data, isLoading, error } = useQuery({
  queryKey: ['products', filters],
  queryFn: () => fetchProducts(filters),
  staleTime: 60_000,
});
```

### Server State vs Client State

| Aspect                 | Server state                               | Client state                                        |
| ---------------------- | ------------------------------------------ | --------------------------------------------------- |
| **Source of truth**    | Server/database                            | Browser/component                                   |
| **Managed by**         | Query cache (Apollo / TanStack)            | `useState` / `useReducer`                           |
| **Examples**           | Products, orders, user profile, categories | Selected tab, modal open, form inputs, search query |
| **Can be stale**       | ✅ Yes — another user might change it      | ❌ No — you own it completely                       |
| **Needs caching**      | ✅ Yes — avoid redundant network requests  | ❌ No — component manages directly                  |
| **Needs invalidation** | ✅ Yes — after mutations                   | ❌ No                                               |

### Project note

- This app uses generated Apollo query hooks for GraphQL data.
- Prefer extending that pattern rather than adding ad-hoc `useEffect` + `useState` fetch logic.
- See `CACHING.md` for detailed caching strategies.

### Mutation Safety — Disable In-Flight Actions (Prevent Double-Fire)

**Any** control that triggers a mutation must be disabled while that mutation is pending — submit button, icon button, table row action, dropdown/menu item, dialog confirm, toolbar action, link styled as an action. If it stays enabled, a fast second activation fires the mutation twice: duplicate writes, duplicate toasts, and races on cache invalidation. This is not a forms-only or dropdown-only rule; it is the default for every mutation-triggering control.

Apply it the same way everywhere, with two layers:

1. **Disable the control** on `mutation.isPending` so it can't be re-activated.
2. **Guard the handler** with `if (mutation.isPending) return;` for re-entry the `disabled` prop can't catch (keyboard activation, programmatic calls, or a control that re-enables itself between renders).

#### ✅ The pattern (applies to every mutation control)

```tsx
const saveMutation = useSaveSomethingMutation();

async function handleSave(input: SaveInput) {
  if (saveMutation.isPending) return; // 1. re-entry guard

  try {
    await saveMutation.mutateAsync(input);
    await queryClient.invalidateQueries({ queryKey: somethingKeys.all });
    toast.success('Saved');
  } catch (error) {
    toast.error(explainGraphqlErrorMessage(/* … */));
  }
}

// 2. disable + pending feedback
<Button disabled={saveMutation.isPending} onClick={() => void handleSave(input)}>
  {saveMutation.isPending ? 'Saving…' : 'Save'}
</Button>;
```

The exact same `disabled={mutation.isPending}` + handler guard applies regardless of the control — a `DropdownMenuItem`, an `AlertDialogAction`, an icon button, or a row action:

```tsx
<DropdownMenuItem
  disabled={rejectMutation.isPending}
  onSelect={() => void handleReject(row)}
>
  Reject
</DropdownMenuItem>;
```

> **Watch the surfaces that dismiss on activation** (dropdown/menu item, popover, dialog action). They feel one-shot because the surface closes — but reopening it while the request is in flight re-enables the control. They need the guard just as much as a persistent button.

#### Rules

| Rule | Why |
| --- | --- |
| Bind `disabled` to `mutation.isPending` on every control that calls `mutate`/`mutateAsync` | A disabled control can't be re-activated — the first line of defense |
| Add `if (mutation.isPending) return;` at the top of the handler | Belt-and-suspenders for re-entry the `disabled` prop misses (keyboard, programmatic, surfaces that re-enable) |
| Scope per-row state with `mutation.variables` when one hook drives many rows | `mutation.variables?.id === row.id && mutation.isPending` disables only the in-flight row, not the whole table |
| Show pending feedback (spinner, "Saving…", `LoadingChip`) with the disabled state | A control that just goes dead reads as broken; tell the user it's working |
| Forms: `disabled={form.formState.isSubmitting || mutation.isPending}` | Same double-submit class of bug, on forms |

---

## 12. Suspense Pattern (Concurrent React / App Router)

Suspense defines loading boundaries for async operations and enables streaming in App Router.

### Basic Usage

```tsx
import { Suspense } from 'react';

// Parent defines the loading boundary
function ProductPage({ productId }: { productId: string }) {
  return (
    <div>
      <h1>Product Details</h1>
      <Suspense fallback={<ProductDetailSkeleton />}>
        <ProductDetail productId={productId} />
      </Suspense>
      <Suspense fallback={<ReviewsSkeleton />}>
        <ProductReviews productId={productId} />
      </Suspense>
    </div>
  );
}
```

### App Router — Server Component Streaming

```tsx
// filepath: app/products/[id]/page.tsx (Server Component)
import { Suspense } from 'react';

export default async function ProductPage({ params }: { params: { id: string } }) {
  // This data loads first (blocks render)
  const product = await fetchProduct(params.id);

  return (
    <article>
      <h1>{product.name}</h1>
      <p>{product.description}</p>

      {/* Reviews stream in after initial HTML — no blocking */}
      <Suspense fallback={<ReviewsSkeleton />}>
        <ProductReviews productId={params.id} />
      </Suspense>
    </article>
  );
}
```

### Suspense + Code Splitting

```tsx
import dynamic from 'next/dynamic';

// Heavy component loaded on demand with a loading boundary
const RichTextEditor = dynamic(() => import('./RichTextEditor'), {
  loading: () => <EditorSkeleton />,
  ssr: false,
});
```

### Hydration Safety Rules (Next.js App Router)

| Rule                                                                                | Why                                                              |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Keep server-rendered and client first-render markup identical                       | Mismatches cause hydration errors and visual flicker             |
| Don't render `Date.now()`, `Math.random()`, or `window`-dependent values during SSR | These differ between server and client                           |
| Use `useEffect` for client-only behavior                                            | Runs only after hydration is complete                            |
| Use mount flags for client-only rendering differences                               | `const [mounted, setMounted] = useState(false)`                  |
| Prefer `Suspense` boundaries over `dynamic({ ssr: false })`                         | Suspense is the standard mechanism; `ssr: false` is a workaround |

### Project note

- In Next.js App Router, be careful with hydration mismatches.
- Ensure server-rendered and client-rendered markup stays stable during hydration.
- See `REGRESSION.md` §4 for hydration-safe rendering standards.

---

## 13. Inversion of Control Pattern

Let consumers provide behavior or rendering details instead of hardcoding them inside the component.

### Callbacks (Most Common)

```tsx
// Component accepts behavior via callbacks
<Modal onClose={handleClose} onConfirm={handleConfirm} />
<DataTable onRowClick={handleRowClick} onSort={handleSort} />
```

### Render Functions (Flexible Rendering)

```tsx
// Consumer controls how items render
<Dropdown
  items={categories}
  renderItem={(item) => (
    <div className="flex items-center gap-2">
      <CategoryIcon category={item.type} />
      <span>{item.name}</span>
      <Badge>{item.count}</Badge>
    </div>
  )}
/>
```

### Children as Configuration

```tsx
// Consumer controls the layout
<FormSection title="Shipping Address">
  <AddressFields />
  <ShippingMethodSelector />
</FormSection>
```

### When to Use IoC

| Use when                                                 | Avoid when                               |
| -------------------------------------------------------- | ---------------------------------------- |
| Component is shared across features with different needs | Component has one fixed behavior         |
| Rendering varies per consumer                            | Adding flexibility that no consumer uses |
| Library/design-system component                          | Feature-specific component               |
| Need to avoid tight coupling                             | Simple component with clear props        |

---

## Pattern Selection Decision Framework

### Quick Decision Tree

```
What kind of problem are you solving?

Reusable logic inside components?
  → Custom Hook

App-wide dependency/service?
  → Provider Pattern

Page wrapper / auth gate / layout?
  → HOC

Flexible subcomponent API in shared UI?
  → Compound Component

Complex state transitions with many actions?
  → State Machine (useReducer)

Reusable logic with no styling opinion?
  → Headless Component Pattern

Server data with caching needs?
  → Server State Pattern (Apollo / TanStack Query)

Configurable rendering for shared component?
  → Inversion of Control (render function / callback)
```

### Pattern Combination Examples

Real features often combine multiple patterns:

| Feature             | Patterns Used                                              |
| ------------------- | ---------------------------------------------------------- |
| Checkout flow       | State machine + Provider + Server state + Controlled forms |
| Product listing     | Server state (Apollo) + Custom hook + Colocation           |
| Admin dashboard     | HOC (auth guard) + Server state + Suspense boundaries      |
| Cart                | Provider + Reducer + Server state (mutations)              |
| Design system Modal | Compound component + Headless behavior + IoC               |
| Search with filters | Custom hook + Controlled input + Server state              |

---

## Anti-Patterns to Avoid

| Anti-Pattern                                    | Why It's Harmful                                 | Better Approach                                |
| ----------------------------------------------- | ------------------------------------------------ | ---------------------------------------------- |
| Repeating `useEffect` + `useState` fetch logic  | Duplicated error/loading handling, no caching    | Use query hooks (Apollo / TanStack)            |
| Over-abstracting early                          | Creates indirection before complexity exists     | Start simple, abstract when repetition is real |
| Global utility dump                             | `utils/` becomes a junk drawer                   | Colocate with the owning feature               |
| HOC for local logic                             | Adds wrapper component overhead unnecessarily    | Use a custom hook                              |
| Mixing server and client state in one structure | Unclear source of truth, stale data bugs         | Separate into query cache + component state    |
| `React.memo` on everything                      | Runtime cost of comparison, false safety feeling | Profile first, memo what matters               |
| Deeply nested prop drilling (>3 levels)         | Hard to trace data flow, brittle changes         | Use a provider or custom hook                  |
| Hydration-unstable UI                           | Console errors, visual flicker, SEO issues       | Follow hydration safety rules                  |
| `useState` for derived values                   | Creates sync bugs and extra re-renders           | Compute inline or `useMemo`                    |
| Multiple `useState` for related state           | Impossible state combinations                    | `useReducer` with explicit states              |
| Mutation-triggering action left enabled while pending | Double-fires the mutation (duplicate writes, races) on fast re-click or menu reopen | Disable on `mutation.isPending` **and** guard the handler with `if (mutation.isPending) return;` |

---

## Summary

React patterns are tools, not rules. The best pattern is the one that:

1. **Solves a real problem** — not a hypothetical future problem.
2. **Matches the scale of the feature** — simple features need simple patterns.
3. **Fits the existing codebase conventions** — consistency beats novelty.
4. **Keeps components easier to reason about** — if the pattern adds more confusion than it removes, it's the wrong pattern.

> **Final principle:** Patterns are tools, not goals. Choose the pattern that improves clarity, maintains consistency with this repo, and reduces future maintenance cost.

---

## Inline Editing Over Page Navigation

Prefer modals, drawers, and inline editing for resource creation and editing. Do not navigate to a separate page for CRUD operations unless the form complexity justifies a dedicated view.

**Why:** Maintains user context and scroll position, reduces navigation overhead, and keeps the user in the flow of the task.

### Requirements

- Modals and drawers must be responsive and accessible on all screen sizes.
- Include a visible, accessible close control.
- Lock body scroll when a modal/drawer is open.
- Support keyboard interaction (Escape to close, focus trapping).
- Fit within the mobile viewport with internal scroll if content overflows.

### When a Separate Page Is Acceptable

- Multi-step forms with 4+ distinct screens.
- Forms with heavy media uploads or embedded editors.
- Workflows that require deep URL sharing (e.g., `/settings/billing`).

---

## Component Discovery and Reuse

Before building a custom component, check in this order:

1. **Project component registries** — existing shared UI in `components/` or feature-level `components/`.
2. **MCP (Model Context Protocol)** — discover and implement components from maintained registries.
3. **shadcn/ui** — if the project uses it, prefer adding a shadcn component over a custom build.

Build custom components only when no existing option fits. Redundant components create inconsistency and maintenance burden.

### When Custom Components Are Justified

- No existing component covers the interaction pattern.
- Adapting an existing component would break other consumers.
- The component is feature-specific and not intended for reuse.

---

## Form Field Structure

Use `Field` wrappers consistently across all forms. Do not use plain `<label>` directly inside form blocks.

### Structure

```tsx
<Field.Root invalid={!!form.formState.errors.firstName}>
  <Field.Label htmlFor="first-name">First name</Field.Label>

  <Controller
    control={form.control}
    name="firstName"
    render={({ field }) => (
      <Input
        value={field.value ?? ''}
        onChange={field.onChange}
        inputProps={{
          id: 'first-name',
          name: field.name,
          onBlur: field.onBlur,
        }}
      />
    )}
  />

  <Field.ErrorText>{form.formState.errors.firstName?.message}</Field.ErrorText>
</Field.Root>
```

### Rules

| Rule | Detail |
| --- | --- |
| Wrap each form control in `Field.Root` | Required for consistent error/invalid state wiring |
| Use `Field.Label`, not `<label>` | Ensures label association goes through the design system |
| Set `invalid` on `Field.Root` from form error state | `invalid={!!form.formState.errors.fieldName}` |
| Render `Field.ErrorText` only when an error message exists | Avoid empty error nodes in the DOM |
| Align `Field.Label htmlFor` with input `id` | Accessibility requirement |

Applies to `Input`, `DebounceInput`, `Textarea`, and any other field control used in forms.

---

## Related References

- `references/state-management.md` — decision guide for which state tool a pattern should use
- `references/react-hooks.md` — memoization discipline inside these patterns
- `references/reducer-context.md` — scaling the Provider pattern with reducers and split contexts
- `references/folder-structure.md` — where pattern code lives in the feature tree
