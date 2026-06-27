# Rich Text Utilities

## Plain Text Extraction

Use `string-strip-html` to strip HTML tags and decode entities from rich text HTML strings. Never use a custom regex chain — it misses edge cases (nested tags, non-standard entities, CDATA sections, comments):

```ts
import { stripHtml } from 'string-strip-html';

export function getPlainTextFromRichTextHtml(value: string): string {
  return stripHtml(value).result;
}
```

`stripHtml(value).result` handles:
- All HTML tag removal
- Full HTML entity decoding (`&nbsp;`, `&amp;`, `&lt;`, `&gt;`, named and numeric entities)
- Whitespace collapsing

---

## When to Use

`getPlainTextFromRichTextHtml` (or `stripHtml` directly) is called when you need plain text from an HTML string stored in the API:

```ts
// Derive a one-line preview for a list item
const preview = getPlainTextFromRichTextHtml(announcement.content);

// Truncate for a notification body
const body = getPlainTextFromRichTextHtml(htmlContent).slice(0, 160);

// Check if the user actually entered content (not just empty tags)
const hasContent = getPlainTextFromRichTextHtml(htmlValue).trim().length > 0;
```

---

## Rendering Rich Text HTML

To render HTML content in the app use a WebView or a custom HTML renderer — never render raw HTML strings as text. The `Prose` component wraps this pattern:

```tsx
import { Prose } from '@/components/ui/prose';

<Prose html={announcement.content} />
```

`Prose` handles sanitization, link handling, and basic typography styling. Do not pass raw HTML directly to any native `Text` component — it will display the tags literally.

---

## Rules

- Never replace `string-strip-html` with a manual `.replace(/<[^>]*>/g, ' ')` chain — library handles all edge cases correctly
- Always call `getPlainTextFromRichTextHtml` from `utils/rich-text.ts` — do not import `stripHtml` directly in feature code
- Plain text is for preview/truncation/validation only — preserve the original HTML for storage and rendering
- Use `Prose` for display — not `dangerouslySetInnerHTML` (web only) or raw `Text`
