# Generic Prompt: Update Agent Docs for a Prototype-to-Implementation Port

Use this prompt when a project is being moved from a prototype or previous implementation into a new production implementation, and the project agent instructions need to be updated accordingly.

````md
Update `[AGENT_DOC_FILE]` so it reflects the current `[TARGET_IMPLEMENTATION]` instead of the previous `[SOURCE_IMPLEMENTATION]`.

## Context

The project is being ported from `[SOURCE_IMPLEMENTATION]` to `[TARGET_IMPLEMENTATION]`. The old prototype remains important and should be treated as the canonical visual, content, and interaction reference while building the new implementation.

Use the reference directory convention from `prompt.md`: the prototype should live in a repo-root folder named after the project, followed by `Reference`.

Example:

- Project name: `StavWebsite`
- Reference directory: `StavWebsiteReference/`

Project-specific values:

- Project name: `[PROJECT_NAME]`
- Agent docs file: `[AGENT_DOC_FILE]`
- Source implementation: `[SOURCE_IMPLEMENTATION]`
- Target implementation: `[TARGET_IMPLEMENTATION]`
- Reference prototype directory: `[PROJECT_NAME]Reference/`
- Reference entry file: `[REFERENCE_ENTRY_FILE]`
- Reference component/source directory: `[REFERENCE_SOURCE_DIR]`
- Reference styles directory: `[REFERENCE_STYLES_DIR]`
- Reference screenshots directory: `[REFERENCE_SCREENSHOTS_DIR]`
- Archived explorations directory, if any: `[REFERENCE_ARCHIVE_DIR]`
- Target tech stack rows: `[TARGET_TECH_STACK_ROWS]`
- Local environment: `[LOCAL_ENVIRONMENT]`
- Site root: `[SITE_ROOT]`

## Required Changes

### 1. Update the Tech Stack table

Replace rows that describe the previous prototype or old implementation, such as:

- Format - static HTML, React prototype, single-page app, exported build, or other previous packaging
- Entry - prototype HTML entry file, static app bootstrap file, or old app entry point
- Routing - hash routing, client-only routing, static routes, or old route map
- State - prototype-only state management such as local component state, localStorage, or mock state
- Media/image handling - prototype-only drag/drop, localStorage, hardcoded assets, or mock media handling

Add rows that describe the current target implementation. Keep this generic and use the actual project stack, for example:

- Platform/CMS/framework - `[TARGET_PLATFORM_OR_FRAMEWORK]`
- Theme/template/app shell - `[TARGET_THEME_OR_APP_SHELL]`
- Plugins/packages/integrations - `[TARGET_PLUGINS_OR_PACKAGES]`
- Runtime/build tooling - `[TARGET_RUNTIME_OR_BUILD_TOOLING]`
- Local env - `[LOCAL_ENVIRONMENT]`, site root at `[SITE_ROOT]`

If the project uses different stack categories, use the categories from `[TARGET_TECH_STACK_ROWS]` instead of forcing the examples above.

Preserve existing rows for fonts, colors, visual style, brand rules, content strategy, and other still-valid project guidance.

### 2. Add a "Reference Site" section

Insert this section before "File Rules" or the equivalent implementation-rules section:

```md
## Reference Site

`[PROJECT_NAME]Reference/` contains the original `[SOURCE_IMPLEMENTATION]` prototype and is the canonical source of truth for design and functionality. When building anything in `[TARGET_IMPLEMENTATION]`, consult this directory first:

- `[REFERENCE_ENTRY_FILE]` - entry point; shows full page structure and routing
- `[REFERENCE_SOURCE_DIR]` - page components, shared chrome, app shell, routing, and content data
- `[REFERENCE_STYLES_DIR]` - design tokens, layout rules, and page-specific styles
- `[REFERENCE_SCREENSHOTS_DIR]` - visual reference for each page and state
- `[REFERENCE_ARCHIVE_DIR]` - archived explorations or context-only experiments, if present

Match the reference site's design tokens, spacing, page structure, content, and interactions when porting to `[TARGET_IMPLEMENTATION]` unless explicitly told otherwise.
```

If one of the listed reference files or directories does not exist, omit that bullet rather than inventing it.

### 3. Keep the rest of the instructions coherent

Review nearby sections for stale references to the old implementation. Update only what is necessary to make the agent docs accurate for the target implementation.

Do not remove project-specific content requirements, business constraints, accessibility notes, design principles, or source-of-truth rules unless they directly conflict with the target implementation.

## Output

After editing, provide:

1. A short summary of what changed.
2. The file path updated.
3. Any assumptions made about placeholders or missing reference directories.
4. A raw diff only if requested.
````
