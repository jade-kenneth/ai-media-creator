# useReducer + Context API

## Table of Contents

1. [When to Use It](#when-to-use-it)
2. [When NOT to Use It](#when-not-to-use-it)
3. [Architecture Decision Guide](#architecture-decision-guide)
4. [Implementation Pattern](#implementation-pattern)
5. [Performance Optimization — Split Contexts](#performance-optimization--split-contexts)
6. [Scaling Limits — When to Move Beyond](#scaling-limits--when-to-move-beyond)
7. [Common Mistakes](#common-mistakes)
8. [Quick Decision Rule](#quick-decision-rule)

---

## When to Use It

Use `useReducer` + Context when **all** of these are true:

| Condition | Why it matters |
| --- | --- |
| State is shared across multiple components | Context eliminates prop drilling |
| The state logic is complex (many actions, related fields) | Reducer centralizes transition logic |
| Updates happen through different actions | Dispatcher provides a structured update API |
| State changes need to be predictable and traceable | Dispatched actions are easy to log and debug |
| Prop drilling is 3+ levels deep | Context shortens the data path |

**In one sentence:** Use it when the state is no longer just "a value" but something with **rules** and **many ways to change**, and it needs to be **shared**.

### Concrete Examples

| Feature | State it manages | Why useReducer + Context |
| --- | --- | --- |
| Shopping cart | items, quantities, totals, promo codes | Multiple components (header badge, cart page, checkout) read/write cart state with add/remove/update/clear actions |
| Multi-step form wizard | current step, form data per step, validation errors | Step navigation, validation, back/forward shared across step components |
| Notification system | notifications array, read/unread status | Header badge, notification drawer, individual dismissals all need access |
| Theme + user preferences | theme, language, accessibility settings | Deeply nested components need to read; settings page needs to write |
| Dashboard filter panel | date range, filters, sort, view mode | Filter sidebar, chart components, data table all react to filter changes |

---

## When NOT to Use It

| Situation | Why not | What to use instead |
| --- | --- | --- |
| State is only needed in one component | No sharing needed — Context adds overhead | `useState` or `useReducer` alone |
| State is simple (1–2 independent values) | Reducer is overkill, Context is unnecessary | `useState` |
| A few `useState` calls are already enough | Adding reducer + context makes code heavier than the problem | Keep `useState` |
| The shared value changes very frequently (e.g., mouse position, scroll, typing) | Context triggers re-renders in **all** consumers on every change | `useRef` + event subscription, Zustand, or Jotai |
| State is very large or global across the entire app | Context re-render scope becomes hard to control | Zustand, Redux Toolkit, or Jotai |
| The state is server/API data | Should be managed by a caching layer, not manual state | Apollo Client, TanStack Query |

### Re-render Risk Explained

Context re-renders **every consumer** when the context value changes — even if the specific field a consumer reads didn't change:

```tsx
// ❌ PROBLEM — typing in search re-renders CartBadge even though it only reads itemCount
const AppContext = createContext({ search: '', itemCount: 0, dispatch: () => {} });

function CartBadge() {
  const { itemCount } = useContext(AppContext); // Re-renders when search changes too
  return <span>{itemCount}</span>;
}
```

**This is the #1 reason to be careful with Context for frequently changing state.**

---

## Architecture Decision Guide

```
Do multiple components need to read/write this state?
├── No → useState or useReducer (local)
├── Yes
│   └── Is the state simple (1-2 values, direct set)?
│       ├── Yes → Context + useState (no reducer needed)
│       └── No (3+ related fields, multiple actions)
│           └── Does the state change very frequently (>5x/sec)?
│               ├── Yes → External store (Zustand/Jotai) or split contexts
│               └── No
│                   └── Is this growing toward app-wide global state?
│                       ├── Yes → Consider Zustand/Redux Toolkit
│                       └── No → useReducer + Context ✅
```

### State Management Spectrum

| Approach | Best for | Complexity | Re-render control |
| --- | --- | --- | --- |
| `useState` | Local, simple, independent | Lowest | N/A (component-local) |
| `useReducer` | Local, complex, multiple actions | Low | N/A (component-local) |
| `Context` + `useState` | Shared, simple, rare updates | Low-Medium | Limited (all consumers re-render) |
| `useReducer` + `Context` | Shared, complex, moderate updates | Medium | Limited (split contexts helps) |
| Zustand | Shared, any complexity, frequent updates | Medium | Good (selector-based subscriptions) |
| Redux Toolkit | Large app, many features, devtools needed | Higher | Good (selector-based) |
| Jotai / Recoil | Atomic shared state, fine-grained updates | Medium | Best (atom-level subscriptions) |

---

## Implementation Pattern

### Step 1: Define State and Actions (TypeScript)

```tsx
// filepath: features/cart/cartTypes.ts
type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  promoCode: string | null;
};

type CartAction =
  | { type: 'ADD_ITEM'; item: Omit<CartItem, 'quantity'> }
  | { type: 'REMOVE_ITEM'; productId: string }
  | { type: 'UPDATE_QUANTITY'; productId: string; quantity: number }
  | { type: 'APPLY_PROMO'; code: string }
  | { type: 'CLEAR' };
```

### Step 2: Implement the Reducer (Pure Function)

```tsx
// filepath: features/cart/cartReducer.ts
const initialCartState: CartState = { items: [], promoCode: null };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find((i) => i.productId === action.item.productId);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.productId === action.item.productId
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }
      return { ...state, items: [...state.items, { ...action.item, quantity: 1 }] };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter((i) => i.productId !== action.productId) };
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map((i) =>
          i.productId === action.productId ? { ...i, quantity: action.quantity } : i
        ),
      };
    case 'APPLY_PROMO':
      return { ...state, promoCode: action.code };
    case 'CLEAR':
      return initialCartState;
    default:
      return state;
  }
}
```

### Step 3: Create Context + Provider

```tsx
// filepath: features/cart/CartProvider.tsx
'use client';

import { createContext, useContext, useReducer, useMemo } from 'react';

type CartContextValue = {
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  // Derived values
  total: number;
  itemCount: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within <CartProvider>');
  return ctx;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialCartState);

  const value = useMemo<CartContextValue>(
    () => ({
      state,
      dispatch,
      total: state.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      itemCount: state.items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    [state]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
```

### Step 4: Consume in Components

```tsx
// filepath: features/cart/CartBadge.tsx
function CartBadge() {
  const { itemCount } = useCart();
  return <span className="badge">{itemCount}</span>;
}

// filepath: features/cart/CartPage.tsx
function CartPage() {
  const { state, dispatch, total } = useCart();

  return (
    <div>
      {state.items.map((item) => (
        <CartItemRow
          key={item.productId}
          item={item}
          onRemove={() => dispatch({ type: 'REMOVE_ITEM', productId: item.productId })}
          onQuantityChange={(qty) =>
            dispatch({ type: 'UPDATE_QUANTITY', productId: item.productId, quantity: qty })
          }
        />
      ))}
      <div>Total: ${total.toFixed(2)}</div>
      <button onClick={() => dispatch({ type: 'CLEAR' })}>Clear Cart</button>
    </div>
  );
}
```

---

## Performance Optimization — Split Contexts

When state changes frequently, split **state** and **dispatch** into separate contexts. Dispatch never changes (stable reference), so dispatch-only consumers won't re-render:

```tsx
const CartStateContext = createContext<CartState | null>(null);
const CartDispatchContext = createContext<React.Dispatch<CartAction> | null>(null);

export function useCartState() {
  const ctx = useContext(CartStateContext);
  if (!ctx) throw new Error('useCartState must be used within <CartProvider>');
  return ctx;
}

export function useCartDispatch() {
  const ctx = useContext(CartDispatchContext);
  if (!ctx) throw new Error('useCartDispatch must be used within <CartProvider>');
  return ctx;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialCartState);

  return (
    <CartDispatchContext.Provider value={dispatch}>
      <CartStateContext.Provider value={state}>
        {children}
      </CartStateContext.Provider>
    </CartDispatchContext.Provider>
  );
}
```

```tsx
// Component that only dispatches — never re-renders when cart state changes
function AddToCartButton({ product }: { product: Product }) {
  const dispatch = useCartDispatch();
  return (
    <button onClick={() => dispatch({ type: 'ADD_ITEM', item: product })}>
      Add to Cart
    </button>
  );
}
```

---

## Scaling Limits — When to Move Beyond

| Signal | What it means | Next step |
| --- | --- | --- |
| 4+ separate Context + Reducer pairs in the app | Provider composition is getting deep | Consider Zustand for shared state |
| Context value changes >5 times per second | Too many consumer re-renders | Move to Zustand/Jotai (selector-based) |
| Need middleware (logging, persistence, undo) | Context has no middleware support | Redux Toolkit or Zustand middleware |
| Need devtools for state debugging | Context has no built-in devtools | Redux DevTools (with Redux Toolkit or Zustand) |
| State is server/API data (products, orders) | Should be cached, invalidated, deduplicated | Apollo Client or TanStack Query |
| Need state persistence across page reloads | Context resets on unmount | Zustand `persist` middleware or localStorage sync |

---

## Common Mistakes

| Mistake | Problem | Fix |
| --- | --- | --- |
| Putting everything in one giant context | Every unrelated state change re-renders all consumers | Split into feature-specific contexts |
| Not memoizing the context value | New object reference every render → all consumers re-render | Wrap value in `useMemo` |
| Using context for frequently changing values | Excessive re-renders across the tree | Use `useRef` + subscriptions or external store |
| Missing the custom hook guard | `useContext` returns `undefined` with no error | Add `if (!ctx) throw new Error(...)` in custom hook |
| Doing async work inside the reducer | Reducer must be pure and synchronous | Dispatch from async handlers outside the reducer |
| Using context for server state (API data) | No caching, deduplication, or background revalidation | Use Apollo Client or TanStack Query |

---

## Quick Decision Rule

### Context helps you **share**. Reducer helps you **manage complexity**.

- If you don't need to share → don't use Context.
- If the state isn't complex → don't use Reducer.
- If you don't need both → don't use both.

### Use `useReducer` + Context when

The app starts needing a **centralized way to handle shared state logic** — but the state scope is not so large that you need a full external state library.

### The sweet spot

```
Too simple ←——————————————————→ Too complex
  useState    useReducer    useReducer     Zustand/Redux
  (local)     (local)       + Context      (global store)
                            ← HERE →

---

## Related References

- `references/reducer.md` — reducer fundamentals this pattern builds on
- `references/zustand-patterns.md` — where to go when the scaling limits here are hit
- `references/react-patterns.md` — § Provider Pattern
