# Framework-Agnostic Prettier and ESLint Baseline (Monorepo-Friendly)

## Linting and Formatting Rules

Respect the repository linting and formatting setup.

- Follow project ESLint and Prettier rules.
- Do not disable rules to bypass correctness, safety, or maintainability issues unless there is a clear documented reason.
- Prefer fixing the root cause over suppressing lint warnings.
- Keep formatting automatic and consistent.
- After adding or changing GraphQL operations, regenerate `react-query/generated__types.ts` before wiring query wrappers or forms to the new types.
- In this admin app, confirm whether code generation actually wrote `react-query/generated__types.ts` before assuming a schema or document failure. The current post-generation Prettier hook can fail because it runs from the wrong working directory — treat that as a formatting-hook issue unless generation itself failed earlier.

---

Senior frontend engineers usually treat **Prettier** and **ESLint** as two different tools with different responsibilities:

- **Prettier** = formatting only (whitespace, line breaks, quotes, semicolons, indentation)
- **ESLint** = code quality, correctness, safety, and maintainability

The common senior mindset is to avoid overlapping responsibilities. Prettier owns formatting; ESLint owns logic. If a rule is purely stylistic and Prettier handles it, ESLint should not also enforce it.

---

## Prettier Rules Commonly Used

In many teams, Prettier is kept close to default to avoid unnecessary style debates. The goal is "set it and forget it" — formatting should be invisible once configured.

### Example Prettier Config

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

### Why These Are Commonly Used

| Option          | Value   | Reasoning                                                                                                                                                                                           |
| --------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `semi`          | `true`  | Avoids edge cases from Automatic Semicolon Insertion (ASI). Semicolons make statement boundaries explicit, preventing rare but confusing bugs when lines start with `(`, `[`, or template literals. |
| `singleQuote`   | `true`  | Visually cleaner for JavaScript/TypeScript code. Reduces visual noise compared to double quotes. JSX attributes still use double quotes (Prettier handles this automatically).                      |
| `trailingComma` | `"all"` | Makes git diffs cleaner — adding a new item to an array, object, or function parameter only shows one changed line instead of two. Also makes reordering easier.                                    |
| `printWidth`    | `100`   | Balance between readability and compact code. 80 is too narrow for modern code with TypeScript generics and long import paths. 120 is too wide for split-screen development.                        |
| `tabWidth`      | `2`     | Standard in JavaScript/TypeScript ecosystem. Keeps indentation compact, allows more nesting without hitting print width.                                                                            |
| `useTabs`       | `false` | Spaces are more consistent across editors, terminals, and code review tools. Tabs are technically more accessible (user-configurable width) but less common in JS/TS projects.                      |

### Sometimes Also Used

```json
{
  "singleAttributePerLine": true,
  "bracketSameLine": false,
  "arrowParens": "always",
  "endOfLine": "lf",
  "htmlWhitespaceSensitivity": "css"
}
```

| Option                   | When to Use                                                                                                                                                                  |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `singleAttributePerLine` | Useful in JSX/template-heavy projects where components have many props. Forces each prop onto its own line for easier scanning and cleaner diffs.                            |
| `bracketSameLine`        | Set to `false` (default) to keep closing `>` on a new line in JSX. Set to `true` if your team prefers compact JSX.                                                           |
| `arrowParens`            | `"always"` — always wrap arrow function parameters in parentheses. Makes adding/removing parameters a smaller diff and avoids confusion with generic syntax in `.tsx` files. |
| `endOfLine`              | `"lf"` — enforce Unix line endings. Prevents cross-OS line ending conflicts in git. Add `* text=auto eol=lf` to `.gitattributes` for full enforcement.                       |

### Prettier Ignore Patterns

Create `.prettierignore` to skip generated and vendored files:

```
node_modules
dist
build
.next
coverage
*.generated.ts
*.min.js
pnpm-lock.yaml
package-lock.json
```

