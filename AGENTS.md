# Repository instructions

## Stack

- Nx monorepo
- apps/app-mobile = React Native Expo
- apps/app-admin = Next.js admin web app
- apps/app-api = NestJS GraphQL API
- packages/shared-constants = types/constants/schemas shared across apps (`@app/shared-constants`)
- Mobile uses NativeWind
- Admin uses shadcn/ui
- Backend uses MongoDB

## Working rules

- Prefer npm for package management.
- Do not share web UI components with React Native.
- Share only types, constants, schemas, and pure business logic when it clearly reduces duplication.
- Keep changes scoped to the app or library that owns the behavior.
- Avoid changing unrelated files.
- Prefer feature-based work over broad refactors unless requested.
- Do not introduce a new implementation pattern when an established one already exists in the same layer or feature.
- Prioritize existing codebase structure, naming, data-flow, and hook/module patterns.
- Only break an existing pattern when truly necessary, and keep the deviation minimal and explicit.
- Do not introduce or keep deprecated APIs, methods, or libraries when a maintained alternative already exists; migrate to the current supported approach.

## Validation

- Run the smallest relevant checks first.
- For mobile changes, validate only the affected mobile app paths first.
- For admin changes, validate only the affected admin app paths first.
- For API changes, validate only the affected api app paths first.

## Code style

- Keep components focused and readable.
- Keep forms explicit about loading, error, and success states.
- Favor simple wording in UI copy.
- Prefer predictable, maintainable solutions over clever abstractions.
- Do not introduce tiny local normalization helpers such as `normalizeRequiredString`; inline simple field validation/trim logic unless there is an existing shared utility already used by the codebase.

## Planning & Documentation

### Feature Plans — UI Mockups

After creating any feature plan (task.md, implementation plan, etc.), always immediately follow up with ASCII/text UI mockups showing:

1. What the mobile app screens will look like
2. What the admin dashboard/modal/page will look like

Render detailed ASCII mockups with color/component specs and UX behavior notes.

**Why:** Visualizing features before implementation catches design issues early and aligns expectations.

**How to apply:** Any time a task.md or feature breakdown is created or updated, proactively append or present visual mockups for all affected surfaces (mobile screens, admin pages, dialogs) without waiting to be asked.

---

### XML Diagrams (draw.io)

Always produce a **UML sequence diagram** in draw.io XML format when asked for an architecture or flow diagram. Never use a component diagram with overlaid arrows — they tangle.

#### Structure

**Actor boxes** (`y=96`, `height=66`) — 3 lines each:

```
<b>Plain English Name</b>
role / what it does
<font style="font-size:8px;" color="#888888">path/to/file.ts</font>
```

- Always plain English names, not class names
- File path always in 8px grey (`#888888`)

**Lifelines** — vertical dashed grey lines (`dashed=1;strokeColor=#aaaaaa`), start `y=162`, end `y=860`

**Section sidebar** (`x=16`, `width=60`) — one colored rounded rect per phase:

- Init → blue (`#e8f4fd` / `#6c8ebf`)
- Main action → orange (`#fff0e0` / `#FF6600`)
- Success/retry → green (`#e0f0e0` / `#006600`)
- Error → red (`#fde8e8` / `#CC0000`)

**Message arrows** — ALL horizontal, use absolute `sourcePoint`/`targetPoint`, never `source=`/`target=`:

```xml
<mxCell value="① Description&lt;br&gt;&lt;font style=&quot;font-size:8px;&quot; color=&quot;#888888&quot;&gt;file.ts:16 — method()&lt;/font&gt;"
  style="html=1;strokeColor=#FF6600;fontColor=#FF6600;fontSize=10;fontStyle=1;startArrow=none;endArrow=open;endFill=1;" edge="1" parent="1">
  <mxGeometry relative="1" as="geometry">
    <mxPoint x="110" y="296" as="sourcePoint"/>
    <mxPoint x="460" y="296" as="targetPoint"/>
  </mxGeometry>
</mxCell>
```

- Solid arrow (`endFill=1`) = request/call; dashed (`dashed=1;endFill=0`) = response/return
- `fontSize=10`, min 50px row spacing, step numbers ①②③…
- Always look up actual file:line numbers — never guess

**Do NOT:** use `edgeStyle=orthogonalEdgeStyle`, use `source=`/`target=` refs on arrows, omit file paths from actor boxes, use class names as actor names.
