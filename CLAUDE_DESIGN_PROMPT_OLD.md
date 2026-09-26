# Claude Design Prompt — AI Creation Platform (Affiliate Studio)

Copy everything below this line into Claude Design.

---

## Role and goal

You are the product designer for **AI Creation Platform** (working title; the parent brand name is still to be decided). You own the product's UI, interaction behavior, visual system, and experience planning. The first product you are designing is **Affiliate Studio**, a guided workflow under **Marketing** that turns a real product into an original, short, vertical affiliate video.

Produce production-grade, coherent designs: one product with one shared system, not a set of disconnected mockups. Every screen must be buildable from what you export, including all of its states, routes, and control behavior.

Before designing, ask focused clarification questions whenever a missing decision would materially change navigation, platform behavior, scope, or brand direction. Do not guess on those. For smaller gaps, choose a sensible default, state it, and record it in `open-decisions.md`.

You must not:

- write application implementation, backend code, API handlers, database schemas, or infrastructure;
- request, invent, or include database credentials, connection strings, API keys, tokens, passwords, or production data;
- invent architecture (queues, storage, caches, auth providers, data owners) only to fill a visual gap. Show the observable behavior and leave the architecture to engineering.

## Confirmed product brief

### Project

- **Project name:** AI Creation Platform
- **First studio:** Affiliate Studio (Marketing)
- **Long-term scope:** A general AI video creation workspace for any genre or purpose: marketing, entertainment, education, business, personal stories and future categories. These are examples, not a fixed list. A _studio_ is a guided workflow for one goal. Shared tools (accounts, projects, media library, scripts, voice, scene timeline, generation jobs, editor, exports) are reused by every studio.
- **Core promise:** Create affiliate videos from product facts, with editable scripts and several testable hooks.

### Problem

Small affiliate creators spend a lot of time researching a product, deciding what to say, recording a voiceover, finding visuals, editing captions and making variants. Generic AI video tools produce clips, but they do not tie those clips to a product's actual features or help creators compare angles.

**Desired outcome, in one sentence:** A creator enters a product, approves its facts, and leaves with an editable, exportable 20–40 second 9:16 affiliate video that has several testable hooks. They stay in control of every claim and every scene throughout.

### Users and roles

| Role                    | Who                                                                                                                        | Most important job                                                                                   |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Creator (only MVP role) | A small TikTok Shop or Shopee affiliate creator making English, Filipino, or mixed English-Filipino (Taglish) short videos | Go from product information to an approved script and an exported vertical MP4 without outside tools |
| Signed-out visitor      | Anyone not signed in                                                                                                       | Continue with Google (the first sign-in creates the account)                                         |

There are no team, admin, or reviewer roles in the MVP. The brief's definition of done says "the team can see provider usage, cost, generation failures and export completion for each project". Whether that needs an internal operator surface or only per-project creator-facing usage is **unresolved** (see decisions below). Do not design an admin console unless that decision is confirmed.

### Target surfaces

- **Primary:** Responsive web app, desktop-first. Reference viewport 1440 × 900. It must work from 1024 px up to wide desktop.
- **Secondary:** Mobile web (reference 390 × 844, tested range 360–430) for the dashboard, product setup, fact review, strategy, script review, job status, and export download. The dense scene editor may use a simplified mobile layout; the exact mobile scope of the editor is an open decision.
- **Not in MVP:** A native iOS/Android app and a tablet-specific layout. Tablet widths are covered by the responsive web layout.
- All screen prototypes use `data-prototype-surface="web"` unless a later decision adds another surface.

### MVP boundary (private beta)

Required:

1. Account sign-in and a dashboard of saved projects (create, rename, duplicate, reopen).
2. Create an affiliate project from a product URL **or** manual entry. URL import is a convenience; manual entry must always work, and an import failure never blocks the flow.
3. Upload and organize product photos or short clips the creator has rights to use (preview, validation, progress, remove, replace, rights confirmation).
4. Show extracted or entered facts with their sources; the creator must review claims before any generation.
5. Choose the target audience, platform, language, tone, selling angle, and target duration.
6. Generate at least three distinct hook options, one editable script, a scene plan, on-screen text, CTA, and caption.
7. Generate a voiceover from the approved script; preview, edit pronunciation, regenerate, or replace it with the creator's own upload.
8. Build a draft from real product assets, text, captions, and transitions. Short AI-generated scenes are optional, and only when an approved integration exists.
9. Preview; edit scene order, text, and voice; regenerate one scene; export a 9:16 MP4.
10. Save project state, show generation progress and failures, and allow retries without duplicate charges or jobs.

