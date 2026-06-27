---
name: prose-builder
description: Build or rebuild a Prose component by porting ProseReference to the current app's dependency set — for both web (Next.js/shadcn) and mobile (React Native/NativeWind) targets. Use this skill whenever the user asks to create, rebuild, port, or fix a Prose or typography display component. Trigger on requests like "build the Prose component", "rebuild Prose", "port ProseReference", "fix the Prose component", "create a prose component", or "add a Prose display component".
---

# Prose Builder

This skill builds a `Prose` component by porting `ProseReference` (found in `references/ProseReference.tsx` alongside this file) to the current app's dependency set.

Before starting, **confirm the build target** if it hasn't been specified:
- **web** — Next.js + Tailwind + shadcn
- **mobile** — React Native + Expo + NativeWind
- **both** — produce both implementations

Also **ask for the target output path** if not specified (e.g. `components/Prose.tsx`).

---

## How to use this skill

1. **Read this file fully** — it contains all constraints and rules.
2. **Read `references/ProseReference.tsx`** — it is the single authoritative source for the component's purpose, variant shape, and public API. Do not deviate from it unless a dependency is unsupported.
3. For web targets, **discover shadcn components via MCP before implementing:**
   - `mcp__shadcn__get_project_registries` → confirm registries
   - `mcp__shadcn__search_items_in_registries` → find relevant components
   - `mcp__shadcn__view_items_in_registries` → inspect component details
   - `mcp__shadcn__get_add_command_for_items` → generate add commands

---

## Goal

Port `ProseReference` to the target platform(s) by:

- preserving its **variant shape** (`size: sm | md`, `defaultVariants: { size: 'md' }`)
- preserving its **public API** (`size`, `asChild`, `className`, full `div` prop passthrough)
- replacing only the **unsupported dependencies** with platform-appropriate equivalents

`ProseReference` is the **only** reference for variant keys, default values, base class intent, and component contract. Do not invent new variants or props beyond what it defines.

---

## Critical Constraint

Replace dependencies, not architecture. The component is intentionally simple: one file, one recipe, one component export. Do **not** split it into multiple files, add context, or introduce abstraction beyond what `ProseReference` contains.

---

## WEB Target

### Dependency Adaptation (Web)

| ProseReference (Ark) | Replace with |
|---|---|
| `ark.div` from `@ark-ui/react/factory` | Plain `div` (or `Slot` from `@radix-ui/react-slot` for `asChild` support) |
| `HTMLArkProps<'div'>` / `ComponentPropsWithRef<'div'>` | `React.ComponentPropsWithRef<'div'>` |
| `splitProps` from `~/utils/splitProps` | Check if `~/utils/splitProps` exists in the target app; if not, inline prop splitting via destructuring |
| `Merge` from `type-fest` | Keep if `type-fest` is installed; otherwise use `Omit<React.ComponentPropsWithRef<'div'>, keyof VariantProps<typeof proseRecipe>> & VariantProps<typeof proseRecipe>` |
| `tv` / `VariantProps` from `tailwind-variants` | Keep if `tailwind-variants` is installed; otherwise use `cn` from `lib/utils` with an explicit `size` prop and conditional class logic |

### `asChild` Support (Web)

`ProseReference` includes `asChild` on `ark.div`, which renders as the child element. Replicate with:

```tsx
import { Slot } from '@radix-ui/react-slot';

const Comp = asChild ? Slot : 'div';
return <Comp className={proseRecipe(recipeProps)} {...localProps} />;
```

`@radix-ui/react-slot` is already installed via shadcn — do not add a new dependency.

### Tailwind Typography Classes (Web)

The base recipe uses Tailwind Typography (`prose`, `prose-sm`, `prose-md`, `prose-headings:*`, `prose-a:*`, etc.). Confirm `@tailwindcss/typography` is installed and configured in `tailwind.config`. If it is not, add it as a dev dependency and add the plugin.

### Arbitrary vs Canonical Classes (Web)

Per project convention, always prefer canonical Tailwind utility classes over arbitrary bracket values when a canonical equivalent exists. The heading `text-[1.5rem]` values in `ProseReference` have no canonical equivalent at this scale — keep them as-is. Do not fabricate canonical replacements that do not exist.

### File Structure (Web)

