# User flows

Each flow names its screens and the recovery paths it must handle. Every flow below is inside Batch 1.

## F1. First sign-in

1. Visitor opens any URL → `sign-in` (with `returnTo` when they came from a guarded route).
2. **Continue with Google** → Google window → account chosen.
3. First time: the account, a personal workspace and a starter credit balance are created. Returning: the account is found.
4. Lands on `returnTo` or `dashboard`.

**Recovery:** consent cancelled or window closed → back on sign-in, unchanged · Google unavailable → warning banner · sign-in error → danger banner, retry · account inactive → danger banner · offline → button disabled with banner · session expired later → `sign-in?reason=expired&returnTo=…`, then back to the same page.

## F2. Start a project (manual entry)

1. `dashboard` → **New video** → `new-video-dialog` → **Affiliate video** → an untitled draft is created → `product-setup`. (Revised 2026-09-26, §3.23; was **New affiliate video**, which created the draft directly.)
2. Type the title, category, optional price, description, affiliate link and key features. Each change autosaves; the head shows Saving… → Saved.
3. Confirm media rights → upload photos and clips (per-file progress).
4. **Continue to facts** → the key features become facts (first time only) → `fact-review`.

**Recovery:** required field missing → field errors and the gating reason · save failed → warning banner, automatic retry, Leave dialog on navigation · upload too large or wrong type → the tile shows the reason and Dismiss · offline → banner; Continue disabled.

## F3. Import from a product link

1. On `product-setup`, paste a link → **Import**.
2. Import fills **empty** fields only and marks each one Imported. The banner names the fields that were and weren't found.
3. Editing an imported value changes its badge to Edited. **Clear imported values** removes imported values that were not edited.