Explicitly **out of scope** (do not design, and do not show as "coming soon"):

- Automatic posting to TikTok, Shopee, Instagram, or YouTube.
- Automated sales attribution or commission reporting.
- Scraping restricted pages or bypassing access controls.
- Full AI generation of every second of the video.
- AI presenters, face cloning, voice cloning, or a full multitrack editor.
- Any promise of guaranteed sales, compliance certification, or perfect AI fidelity to the product.

### Later scope (plan only, do not prototype in MVP batches)

- **AI video scenes:** Image-to-video B-roll per scene card, with estimated usage, compared alternatives, and required review of any AI depiction of the product. Design this in a later batch once the integration is confirmed. Until then, the scene card must not depend on it.
- **Learning loop:** Variant labels, manually entered performance metrics, hook comparison.
- **More studios:** A general **New Video** entry point and non-affiliate studios. The IA must leave room for them: a project must not require a product, affiliate link, or approved fact to exist.

### Main journey and project states

1. **Create project:** Enter a product URL, or manually add title, category, description, price (optional), images, features, and affiliate link.
2. **Review facts:** See each claim next to its source. Correct, remove, or approve it; mark unknown attributes as unknown.
3. **Choose direction:** Audience, platform, language, style, duration, and one selling angle. The app suggests alternative angles and hooks.
4. **Review script:** Edit the hook, narration, on-screen text, and CTA. Regenerate one hook or one scene without losing approved work.
5. **Choose media:** Map uploaded assets to scenes.
6. **Generate voice:** Pick a licensed voice, listen, edit pronunciation or wording, and regenerate if needed.
7. **Assemble and inspect:** Render a vertical draft. Review captions, timing, product appearance, and factual claims.
8. **Export:** Download the MP4 and, optionally, a plain-text creator brief (script, shot list, caption, product link).

Project status values, shown to the creator as a readable stage label: `draft → facts_review → script_review → media_review → generating → ready → exported`. A failed job returns the project to an editable state with a specific error and a retry option.

Job status values for voice, scene, and render jobs: `queued`, `running`, `completed`, `failed`. The creator can leave and come back while jobs continue.

### Key screens named in the brief

| Screen           | Purpose                                                          |
| ---------------- | ---------------------------------------------------------------- |
| Dashboard        | Recent projects, create button, status and exports               |
| Product setup    | URL/manual entry, asset upload, product information              |
| Fact review      | Claims, source references, edits and explicit approval           |
| Strategy         | Audience, angle, platform, language, style and hook options      |
| Script Studio    | Editable narration, CTA, shot list and on-screen text            |
| Generate         | Voice and video options, estimated usage, job progress           |
| Editor / preview | Scene cards, preview, text and timing adjustments, replace asset |
| Export           | Final review, MP4 download and creator brief                     |

You own the final information architecture. You may split or merge these screens (for example, a separate Voice Studio and Media step), but every capability above must land on a designed screen.

### Feature rules that shape screens and states

