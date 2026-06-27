# DataTable Prompt

Use this prompt when generating `DataTable`.

---

You are creating `apps/brgy-system-admin/components/DataTable`.

## Goal

Rebuild `DataTable` by copying the **structure, architecture, composition model, and folder/file layout** of `DataTableReference` as closely as possible.

`DataTableReference` is the **only** reference for:

- component architecture
- file splitting
- provider/context boundaries
- hook/store shape
- feature ownership
- composition pattern
- public API mindset

Do **not** use `DataTableTwo`, `DateTable`, or any other table implementation as an architectural reference.

## Critical Constraint

Copy `DataTableReference` code structure, architecture, and folder/file layout **strictly and completely**. Do not deviate from the structure unless a dependency is unsupported and has no supported equivalent.

Although `DataTableReference` is the only code and architecture reference, its original implementation uses some dependencies and aliases that are not supported in this admin app.

You must therefore:

- copy the `DataTableReference` code structure exactly
- copy the `DataTableReference` architecture exactly
- copy the `DataTableReference` file/folder breakdown exactly
- keep the `DataTableReference` behavioral responsibilities exactly
- replace only the dependencies that are unsupported — everything else stays identical

## Priority Order (Strict)

When instructions compete, resolve in this order:

1. `DataTableReference` architecture and file/folder composition (non-negotiable).
2. Existing admin DataTable UI and interaction parity (non-negotiable).
3. shadcn pre-built component usage (required only when it preserves #2).

If a pre-built component choice changes visible layout/interaction from the current admin DataTable baseline, do not ship that change.

## UI Rule

Use the admin app `DataTable ui` **exactly and only**. The UI must follow the exact current admin DataTable UI direction — no deviations, no second design language.

The visual/interaction baseline is the currently used admin DataTable experience in this app (toolbar layout, panel behavior, spacing rhythm, card/surface patterns, and control semantics). Preserve this baseline exactly.

At minimum, use these supported admin `ui` files when relevant:

- `apps/brgy-system-admin/components/ui/table.tsx`
- `apps/brgy-system-admin/components/ui/button.tsx`
- `apps/brgy-system-admin/components/ui/card.tsx`
- `apps/brgy-system-admin/components/ui/input.tsx`
- `apps/brgy-system-admin/components/ui/select.tsx`
- `apps/brgy-system-admin/components/ui/sheet.tsx`
- `apps/brgy-system-admin/components/ui/separator.tsx`
- `apps/brgy-system-admin/components/ui/skeleton.tsx`
- `apps/brgy-system-admin/components/ui/switch.tsx`
- `apps/brgy-system-admin/components/ui/tooltip.tsx`
- `apps/brgy-system-admin/components/ui/scroll-area.tsx`

Do **not** treat these as low-level primitives to hand-compose replacements for existing shadcn patterns.

Use **pre-built shadcn components first**. If a pre-built component exists for the behavior, you must use it instead of custom composition.

You must also utilize additional **shadcn pre-built components** when they better match `DataTableReference` behavior (for example: `combobox`, `popover`, `command`, `checkbox`, `calendar`, `dropdown-menu`, and related shadcn components).

For clarity:

- prefer pre-built `combobox` patterns over custom searchable dropdown logic
- prefer `calendar`-based pickers over native date inputs when date picker behavior is needed
- prefer `checkbox` components over raw checkbox inputs in table/filter selection UIs
- prefer `dropdown-menu` for preset/action menus instead of custom button lists
- avoid building custom controls from generic `button`/`input` wrappers when a matching shadcn pre-built exists
- do not replace existing admin DataTable interaction patterns solely to satisfy a pre-built pattern

Use the shadcn MCP server to discover/select components before implementing:

- use `mcp__shadcn__.get_project_registries` to confirm registries
- use `mcp__shadcn__.search_items_in_registries` to find relevant components
- use `mcp__shadcn__.view_items_in_registries` to inspect component details
- use `mcp__shadcn__.get_add_command_for_items` to generate add commands

Use no other UI system.

This is non-negotiable:

- do not use legacy `~/components/ui/*`
- do not use Ark UI components
- do not use old custom `Field`, `Presence`, `Icon`, `Checkbox`, `Tooltip`, `Button`, or `Select`
- do not use `@untitled-theme/icons-react`
- do not use unsupported path aliases such as `~/...`

Use only supported imports available in the current admin app, typically `@/...` imports and installed packages already used by the admin app.

## File/Folder Structure Requirement

Mirror the `DataTableReference` package structure as closely as possible.

Expected target structure:

```text
apps/brgy-system-admin/components/DataTable/
  index.ts
  DataTable.tsx
  DataTableContext.tsx
  useDataTable.tsx
  Table.tsx
  Searchbar.tsx
  Pagination.tsx
  Reload.tsx
  Export.tsx
  ColumnControls/
    index.ts
    ColumnControls.tsx
    ColumnControlsContext.ts
  Filter/
    index.ts
    Filter.tsx
    FilterContext.ts
    Input.tsx
    Select.tsx
    MultiSelect.tsx
    Combobox.tsx
    MultiCombobox.tsx
    DatePicker.tsx
    DateRangePicker.tsx
    DualDateRangePicker.tsx
    NumberRangePicker.tsx
    Switch.tsx
```

If a `DataTableReference` file exists, `DataTable` should generally have a corresponding file with the same responsibility.

Do not collapse the package into one file unless absolutely impossible.

## Architecture Requirement

Preserve the `DataTableReference` architecture:

1. `useDataTable.tsx` owns the compositional state model.
2. `DataTable.tsx` is the top-level composition shell.
3. `DataTableContext.tsx` exposes shared table state.
4. `Filter/*` owns filter UI and filter-local context.
5. `ColumnControls/*` owns column controls UI and column-controls-local context.
6. `Table.tsx` renders the actual table body/head/footer.
7. `Searchbar.tsx`, `Pagination.tsx`, `Reload.tsx`, and `Export.tsx` remain separate focused pieces.
8. `index.ts` exports the public surface.

The result should feel like `DataTableReference` reimplemented for the current app, not like `DataTableTwo` renamed to `DataTable`.

## Behavior Requirement

Keep `DataTableReference` behavior and responsibilities as closely as possible:

- collection-based table input
- internal table state hook
- column controls
- sortable columns
- hideable columns
- orderable columns
- persisted hidden columns / column order
- search
- filters
- pagination
- reload
- export
- row selection
- summary row support
- slot-based composition around the table shell

If `DataTableReference` has a behavior, preserve it unless the original behavior depends on an unsupported dependency.

When a behavior must be adapted, preserve the intent and public contract.

## Dependency Adaptation Rule

When porting `DataTableReference`, replace unsupported dependencies with supported equivalents, but do not change architecture unless required.

Examples:

- replace legacy UI components with current `components/ui/*` and other supported shadcn pre-builts
- replace unsupported icon packages with `lucide-react`
- replace unsupported checkbox implementations with the supported shadcn `checkbox` component (use native checkbox only as fallback when no pre-built equivalent can satisfy the requirement)
- keep `@dnd-kit/*` for DnD-based ordering — it is supported and must not be replaced
- replace unsupported Ark/portal/presence abstractions with supported shadcn compositions (sheet/dialog/popover/scroll-area/table/etc.)

Important:

- adapt dependencies, not architecture
- simplify implementation only where dependency support forces simplification
- pre-built shadcn components are the default; primitive-only fallbacks are allowed only when no supported pre-built exists
- pre-built usage must preserve existing admin DataTable UI parity; parity violations are considered incorrect output

## Public API Rule

The public API should remain consistent with the `DataTableReference` mental model.

At minimum, preserve or recreate equivalent support for:

- `DataTable`
- `DataTable.collection(...)`
- `DataTable.clearStore()`
- collection input
- column config
- filter config
- search config
- pagination config
- sort config
- row selection config
- table shell slots

## Styling Rule

The UI must follow the exact current admin `DataTable ui` direction:

- use the shared `components/ui/table.tsx` table primitives for the table structure
- use the shared admin `ui` components and additional shadcn pre-builts for controls
- keep spacing, borders, rounding, and surface styling aligned with current admin UI
- avoid introducing a second design language
- do not recreate `DataTableReference`’s old visual system

In short:

- copy `DataTableReference` architecture
- copy `DataTableReference` package structure
- use current admin `components/ui/*` visuals with **pre-built shadcn components as first choice**, selected via MCP

## Implementation Notes

- keep components small and focused
- keep file ownership clear
- avoid broad refactors outside `DataTable`
- avoid unrelated changes
- prefer maintainable code over clever abstractions
- use supported imports only
- preserve TypeScript typing quality

## Definition Of Done

The output is correct only if all of the following are true:

1. `DataTable` mirrors `DataTableReference` package structure and architecture.
2. `DataTable` does not depend on unsupported `DataTableReference` dependencies.
3. `DataTable` preserves the existing admin DataTable UI/interaction baseline (no visible redesign).
4. `DataTable` uses current admin `components/ui/*` plus supported shadcn pre-built components discovered through the shadcn MCP workflow.
5. `DataTable` remains modular, not monolithic.
6. `DataTable` feels like a supported, modernized port of `DataTableReference`, not a variant of `DataTableTwo`.

## Short Instruction Version

Completely copy `DataTableReference` as `DataTable` — strictly follow code structure, architecture, contexts, hook layout, and folder/file breakdown. Do not replace `@dnd-kit/*`. Replace only unsupported dependencies with supported admin app equivalents. Keep the existing admin DataTable UI/interaction baseline exactly the same (no redesign). Use shadcn pre-built components via MCP only when they preserve that baseline; do not introduce a second UI behavior model.