**Recovery:** invalid link → field error · site not allowed → warning banner (“We can't import from this site…”) · page didn't respond or had no product data → danger banner; the manual form is untouched. Import never blocks Continue.

## F4. Review facts

1. `fact-review` lists each fact with its source and status. Flags explain risky claims.
2. Approve, reject, mark unknown, edit wording, add a fact, remove a creator fact.
3. When nothing is unreviewed and at least one fact is approved → **Continue to strategy**.

**Recovery:** a status change fails → the row reverts and a toast says so · editing an approved fact marks it unreviewed again · a script already exists → a warning banner explains that changing an approved fact it uses marks that version *needs review*.

## F5. Choose a strategy and angle

1. `strategy`: buyer (required), problem, benefit, platform, script language, length, tone, content style (defaults are preselected).
2. **Suggest angles · 1 credit** → a background job → three angle cards grounded in approved facts. Or **Write my own angle**.
3. Pick one → **Write hooks & script · 3 credits** → `script-studio` with the job panel.

**Recovery:** suggestion failed → banner, not charged, Try again · approved facts changed since suggestions → warning banner, Suggest again · not enough credits → disabled with the reason · double click → one job.

## F6. Write, edit and approve a script

1. The job panel shows Queued → Running (steps) → the editor fills. Toast: “Script v1 is ready. Used 3 credits.”
2. Pick a hook; edit hooks, narration, on-screen text, visuals, CTA, durations and caption (autosave).
3. Resolve flags: edit the line, or **Add as a fact** and approve it.
4. **Approve v1** → confirm → the version is locked; the brief is ready.

**Recovery:** job failed → the panel explains, nothing lost, not charged, **Try again · 3 credits** reuses the same job · creator leaves during the job → it keeps running; returning shows the panel or the result · rewrite of one hook or scene fails → that item keeps its text and shows an inline retry · script too long → warning banner and meter (does not block approval) · flagged line → Approve disabled with the reason · offline → edits and paid actions disabled with a banner.

## F7. Versions

1. **History** opens the drawer listing every version (number, status, date, angle, hook excerpt, origin).
2. **Restore as vN** copies an older version into a new draft; nothing is overwritten.
3. Editing an approved version: **Edit as vN** creates a new draft from it; the approved one stays the brief's source.
4. **Write a new version · 3 credits** on Strategy writes a new draft from the current strategy.

## F8. Creator brief

1. After approval → **Open creator brief** → `creator-brief` shows the plain-text brief.
2. **Copy brief** (clipboard + toast) or **Download .txt**.

**Recovery:** a newer draft adds a claim → warning banner; the brief keeps using the approved version until the draft is approved · no approved version → the step is locked and redirects to `script-studio`.

## F9. Duplicate to test another hook

1. `dashboard` card menu → **Duplicate** → a “(copy)” project with the product, facts, assets and strategy; the approved script is copied as a new draft v1 so the original stays unchanged.
2. Open the copy and pick another hook or write a new version.

(§3.23) A story duplicates the same way: the copy keeps its story (genre, premise, cast, format) and premise suggestions. A story with no genre can't be duplicated (“Pick a genre first”). (§3.25) Duplicating an episode makes a standalone story (Episode 1 of a new series); a next part is made with **Next episode** (F18).

## F10. Rename

`dashboard` card menu → **Rename…** → dialog → **Save name**. Validation: required, at most 80 characters.

## Batch 2 flows (approved 2026-09-24)

### F11. Choose media for each scene

1. Script approved → **Continue to media** → `media-mapping` lists the approved version's scenes.
2. **Fill from uploads** places uploads in empty scenes in order (free), or a slot → `media-picker-sheet` → a photo, clip or **Text card** → **Use this**.
3. Photos: Still or Slow zoom. Clips: set **Start at**.
4. **Continue to voice** once every scene has media.

**Recovery:** no uploads → upload from the picker or use text cards · clip too short → warning; it plays slower to fill the scene · start past the end → field error · a newer approved version → **Use v4** keeps matching media and marks the voiceover outdated.

### F12. Add a voiceover

1. `voice-studio` → **AI voice** → pick a voice (play samples free) → speed and pronunciations → **Generate voiceover · 2 credits** → job panel → track with scene timing.
2. Or **My recording** → confirm rights → upload → **Time captions · 1 credit** → scene timing.
3. Or **No voiceover** → scenes keep the script's timing.
4. **Continue to edit**.

**Recovery:** voice or timing job failed → cause, nothing charged, **Try again** · recording doesn't match the script → re-record or edit the script (new approved version) · not enough credits → gating reason · script changed after the voiceover → warning; generate again.

### F13. Edit and preview

1. `scene-editor` → play the live preview → reorder scenes (drag, keyboard, or Move up / Move down) → edit on-screen text and caption wording.
2. Desktop only: caption style, music level, durations with No voiceover.
3. Optional music: confirm rights → upload → level. Optional end card.
4. **Continue to export** once no line is flagged.

**Recovery:** flagged line → callout; edit it · voiceover outdated → banner → Voice · music upload failed → reason + Dismiss · save failed → banner, retry, Leave dialog.

### F14. Render and export

1. `export` → Final check → caption for posting (#ad on by default) → **Render video · 2 credits** → job panel.
2. Export ready → watch → **Download MP4** (the project becomes Exported) · **Copy caption** · **Download creator brief**.
3. Later changes → “You changed the video after Export 2.” → **Render again · 2 credits**. Every export stays in Export history with its settings.

**Recovery:** blocked check → link to the step that fixes it · render failed → cause, nothing charged, **Try again** or **Back to edit** · download link expired → retry fetches a fresh link.

## AI scene clips (§5C, approved 2026-09-25)

### F15. Generate a clip for a scene

1. `media-mapping` scene row → **Generate a clip** → `ai-clip-sheet` Request view: pick one of your photos, keep or edit the description prefilled from the scene's shot direction → **Generate 2 clips · 8 credits**.
2. Generating view (close it and keep working; the row shows “Generating 2 clips…”) → toast “2 clips for scene 2 are ready to check.” → **Review**.
3. Play both → pick one → tick both checks → **Use in scene 2** → the slot holds the AI clip; set **Start at** if needed.
4. The other clip stays in the picker (AI clips, “Not checked yet”); using it later opens the check dialog first.

**Recovery:** no photos → upload from the sheet · description flagged → warning; edit it or accept that the check dialog repeats it · not enough credits → gating reason · generation failed → cause, nothing charged, **Try again** or **Change the request** · one clip failed → the other is shown, only it is charged · clips don't match the product → **Try again** or **Discard both** · the script version switched meanwhile → the review says the scene changed.

## Entertainment Studio flows (§3.23, approved 2026-09-26)

### F16. Start a story

1. `dashboard` → **New video** → `new-video-dialog` → **Story** (“A short drama, action or comedy scene with a cast, lines and sound.”) → “Untitled story” is created → `story-setup`.
2. Pick a genre (Drama · Action · Comedy · Romance · Horror · Mystery · Fantasy · Slice of life); its hint shows. Each change autosaves.
3. Optionally add one **Story detail** (≤ 160; a person, place, object or moment) → **Suggest premises · 1 credit** → AI expands it into three complete premise cards, each with a title, a logline that ends on an open question (R29) and a cast. Pick one (it fills the cast only while the Cast card is empty), or **Write my own premise**. The detail alone never unlocks Script (R30).
4. Shape the cast: up to 4 characters, each with a name, who they are and a look. Choose **Acted** or **Narrated**, the script language and 30 · 45 · 60 s (defaults Acted, Taglish, 45 s).
5. **Write hooks & script · 3 credits** → `script-studio` with the job panel (“Reading your story” · “Writing hooks and scenes” · “Checking the script”).
6. Pick a hook, shape the scenes (Hook · Setup · Build-up · Turn · Cliffhanger; the last scene always ends on a cliffhanger, R29; lines and sound when Acted, narration when Narrated) → **Approve v1** (needs a picked hook and no running job; there is no claim check) → the story brief is ready.

**Recovery:** creating fails → the dialog's banner, nothing created, press the card again · offline → the studio cards and paid buttons are disabled · no genre → Suggest premises disabled with “Pick a genre first” · suggestions failed → banner, not charged, **Try again · 1 credit** · genre changed after suggestions → warning, **Suggest again** · Acted with no character → the gating reason “Add a character, or switch to Narrated” · a name missing, repeated or too long → the field error, the row isn't saved · script writing failed → the job panel, “Your story and earlier versions are safe. You weren't charged.” · the video service turns a request down → the Rejected sentence (the story rules are in every prompt; there is no keyword check).

### F17. Make the story video

1. Approved story → **Open creator brief**: genre, premise, format, the cast one per line, the shot list, and `BEFORE YOU FILM AND POST`. Film the cast (people who agreed to appear), faking any stunts.
2. **Continue to media** → `media-mapping`: Keep consistent lists the characters first, then props. A character's photo is optional; adding one asks for the likeness confirmation first.
3. (AI clips enabled) **Generate clip** on scene 1 → with no photos it is made from the description (Describe only); or **Customize** → Describe only (default) or a photo mode → check (“The characters and places look the way the story needs.” · “It doesn't show a real person who hasn't agreed to appear.”) → **Use in scene 1**. Later scenes follow scene 1's look.
4. `voice-studio`: an Acted story starts on Sound from your clips; a Narrated story starts on AI voice.
5. `scene-editor`: the end card is off by default; turning it on shows the story's title and an optional end line (“Part 2 tomorrow”).
6. `export`: **Render video · 2 credits** → Download MP4. The caption for posting has no #ad; the reminders cover the AI label, permission from everyone who appears and not presenting the story as real.

**Recovery:** as F11–F15. A character photo without the likeness box ticked → **Use this** stays disabled · a clip that shows a real person who hasn't agreed → don't tick the check; **Try again** or **Discard**.

## Interruptions common to every flow

- **Leave during a job:** jobs continue; the dashboard card shows the stage and any failure line.
- **Unsaved edits:** navigating in-app while a save is pending or failed opens *Leave without saving?*; closing the tab triggers the browser's own prompt.
- **Session expiry:** a background refresh; on failure → `sign-in?reason=expired&returnTo=…`.
- **Another creator's project URL:** No access state.

### F18. Continue a story as episodes (§3.25, R31, approved 2026-09-27)

1. Episode 1's script is approved → `story-setup` shows the **Episodes** card → **Next episode** (free) → “The Umbrella Standoff · Episode 2” is created with the genre, format, cast and Keep consistent items copied → its `story-setup` opens with the toast “Episode 2 is ready. It picks up where Episode 1 ended.”
2. **Previously** shows how Episode 1 ended (its Cliffhanger scene's lines or narration) and the series premise. Genre and Format are locked (“Set by Episode 1…”). Cast is editable (“Copied from Episode 1.”).
3. **What happens next (optional)** (≤ 160) → **Suggest what happens next · 1 credit** → three episode ideas that pick up the cliffhanger, using only the current cast. Pick one, or **Write my own**.
4. Optionally turn on **Final episode**: the last scene will resolve the story (Ending), and there will be no next episode.
5. **Write hooks & script · 3 credits** → `script-studio`. The first scene picks up the cliffhanger. The job also writes Episode 1's recap for later episodes. Approve → the video steps as F17. The end line is prefilled “Episode 3 next” when the end card is turned on (not for a final episode).
6. Repeat from the latest episode. An earlier episode's Episodes card offers **Open episode N** instead.

**Recovery:** Next episode fails → banner in the card, nothing created, try again · a double click opens the one episode made · script not approved → Next episode disabled with “Approve this episode's script first.” · final or 50 episodes → disabled with its reason · a newer approved version of the previous episode → the stale-continuity note; rewrite to follow it · offline → Next episode and paid buttons disabled.