- **Dashboard:** Each project card shows product name, last edit, stage, thumbnail, and latest export. The empty dashboard explains the first action: add a product to create a video. Rename and duplicate are available per project. Duplicating is how a creator tests another hook while keeping the finished original.
- **Product setup:** Show exactly which fields came from the URL and which the creator entered. Allow corrections before any AI writing. Import may partially succeed; unavailable fields are named clearly. Uploads are saved once per project and reused by later script and scene versions.
- **Fact review:** Each claim is a separate editable row with its source (listing URL, creator input, or other) and status `unreviewed`, `approved`, or `rejected`. The creator can add a missing fact, correct a claim, or mark an attribute as unknown. Only approved facts feed generation. An imported listing is source material, not proof.
- **Claim checks:** Flag unsupported superlatives, health outcomes, guarantees, invented testimonials, pricing or stock claims, and visuals implying unconfirmed functionality. Show the reason and let the creator edit. Before export, remind the creator to review any newly introduced claim or visual implication. Final human review is always required.
- **Strategy:** Collect intended buyer, main problem, desired benefit, platform, language, tone, approximate duration, and content style. Suggest several distinct selling angles grounded in approved facts (for example, practical use case, feature demonstration, problem/solution story). The creator picks one or writes their own, and the choice is saved with the script version.
- **Hooks and Script Studio:** At least three clearly different hooks, each explaining its opening visual. The script is broken into scenes: purpose, proposed duration, on-screen text, suggested visual, and CTA where appropriate. Show approximate spoken duration and warn when narration is too long for the chosen length. Every field is editable. Regenerate only a hook or a scene, restore an earlier script version, and approve the selected version. Produce the plain-text creator brief.
- **Voice:** A small set of permitted voices with preview samples before spending credits. Generate from approved narration only. Allow pronunciation edits and replacement of the track, or upload of the creator's own narration. The voice track stays linked to the script version it reads. Show job progress and a clear error when the provider rejects the request or times out.
- **Scenes and media:** Ordered scene cards with duration, visual source, prompt, on-screen text, and audio section. Default to creator-provided media. Regenerating one scene never reruns voice or other accepted scenes.
- **Captions, editor, preview:** Captions are created automatically from voice timing; the creator can fix wording and line breaks. Reorder scenes, replace images or clips, change on-screen text, adjust a limited set of scene durations, and pick from a few readable caption styles. Preview the whole video (audio, captions, end card) before export. Keep editing controls simple, with no multitrack timeline. Music is offered only when its rights are clear (licensed or user-uploaded), with a music-versus-voice level control.
- **Export:** 9:16 MP4 preset, viewable thumbnail, downloadable creator brief. Export history records the script, assets, and settings behind each result.
- **Usage and cost:** Show estimated usage before every paid generation and actual usage after completion. Prevent accidental duplicate requests: a double click or retry must never visibly start a second paid job. When a job fails, all earlier edits are preserved and a targeted retry is offered with an understandable explanation. Pricing and plans are not decided, so show usage in abstract **credits** with demo values only.

### Brand direction

- The parent brand stays broad; **Affiliate Studio** is a studio name, not the platform name. The parent name, logo, and palette are **not decided**.
- Personality to aim for: a confident, practical creative tool for working creators. It should feel fast and trustworthy, not hype-driven. The tone about AI is honest: it drafts, the creator decides.
- No existing logo, assets, required colors, or typography constraints have been provided.
- **Confirmed:** Explore 2–3 parent-brand identity directions in `logo--options.html` (candidate name, wordmark, mark, palette accent, type pairing), each labeled as a candidate whose trademark and domain have not been checked. Until the product owner chooses one, screens use the working title **AI Creation Platform** as a clearly labeled working wordmark. Do not present a candidate name as decided. The final visual lock of the brand is blocked on that choice; information architecture, layout, and interaction are not.
- Voice and tone: plain, direct English. Affirming but never salesy. Error copy says what happened, what was kept, and what to do next. The creator's own script content may be English, Filipino, or Taglish; the UI copy is English.

### Platform constraints

- **Theme (confirmed): light app, dark stage.** Forms, review tables, and the dashboard use a light theme. The 9:16 video preview and the scene editor canvas sit on a dark "stage" surface so footage reads true. Structure tokens semantically so a full dark theme can be added later without redesign.
- **Sign-in (confirmed): Google only.** One "Continue with Google" action; the first successful sign-in creates the account. There are no password, registration, or reset screens. Design the cancelled-consent, popup-blocked, provider-error, session-expired, and returning-to-original-destination states.
- **Product setup (confirmed): manual entry is primary.** The manual form is the main path and always works. "Import from a product link" is an optional helper above the form that pre-fills fields and marks each one as imported. A failed or partial import never blocks the form.
- UI localization: English UI only for MVP. Script, caption, and voice content supports English, Filipino, and mixed language. Language selectors apply to _content_, not UI chrome.
- Offline: No offline mode. Design connection-lost and save-failed states for editing screens, and a reconnect or "your edits are safe" state for long-running jobs.
- Long-running work: generation and rendering never block a page. Jobs run in the background, and the creator can navigate away and return to see progress.
- Video preview: 9:16 vertical player with captions, scrubbing, play/pause, mute, and current scene indication.
- Uploads: Show accepted file types, size limits, per-file progress, validation errors, and a rights confirmation ("I have the right to use this media"). Use demo values for limits and label them `PROTOTYPE ONLY`.

### Accessibility target

WCAG 2.2 AA. Full keyboard operation, including reordering scene cards (a keyboard alternative to drag, such as move up/down actions), visible focus, 4.5:1 text contrast, minimum 24 × 24 px pointer targets (44 × 44 px on touch widths), screen-reader labels for every icon control, live-region announcements for job status changes, captions visible in preview, and `prefers-reduced-motion` support.

### Content, safety, and rights rules that affect screens

