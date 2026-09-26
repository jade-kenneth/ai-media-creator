# AI Creation Platform: Design Handoff Plan

**Mode:** prompt only (no prototypes). **Scope:** Batch 1, Script MVP; Batch 2, Video beta; AI scene clips; Entertainment Studio (Product Specification §3.23, approved 2026-09-26) with the short Story detail revision (§3.24, R30) and Story episodes (§3.25, R31). **Date:** 2026-09-24; last revised 2026-09-27.
**Companion:** [AI Creation Platform Design Reference](AI%20Creation%20Platform%20Design%20Reference.md), which owns look and interaction.

This plan owns **design-derived sequencing and coverage**. It is not the engineering plan: the root [Implementation Plan](../../Implementation%20Plan.md) owns build order and approach, verified against the repository, and the root [Product Specification](../../Product%20Specification.md) owns the production mapping.

---

## 1. MVP boundary and batches

| Batch | Scope | Status | Design exit condition |
| --- | --- | --- | --- |
| **1: Script MVP** | Foundation + sign-in, dashboard, product setup, fact review, strategy, Script Studio, creator brief | **Specified** | A creator goes from sign-in to an approved creator brief without outside tools |
| 2: Video beta | Media mapping, Voice Studio, scene editor and preview, export with history | **Specified** (approved 2026-09-24) | A creator exports one 9:16 MP4 in the app |
| Later: AI video scenes | Image-to-video per scene, compare and select, review of AI product depictions | **Specified** §5C (approved 2026-09-25; R19, R20) | Generated clips improve accepted exports |
| Entertainment Studio | Studio-neutral shared surfaces and the New video dialog, the Story step, story scripts and brief, stories in the video steps, Describe only AI clips, cliffhanger endings; one optional short detail guides three complete premise suggestions; stories continue as episodes | **Specified** §5D, §5.17 and the story variants (approved 2026-09-26; R27, R28, R29; detail revision 2026-09-27, R30; episodes 2026-09-27, R31); build Phases 29–33 | A creator can seed AI with one detail, export a story video with no product in the project, and continue it as Episode 2 that picks up from the cliffhanger |

## 2. Coverage

### Screens

