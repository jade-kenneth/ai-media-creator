# Form Field States — Visual System

## State Inventory

Every form field must support all applicable states. Missing states = incomplete implementation.

| State | When |
|---|---|
| Default | Idle, no interaction |
| Focused | Currently active input (`focus-visible`) |
| Filled | Has a value |
| Error / invalid | Validation failed, field marked invalid |
| Success | Explicitly confirmed valid (use sparingly) |
| Disabled | User cannot interact |
| Read-only | Displays value, not editable |
| Loading | Options or value is being fetched |

---

## Input Field States

shadcn's `Input`, `Textarea`, `Select`, `Combobox` components handle most states via `data-*` attributes and Tailwind variants. The key patterns:

```tsx
// Default + focus handled by shadcn/Tailwind
<Input placeholder="Enter name" />

// Error state — pass aria-invalid and render error message below
<Input
  aria-invalid={!!error}
  className={error ? 'border-destructive focus-visible:ring-destructive' : ''}
/>
{error && (
  <p className="text-xs text-destructive mt-1">{error.message}</p>
)}

// Disabled
<Input disabled placeholder="Not editable" />

// Read-only
<Input readOnly value={displayValue} className="bg-muted/50 text-muted-foreground" />
```

---

## Form Field Wrapper Pattern

Use `react-hook-form`'s `Controller` with shadcn components:

```tsx
<FormField
  control={form.control}
  name="email"
  render={({ field, fieldState }) => (
    <FormItem>
      <FormLabel>Email</FormLabel>
      <FormControl>
        <Input
          {...field}
          type="email"
          placeholder="resident@example.com"
          aria-invalid={!!fieldState.error}
        />
      </FormControl>
      <FormDescription>Used for login and notifications.</FormDescription>
      <FormMessage /> {/* Renders fieldState.error.message */}
    </FormItem>
  )}
/>
```

---

## Label Rules

- Always use `<FormLabel>` (or `<label>`) — never rely on `placeholder` as the only label.
- Labels go **above** the field, never beside it (admin form convention).
- For required fields, append `*` to the label text — do not use an extra `<span>` with aria tricks unless you also handle `aria-required` on the input.
- `FormDescription` is for helper text (hint), not for error text.

---

## Helper Text vs. Error Text

| Element | Purpose | Color |
|---|---|---|
| `FormDescription` | Hint / helper (always visible) | `text-muted-foreground text-xs` |
| `FormMessage` | Error (only when invalid) | `text-destructive text-xs` |

Never use `FormMessage` for success feedback — surface success at the form level (toast), not the field level.

---

## Select / Combobox States

```tsx
// Error state on Select
<Select onValueChange={field.onChange} value={field.value}>
  <SelectTrigger
    className={fieldState.error ? 'border-destructive' : ''}
    aria-invalid={!!fieldState.error}
  >
    <SelectValue placeholder="Select a category" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
  </SelectContent>
</Select>
```

---

## Checkbox / Switch States

```tsx
// Checkbox with label + description
<FormField
  control={form.control}
  name="notify"
  render={({ field }) => (
    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
      <FormControl>
        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
      </FormControl>
      <div className="space-y-1 leading-none">
        <FormLabel>Send push notification</FormLabel>
        <FormDescription>Notify registered residents immediately.</FormDescription>
      </div>
    </FormItem>
  )}
/>
```

---

## Loading State on Submit Button

Always show loading feedback during submission:

```tsx
const isSubmitting = form.formState.isSubmitting;

<Button type="submit" disabled={isSubmitting}>
  {isSubmitting ? (
    <>
      <Loader2 className="size-4 animate-spin" />
      Saving...
    </>
  ) : (
    'Save'
  )}
</Button>
```

Also disable the form's cancel/close button while submitting:

```tsx
<Button
  type="button"
  variant="outline"
  onClick={() => onOpenChange(false)}
  disabled={isSubmitting}
>
  Cancel
</Button>
```

---

## Form Error Summary (Complex Forms)

For multi-section forms with many fields, add a summary at the top when submission fails:

```tsx
{Object.keys(form.formState.errors).length > 0 && (
  <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
    Please fix the errors below before submitting.
  </div>
)}
```

---

## Anti-Patterns

- Do not use `placeholder` as the only label — always pair with a visible `<FormLabel>`.
- Do not show error messages in a toast alone — always mark the field invalid and show inline error text.
- Do not disable the submit button based on `!form.formState.isDirty` by default — it confuses users who haven't changed anything but need to resubmit.
- Do not forget to disable the cancel button during submission — the dialog should be locked while in-flight.
- Do not use green border/ring as a "success" state on inputs — use it only in explicitly verified field flows.