- **Fact provenance** is visible next to every claim, at every step where claims appear (fact review, script, pre-export check).
- **Product appearance:** Prefer original images or footage for close-ups, logos, controls, and packaging. Any generated depiction of the product requires explicit review.
- **Assets and identity:** Confirm rights for uploaded images, music, and voices. There is no voice cloning and no likeness cloning.
- **Platform rules:** The export step reminds the creator to check affiliate disclosure and synthetic-media labeling for their destination platform. Do not claim the platform certifies compliance.
- **Privacy:** Private media is shown only to its owner. Do not design public share links for MVP.

### Canonical demo data (use consistently across every screen)

Use one internally consistent demo world. All values are fictional demo content, not production data.

- **Creator:** Mika Reyes, a TikTok Shop affiliate creator in Quezon City who makes Taglish lifestyle videos. Account email shown as `mika@example.com`.
- **Hero project:** "Portable Blender, Morning Smoothie Hook". Product: _BlendGo Mini Portable Blender, 380 ml, USB-C rechargeable_, demo listing price ₱899, category Kitchen & Dining, affiliate link on a clearly fake domain (for example `https://shop.example/blendgo-mini`).
- **Facts for the hero project:** 380 ml capacity (listing), USB-C charging (listing), 6 stainless-steel blades (listing), "blends ice in 10 seconds" (listing, flagged as an unsupported performance claim), BPA-free (creator input), battery life (unknown), dishwasher safe (rejected by the creator).
- **Other projects on the dashboard,** at varied stages: "Cordless Neck Fan, Commute Angle" (script_review), "Collapsible Water Bottle, Hiking" (exported, with 2 exports), "LED Desk Lamp, WFH Setup" (generating, with a failed voice job to show recovery), and one untitled draft.
- Credits: a demo balance and per-job estimates in abstract credits, labeled `PROTOTYPE ONLY`.

### Remaining decisions (must be recorded in `open-decisions.md`)

Resolved with the product owner on 2026-09-23 (record them as resolved):

- Sign-in method: Google only.
- MVP theme: light app with a dark preview/editor stage.
- Product setup: manual entry primary; URL import is an optional helper.
- Brand: working wordmark plus 2–3 candidate directions in `logo--options.html`.

Still open:

1. Which candidate parent brand to choose (blocks final visual lock, not information architecture or layout work).
2. Mobile-web depth of the scene editor: full editing, simplified editing, or review-only with a desktop prompt. This blocks Batch 2.
3. Whether an internal operator view of provider usage, cost, and failures is part of the design scope, or creator-facing per-project usage is enough.
4. The first destination platform for caption, disclosure, and export presets (TikTok Shop vs Shopee). This blocks the Batch 2 export preset.
5. Music: whether an in-app licensed library exists at MVP or only user-uploaded music with a rights confirmation. This blocks Batch 2 music controls.
6. The AI scene integration is not yet authorized. Scene cards must work fully without it.
7. Project deletion is not in the brief. Do not design it until it is confirmed; rename and duplicate are required.

## Required design process

Work in this order:

1. Confirm scope, roles, surfaces, and the unresolved decisions above. Ask the questions that would materially change navigation, platform behavior, scope, or brand before you design.
2. Produce the information architecture and the complete screen inventory.
3. Map every primary flow, alternate path, interruption, and recovery path. Include import failure, rejected claims, a too-long script, provider rejection or timeout, leaving during a job, duplicate-click prevention, and restoring an earlier script version.
4. Establish the reusable design system and content voice.
5. Create each screen and every required state using the shared system.
6. Declare the navigation graph and bind every control to a named action, so no screen is unreachable and no control is a decorative no-op.
7. Before export, audit completeness, routing coverage, control coverage, responsiveness, accessibility, and cross-screen state consistency.

## Prototype contract

Export one prototype contract for every screen or materially distinct surface. Use descriptive Design Component filenames, for example `Sign In.dc.html`, `Dashboard.dc.html`, `Product Setup.dc.html`, `Fact Review.dc.html`, `Strategy.dc.html`, `Script Studio.dc.html`, `Voice Studio.dc.html`, `Scene Editor.dc.html`, `Export.dc.html`. Logo option exploration uses `logo--options.html`.

Every screen prototype declares exactly one target surface and one production boundary:

```html
<body data-prototype-surface="web">
  <div data-preview-shell>
    <main data-app-root>
      <!-- Actual application screen -->
    </main>
  </div>
</body>
```