| Screen | Design Reference | States specified | Route declared | Controls bound | Scrollers |
| --- | --- | --- | --- | --- | --- |
| `app-shell` | §3 (revised 2026-09-26: “Suggest premises” label §3.23) | 6 (credits loading, error, empty; offline; menu; toasts) | — | ✓ | — |
| `project-workflow` | §4 (revised 2026-09-26: studio caption and subject line, story groups, “Step n of 7”, “Finish the story first.” §3.23; “Episode 2 of 3” §3.25) | 8 (loading, not found, no access, locked redirect, unsaved, offline; story rail and strip, story Script locked) | ✓ | ✓ | `workflow.steps` |
| `root` | §5.1 | 1 | ✓ | — | — |
| `sign-in` | §5.2 (revised 2026-09-26: studio-neutral stage copy §3.23) | 8 | ✓ | ✓ | — |
| `dashboard` | §5.3 (revised 2026-09-26: New video, `new-video-dialog`, head, empty state, subject line, story Duplicate rule §3.23; episode badge and duplicate §3.25) | 17 (10 + both studios, story with no genre, the dialog's default, creating, failed and offline, and the episode badge) | ✓ (+ `new-video-dialog` overlay) | ✓ | `dashboard.filters` |
| `project-resume` | §5.4 (revised 2026-09-26: stories §3.23) | 4 | ✓ | — | — |
| `product-setup` | §5.5 | 15 | ✓ | ✓ | `workflow.steps` |
| `fact-review` | §5.6 | 13 | ✓ | ✓ | `fact-review.filters`, `workflow.steps` |
| `strategy` | §5.7 (revised 2026-09-25: audience suggestions, R24; Skit style §3.22) | 22 | ✓ | ✓ | `workflow.steps` |
| `story-setup` (Entertainment Studio) | §5.17 (§5D; new 2026-09-26, §3.23, R28, R29; short-detail revision 2026-09-27, §3.24, R30; episodes 2026-09-27, §3.25, R31) | 38 (26 + the 12 episode states) | ✓ | ✓ | `workflow.steps` |
| `script-studio` | §5.8 (revised 2026-09-25: Shoot plan, Shot direction, Transition in; duration follows narration §3.20; skit Lines, Sound and Cast §3.22; story versions and the cliffhanger caption §3.23, R29; Ending and stale-continuity note §3.25) | 39 | ✓ | ✓ | `script-studio.hooks`, `workflow.steps` |
| `creator-brief` | §5.9 (revised 2026-09-25: SHOOT PLAN block, Transition line; skit rules §3.22; story brief §3.23) | 10 | ✓ | ✓ | `workflow.steps` |
| `privacy-policy` | §5.10 (revised 2026-09-26: story wording §3.23, ⚠ legal) | 1 | ✓ | ✓ | — |
| `not-found` | §5.11 | 1 | ✓ | ✓ | — |
| `media-mapping` (Batch 2) | §5.12 (revised 2026-09-25: shot direction line, Punch-in hint, overlap warning; Shoot plan card §3.20; Keep consistent card, item photo picker and one-click Generate clip §3.21; skit lines and clip-sound warnings §3.22; story characters and the likeness confirmation §3.23) | 36 | ✓ (+ `item-photo-sheet` overlay) | ✓ | `workflow.steps` |
| `voice-studio` (Batch 2) | §5.13 (revised 2026-09-25: Sound from your clips §3.22; story defaults §3.23) | 26 | ✓ | ✓ | `workflow.steps` |
| `scene-editor` (Batch 2) | §5.14 (revised 2026-09-25: Transition in, preview transitions; Clip sound, captions from the lines §3.22; story end card and end line §3.23; end line prefill §3.25) | 28 | ✓ | ✓ | `workflow.steps` |
| `export` (Batch 2) | §5.15 (revised 2026-09-25: transition in history details; clip sound §3.22; story reminders, no #ad §3.23) | 19 | ✓ | ✓ | `workflow.steps` |
| `ai-scene-clips` (Later, sheet on Media) | §5.16 (§5C; R23 revision approved 2026-09-25: photo modes, clip count; §3.20 presenter prefill; §3.21 one-click clips; §3.22 skit prefill, clips with sound; §3.23 Describe only, story prefill and checks) | 33 | ✓ (sheet, `navigation-map.md` overlays) | ✓ | — |

### Flows

Flows F1–F10 in [user-flows.md](../planning/user-flows.md) are fully specified in Batch 1. Batch 2 flows F11–F14 are approved (2026-09-24); until they are built, exits into Media, Voice, Edit and Export are not rendered. F15 covers AI scene clips (§5C). Entertainment Studio flows F16 (start a story) and F17 (make the story video) are approved (2026-09-26, §3.23); F2 now starts from the New video dialog.

### Routes

11 Batch 1 routes, 4 approved Batch 2 routes and 1 Entertainment Studio route (`story-setup`, §3.23) are declared with container, presentation and guard in [navigation-map.md](../planning/navigation-map.md). Every parameterised route specifies loading, not found / invalid id, and no access. No screen lacks an inbound edge.

### Controls

| Measure | Count |
| --- | --- |
| Controls in the interaction inventory | 129 |
| Unbound controls | 0 |
| Placeholder handlers | 0 |
| Batch 2 controls (approved, not rendered until built) | 79 (78 on Batch 2 screens + Script “Continue to media”) |
| Entertainment Studio controls (§3.23–§3.25, approved) | 28 (23 on `story-setup`, including `story.edit-detail` and, §3.25, `story.next-episode`, `story.open-episode`, `story.show-all-episodes`, `story.open-previous`, `story.toggle-final`; 2 in `new-video-dialog`; plus `script-studio.go-story`, `item-photo.confirm-likeness`, `scene-editor.edit-end-line`); `dashboard.create-project` and `dashboard.empty-create-project` open the dialog |
| Unresolved targets (not rendered) | 1 (`terms`) |

## 3. Data-backed interactions: observable contract

The production owner, transport, cache and validation for each row are in the Product Specification's production mapping.

| Interaction | Observable result | Required UI states | Business rule |
| --- | --- | --- | --- |
| Google sign-in | Lands on Projects or `returnTo`; the first sign-in creates the account, workspace and starter credits | default, signing in, error, Google unavailable, inactive, expired, signed out, offline | Google is the only method |
| Create project (revised 2026-09-26, §3.23) | **New video** opens the dialog; a studio card creates an untitled project in that studio and opens its first step (Product or Story) | dialog, creating (card loading, cards inert), failed banner, offline | A project exists without a product; every project records its studio; only built studios are listed |
| Rename / duplicate | The card updates, or a “(copy)” card appears first | dialog, validation, copying skeleton, failure banner | Duplicate keeps the original; its approved script arrives as a new draft |
| URL import | Empty fields fill and are marked Imported; missing fields are named | importing, partial, complete, failed, not allowed, invalid | Never blocks; never overwrites creator input; allowlisted hosts; public metadata only |
| Product autosave | The head shows Saving… / Saved / Not saved / Offline | save failed, offline | Title and affiliate link required to continue |
| Asset upload | Per-file progress, validation, replace, remove | rights needed, uploading, failed (size, type, duration), remove confirm, limit reached | Rights confirmed first; stored once per project; private |
| Fact review | Status per row; counter; gate | unreviewed, approved, rejected, unknown, editing, flagged, revert on failure | Only approved facts feed writing; a listing isn't proof |
| Angle suggestions (paid job) | Three grounded angles | none yet, suggesting, failed, stale | Estimate first; no duplicate jobs; not charged on failure |
| Story autosave (§3.23) | Genre, premise, cast and format save as they change; the head shows the save state | save failed, offline, invalid name | A story needs a genre, a premise and, for Acted, a character before writing |
| Premise suggestions (paid job, §3.23–§3.24) | The optional Story detail autosaves; AI expands it into three complete premises (title, logline ending on an open question, cast); choosing one fills an empty cast | detail empty/entered/error, before, suggesting, suggested, failed, stale (genre or detail changed) | 1 credit; needs a genre; the detail is not itself a premise; typed characters are never replaced |
| Next episode (§3.25, R31) | The latest episode, once its script is approved, makes the next one: a new story project copying genre, format, cast and Keep consistent items, which opens on its Story step | creating, failed, disabled (not approved, final, 50 episodes, offline), on an earlier episode (Open episode N) | Free; idempotent; linear, with no branches; copies never change earlier episodes |
| Episode continuity (§3.25, R31) | Episode 2+ shows how the previous episode ended, suggests what happens next (1 credit) and writes a script that picks up from the cliffhanger; Final episode ends the story | stale continuity note, Final on or disabled | Recaps are written by the next episode's script job at no extra credit |
| Character likeness (§3.23) | A character's photo is set only after its confirmation | unticked (Use this disabled), ticked | Every character photo needs its own confirmation; never a public figure or anyone under 18 |
| Describe only clip (§3.23) | A story clip made from the description alone | as any clip job | Entertainment Studio only; checked before use like every clip |
| Write hooks & script (paid job) | The job runs in the background, then the editor fills; “Used 3 credits” | queued, running, completed, failed | Leave-able; retry reuses the job; nothing lost on failure |
| Rewrite hook / scene (paid job) | Only that item changes | per-item busy, per-item failure | Other items and edits untouched |
| Claim check | Inline flag; Approve blocked | flagged, resolved | No unsupported claim enters an approved version |
| Approve / restore / edit as new | Approval locks; restore and edit create new drafts | draft, approved, needs review, read-only older | Nothing is overwritten |
| Creator brief | Text from the latest approved version | ready, newer draft, locked | No AI call, no credits |
| Credits | Estimate before, actual after, balance and usage | loading, error, empty | Held on start, charged on completion, released on failure |
| Ownership | Other creators' projects show No access | no access, not found | Checked on every project and asset operation |
| Scene media (Batch 2) | Each scene shows its photo, clip or text card | empty, filled, clip short, start invalid, newer version | Free; one approved version per video |
| Voiceover (Batch 2, paid job) | A track with scene timing | none yet, queued, running, failed, ready, outdated, settings changed | Allowlisted voices; per-scene segments; not charged on failure |
| Recording timing (Batch 2, paid job) | Scene timing for an uploaded recording | rights, uploading, untimed, timing, no match, timed | Rights confirmed per recording |
| Edit & preview (Batch 2) | Live 9:16 preview reflects order, text, captions, music and end card | playing, reordering, flagged, captions off, music states, mobile read-only | Claim check on every line a viewer reads |
| Render (Batch 2, paid job) | An MP4 with poster, size and settings snapshot | queued, running, failed, ready, downloaded, changed since | Blocked by flags, outdated voiceover or missing media; not charged on failure |

## 4. Design dependencies

- **Brand lock (decision 1):** changes only the mark, the wordmark face and the flare tokens. It does not block Batch 1.
- **Batch 2:** product decisions resolved (R13 light mobile edits, R14 TikTok-first preset, R15 uploaded music with rights confirmation) and technical decisions recorded (R16 ElevenLabs voice, R17 FFmpeg render, R18 separate worker process). §5B was approved by the product owner 2026-09-24; build follows Implementation Plan Phases 15–20.
- **Entertainment Studio:** R27 (the platform isn't affiliate-only; studios on one registry), R28 (D1–D10, approved as recommended) and R29 (every story ends on a cliffhanger), all 2026-09-26; R30 (one optional short detail guides three full premise suggestions) and R31 (stories continue as episodes, E1–E10 as recommended), 2026-09-27. §5D was approved 2026-09-26 and its detail and episode revisions 2026-09-27; build follows Implementation Plan Phases 29–33. The AI clip parts stay behind `AI_CLIPS_ENABLED` and open 19.
- **Engineering inputs the design relies on:** Google sign-in that provisions a first-time account; background jobs with status; idempotent paid requests; private object storage with signed URLs; server-side ownership and workflow gates; a text-writing provider. Their mapping is in the Product Specification.

## 5. Design-derived build order

1. Tokens and base components (buttons, fields, chips, segments, badges, banners, dialogs, drawer, toasts, skeletons), then the app shell.
2. Sign in → Dashboard (empty, loading, error) with create, rename and duplicate.
3. Project workflow shell: rail and strip, head with save state, footer, route states, locked-step redirect, unsaved-changes guard.
4. Product (manual form, then import, then uploads).
5. Facts (rows, gate, flags, add/edit/remove).
6. Credits and background jobs, then Strategy (form, then angle suggestions).
7. Script Studio (job panel, editor, partial rewrites, versions, claim gate, approval).
8. Creator brief.
9. (Batch 2) Worker process and audio uploads → Media → Voice → Edit & preview (preview player first, then reorder, captions, music) → Export (render, then history).
10. (Entertainment Studio) Studio registry → shared surfaces (sign-in copy, dashboard head, empty state and card, rail and strip) and `new-video-dialog` → Story step → story scripts and brief → the story variants of Media, the clip sheet, Voice, Edit & preview and Export. → (§3.25) series data and Next episode → episode Story step → continuity prompts and Ending → rail, card badge, brief header and end line.

## 6. Per-screen Fidelity QA

Mode: prompt only. Compare each built screen with its Design Reference section and `design/system/` values at 1440 × 900 and 390 × 844 (plus 820 × 1100 for the step strip and hook rail). Every state in the section must be reproducible with seeded data or a real failure.

### Sign in (§5.2)

- [ ] Split layout at ≥ 1024px; panel only below with the brand above the title. The stage panel is `aria-hidden`.
- [ ] Google's own button (outline, large, “Continue with Google”) at the panel width; the signing-in overlay with “Signing you in…” makes it inert.
- [ ] All 8 states render their exact banner copy; the Turnstile widget appears only when the bot check is enabled.
- [ ] `returnTo` round-trip works; unsafe values are ignored; a signed-in visitor is redirected away.
- [ ] (§3.23) The stage panel reads “Make short videos you can stand behind.”, the studio-neutral body and the list “Choose what you're making” · “Shape the script” · “Edit, preview and export”; no studio is named.

### Dashboard (§5.3)

- [ ] Grid 3 / 2 / 1 columns at ≥ 1200 / 768–1199 / < 768. Thumbnail 88 × 156 (64 × 114 below 640), 9:16.
- [ ] Whole card clickable; the menu sits above the stretched link; the focus ring wraps the card.
- [ ] Stage badges follow the stage table; failure line in `--danger`.
- [ ] Empty, loading, filter-empty, load error, offline, creating, duplicating, duplicate-failed and rename validation states.
- [ ] Filter and sort persist in the URL; the chip row scrolls without a visible scrollbar below 640px.
- [ ] (§3.23) Head subtitle and **New video**; the empty state (“Make your first video”, its three steps, **New video**); both open `new-video-dialog`.
- [ ] (§3.23) `new-video-dialog`: 560px (bottom sheet below 640px), “What are you making?”, one card per built studio in registry order (Affiliate video, then Story) 2-up at ≥ 640px; hover `--border-strong` + `--e1`; creating (spinner, “Creating…”, cards inert) lands on Product or Story; the failure banner; offline disables the cards with “Projects can be created when you reconnect.”; Escape and Cancel return focus to the opener; past 4 studios the body scrolls and the footer stays.
- [ ] (§3.23) A story card reads “Story · Comedy”; a story with no genre shows the dashed thumbnail, “Story · No genre yet” and Duplicate disabled with “Pick a genre first”; affiliate cards are unchanged.
- [ ] (§3.25) An episode of a series of 2+ shows the “Ep 2” no-dot neutral badge after the subject line (a lone story has none); the rail line 2 reads “Comedy · Episode 2 of 3” (“…, final”); duplicating an episode makes a standalone Episode 1.

### Product (§5.5)

- [ ] Import card above the form with partial, complete, failed, not allowed, invalid and importing states. Clear imported values keeps creator entries.
- [ ] Source badges on every filled field.
- [ ] Rights checkbox gates the dropzone (locked visual); tile grid 4 / 3 / 2; uploading progress with Cancel; size, type and duration errors with exact copy; 20-file limit banner.
- [ ] Remove confirmation copy and danger button.
- [ ] Field validation for title, link and price; offline disables Continue and Import; save-failed banner.

### Facts (§5.6)

- [ ] Meter shows one segment per fact coloured by status (unreviewed striped).
- [ ] Row layout: claim / source / flag / note left; badge + Approve/Reject + menu right; stacks below 768px.
- [ ] Unreviewed tint and inset bar; rejected strike-through; unknown hides Approve/Reject.
- [ ] Continue disabled with a live reason until nothing is unreviewed and ≥ 1 approved.
- [ ] Add a fact dialog, inline editing, remove confirmation (creator facts only), revert on failed change.
- [ ] Script-exists warning and locked-redirect banner.

### Strategy (§5.7)

- [ ] Audience and format fields exactly as specified; the Length segment doesn't stretch; defaults preselected.
- [ ] Angle cards 2-up (1-up below 768px) with the selected ring and check; the own-angle card reveals the textarea.
- [ ] Suggest (1 credit) and Write (3 credits) show cost segments; loading prevents a second click.
- [ ] Suggesting skeleton, failed banner (not charged), facts-changed banner, missing-buyer and not-enough-credits reasons.

### Story (§5.17, Entertainment Studio)

- [ ] Genre chips (8) in a radio group, nothing chosen on a new story; the chosen genre's hint linked with `aria-describedby`.
- [ ] Premise card: full-width **Story detail (optional)** two-row textarea (≤ 160), helper, inline server error and autosave; Suggest premises (1 credit) disabled with “Pick a genre first” until a genre is chosen; AI turns the detail into three complete story ideas with casts; suggesting skeletons and live status; 2-up premise cards (title, logline ending on an open question, Cast badges) with the angle card's selected ring; Write my own premise with its textarea and error; the failed banner (not charged) with Try again; genre- and detail-changed warnings keep the chosen premise.
- [ ] Choosing a premise fills the cast only while it is empty; typed characters are never replaced.
- [ ] Cast rows (3-column grid at ≥ 768px, stacked below), the “n of 4” counter, remove, Add a character disabled at 4 with its hint; the three name errors; a row with no name stays on screen and isn't saved.
- [ ] Format: Acted · Narrated with hints, script language, 30 · 45 · 60 s; defaults Acted, Taglish, 45 s; no Tone.
- [ ] Story rules aside at ≥ 1200px, after the Format card below.
- [ ] Footer gating reasons (“Pick a genre” · “Choose or write a premise” · “Add a character, or switch to Narrated” · credits); a Narrated story with no characters can write; writing opens Script's job panel; Open script and Write a new version once a version exists.
- [ ] Save failed, offline (paid buttons disabled), leave dialog, loading, not found and no access.
- [ ] (§3.25) Episodes card: hidden on a new story; shown with an approved version or a series of 2+; rows with number tile, title link, stage badge, “This episode” on the current (`aria-current`); up to 6 rows, then Show all; Next episode (free, “Creating…”, toast, idempotent), Open episode N on an earlier episode, the four disabled reasons, and the failed banner.
- [ ] (§3.25) Episode 2+: Previously card (series premise, the previous last scene's lines or narration, link); Genre and Format disabled with “Set by Episode 1…”; “What happens next” card copy, ideas and Write my own; Cast “Copied from Episode 2.”; Ending card with the Final episode switch, disabled when a later episode exists; footer reason “Choose or write what happens next”; stale-continuity note.
- [ ] (§3.25) 390px: every card is full width; Episodes rows keep one line (badge wraps below 360px); keyboard order Episodes → Next → Previously → Genre → What happens next → Cast → Format → Ending → footer.

### Script (§5.8)

- [ ] Hook rail: 3 cards at ≥ 1024 with no pager; below, a snap rail with peek, “1 of 3” and Previous/Next. Selected ring.
- [ ] Scene block anatomy, editable duration updating time ranges and the total.
- [ ] Flagged scene border and inline flag with Add as a fact; claim-check card with Go to scene moving focus.
- [ ] Length banner and aside meter with the target marker.
- [ ] Approve disabled with its reason while flagged, without a hook, while writing, or offline; the approve dialog checklist; the approved banner; footer switches to Open creator brief.
- [ ] Job panel: queued, running (steps), failed (not charged, Try again reuses the job), completed toast; status announced.
- [ ] Rewriting a hook or scene affects only that item; per-item failure.
- [ ] History drawer with View and Restore; restore toast; older versions read-only; Edit as vN.
- [ ] Leave dialog when a save is pending or failed.
- [ ] Transition in (§3.19): the select and its hint on scene 2 onward, “Opens the video.” on scene 1, the read-only “· Whip in” suffix; a version from before transitions reads as before.
- [ ] (§3.22) A skit version shows Lines (up to 3, blank row kept but not saved) and Sound in place of Narration, Cast on the Shoot plan card, “Cast on camera”, the lines' duration error and “· Skit”; a flagged line attaches its callout; a narrated version is unchanged.
- [ ] (§3.23) A story's version: story hook types and purposes (Hook · Setup · Build-up · Turn · Cliffhanger, the last scene always Cliffhanger, R29) with “Stories end on a cliffhanger, so viewers want the next part.” under a draft's last scene; Acted uses the skit UI, Narrated uses Narration; Cast label; In frame “Cast on camera · Hands only · No one in frame”; no flags, fact chips, Claim check card or CTA; the Story card with **Change story**; the story job steps and failure copy; the two-row approve dialog; footer back **Story**. An affiliate version is unchanged.
- [ ] (§3.25) A final episode's last scene reads Ending, with “This is the final episode, so the last scene ends the story.”; an episode draft whose previous episode has a newer approved version shows the stale-continuity note (not on read-only versions).

### Creator brief (§5.9)

- [ ] The brief text matches the approved version exactly, in the specified structure; Copy and Download .txt with the specified filename.
- [ ] `Transition:` lines appear only from scene 2 onward and only for values other than Cut.
- [ ] (§3.22) A skit brief: “· Skit”, `Cast:`, the live-sound note, `Ben: "…"` lines in place of `Say:`, `Sound:` before `Text:`, “Cast on camera”.
- [ ] (§3.23) A story brief: `Genre:`, `Premise:`, `Format:` and no `Product:`, `Link:`, `Angle:` or `APPROVED FACTS USED`; the cast one per line; the live-sound note for Acted only; the last scene `Cliffhanger` ending on its open question; `BEFORE YOU FILM AND POST`; the aside titled “Before you film and post”.
- [ ] (§3.25) An episode brief: `Episode: 2 of 3` after the title (`…, final`), the episode's premise, and `Ending` as a final episode's last scene.
- [ ] Before-you-post aside; newer-draft banners; locked redirect when nothing is approved.

### Every project step (§4)

- [ ] Stepper statuses (done, current, open, locked with reason) and the mobile step strip with “Step n of 5”.
- [ ] (§3.23) The rail caption names the project's studio; a story's rail shows its genre (“No genre yet” muted), Plan (1 Story, 2 Script), Produce (3–5) and Deliver (Creator brief, 6 Export video); its strip reads “Step n of 7” (“Step n of 3” with the video beta off); Script locked with “Finish the story first.” until the story is done or a version exists; resume opens Story for a story with no script.
- [ ] Save state in the head; save-failed and offline banners.
- [ ] Not found / invalid id and No access states.
- [ ] Keyboard: radio groups with arrow keys, menus, dialogs and drawer (trap and return focus), in-page jumps that move focus.
- [ ] 390px: no horizontal page scroll; footer primary fills the bar; safe-area padding.

### Media (§5.12, Batch 2)

- [ ] Scene rows show the 9:16 slot, header, narration excerpt and suggested visual; the empty slot opens the picker.
- [ ] Fill from uploads fills empty scenes only, in upload order, and costs nothing.
- [ ] Clip Start at enforces the range; a short clip shows the hold warning instead of an error.
- [ ] The picker's Text card is always present; reused uploads show “In scene n”.
- [ ] Use v4 keeps matching media and marks the voiceover outdated.
- [ ] Each row shows its shot direction line (none for a scene without direction); a Punch-in scene past position 1 shows the hint.
- [ ] A clip that covers its scene but not the next scene's Whip or Dissolve shows the runs-out warning; the hold time counts the overlap; nothing blocks.
- [ ] (§3.20) The Shoot plan card shows the version's scenario and who is on camera (hidden without a shoot plan); with a settled voiceover, the voiced-timing line shows.
- [ ] (§3.21) Keep consistent lists the product first and the script's props, deduplicated, each tagged with its scenes; rename, add (up to 8), remove and scene chips autosave; the product row can't be renamed or removed.
- [ ] (§3.21) Every item needs a photo before **Generate clip** enables; past the first scene it also waits for the first scene's AI clip; each disabled state shows its reason.
- [ ] (§3.22) A skit row shows its lines and Sound line; a clip with its sound on gives the hold warning and the “Sound on” line; the Shoot plan card reads Cast.
- [ ] (§3.21) **Generate clip** starts one 4-credit clip without the sheet; the row shows Generating, then “1 clip ready to check”; Review names the photos and the scene the still came from; the clip is still checked before use.
- [ ] (§3.23) A story's Keep consistent: the story subtitle, characters first (“Character” badge, renamable and removable), then props, no product row, at most 8; photos optional and the counter gates nothing; the story hint and aside sentence. A character photo needs the likeness box before **Use this**. **Generate clip** has no photo reason; scene 1 with no photos is made from the description.
- [ ] (§3.23) The clip sheet in a story opens on **Describe only** (first; tops the radio list below 640px) with its hint and no Photos group; the story prefill names each character with their look and has no product close; no claim check; the story checks and caption; “Made from your description”.

### Voice (§5.13, Batch 2)

- [ ] Source cards switch controls without deleting an existing track.
- [ ] Samples play one at a time and cost nothing; generate shows “2 credits” before the click.
- [ ] The job panel runs queued → running → ready, and a failure releases credits.
- [ ] A recording needs its rights box; timing shows per-scene ranges; a mismatch shows the recording failure copy.
- [ ] An outdated voiceover blocks Continue; a settings change does not.
- [ ] (§3.22) Sound from your clips settles at once for free and turns every clip's sound on; a skit starts on it, with AI voice and My recording disabled (“This skit has no narration.”) and skipped by arrow keys; the aside reads “What people say”.
- [ ] (§3.23) An Acted story starts on Sound from your clips; a Narrated story starts on AI voice.

### Edit & preview (§5.14, Batch 2)

- [ ] The live preview plays media, on-screen text, captions, voice, music at its level and the end card, in edit order.
- [ ] Reorder works by pointer, keyboard (with announcements) and Move up / Move down; each scene's voice moves with it.
- [ ] Below 1024px, caption style, music level and durations are read-only with “Edit on a larger screen.”
- [ ] Caption line rules (2 lines, 32 characters) and claim flags hold; a flag blocks Continue.
- [ ] Music needs its rights box; Remove and Reset use their dialogs.
- [ ] Each transition plays in the preview as specified (Punch-in 300ms, Whip 250ms, Dissolve 400ms); scene starts, voice and captions don't move; reduced motion plays Punch-in and Whip as cuts.
- [ ] Position 1 shows “Opens the video.”, including after a reorder, and the reorder announcement says so.
- [ ] (§3.22) Clip sound on a clip scene plays the clip unmuted at its level and at normal speed in the preview (holding its last frame), mutes with the preview's toggle, and is read-only below 1024px; with Sound from your clips, durations are editable and captions come from the lines, edit by place and reset to the script.
- [ ] (§3.23) A story's end card is off by default; on, it shows the End line field (optional, 60) and “The Umbrella Standoff · Part 2 tomorrow”; the music rights label reads “… in this video”; no flag callouts.
- [ ] (§3.25) Turning the end card on with an empty End line prefills “Episode N next” (not for a final episode); clearing it doesn't refill.

### Export video (§5.15, Batch 2)

- [ ] Final check rows match the video edit; blocking rows link to the step that fixes them and block Render.
- [ ] Render shows “2 credits”, runs the job panel and ends on the export card with a playable MP4 and poster.
- [ ] Download saves the named file and moves the project to Exported; history rows show the settings snapshot.
- [ ] Changing the video after an export shows the changed banner and Render again.
- [ ] The rendered MP4 is 1080 × 1920, 30 fps, H.264 + AAC, with burned-in captions matching the chosen style.
- [ ] An export with transitions plays them like the preview did, runs the same length as an all-cut export, and lists them in the history Details.
- [ ] (§3.22) An export with clip sound plays each sound-on clip's audio in its scene (never slowed), silent for a clip without audio, under the voice and music without clipping; Details show “· sound 80%” and “Sound from your clips”.
- [ ] (§3.23) A story's export: “Captions: 14 lines”, no **Start with #ad** and a caption copied without #ad, the three story reminders; the rendered end card shows the title and end line; the AI label is unchanged.

## 7. Unresolved design work

Entertainment Studio gaps that §3.23 leaves open are marked ⚠ in the Design Reference (§4 locked banner, §5.3 dialog list loading and error, §5.8 Change length and the job panel's back action, Story card and brief premise line, §5.9 cast block details, §5.12 ready line, Punch-in hint and Manage on Product, §5.16 photo-mode copy and the Describe only job step, §5.17 character input names and wrong-studio routes) and listed in [CLAUDE_DESIGN_REQUEST.md](../CLAUDE_DESIGN_REQUEST.md).

See [open-decisions.md](../planning/open-decisions.md): brand (1), operator view (3), AI scenes (6), project deletion (7), failed-job charging (8, default not charged), billing (9), legal pages (10), credit prices (11), starter credits (12), import hosts (13), upload limits (14), account deletion on web (15).

## 8. Change routing

This mode has no design release to validate. When scope changes: update `design/planning/`, `design/system/` and this pair first; then the root Product Specification, Implementation Plan and task file together; then the code. `pnpm design:validate`, `/sync-build-docs` and `/finalize-build-docs` do not apply.
