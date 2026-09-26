# Components and states

This document and the per-screen specs in the [Design Reference](../handoff/AI%20Creation%20Platform%20Design%20Reference.md) are the component contract (there is no prototype in this mode). Production builds each component on the shadcn/Radix primitives in `apps/app-web/components/ui`, restyled to these values. When a screen needs a variant that isn't here, add it here first.

The standard interaction states are default, hover, focus-visible, pressed, disabled, loading and error. Each control declares the states it implements in `data-action-states`.

## Buttons

| Variant | Default | Hover | Pressed | Disabled | Loading |
| --- | --- | --- | --- | --- | --- |
| Primary | `--primary` fill, white text | `--primary-hover` | `--primary-pressed` | `--surface-sunken` fill, `--ink-3` text, `not-allowed` cursor | Spinner replaces the icon, label becomes a progressive verb (“Writing…”), `aria-busy="true"`, `aria-disabled="true"` |
| Secondary | White, 1px `--border-strong` | `--surface-hover` | `--surface-sunken` | as primary | as primary |
| Ghost | Transparent | `--surface-hover` | — | as primary | — |
| Danger | `--danger`, white text | `#9A1D13` | — | as primary | as primary |

- **Sizes:** 40px tall, 16px padding, 10px radius. Small is 32px, 12px padding, 6px radius. Below 1024px these become 44px and 36px.
- **Press:** `scale(0.97)` on `:active` (see [motion.md](motion.md)); removed under reduced motion.
- **Paid button:** a paid action appends a **cost segment**: a 1px divider, then the mono estimate (“3 credits”). The estimate is always visible before the click.
- **Icons:** 16px, leading. Directional arrows trail (“Continue to facts →”).
- **Focus:** a 2px `--focus` outline at 2px offset on every focusable element.

## Duplicate-request prevention (all paid and write actions)

On the first activation a button enters its loading state and ignores further activations until the request resolves. For long jobs, the page switches to a job status panel. Retrying after a failure reuses the same request, so the creator never sees two jobs for one click. This is an observable rule. The server enforces it with an idempotency key per request, so even a second tab cannot start a second paid job.

## Form fields

- A label above the control, with an optional `Required` or `Optional` marker in `--ink-3`.
- Controls are 40px (44px below 1024px), with a white fill, 1px `--border-strong` border and 10px radius. Hover darkens the border to `--ink-3`. Focus uses a `--focus` border plus a 3px focus halo.
- **Error:** the border turns `--danger`, `aria-invalid="true"` is set, and an error line below (`--danger`, alert icon) is referenced by `aria-describedby`. Messages say what to do (“Add a product title.”).
- **Hint:** 13px `--ink-3` below the control, referenced by `aria-describedby`.
- **Source badge** (Product step): Imported, You entered or Edited, next to the label.
- **Prefix group:** a currency affix (₱) sits in a sunken cell joined to the input.
- **Checkbox:** 18px, `accent-color: --primary`, label to the right. Rights confirmation uses a two-line label.

## Chips, radio chips and segmented controls

- **Chip:** 32px (40px below 1024px), pill-shaped, `--border-strong`. When selected: `--ink` fill with white text. Used as `role="radio"` inside `role="radiogroup"` for single choice, or as filters.
- **Segmented control:** a sunken 3px track; the selected segment is white with `--e1`. Used for Length and for Approve/Reject on fact rows (selected Approve is success-filled, selected Reject is danger-filled).
- **Chip counts** use `t-mono` at 70% opacity.

## Badges

A 22px pill with a 6px leading dot, available in neutral, success, warning, danger, info and ink. The `no-dot` variant drops the dot and is used for fact chips (“Holds 380 ml”) and language tags.

## Banners

A full-width row: icon, message (bold lead sentence plus detail), and optional right-aligned actions.

- Info, success, warning and danger variants use the soft tint, border tint and dark text.
- `role="alert"` is used for errors that follow an action; `role="status"` for passive notices.
- Below 640px the actions wrap under the message.

## Claim flag callout