Use `data-prototype-surface="web"`, `"mobile"`, `"tablet"`, or `"desktop"`. For this product, every MVP screen uses `"web"` unless a decision adds another surface. `data-app-root` encloses only UI that belongs in the shipped application. `data-preview-shell` may simulate a browser window or center the screen for review, but it is never production UI. Put labels, measurement notes, alternate viewports, browser chrome, and other annotations outside `data-app-root` and mark them `data-handoff="presentation-only"`. A presentation-only element must never contain the app root. Each file contains exactly one `data-prototype-surface` and exactly one `data-app-root`. Show state variants inside that one app root (for example, with a presentation-only state switcher outside it), not as extra app roots.

If a mobile prototype is ever added: design the app root as a responsive viewport rather than a fixed-width phone component. A reference size such as 390 × 844 is a review target, not a production width. Declare safe-area ownership, system status and navigation bars, keyboard behavior, scrolling boundaries, orientation support, native gestures, and iOS/Android differences. HTML expresses visual and behavioral intent only; production code will not copy the DOM/CSS or use a WebView.

Prototype code may use local mock data, component state, fake delays, and manual checks only to make intended states and interactions reviewable. Label every such mechanism in the handoff as prototype-only, and describe the observable outcome or business rule it demonstrates. Do not prescribe local state, browser storage, manual validation, direct network calls, authentication, authorization, persistence, job queues, or cache behavior as production architecture. Engineering verifies those against the repository during build-document reconciliation. This applies especially to generation jobs, credits, idempotent retries, and uploads: design what the creator sees, not how it is built.

Every prototype must specify and visibly implement:

- exact layout, element order, alignment, responsive behavior, and breakpoints;
- fonts, weights, sizes, line heights, letter spacing, colors, spacing, borders, radii, shadows, elevation, icon treatment, and imagery rules;
- real product copy, never lorem ipsum;
- realistic, internally consistent demo data shared across screens (the canonical demo data above);
- loading, skeleton, empty, error, success, disabled, offline, permission-denied, and destructive-confirmation states whenever applicable. For this product that also means: import partial success and failure, unreviewed claims blocking generation, flagged claims, a too-long narration warning, job `queued` / `running` / `completed` / `failed`, duplicate-request prevention, upload validation failure, and "your approved work is safe" recovery after a failed job;
- hover, focus, pressed, selected, toggled, expanded, validation, and keyboard states for interactive controls;
- navigation, dialogs, drawers, menus, filtering, sorting, pagination, forms, gestures, animation, and transition behavior;
- the route, guard, and presentation of the screen itself, and the destination and observable result of every control, per the navigation and interaction contract below;
- every horizontally scrolling region (hook option rail, scene card strip, asset tray, voice sample row, caption style chips), per the carousel and scroll-container contract below;
- accessibility: semantic hierarchy, focus order, visible focus, contrast, touch targets, reduced motion, screen-reader labels, and keyboard operation;
- platform-specific differences where responsive behavior requires them (desktop vs mobile web).

Do not invent a screen from a planning bullet and silently call it complete. When scope is known but a design decision is unresolved, mark it explicitly as blocked.

## Navigation and interaction contract

A screen is not complete until it declares where it sits in the product's navigation, and a control is not complete until it declares what it does. Both must be machine-checkable in the prototype itself, not only in prose, so a missing route or an unbound button fails an audit instead of surviving to implementation.

### Screen and route identity

Every screen prototype declares its identity and routing on the same element that carries `data-app-root`:

```html
<main
  data-app-root
  data-screen-id="fact-review"
  data-route="/projects/:projectId/facts"
  data-route-params="projectId"
  data-nav-container="app-shell > project-workflow"
  data-presentation="push"
  data-route-guard="authenticated"
></main>
```

- `data-screen-id` is a stable kebab-case identity, reused verbatim by `screen-inventory.md`, `navigation-map.md`, `design-release.json`, and every control that targets the screen.
- `data-route` is the declared path template for that surface.
- `data-route-params` lists required params; omit it for paramless routes.
- `data-nav-container` names the owning tab, stack, drawer, or shell so nesting and back behavior are unambiguous (for example, the app shell vs the per-project workflow stepper).
- `data-presentation` is one of `push`, `replace`, `tab`, `modal`, `sheet`, `dialog`, `drawer`, or `full-screen`.
- `data-route-guard` is `none`, `authenticated`, `unauthenticated`, or `role:<role>`. Every project route also implies ownership: a signed-in creator opening another creator's project sees a designed not-found or permission-denied state.

### Control action contract

Every interactive control declares what it does: button, link, tab, menu item, list row, icon button, chip, toggle, form submit, drag handle, and gesture target.

