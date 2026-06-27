# Apollo Client v3 to v4 Migration Docs

## Scope

This document captures the migration pattern used in this repository to move from Apollo Client v3-style generated React hooks to Apollo Client v4-friendly document-based hooks.

The migration applies to the `ecommerce-app` frontend in this monorepo.

## What Changed

1. Apollo hook usage moved from generated hooks to base hooks from `@apollo/client/react`.
2. GraphQL operations are now imported as typed documents from domain files in `apps/ecommerce-app/libs/graphql/src`.
3. UI code no longer calls generated hook APIs like `useProductsQuery` / `useUpdateCartItemMutation`.
4. UI code now calls:
   - `useQuery(<DOCUMENT>)`
   - `useMutation(<DOCUMENT>)`
5. `~/graphql/generated` is still used for shared GraphQL types/enums/scalars (for example `OrderStatus`, `AccountType`, `CategoryType`).

## Package Changes and Usage

The following package updates were applied as part of this migration (added or version-upgraded):

### Runtime dependencies

1. `@apollo/client` (upgraded to `^4.1.6`)
   - Primary Apollo Client v4 package.
   - Used for:
     - React hooks (`useQuery`, `useMutation`) from `@apollo/client/react`
     - Core client/link/types from `@apollo/client/core`

2. `graphql` (upgraded to `^16.13.0`)
   - GraphQL core runtime/peer dependency for Apollo Client and tooling.

3. `graphql-tag` (`^2.12.6`, used in typed document files)
   - Provides `gql` template parsing in domain document files such as:
     - `libs/graphql/src/Cart.ts`
     - `libs/graphql/src/Product.ts`
     - `libs/graphql/src/Account.ts`

### Dev dependencies (code generation)

1. `@graphql-codegen/typed-document-node` (added, `^6.1.6`)
   - Generates typed operation documents and typed operation signatures.
   - Enables strongly typed `useQuery(DOCUMENT)` / `useMutation(DOCUMENT)` flows.

2. `@graphql-codegen/near-operation-file-preset` (added, `^4.0.0`)
   - Installed for optional near-operation output strategy.
   - Not required by the current default output pattern (`generated.tsx`), but available if needed later.

## New GraphQL Document Structure

Operations are grouped by domain and exported as `TypedDocumentNode` constants:

- `apps/ecommerce-app/libs/graphql/src/Account.ts`
- `apps/ecommerce-app/libs/graphql/src/Cart.ts`
- `apps/ecommerce-app/libs/graphql/src/Product.ts`
- `apps/ecommerce-app/libs/graphql/src/Payment.ts`
- `apps/ecommerce-app/libs/graphql/src/File.ts`
- `apps/ecommerce-app/libs/graphql/src/License.ts`

Example pattern:

```ts
import { TypedDocumentNode } from '@apollo/client/core';
import gql from 'graphql-tag';
import { CartQuery, CartQueryVariables } from './generated';

export const CART_QUERY: TypedDocumentNode<CartQuery, CartQueryVariables> = gql`
  query Cart {
    cart {
      _id
    }
  }
`;
```

## UI Usage Pattern (Required)

### Before (v3 generated hook style)

```ts
import { useProductsQuery } from '~/graphql/generated';

const productsQuery = useProductsQuery({ variables: { first: 10 } });
```

### After (v4 document-based style)

```ts
import { useQuery } from '@apollo/client/react';
import { PRODUCTS_QUERY } from '~/graphql/Product';

const productsQuery = useQuery(PRODUCTS_QUERY, {
  variables: { first: 10 },
});
```

### Mutation pattern

```ts
import { useMutation } from '@apollo/client/react';
import { UPDATE_CART_ITEM_MUTATION } from '~/graphql/Cart';

const [updateCartItem] = useMutation(UPDATE_CART_ITEM_MUTATION);
```

## Migration Checklist Per File

1. Remove generated hook imports:
   - `useXxxQuery`
   - `useXxxMutation`
   - `useXxxLazyQuery`
2. Import `useQuery` / `useMutation` from `@apollo/client/react`.
3. Import operation documents from `~/graphql/<Domain>`.
4. Keep type imports from `~/graphql/generated` only when needed for enums/types.
5. Replace cache operations to use document constants (for example `PRODUCTS_QUERY`), not old generated `*Document` values when those are no longer used in the file.
6. Re-run typecheck.

## Codegen Notes for Apollo v4

Apollo guidance for React recommends document-based usage and not relying on generated React hook wrappers.

For codegen config, target plugins like:

- `typescript`
- `typescript-operations`
- `typed-document-node`

Avoid `typescript-react-apollo` for new v4-oriented setup.

If operations are defined in TypeScript files (current pattern in this repo), ensure `documents` includes `.ts/.tsx` globs (not only `.gql`), for example:

```ts
documents: './apps/ecommerce-app/libs/graphql/src/**/*.{ts,tsx,gql}';
```

## Validation Commands

Confirm no generated hooks remain:

```bash
rg -n "\buse[A-Za-z0-9_]+(Query|Mutation|LazyQuery)\b" apps/ecommerce-app -g '*.ts' -g '*.tsx'
```

Typecheck:

```bash
npx tsc -p apps/ecommerce-app/tsconfig.json --noEmit
```

## Known Migration Pitfall Encountered

Tailwind content tracking can fail with:

`ENOENT ... libs/graphql/src/gql.ts`

if globs are too broad and include stale/deleted file references. Keep Tailwind `content` globs focused on real source directories and avoid scanning deleted legacy GraphQL paths.

## Ongoing Rule For New Code

For all new GraphQL reads/writes in `ecommerce-app`:

1. Define or reuse a typed document in `libs/graphql/src/<Domain>.ts`.
2. Use `useQuery` / `useMutation` from `@apollo/client/react`.
3. Use `~/graphql/generated` only for shared types/enums.
4. Do not add new generated React hook usage.
