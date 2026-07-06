# Folder Structure & Code Organization

## Folder Structure Rules

Use the repository folder structure guide as the source of truth for structure decisions.

- Keep route or screen entry files thin.
- Push business logic, workflows, and domain-specific UI into `features/`.
- Keep low-level shared primitives in `components/ui/`.
- Use the root `components/` layer only for reusable shared components that are not owned by one feature.
- Use `providers/` for application-wide context, auth/session state, feature flags, and other cross-feature state.
- Use `api/`, `graphql/`, `react-query/`, or the equivalent data layer grouped by backend domain.
- Use `hooks/` only for hooks shared across multiple features. Keep feature-only hooks inside the feature first.
- Use `utils/` for React-independent helpers and constants.
- Use `types/` only when they are genuinely shared and not owned by one feature.
- Use `theme/` for design-system theme files, recipes, and styling tokens.
- Promote code to shared layers only when reuse is real or intentionally planned.
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

---

## Code Organization Rules

Organize code by feature or domain.

- Keep related components, hooks, types, and utilities close to the feature that owns them.
- Move logic into shared modules only when it is truly reused or intentionally shared.
- Avoid dumping unrelated code into global folders.
- Prefer feature colocation over separating files purely by type.
- Keep primitives in `components/ui/`, not mixed into feature folders unless they are feature-specific wrappers.
- Keep shared composite components in `components/`, not inside unrelated features.
- Keep screen entry files focused on composition, guards, and layout.
- Keep feature-specific GraphQL, query, and data usage close to the feature unless the app already centralizes that concern in a dedicated data layer.
- Prefer `index.ts` only at folder boundaries with a clear public surface.

---

## Related References

- `references/react-patterns.md` § Colocation Pattern — feature-first vs type-based organization with examples
- `references/core-principles.md` — the pattern-consistency and simplicity rules that drive placement decisions
- `references/graphql-patterns.md` — where GraphQL operations and typed hooks live per feature