Single file output:

```text
Prose.tsx   (or Prose/index.tsx if the app groups components into folders)
```

Do not split into multiple files. `ProseReference` is a single-file component and the port must remain single-file.

---

## MOBILE Target

### Overview

React Native does not support Tailwind Typography (`prose`, `prose-*` modifier classes) or the `@tailwindcss/typography` plugin. The mobile port must replicate the **visual intent** of `ProseReference` using NativeWind utility classes and React Native `Text`/`View` primitives.

### Component Shape (Mobile)

The mobile `Prose` wraps a `View` (for block layout) and applies typography-appropriate NativeWind classes. It does **not** render raw HTML — it is a styled container for pre-rendered text content.

```tsx
// Prose.tsx (mobile)
import { View, ViewProps } from 'react-native';
import { cn } from '~/lib/utils'; // or however the app merges classes

interface ProseProps extends ViewProps {
  size?: 'sm' | 'md';
}

export function Prose({ size = 'md', className, ...props }: ProseProps) {
  return (
    <View
      className={cn(
        'max-w-full min-w-full',
        size === 'sm' ? 'gap-2' : 'gap-3',
        className
      )}
      {...props}
    />
  );
}
```

### Typography Mapping (Mobile)

Since `prose-headings:*`, `prose-a:*`, etc. do not exist in NativeWind, the mobile `Prose` component is a **layout container only**. Typography styling (font size, weight, color, line height) must be applied to the child `Text` components themselves, not to the `Prose` container.

Document this in a comment in the output file so consumers know to style children explicitly.

### `asChild` on Mobile

`asChild` is an Ark/Radix concept not applicable in React Native. **Omit the `asChild` prop** from the mobile version.

### NativeWind Class Rules (Mobile)

- Use only NativeWind-supported utility classes — no arbitrary Tailwind Typography modifiers
- `**:` universal child selectors are not supported in NativeWind — omit them
- `[&_u]:`, `[&_p:empty]:` attribute/pseudo selectors are not supported — omit them
- Replicate spacing intent using `gap-*` and `space-y-*` on the container

### File Structure (Mobile)

Single file output:

```text
Prose.tsx   (or Prose/index.tsx to match app folder conventions)
```

---

## Public API Rule

Both web and mobile ports must preserve this public surface:

| Prop | Web | Mobile |
|---|---|---|
| `size` | `'sm' \| 'md'` (default `'md'`) | `'sm' \| 'md'` (default `'md'`) |
| `asChild` | `boolean` (optional) | Omit |
| `className` | `string` (optional) | `string` (optional, NativeWind) |
| All native div/view props | via spread | via `ViewProps` spread |

---

## Styling Rule

- **Web:** Keep the `ProseReference` base class intent — max-w, min-w, prose plugin classes, heading/link/hr overrides, color tokens, leading. Replace color tokens (`fg-secondary-700`, `border-secondary`) only if they do not exist in the target app's Tailwind config; otherwise keep them.
- **Mobile:** Translate layout intent (full-width container, consistent gap) using NativeWind. Omit unsupported selectors and plugin classes entirely.
- Avoid introducing a second design language in either target.
- Do not add new variants or design tokens beyond what `ProseReference` defines.

---

## Implementation Notes

- Single file output for both targets — do not split
- Preserve TypeScript typing quality
- Do not use `any`
- Keep the component small and focused — it is a styled wrapper, not a composition system
- Avoid broad refactors outside the `Prose` file
- Avoid unrelated changes
- Use supported imports only

---

## Definition Of Done

The output is correct only if all of the following are true:

1. `Prose` mirrors `ProseReference` variant shape (`size: sm | md`, default `md`) and public API.
2. `Prose` does not depend on unsupported `ProseReference` dependencies (`@ark-ui/react`, `~/utils/splitProps` unless it exists, `type-fest` unless installed).
3. **Web:** `Prose` uses `@tailwindcss/typography` prose classes and applies `asChild` via `@radix-ui/react-slot`.
4. **Mobile:** `Prose` uses NativeWind-supported classes only — no `prose-*` modifier classes, no unsupported selectors.
5. `Prose` remains a single file — not split into multiple components or files.
6. `Prose` feels like a supported port of `ProseReference`, not a redesign.