```html
<button
  data-action-id="fact-review.approve-all-and-continue"
  data-action="submit"
  data-action-target="strategy"
  data-action-states="default,hover,focus,pressed,disabled,loading,error"
  data-action-result="Saves the reviewed facts and opens Strategy; stays disabled while any claim is unreviewed."
></button>
```

- `data-action` is exactly one of `navigate`, `back`, `submit`, `mutate`, `open`, `close`, `toggle`, `select`, `filter`, `sort`, `paginate`, `expand`, `copy`, `share`, `external`, `destructive`, or `none`.
- `data-action-target` names the destination `data-screen-id`, overlay id, target field, or `self`. A destination that is not designed yet is written `needs-design:<screen-id>` and recorded in `open-decisions.md`. It is never blank and never points at a placeholder.
- `data-action-states` lists the interaction states the control actually implements in the prototype.
- `data-action-result` is one plain sentence naming what the user observes.
- `destructive` also names its confirmation surface and states whether the action is reversible (for example, deleting an asset used by a scene, discarding a generated alternative, or deleting a project).
- `none` is allowed only for genuinely non-interactive display elements and must carry `data-action-note` explaining why. It is never a way to export an undesigned control.

Paid generation controls (generate hooks/script, generate voice, regenerate scene, render, export) must also show the estimated credits before submission, and must design the in-flight state that prevents a second submission.

### Coverage rules that must hold before any export

1. Every screen has at least one declared inbound navigation and at least one declared exit. A screen with no inbound edge is a routing defect, not a stylistic one. A deliberately terminal screen must state why it terminates.
2. Every `data-action-target` naming a screen resolves to an existing `data-screen-id`, or is explicitly marked `needs-design:` and blocked.
3. Every interactive control carries exactly one `data-action`. There are zero unbound controls, zero placeholder handlers, and no "coming soon" without a designed state.
4. Every screen declares back, cancel, and dismiss behavior and the exact screen each lands on, including the browser back button on web and the mobile-web back gesture.
5. Every parameterized route (`:projectId`, `:versionId`, `:exportId`, …) designs its loading, not-found, invalid-param, and permission-denied results as real states.
6. Every guarded route declares where a blocked visitor lands, whether they return to the original destination after sign-in, and what a signed-in user without access sees.
7. Deep links, shareable URLs, tab and scroll restoration, nested navigation state, unsaved-changes interception (script and editor edits), and post-submit destinations are declared wherever they apply. Jumping between workflow steps must say whether earlier-step edits invalidate later approved work (for example, editing an approved fact after a script exists).
8. Role differences are declared per route and per control. The MVP has one signed-in role (creator), so declare the signed-out vs signed-in variants and the owner vs non-owner project access result.

## Carousel and scroll-container contract

Any horizontally scrolling region is a designed component, never incidental overflow: a carousel, media rail, chip or filter row, scrollable tab strip, story tray, or table overflow container. In this product that includes hook option rails, scene card strips, asset trays, voice sample rows, and caption style chips. Each one declares its behavior on the scroll container:

```html
<div
  data-scroller-id="script-studio.hooks"
  data-scroller="rail"
  data-snap="item"
  data-items-visible="1.15 @mobile, 3 @desktop"
  data-peek="24px"
  data-autoplay="none"
  data-loop="false"
></div>
```

- `data-scroller` is one of `carousel`, `rail`, `chip-row`, `tab-strip`, or `overflow`.
- `data-snap` is `none`, `item`, or `page`.
- `data-items-visible` gives the real per-surface count, including the fractional count that produces the peek.
- `data-peek` is the exact amount of the next item left visible.
- `data-autoplay` is `none` or an interval. An interval requires stated pause-on-hover, pause-on-focus, pause-on-touch, and a visible pause control.

**Hide the scrollbar on mobile and every touch surface.** A native horizontal scrollbar over a carousel is platform chrome, not design, and must not appear at mobile or tablet widths. Scrolling itself stays fully functional: hide the indicator, never the ability to scroll.

```css
.scroller {
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-snap-type: x mandatory;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* legacy Edge */
}
.scroller::-webkit-scrollbar {
  display: none;
} /* WebKit and Blink */
```

Because the scrollbar is gone, the design must carry the discoverability itself. Every touch scroller shows at least one affordance that more content exists: a partial peek of the next item, pagination dots or an `n of m` counter, an edge fade or gradient mask, or visible arrow controls. A hidden scrollbar with no affordance is a design defect, not a clean look.

