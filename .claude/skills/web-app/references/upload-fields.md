# Upload Fields - Presigned URL Recipe

Use a shared upload field wrapper for file and image inputs. The form should store the resolved output value, such as a public URL or storage object identifier. The shared field owns file picking, preview, validation, upload side effects, and accessible state.

---

## Standard Contract

Shared upload fields should support the same form contract as other controlled fields:

```ts
type UploadFieldProps = {
  value: string;
  onChange: (value: string) => void;
  errorMessage?: string;
  disabled?: boolean;
};
```

Consume the field through `Controller`:

```tsx
<Controller
  control={form.control}
  name="imageUrl"
  render={({ field, fieldState }) => (
    <ImageUploadField
      value={field.value ?? ''}
      onChange={field.onChange}
      errorMessage={fieldState.error?.message}
      disabled={isBusy}
    />
  )}
/>
```

Rules:

- Store only the resolved value in form state, not the `File` object.
- Validate the resolved value in the zod schema.
- Pass the parent busy state down so upload controls cannot race with submit.
- Use `useWatch({ control, name })` when submit gating needs the field value; never call `form.watch()` in render.

---

## Presigned URL Flow

The shared field should implement the whole upload flow in one place:

1. User picks or drops a file.
2. Field validates file type, size, and count before any network request.
3. Field asks the API for a presigned URL using upload intent, such as namespace, content type, and file size.
4. API returns an upload URL plus the resolved value that the form should store.
5. Field uploads the file with `PUT` to the presigned URL.
6. Field calls `onChange(resolvedValue)` only after the upload succeeds.
7. Field exposes upload progress, pending, success, remove, and error states accessibly.

```ts
async function uploadWithPresignedUrl(file: File): Promise<string> {
  const presignResult = await createPresignedUploadUrl({
    contentType: file.type,
    size: file.size,
    namespace: 'images',
  });

  await fetch(presignResult.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });

  return presignResult.publicUrl;
}
```

Do not let the browser invent final shared-folder object paths. The client sends intent; the server creates the storage key, expiry, permissions, and returned value.

---

## Field Responsibilities

The shared field owns:

- Hidden native file input plus styled trigger/dropzone.
- File type and size checks before requesting a presigned URL.
- Preview URL creation and cleanup with `URL.revokeObjectURL`.
- Upload pending/progress state.
- Abort, ignore-stale-result, or disable behavior when the selected file changes during upload.
- Remove/clear action that calls `onChange('')`.
- Error copy for validation failures and upload failures.
- Accessible labels, descriptions, status text, and keyboard operation.

The parent form owns:

- Schema validation of the resolved value.
- Submit gating and mutation busy state.
- Save/cancel lifecycle.
- Server mutation that persists the resolved value with the rest of the form.

---

## Accessibility Requirements

- The trigger has a clear accessible name, such as "Upload profile image".
- The hidden file input remains associated with the visible label or trigger.
- Pending and success states are announced through a polite live region.
- Validation and upload errors render near the control with `role="alert"` and are referenced with `aria-describedby`.
- Remove buttons include the target in their accessible name, such as "Remove selected image".
- Dropzones also support keyboard selection; drag-and-drop must never be the only path.

---

## Error Handling

- Reject unsupported files before requesting a presigned URL.
- Show one clear local error for size/type problems.
- Use the app's standard error-explaining helper for failed presign or upload requests.
- Do not call `onChange` with a final value until the upload has completed.
- Do not clear the previous saved value on a failed replacement upload unless the user explicitly removes it.

---

## Anti-Patterns

- Re-implementing picker, preview, validation, and upload logic inside each form.
- Storing `File` objects in react-hook-form state.
- Calling the form submit mutation before the upload has completed.
- Generating final storage keys in the client.
- Accepting every file type and relying on server rejection for basic checks.
- Leaking object URLs by creating previews without cleanup.
- Making drag-and-drop the only way to select a file.

---

## Related References

- `references/forms.md` - `Controller`, schema validation, submit gating, and reset lifecycle
- `references/security.md` - file upload security checks and storage-key ownership
- `references/caching.md` - why uploads should not use optimistic updates by default
- `references/accessibility.md` - form labels, errors, live regions, and keyboard access
- `references/browser-compatibility.md` - native file input and drag/drop browser watchouts
- `references/notifications-toast.md` - clear user-facing upload error copy
