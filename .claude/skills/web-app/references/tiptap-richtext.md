# Rich Text Editor — Tiptap

## Overview

Tiptap is a headless, extension-based rich text editor built on ProseMirror. It provides the editor engine — you own the toolbar and UI. Integrate it via a compound component pattern rather than building ad hoc editor instances per form field.

---

## Core Setup

```ts
// Install the extensions your editor needs
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';

function useRichTextEditor({ value, onChange, placeholder }: RichTextEditorOptions) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
      Image,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return editor;
}
```

---

## Compound Component Pattern (Recommended)

Expose the editor as a compound component so toolbar and content are composable without prop drilling:

```tsx
// RichText/index.tsx
export const RichText = {
  Root,           // wraps EditorProvider + context
  Content,        // renders EditorContent
  Toolbar,        // layout wrapper for toolbar buttons
  BoldTrigger,    // editor.chain().focus().toggleBold().run()
  ItalicTrigger,
  UnderlineTrigger,
  BulletListTrigger,
  OrderedListTrigger,
  LinkTrigger,
  HeadingTrigger,
  ImageTrigger,
  UndoTrigger,
  RedoTrigger,
  CharactersCount,
};

// Usage
<RichText.Root value={html} onValueChange={setHtml} placeholder="Start typing...">
  <RichText.Toolbar>
    <RichText.BoldTrigger />
    <RichText.ItalicTrigger />
    <RichText.LinkTrigger />
    <RichText.BulletListTrigger />
  </RichText.Toolbar>
  <RichText.Content />
  <RichText.CharactersCount limit={2000} />
</RichText.Root>
```

---

## Form Integration (react-hook-form)

Wrap the editor in a `Controller`:

```tsx
<Controller
  control={form.control}
  name="content"
  render={({ field, fieldState }) => (
    <div className="space-y-1.5">
      <label htmlFor="content" className="text-sm font-medium">Content</label>
      <RichText.Root
        id="content"
        value={field.value}
        onValueChange={field.onChange}
        invalid={!!fieldState.error}
        placeholder="Write your announcement..."
      >
        <RichText.Toolbar>
          <RichText.BoldTrigger />
          <RichText.ItalicTrigger />
          <RichText.BulletListTrigger />
        </RichText.Toolbar>
        <RichText.Content />
      </RichText.Root>
      {fieldState.error && (
        <p className="text-xs text-destructive">{fieldState.error.message}</p>
      )}
    </div>
  )}
/>
```

---

## Content Format

Tiptap produces and accepts **HTML strings** via `editor.getHTML()` and `content: htmlString`. Store and retrieve as a `string` field in your data model.

When displaying rich text outside the editor, render it safely with sanitized HTML:

```tsx
// Display only — not editable
<div
  className="prose prose-sm max-w-none"
  dangerouslySetInnerHTML={{ __html: sanitize(htmlContent) }}
/>
```

Always sanitize before rendering with `dangerouslySetInnerHTML`. Consider `DOMPurify` or a similar library if the HTML comes from user input.

---

## Image Upload Pattern

Intercept image insertions to upload the file to your storage and insert the resulting URL:

```ts
Image.configure({
  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handleDrop(view, event) {
            const file = event.dataTransfer?.files?.[0];
            if (!file?.type.startsWith('image/')) return false;

            uploadImage(file).then((url) => {
              const { schema } = view.state;
              const node = schema.nodes.image.create({ src: url });
              const transaction = view.state.tr.replaceSelectionWith(node);
              view.dispatch(transaction);
            });

            return true;
          },
        },
      }),
    ];
  },
}),
```

---

## Adding Extensions

Do not add extensions inside individual form components — extend the shared editor configuration once:

```ts
// Bad — adding extensions per usage site
const editor = useEditor({ extensions: [StarterKit, MyExtension] });

// Good — configure extensions in the shared useRichTextEditor hook
export function useRichTextEditor(options: Options) {
  return useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link,
      Image,
      // Add new extensions here, in one place
    ],
    ...
  });
}
```

---

## Toolbar Button Pattern

Each trigger button accesses the editor via context and uses the Tiptap chain API:

```tsx
function BoldTrigger() {
  const editor = useCurrentEditor();
  if (!editor) return null;

  return (
    <Toggle
      size="sm"
      pressed={editor.isActive('bold')}
      onPressedChange={() => editor.chain().focus().toggleBold().run()}
      aria-label="Bold"
    >
      <Bold className="size-4" />
    </Toggle>
  );
}
```

---

## Extracting Plain Text

Use `string-strip-html` to convert rich text HTML to plain text. Never use a custom regex chain for this — regex-based stripping misses edge cases (nested tags, non-standard entities, CDATA sections, comments):

```ts
import { stripHtml } from 'string-strip-html';

export function getPlainTextFromRichTextHtml(value: string): string {
  return stripHtml(value).result;
}
```

`stripHtml(value).result` handles tag removal, all HTML entity decoding (`&nbsp;`, `&amp;`, `&lt;`, `&gt;`, named and numeric entities), and whitespace collapsing.

Use cases — `getPlainTextFromRichTextHtml` is called:
- In a zod `.transform()` to strip HTML before sending a field to the API
- To derive a plain-text preview or truncated summary from stored HTML content
- Before a word/character count check on a rich text field value

```ts
// zod schema transform
z.string().transform(getPlainTextFromRichTextHtml)

// Imperative strip before API call
const plainBody = getPlainTextFromRichTextHtml(htmlContent);
```

---

## Anti-Patterns

- Do not call `useEditor()` directly in form components — create a shared hook or compound component.
- Do not store the Tiptap `Editor` instance in React state — use a `ref`.
- Do not render HTML from the editor with `dangerouslySetInnerHTML` without sanitizing.
- Do not add extensions in multiple places — centralize the extension list.
- Do not use `editor.getHTML()` in a `useEffect` dependency array — it returns a new string on every render.

---

## Related References

- `references/code-splitting.md` — editors are heavy imports; keep them in lazy-loaded feature children
- `references/forms.md` — `Controller` integration, validation, and submit gating for editor fields
- `references/upload-fields.md` — shared presigned-URL upload flow for images/files inserted through editors
- `references/common-anti-patterns.md` — § Re-Implementing a Shared Field Component Inline
