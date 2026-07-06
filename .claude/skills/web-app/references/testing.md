# Testing - Node Built-in Test Runner

Use Node's built-in test runner for small, fast tests around pure TypeScript logic. It is a good fit for validators, mappers, formatters, cache-key factories, reducers, permission checks, and other functions that do not need React, the DOM, Next.js, or browser APIs.

---

## When to Use It

Prefer `node:test` when the unit under test can run in plain Node:

- Pure functions with explicit inputs and outputs.
- Reducer transition logic that can be called directly.
- GraphQL variable builders and response mappers.
- Zod schemas and small validation helpers.
- Date, money, status, and label formatting helpers.

Do not use it for UI behavior, routing, browser APIs, React hooks, component rendering, or anything that needs jsdom. For those, use the app's established React/UI test setup if one exists.

---

## Command Pattern

Run TypeScript tests directly with Node's type stripping:

```bash
node --experimental-strip-types --test path/to/*.test.ts
```

Rules:

- Always include `--experimental-strip-types` when running `.ts` test files directly.
- Keep test files as plain TypeScript: no JSX, no decorators, no TypeScript-only runtime constructs that require transpilation.
- Do not depend on Next.js aliases or bundler resolution unless the command explicitly configures them. Prefer relative imports for these tests.

---

## Explicit `.ts` Imports

Node's ESM resolver does not infer TypeScript extensions the way a bundler does. Import local TypeScript modules with the `.ts` extension in tests and in pure-logic modules used only by this runner.

```ts
import test from 'node:test';
import assert from 'node:assert/strict';

import { buildResidentLabel } from './resident-label.ts';

test('builds a readable resident label', () => {
  assert.equal(
    buildResidentLabel({ firstName: 'Ana', lastName: 'Santos' }),
    'Ana Santos',
  );
});
```

Avoid extensionless local imports in these tests:

```ts
// Bad for direct Node execution
import { buildResidentLabel } from './resident-label';
```

---

## Pure-Logic Extraction

If the behavior worth testing is trapped inside a component, hook, dialog, or route file, extract the smallest pure function first. Do not test through UI just to reach deterministic logic.

```ts
// resident-label.ts
export type ResidentName = {
  firstName: string;
  middleName?: string | null;
  lastName: string;
};

export function buildResidentLabel(resident: ResidentName): string {
  return [resident.firstName, resident.middleName, resident.lastName]
    .filter((part): part is string => Boolean(part?.trim()))
    .join(' ');
}
```

Keep extracted functions boring:

- Accept data as parameters instead of reading component state, query results, or stores directly.
- Return values instead of mutating UI state.
- Inject dates, IDs, and environment-dependent values as arguments when determinism matters.
- Keep React, Next.js, TanStack Query, and browser APIs outside the pure module.

---

## Fixture Typing with `satisfies`

Use `satisfies` for fixtures so the test data is checked against the expected shape without losing useful literal inference.

```ts
type ResidentFixture = {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  status: 'ACTIVE' | 'INACTIVE';
};

const activeResident = {
  firstName: 'Ana',
  middleName: null,
  lastName: 'Santos',
  status: 'ACTIVE',
} satisfies ResidentFixture;
```

Avoid `as ResidentFixture` for fixtures. It can hide missing or incorrect fields that the test should catch while being written.

---

## Table Tests

Use small table tests for deterministic branches. Type the cases with `satisfies` and keep each case name human-readable.

```ts
const cases = [
  {
    name: 'joins first and last name',
    input: { firstName: 'Ana', lastName: 'Santos' },
    expected: 'Ana Santos',
  },
  {
    name: 'skips a blank middle name',
    input: { firstName: 'Ana', middleName: ' ', lastName: 'Santos' },
    expected: 'Ana Santos',
  },
] satisfies Array<{
  name: string;
  input: ResidentName;
  expected: string;
}>;

for (const item of cases) {
  test(item.name, () => {
    assert.equal(buildResidentLabel(item.input), item.expected);
  });
}
```

---

## Anti-Patterns

- Testing component internals instead of extracting pure logic.
- Importing through app aliases without configuring Node resolution.
- Extensionless local `.ts` imports in tests run directly by Node.
- Fixtures typed with broad `as` casts.
- Snapshot tests for simple string/object output where an explicit assertion is clearer.
- Tests that depend on current time, random IDs, locale defaults, or network calls without injecting those dependencies.

---

## Related References

- `references/typescript-patterns.md` - `satisfies`, type guards, and avoiding `as` casts
- `references/react-patterns.md` - extracting reusable logic out of components
- `references/caching.md` - pure query-key factories, mutation variables, and server-state boundaries
- `references/eslint-prettier.md` - lint and formatting baseline for test files