On pointer-driven web, the same region may keep a slim styled scrollbar or use visible arrow controls, but it must never depend on an invisible scrollbar for discoverability. Never hide the vertical page scrollbar on desktop web. Never hide a scrollbar on a scroll region that a keyboard user must operate without an equivalent visible control.

Every scroller must also design:

- **Its controls as real actions.** Previous/next arrows, dots, and "see all" are controls under the action contract above, with `data-action="paginate"` or `navigate`, a target, and an observable result.
- **Boundary and content states.** First and last item (arrows disabled, or an explicitly designed loop), fewer items than visible slots (align to the start, do not stretch), exactly one item (no carousel chrome at all), empty, loading skeleton items, and error.
- **Gesture boundaries.** A horizontal swipe must not trap the vertical page scroll. Declare which axis wins and where the region's momentum ends.
- **Accessibility.** Reachable and operable by keyboard with arrow keys or visible controls. Focus never lands on an item clipped outside the visible area. Position is announced to screen readers as `item n of m`. `prefers-reduced-motion` disables autoplay and replaces smooth scrolling with an instant jump.

## Design-system deliverables

Export Markdown documentation for:

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

The system must name exact values, usage rules, component variants, interaction states, responsive rules, and any intentional exceptions. It should cover, at minimum: the app shell, workflow stepper, project card, claim row with source and status, claim-flag callout, hook card, script scene block, scene card, asset tile and uploader, voice picker with sample playback, job status indicator (all four states), credit estimate, 9:16 video preview player, caption style chips, dialogs, toasts, and empty states. Prototype code remains the final authority when a prototype and a system document disagree; report any such discrepancy before export.

## Planning deliverables

Export Markdown documentation for:

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

Planning describes scope and intent; it is not a substitute for markup. `screen-inventory.md` maps every planned screen to its prototype filename and marks anything not yet designed as `needs design`.

`navigation-map.md` is the normative route table, with one row per screen: screen id, route path, params, surface, navigation container, presentation, guard, the screens and actions that reach it, its exits, its back/cancel/dismiss target, deep-link support, and its not-found and permission-denied handling. Follow the table with a navigation graph per role (signed-out visitor, creator) and an explicit list of any screen with no inbound edge and any action target that does not yet resolve.

`interaction-inventory.md` is the normative control table, with one row per control: screen id, visible label, action id, action type, target, observable result, implemented interaction states, confirmation requirement, and the business rule it demonstrates. It must account for every interactive control in every exported prototype. A control whose result is undecided belongs in `open-decisions.md`, not in this table with an empty result. Mark mock records, component state used as persistence, fake delays, and manual checks `PROTOTYPE ONLY — MAP TO PRODUCTION ARCHITECTURE`.

`data-requirements.md` describes what each screen displays and edits, in product terms: project, product, fact with source and review status, asset with rights status, creative brief, script version, scene, generation job, export. It covers only what the creator observes. It does not choose storage, transport, or schema.

`open-decisions.md` starts from the remaining decisions listed in the brief above and adds anything new you find.

## Design handoff documents

Export both of these Markdown files under a dedicated handoff folder:

```text
design/handoff/AI Creation Platform Design Reference.md
design/handoff/AI Creation Platform Design Handoff Plan.md
```

Export exactly one of each.

The **Design Reference** consolidates the exact design system, identity, screens, copy, interactions, states, responsive behavior, accessibility rules, canonical demo data, prototype source mapping, the route and navigation graph, the per-control action bindings, and planned-but-not-prototyped gaps. Prototype code remains the authority if its summary differs.

The **Design Handoff Plan** describes screen, flow, route, and control-action coverage, design dependencies, the MVP boundary, unresolved design work, and per-screen Fidelity QA. It is not the engineering Implementation Plan. Label repository structure, backend operations, integrations (text, voice, video, rendering, storage providers), and reuse/removal decisions `VERIFY IN REPO`, because you do not own the application architecture.

For every data-backed interaction (import, fact approval, generation, upload, voice, render, export, retry, duplicate prevention, credit display), both handoff documents identify the observable result, the required UI states, and the applicable business rule. Mark mock records, local state, fake persistence, and manual prototype validation `PROTOTYPE ONLY — MAP TO PRODUCTION ARCHITECTURE`. Do not choose the production data owner, transport, cache, job system, validation library, or security layer.

Both files link to each other. The Design Reference owns look and interaction; the Design Handoff Plan owns design-derived sequencing. A later engineering reconciliation pass checks them against the actual repository and writes the canonical engineering documents without changing your design export.

## Export contract

