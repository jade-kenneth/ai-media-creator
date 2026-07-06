# Folder Structure

## Folder Structure Rules

- Keep the route entry layer thin — treat route files as composition only.
- Push business logic, workflows, and domain-specific UI into `features/`.
- Keep low-level shared primitives in `components/ui/`.
- Use the root `components/` layer only for reusable shared components not owned by one feature.
- Use `providers/` for application-wide context, auth/session state, feature flags, and other cross-feature state.
- Use `graphql/`, `react-query/`, or the equivalent data layer for GraphQL documents, generated helpers, and query wiring grouped by backend domain.
- Use `hooks/` only for hooks shared across multiple features — keep feature-only hooks inside the feature first.
- Use `utils/` for React-independent helpers and constants.
- Use `types/` only when they are genuinely shared and not owned by one feature.
- Use `theme/` for design-system theme files, recipes, and styling tokens.
- Promote code to shared layers only when reuse is real or intentionally planned.
- Prefer a single file for a shared component until it needs related helpers, context, hooks, or subparts — then promote into its own folder with an `index.ts` boundary.
- Prefer domain folders over technical folders inside `features/`.
- Avoid deep nesting unless the module is genuinely large.

### Feature Shape (when justified)

```
features/<name>/
  index.ts             ← main feature entry
  components/          ← internal feature UI
  hooks/               ← internal feature hooks
  provider/            ← feature-scoped context
  utils/               ← internal helpers and constants
  types.ts
```

## Code Organization Rules

Organize code by feature or domain.

- Keep related components, hooks, types, and utilities close to the feature that owns them.
- Move logic into shared modules only when it is truly reused or intentionally shared.
- Avoid dumping unrelated code into global folders.
- Prefer feature colocation over separating files purely by type.
- Keep primitives in `components/ui/`, not mixed into feature folders unless they are feature-specific wrappers.
- Keep shared composite components in `components/`, not inside unrelated features.
- Keep route files focused on composition, guards, and layout — do not bury business logic in the route layer.
- Keep feature-specific GraphQL, query, and data usage close to the feature unless the app already centralizes that concern in a dedicated data layer.
- Prefer `index.ts` only at folder boundaries with a clear public surface.

---

This structure combines a domain-first frontend application layout with a generic SDK library shape. It keeps routing thin, pushes business logic into feature modules, and separates reusable UI from app-specific workflows.

## Recommended Structure

```text
.
├── components/
│   ├── ui/
│   │   └── ComponentName/
│   │       ├── ComponentName.tsx
│   │       ├── ComponentName.recipe.ts
│   │       └── index.ts
│   ├── core/
│   │   └── CompositeComponent/
│   │       ├── CompositeComponent.tsx
│   │       ├── CompositeComponentContext.tsx
│   │       ├── useCompositeComponent.ts
│   │       └── index.ts
│   ├── forms/
│   │   ├── FieldName.tsx
│   │   └── CompositeField/
│   │       ├── CompositeField.tsx
│   │       └── index.ts
│   ├── icons/
│   │   └── CustomIcon.tsx
│   ├── DataTable/
│   │   ├── DataTable.tsx
│   │   ├── DataTableContext.tsx
│   │   ├── Filter/
│   │   ├── ColumnControls/
│   │   └── index.ts
│   ├── PageHeader.tsx
│   ├── PermissionRequired.tsx
│   └── index.ts
├── config/
│   └── queryClient.ts
├── constants/
│   └── index.ts
├── features/
│   └── FeatureName/
│       ├── FeatureName.tsx
│       ├── FeatureNameContext.tsx
│       ├── CreateFeatureName.tsx
│       ├── UpdateFeatureName.tsx
│       ├── DeleteFeatureName.tsx
│       ├── hooks/
│       │   └── useFeatureName.ts
│       ├── components/
│       │   └── FeatureNameForm.tsx
│       ├── provider/
│       │   └── FeatureNameProvider.tsx
│       ├── types.ts
│       ├── utils.ts
│       └── index.ts
├── graphql/
│   ├── account.tsx
│   ├── report.tsx
│   ├── wallet.tsx
│   ├── trigger.tsx
│   └── possibleTypes.ts
├── hooks/
│   ├── useDisclosure.ts
│   ├── usePaginated.ts
│   └── useAccessValidator.ts
├── pages/
│   ├── _app.tsx
│   ├── _document.tsx
│   ├── globals.css
│   ├── index.tsx
│   └── route-group/
│       ├── index.tsx
│       └── nested-route.tsx
├── providers/
│   └── ProviderName/
│       ├── ProviderName.tsx
│       ├── useProviderName.tsx
│       ├── types.ts
│       ├── constants.ts
│       └── index.ts
├── theme/
│   ├── index.ts
│   └── theme/
│       └── components/
├── types/
│   ├── index.ts
│   └── GraphQLError.ts
├── utils/
│   ├── toaster.ts
│   ├── numberFormatter.ts
│   └── timezone.ts
├── libs/
│   └── sdk-library/
│       └── src/
│           ├── core/
│           │   ├── GraphQLClient.ts
│           │   ├── constants.ts
│           │   ├── middlewares.ts
│           │   ├── sha256.ts
│           │   ├── index.ts
│           │   ├── account/
│           │   ├── auth/
│           │   ├── extension/
│           │   ├── file/
│           │   ├── report/
│           │   │   ├── graphql/
│           │   │   ├── services.ts
│           │   │   ├── types.ts
│           │   │   └── index.ts
│           │   ├── trigger/
│           │   └── wallet/
│           ├── react/
│           │   ├── index.ts
│           │   └── AuthProvider/
│           │       ├── AuthProvider.tsx
│           │       ├── useAuth.ts
│           │       ├── types.ts
│           │       └── index.ts
│           └── react-query/
│               ├── AccessRole.ts
│               ├── Admin.ts
│               ├── ...
│               ├── Withdrawal.ts
│               ├── utils.ts
│               ├── index.ts
│               └── FeatureOrEntityName/
│                   ├── useSomethingQuery.ts
│                   ├── useSomethingMutation.ts
│                   └── index.ts
└── globals.d.ts
```

