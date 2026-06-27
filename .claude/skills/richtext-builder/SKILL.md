---
name: richtext-builder
description: Build or rebuild a RichText (Wysiwyg) component by porting WysiwygReference to the current app's dependency set. Use this skill whenever the user asks to create, rebuild, port, or fix a RichText or Wysiwyg editor component. Trigger on requests like "build the RichText", "rebuild Wysiwyg", "port WysiwygReference", "fix the RichText editor", or "create a rich text editor component".
---

# RichText Builder

This skill builds a `RichText` component by porting `WysiwygReference` (found in `references/` alongside this file) to the current app's dependency set.

Before starting, **ask the user for the target output path** if it hasn't been specified (e.g. `components/RichText/`).

## How to use this skill

1. **Read this file fully** — it contains all constraints and rules.
2. **Read all files in `references/`** — `WysiwygReference` is the single authoritative source for architecture, file structure, context boundaries, hook shape, and public API. Do not deviate from it unless a dependency is unsupported.
3. **Discover shadcn components via MCP before implementing:**
   - `mcp__shadcn__get_project_registries` → confirm registries
   - `mcp__shadcn__search_items_in_registries` → find relevant components
   - `mcp__shadcn__view_items_in_registries` → inspect component details
   - `mcp__shadcn__get_add_command_for_items` → generate add commands

---

## Goal

Rebuild `RichText` by copying the **structure, architecture, composition model, and folder/file layout** of `WysiwygReference` as closely as possible.

`WysiwygReference` is the **only** reference for:

- component architecture
- file splitting
- provider/context boundaries
- hook/store shape
- feature ownership
- composition pattern
- public API mindset

Do **not** use any other editor implementation as an architectural reference.

---

## Critical Constraint

Copy `WysiwygReference` code structure, architecture, and folder/file layout **strictly and completely**. Do not deviate from the structure unless a dependency is unsupported and has no supported equivalent.

Although `WysiwygReference` is the only code and architecture reference, its original implementation uses some dependencies and aliases that may not be supported in the target app. You must therefore:

- copy the `WysiwygReference` code structure exactly
- copy the `WysiwygReference` architecture exactly
- copy the `WysiwygReference` file/folder breakdown exactly
- keep the `WysiwygReference` behavioral responsibilities exactly
- replace only the dependencies that are unsupported — everything else stays identical

---

## Priority Order (Strict)

When instructions compete, resolve in this order:

1. `WysiwygReference` architecture and file/folder composition (non-negotiable).
2. Existing app RichText UI and interaction parity (non-negotiable).
3. shadcn pre-built component usage (required only when it preserves #2).

If a pre-built component choice changes visible layout/interaction from the current RichText baseline, do not ship that change.

---

## UI Rule

Use the app's existing component and styling patterns **exactly and only**. The UI must follow the exact current app UI direction — no deviations, no second design language.

The visual/interaction baseline is the currently used Wysiwyg/RichText experience in this app (toolbar layout, control behavior, spacing rhythm, card/surface patterns, and control semantics). Preserve this baseline exactly.

At minimum, use these `components/ui` files when relevant:

- `components/ui/button.tsx`
- `components/ui/card.tsx`
- `components/ui/input.tsx`
- `components/ui/separator.tsx`
- `components/ui/tooltip.tsx`
- `components/ui/scroll-area.tsx`
- `components/ui/toggle.tsx`

Do **not** treat these as low-level primitives to hand-compose replacements for existing shadcn patterns.

Use **pre-built shadcn components first**. If a pre-built component exists for the behavior, use it instead of custom composition.

Also utilize additional **shadcn pre-built components** when they better match `WysiwygReference` behavior:

- prefer `toggle` or `toggle-group` components for toolbar trigger buttons only when they do not break editor selection or command execution
- prefer `popover`-based components for link/image URL input instead of `window.prompt`
- prefer `dropdown-menu` for heading level selectors or alignment pickers
- avoid building custom controls from generic `button`/`input` wrappers when a matching shadcn pre-built exists
- do not replace existing RichText interaction patterns solely to satisfy a pre-built pattern

### Critical Toolbar Interaction Rule

Selection-preserving command execution is mandatory.

- Inline/editor commands such as `bold`, `italic`, `underline`, `strike`, `bullet list`, `ordered list`, `blockquote`, `code block`, `hard break`, `undo`, and `redo` must preserve the active TipTap selection.
- Do not rely on plain `onClick` alone when the trigger can steal focus first.
- Prefer running the TipTap command during `onMouseDown` or `onPointerDown` with `event.preventDefault()` so the editor selection remains intact.
- If a pre-built `toggle` / `toggle-group` primitive interferes with command execution or selection preservation, do **not** use it for the command path. Fall back to a styled `button` that matches the app UI exactly.
- Do not gate these toolbar commands with `editor.can().chain()...run()` when that incorrectly disables otherwise valid actions. Disabled state should usually reflect only `!editor`, `disabled`, or `readOnly` unless a command has a proven unsupported state.
- Heading/alignment dropdown items and link/image popovers may use different interaction patterns, but inline format buttons must be validated specifically against selection loss.

### Critical Image Trigger Rule

File input opening must use a browser-safe interaction path.

- Do not assume `input.click()` or `showPicker()` will work reliably for hidden file inputs inside toolbars, dialogs, popovers, or tooltip-wrapped controls.
- Prefer a native `<label htmlFor="...">` trigger targeting the file input when the image action is "choose a file". This is more reliable than simulated clicks for browser-trusted file selection.
- Do not use `display: none` / `className="hidden"` for the file input when the trigger depends on browser-native file selection. Keep the input in the DOM with a visually hidden technique instead.
- If `showPicker()` is used as an enhancement, wrap it in a `try/catch` and fall back immediately. Do not let a rejected picker call abort the file-open path.
- Do not reuse selection-preserving `onMouseDown` command behavior for file-picker triggers. Image selection usually needs a normal trusted browser activation path instead of an editor command path.

### Critical Trigger Typing Rule

Trigger prop getters must match the element that actually renders them.

- Do not mechanically port Ark `HTMLArkProps<'button'>` to `React.ComponentPropsWithRef<'button'>` for every trigger. That is only correct when the React port still renders a real `button`.
- If the React port intentionally renders a different element, such as a native `<label>` for the image picker trigger, do one of these:
  - return props typed for that actual element, or
  - return an explicit shared trigger state type instead of raw intrinsic button props
- Do not index custom `data-*` keys such as `data-invalid`, `data-readonly`, `data-required`, `data-focus`, or `data-disabled` from `ButtonHTMLAttributes` and assume TypeScript will accept them. JSX accepts `data-*`, but React's button prop types do not expose those keys for safe indexed access.
- When shared trigger state is needed across multiple trigger components, prefer a small explicit type such as `TriggerStateProps` or `SharedTriggerState` that declares:
  - `id`
  - `disabled`
  - `aria-label`
  - optional `aria-pressed`
  - the known RichText `data-*` state attributes
- For `asChild` trigger wrappers, type the props for the child element being rendered, not the wrapper's default intrinsic element.
- For the image trigger specifically, keep the browser-safe `<label htmlFor="...">` path and derive `aria-disabled` / `data-disabled` from explicit state rather than reading undeclared `data-*` keys off button-typed props.
- Treat this as a required review point whenever adapting Ark props to React DOM props. A RichText port is not done until the chosen trigger prop types survive `tsc` without `data-*` indexing errors.

### Critical Responsive Layout Rule

The editor must size from its parent container, not from toolbar content.

- The RichText root, control wrapper, and content shell must allow shrinking with `w-full` and `min-w-0` where appropriate.
- Do not introduce intrinsic-width toolbar layouts such as `min-w-max`, fixed content widths, or breakpoint rules that switch the toolbar back to content-sized sizing.
- Toolbar controls may wrap when needed. Do not force nowrap behavior that makes the editor overflow its parent.
- Collapse non-essential button labels at smaller breakpoints before allowing the component to overflow.
- The editor should adapt inside dialogs, cards, columns, and narrow form layouts without requiring parent-specific hacks.

### Required Verification For Toolbar Commands

Before considering the component done, verify all of the following:

- Select text, then click `Bold` → text becomes bold.
- Select text, then click `Italic` → text becomes italic.
- Select text, then click `Underline` / `Strike` → formatting applies visibly.
- Place the caret in a paragraph, then click bullet/ordered list → list toggles correctly.
- `Undo` / `Redo` work from toolbar buttons.
- Trigger clicks do not collapse the editor selection before the command runs.
- Trigger active state updates after formatting changes.
- Click `Insert image` → browser file picker opens.
- Choose an image file → image is inserted into the editor after upload / file resolution.
- Place the editor inside a narrow parent container or mobile-width dialog → the RichText width follows the parent and does not overflow because of the toolbar.

Use no other UI system. This is non-negotiable:

- do not use Ark UI components (`ark.div`, `ark.button`, `HTMLArkProps`, `mergeProps` from ark)
- do not use `@ark-ui/react/factory`, `@ark-ui/react/anatomy`, or `@ark-ui/react/utils`
- do not use Ark context helpers (`createContext` from ark, `useFieldContext`, `useEnvironmentContext`, `useLocaleContext`)
- do not use `@untitled-theme/icons-react`
- do not use unsupported path aliases such as `~/...`

Use only supported imports available in the current app and installed packages it already uses.

---

## File/Folder Structure Requirement

Mirror the `WysiwygReference` package structure as closely as possible.

Expected target structure (relative to the output path):

```text
RichText/
  index.ts
  RichText.ts
  RichTextRoot.tsx
  RichTextContext.tsx
  RichTextContent.tsx
  RichTextControl.tsx
  RichTextCharactersCount.tsx
  RichTextBubbleMenu.tsx
  RichTextFloatingMenu.tsx
  RichTextImageHiddenInput.tsx
  RichTextBoldTrigger.tsx
  RichTextItalicTrigger.tsx
  RichTextUnderlineTrigger.tsx
  RichTextStrikeTrigger.tsx
  RichTextHeadingTrigger.tsx
  RichTextBulletListTrigger.tsx
  RichTextOrderedListTrigger.tsx
  RichTextBlockquoteTrigger.tsx
  RichTextCodeBlockTrigger.tsx
  RichTextHardBreakTrigger.tsx
  RichTextLinkTrigger.tsx
  RichTextImageTrigger.tsx
  RichTextTextAlignTrigger.tsx
  RichTextUndoTrigger.tsx
  RichTextRedoTrigger.tsx
  useRichText.ts
  useRichTextContext.ts
```

If a `WysiwygReference` file exists, `RichText` should generally have a corresponding file with the same responsibility. Do not collapse the package into one file unless absolutely impossible.

---

## Architecture Requirement

Preserve the `WysiwygReference` architecture:

1. `useRichText.ts` owns the compositional state model — editor initialization, all `get*Props()` methods, character count state.
2. `RichTextRoot.tsx` is the top-level composition shell — accepts props, calls `useRichText`, provides context.
3. `useRichTextContext.ts` exposes shared editor state via React context.
4. `RichTextContext.tsx` is the render-prop context accessor component.
5. `RichTextContent.tsx` renders `EditorContent` from `@tiptap/react`.
6. `RichTextControl.tsx` is the toolbar wrapper div.
7. All trigger files (`RichText*Trigger.tsx`) are separate focused pieces, one per formatting action.
8. `RichText.ts` barrel-exports all named parts.
9. `index.ts` exports the public surface.

The result should feel like `WysiwygReference` reimplemented for the current app, not like a monolithic editor widget.

---

## Behavior Requirement

Keep `WysiwygReference` behavior and responsibilities as closely as possible:

- tiptap-based rich text editing
- controlled and uncontrolled value support (`value` / `defaultValue` / `onValueChange`)
- `editorRef` support for imperative editor access
- disabled, readOnly, invalid, required, spellCheck states
- character count and limit support
- bold, italic, underline, strike formatting
- heading levels (h1–h6)
- bullet list and ordered list
- blockquote
- code block
- hard break
- link (set / unset)
- image (via hidden file input)
- text alignment (left, center, right, justify)
- undo / redo
- bubble menu support
- floating menu support
- slot-based composition around the editor shell

If `WysiwygReference` has a behavior, preserve it unless the original behavior depends on an unsupported dependency. When a behavior must be adapted, preserve the intent and public contract.

---

## Dependency Adaptation Rule

When porting `WysiwygReference`, replace unsupported dependencies with supported equivalents, but do not change architecture unless required.

### Keep (supported, do not replace)

- `@tiptap/react` — `useEditor`, `useEditorState`, `EditorContent`, `Editor`
- All `@tiptap/extension-*` packages — keep every extension used in `useWysiwyg.ts`
- `@tiptap/extensions` — `CharacterCount`
- `use-debounce` — `useDebouncedCallback`

### Replace (unsupported Ark dependencies)

| WysiwygReference (Ark) | Replace with |
|---|---|
| `HTMLArkProps<'div'>` / `HTMLArkProps<'button'>` | `React.ComponentPropsWithRef<'div'>` / `React.ComponentPropsWithRef<'button'>` |
| `ark.div` / `ark.button` | standard `div` / `button` elements |
| `mergeProps` from `@ark-ui/react/utils` | manual spread merge or a lightweight `mergeProps` utility |
| `createContext` from `@ark-ui/react/utils` | React `createContext` + `useContext` with a null guard |
| `useFieldContext` | remove — do not integrate with an external Field component unless it already exists in the app |
| `useEnvironmentContext` | remove — use `document.getElementById` directly |
| `useLocaleContext` | remove — omit `dir` prop from generated props, or default to `'ltr'` |
| `Assign` from `@ark-ui/react` | `Omit<React.ComponentPropsWithRef<'div'>, keyof UseRichTextProps> & UseRichTextProps` |
| `parts.*Trigger.attrs` from anatomy | remove — anatomy pattern is Ark-specific, drop `...parts.X.attrs` spreads |
| `splitProps` from `~/utils/splitProps` | inline prop splitting using destructuring or `Object.keys` |
| `useControllableState` from `~/hooks/useControllableState` | check if the hook exists in the target app; if not, implement a minimal equivalent using `useState` + `useEffect` |
| `dataAttr` from `~/utils/dataAttr` | check if the util exists in the target app; if not, implement inline: `(v: boolean | undefined) => v ? '' : undefined` |

Important: this replacement is per rendered element, not per original reference file. If a React port changes a trigger from `button` to `label` or another intrinsic element for correctness, update the prop type to match the rendered element or introduce an explicit shared trigger state type.

Important:

- adapt dependencies, not architecture
- simplify implementation only where dependency support forces simplification
- pre-built shadcn components are the default; primitive-only fallbacks are allowed only when no supported pre-built exists
- pre-built usage must preserve existing RichText UI parity; parity violations are considered incorrect output
- `window.prompt` in `getLinkTriggerProps` should be replaced with a `popover`-based URL input for production quality — prefer a shadcn `Popover` + `Input` pattern

---

## Public API Rule

The public API should remain consistent with the `WysiwygReference` mental model.

At minimum, preserve or recreate equivalent support for:

- `RichText` (namespace object with all named parts)
- `RichText.Root` — top-level component accepting `value`, `defaultValue`, `onValueChange`, `disabled`, `readOnly`, `invalid`, `required`, `spellCheck`, `placeholder`, `limit`, `editorRef`, `id`, `ids`
- `RichText.Content` — renders the tiptap editor content area
- `RichText.Control` — toolbar wrapper
- `RichText.Context` — render-prop accessor for raw editor state
- `RichText.CharactersCount` — character / limit display
- `RichText.BubbleMenu` / `RichText.FloatingMenu` — menu wrappers
- `RichText.ImageHiddenInput` — hidden file input for image upload
- All trigger components: `BoldTrigger`, `ItalicTrigger`, `UnderlineTrigger`, `StrikeTrigger`, `HeadingTrigger`, `BulletListTrigger`, `OrderedListTrigger`, `BlockquoteTrigger`, `CodeBlockTrigger`, `HardBreakTrigger`, `LinkTrigger`, `ImageTrigger`, `TextAlignTrigger`, `UndoTrigger`, `RedoTrigger`

---

## Styling Rule

The UI must follow the exact current app UI direction:

- use the app's `components/ui/*` components and additional shadcn pre-builts for controls
- use `toggle` or `toggle-group` for toolbar trigger active/inactive states only when they preserve command behavior; otherwise use styled buttons with explicit active styling
- keep spacing, borders, rounding, and surface styling aligned with the current app UI
- avoid introducing a second design language
- do not recreate `WysiwygReference`'s old visual system (Ark-based data attribute styling)
- explicitly style rendered TipTap semantic tags inside the editor surface if app/global CSS resets them

Rendered-content styling check:

- Tailwind preflight or app base styles may neutralize semantic tags like `strong`, `em`, headings, `u`, and `s`.
- Verify that `strong`, `em`, `u`, `s`, headings, blockquotes, lists, links, and code blocks are visibly styled inside the `.tiptap` content surface.

In short: copy `WysiwygReference` architecture, copy `WysiwygReference` package structure, use current `components/ui/*` visuals with **pre-built shadcn components as first choice**, selected via MCP.

---

## Implementation Notes

- keep components small and focused
- keep file ownership clear — one component or hook per file
- avoid broad refactors outside `RichText`
- avoid unrelated changes
- prefer maintainable code over clever abstractions
- use supported imports only
- preserve TypeScript typing quality
- do not use `any` unless the Ark replacement genuinely cannot be typed otherwise
- `useRichTextContext` must throw (or warn) when used outside `RichTextRoot`
- all trigger components must be `forwardRef` to preserve ref forwarding from `WysiwygReference`

---

## Definition Of Done

The output is correct only if all of the following are true:

1. `RichText` mirrors `WysiwygReference` package structure and architecture.
2. `RichText` does not depend on unsupported `WysiwygReference` dependencies (no `@ark-ui/react`, no `~/` aliases unless they exist in the target app).
3. `RichText` preserves the existing app RichText/Wysiwyg UI/interaction baseline (no visible redesign).
4. `RichText` uses current `components/ui/*` plus supported shadcn pre-built components discovered through the shadcn MCP workflow.
5. `RichText` remains modular, not monolithic — one file per component/hook.
6. `RichText` feels like a supported, modernized port of `WysiwygReference`, not a monolithic editor widget.
