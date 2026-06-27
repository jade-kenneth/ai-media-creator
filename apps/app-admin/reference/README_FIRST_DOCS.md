# Feature Development Standards (Repository-Specific)

These standards are tailored to this repository's setup.
They are not universal across all projects. If a target repository uses a different stack or architecture, ignore non-applicable items and follow that repository's conventions.

## Frontend Baseline

1. Ensure mobile responsiveness for user-facing interfaces.
2. For frontend forms, use `useForm`.
3. For frontend form validation, use `zod`.
4. For frontend forms with array fields, use `useFieldArray`.
5. Consider and optimize Lighthouse metrics: Performance, Accessibility, Best Practices, and SEO.

## GraphQL and Data Access Standards (Apollo v4)

1. Define operations as typed document exports in `apps/ecommerce-app/libs/graphql/src/<Domain>.ts` (for example `Cart.ts`, `Product.ts`).
2. Use `useQuery` / `useMutation` from `@apollo/client/react` with document constants (for example `useQuery(CART_QUERY)`).
3. Do not use generated React hook wrappers (`useXxxQuery`, `useXxxMutation`, `useXxxLazyQuery`) in UI code.
4. Use `~/graphql/generated` for shared types/enums/scalars only (for example `OrderStatus`, `CategoryType`, `AccountType`).
5. Keep operation names unique and PascalCase (for example `CheckoutMethodSettings`, `UpdatePaymentMethodStatus`).
6. For GraphQL data access in frontend code, prefer Apollo hooks or `apolloClient` from config instead of ad-hoc HTTP requests (`axios`/raw `fetch`) except explicit upload/multipart cases.
7. For full migration details and examples, see `APOLLO_V3_TO_V4_MIGRATION_DOCS.md`.

## Acceptance Criteria

- New/changed operations exist in `apps/ecommerce-app/libs/graphql/src/<Domain>.ts` as typed documents.
- UI code uses `useQuery` / `useMutation` with document constants.
- UI code does not use generated React hook wrappers.
- Shared enums/types may be imported from `~/graphql/generated`.
- GraphQL codegen/typecheck passes.

## Form Field Structure Standards

Use `Field` wrappers consistently for frontend forms.

1. Wrap each form control in `Field.Root`.
2. Use `Field.Label` for labels (do not use plain `<label>` directly in form blocks).
3. For required fields, set `invalid` on `Field.Root` using form error state (for example `invalid={!!form.formState.errors.firstName}`).
4. For required fields, render `Field.ErrorText` only when the field has a validation error message.
5. Keep `Field.Label htmlFor` and input `id` aligned.
6. This structure applies to `Input`, `DebounceInput`, `Textarea`, and other field controls used in forms.

Reference structure:

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

  <Field.ErrorText>{form.formState.errors.firstName.message}</Field.ErrorText>
</Field.Root>
```
