# Proper Usage of `useCallback` and `useMemo` in React

## Table of Contents

1. [Overview](#overview)
2. [`useCallback`](#usecallback)
3. [`useMemo`](#usememo)
4. [Key Differences](#key-differences)
5. [Important Concepts — Why References Matter](#important-concepts--why-references-matter)
6. [Decision Framework](#decision-framework)
7. [Profiling Before Optimizing](#profiling-before-optimizing)
8. [Common Mistakes and Anti-Patterns](#common-mistakes-and-anti-patterns)
9. [Best Practice Guidelines](#best-practice-guidelines)
10. [Quick Reference Table](#quick-reference-table)
11. [Effect Cleanup for Browser Resources](#effect-cleanup-for-browser-resources)

---

## Overview

`useCallback` and `useMemo` are performance optimization hooks in React.

They should **not** be used by default.
They are tools for solving specific re-render or performance problems.

**Core principle:** Start with simple code. Add memoization only when you have a measurable reason.

| Hook          | What it memoizes   | Runtime cost                   | Use when                                     |
| ------------- | ------------------ | ------------------------------ | -------------------------------------------- |
| `useCallback` | Function reference | Low (~0.1–0.3ms per call)      | Stable function identity needed              |
| `useMemo`     | Computed value     | Low-Medium (~0.1–1ms per call) | Expensive computation or reference stability |
| Neither       | Nothing            | Zero overhead                  | Default — most components don't need either  |

> **Rule of thumb:** If you cannot explain which re-render or computation you are preventing, you don't need the hook.

---

## `useCallback`

### What It Does

Memoizes a **function reference** so it does not get recreated on every render. Returns the same function object between renders unless dependencies change.

```tsx
const memoizedFn = useCallback(() => {
  doSomething();
}, [dependencies]);
```

### When to Use `useCallback`

#### 1. When Passing a Function to a `React.memo` Child

This is the **primary** use case. Without `useCallback`, the function reference changes every render, defeating `React.memo`.

```tsx
// ✅ GOOD — useCallback stabilizes the handler for the memoized child
const Child = React.memo(({ onClick }: { onClick: () => void }) => {
  console.log('Child rendered');
  return <button onClick={onClick}>Click</button>;
});

const Parent = () => {
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []);

  return <Child onClick={handleClick} />;
};
```

```tsx
// ❌ BAD — no useCallback, Child re-renders every time Parent re-renders
const Parent = () => {
  const handleClick = () => {
    console.log('clicked');
  };

  // handleClick is a new reference every render → React.memo is useless
  return <Child onClick={handleClick} />;
};
```

**Why it matters:** `React.memo` compares props by reference. A new function reference (even if identical in behavior) is `!==` the previous one, so `React.memo` sees a "changed" prop and re-renders.

#### 2. When a Function Is in a Dependency Array

If a function is used inside `useEffect`, `useMemo`, or another `useCallback`, it must have a stable reference to avoid re-triggering the dependent hook.

```tsx
// ✅ GOOD — stable fetchData prevents useEffect from re-running every render
const fetchData = useCallback(async () => {
  const response = await fetch(`/api/items?page=${page}`);
  setItems(await response.json());
}, [page]);

useEffect(() => {
  fetchData();
}, [fetchData]); // Only re-runs when page changes
```

```tsx
// ❌ BAD — fetchData changes every render → useEffect runs every render
const fetchData = async () => {
  const response = await fetch(`/api/items?page=${page}`);
  setItems(await response.json());
};

useEffect(() => {
  fetchData();
}, [fetchData]); // Infinite loop risk or exhaustive-deps lint warning
```

#### 3. When Passed to Third-Party Libraries or Context Consumers

Some libraries and custom context hooks compare function props by reference. If the function changes every render, consumers re-render unnecessarily.

```tsx
// Context value with a stable callback
const AuthContext = createContext<{ logout: () => void } | null>(null);

function AuthProvider({ children }: { children: React.ReactNode }) {
  const logout = useCallback(() => {
    clearSession();
    router.push('/login');
  }, [router]);

  // Without useCallback, every consumer of AuthContext re-renders on every AuthProvider render
  return (
    <AuthContext.Provider value={{ logout }}>{children}</AuthContext.Provider>
  );
}
```

#### 4. In Large Component Trees with Frequent Re-renders

When a parent re-renders often (e.g., due to typing in an input) and passes handlers to deeply nested memoized children.

```tsx
// ✅ GOOD — prevents re-rendering the expensive list on every keystroke
function SearchPage() {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Item[]>([]);

  const handleDelete = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <MemoizedItemList items={items} onDelete={handleDelete} />
    </>
  );
}

const MemoizedItemList = React.memo(ItemList);
```

### When NOT to Use `useCallback`

| Situation                                          | Why not                                                           |
| -------------------------------------------------- | ----------------------------------------------------------------- |
| Function is not passed to memoized children        | No reference comparison occurs — memoizing is wasted work         |
| Small component with simple logic                  | Re-render cost is negligible (~0.1ms) — memoizing costs more      |
| No measured performance issue                      | Premature optimization adds complexity                            |
| "Just because it's best practice"                  | It is **not** best practice by default                            |
| Function is only used in the same component's JSX  | The component re-renders anyway, so stable reference doesn't help |
| Handler is used in `onClick` on a plain `<button>` | Native elements don't use `React.memo`                            |

```tsx
// ❌ UNNECESSARY — no memoized child, no dependency array usage
function SimpleCounter() {
  const [count, setCount] = useState(0);

  // This useCallback does nothing useful
  const increment = useCallback(() => {
    setCount((c) => c + 1);
  }, []);

  return <button onClick={increment}>{count}</button>;
}

// ✅ SIMPLER — same behavior, less complexity
function SimpleCounter() {
  const [count, setCount] = useState(0);

  return <button onClick={() => setCount((c) => c + 1)}>{count}</button>;
}
```

---

## `useMemo`

### What It Does

Memoizes a **computed value**. Returns the cached result between renders unless dependencies change. Avoids recalculating on every render.

```tsx
const memoizedValue = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);
```

### When to Use `useMemo`

#### 1. Expensive Calculations

When computation time is noticeable (>1ms) and the inputs don't change every render.

```tsx
// ✅ GOOD — sorting 1000+ items is expensive, memoize it
const sortedItems = useMemo(() => {
  return [...items].sort((a, b) => a.price - b.price);
}, [items]);
```

```tsx
// ❌ UNNECESSARY — simple expression, not expensive
const isDisabled = useMemo(() => items.length === 0, [items]);

// ✅ SIMPLER
const isDisabled = items.length === 0;
```

**Rough cost guide for when `useMemo` helps:**

| Operation                                               | Typical cost | Worth memoizing? |
| ------------------------------------------------------- | ------------ | ---------------- |
| Array `.sort()` on 1000+ items                          | 1–5ms        | ✅ Yes           |
| Array `.filter()` on 1000+ items with complex predicate | 1–3ms        | ✅ Yes           |
| `.reduce()` aggregation on large datasets               | 1–10ms       | ✅ Yes           |
| Object spread / shallow merge                           | <0.01ms      | ❌ No            |
| Simple boolean expression                               | <0.01ms      | ❌ No            |
| String concatenation / template literal                 | <0.01ms      | ❌ No            |
| `Array.map()` on 10–50 items                            | <0.1ms       | ❌ No            |
| Building a tree structure from flat data                | 2–20ms       | ✅ Yes           |
| JSON serialization of large objects                     | 1–10ms       | ✅ Yes           |

#### 2. Preventing Object/Array Reference Changes for Memoized Children

Objects and arrays are new references every render, even if their content is identical. This breaks `React.memo` prop comparison.

```tsx
// ✅ GOOD — stable reference prevents MemoizedChart from re-rendering
const chartConfig = useMemo(
  () => ({
    theme: 'dark',
    layout: 'grid',
    showLabels: true,
  }),
  [],
);

return <MemoizedChart config={chartConfig} />;
```

```tsx
// ❌ BAD — new object every render, React.memo cannot help
return (
  <MemoizedChart config={{ theme: 'dark', layout: 'grid', showLabels: true }} />
);
```

#### 3. Derived State from Server Data

When you transform query results into a shape the UI needs, and the transformation is non-trivial.

```tsx
// ✅ GOOD — avoid re-filtering on every render
const filteredProducts = useMemo(() => {
  return products.filter((p) => p.inStock && p.category === selectedCategory);
}, [products, selectedCategory]);

const groupedByBrand = useMemo(() => {
  return filteredProducts.reduce<Record<string, Product[]>>((acc, product) => {
    const brand = product.brand ?? 'Unknown';
    (acc[brand] ??= []).push(product);
    return acc;
  }, {});
}, [filteredProducts]);
```

#### 4. Stable Context Values

When a context provider's value would cause all consumers to re-render on every parent render.

```tsx
// ✅ GOOD — consumers only re-render when cart items or total actually change
function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const contextValue = useMemo(
    () => ({
      items,
      total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      itemCount: items.length,
    }),
    [items],
  );

  return (
    <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>
  );
}
```

### When NOT to Use `useMemo`

| Situation                                        | Why not                                                   |
| ------------------------------------------------ | --------------------------------------------------------- |
| Cheap calculations (simple math, boolean checks) | Memoization overhead exceeds computation cost             |
| Simple expressions                               | Reads worse and gains nothing                             |
| Without measuring performance impact             | Premature optimization                                    |
| Dependency array changes every render            | `useMemo` recalculates every render anyway — zero benefit |
| Single primitive value derivation                | Primitives compare by value, not reference                |

```tsx
// ❌ UNNECESSARY — these are all cheap
const fullName = useMemo(() => `${first} ${last}`, [first, last]);
const isAdmin = useMemo(() => user?.role === 'admin', [user?.role]);
const hasItems = useMemo(() => cart.length > 0, [cart.length]);

// ✅ SIMPLER
const fullName = `${first} ${last}`;
const isAdmin = user?.role === 'admin';
const hasItems = cart.length > 0;
```

---

## Key Differences

| Aspect                 | `useCallback`                            | `useMemo`                                                    |
| ---------------------- | ---------------------------------------- | ------------------------------------------------------------ |
| **Memoizes**           | Function reference                       | Computed value                                               |
| **Returns**            | The same function object                 | The cached result of the function                            |
| **Primary purpose**    | Stable function identity                 | Avoid expensive recomputation                                |
| **Typical pairing**    | `React.memo` children, dependency arrays | `React.memo` children (object/array props), heavy transforms |
| **Equivalent**         | `useMemo(() => fn, deps)`                | N/A (different shape)                                        |
| **Runs the function?** | No — stores it                           | Yes — executes it and stores the result                      |

### Relationship Between the Two

`useCallback(fn, deps)` is equivalent to `useMemo(() => fn, deps)`.

The difference is ergonomic: `useCallback` is specifically designed for function memoization and avoids the extra wrapper.

---

## Important Concepts — Why References Matter

Understanding **why** these hooks exist requires understanding React's rendering model:

### 1. Functions, Objects, and Arrays Are Recreated Every Render

```tsx
function MyComponent() {
  // ALL of these are new references every render:
  const handler = () => {}; // new Function
  const config = { theme: 'dark' }; // new Object
  const items = [1, 2, 3]; // new Array

  // Even though the VALUES are identical, the REFERENCES are different
  // handler !== previousHandler (from last render)
  // config !== previousConfig
  // items !== previousItems
}
```

### 2. React Compares Props by Reference (Shallow Comparison)

```tsx
// React.memo does this internally:
function shallowEqual(prevProps, nextProps) {
  for (const key in prevProps) {
    if (prevProps[key] !== nextProps[key]) {
      return false; // Props "changed" → re-render
    }
  }
  return true; // Props "same" → skip render
}

// {} !== {} → true  (different references)
// [] !== [] → true  (different references)
// fn !== fn → true  (different references)
// 42 === 42 → true  (same value, primitives compare by value)
// 'hello' === 'hello' → true
```

### 3. `React.memo` Only Prevents Re-render If Prop References Stay Stable

```
Without memoization:
  Parent renders → new handler → Child sees "changed" prop → Child re-renders

With useCallback:
  Parent renders → same handler reference → Child sees "same" prop → Child skips render

With useMemo (for objects/arrays):
  Parent renders → same config reference → Child sees "same" prop → Child skips render
```

### 4. Primitives Are Fine Without Memoization

```tsx
// These DON'T need memoization — primitives compare by value
<Child count={42} label="hello" isActive={true} />
// 42 === 42, "hello" === "hello", true === true → React.memo works fine
```

---

## Decision Framework

### For `useCallback` — Decision Tree

```
Is this function passed as a prop to a child component?
├── No → DON'T USE useCallback
├── Yes
│   └── Is that child wrapped in React.memo?
│       ├── No → DON'T USE useCallback (unless you plan to add React.memo)
│       └── Yes → USE useCallback ✅

Is this function in a dependency array (useEffect, useMemo, another useCallback)?
├── No → DON'T USE useCallback
├── Yes
│   └── Does the function's reference change cause unwanted re-execution?
│       ├── No → DON'T USE useCallback
│       └── Yes → USE useCallback ✅

Is this function part of a context value consumed by many components?
├── No → DON'T USE useCallback
├── Yes → USE useCallback ✅
```

### For `useMemo` — Decision Tree

```
Is this computation expensive (>1ms)?
├── Yes → USE useMemo ✅
├── No
│   └── Does this create an object/array passed to a React.memo child?
│       ├── Yes → USE useMemo ✅
│       ├── No
│       │   └── Does this create an object/array used in a dependency array?
│       │       ├── Yes → USE useMemo ✅
│       │       └── No → DON'T USE useMemo
```

---

## Profiling Before Optimizing

### How to Measure If Memoization Is Needed

#### React DevTools Profiler

1. Open React DevTools → Profiler tab
2. Click "Record" → interact with the UI → click "Stop"
3. Look at the flame graph:
   - **Gray components** = did not re-render (good)
   - **Colored components** = re-rendered (check why)
4. Click a component to see:
   - Render duration
   - Why it re-rendered ("Props changed: onClick")

#### Chrome DevTools Performance Tab

1. Open DevTools → Performance tab
2. Record a user interaction
3. Look for long tasks (>50ms) in the main thread
4. Check if React rendering dominates

#### Console Timing

```tsx
// Quick and dirty measurement
const sortedItems = useMemo(() => {
  console.time('sort');
  const result = [...items].sort((a, b) => a.price - b.price);
  console.timeEnd('sort'); // If this shows <1ms, don't bother memoizing
  return result;
}, [items]);
```

### When Profiling Shows Memoization Helps

| Signal                                                                     | Action                                                     |
| -------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Component re-renders >5ms and receives function/object props               | Add `React.memo` + `useCallback`/`useMemo` for those props |
| Profiler shows "Props changed: onClick" as re-render reason                | Wrap the handler in `useCallback`                          |
| Large list re-renders on every keystroke in a search input                 | Memoize list component + stabilize its props               |
| Expensive derived computation shows up in flame graph                      | Wrap in `useMemo`                                          |
| Context consumers re-render when context value hasn't meaningfully changed | Memoize the context value object                           |

---

## Common Mistakes and Anti-Patterns

| Mistake                                                 | Why it's wrong                                                      | Fix                                                        |
| ------------------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------- |
| `useCallback` on every handler "just in case"           | Adds overhead, complexity, and false safety                         | Only add when passed to `React.memo` child or in dep array |
| `useMemo` for cheap expressions like `a + b`            | Memoization cost exceeds computation cost                           | Use plain expression                                       |
| `useCallback` without `React.memo` on child             | Function reference stability doesn't help — child re-renders anyway | Either add `React.memo` to child or remove `useCallback`   |
| Empty dependency array `[]` when deps exist             | Stale closure — function captures initial values forever            | Include all dependencies in the array                      |
| Memoizing inline JSX with `useMemo`                     | Rarely needed and often incorrect                                   | Let React handle JSX reconciliation                        |
| `useMemo` with deps that change every render            | Zero benefit — recalculates every time                              | Stabilize deps first or remove `useMemo`                   |
| Wrapping `setState` in `useCallback`                    | `setState` is already stable (React guarantees this)                | Don't wrap — use `setState` directly                       |
| `useCallback` for event handlers on plain HTML elements | No `React.memo` involved — stable reference doesn't help            | Remove `useCallback`                                       |

```tsx
// ❌ MISTAKE — wrapping setState which is already stable
const setCount = useCallback(
  (n: number) => {
    setState(n);
  },
  [setState],
); // setState never changes — this is pointless

// ❌ MISTAKE — useMemo with deps that change every render
const filtered = useMemo(
  () => items.filter((i) => i.name.includes(query)),
  [items.filter((i) => i.name.includes(query))], // New array in deps = always recalculates
);

// ✅ CORRECT
const filtered = useMemo(
  () => items.filter((i) => i.name.includes(query)),
  [items, query],
);
```

---

## Best Practice Guidelines

1. **Start without `useCallback` and `useMemo`.** Write simple, readable code first.
2. **Optimize only when:**
   - You pass props to `React.memo` components.
   - You have expensive computations confirmed by profiling.
   - Profiling shows unnecessary re-renders causing visible jank.
3. **Pair `useCallback` with `React.memo`.** One without the other is usually pointless.
4. **Keep dependency arrays correct and minimal.** Trust the ESLint `exhaustive-deps` rule.
5. **Prefer `React.memo` on the child** over memoizing every prop in the parent.
6. **Don't memo everything "defensively."** The overhead of memoization is real.
7. **Keep code readable.** If memoization makes the component significantly harder to understand, reconsider.
8. **Measure before and after.** Use React DevTools Profiler to confirm the optimization helps.

---

## Quick Reference Table

| Scenario                                 | `useCallback` | `useMemo`            | `React.memo`   |
| ---------------------------------------- | ------------- | -------------------- | -------------- |
| Handler passed to `React.memo` child     | ✅            | —                    | ✅ (on child)  |
| Object/array prop to `React.memo` child  | —             | ✅                   | ✅ (on child)  |
| Expensive sort/filter/reduce             | —             | ✅                   | —              |
| Function in `useEffect` dependency array | ✅            | —                    | —              |
| Context value object in provider         | —             | ✅                   | —              |
| Context callback in provider             | ✅            | —                    | —              |
| Simple `onClick` on `<button>`           | ❌            | —                    | —              |
| Cheap boolean / string derivation        | —             | ❌                   | —              |
| Inline arrow function not passed down    | ❌            | —                    | —              |
| Large list rendering (1000+ items)       | ✅ (handlers) | ✅ (data transforms) | ✅ (list item) |

---

## `setState` Inside `useEffect` — Infinite Loop Prevention

Calling `setState` inside `useEffect` without correct dependency management causes infinite re-render loops. The state update triggers a re-render, which re-runs the effect, which calls `setState` again.

### The Infinite Loop Pattern

```ts
// ❌ circular dependency — data is both read and written
const [data, setData] = useState([]);
useEffect(() => {
  setData([...data, newItem]);
}, [data]);

// ❌ no dependency array — runs every render
const [count, setCount] = useState(0);
useEffect(() => {
  setCount(count + 1);
});

// ❌ object created every render — new reference triggers effect every time
const filters = { status: 'active', page: 1 };
useEffect(() => {
  fetchItems(filters).then(setItems);
}, [filters]);
```

### Correct Patterns

```ts
// ✅ functional updater breaks the circular dependency
useEffect(() => {
  setData((prev) => [...prev, newItem]);
}, [newItem]);

// ✅ stable primitive dependencies
useEffect(() => {
  fetchItems({ status, page }).then(setItems);
}, [status, page]);

// ✅ stabilize object references with useMemo
const filters = useMemo(() => ({ status: 'active', page: 1 }), []);
useEffect(() => {
  fetchItems(filters).then(setItems);
}, [filters]);
```

### Common Causes

| Cause                                               | Why It Loops                                               | Fix                                            |
| --------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------- |
| `setState(value)` in effect that depends on `value` | Circular: read → write → re-render → read → write          | Use functional updater, remove state from deps |
| No dependency array                                 | Effect runs every render, each `setState` triggers another | Add a dependency array                         |
| Object/array in dependency array                    | New reference every render → effect always sees a "change" | `useMemo`, `useRef`, or use primitive deps     |
| Async fetch + `setState` without cleanup            | Race conditions cause repeated updates                     | Use abort controller or an ignore flag         |

**Rule of thumb:** If `useEffect` both reads and writes the same state variable, it will loop. Use the functional updater (`setState(prev => ...)`) to break the circular dependency.

---

## Effect Cleanup for Browser Resources

Any hook or component that allocates browser resources must own their cleanup. This includes `setTimeout`, `setInterval`, `requestAnimationFrame`, `URL.createObjectURL`, observers, subscriptions, event listeners, and abortable async work.

### Timers

```tsx
// ❌ leaks after unmount if the timeout has not fired
useEffect(() => {
  window.setTimeout(() => {
    setOpen(false);
  }, 1000);
}, []);

// ✅ cleanup cancels the pending timeout
useEffect(() => {
  const timeoutId = window.setTimeout(() => {
    setOpen(false);
  }, 1000);

  return () => window.clearTimeout(timeoutId);
}, []);
```

For callbacks outside `useEffect`, track timer handles in a ref and clear them from an unmount cleanup.

```tsx
const pendingTimersRef = useRef(new Set<number>());

useEffect(() => {
  const pendingTimers = pendingTimersRef.current;

  return () => {
    pendingTimers.forEach((timerId) => window.clearTimeout(timerId));
    pendingTimers.clear();
  };
}, []);

const runLater = useCallback(() => {
  const timerId = window.setTimeout(() => {
    pendingTimersRef.current.delete(timerId);
    doWork();
  }, 1000);

  pendingTimersRef.current.add(timerId);
}, []);
```

### Object URLs

```tsx
// ✅ revoke object URLs after use and on unmount if revocation is delayed
const revokeTimersRef = useRef(new Map<number, string>());

useEffect(() => {
  const revokeTimers = revokeTimersRef.current;

  return () => {
    revokeTimers.forEach((objectUrl, timerId) => {
      window.clearTimeout(timerId);
      URL.revokeObjectURL(objectUrl);
    });
    revokeTimers.clear();
  };
}, []);
```

### Listeners and Observers

```tsx
useEffect(() => {
  const controller = new AbortController();

  window.addEventListener('resize', onResize, {
    signal: controller.signal,
  });

  return () => controller.abort();
}, [onResize]);
```

```tsx
useEffect(() => {
  const observer = new IntersectionObserver(handleEntries);
  observer.observe(node);

  return () => observer.disconnect();
}, [handleEntries, node]);
```

### Review Checklist

- Every `setTimeout` has `clearTimeout`.
- Every `setInterval` has `clearInterval`.
- Every `requestAnimationFrame` has `cancelAnimationFrame`.
- Every delayed `URL.revokeObjectURL` has an unmount fallback.
- Every `addEventListener` is removed or uses an aborted `AbortSignal`.
- Every observer/subscription has `disconnect`, `unsubscribe`, or equivalent cleanup.

---

## Related References

- `references/state-management.md` — choose the right state tool before optimizing it
- `references/reducer.md` — when scattered `useState` + memoization pressure means you need a reducer
- `references/react-patterns.md` — the component patterns these hook rules serve
