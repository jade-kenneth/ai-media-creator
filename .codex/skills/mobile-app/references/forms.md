# Forms

## Stack

- `react-hook-form` (`useForm`) for form state management.
- `zod` for schema validation — define schemas separately from components.
- `useFieldArray` for dynamic array fields (never manage arrays manually with `useState`).

## Pattern

```tsx
const schema = z.object({
  name: z.string().min(1, 'Required'),
  contacts: z.array(z.object({ phone: z.string() })),
});

const { control, handleSubmit } = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema),
  defaultValues: { name: '', contacts: [] },
});

const { fields, append, remove } = useFieldArray({ control, name: 'contacts' });
```

## Rules

- Always pair `useForm` with a `zod` schema — no ad-hoc validation logic.
- Use `useFieldArray` for any field that is an array — never `useState` + manual splice.
- Keep schema definitions outside the component, in the same file or a sibling `schema.ts`.
- Use `Controller` from react-hook-form to connect controlled native inputs (`TextInput`, pickers, etc.).
- Show inline validation errors below each field — never only on submit.
- Disable the submit button while `isSubmitting` is true.