---

## ESLint Rules Commonly Used

Senior engineers usually do not manually build ESLint from zero. They start from:

1. **ESLint recommended rules** — catches common JS bugs and bad patterns
2. **TypeScript ESLint recommended rules** — catches type-related issues
3. **Framework/runtime recommended rules** — React, Next.js, Vue, etc.

Then they add a focused set of rules that help catch real issues in their specific project.

### Common General ESLint Rules

```json
{
  "eqeqeq": ["error", "always"],
  "curly": ["error", "all"],
  "no-var": "error",
  "prefer-const": "error",
  "no-unused-vars": "off",
  "@typescript-eslint/no-unused-vars": [
    "warn",
    { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }
  ],
  "no-console": ["warn", { "allow": ["warn", "error"] }],
  "no-debugger": "error",
  "object-shorthand": ["error", "always"],
  "prefer-template": "error",
  "no-else-return": ["error", { "allowElseIf": false }],
  "no-useless-return": "error",
  "no-lonely-if": "error",
  "prefer-arrow-callback": ["error", { "allowNamedFunctions": true }]
}
```

### Why These Are Common

| Rule                                | Severity | Reasoning                                                                                                                                                           |
| ----------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `eqeqeq`                            | Error    | Prevents loose equality bugs. `"0" == false` is `true`, `"0" === false` is `false`. Loose equality has surprising coercion rules that cause real bugs.              |
| `curly`                             | Error    | Requires braces on all control flow (`if`, `else`, `for`, `while`). Prevents bugs from adding a line to an unbraced `if` block where the indentation is misleading. |
| `no-var`                            | Error    | Enforces `let`/`const` over `var`. `var` has function-scoping and hoisting behavior that causes confusion. No reason to use `var` in modern code.                   |
| `prefer-const`                      | Error    | Uses `const` for variables that are never reassigned. Signals intent clearly and prevents accidental reassignment.                                                  |
| `@typescript-eslint/no-unused-vars` | Warn     | Keeps files clean without being too strict during development. `_` prefix pattern allows intentionally unused parameters (common in callbacks, type constraints).   |
| `no-console`                        | Warn     | `console.log` should not ship to production. Allow `warn` and `error` for legitimate runtime warnings. Teams often use a logger utility instead.                    |
| `no-debugger`                       | Error    | Prevents `debugger` statements from being committed. These pause execution in production if developer tools are open.                                               |
| `object-shorthand`                  | Error    | `{ name }` instead of `{ name: name }`. Reduces noise and is the modern standard.                                                                                   |
| `prefer-template`                   | Error    | Template literals (`Hello ${name}`) over string concatenation (`'Hello ' + name`). More readable, especially with multiple variables.                               |
| `no-else-return`                    | Error    | If the `if` block returns, the `else` is unnecessary. Reduces nesting depth and improves readability.                                                               |

---

## TypeScript Rules Commonly Used

In TypeScript projects, senior engineers focus on rules that prevent real bugs, not just style preferences.

### Safety Rules (Strongly Recommended)

```json
{
  "@typescript-eslint/no-floating-promises": "error",
  "@typescript-eslint/no-misused-promises": "error",
  "@typescript-eslint/await-thenable": "error",
  "@typescript-eslint/no-unsafe-assignment": "warn",
  "@typescript-eslint/no-unsafe-member-access": "warn",
  "@typescript-eslint/no-unsafe-call": "warn",
  "@typescript-eslint/no-unsafe-return": "warn"
}
```

### Style Rules (Good Defaults)

```json
{
  "@typescript-eslint/consistent-type-imports": [
    "error",
    { "prefer": "type-imports", "fixStyle": "inline-type-imports" }
  ],
  "@typescript-eslint/no-explicit-any": "warn",
  "@typescript-eslint/no-unnecessary-condition": "warn",
  "@typescript-eslint/no-empty-object-type": "warn",
  "@typescript-eslint/no-inferrable-types": "error",
  "@typescript-eslint/no-non-null-assertion": "warn",
  "@typescript-eslint/prefer-nullish-coalescing": "warn",
  "@typescript-eslint/prefer-optional-chain": "error"
}
```

