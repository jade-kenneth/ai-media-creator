# TypeScript Patterns (Framework-Agnostic)

## TypeScript Standards — Quick Rules

Use strong, intentional typing by default.

- Prefer `unknown` at external boundaries (network responses, storage, env vars, user input, `JSON.parse`). Narrow `unknown` with validators, type guards, or assertion functions.
- Standardize reusable helpers where relevant: `Prettify<T>`, `ValueOf<T>`, `NonEmptyArray<T>`, `Brand<T, Name>`.
- Prefer discriminated unions for multi-state and result modeling.
- Enforce exhaustive handling with `assertNever` for union-driven logic.
- Prefer `satisfies` over broad `as` casting when checking object shapes while preserving inference.
- Prefer `as const` with literal unions when runtime enum behavior is not required.
- Use branded types for critical identifiers such as `UserId`, `OrderId`, and similar domain IDs.
- Keep generics minimal and meaningful. Remove generics that do not improve type safety.
- Use overloads only when return type precision at the call site is necessary.
- Prefer typed key helpers over unsafe `Object.keys` assumptions.
- Use template literal types for constrained string contracts only when they remain readable.
- Prefer assertion functions for important invariants.
- Avoid broad `as` casting except at validated boundaries, branding, or proven invariants.
- Do not use non-null assertions (`!`) to silence errors.

---



Advanced TypeScript patterns and proper implementation that apply across any TypeScript codebase, including frontend, backend, libraries, and scripts.

## Table of Contents