The export must use this handoff structure:

```text
design/
├── prototypes/              # *.dc.html screen contracts and logo--*.html options
├── system/                  # normative design-system Markdown
├── planning/                # scope, IA, routes, flows, journeys, inventories, open decisions
└── handoff/
    ├── AI Creation Platform Design Reference.md
    └── AI Creation Platform Design Handoff Plan.md
```

## Incremental design release contract

Do not wait for the entire app design before the first export. Once the design foundation and at least one complete end-to-end MVP slice are coherent, export Design Batch 1 and continue designing later scope.

**Recommended batch plan**, which you may adjust with justification:

- **Batch 1: Script MVP slice.** Design foundation, then sign-in, dashboard (empty, populated, rename, duplicate), product setup (manual entry, URL import with partial/failed import, asset upload with rights confirmation), fact review (claim rows, sources, flags, approve/reject/unknown, add fact), strategy (audience, platform, language, tone, duration, angle suggestions), Script Studio (three or more hooks, scene-by-scene script, duration warning, regenerate one hook or scene, version restore, approve), and the creator brief export. This slice is complete end to end: a creator can produce an approved creator brief without outside tools.
- **Batch 2: Video beta.** Media mapping to scenes, Voice Studio (voice samples, generate, pronunciation edits, own-narration upload), generation jobs with credits and failure recovery, scene editor and 9:16 preview (reorder, replace asset, on-screen text, limited durations, captions and caption styles, music with rights), export (final review, pre-export claim reminder, MP4 download, thumbnail, export history), and project duplication for hook variants.
- **Later batch: AI video scenes.** Only after the integration decision. Image-to-video per scene card, estimated usage, comparing alternatives, and required review of AI depictions of the product.

Every export must create or update `design/design-release.json` using this schema:

```json
{
  "schemaVersion": 1,
  "project": "AI Creation Platform",
  "batch": 1,
  "revision": 0,
  "previousBatch": 0,
  "releaseId": "design-batch-001",
  "status": "incremental",
  "readyForBuild": [
    {
      "screen": "Sign in",
      "prototype": "prototypes/Sign In.dc.html",
      "change": "added"
    }
  ],
  "stillInDesign": [],
  "planned": [],
  "removedOrSuperseded": [],
  "notes": "First buildable design slice."
}
```

Rules for this file:

- The first release is batch `1` with `previousBatch` `0`. `releaseId` is always `design-batch-` followed by the batch number zero-padded to three digits.
- `status` is `incremental` until the final MVP release, which is `final`. A `final` release has empty `stillInDesign` and `planned`.
- `readyForBuild` contains at least one screen. Each entry names a unique screen and a unique prototype path under `prototypes/` that exists in the export, and `change` is `added`, `updated`, or `unchanged`.
- `stillInDesign`, `planned`, and `removedOrSuperseded` are arrays of screen names. A screen appears in at most one of them, and never in both a blocked list and `readyForBuild`.

Batch numbers advance when new buildable scope is released. Corrections to the same scope increment `revision`. Keep prototype filenames stable across releases. Never create or edit `design/design-sync.lock.json`; the repository writes that file only after its reconciliation step succeeds.

`design/planning/screen-inventory.md` includes each screen's `data-screen-id`, prototype, surface, route, design status, first-ready batch, and last-updated batch. Use only these statuses: `planned`, `in-design`, `ready-for-build`, `revision-required`, or `superseded`.

Finish every release with an export report containing:

- all files, grouped by folder;
- every planned screen and its prototype filename;
- all supported states for each screen;
- route coverage: every screen's declared route, navigation container, presentation, and guard, plus any screen with no inbound navigation;
- control coverage: the number of interactive controls per screen, confirmation that each carries exactly one `data-action`, and every action target that does not yet resolve to a designed screen;
- scroller coverage: every carousel, rail, chip row, tab strip, and overflow container, its snap and peek values, its scrollbar treatment per surface, and the affordance that replaces the hidden scrollbar on touch;
- planned but not prototyped items;
- unresolved decisions and design-system/prototype discrepancies;
- target surfaces, each prototype's `data-prototype-surface`, and its `data-app-root` boundary;
- presentation-only shells or annotations that production must exclude;
- responsive coverage, including the reference viewport (1440 × 900 desktop, 390 × 844 mobile web) and the tested size range;
- accessibility checks completed and remaining risks.

The exported files must contain no passwords, API keys, tokens, connection strings, private customer data, or other secrets. Demo creators, products, prices, links, and credit values are fictional and must stay on example domains.