A warning-tinted block with a 3px left bar, a flag icon, a bold one-line reason (“Performance claim.”, “New claim: …”) and an explanation. It may include a text-link action.

- The flag is attached to its row or scene with `aria-describedby`.
- A flag never blocks approving a **fact**: the creator decides. It does block approving a **script version** until the flagged line is edited, or its claim is added and approved as a fact.

## Project card (Dashboard)

- **Layout:** an 88px 9:16 thumbnail (64px below 640px) with the body beside it: title (link), the studio's subject line (the product name, or for a story “Story · Comedy”; revised 2026-09-26, §3.23), stage badge, an optional recovery line in `--danger`, and meta (last edit · exports).
- **Hit area:** the whole card, via a stretched title link. The overflow menu (Open, Rename, Duplicate) sits above the stretched link.
- **States:** default; hover (`--border-strong` border, `--e2` shadow); focus-within (`--ink-3` border plus the link’s focus ring); skeleton; duplicating (skeleton thumbnail, “Copying…” line); draft with no product (dashed thumbnail with a plus, Duplicate disabled); (§3.23) story with no genre (the same dashed thumbnail, “Story · No genre yet” in `--ink-3`, Duplicate disabled with “Pick a genre first”).

## Workflow stepper

- **Rail (≥ 1024px):** a project header (caption: the project's studio, “Affiliate Studio” or “Entertainment Studio”; project title; the studio's subject line, the product name or a story's genre; revised 2026-09-26, §3.23), then the step groups. Each studio supplies its intake steps: a story shows **Plan** (1 Story, 2 Script), **Produce** (3 Media, 4 Voice, 5 Edit & preview) and **Deliver** (Creator brief, 6 Export video). Batch 1 shows **Plan** (1 Product, 2 Facts, 3 Strategy, 4 Script) and **Deliver** (Creator brief, with a document glyph instead of a number). Produce (5 Media, 6 Voice, 7 Edit & preview) appears between them once Batch 2 is built, and Deliver gains 8 Export video. Each row has a 24px number circle, a label, and a lock icon when locked.
- **Step statuses:** `done` (success circle with a check), `current` (flare circle, sunken row, `aria-current="step"`), `open`, and `locked` (`aria-disabled="true"`, lock icon, with the reason in the control’s result and accessible name).
- **Tab strip (< 1024px):** the same rows as chips in a horizontal scroller, with a “Step n of 5: Name” line (“Step n of 9” once Batch 2 is built; (§3.23) a story reads “Step n of 7”, or “Step n of 3” while the video beta is off). The edge fade shows there is more; there is no text hint.

## New video dialog (Dashboard, §3.23)

- **Frame:** 560px dialog (a bottom sheet below 640px) with the standard dialog anatomy; title “What are you making?”; footer **Cancel** only.
- **Body:** one studio card per built studio, in registry order, 2 columns at ≥ 640px and 1 below, gap 12px. Past 4 studios the body scrolls inside the dialog (max-height `min(560px, 70dvh)`) and the footer stays put. A studio that isn't built is never listed.
- **States:** default; creating (one card loading, all inert); failed (danger banner in the dialog, cards active again); offline (cards disabled, the offline detail). Escape, the close icon and Cancel close it and return focus to the button that opened it.

## Character row (Story, §3.23)

- **Layout:** three inputs, Name (max 24), Who they are (max 80) and Look (max 80), in a grid `160px 1fr 1fr` plus a 32px ghost remove button at ≥ 768px; stacked below. Rows gap 8px, up to 4.
- **States:** empty row (on screen, not saved until it has a name); invalid name (t-caption `--danger` under the name: “Add a name.” · “You already have Ana.” · “Use 24 characters or fewer.”); at 4 rows the **Add a character** button is disabled with “Up to 4 characters.”

## Claim row (Fact review)

- **Content:** the claim (15/22, 500), then the source line (icon · source label · detail or listing link with an external icon), an optional flag, and an optional note.
- **Right side:** the status badge, the Approve/Reject segmented control, and an overflow menu (Edit wording, Mark as unknown, Remove for creator-added facts).
- **States:** unreviewed (warning inset bar, warm tint), approved, rejected (strike-through), unknown (no Approve/Reject), editing (textarea, hint, Save/Cancel).

## Angle card (Strategy)

A card-sized `role="radio"`: type overline, title, one-line pitch, and “Uses” fact chips. When selected it gets a 1.5px ink border, a 1px ring and a filled check circle. The “Write my own” card is dashed until selected, and then reveals a textarea.

- **Premise card (Story, §3.23):** the same card with no type badge: title (t-h3), logline (t-sm `--ink-2`, ending on the story's open question, R29), and “Cast” (t-caption `--ink-3`) with the character names as no-dot neutral badges. The own-premise card is the dashed “Write my own” card (“Write my own premise”).
- **Story detail field (Story, §3.24, R30):** the existing textarea field pattern, full width and two rows inside the Premise card before results. Label **Story detail (optional)**; max 160; helper and inline error use the existing field-hint and field-error anatomy. It stays full width at every breakpoint and introduces no new component or token.
- **Studio card (New video dialog, §3.23):** the same anatomy as a `button` rather than a radio: 20px icon `--ink-2`, t-overline `--ink-3` area, t-h3 title, t-sm `--ink-2` description. Hover `--border-strong` + `--e1`. Pressing it creates the project; while creating it shows a 16px spinner and “Creating…”, and every card is inert.

## Hook card (Script Studio)

- **Selection:** a card with a full-height `role="radio"` area (type, quoted hook at 17/24 600, “Opening shot:”) and a footer with a Rewrite (1 credit) ghost button. The selected card gets an ink border and ring.
- **Rewriting state:** a skeleton text block and a “Rewriting this hook…” live status. The other cards stay interactive.

## Scene block (Script Studio)

- **Header** (canvas tint): scene number tile, purpose, mono time range, an editable duration (number, “s”), and a “Rewrite scene · 1 credit” button on the right.
- **Body:** Narration (textarea plus content-language tag), an optional flag, a two-up row of on-screen text and suggested visual, a **Shot direction** fieldset (In frame and Framing selects, Setting and Props inputs, two-up), an optional CTA, and “Uses” fact chips.
- **Shoot plan card** (above the scenes): Scenario textarea and On camera input, two-up at ≥ 768px; read-only as text.
- **States:** default, flagged (warning border), rewriting (skeleton plus live status; other scenes untouched).

## Job status indicator

A bordered row: icon or spinner, title, status badge (Queued, Running, Completed, Failed), a meta line, and a 4px progress bar.

- Queued shows an 8% neutral bar; running shows the ink bar.
- Failed uses a danger border and tint with a plain-language cause. It is always paired with a “Nothing you made was lost” banner and a targeted retry.
- Announced through `role="status"` (queued/running) or `role="alert"` (failed).
- An optional ordered step list below: done steps in success, the current step in ink, pending steps in `--ink-3`.

## Credit display

- **Top-bar pill:** coins icon plus mono balance. It opens a popover with the balance, a sentence about estimates, and recent usage (−n per job).
- **Estimates:** the cost segment on paid buttons. Actual usage is shown after completion (“Used 3 credits.”).
- All numbers are demo values (**PROTOTYPE ONLY**). Plans and top-ups are not designed (open decision 9).

## Asset uploader and tile (Product)

- **Rights checkbox:** it must be checked before the dropzone activates. While unchecked, the dropzone is locked (dimmed, lock icon, explanation).
- **Dropzone:** dashed border, an upload icon, “Drag photos or clips here, or browse your files”, and accepted types and limits.
- **Tile:** 4:5 media preview, optional “Imported” source badge, a clip duration pill, file name (ellipsis), meta, and a Replace/Remove menu.
- **Tile states:** uploaded; uploading (inline progress bar with a %, Cancel); failed (danger border, alert icon, specific reason: size or type, Dismiss).
- **Remove:** confirmed in a dialog. It is irreversible and says what happens to past exports.

## Menus and popovers

White, `--border`, `--e2`, 10px radius, 8px padding, anchored 8px below the trigger and right-aligned. Menu items are 36px (44px below 1024px) with a 20px icon. Destructive items use `--danger` text. Escape or an outside click closes the menu; focus returns to the trigger.

## Dialogs

- **Desktop:** 480px wide, 14px radius, `--e3`, backdrop `rgba(14,14,18,.48)`. Header (title plus close), body, and a footer on the canvas tint with right-aligned actions: secondary, then primary or danger.
- **Below 640px:** a bottom sheet with full-width, stacked actions (primary on top).
- **Focus:** trapped in the dialog. Escape equals Cancel. Focus returns to the trigger on close.

## Drawer (Version history)

Right side, 420px (full width on mobile), sliding in over `--t-slow`. It has a header with a close button and a scrollable body. The current version is outlined in ink; other versions have a “Restore as v4” action.

## Toasts

Ink background, white 14px text, a success-tinted check icon, 88px above the bottom. They auto-dismiss after about 3.6s and are announced through the page’s `role="status"` region. Toasts confirm; they never carry the only copy of an error.

## Empty states

A 56px flare-soft tile with an icon, an `h2`-sized title, one explanatory sentence (max 420px), and one primary action with an optional secondary one. The Dashboard first-run state adds a three-step explainer.

## Skeletons

Sunken-tone blocks with a 1.4s shimmer (static under reduced motion), shaped like the content they replace. The container gets `aria-busy="true"` and an `aria-label`.

## Route error states (all `/projects/:projectId/*`)

- **Not found / invalid id:** a search icon, “We can’t find that project”, and Back to projects.
- **No access:** a lock icon, “You don’t have access to this project”, the signed-in email, and Back to my projects plus Switch account.

<a id="scrollers"></a>
## Scrollers

Every horizontal scroller carries `data-scroller-id`, `data-scroller`, `data-snap`, `data-items-visible`, `data-peek`, `data-autoplay` and `data-loop`.

- **Scrollbar:** hidden on every surface. Scrolling stays fully functional with touch, trackpad, shift-wheel and keyboard focus.
- **Discoverability:** because the scrollbar is hidden, every scroller shows a peek of the next item plus a 40px edge fade that disappears at the end. The hook rail also shows an “n of m” counter and previous/next buttons below 1024px.
- **Gesture boundary:** horizontal swipes stay in the scroller (`overscroll-behavior-x: contain`); vertical page scroll always wins on vertical intent.
- **Reduced motion:** snap stays; programmatic scrolling is instant.

| Scroller | Type | Snap | Items visible | Peek | Controls | Boundary behaviour |
| --- | --- | --- | --- | --- | --- | --- |
| `dashboard.filters` | chip-row | item | 3.3 @mobile, 4 @tablet+ | 24px | none (chips are the controls) | All four fit at ≥ 640px, so no fade |
| `fact-review.filters` | chip-row | item | 3.2 @mobile, 5 @tablet+ | 24px | none | as above |
| `workflow.steps` | tab-strip | item | 2.6 @mobile, 5 @tablet (all fit) | 32px | none; the current step is scrolled into view on load | Only below 1024px; no fade when all steps fit |
| `script-studio.hooks` | rail | item | 1.15 @mobile, 2.2 @tablet, 3 @desktop | 24px | “1 of 3”, prev/next (`paginate`), hidden at desktop where all 3 fit | Prev disabled on the first card, next on the last. One hook: no controls. |

Keyboard: arrow keys move within radio-group scrollers (hooks, filters), and focus never lands on a clipped item, because the focused item is scrolled fully into view. Screen readers hear “Hook n of 3” from each card’s label.

## Batch 2 components (approved 2026-09-24)

Screen placement and copy are in the Design Reference §5B. These are the shared rules.

- **Scene media row (Media):** a 9:16 media slot button (120 × 213px; 96 × 171px below 768px) beside the scene header, narration excerpt and suggested visual. Empty slot: dashed `--border-strong`, `--canvas`, image-plus icon. Photo rows add a **Still / Slow zoom** segmented control; clip rows add a **Start at** number field with a range hint and error. Text card: `--stage` fill with the on-screen text in `--stage-ink`.
- **Media picker sheet:** right sheet 480px (full-height bottom sheet below 640px), filter segments, a radio-group tile grid of uploads with an “In scene n” caption for reused files, and a permanent **Text card** tile. Footer Cancel / Use this.
- **Scene card (Edit & preview):** 56 × 100px thumbnail, header, on-screen text input, duration line, drag handle (≥ 1024px) and a menu with **Move up / Move down** (the keyboard and mobile alternative to dragging), Change media and Adjust clip start. Playing scene: 3px `--ink` inset bar. Dragging: `--e2`, 1.02 scale, 2px `--ink` drop line. Keyboard reorder: Space lifts, arrows move, Space drops, Escape cancels, and a polite live region announces the new position.
- **Preview player:** a 9:16 frame on the dark stage (`--stage`, frame `--stage-surface`, 1px `--stage-border`, max 328px wide). Controls on the stage: 40px round play/pause, a scrubber with scene ticks, `t-mono` time, and a sound toggle. It always says it is a live preview. Under reduced motion there is no slow zoom.
- **Audio player (Voice, Music):** a 40px round secondary play/pause button, a range scrubber with `aria-valuetext` (“0:12 of 0:31”) and a `t-mono` time. Only one audio source plays at a time across the page.
- **Voice picker:** a radio group of 56px rows (name, descriptor, **Play sample** icon button). Selection uses the ink ring and check. A sample loading shows a spinner in the play button.
- **Caption style chips:** radio chips **Clean**, **Boxed** and **Word highlight**. In the frame, Clean is white 17/22 600 with a `0 1px 3px rgba(0,0,0,.6)` shadow, Boxed is white on `rgba(14,14,18,.72)` with padding 4px 8px and `--r-sm`, and Word highlight is Clean with the spoken word in `--stage-flare`. At most 2 lines of 32 characters each.
- **Music level control:** a 0–100% slider in steps of 5, with a `t-mono` value, `aria-valuetext` in percent and a hint line. Below 1024px it is replaced by a read-only value and “Edit on a larger screen.”
- **Job panel (voice, recording timing, render):** the Script job panel anatomy (status row, 4px bar, ordered steps, reassurance, failed variant with a paid retry). A panel may replace a single card (Voice) or the whole main column (Export).
- **Final check list (Export):** rows with 16px status icons (check `--success`, alert `--warning`, x-circle `--danger`). A blocking row ends with a link to the step that fixes it.
- **Export history row:** 36 × 64px poster, name, `t-mono` meta, and ghost small **Download** and **Details** buttons. Details is a disclosure (`aria-expanded`) listing the settings snapshot.
- **AI clip card (§5C):** a card with a `role="radio"` selectable area (9:16 frame on `--stage-surface` with 1px `--stage-border` and `--r-md`, poster frame, “Clip A” t-label, `t-mono` length, no-dot neutral “AI clip” badge) and a footer with a 36px round secondary play/pause. Selected: 1.5px `--ink` border, 1px ring, 20px ink check. Two per row at every width.
- **Accuracy check (§5C):** a `--canvas` card, 1px `--border`, `--r-md`, padding 16px, with two checkboxes (t-sm labels) and a t-caption `--ink-3` line. It gates its primary action, which shows the reason while unticked.
- **AI clip badge:** no-dot neutral badge “AI clip”, placed top-left on a media slot or picker tile (8px inset).
- **Keep consistent character item (§3.23):** in a story, a character row is a prop row (photo slot, name input, scene chips, remove) plus a no-dot neutral “Character” badge. Its photo is optional. Choosing its photo adds a required likeness checkbox above the item photo sheet's footer; **Use this** stays disabled until it is ticked.
- **Switch:** 36 × 20px track (`--border-strong` off, `--ink` on), 16px white thumb, the label to the left, `role="switch"`. It is used for Show captions and Show an end card.