1. [Type-Level Helpers to Standardize](#1-type-level-helpers-to-standardize)
2. [`satisfies` for Shape Validation](#2-satisfies-for-shape-validation-while-preserving-inference)
3. [`as const` + Literal Unions](#3-as-const--literal-unions)
4. [Discriminated Unions for State and Results](#4-discriminated-unions-for-state-and-results)
5. [Exhaustiveness Checks](#5-exhaustiveness-checks)
6. [Generics with Clear Purpose](#6-generics-with-clear-purpose)
7. [Type Guards for Safe Narrowing](#7-type-guards-for-safe-narrowing)
8. [`unknown` for External Input](#8-unknown-for-external-input)
9. [Mapped Types and Modifiers](#9-mapped-types-and-modifiers)
10. [Template Literal Types](#10-template-literal-types)
11. [Exact Object Checks](#11-exact-object-checks)
12. [Nullable API / GraphQL Field Utilities](#12-utility-for-nullable-api-or-graphql-fields)
13. [Typed Registries and Handler Maps](#13-typed-registries-and-handler-maps)
14. [Overload Signatures](#14-overload-signatures)
15. [Typed `Object.keys` Helpers](#15-typed-objectkeys-helpers)
16. [Common Mistakes — Decision Table](#common-mistakes--decision-table)
17. [Pattern Selection Guide](#pattern-selection-guide)
18. [Recommended Team Standard](#recommended-team-standard)

---

## 1. Type-Level Helpers to Standardize

Place these in a shared `types/` or `libs/types/` module. They form the foundation of a well-typed codebase.

### `Prettify<T>`

Improves readability of intersected or inferred types in editor tooltips. Flattens `A & B & C` into a single object shape.

```ts
type Prettify<T> = { [K in keyof T]: T[K] } & {};

// Before (tooltip shows): Pick<User, 'id'> & { extra: string }
// After (tooltip shows): { id: string; extra: string }
```

**When to use:** Wrap complex intersection types, `Pick`/`Omit` results, or utility type outputs when the tooltip is unreadable.

### `ValueOf<T>`

Gets the union of all property values from an object type.

```ts
type ValueOf<T> = T[keyof T];

// Example
const STATUS = { ACTIVE: 'active', INACTIVE: 'inactive', ARCHIVED: 'archived' } as const;
type Status = ValueOf<typeof STATUS>; // 'active' | 'inactive' | 'archived'
```

**When to use:** Extracting value unions from const objects, config maps, or enum-like structures.

### `NonEmptyArray<T>`

Represents an array that always contains at least one item. Prevents accidental empty array usage where at least one element is required.

```ts
type NonEmptyArray<T> = [T, ...T[]];

function getFirst<T>(items: NonEmptyArray<T>): T {
  return items[0]; // Always safe — no undefined risk
}

getFirst([1, 2, 3]); // ✅
// getFirst([]);       // ❌ Compile error
```

**When to use:** Validation results that require at least one error, non-empty selections, batch operations that require items.

### `Brand<T, Name>`

Adds nominal typing for values that share the same primitive type but represent different concepts. Prevents accidental mixing of IDs.

```ts
type Brand<T, Name extends string> = T & { readonly __brand: Name };

type ProductId = Brand<string, 'ProductId'>;
type UserId = Brand<string, 'UserId'>;
type OrderId = Brand<string, 'OrderId'>;

// Branding functions — apply at validated boundaries
const asProductId = (value: string): ProductId => value as ProductId;
const asUserId = (value: string): UserId => value as UserId;

function getProduct(id: ProductId) { /* ... */ }
function getUser(id: UserId) { /* ... */ }

const productId = asProductId('prod_123');
const userId = asUserId('user_456');

getProduct(productId); // ✅
// getProduct(userId);  // ❌ Compile error — UserId is not ProductId
```

**When to use:** Entity IDs, validated emails, currency amounts, slugs — anywhere two `string` or `number` types represent fundamentally different things.

**Where to brand:** At validated boundaries — API response parsers, form validators, database mappers. The rest of the code receives branded types and benefits from safety.

---

## 2. `satisfies` for Shape Validation While Preserving Inference

`satisfies` validates that an expression conforms to a type **without widening** — preserving literal types and autocomplete.

### `satisfies` vs `as` vs `: Type`

| Approach | Shape check | Preserves literals | Excess property check | Use when |
| --- | --- | --- | --- | --- |
| `satisfies T` | ✅ | ✅ | ✅ | You want validation + inference |
| `as T` | ❌ (assertion) | ❌ | ❌ | Forced cast — avoid in most cases |
| `: T` (annotation) | ✅ | ❌ (widens) | ✅ | You want the exact declared type |

```ts
// ✅ satisfies — validates shape, preserves literal types
const routes = {
  home: '/',
  product: (id: string) => `/product/${id}`,
  category: (slug: string) => `/category/${slug}`,
} satisfies Record<string, string | ((...args: any[]) => string)>;

routes.home;    // Type: '/' (literal)
routes.product; // Type: (id: string) => string (preserved signature)
// routes.nonexistent; // ❌ Compile error

// ❌ as — no validation, loses specificity
const routes2 = {
  home: '/',
} as Record<string, string>;
routes2.nonexistent; // No error — unsafe
```

**Best use cases:**

| Use case | Example |
| --- | --- |
| Route maps | `satisfies Record<string, string \| RouteFunction>` |
| Config objects | `satisfies AppConfig` |
| Permission maps | `satisfies Record<Role, Permission[]>` |
| Lookup tables | `satisfies Record<StatusCode, StatusInfo>` |
| Event handler maps | `satisfies Record<EventType, Handler>` |

---

## 3. `as const` + Literal Unions

A lightweight way to model fixed values while keeping runtime and type usage in sync. Avoids the overhead and quirks of TypeScript `enum`.

```ts
const ROLES = ['ADMIN', 'USER', 'VIEWER'] as const;
type Role = (typeof ROLES)[number]; // 'ADMIN' | 'USER' | 'VIEWER'

// Runtime check: is this value a valid role?
function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}
```

### `as const` vs `enum`

| Aspect | `as const` + union | `enum` |
| --- | --- | --- |
| Runtime value | Plain string/number | Enum object (reverse mapping for numeric) |
| Bundle size | Zero overhead | Generates runtime code |
| Iteration | `ROLES.forEach(...)` | `Object.values(MyEnum)` (includes reverse keys for numeric) |
| Type narrowing | Natural with `===` | Natural with `===` |
| Refactoring | Rename in array + union follows | Rename enum member |
| Tree shaking | Always tree-shakable | May not tree-shake (numeric enums) |
| Use with `satisfies` | ✅ Works naturally | 🟡 Works but less ergonomic |

**Recommendation:** Prefer `as const` for statuses, roles, feature flags, API contracts. Use `enum` only when you need reverse mapping or the runtime enum object.

### Object Const Pattern (Key-Value)

```ts
const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

type OrderStatus = ValueOf<typeof ORDER_STATUS>; // 'pending' | 'processing' | ...
type OrderStatusKey = keyof typeof ORDER_STATUS;  // 'PENDING' | 'PROCESSING' | ...
```

---

## 4. Discriminated Unions for State and Results

The most important TypeScript pattern for modeling multi-state data and preventing impossible states.

### Result Pattern

```ts
type Result<T, E = string> =
  | { ok: true; data: T }
  | { ok: false; error: E; code?: string };

function unwrap<T>(result: Result<T>): T {
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

// Usage
function parseConfig(raw: unknown): Result<AppConfig> {
  const parsed = configSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.message, code: 'INVALID_CONFIG' };
  }
  return { ok: true, data: parsed.data };
}
```

### Async State Pattern

```ts
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string; retryCount: number };

// ✅ TypeScript narrows automatically in each branch
function renderState<T>(state: AsyncState<T>) {
  switch (state.status) {
    case 'idle':
      return null;
    case 'loading':
      return <Spinner />;
    case 'success':
      return <Content data={state.data} />;      // state.data is available
    case 'error':
      return <Error message={state.error} />;     // state.error is available
  }
}
```

### API Response Variants

```ts
type APIResponse =
  | { type: 'user'; data: User }
  | { type: 'product'; data: Product }
  | { type: 'order'; data: Order };

// Discriminator at top level → TypeScript narrows data type per branch
function processResponse(response: APIResponse) {
  switch (response.type) {
    case 'user':
      console.log(response.data.email);  // TypeScript knows this is User
      break;
    case 'product':
      console.log(response.data.price);  // TypeScript knows this is Product
      break;
  }
}
```

**Key rules:**

| Rule | Why |
| --- | --- |
| Keep discriminator at the top level | `{ type: ... }` — enables automatic narrowing |
| Use one consistent discriminator name per domain | `type`, `status`, `kind`, or `ok` — pick one and stick with it |
| Each variant should have exactly the fields it needs | Don't make all fields optional — that defeats the purpose |
| Prefer discriminated unions over boolean combinations | `{ isLoading: true, isError: true }` is impossible with proper unions |

---

## 5. Exhaustiveness Checks

Ensures all union members are handled. Compile error when a new variant is added but not handled.

```ts
function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`);
}

type Payment =
  | { type: 'CARD'; last4: string }
  | { type: 'GCASH'; phone: string }
  | { type: 'PAYPAL'; email: string }; // Adding this forces all switches to handle it

function label(payment: Payment): string {
  switch (payment.type) {
    case 'CARD':
      return `Card ****${payment.last4}`;
    case 'GCASH':
      return `GCash ${payment.phone}`;
    case 'PAYPAL':
      return `PayPal ${payment.email}`;
    default:
      return assertNever(payment); // ❌ Compile error if a case is missing
  }
}
```

**Where to use exhaustiveness:**

| Location | Why |
| --- | --- |
| Reducers (`switch (action.type)`) | New actions must be handled |
| UI rendering branches | New variants must have UI |
| API request handlers | New endpoints must be routed |
| Serializers / formatters | New types must be serialized |
| Permission checks | New roles must have defined access |

---

## 6. Generics with Clear Purpose

Generics must **constrain** (`extends`) or **transform** types meaningfully. If a generic doesn't add type safety or flexibility, remove it.

### ✅ Good Generics — Type Relationships Preserved

```ts
// Generic preserves the relationship between input and output
async function fetchJson<T>(url: string, schema: z.ZodType<T>): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Bad response');
  const raw: unknown = await response.json();
  return schema.parse(raw); // Validated, typed output
}

// Generic constrains the key to actual object properties
function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    result[key] = obj[key];
  }
  return result;
}

// Generic infers the return type from input
function createStore<T>(initialState: T) {
  let state = initialState;
  return {
    get: (): T => state,
    set: (next: T) => { state = next; },
  };
}
```

### ❌ Bad Generics — No Added Value

```ts
// ❌ Generic doesn't add anything — T is not used meaningfully
function logMessage<T>(message: T): void {
  console.log(message);
}
// ✅ Just use unknown or string
function logMessage(message: unknown): void {
  console.log(message);
}

// ❌ Generic that's always the same type
function getUser<T extends User>(id: string): Promise<T> { /* ... */ }
// ✅ Remove the generic
function getUser(id: string): Promise<User> { /* ... */ }
```

### Generic Checklist

| Question | If No |
| --- | --- |
| Does the generic constrain input? | Remove it — use a concrete type |
| Does the generic appear in both input AND output? | If only one, it's probably unnecessary |
| Would a reader understand what the generic represents? | Add a descriptive name (`TItem`, `TResponse`) or simplify |
| Are there fewer than 3 generic params? | If 4+ generics, the abstraction is probably too complex |

---

## 7. Type Guards for Safe Narrowing

Type guards validate `unknown` values and safely narrow them into trusted application types.

### Manual Type Guard

```ts
type User = { id: string; email: string; role: 'admin' | 'user' };

function isUser(value: unknown): value is User {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.email === 'string' &&
    (obj.role === 'admin' || obj.role === 'user')
  );
}

// Usage
function handleApiResponse(raw: unknown) {
  if (isUser(raw)) {
    console.log(raw.email); // TypeScript knows raw is User
  }
}
```

### Zod-Based Guard (Recommended for Complex Shapes)

```ts
import { z } from 'zod';

const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: z.enum(['admin', 'user']),
});

type User = z.infer<typeof userSchema>;

function isUser(value: unknown): value is User {
  return userSchema.safeParse(value).success;
}

// Or use directly for validation + narrowing
function parseUser(value: unknown): User {
  return userSchema.parse(value); // Throws on invalid
}
```

### Type Guard vs Zod — When to Use Which

| Approach | Best for | Pros | Cons |
| --- | --- | --- | --- |
| Manual type guard | Simple shapes (2–3 fields) | Zero deps, lightweight | Verbose for complex shapes, easy to miss a field |
| Zod schema + `.safeParse()` | Complex shapes, API boundaries | Comprehensive validation, error messages, inferrable types | Dependency, slightly larger bundle |

---

## 8. `unknown` for External Input

`unknown` forces you to narrow before use — making external data handling safe by default.

### Where to Use `unknown`

| Boundary | Example | Why |
| --- | --- | --- |
| API responses | `const raw: unknown = await response.json()` | Server can return anything |
| `localStorage` / `sessionStorage` | `const raw: unknown = JSON.parse(stored)` | User or extension can modify |
| Environment variables | `const raw: unknown = process.env.API_KEY` | May be undefined or wrong type |
| User input | Form data, URL params, query strings | User can submit anything |
| Webhook payloads | `const body: unknown = await request.json()` | External service controls shape |
| Message events | `event.data` from `postMessage` | Cross-origin messages |

```ts
// ✅ GOOD — unknown at boundary, validated before use
async function fetchProducts(): Promise<Product[]> {
  const response = await fetch('/api/products');
  const raw: unknown = await response.json();
  return productArraySchema.parse(raw); // Validated
}

// ❌ BAD — trusting the response shape
async function fetchProducts(): Promise<Product[]> {
  const response = await fetch('/api/products');
  return response.json() as Product[]; // Unsafe assertion
}
```

---

## 9. Mapped Types and Modifiers

Useful for building safe variations of existing types at the type level.

### `Mutable<T>` — Remove `readonly`

```ts
type Mutable<T> = { -readonly [K in keyof T]: T[K] };

// Use case: when you need to build up an object that's eventually frozen
type Config = Readonly<{ host: string; port: number }>;
type MutableConfig = Mutable<Config>; // { host: string; port: number }
```

### `DeepPartial<T>` — Nested Optional

```ts
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

// Use case: patch/update payloads where any subset of fields can change
type UserPatch = DeepPartial<User>;
// { id?: string; profile?: { name?: string; avatar?: string } }
```

### `DeepReadonly<T>` — Nested Immutable

```ts
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};
```

### `RequiredFields<T, K>` — Make Specific Fields Required

```ts
type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Use case: a function that requires certain optional fields to be present
type UserWithEmail = RequiredFields<Partial<User>, 'email'>;
```

### When to Use Each

| Modifier | Use case | Caution |
| --- | --- | --- |
| `Partial<T>` | Form drafts, optional update payloads | Don't use as default for function params — loses required field safety |
| `Required<T>` | After validation, when all fields are confirmed present | Usually too broad — prefer `RequiredFields` for specific fields |
| `Readonly<T>` | Config objects, constants, reducer state | Shallow only — use `DeepReadonly` for nested objects |
| `DeepPartial<T>` | Nested patch payloads, test fixtures | Over-use hides missing required fields — use deliberately |
| `Mutable<T>` | Builder patterns, object construction before freeze | Should be temporary — freeze/seal after building |

---

## 10. Template Literal Types

Constrain string values to specific patterns at the type level. Useful for routes, IDs, event names, and API paths.

```ts
// Route patterns
type Route = '/' | `/product/${string}` | `/category/${string}` | `/user/${string}/orders`;

function navigate(route: Route) { /* ... */ }
navigate('/product/123');      // ✅
navigate('/category/shoes');   // ✅
// navigate('/random');         // ❌ Compile error

// Prefixed IDs
type ProductId = `prod_${string}`;
type OrderId = `ord_${string}`;

// Event names (namespace.action pattern)
type AnalyticsEvent =
  | `page.${string}`
  | `click.${string}`
  | `form.${string}`;

function track(event: AnalyticsEvent, data?: Record<string, unknown>) { /* ... */ }
track('click.add_to_cart');   // ✅
// track('random_event');      // ❌

// API paths
type APIPath = `/api/v1/${'users' | 'products' | 'orders'}${string}`;
```

**Readability rule:** If the template literal type is more than 2 levels deep or has complex conditionals, it's hurting readability. Simplify or use a runtime validator instead.

---

## 11. Exact Object Checks

Prevents extra properties in function arguments — useful for DTOs, payloads, and command objects.

```ts
type Exact<A, B extends A> = A & Record<Exclude<keyof B, keyof A>, never>;

type CreateProduct = { name: string; price: number };

function createProduct<T extends CreateProduct>(input: Exact<CreateProduct, T>) {
  // Only name and price are accepted
}

createProduct({ name: 'Widget', price: 9.99 });        // ✅
// createProduct({ name: 'Widget', price: 9.99, isAdmin: true }); // ❌ Extra field rejected
```

**When to use:**

| Use case | Why |
| --- | --- |
| API request bodies | Prevent clients from sending unexpected fields |
| Internal command objects | Ensure handlers only receive intended data |
| Mutation inputs | GraphQL mutation variables should match schema exactly |
| Config builders | Catch typos in config keys at compile time |

**Note:** TypeScript already has excess property checking for direct object literals. `Exact<>` adds this for cases where TypeScript's structural typing would otherwise allow extra fields (e.g., via variable assignment).

---

## 12. Utility for Nullable API or GraphQL Fields

GraphQL schemas frequently return `T | null | undefined`. Assertion functions narrow these safely.

```ts
// Assertion function — narrows type after the call
function requireField<T>(value: T, name: string): asserts value is NonNullable<T> {
  if (value == null) throw new Error(`Required field "${name}" is null or undefined`);
}

// Usage with GraphQL response
const { data } = useQuery(GET_PRODUCT, { variables: { id } });

requireField(data?.product, 'product');
requireField(data.product.thumbnail, 'product.thumbnail');

// After assertions, TypeScript knows these are non-null
console.log(data.product.name);           // ✅ No optional chaining needed
console.log(data.product.thumbnail.url);  // ✅ Narrowed to non-null
```

### `assertDefined` Variant (Generic)

```ts
function assertDefined<T>(
  value: T | null | undefined,
  message?: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message ?? 'Expected value to be defined');
  }
}

// Inline usage
const user = await getUser(id);
assertDefined(user, `User ${id} not found`);
user.email; // ✅ TypeScript knows user is defined
```

---

## 13. Typed Registries and Handler Maps

Use `keyof`, `Parameters<>`, and `ReturnType<>` for type-safe command/handler systems.

```ts
// Define the registry shape
type CommandHandlers = {
  'user:create': (data: { name: string; email: string }) => Promise<User>;
  'user:delete': (data: { userId: string }) => Promise<void>;
  'order:process': (data: { orderId: string; action: 'approve' | 'reject' }) => Promise<Order>;
};

// Type-safe dispatch function
function dispatch<K extends keyof CommandHandlers>(
  command: K,
  data: Parameters<CommandHandlers[K]>[0]
): ReturnType<CommandHandlers[K]> {
  const handler = registry[command];
  return handler(data) as ReturnType<CommandHandlers[K]>;
}

// Usage — fully typed
dispatch('user:create', { name: 'Jade', email: 'jade@example.com' }); // ✅
// dispatch('user:create', { name: 'Jade' }); // ❌ Missing email
// dispatch('nonexistent', {});                 // ❌ Invalid command
```

**Use cases:** API route handlers, event bus systems, plugin registries, state machine action dispatchers.

---

## 14. Overload Signatures

Use overloads when a function's return type depends on its input in ways that a single generic signature can't express.

```ts
// Overloads — caller gets precise return type based on input
function parseValue(input: string, type: 'number'): number;
function parseValue(input: string, type: 'boolean'): boolean;
function parseValue(input: string, type: 'string'): string;
function parseValue(input: string, type: string): number | boolean | string {
  switch (type) {
    case 'number': return Number(input);
    case 'boolean': return input === 'true';
    case 'string': return input;
    default: throw new Error(`Unknown type: ${type}`);
  }
}

const num = parseValue('42', 'number');     // Type: number
const bool = parseValue('true', 'boolean'); // Type: boolean
```

**When to use:** Only when call-site return type precision is needed. If a union return type is acceptable, a single signature is simpler.

| Use overloads | Don't use overloads |
| --- | --- |
| Return type differs based on literal input arg | Return type is always the same |
| Callers need precise types without assertion | A union return is acceptable |
| 2–3 overloads max | 4+ overloads — refactor to discriminated union or generic |

---

## 15. Typed `Object.keys` Helpers

`Object.keys()` returns `string[]` in TypeScript, not `(keyof T)[]`. Use a typed helper when you need key type safety.

```ts
// Typed keys helper
function typedKeys<T extends Record<string, unknown>>(obj: T): Array<keyof T> {
  return Object.keys(obj) as Array<keyof T>;
}

// Usage
const config = { host: 'localhost', port: 3000, debug: true };
const keys = typedKeys(config); // Type: ('host' | 'port' | 'debug')[]

keys.forEach((key) => {
  console.log(config[key]); // ✅ TypeScript knows key is valid
});

// vs raw Object.keys
Object.keys(config).forEach((key) => {
  // config[key]; // ❌ Element implicitly has an 'any' type
});
```

**Why TypeScript widens `Object.keys`:** TypeScript uses structural typing — an object may have more keys than its type declares. The `string[]` return is technically correct. Use the typed helper only when you're confident the object matches its type exactly.

---

## Common Mistakes — Decision Table

| Mistake | Risk | Fix |
| --- | --- | --- |
| Using `as` to bypass type errors | Hides real bugs, breaks at runtime | Validate with type guard or Zod, then narrow |
| Adding generics that aren't used in both input and output | Complexity without benefit | Remove the generic, use concrete types |
| Large unions without a discriminator field | Can't narrow, runtime errors from accessing wrong variant | Add `type`, `status`, or `kind` discriminator |
| `DeepPartial` as default for all function params | Required fields become optional — bugs slip through | Use `Partial` only where partial input is intended |
| `any` for "I don't know the type" | Turns off all type checking for that value | Use `unknown` and validate |
| `as const` inside a function (not at declaration) | Doesn't affect the variable's type from the caller's perspective | Apply `as const` at the declaration site |
| Enum with numeric values when string values suffice | Numeric enums have reverse mapping (extra runtime code) | Use `as const` string array or string enum |
| `!` (non-null assertion) to silence errors | Crashes at runtime if value is actually null | Use type guard, assertion function, or `??` fallback |
| Generic with 4+ type parameters | Unreadable, hard to use | Simplify — break into smaller functions or use object params |
| `Object.keys(obj)` and assuming key types | TypeScript returns `string[]`, not `(keyof T)[]` | Use `typedKeys` helper |

---

## Pattern Selection Guide

| Situation | Pattern |
| --- | --- |
| Need type-safe ID that can't be mixed with other IDs | `Brand<T, Name>` |
| Config/map object that needs shape validation + literal inference | `satisfies` |
| Fixed set of string values (roles, statuses) | `as const` + literal union |
| Multi-state data (loading/success/error) | Discriminated union |
| `switch` over a union that must handle all cases | `assertNever` exhaustiveness |
| External data (API, storage, env vars) | `unknown` + Zod or type guard |
| Making all nested fields optional for a patch | `DeepPartial<T>` (use deliberately) |
| Route/ID/event name patterns | Template literal types |
| Rejecting extra fields in payloads | `Exact<A, B>` |
| Nullable GraphQL fields that must be present | `assertDefined` / `requireField` |
| Command/handler registry | `keyof` + `Parameters<>` + `ReturnType<>` |
| Function return type depends on literal input | Overloads (max 3) |
| Iterating object keys with type safety | `typedKeys` helper |

---

## Recommended Team Standard

For a clean and maintainable TypeScript codebase, adopt these as defaults:

| Category | Standard |
| --- | --- |
| **Shared helpers** | Standardize `Prettify<T>`, `ValueOf<T>`, `NonEmptyArray<T>`, `Brand<T, Name>` in `libs/types/` |
| **Shape validation** | Use `satisfies` for config objects and lookup maps |
| **Fixed values** | Use `as const` with UPPERCASE constant arrays/objects for API contracts |
| **Multi-state modeling** | Model with discriminated unions, not boolean combinations |
| **Exhaustiveness** | Use `assertNever` in every `switch` over a union |
| **Generics** | Keep purposeful and readable — remove if not constraining or transforming |
| **External data** | Accept as `unknown`, validate with Zod or type guards |
| **Type transformations** | Use mapped types intentionally (`Mutable`, `DeepPartial`, `RequiredFields`) |
| **Payload validation** | Apply exact object checks where field shape matters |
| **Assertions** | Use `asserts` functions for required nullable fields (GraphQL, API) |
| **Casting (`as`)** | Only at validated boundaries, branding, or proven invariants — never to silence errors |
