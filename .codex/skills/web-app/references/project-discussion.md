# Project Discussion — Q&A and Response Format

## When Answering Questions About This App

Keep answers grounded in the actual stack and reference the correct reference doc:

| Question is about | Reference doc |
|---|---|
| Where a file belongs | `references/folder-structure.md` |
| Whether a pattern is right | `references/common-anti-patterns.md` |
| State management decision | `references/state-management.md` |
| Server state vs. local state | `references/caching.md` |
| Performance optimization | `references/core-web-vitals.md`, `references/code-splitting.md` |
| Auth / session | `references/auth-patterns.md` |
| Data fetching / GraphQL | `references/graphql-patterns.md` |
| Toast / notifications | `references/notifications-toast.md` |
| Date formatting | `references/date-handling.md` |
| Forms / validation / react-hook-form | `references/forms.md` |
| File or image upload fields / presigned URLs | `references/upload-fields.md` |
| Rich text / Tiptap | `references/tiptap-richtext.md` |
| Drag and drop | `references/dnd-patterns.md` |
| Charts | `references/charts-recharts.md` |
| Error handling | `references/error-boundaries.md` |
| Zustand store | `references/zustand-patterns.md` |
| TypeScript typing question | `references/typescript-patterns.md` |
| Pure TypeScript unit tests / Node test runner | `references/testing.md` |
| React component architecture | `references/react-patterns.md` |
| Memoization (`useCallback` / `useMemo`) | `references/react-hooks.md` |
| SSR / hydration / rendering strategy | `references/nextjs-performance-seo.md` |
| SEO, metadata, sitemap, social previews | `references/nextjs-performance-seo.md` |
| Responsive layout / theming / styling | `references/responsive-design.md` |
| Accessibility | `references/accessibility.md` |
| Security concern | `references/security.md` |
| Analytics / tracking | `references/analytics-ga4-gtm.md` |
| Browser support / cross-browser bug | `references/browser-compatibility.md` |
| Lint / formatting | `references/eslint-prettier.md` |
| Dependency / upgrade question | `references/dependency-management.md` |

For anything not listed here, use the grouped quick reference map in `SKILL.md` — it covers every reference doc.

## Response Format

- Keep answers concise. Show a minimal code example when it clarifies the answer.
- If the answer requires checking existing code, check it before answering.
- When suggesting a pattern, verify a similar one doesn't already exist in the codebase first.

## Before Proposing a New Pattern

1. Check if a similar feature already exists in `features/`.
2. Check if a shared component already exists in `components/`.
3. Check if the operation is already in the data-fetching layer.

Match existing patterns before introducing anything new.
