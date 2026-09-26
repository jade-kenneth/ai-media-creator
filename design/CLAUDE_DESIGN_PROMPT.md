# Design and Build Prompt: AI Creation Platform (Affiliate Studio)

**Mode:** prompt only (implement directly). This prompt is carried out in the repository by the implementer. Nothing is sent to Claude Design and no prototypes are exported. Every reference document is still produced, and the Design Reference replaces the prototype as the visual and behavioral contract.

**Recorded:** 2026-09-24. Design source in `design.config.json`: `claude-design` (kept by the product owner's choice). Because this mode exports no prototypes, `design/design-release.json`, `design/design-sync.lock.json`, `pnpm design:validate`, `/sync-build-docs` and `/finalize-build-docs` do not apply. Scope changes go through `design/planning/`, `design/system/` and `design/handoff/` first, then the two root build documents and the task file, then the code.

---

## Role and goal

You are the product designer and implementer for **AI Creation Platform** (working title; the parent brand name is not decided). You own the product's UI, interaction behavior, visual system and experience planning, and you build it in this repository. The first product is **Affiliate Studio**, a guided workflow under **Marketing** that turns a real product into an original, short, vertical affiliate video.

Produce one coherent product with one shared system, not a set of disconnected screens. Every screen must be buildable from the documents you write, including all of its states, routes and control behavior.

Ask focused clarification questions whenever a missing decision would materially change navigation, platform behavior, scope or brand. Do not guess on those. For smaller gaps, choose a sensible default, state it, and record it in `design/planning/open-decisions.md`.

You must not request, invent or include database credentials, connection strings, API keys, tokens, passwords or production data. Do not invent architecture only to fill a visual gap: every data-backed behavior maps to the repository's existing GraphQL, TanStack Query, auth, storage and repository patterns, and a missing backend operation is raised with the product owner before it is built.

## Confirmed product brief

### Project

- **Project name:** AI Creation Platform
- **First studio:** Affiliate Studio (Marketing)
- **Long-term scope:** A general AI video creation workspace for any genre or purpose (marketing, entertainment, education, business, personal stories and future categories). These are examples, not a fixed list. A *studio* is a guided workflow for one goal. Shared tools (accounts, projects, media library, scripts, voice, scene timeline, generation jobs, editor, exports) are reused by every studio.
- **Core promise:** Create affiliate videos from product facts, with editable scripts and several testable hooks.
- **Source brief:** `AI_Creation_Platform_Project_Brief.md` (repository root).

### Problem and outcome

Small affiliate creators spend a lot of time researching a product, deciding what to say, recording a voiceover, finding visuals, editing captions and making variants. Generic AI video tools produce clips, but they do not tie those clips to a product's actual features or help creators compare angles.

**Outcome, in one sentence:** a creator enters a product, approves its facts, and leaves with an editable, exportable 20–40 second 9:16 affiliate video that has several testable hooks, staying in control of every claim and every scene.

### Users and roles

| Role | Who | Most important job |
| --- | --- | --- |
| Creator (only MVP role) | A small TikTok Shop or Shopee affiliate creator making English, Filipino or mixed English-Filipino (Taglish) short videos | Go from product information to an approved script, and later an exported vertical MP4, without outside tools |
| Signed-out visitor | Anyone not signed in | Continue with Google; the first sign-in creates the account and a personal workspace |

There are no team, admin or reviewer roles in the MVP. Whether an internal operator view of usage, cost and failures is needed is open decision 3. Do not design an admin console unless it is confirmed.

### Target surfaces

- **Primary:** responsive web app in `apps/app-web`, desktop-first. Reference viewport 1440 × 900; works from 1024 px up to wide desktop.
- **Secondary:** mobile web in the same app (reference 390 × 844, tested 360–430) for every Batch 1 screen. The dense scene editor's mobile depth is resolved as R13 (light edits below 1024px).
- **Not in MVP:** a native iOS/Android app (`apps/app-mobile` is removed) and a tablet-specific layout (tablet widths use the responsive web layout).

### MVP boundary (private beta)

Required:

1. Google sign-in and a dashboard of saved projects (create, rename, duplicate, reopen).
2. Create an affiliate project from a product URL **or** manual entry. Manual entry is primary and always works; URL import is an optional helper and its failure never blocks the flow.
3. Upload and organize product photos or short clips the creator has rights to use (preview, validation, progress, remove, replace, rights confirmation).
4. Show extracted or entered facts with their sources; the creator reviews claims before any generation.
5. Choose the target audience, platform, language, tone, selling angle and target duration.
6. Generate at least three distinct hook options, one editable script, a scene plan, on-screen text, CTA and caption.
7. Generate a voiceover from the approved script; preview, edit pronunciation, regenerate, or replace it with the creator's own upload.
8. Build a draft from real product assets, text, captions and transitions. AI-generated scenes are optional and only with an approved integration.
9. Preview; edit scene order, text and voice; regenerate one scene; export a 9:16 MP4.
10. Save project state, show generation progress and failures, and allow retries without duplicate charges or jobs.

Explicitly **out of scope** (do not design, and do not show as "coming soon"): automatic posting; sales attribution or commission reporting; scraping restricted pages or bypassing access controls; full AI generation of every second; AI presenters, face cloning, voice cloning or a multitrack editor; any promise of guaranteed sales, compliance certification or perfect AI fidelity.

### Delivery batches

- **Batch 1 — Script MVP (specify and build now):** design foundation, sign-in, dashboard, product setup, fact review, strategy, Script Studio, creator brief. Exit: a creator produces an approved creator brief without outside tools.
- **Batch 2 — Video beta (decisions 2, 4, 5 resolved as R13–R15; screens specified in Design Reference §5B, approved 2026-09-24):** media mapping, Voice Studio, scene editor and 9:16 preview, export with history. Until Batch 2 is specified and built, its workflow steps are **hidden**, not shown as locked or "coming soon".
- **Later — AI video scenes (blocked on decision 6):** image-to-video per scene card, compare alternatives, required review of AI depictions of the product.

### Main journey and states

1. **Create project:** manual title, category, description, price (optional), images, features and affiliate link; or import from a product link first.
2. **Review facts:** each claim beside its source; correct, remove, approve, reject or mark as unknown.
3. **Choose direction:** audience, platform, language, tone, style, duration and one selling angle (suggested or written).
4. **Review script:** edit the hook, narration, on-screen text and CTA; rewrite one hook or one scene without losing approved work; approve a version.
5. **Creator brief:** copy or download the plain-text brief from the approved version.
6–8. **Media, voice, assemble, export:** Batch 2.

Project status (shown as a readable stage label): `draft → facts_review → script_review → media_review → generating → ready → exported`. Job status for every background job: `queued`, `running`, `completed`, `failed`. The creator can leave and come back while jobs continue. A failed job returns to an editable state with a specific error and a targeted retry.

### Feature rules that shape screens and states

- **Dashboard:** each project card shows product name, last edit, stage, thumbnail and latest export. The empty dashboard explains the first action. Rename and duplicate per project; duplicate is how a creator tests another hook while keeping the original.
- **Product setup:** show which fields came from the URL and which the creator entered or edited. Import may partially succeed; unavailable fields are named. Uploads are stored once per project and reused later.
- **Fact review:** each claim is a row with its source (listing, creator input, or not stated) and status `unreviewed`, `approved`, `rejected` or `unknown`. Only approved facts feed generation. A listing is source material, not proof.
- **Claim checks:** flag unsupported superlatives, health outcomes, guarantees, invented testimonials, pricing or stock claims, performance claims, and anything in a script that is not one of the approved facts. Show the reason and let the creator edit. A flag never blocks approving a fact; it does block approving a script version.
- **Strategy:** intended buyer, main problem, desired benefit, platform, script language, tone, length, content style. Three grounded angle suggestions, or the creator's own angle, saved with the script version.
- **Script Studio:** at least three hooks, each with its opening shot; scenes with purpose, duration, narration, on-screen text, suggested visual, CTA and the facts they use; spoken-length estimate with an over-length warning; rewrite one hook or scene; version history with restore; approval.
- **Creator brief:** plain text from the latest approved version: hook and opening shot, shot list (say / text / shot / CTA), caption, product link, approved facts used, before-you-post reminders. No AI call and no credits.
- **Usage and cost:** show the estimated credits before every paid generation and the actual usage after. A double click or retry never starts a second paid job. Failed jobs are not charged (default for open decision 8). Credits are abstract units with demo values; prices and plans are not decided.

### Brand direction

- The parent brand stays broad; Affiliate Studio is a studio name. The parent name, logo and final accent are **not decided** (open decision 1). Build with the working wordmark "AI Creation Platform" and keep brand-dependent values in tokens so the swap is a token change.
- Personality: a confident, practical creative tool for working creators; fast and trustworthy, not hype-driven; honest about AI: it drafts, the creator decides.
- Visual system (confirmed, recorded in `design/system/`): warm paper canvas, ink primary actions, a single flare accent used for non-text marks, Geist and Geist Mono, light app with a dark stage for footage.
- UI copy is plain, direct English; errors say what happened, what was kept, and what to do next. Creator content may be English, Filipino or Taglish.

### Platform constraints

- **Theme:** light app, dark stage. Tokens are semantic so a dark theme can be added later without redesign.
- **Sign-in:** Google only. The first successful sign-in creates the account and a personal workspace. No password, registration or reset screens. Design cancelled consent, popup blocked, provider error, session expired (with return to the original destination) and offline.
- **Localization:** English UI only. Script, caption and voice content supports English, Filipino and Taglish; language selectors label *content*.
- **Offline:** no offline mode. Editing screens show connection-lost and save-failed states; long-running jobs say the creator's work is safe.
- **Long-running work:** never blocks a page. Jobs run in the background and the creator can navigate away and return.
- **Uploads:** accepted types, size limits, per-file progress, validation errors, and a rights confirmation before the dropzone activates.

### Accessibility target

WCAG 2.2 AA: full keyboard operation (including a keyboard alternative to drag), visible focus, 4.5:1 text contrast, at least 24 × 24 px pointer targets (44 × 44 px below 1024 px), screen-reader labels for every icon control, live-region announcements for job status and gating reasons, and `prefers-reduced-motion` support.

### Content, safety and rights rules

- Fact provenance is visible next to every claim, everywhere claims appear.
- Prefer original images or footage for close-ups, logos, controls and packaging.
- Confirm rights for uploaded media. No voice or likeness cloning.
- Remind the creator to add the affiliate disclosure and synthetic-media label their platform requires; never claim the product certifies compliance.
- Private media is shown only to its owner. No public share links in the MVP.
- Model output is untrusted: it can never approve anything, and it is checked against the approved facts.

### Canonical demo data

One fictional demo world, used in the design documents and in the seeded database: creator **Mika Reyes** (`mika@example.com`), a TikTok Shop affiliate in Quezon City who makes Taglish lifestyle videos; hero project **Portable Blender, Morning Smoothie Hook** (BlendGo Mini Portable Blender, 380 ml, USB-C rechargeable, ₱899 demo price, links on `shop.example`); four other projects at varied stages. Full values are in `design/system/voice-content.md`.

### UI skills

| Skill | Role |
| --- | --- |
| `impeccable` | Governs scope, the craft floor, audit and the polish/verification pass |
| `taste-skill` | Aesthetic direction, applied inside the recorded brand decisions and tokens |
| `design-engineering` | Motion and interaction feel: easing, durations, press feedback, dialog/drawer/toast motion |
| `shadcn` | Component library: the repository's Radix-based shadcn primitives, restyled to the tokens |

The repository's own `web-app`, `web-ui-design` and `api-app` skills always apply for their layers. Conflict order: the recorded decisions and `design/` documents, then the app skills' architecture and accessibility rules, then the UI skills. A UI skill never replaces a recorded token, the component library, or the repository's data and routing patterns.

### Remaining decisions

Resolved with the product owner (2026-09-23 and 2026-09-24): Google-only sign-in; light app with a dark stage; manual entry primary; working wordmark; prompt-only mode; the web app is the only client; MongoDB through `MONGODB_URI`; a text-generation provider adapter behind a server-side key; background jobs as database records processed inside the API.

Still open (tracked in `design/planning/open-decisions.md`): parent brand (1), mobile editor depth (2), operator view (3), first platform preset (4), music source (5), AI scene integration (6), project deletion (7), failed-job charging (8, default: not charged), billing and top-ups (9), legal pages (10), credit prices (11), starter credit grant (12).

## Required design process

Work in this order, writing each result to its document before moving on:

1. Confirm scope, roles, surfaces and unresolved decisions.
2. Produce the information architecture and complete screen inventory.
3. Map every primary flow, alternate path, interruption and recovery path: import failure, rejected claims, flagged script lines, an over-length script, provider rejection or timeout, leaving during a job, duplicate-click prevention, restoring an earlier version, editing an approved fact after a script exists.
4. Establish the reusable design system and content voice.
5. Specify each screen and every required state using the shared system, in the Design Reference.
6. Declare the navigation graph and bind every control to a named action, so no screen is unreachable and no control is a decorative no-op.
7. Audit completeness, routing coverage, control coverage, responsiveness, accessibility and cross-screen state consistency before building.

## Per-screen quality requirements

Every specified and built screen must define and visibly implement:

- exact layout, element order, alignment, responsive behavior and breakpoints;
- fonts, weights, sizes, line heights, letter spacing, colors, spacing, borders, radii, shadows, icon treatment and imagery rules, all from `design/system/`;
- real product copy, never lorem ipsum;
- realistic, internally consistent data (the canonical demo world, delivered by the seed script);
- loading, skeleton, empty, error, success, disabled, offline, permission-denied and destructive-confirmation states wherever they apply, plus this product's states: import partial success and failure, unreviewed claims blocking generation, flagged claims, the over-length warning, job `queued` / `running` / `completed` / `failed`, duplicate-request prevention, upload validation failure, and "your approved work is safe" recovery;
- hover, focus, pressed, selected, toggled, expanded, validation and keyboard states for interactive controls;
- navigation, dialogs, drawers, menus, filtering, sorting, forms and transitions;
- its route, guard and presentation, and the destination and observable result of every control;
- every horizontally scrolling region, per the scroll-container contract below;
- accessibility: semantic hierarchy, focus order, visible focus, contrast, touch targets, reduced motion, screen-reader labels and keyboard operation;
- desktop versus mobile-web differences.

Do not invent a screen from a planning bullet and call it complete. When scope is known but a decision is unresolved, mark it blocked (`⚠ needs spec`).

## Navigation and interaction contract

A screen is not complete until it declares where it sits in the product's navigation, and a control is not complete until it declares what it does. In this mode both are declared in documents and implemented as real routes and handlers, not as `data-*` attributes.

### Screen and route identity

Each screen has one row in `design/planning/navigation-map.md` and one section in the Design Reference declaring:

- **screen id:** stable kebab-case, reused verbatim by the screen inventory, the interaction inventory and every control that targets it;
- **route** path template and required **params**;
- **navigation container** (for example `app-shell > project-workflow`);
- **presentation:** `push`, `replace`, `tab`, `modal`, `sheet`, `dialog`, `drawer` or `full-screen`;
- **guard:** `none`, `authenticated`, `unauthenticated` or `role:<role>`. Every project route also implies ownership: another creator's project renders the designed not-found or no-access state.

### Control action contract

Each control has one row in `design/planning/interaction-inventory.md` with its screen id, visible label, action id (`<screen-id>.<verb-object>`), action type, target, observable result, implemented states, confirmation requirement and business rule.

- Action type is exactly one of `navigate`, `back`, `submit`, `mutate`, `open`, `close`, `toggle`, `select`, `filter`, `sort`, `paginate`, `expand`, `copy`, `share`, `external`, `destructive` or `none`.
- A target that is not specified yet is `needs-spec:<screen-id>` and is recorded in `open-decisions.md`. In the built app such a control is **not rendered**; it is never a dead button.
- `destructive` names its confirmation surface and states whether the action is reversible.
- Paid generation controls show the estimated credits before the click and implement the in-flight state that prevents a second submission.

### Coverage rules (must hold before a screen is marked built)

1. Every screen has at least one inbound navigation and at least one exit; a terminal screen states why.
2. Every screen target resolves to an existing screen id or is `needs-spec:` and not rendered.
3. Every interactive control has exactly one action; zero unbound controls, zero placeholder handlers, no "coming soon".
4. Every screen declares back, cancel and dismiss behavior and where each lands, including the browser back button and the mobile-web back gesture.
5. Every parameterized route implements loading, not-found, invalid-param and permission-denied results.
6. Every guarded route declares where a blocked visitor lands and whether they return to the original destination after sign-in.
7. Deep links, tab and scroll restoration, unsaved-changes interception and post-submit destinations are declared wherever they apply. Editing upstream work declares what happens to downstream approved work.
8. Signed-out versus signed-in, and owner versus non-owner, are declared per route.

## Scroll-container contract

Any horizontally scrolling region (hook rail, filter chip rows, the mobile step strip) is a designed component. Each declares its id, type (`carousel`, `rail`, `chip-row`, `tab-strip`, `overflow`), snap (`none`, `item`, `page`), items visible per surface including the fractional peek, peek size, autoplay (`none`) and loop.

- Hide the scrollbar on mobile and touch surfaces while keeping scrolling fully functional (`scrollbar-width: none` and `::-webkit-scrollbar { display: none }`).
- Every touch scroller shows an affordance that more content exists: a peek, an `n of m` counter, an edge fade, or visible arrow controls.
- Controls (previous/next, dots, see all) are real actions with results. Design first/last item, fewer items than slots (align start), exactly one item (no chrome), empty, loading and error.
- Horizontal swipes never trap vertical page scroll (`overscroll-behavior-x: contain`).
- Keyboard-operable; focus never lands on a clipped item; position announced as "item n of m"; reduced motion makes programmatic scrolling instant.
- Never hide the vertical page scrollbar on desktop web.

## Design-system deliverables

`design/system/` holds exact values, usage rules, component variants, interaction states, responsive rules and intentional exceptions:

```text
design/system/
├── tokens.md
├── typography.md
├── colors.md
├── spacing-layout.md
├── components-states.md
├── motion.md
├── voice-content.md
└── accessibility.md
```

With no prototype, `design/system/` and the Design Reference are the fidelity authority. After this prompt is carried out, those values — not a UI skill's defaults — are authoritative.

## Planning deliverables

```text
design/planning/
├── product-scope.md
├── information-architecture.md
├── navigation-map.md
├── user-flows.md
├── user-journeys.md
├── screen-inventory.md
├── interaction-inventory.md
├── roles-permissions.md
├── data-requirements.md
└── open-decisions.md
```

- `screen-inventory.md` lists each screen's id, route, surface, owning app, Design Reference section and status: `planned`, `in-design`, `specified`, `in-build`, `built` or `blocked`.
- `navigation-map.md` is the normative route table (one row per screen: id, route, params, surface, container, presentation, guard, inbound screens and actions, exits, back/cancel/dismiss target, deep-link support, not-found and permission-denied handling), followed by a navigation graph per role and an explicit list of screens with no inbound edge and targets that do not resolve.
- `interaction-inventory.md` is the normative control table. It accounts for every interactive control on every specified screen.
- `data-requirements.md` describes what each screen displays and edits in product terms.
- `open-decisions.md` starts from the decisions above and adds anything new.

## Design handoff documents

```text
design/handoff/AI Creation Platform Design Reference.md
design/handoff/AI Creation Platform Design Handoff Plan.md
```

The **Design Reference** is the visual and behavioral authority. For every screen it records what a prototype would have carried: declared surface; exact layout and element order; font, color, spacing, border, radius and shadow values from the design system; verbatim copy; every state and interaction state; the route, params, navigation container, presentation and guard; each control's action, target, states and observable result; and each scroller's snap, visible items, peek and affordance. It also records identity, canonical demo data, the route graph and planned-but-not-specified gaps.

The **Design Handoff Plan** records screen, flow, route and control coverage, design dependencies, the MVP boundary, unresolved design work and per-screen Fidelity QA (the built screen against its Design Reference section).

Both files link to each other. The Design Reference owns look and interaction; the Handoff Plan owns design-derived sequencing. For every data-backed interaction both identify the observable result, the required UI states and the business rule. The production owner, transport, cache, validation and security layer are recorded in the root Product Specification's production mapping, verified against the repository.

## Output tree

```text
design/
├── CLAUDE_DESIGN_PROMPT.md   # this prompt
├── system/                   # normative design-system Markdown
├── planning/                 # scope, IA, routes, flows, journeys, inventories, open decisions
└── handoff/
    ├── AI Creation Platform Design Reference.md
    └── AI Creation Platform Design Handoff Plan.md
```

Then, at the repository root: `Product Specification.md`, `Implementation Plan.md` and `TASK_ai-creation-platform.md`.

## Implementation and report

Implement one Implementation Plan phase at a time in the owning app (`apps/app-web` for UI, `apps/app-api` for backend operations), following the phase's pattern scan and production mapping. Reuse the repository's components, routing, GraphQL client and codegen, TanStack Query operations, form schemas, auth, storage and repository layer. Never ship mock data, fake persistence or placeholder handlers as finished UI.

Finish with an implementation report: UI skills used, documents written, screens built with their routes and source files, route and control coverage, states implemented, verification results, blocked screens and open decisions.

No output may contain passwords, API keys, tokens, connection strings, private customer data or other secrets. Demo people, products, prices, links and credit values are fictional and stay on `example` domains.
