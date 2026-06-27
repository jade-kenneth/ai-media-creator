# useReducer Guide

## Table of Contents

1. [When to Use `useReducer`](#use-usereducer-when)
2. [Practical Code Examples](#practical-code-examples)
3. [`useState` vs `useReducer` Decision Table](#usestate-vs-usereducer-decision-table)
4. [When NOT to Use `useReducer`](#when-not-to-use-it)
5. [TypeScript Patterns for Reducers](#typescript-patterns-for-reducers)
6. [Common Mistakes](#common-mistakes)
7. [Practical Decision Rule](#practical-rule)

---

## Use `useReducer` when

### 1. State has multiple related parts

When several values belong to the same flow and should change together, `useReducer` keeps them consistent in a single dispatch.

Example — a form submission flow has:

- form field values
- validation errors per field
- submitting flag
- success or failure result

Instead of many separate `setState` calls that can get out of sync:

```tsx
// ❌ BAD — 4 separate setState calls that can become inconsistent
const [formData, setFormData] = useState({});
const [errors, setErrors] = useState({});
const [isSubmitting, setIsSubmitting] = useState(false);
const [result, setResult] = useState(null);

async function handleSubmit() {
  setIsSubmitting(true);
  setErrors({}); // What if this render happens before the next line?
  try {
    const res = await submitForm(formData);
    setResult(res);
    setIsSubmitting(false); // If this throws, isSubmitting stays true
  } catch (e) {
    setErrors(e.errors);
    setIsSubmitting(false);
  }
}
```

```tsx
// ✅ GOOD — single dispatch guarantees consistent state
function handleSubmit() {
  dispatch({ type: 'SUBMIT_START' });
  submitForm(state.formData)
    .then((res) => dispatch({ type: 'SUBMIT_SUCCESS', payload: res }))
    .catch((e) => dispatch({ type: 'SUBMIT_ERROR', errors: e.errors }));
}
```

### 2. State updates follow clear events or actions

If your UI changes because of specific, named events, reducer style makes the component read like a state machine:

| Action          | State changes                         | Notes                                   |
| --------------- | ------------------------------------- | --------------------------------------- |
| `OPEN_MODAL`    | `isOpen → true`                       | Single field, but part of a larger flow |
| `CLOSE_MODAL`   | `isOpen → false, selectedItem → null` | Resets related state                    |
| `FETCH_START`   | `status → loading, error → null`      | Clears previous error                   |
| `FETCH_SUCCESS` | `status → success, data → payload`    | Sets data                               |
| `FETCH_ERROR`   | `status → error, error → message`     | Sets error                              |
| `NEXT_STEP`     | `step → step + 1, validation → reset` | Multi-step form navigation              |
| `RESET`         | All fields → initial values           | Full reset                              |

### 3. Update logic is getting scattered

**Key signal:** You have many handler functions, and each one updates multiple pieces of state in slightly different ways. That means the logic is no longer "simple state" — it's a set of rules. Reducers centralize rules.

```tsx
// ❌ SCATTERED — logic for state updates is spread across many functions
function handleSelectItem(item) {
  setSelectedItem(item);
  setIsEditing(false);
  setErrors(null);
}
function handleStartEditing() {
  setIsEditing(true);
  setDraft(selectedItem);
}
function handleSave() {
  setIsEditing(false);
  setSelectedItem(draft);
  setDraft(null);
}

// ✅ CENTRALIZED — all transition logic lives in one place
function reducer(state, action) {
  switch (action.type) {
    case 'SELECT_ITEM':
      return {
        ...state,
        selectedItem: action.item,
        isEditing: false,
        errors: null,
      };
    case 'START_EDITING':
      return { ...state, isEditing: true, draft: state.selectedItem };
    case 'SAVE':
      return {
        ...state,
        isEditing: false,
        selectedItem: state.draft,
        draft: null,
      };
    default:
      return state;
  }
}
```

### 4. You want predictable and maintainable transitions

`useReducer` helps when you want:

| Benefit                              | How the reducer provides it                                                               |
| ------------------------------------ | ----------------------------------------------------------------------------------------- |
| **Centralized update logic**         | All state changes in one function                                                         |
| **Easier debugging**                 | Log dispatched actions to trace state changes                                             |
| **No accidental inconsistent state** | Single dispatch updates all related fields atomically                                     |
| **Easier refactoring**               | Add/rename actions without hunting through handlers                                       |
| **Testable logic**                   | Reducer is a pure function — unit test with `expect(reducer(state, action)).toEqual(...)` |

This is especially useful in larger components where future developers need to understand **why** state changes, not just **where**.

### 5. Previous state heavily affects next state

If the next state depends on current state across multiple branches, reducers are cleaner than nesting many functional `setState` updates:

```tsx
// ❌ Awkward nested functional updates
setItems((prev) => {
  const updated = prev.map((item) =>
    item.id === id ? { ...item, quantity: item.quantity + 1 } : item
  );
  if (updated.find((i) => i.id === id)!.quantity > 10) {
    // Now need to also update another state...
    setWarnings((prevWarnings) => [...prevWarnings, `Item ${id} exceeds limit`]);
  }
  return updated;
});

// ✅ Clear in a reducer
case 'INCREMENT_QUANTITY': {
  const updated = state.items.map((item) =>
    item.id === action.id ? { ...item, quantity: item.quantity + 1 } : item
  );
  const warnings = updated
    .filter((i) => i.quantity > 10)
    .map((i) => `Item ${i.id} exceeds limit`);
  return { ...state, items: updated, warnings };
}
```

### 6. Complex local UI flows

Good use cases ranked by complexity:

| Use case                                              | Complexity | Why reducer helps                                  |
| ----------------------------------------------------- | ---------- | -------------------------------------------------- |
| Async request lifecycle (fetch/loading/error/success) | Medium     | 4 related states, clear transitions                |
| Filter/sort/search panels                             | Medium     | Multiple filters interact, reset logic             |
| Multi-step forms / wizards                            | High       | Step navigation, validation per step, back/forward |
| Modal/drawer systems with nested states               | High       | Open → confirming → closing transitions            |
| Optimistic UI updates                                 | High       | Optimistic write → server response → rollback      |
| Editable table / inline editing                       | High       | Edit mode per row, save/cancel per row, validation |
| Drag-and-drop reorder                                 | High       | Dragging state, preview positions, commit/cancel   |

---

## Practical Code Examples

### Async Request Lifecycle

```tsx
type State<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

type Action<T> =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; data: T }
  | { type: 'FETCH_ERROR'; error: string }
  | { type: 'RESET' };

function asyncReducer<T>(state: State<T>, action: Action<T>): State<T> {
  switch (action.type) {
    case 'FETCH_START':
      return { status: 'loading' };
    case 'FETCH_SUCCESS':
      return { status: 'success', data: action.data };
    case 'FETCH_ERROR':
      return { status: 'error', error: action.error };
    case 'RESET':
      return { status: 'idle' };
    default:
      return state;
  }
}

// Usage
const [state, dispatch] = useReducer(asyncReducer<Product[]>, {
  status: 'idle',
});
```

### Multi-Step Form

```tsx
type FormStep = 'info' | 'address' | 'payment' | 'review';

type FormState = {
  step: FormStep;
  info: Partial<InfoData>;
  address: Partial<AddressData>;
  payment: Partial<PaymentData>;
};

type FormAction =
  | { type: 'SET_INFO'; data: InfoData }
  | { type: 'SET_ADDRESS'; data: AddressData }
  | { type: 'SET_PAYMENT'; data: PaymentData }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'RESET' };

const STEP_ORDER: FormStep[] = ['info', 'address', 'payment', 'review'];

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_INFO':
      return { ...state, info: action.data };
    case 'SET_ADDRESS':
      return { ...state, address: action.data };
    case 'SET_PAYMENT':
      return { ...state, payment: action.data };
    case 'NEXT_STEP': {
      const idx = STEP_ORDER.indexOf(state.step);
      if (idx < STEP_ORDER.length - 1)
        return { ...state, step: STEP_ORDER[idx + 1] };
      return state;
    }
    case 'PREV_STEP': {
      const idx = STEP_ORDER.indexOf(state.step);
      if (idx > 0) return { ...state, step: STEP_ORDER[idx - 1] };
      return state;
    }
    case 'RESET':
      return initialFormState;
    default:
      return state;
  }
}
```

### Filter Panel

```tsx
type FilterState = {
  search: string;
  category: string | null;
  priceRange: [number, number];
  sortBy: 'price' | 'name' | 'rating';
  sortOrder: 'ASC' | 'DESC';
};

type FilterAction =
  | { type: 'SET_SEARCH'; value: string }
  | { type: 'SET_CATEGORY'; value: string | null }
  | { type: 'SET_PRICE_RANGE'; value: [number, number] }
  | {
      type: 'SET_SORT';
      sortBy: FilterState['sortBy'];
      sortOrder: FilterState['sortOrder'];
    }
  | { type: 'RESET' };

function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case 'SET_SEARCH':
      return { ...state, search: action.value };
    case 'SET_CATEGORY':
      return { ...state, category: action.value };
    case 'SET_PRICE_RANGE':
      return { ...state, priceRange: action.value };
    case 'SET_SORT':
      return { ...state, sortBy: action.sortBy, sortOrder: action.sortOrder };
    case 'RESET':
      return initialFilterState;
    default:
      return state;
  }
}
```

---

## `useState` vs `useReducer` Decision Table

| Signal                             | `useState`                       | `useReducer`                                  |
| ---------------------------------- | -------------------------------- | --------------------------------------------- |
| **Number of state values**         | 1–2 independent values           | 3+ related values                             |
| **State relationships**            | Independent of each other        | Change together in response to actions        |
| **Update complexity**              | Direct set (e.g., `setCount(5)`) | Conditional logic, multiple fields per action |
| **Number of ways state changes**   | 1–3 simple handlers              | 5+ distinct actions/events                    |
| **Next state depends on previous** | Rare / simple                    | Frequently, across multiple fields            |
| **Testability requirement**        | Low (visual testing)             | High (unit test the reducer function)         |
| **Debugging needs**                | Console.log is enough            | Need to trace action sequences                |
| **Team familiarity**               | Any level                        | Comfortable with action/reducer pattern       |

### Quick Examples: `useState` Is Better

```tsx
// ✅ These are better with useState — simple, independent, direct
const [isOpen, setIsOpen] = useState(false);
const [count, setCount] = useState(0);
const [search, setSearch] = useState('');
const [selectedTab, setSelectedTab] = useState<'info' | 'reviews'>('info');
```

### Quick Examples: `useReducer` Is Better

```tsx
// ✅ These are better with useReducer — related, multiple transitions
// Fetch lifecycle: loading + data + error + status
// Multi-step form: step + formData + validation + submitting
// Filter panel: search + category + priceRange + sort + reset
// Modal system: isOpen + selectedItem + confirmationState
```

---

## When not to use it

Do not use `useReducer` just to look advanced.

**Stick with `useState` when:**

- State is small and independent (single boolean, number, or string)
- Updates are direct assignments, not conditional transitions
- The component is simple and unlikely to grow
- Reducer boilerplate would make the code heavier than the problem

**Telltale sign you over-used `useReducer`:** Your reducer has 2–3 cases and each case just sets one field. That's `useState` with extra steps.

```tsx
// ❌ Over-engineered — useReducer for what useState does better
function reducer(state, action) {
  switch (action.type) {
    case 'SET_OPEN':
      return { ...state, isOpen: action.value };
    default:
      return state;
  }
}

// ✅ Just use useState
const [isOpen, setIsOpen] = useState(false);
```

---

## TypeScript Patterns for Reducers

### Discriminated Union Actions (Recommended)

```tsx
// Always use discriminated unions for actions — never loose objects
type Action =
  | { type: 'INCREMENT' }
  | { type: 'DECREMENT' }
  | { type: 'SET'; value: number }
  | { type: 'RESET' };

// TypeScript narrows the payload automatically in each case
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET':
      return { ...state, count: action.value }; // action.value is typed as number
    // ...
  }
}
```

### Exhaustiveness Check

```tsx
import { assertNever } from '@/utils/assertNever';

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INCREMENT':
      return { ...state, count: state.count + 1 };
    case 'DECREMENT':
      return { ...state, count: state.count - 1 };
    case 'SET':
      return { ...state, count: action.value };
    case 'RESET':
      return initialState;
    default:
      return assertNever(action); // Compile error if a case is missing
  }
}
```

### State as Discriminated Union (for complex flows)

```tsx
// State itself can be a discriminated union — prevents impossible combinations
type FormState =
  | { status: 'idle' }
  | { status: 'editing'; draft: FormData; errors: ValidationErrors }
  | { status: 'submitting'; draft: FormData }
  | { status: 'success'; result: SubmitResult }
  | { status: 'error'; draft: FormData; error: string };

// No more: isSubmitting && hasError (impossible combination)
```

---

## Common Mistakes

| Mistake                                   | Problem                                       | Fix                                                        |
| ----------------------------------------- | --------------------------------------------- | ---------------------------------------------------------- |
| Mutating state directly in the reducer    | React won't detect changes, no re-render      | Always return new objects: `{ ...state, field: newValue }` |
| Async logic inside the reducer            | Reducers must be pure synchronous functions   | Do async work outside, dispatch result                     |
| Too many simple SET actions               | Reducer becomes a verbose `useState` wrapper  | Use `useState` for simple independent values               |
| Not using TypeScript discriminated unions | Loose `action.payload` typing, runtime errors | Type each action variant separately                        |
| Forgetting the `default` case             | New actions silently do nothing               | Add `default: return state` or `assertNever`               |
| Dispatching in render (no `useEffect`)    | Infinite render loop                          | Dispatch in event handlers or `useEffect`                  |

---

## Practical rule

### Choose `useReducer` when

- State pieces are **related** and change together
- Transitions are **numerous** (5+ distinct events)
- Actions are **explicit** and nameable
- **Maintainability** matters for future developers

### Choose `useState` when

- State is **isolated** (one value, one concern)
- Updates are **simple** (direct assignment)
- Readability is **better without reducer ceremony**
- The component is **small and stable**

### Senior Mindset

> "The complexity is in the transitions, not in the values."

If the hard part is understanding **how** state changes across many user actions → `useReducer`.

If the hard part is just **storing** a few values → `useState`.
