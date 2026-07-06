# Common Anti-Patterns

Patterns to avoid across `apps/*-mobile`. Each entry names the anti-pattern, explains the harm, and points to the correct alternative.

---

## Query Over-Fetching for Count-Only Operations

Never reuse a full list query with `first: 1` just to read `totalCount`. The server still resolves the full entity fragment for that 1 node — all fields are fetched and transmitted even though you discard them.

```ts
// ❌ reuses the full list query just to steal totalCount
const requestsCountQuery = useMyDocumentRequestsQuery({ first: 1 });
const count = requestsCountQuery.data?.pages[0]?.myDocumentRequests.totalCount;

// ✅ dedicated count-only query — no edges, no fragment, no wasted fields
const requestsCountQuery = useMyDocumentRequestsCountQuery();
const count = requestsCountQuery.data?.myDocumentRequests.totalCount;
```

**GraphQL query shape for count-only:**

```graphql
# ✅ omit edges entirely — server returns only the integer
query MyDocumentRequestsCount {
  myDocumentRequests {
    totalCount
  }
}
```

**When it's NOT a violation:** reading `query.data?.pages[0]?.foo.totalCount` from a query that already powers a list (e.g. inside `use-*-list-data.ts` hooks that drive a screen's list) is fine — no extra query needed, `totalCount` is a free rider on an already-needed request.

**Trigger:** any time you see `first: 1` passed to a query whose only consumed field is `totalCount`.

---

## KeyboardAvoidingView — No `behavior="height"`

Always use `behavior="padding"` on `KeyboardAvoidingView`. Never use `behavior="height"` or `Platform.select({ ios: 'padding', android: 'height' })`.

```tsx
// ❌ hides inputs behind keyboard on Android
<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

// ✅ works correctly on both platforms
<KeyboardAvoidingView behavior="padding">
```

**Why:** `behavior="height"` shrinks the container but does not scroll the focused input into view on Android — confirmed bug on login screen.

---

## Redundant State Indicators

Do not stack multiple UI treatments that all communicate the same state unless each one adds unique information.

```tsx
// ❌ every signal repeats the same meaning
<Row>
  <CheckCircleIcon />
  <Badge label="Selected" />
  <Text>Currently selected</Text>
</Row>

// ✅ one primary signal, optional secondary detail only if it adds new information
<Row>
  <Badge label="Selected" />
</Row>
```

**Why:** redundant signals add visual noise, compete for attention, and make dense mobile layouts harder to scan.

**Allowed:** color + text for accessibility, or badge + metadata when the second element adds a distinct meaning.

---

## Re-Implementing a Shared Field Component Inline

When a shared field wrapper already exists for an input type (image/file picker, rich text, date picker, etc.), consume it through a form `Controller` instead of re-implementing its picker, preview, validation, and upload side effects again inside the new form/screen.

```tsx
// ❌ screen re-implements the whole image-pick + upload flow inline
const [asset, setAsset] = useState<ImagePickerAsset | null>(null);
async function uploadToStorage(a: ImagePickerAsset) { /* signed URL + PUT, duplicated */ }
// ...bespoke launchImageLibraryAsync + size/type checks + preview + remove

// ✅ reuse the shared field; hold its output value in the form
<Controller
  control={form.control}
  name="imageUrl"
  render={({ field }) => (
    <SharedUploadField
      value={field.value ?? ''}
      onChange={field.onChange}
      errorMessage={form.formState.errors.imageUrl?.message}
      disabled={isBusy}
    />
  )}
/>
```

**Why:** The bespoke copy drifts from the shared component — it misses later fixes (auth handling, path/prefix sanitization, size/type limits, permission and accessibility states) and re-introduces bugs the shared one already solved, while duplicating the upload logic the wrapper owns.

**How to apply:** Store the field's resolved output (e.g. the uploaded URL) in the form via `Controller`, validate that value in the zod schema, and gate submit on it. Only build a new inline implementation when no shared wrapper covers the input type.

---

## Anti-Pattern Reference

| Anti-Pattern                                      | Why It's Harmful                                            | What to Do Instead                                           |
| ------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------ |
| Raw `fetch`/`axios` for server state              | No caching, no deduplication, manual loading/error handling | Use TanStack Query hooks                                     |
| `useXxxQuery({ first: 1 })` to read `totalCount` | Server resolves full entity fragment for 1 node; wasted I/O | Create a dedicated count-only query with no `edges` selector |
| `behavior="height"` on `KeyboardAvoidingView`     | Input hidden behind keyboard on Android                     | Always use `behavior="padding"`                              |
| Icon + badge + helper copy all repeat one state   | Visual noise, weaker hierarchy, harder scanning             | Keep one primary indicator; add others only for new meaning  |
| Multiple `useState` for related values            | Impossible state combinations, inconsistent updates         | `useReducer` with typed actions                              |
| `setState` inside `useEffect` on the same value   | Infinite re-render loop                                     | Use functional updater; see `react-hooks.md`                 |
| `as` casts or `!` assertions to silence TypeScript| Masks real type errors, hides bugs                          | Fix the type; narrow properly                                |
| Re-implementing a shared field/upload flow inline | Drifts from the shared component; misses its fixes, dupes logic | Reuse the shared field via `Controller`; store its output value |