## Folder Responsibilities

### `components/`

Use this for reusable presentation and interaction building blocks.

- `ui/` contains design-system primitives such as buttons, dialogs, inputs, tabs, tables, and other shared low-level UI building blocks.
- Primitives should live under `components/ui/`, not at the root of `components/`.
- If a component is likely to be reused by multiple feature modules, place it under the root `components/` layer instead of inside a single feature.
- Shared components at the root of `components/` can be a single file when they are small and self-contained.
- Promote a shared component into its own folder when it is large enough or when it needs related files such as `utils.ts`, hooks, context, styles, lazy-loaded parts, or other code-splitting support.
- `core/` contains more advanced shared components that have their own internal context, anatomy, or composition model.
- `forms/` contains reusable field wrappers and form-specific adapters.
- `icons/` contains custom SVG icon components.
- `DataTable/` contains a reusable table system with filtering, pagination, and column controls.
- Root-level files in `components/` should be reserved for highly reusable app-wide components such as guards, page headers, and display helpers.

### `config/`

Use this for application-level runtime configuration and client setup.

- Examples: query clients, SDK initialization, app-wide configuration objects.

### `constants/`

Use this for shared constant values that do not belong to a single feature.

### `features/`

This is the main domain layer.

- Each folder represents one business capability or workflow.
- A feature owns its screens, local state, actions, feature-only helpers, and feature-only components.
- CRUD-style actions can live beside the main feature screen when they are tightly coupled.
- If a feature becomes large, add internal `hooks/`, `components/`, or `provider/` folders instead of leaking those files into shared layers too early.

### `graphql/`

Use this for frontend GraphQL documents, generated helpers, and GraphQL-specific client utilities grouped by backend domain.

### `hooks/`

Use this for generic hooks that are shared across multiple features.

- If a hook is only relevant to one feature, keep it inside that feature first.

### `pages/`

Use this for route entry points only.

- Keep page files thin.
- Pages should compose providers, guards, layouts, and feature components.
- Avoid putting business logic directly in route files unless the logic is route-specific.

### `providers/`

Use this for application-wide context providers and cross-cutting session or environment state.

- Examples: brand context, feature flags, export state, session switching, domain selection.

### `theme/`

Use this for the design system theme, component recipes, and styling tokens.

### `types/`

Use this for shared TypeScript types that are not owned by one feature.

### `utils/`

Use this for generic helpers that do not depend on React rendering and are shared across multiple parts of the app.

## Recommended Feature Template