### Why These Matter

| Rule                        | Severity  | Reasoning                                                                                                                                                                                                                                     |
| --------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `no-floating-promises`      | **Error** | Catches forgotten `await` on async calls. A floating promise means the error is silently ignored and the execution order is wrong. This is one of the highest-value TypeScript rules.                                                         |
| `no-misused-promises`       | **Error** | Catches promises passed to places that expect synchronous values (for example `onClick={async () => {...}}` where the return value is not handled, or `Array.forEach` with async callbacks).                                                  |
| `await-thenable`            | **Error** | Catches `await` on values that are not actually Promises. Usually indicates a logic error or misunderstanding.                                                                                                                                |
| `consistent-type-imports`   | **Error** | Ensures `import type { X }` is used for type-only imports. Prevents importing runtime modules for types only, which can pull unnecessary code into bundles. `inline-type-imports` style (`import { type X }`) keeps related imports together. |
| `no-explicit-any`           | **Warn**  | Set to warning because there are valid cases (external library interop, rapid prototyping). The goal is gradual improvement, not blocking all PRs. Track `any` count over time.                                                               |
| `no-unnecessary-condition`  | **Warn**  | Detects conditions that are always true or always false based on types. Often reveals dead code or incorrect assumptions.                                                                                                                     |
| `no-non-null-assertion`     | **Warn**  | `x!.property` bypasses null checking. Usually indicates missing proper narrowing. Allow as warning because some patterns (after `find()` with guaranteed match) make `!` pragmatic.                                                           |
| `prefer-optional-chain`     | **Error** | `a?.b?.c` instead of `a && a.b && a.b.c`. Cleaner and handles `null`/`undefined` correctly.                                                                                                                                                   |
| `prefer-nullish-coalescing` | **Warn**  | `a ?? b` instead of `a                                                                                                                                                                                                                        |     | b`. Prevents `""`, `0`, and `false` from being treated as falsy when they are valid values. Critical for form defaults and API responses. |

**Important**: The `no-floating-promises`, `no-misused-promises`, `await-thenable`, `no-unsafe-*`, and `no-unnecessary-condition` rules require **type-aware linting**. This means ESLint needs access to your `tsconfig.json`:

```js
// eslint.config.mjs (flat config)
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  // ...rules
);
```

Type-aware linting is slower but catches significantly more bugs. Enable it for all TypeScript packages.

---

## Framework-Specific UI Rules (Per Package)

Apply framework-specific rules only in packages that use that framework. This keeps the baseline framework-agnostic.

### React / Next.js

```json
{
  "react/jsx-no-target-blank": "error",
  "react/no-unescaped-entities": "error",
  "react/self-closing-comp": "error",
  "react/no-array-index-key": "warn",
  "react/jsx-curly-brace-presence": [
    "error",
    { "props": "never", "children": "never" }
  ],
  "react-hooks/rules-of-hooks": "error",
  "react-hooks/exhaustive-deps": "warn"
}
```

| Rule                          | Why                                                                                                                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `react-hooks/rules-of-hooks`  | **Critical** — hooks called conditionally or in loops cause runtime crashes. Always error.                                                                                |
| `react-hooks/exhaustive-deps` | Catches missing/extra dependencies in `useEffect`, `useMemo`, `useCallback`. Set to warn because there are valid suppression cases, but most warnings indicate real bugs. |
| `jsx-no-target-blank`         | Links with `target="_blank"` without `rel="noopener noreferrer"` create a security vulnerability (reverse tabnabbing).                                                    |
| `no-array-index-key`          | Using array index as `key` causes bugs when list items can be reordered, inserted, or deleted. Warn because it's acceptable for static lists.                             |

