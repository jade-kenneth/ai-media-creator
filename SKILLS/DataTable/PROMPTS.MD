Completely copy `DataTableReference` structure and architecture for `DataTable`:

- strictly follow `DataTableReference` code structure, composition, and folder/file layout
- do not change architecture unless a dependency is unsupported
- replace only unsupported dependencies with supported equivalents

Priority order (strict):

1. Preserve `DataTableReference` architecture, file ownership, and composition model.
2. Preserve the **existing admin DataTable UI and interaction patterns exactly** (current app baseline).
3. Use shadcn pre-built components only in ways that keep #2 unchanged.

UI rules:

- keep the existing admin DataTable UI exactly the same (no visual redesign)
- preserve the same layout mechanics (toolbar flow, panel behavior, spacing rhythm, card/surface structure) as the current admin DataTable baseline
- use only shadcn-based admin components; no other UI system
- prioritize shadcn pre-built components over custom primitive compositions
- do not hand-roll controls from basic primitives when a matching shadcn pre-built exists
- use shadcn pre-built components when needed, but do not change established UI behavior/look
- if a pre-built introduces a visible behavior/layout change, do not use it as-is; adapt or choose a closer supported equivalent

MCP requirement:

- discover/select components through shadcn MCP before implementing
- use:
  - `mcp__shadcn__.get_project_registries`
  - `mcp__shadcn__.search_items_in_registries`
  - `mcp__shadcn__.view_items_in_registries`
  - `mcp__shadcn__.get_add_command_for_items`

Non-negotiable:

- architecture drift from `DataTableReference` is not allowed
- visual redesign from current admin DataTable UI is not allowed
- pre-built adoption must support parity, not replace parity