Use this structure when creating a new feature module:

```text
features/
└── FeatureName/
    ├── FeatureName.tsx
    ├── FeatureNameContext.tsx
    ├── CreateFeatureName.tsx
    ├── UpdateFeatureName.tsx
    ├── DeleteFeatureName.tsx
    ├── hooks/
    ├── components/
    ├── types.ts
    ├── utils.ts
    └── index.ts
```

Guidelines:

- `FeatureName.tsx` is the main screen or container for the feature.
- `FeatureNameContext.tsx` is optional and should exist only when the feature has meaningful local shared state.
- `Create*`, `Update*`, `Delete*`, `View*`, or `Filter*` files should stay in the feature when they are not reused elsewhere.
- `components/` is for internal feature-only UI pieces.
- `hooks/` is for internal feature-only hooks.
- `index.ts` should expose the feature's public entry points.

## Rules For Keeping It Clean

- Keep `pages/` thin and domain logic in `features/`.
- Keep primitives in `components/ui/`.
- If a component can reasonably be reused across feature modules, move it to the root `components/` layer.
- Use a folder for a shared component when it grows beyond a single file or needs colocated helpers such as hooks, utils, context, or lazy-loaded subparts.
- Move code to `components/`, `hooks/`, `utils/`, or `types/` only when it is actually shared.
- Prefer domain folders over technical folders inside `features/`.
- Keep feature-specific GraphQL usage close to the feature, but keep shared GraphQL clients and generated support files in `graphql/`.
- Use `Context.tsx`, `types.ts`, and `utils.ts` only when the module is large enough to justify them.
- Prefer `index.ts` files for clean imports at the folder boundary.
- Avoid creating deep nesting unless the module is genuinely large.

## SDK Library Details

The main recommended structure above already includes a generic `libs/sdk-library/src` branch. The details below show generic layout and export conventions for this kind of library.

### `core/report/` example structure

```text
core/
└── report/
    ├── graphql/
    │   └── EntityName.ts
    ├── index.ts
    ├── services.ts
    └── types.ts
```

Notes:

- `graphql/` contains report-domain GraphQL documents and generated fragments or query constants grouped by entity.
- `services.ts` is the main integration layer that imports from `graphql/` and exposes report API functions.
- `types.ts` contains the generated report GraphQL types.
- `index.ts` re-exports the public report API.

Recommended `core/report/index.ts` pattern:

```ts
export * from './services';
export * from './types';
```

### `react/` exact structure

```text
react/
├── index.ts
└── AuthProvider/
    ├── AuthProvider.tsx
    ├── index.ts
    ├── types.ts
    └── useAuth.ts
```

Current export pattern:

```ts
// react/index.ts
export * from './AuthProvider';

// react/AuthProvider/index.ts
export * from './AuthProvider';
export * from './types';
```

### `react-query/` example structure

If a `react-query` domain grows too large, split it into a folder while keeping the same public API.

```text
react-query/
├── index.ts
├── utils.ts
└── FeatureOrEntityName/
    ├── useFeatureOrEntityNameQuery.ts
    ├── useCreateFeatureOrEntityNameMutation.ts
    └── index.ts
```

Recommended root `react-query/index.ts` pattern:

```ts
export * from './FeatureOrEntityName';
```

Recommended `react-query/FeatureOrEntityName/index.ts` pattern:

```ts
export * from './useFeatureOrEntityNameQuery';
export * from './useCreateFeatureOrEntityNameMutation';
```

Guidelines:

- Keep a flat file when a domain is still small and readable.
- Promote a domain file into its own folder when it starts collecting many queries, mutations, shared input types, or helper logic.
- Keep the folder boundary clean with an `index.ts` that re-exports the domain hooks.
- Keep shared `react-query` helpers in `react-query/utils.ts`.

## Summary

This version favors:

- domain-first `features/`
- thin route files in `pages/`
- reusable shared UI in `components/`
- cross-feature state in `providers/`
- centralized shared hooks, types, and utilities

It is generic enough for similar admin or dashboard applications while still matching the structure patterns already present in the current codebase.

---

## Related References

- `references/react-patterns.md` — § Colocation Pattern (feature-first organization)
- `references/graphql-patterns.md` — § File Structure for the data-fetching layer
- `references/core-principles.md` — instruction priority and the pattern-consistency rule