### Next.js-Specific

Install `@next/eslint-plugin-next` and extend `next/core-web-vitals`:

```js
// eslint.config.mjs
import nextPlugin from '@next/eslint-plugin-next';

export default [
  {
    plugins: { '@next/next': nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },
];
```

This adds rules for:

- `@next/next/no-img-element` — use `next/image` instead
- `@next/next/no-html-link-for-pages` — use `next/link` instead
- `@next/next/no-sync-scripts` — use `next/script` for third-party scripts

---

## Import Rules Commonly Used

Import organization rules improve file scanability and catch dependency issues:

```json
{
  "import/order": [
    "warn",
    {
      "groups": [
        "builtin",
        "external",
        "internal",
        ["parent", "sibling"],
        "index",
        "type"
      ],
      "alphabetize": { "order": "asc", "caseInsensitive": true },
      "newlines-between": "always"
    }
  ],
  "import/no-duplicates": "error",
  "import/no-cycle": ["error", { "maxDepth": 3 }],
  "import/no-self-import": "error"
}
```

| Rule                    | Why                                                                                                                                                 |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `import/order`          | Consistent import ordering makes files easier to scan during review. Groups separate React/library imports from internal project imports.           |
| `import/no-duplicates`  | Prevents `import { A } from 'x'` and `import { B } from 'x'` on separate lines. Merge into `import { A, B } from 'x'`.                              |
| `import/no-cycle`       | Catches circular dependency chains that cause runtime issues (undefined imports, initialization order bugs). Set `maxDepth` to limit analysis time. |
| `import/no-self-import` | Catches files that accidentally import themselves (usually a copy-paste bug).                                                                       |

**Alternative: `eslint-plugin-simple-import-sort`**

If `import/order` is too slow or complex to configure, `simple-import-sort` provides a simpler, faster alternative:

```json
{
  "simple-import-sort/imports": "error",
  "simple-import-sort/exports": "error"
}
```

---

## Monorepo-Friendly Setup

In monorepos, keep linting and formatting layered:

### Architecture

```
root/
├── eslint.config.mjs           ← shared baseline (JS/TS rules, import rules)
├── .prettierrc                  ← single formatting config for entire repo
├── .prettierignore              ← skip generated/vendored files
├── apps/
│   ├── web-app/
│   │   └── eslint.config.mjs   ← extends root + adds React/Next.js rules
│   └── api/
│       └── eslint.config.mjs   ← extends root + adds Node.js rules
└── libs/
    ├── shared-ui/
    │   └── eslint.config.mjs   ← extends root + adds React rules
    └── shared-utils/
        └── eslint.config.mjs   ← extends root only (no framework rules)
```

### Principles

1. **Root**: Shared baseline with JS/TS quality rules, import rules, and TypeScript safety rules
2. **Per-app/lib**: Extend root and add framework-specific rules (React, Next.js, Node.js, Vue)
3. **Framework rules only where relevant**: React rules in React packages, Node rules in API packages
4. **Consistent Prettier config**: Single `.prettierrc` at root, shared by all packages
5. **Consistent import ordering**: Same `import/order` config across all packages
6. **Type-aware linting**: Each package points to its own `tsconfig.json` for type-aware rules

### Flat Config (ESLint v9+) Root Example

```js
// eslint.config.mjs (root)
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { import: importPlugin },
    rules: {
      // General
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'no-var': 'error',
      'prefer-const': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // TypeScript
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',

      // Imports
      'import/no-duplicates': 'error',
      'import/order': [
        'warn',
        { alphabetize: { order: 'ASC' }, 'newlines-between': 'always' },
      ],
    },
  },
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/.next/**',
      '**/coverage/**',
    ],
  },
);
```

---

## Config File Policy (Important)

When applying this baseline:

1. **Detect existing config files first** and update them in place
2. **Do not create duplicate** ESLint/Prettier config files when one already exists
3. **Create a new config** only when no config exists at all
4. **Prefer flat config** (ESLint v9+) for new projects — `.eslintrc.*` is legacy

### Files to Check Before Creating

| Tool             | Config Files to Look For                                                          |
| ---------------- | --------------------------------------------------------------------------------- |
| **ESLint**       | `eslint.config.*` (flat), `.eslintrc.*` (legacy), `package.json` → `eslintConfig` |
| **Prettier**     | `.prettierrc*`, `prettier.config.*`, `package.json` → `prettier`                  |
| **EditorConfig** | `.editorconfig` (may conflict with Prettier — Prettier takes precedence)          |

### Preventing Prettier/ESLint Conflicts

If using both Prettier and ESLint, avoid ESLint rules that conflict with Prettier formatting:

```bash
# Install the config that turns off conflicting rules
npm install -D eslint-config-prettier
```

```js
// eslint.config.mjs
import prettierConfig from 'eslint-config-prettier';

export default [
  // ...your rules
  prettierConfig, // Must be LAST to override conflicting rules
];
```

---

## Rules Senior Engineers Usually Avoid Overdoing

Senior engineers avoid making linting too strict just to look thorough. Over-strict linting causes:

- Developer frustration and reduced velocity
- Excessive `eslint-disable` comments that make the config meaningless
- Time spent debating style instead of building features
- Higher barrier to entry for new contributors

### Common Things to Avoid Over-Enforcing

| Over-Enforcement                                             | Why It's Counterproductive                                                                                                                                                       |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Forcing one function style everywhere (arrow vs declaration) | Both have valid uses. Arrow functions don't have `this`; declarations are hoisted. Let developers choose.                                                                        |
| Banning all `any` without exception (`error` severity)       | External libraries, rapid prototyping, and migration paths sometimes need `any`. Use `warn` and track count.                                                                     |
| Too many naming convention rules                             | Naming is contextual. `camelCase` for variables, `PascalCase` for types/components is usually enough. Don't enforce prefix/suffix patterns unless there's a real confusion risk. |
| Template/markup formatting rules                             | Prettier already handles JSX formatting. ESLint rules for JSX indentation/spacing create conflicts.                                                                              |
| Maximum file length / function length                        | These are better caught in code review than by a linter. Arbitrary limits force bad decomposition.                                                                               |
| Maximum parameter count                                      | Sometimes functions legitimately need many parameters (React component props). Better solved by organizing into objects.                                                         |
| Enforcing `readonly` on everything                           | Good in principle but verbose in practice. Apply to shared interfaces and public APIs, not every local variable.                                                                 |

The goal is not to create a painful developer experience. The best lint config is one that developers forget exists because it only catches real problems.

---

## Practical Senior-Level Setup Summary

### Prettier

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### ESLint Focus

| Category      | Approach                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Baseline**  | Start from `eslint:recommended` + `@typescript-eslint/recommended-type-checked`                                    |
| **Safety**    | Add async safety rules (`no-floating-promises`, `no-misused-promises`, `await-thenable`)                           |
| **Types**     | Add TypeScript correctness rules (`consistent-type-imports`, `prefer-optional-chain`, `prefer-nullish-coalescing`) |
| **Framework** | Add React/Next.js/Vue rules only in packages that use them                                                         |
| **Imports**   | Add ordering and duplicate-prevention rules                                                                        |
| **Monorepo**  | One shared baseline at root, override per package                                                                  |
| **Style**     | Keep minimal — Prettier handles formatting                                                                         |
| **Severity**  | `error` for bugs, `warn` for judgment-based rules, never `error` for style preferences                             |
| **Conflicts** | Always add `eslint-config-prettier` last to prevent formatting conflicts                                           |

---

## Related References

- `references/typescript-patterns.md` — the type-level standards these lint rules enforce
- `references/dependency-management.md` — upgrade workflow when bumping tooling versions
