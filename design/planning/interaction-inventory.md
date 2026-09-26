# Interaction inventory

Normative control table. Each row is one control; the action id is its identity in code review and Fidelity QA.

**States legend:** d default · h hover · f focus-visible · p pressed · x disabled · l loading · e error · s selected · o open. Every focusable control has `f`.

**Paid** marks a control that shows its credit estimate before the click, holds credits when the job starts and ignores repeat activations while in flight.

## app-shell

| Label | Action id | Type | Target | Observable result | States | Confirm | Rule |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Brand (mark + wordmark) | `app-shell.go-home` | navigate | `dashboard` | Opens Projects | d h f p | — | — |
| Projects | `app-shell.go-projects` | navigate | `dashboard` | Opens Projects; `aria-current` on the dashboard | d h f p s | — | — |
| Credits pill (“128”) | `app-shell.open-credits` | open | `credits-popover` | Shows balance and recent usage | d h f p o | — | Credits are abstract demo units |
| Close credits | `app-shell.close-credits` | close | trigger | Popover closes (Escape or outside click) | d f | — | — |
| Avatar (“MR”) | `app-shell.open-account` | open | `account-menu` | Shows name, email, Sign out | d h f p o | — | — |
| Sign out | `app-shell.sign-out` | submit | `sign-in` | Ends the session; lands on sign-in with “You're signed out.” | d h f l | — | Revokes the server session |

## sign-in

| Label | Action id | Type | Target | Observable result | States | Confirm | Rule |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Continue with Google (Google's button) | `sign-in.continue-with-google` | submit | `dashboard` or `returnTo` | Opens Google; on success lands on the destination; on error shows the error banner | d h f x l e | — | Google is the only method; the first sign-in creates the account, workspace and starter credits |
| Privacy Policy | `sign-in.open-privacy` | navigate | `privacy-policy` | Opens the privacy policy | d h f | — | — |

## dashboard

| Label | Action id | Type | Target | Observable result | States | Confirm | Rule |
| --- | --- | --- | --- | --- | --- | --- | --- |
| New video | `dashboard.create-project` | open | `new-video-dialog` | Opens the New video dialog (revised 2026-09-26, §3.23; was **New affiliate video**, which created the project directly) | d h f p x | — | Disabled offline; a project exists without a product |
| Filter chips (All · In progress · Ready to export · Exported) | `dashboard.filter-projects` | filter | self | Shows matching projects; count on each chip; URL keeps the filter | d h f p s | — | Radio group; arrow keys move |
| Sort select | `dashboard.sort-projects` | sort | self | Reorders by Last edited or Name A–Z; URL keeps the sort | d h f o | — | — |
| Project card (title link, whole card) | `dashboard.open-project` | navigate | `project-resume` | Opens the project at its current step | d h f p | — | — |
| More actions (card menu) | `dashboard.open-card-menu` | open | card menu | Shows Open, Rename…, Duplicate | d h f p o | — | — |
| Open | `dashboard.menu-open-project` | navigate | `project-resume` | Same as the card | d h f | — | — |
| Rename… | `dashboard.rename-project` | open | `rename-project-dialog` | Opens the rename dialog with the current name selected | d h f | — | — |
| Duplicate | `dashboard.duplicate-project` | mutate | self | A “(copy)” card appears first; toast “Duplicated. The original is unchanged.” | d h f x l | — | Disabled for a draft with no product (“Add a product first”) and (§3.23) a story with no genre (“Pick a genre first”); the approved script arrives as a new draft; a story's copy keeps its story and premise suggestions |
| Show more projects | `dashboard.load-more` | paginate | self | Appends the next 24 projects | d h f x l | — | Cursor pagination |
| Show all projects (filter empty) | `dashboard.clear-filter` | filter | self | Resets the filter to All | d h f | — | — |
| Try again (load error) | `dashboard.retry-load` | mutate | self | Refetches projects | d h f l | — | — |
| New video (empty state) | `dashboard.empty-create-project` | open | `new-video-dialog` | Same as the header button (revised 2026-09-26, §3.23) | d h f p x | — | — |

### rename-project-dialog

| Label | Action id | Type | Target | Observable result | States | Confirm | Rule |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Project name field | `rename-project.edit-name` | none | field | Edits the name (validated on save) | d f e | — | Required, ≤ 80 characters. `none`: a text field; the save button carries the action |
| Cancel / Close / Escape | `rename-project.cancel` | close | trigger | Closes without changes | d h f | — | — |
| Save name | `rename-project.save` | submit | self | Card title updates; toast “Renamed.” | d h f p x l e | — | Server validates length |

### new-video-dialog (§3.23 — approved 2026-09-26)

| Label | Action id | Type | Target | Observable result | States | Confirm | Rule |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Studio card (Affiliate video · Story) | `new-video.create-project` | submit | `product-setup` (Affiliate video) or `story-setup` (Story) | Creates the project in that studio (“Untitled project” or “Untitled story”) and opens its first step; the pressed card shows a spinner and “Creating…”; failure shows the danger banner in the dialog | d h f p x l e | — | One card per built studio, in registry order; every card is inert while creating and disabled offline; accessible name “Create a story, Entertainment Studio” |
| Cancel / Close / Escape | `new-video.cancel` | close | trigger | Closes; focus returns to the New video button that opened it | d h f | — | — |

## project-workflow (every project step)

| Label | Action id | Type | Target | Observable result | States | Confirm | Rule |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Breadcrumb “Projects” | `workflow.breadcrumb-projects` | navigate | `dashboard` | Opens Projects (Leave dialog if an edit is unsaved) | d h f | leave dialog when unsaved | — |
| Step rows / strip chips (Product, Facts, Strategy, Script, Creator brief; (§3.23) a story: Story, Script, Creator brief) | `workflow.go-step` | navigate | that step | Opens the step; locked steps announce their reason and do nothing | d h f p s x | leave dialog when unsaved | Server also redirects locked steps |
| Back to projects (not found) | `route-not-found.back` | navigate | `dashboard` | Opens Projects | d h f | — | — |
| Back to my projects (no access) | `route-no-access.back` | navigate | `dashboard` | Opens Projects | d h f | — | — |
| Switch account (no access) | `route-no-access.switch-account` | submit | `sign-in` | Signs out and returns to sign-in with `returnTo` set to this page | d h f l | — | — |

### leave-unsaved-dialog

| Label | Action id | Type | Target | Observable result | States | Confirm | Rule |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Stay on page | `leave-unsaved.stay` | close | trigger | Closes the dialog; nothing is lost | d h f | — | — |
| Leave anyway | `leave-unsaved.leave` | destructive | pending destination | Discards the unsaved change and continues the navigation | d h f | this dialog; irreversible | — |

## product-setup

| Label | Action id | Type | Target | Observable result | States | Confirm | Rule |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Product page link field | `product-setup.edit-import-url` | none | field | Holds the link to import | d f e | — | `none`: text field; Import carries the action |
| Import | `product-setup.import-product` | mutate | self | Fills empty fields, marks them Imported, shows the result banner | d h f p x l e | — | Fills empty fields only; allowlisted hosts; never blocks Continue |
| Clear imported values | `product-setup.clear-imported` | mutate | self | Removes imported values that were not edited; toast “Imported values cleared.” | d h f l | — | Creator and edited values stay |
| Product title | `product-setup.edit-title` | mutate | self | Autosaves; head shows Saving… → Saved | d f e | — | Required to continue; ≤ 120 characters |
| Category | `product-setup.edit-category` | mutate | self | Autosaves | d f | — | Optional |
| Price (₱) | `product-setup.edit-price` | mutate | self | Autosaves | d f e | — | Optional; non-negative number |
| Description | `product-setup.edit-description` | mutate | self | Autosaves | d f | — | ≤ 2,000 characters |
| Affiliate link | `product-setup.edit-affiliate-link` | mutate | self | Autosaves | d f e | — | Required to continue; https URL |
| Feature field | `product-setup.edit-feature` | mutate | self | Autosaves | d f | — | ≤ 160 characters each |
| Remove feature (icon) | `product-setup.remove-feature` | mutate | self | Removes the feature row; autosaves | d h f | — | Label names the feature |
| Add a feature | `product-setup.add-feature` | mutate | self | Adds an empty feature row and focuses it | d h f x | — | ≤ 12 features |
| Rights checkbox | `product-setup.confirm-rights` | toggle | self | Unlocks the dropzone | d h f s | — | Recorded with each upload |
| Dropzone / browse your files | `product-setup.upload-assets` | submit | self | Adds tiles with per-file progress | d h f x l e | — | Types and limits validated before upload and by the server |
| Cancel upload | `product-setup.cancel-upload` | mutate | self | Stops that file; the tile disappears | d h f | — | — |
| Dismiss (failed tile) | `product-setup.dismiss-upload-error` | close | self | Removes the failed tile | d h f | — | — |
| Tile menu | `product-setup.open-asset-menu` | open | tile menu | Shows Replace and Remove | d h f o | — | — |
| Replace | `product-setup.replace-asset` | submit | self | Opens the file picker; the new file replaces the tile after upload | d h f l | — | The old file is removed only after the new one is stored |
| Remove | `product-setup.remove-asset` | open | `remove-asset-dialog` | Asks for confirmation | d h f | — | — |
| Projects (footer back) | `product-setup.back-to-projects` | navigate | `dashboard` | Opens Projects | d h f | leave dialog when unsaved | — |
| Continue to facts | `product-setup.continue` | submit | `fact-review` | Saves, creates facts from new features, opens Facts | d h f p x l | — | Server requires title and affiliate link |

### remove-asset-dialog

| Label | Action id | Type | Target | Observable result | States | Confirm | Rule |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Keep file | `remove-asset.keep` | close | trigger | Closes; nothing changes | d h f | — | — |
| Remove file | `remove-asset.confirm` | destructive | self | The tile disappears; toast “Removed blendgo-front.jpg.” | d h f l | this dialog; irreversible | Deletes the stored object |

## fact-review

| Label | Action id | Type | Target | Observable result | States | Confirm | Rule |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Filter chips (All · Needs review · Approved · Rejected · Unknown) | `fact-review.filter-facts` | filter | self | Shows matching facts with counts | d h f p s | — | Radio group |
| Add a fact | `fact-review.add-fact` | open | `add-fact-dialog` | Opens the dialog | d h f | — | — |
| Listing link (source line) | `fact-review.open-source` | external | listing URL | Opens the listing in a new tab | d h f | — | `rel="noopener noreferrer"` |
| Approve (segment) | `fact-review.approve-fact` | select | self | Badge becomes Approved; counters update | d h f p s x | — | Only approved facts feed writing |
| Reject (segment) | `fact-review.reject-fact` | select | self | Badge becomes Rejected; claim struck through | d h f p s x | — | — |
| Row menu | `fact-review.open-fact-menu` | open | row menu | Shows Edit wording, Mark as unknown, Remove | d h f o | — | — |
| Edit wording | `fact-review.edit-fact` | expand | self | Row becomes an editor with Save and Cancel | d h f | — | — |
| Save (editor) | `fact-review.save-fact` | mutate | self | New wording saved; source becomes Edited (or stays You entered); status Needs review | d h f p x l e | — | ≤ 200 characters; edited facts need approval again |
| Cancel (editor) | `fact-review.cancel-edit` | close | self | Restores the row | d h f | — | — |
| Mark as unknown | `fact-review.mark-unknown` | mutate | self | Badge Unknown; Approve/Reject hidden | d h f | — | Unknown counts as reviewed; it is never used in writing |
| Remove (creator facts) | `fact-review.remove-fact` | open | `remove-fact-dialog` | Asks for confirmation | d h f | — | Not offered for listing facts |
| Add a fact (empty state) | `fact-review.empty-add-fact` | open | `add-fact-dialog` | Opens the dialog | d h f | — | — |
| Go to product (empty state) | `fact-review.empty-go-product` | navigate | `product-setup` | Opens Product | d h f | — | — |
| Try again (load error) | `fact-review.retry-load` | mutate | self | Refetches facts | d h f l | — | — |
| Product (footer back) | `fact-review.back` | navigate | `product-setup` | Opens Product | d h f | — | — |
| Continue to strategy | `fact-review.continue` | navigate | `strategy` | Opens Strategy | d h f p x | — | Disabled with the live reason until nothing is unreviewed and ≥ 1 approved; the server re-checks when writing |

### add-fact-dialog

| Label | Action id | Type | Target | Observable result | States | Confirm | Rule |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Fact field | `add-fact.edit-text` | none | field | Holds the fact text | d f e | — | Required, ≤ 200 characters |
| Source note field | `add-fact.edit-source-note` | none | field | Where the creator confirmed it | d f | — | Optional, ≤ 160 characters |
| Approve now | `add-fact.toggle-approve` | toggle | self | The new fact is saved as Approved | d h f s | — | — |
| Cancel | `add-fact.cancel` | close | trigger | Closes without adding | d h f | — | — |
| Add fact | `add-fact.submit` | submit | self | The fact appears at the end of the list; toast “Fact added.” | d h f p x l e | — | Source: You entered |

### remove-fact-dialog

| Label | Action id | Type | Target | Observable result | States | Confirm | Rule |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Keep fact | `remove-fact.keep` | close | trigger | Closes | d h f | — | — |
| Remove fact | `remove-fact.confirm` | destructive | self | The row disappears; toast “Fact removed.” | d h f l | this dialog; irreversible | Scripts keep their text; the fact is no longer used for new writing |

## strategy

| Label | Action id | Type | Target | Observable result | States | Confirm | Rule |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Who is the buyer? | `strategy.edit-buyer` | mutate | self | Autosaves | d f e | — | Required to write; ≤ 120 characters |
| What problem do they have? | `strategy.edit-problem` | mutate | self | Autosaves | d f | — | Optional, ≤ 160 |
| What do they want instead? | `strategy.edit-benefit` | mutate | self | Autosaves | d f | — | Optional, ≤ 160 |
| Platform chips | `strategy.select-platform` | select | self | Selects TikTok Shop, Shopee Video or Other | d h f p s | — | Radio group |
| Script language chips | `strategy.select-language` | select | self | Selects English, Filipino or Taglish | d h f p s | — | Content language, not UI language |
| Length segment | `strategy.select-length` | select | self | Selects 20, 30 or 40 s | d h f p s | — | — |
| Tone chips | `strategy.select-tone` | select | self | Selects one tone | d h f p s | — | — |
| Content style chips | `strategy.select-style` | select | self | Selects one style; Skit with live sound shows its hint | d h f p s | — | Shapes the next script written (§3.22) |
| Suggest audiences · 1 credit / Suggest again · 1 credit (R24) | `strategy.suggest-audiences` | submit | self | Three skeleton cards, then three audiences | d h f p x l e | — | **Paid**; uses approved facts only |
| Audience card (R24) | `strategy.select-audience` | select | self | Fills buyer, problem and want; autosaves | d h f s x | — | Radio group; chosen while the fields match |
| Try again · 1 credit (audiences failed, R24) | `strategy.retry-audiences` | submit | self | Retries the same job | d h f x l | — | **Paid**; same job, no duplicate |
| Suggest angles · 1 credit / Suggest again · 1 credit | `strategy.suggest-angles` | submit | self | Three skeleton cards, then three angles | d h f p x l e | — | **Paid**; uses approved facts only |
| Try again · 1 credit (suggestion failed) | `strategy.retry-suggestions` | submit | self | Retries the same job | d h f x l | — | **Paid**; same job, no duplicate |
| Angle card | `strategy.select-angle` | select | self | Card shows the ring and check | d h f p s | — | Radio group with the own-angle card |
| Write my own angle | `strategy.select-own-angle` | select | self | Reveals the angle textarea | d h f p s | — | — |
| Describe your angle | `strategy.edit-own-angle` | mutate | self | Autosaves | d f e | — | Required when own angle is selected; ≤ 280 |
| Edit facts (aside) | `strategy.go-facts` | navigate | `fact-review` | Opens Facts | d h f | — | — |
| Facts (footer back) | `strategy.back` | navigate | `fact-review` | Opens Facts | d h f | leave dialog when unsaved | — |
| Open script (when a version exists) | `strategy.open-script` | navigate | `script-studio` | Opens Script | d h f | — | — |
| Write hooks & script · 3 credits / Write a new version · 3 credits | `strategy.write-script` | submit | `script-studio` | Saves the strategy, starts the job and opens Script with the job panel | d h f p x l | — | **Paid**; disabled with its reason when the buyer or angle is missing, credits are short, or offline |

## story-setup (§3.23 — approved 2026-09-26)

Entertainment Studio's intake step (Design Reference §5.17). Rendered only for a story; not rendered until built (Phase 29).

| Label | Action id | Type | Target | Observable result | States | Confirm | Rule |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Genre chips (Drama · Action · Comedy · Romance · Horror · Mystery · Fantasy · Slice of life) | `story.select-genre` | select | self | Selects one genre; its hint shows under the chips; autosaves; after suggestions, a different genre shows the stale warning | d h f p s | — | Radio group; nothing chosen on a new story; one genre per project (R28 D5) |
| Story detail (optional) | `story.edit-detail` | mutate | self | Autosaves the short detail AI uses to expand three complete premises | d f e | — | Optional; ≤ 160; changing it makes an existing suggestion set stale; it is not itself a premise (R30) |
| Suggest premises · 1 credit / Suggest again · 1 credit | `story.suggest-premises` | submit | self | Three skeleton cards and “Suggesting premises…”, then three premise cards | d h f p x l e | — | **Paid**; disabled with the tooltip “Pick a genre first” until a genre is chosen, when credits are short, or offline (R28 D9) |
| Try again · 1 credit (premises failed) | `story.retry-premises` | submit | self | Retries the same job | d h f x l | — | **Paid**; same job, no duplicate |
| Premise card | `story.select-premise` | select | self | Card shows the ring and check; saves the premise; fills the cast only while the Cast card is empty | d h f p s | — | Radio group with the own-premise card; typed characters are never replaced |
| Write my own premise | `story.select-own-premise` | select | self | Reveals the Describe your story textarea | d h f p s | — | — |
| Describe your story | `story.edit-own-premise` | mutate | self | Autosaves | d f e | — | Required when own premise is selected; ≤ 280 |
| Character name | `story.edit-character-name` | mutate | self | Autosaves the cast | d f e | — | 1–24 characters, unique without case; a row with no name stays on screen and isn't saved |
| Who they are | `story.edit-character-role` | mutate | self | Autosaves | d f | — | ≤ 80 |
| Look | `story.edit-character-look` | mutate | self | Autosaves | d f | — | ≤ 80; used to describe the character in AI clips |
| Remove character (icon) | `story.remove-character` | mutate | self | Removes the row; the counter updates; autosaves | d h f p | — | Accessible name “Remove Ana” |
| Add a character | `story.add-character` | mutate | self | Adds an empty character row; the counter updates | d h f p x | — | At most 4; disabled at 4 with the hint “Up to 4 characters.” |
| Storytelling chips (Acted · Narrated) | `story.select-storytelling` | select | self | Selects how the story is told; its hint shows; autosaves | d h f p s | — | Default Acted; Narrated needs no character (R28 D8) |
| Script language chips | `story.select-language` | select | self | Selects English, Filipino or Taglish; autosaves | d h f p s | — | Default Taglish; content language, not UI language |
| Length segment | `story.select-length` | select | self | Selects 30, 45 or 60 s; autosaves | d h f p s | — | Default 45 s (R28 D8) |
| Projects (footer back) | `story.back-to-projects` | navigate | `dashboard` | Opens Projects | d h f | leave dialog when unsaved | — |
| Open script (when a version exists) | `story.open-script` | navigate | `script-studio` | Opens Script | d h f | — | — |
| Write hooks & script · 3 credits / Write a new version · 3 credits | `story.write-script` | submit | `script-studio` | Saves the story, starts the job and opens Script with the job panel | d h f p x l | — | **Paid**; disabled with its reason: “Pick a genre” · “Choose or write a premise” · “Add a character, or switch to Narrated” · “You need 3 credits. You have 2.”, or offline |
| Episode row (title link) · Open episode N | `story.open-episode` | navigate | `story-setup` (that episode) | Opens that episode's Story step | d h f | leave dialog when unsaved | (§3.25) The current episode's row isn't a link (`aria-current="page"`); on an earlier episode the Next button reads Open episode N+1 |
| Show all 12 episodes | `story.show-all-episodes` | toggle | self | Expands the Episodes list in place | d h f | — | (§3.25) Only with more than 6 episodes |
| Next episode | `story.next-episode` | submit | `story-setup` (new episode) | Makes the next episode (copies genre, format, cast, Keep consistent items) and opens its Story step; toast “Episode 3 is ready. It picks up where Episode 2 ended.” | d h f p x l e | — | (§3.25, R31) Free; latest episode only; disabled until its script is approved, when final, at 50 episodes, or offline; idempotent |
| Previous episode link (Previously card) | `story.open-previous` | navigate | `story-setup` (previous episode) | Opens the previous episode's Story step | d h f | leave dialog when unsaved | (§3.25) Episode 2+ only |
| Final episode switch | `story.toggle-final` | mutate | self | Autosaves; the next version written ends the story (last scene Ending) and Next episode is disabled | d h f s x | — | (§3.25, R31) Episode 2+ only; disabled when a later episode exists; Episode 1 always ends on a cliffhanger |

## script-studio

| Label | Action id | Type | Target | Observable result | States | Confirm | Rule |
| --- | --- | --- | --- | --- | --- | --- | --- |
| History | `script-studio.open-history` | open | `version-history-drawer` | Opens the drawer | d h f p o | — | — |
| Hook card | `script-studio.select-hook` | select | self | Card shows the ring and check; autosaves | d h f p s x | — | One selected hook per version; disabled on an approved version |
| Edit (hook) | `script-studio.edit-hook` | expand | self | Hook text and opening shot become fields | d h f x | — | Draft versions only |
| Rewrite · 1 credit (hook) | `script-studio.rewrite-hook` | submit | self | That card shows a skeleton and “Rewriting this hook…”; only it changes | d h f p x l e | — | **Paid**; other hooks untouched |
| Previous hook / Next hook (below 1024px) | `script-studio.page-hooks` | paginate | self | Scrolls the rail one card; “1 of 3” updates | d h f p x | — | Disabled at the ends; hidden with one hook |
| Change length (length banner) | `script-studio.change-length` | navigate | `strategy` | Opens Strategy with focus on Length | d h f | leave dialog when unsaved | ⚠ The target for a story (its length is on the Story step) isn't settled by §3.23 |
| Scene duration | `script-studio.edit-duration` | mutate | self | Time ranges and total update; autosaves | d f e | — | 2–15 s |
| Rewrite scene · 1 credit | `script-studio.rewrite-scene` | submit | self | That scene shows a skeleton and “Rewriting this scene…” | d h f p x l e | — | **Paid**; voice and other scenes untouched |
| Narration | `script-studio.edit-narration` | mutate | self | Autosaves; length and claim check update | d f | — | Re-checked on save; not in skit versions (§3.22) |
| Who says the line | `script-studio.edit-line-speaker` | mutate | self | Autosaves with the scene's lines | d f x | — | ≤ 24; skit versions only; draft only (§3.22) |
| Line | `script-studio.edit-line-text` | mutate | self | Autosaves; the scene grows to fit; claim check updates | d f e x | — | ≤ 120; a row without words isn't saved; skit versions only (§3.22) |
| Add line | `script-studio.add-line` | mutate | self | Adds an empty row, focusable; counter updates | d h f p x | — | At most 3; disabled at 3 (§3.22) |
| Remove line | `script-studio.remove-line` | mutate | self | Removes the row; autosaves | d h f p x | — | Immediate (§3.22) |
| Sound | `script-studio.edit-sound` | mutate | self | Autosaves | d f x | — | ≤ 80; empty clears it; skit versions only (§3.22) |
| On-screen text | `script-studio.edit-on-screen-text` | mutate | self | Autosaves | d f e | — | ≤ 60 characters |
| Suggested visual | `script-studio.edit-visual` | mutate | self | Autosaves | d f | — | ≤ 200 |
| Scenario (Shoot plan) | `script-studio.edit-scenario` | mutate | self | Autosaves | d f x | — | ≤ 300; draft only |
| On camera (Shoot plan) | `script-studio.edit-presenter` | mutate | self | Autosaves; empty means nobody on camera | d f x | — | ≤ 160; draft only; labelled Cast in a skit (§3.22) and in every story version (§3.23) |
| In frame | `script-studio.set-in-frame` | select | self | Autosaves | d h f o x | — | You on camera · Hands only · Product only; (§3.23) in a story Cast on camera · Hands only · No one in frame (same values) |
| Framing | `script-studio.set-framing` | select | self | Autosaves | d h f o x | — | Close-up · Medium · Wide · Overhead · POV |
| Setting | `script-studio.edit-setting` | mutate | self | Autosaves | d f x | — | ≤ 80 |
| Props | `script-studio.edit-props` | mutate | self | Autosaves | d f x | — | ≤ 120; comma-separated |
| Transition in | `script-studio.set-transition` | select | self | Autosaves; the hint follows the value | d h f o x | — | Cut · Punch-in · Whip · Dissolve; not on scene 1 (“Opens the video.”); draft only (§3.19) |
| CTA | `script-studio.edit-cta` | mutate | self | Autosaves | d f | — | CTA scene only; ≤ 80; never in a story, which has no Call to action scene (§3.23) |
| Add as a fact (flag) | `script-studio.add-flag-as-fact` | open | `add-fact-dialog` | Opens Add a fact prefilled with the claim | d h f | — | The line stays flagged until the fact is approved; never in a story (§3.23) |
| Try again (item rewrite failed) | `script-studio.retry-rewrite` | submit | self | Retries that rewrite | d h f l | — | **Paid**; same job |
| Caption | `script-studio.edit-caption` | mutate | self | Autosaves; counter updates | d f e | — | ≤ 300 characters |
| Go to scene n (claim check) | `script-studio.jump-to-flag` | navigate | self | Scrolls to the scene and focuses its narration | d h f | — | Not in a story (no Claim check card, §3.23) |
| Change strategy (aside) | `script-studio.go-strategy` | navigate | `strategy` | Opens Strategy | d h f | leave dialog when unsaved | Affiliate Studio versions only |
| Edit facts (aside) | `script-studio.go-facts` | navigate | `fact-review` | Opens Facts | d h f | leave dialog when unsaved | Affiliate Studio versions only |
| Change story (Story card) | `script-studio.go-story` | navigate | `story-setup` | Opens Story | d h f | leave dialog when unsaved | Story versions only; in place of Change strategy and Edit facts (§3.23) |
| Edit as vN (approved banner) | `script-studio.edit-as-new` | mutate | self | Creates a draft copy and shows it; toast “v4 is a new draft.” | d h f l | — | Approved versions are immutable |
| Back to projects (job panel) | `script-studio.job-back-to-projects` | navigate | `dashboard` | Opens Projects; the job keeps running | d h f | — | — |
| Try again · 3 credits (job failed) | `script-studio.retry-job` | submit | self | The panel returns to Queued | d h f p x l | — | **Paid**; same job |
| Back to strategy (job failed) | `script-studio.job-back-to-strategy` | navigate | `strategy` | Opens Strategy | d h f | — | ⚠ What this reads and opens for a story isn't settled by §3.23 |
| Strategy (footer back) / Story (a story) | `script-studio.back` | navigate | `strategy` (a story: `story-setup`) | Opens Strategy, or Story for a story | d h f | leave dialog when unsaved | Label and target follow the studio (§3.23) |
| Approve vN / Approve vN again | `script-studio.approve-version` | open | `approve-version-dialog` | Opens the approve dialog | d h f p x | — | Disabled with its reason while a flag is unresolved, no hook is selected, a job is writing, or offline; a story needs only a picked hook and no running job (§3.23) |
| Open creator brief | `script-studio.open-brief` | navigate | `creator-brief` | Opens the brief | d h f p | — | Shown when the viewed version is approved |
| Continue to media (Batch 2) | `script-studio.continue-to-media` | navigate | `media-mapping` | Opens Media; Open creator brief becomes secondary | d h f p | — | Shown when the viewed version is approved, once Batch 2 is built |

### approve-version-dialog

| Label | Action id | Type | Target | Observable result | States | Confirm | Rule |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Keep editing | `approve-version.cancel` | close | trigger | Closes | d h f | — | — |
| Approve vN | `approve-version.confirm` | submit | self | The version locks; success banner; footer switches to Open creator brief | d h f p l e | — | Server rejects with a conflict if a flag is unresolved |

### version-history-drawer

| Label | Action id | Type | Target | Observable result | States | Confirm | Rule |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Close | `version-history.close` | close | trigger | Closes the drawer | d h f | — | — |
| View (a version row) | `version-history.view` | navigate | `script-studio?version=n` | Shows that version read-only if it isn't the current draft | d h f s | — | — |
| Restore as vN | `version-history.restore` | mutate | self | A new draft copy opens; toast “v2 restored as v4. Nothing was overwritten.” | d h f l | — | Never overwrites |

## creator-brief

| Label | Action id | Type | Target | Observable result | States | Confirm | Rule |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Copy brief | `creator-brief.copy` | copy | clipboard | Label becomes “Copied” for 2 s; toast “Brief copied.” | d h f p s e | — | No AI call, no credits |
| Download .txt | `creator-brief.download` | copy | file | Saves `<project-slug>-brief-v3.txt` | d h f p | — | — |
| Review v4 (newer draft banner) | `creator-brief.review-draft` | navigate | `script-studio` | Opens Script on the draft | d h f | — | — |
| Script (footer back) | `creator-brief.back` | navigate | `script-studio` | Opens Script | d h f | — | — |
| Back to projects | `creator-brief.done` | navigate | `dashboard` | Opens Projects | d h f p | — | Terminal step in Batch 1 |

## not-found

| Label | Action id | Type | Target | Observable result | States | Confirm | Rule |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Back to projects | `not-found.back` | navigate | `dashboard` | Opens Projects (or sign-in when signed out) | d h f | — | — |

## Batch 2 (approved 2026-09-24)

These rows follow the Design Reference §5B. They are not rendered until each screen is built.

### media-mapping

| Label | Action id | Type | Target | Observable result | States | Confirm | Rule |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Media slot (“Choose media”) | `media-mapping.choose-media` | open | `media-picker-sheet` | Opens the picker for that scene | d h f p | — | — |
| Fill from uploads | `media-mapping.auto-fill` | mutate | self | Empty scenes get uploads in order; filled scenes are untouched | d h f x l | — | Free; deterministic, no AI |
| Motion (Still · Slow zoom) | `media-mapping.set-motion` | mutate | self | Saves the photo's motion; autosave | d h f s x | — | Photos only |
| Start at | `media-mapping.set-clip-start` | mutate | self | Saves the clip's start point; the range hint updates | d f e x | — | Start + scene length ≤ clip length, else field error |
| Change | `media-mapping.change-media` | open | `media-picker-sheet` | Opens the picker with the current pick selected | d h f | — | — |
| Clear | `media-mapping.clear-media` | mutate | self | The slot empties; the gating count rises | d h f | — | — |
| Use v4 (version banner) | `media-mapping.use-latest-version` | mutate | self | The video switches to v4; matching scenes keep media; the voiceover is marked outdated | d h f l | — | Only when a newer approved version exists |
| Item photo slot (Keep consistent, §3.21) | `media-mapping.item-photo` | open | `item-photo-sheet` | Opens the photo picker for that item | d h f p x | — | Rendered only while AI scene clips are enabled; disabled offline |
| Item name (Keep consistent) | `media-mapping.rename-item` | mutate | self | Saves the name; autosave | d f e x | — | 1–60 characters, unique (case-insensitive); the product row is read-only; (§3.23) a story's character rows rename like props, without changing the story's cast |
| Scene chip (Keep consistent) | `media-mapping.toggle-item-scene` | toggle | self | Puts the item in or out of that scene; autosave | d h f s x | — | `aria-pressed`; the product keeps at least one scene |
| Remove (Keep consistent) | `media-mapping.remove-item` | mutate | self | Removes the item; toast; the photo stays in uploads | d h f x | — | Prop rows only; (§3.23) in a story also character rows |
| Add an item (Keep consistent) | `media-mapping.add-item` | mutate | self | Adds a row; its name input takes focus | d h f x | — | At most 8 items |
| Manage on Product | `media-mapping.go-product` | navigate | `product-setup` | Opens Product | d h f | — | ⚠ A story has no Product step; its replacement isn't settled by §3.23 |
| Script (footer back) | `media-mapping.back` | navigate | `script-studio` | Opens Script | d h f | — | — |
| Continue to voice | `media-mapping.continue` | navigate | `voice-studio` | Opens Voice | d h f p x | — | Every scene has media or a text card |

### media-picker-sheet

| Label | Action id | Type | Target | Observable result | States | Confirm | Rule |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Close | `media-picker.close` | close | trigger | Closes without changes | d h f | — | — |
| Filter (All · Photos · Clips; + AI clips when enabled) | `media-picker.filter` | filter | self | Shows matching tiles | d h f s | — | — |
| Media tile / Text card | `media-picker.select-media` | select | self | Selects the tile (ink ring + check) | d h f s | — | Radio group; reuse across scenes allowed |
| Upload photos or clips | `media-picker.upload` | upload | self | Runs the Product uploader in the sheet; new tiles appear | d h f x l e | — | Same rights confirmation, types, sizes and 20-file cap as Product |
| Cancel | `media-picker.cancel` | close | trigger | Closes without changes | d h f | — | — |
| Use this | `media-picker.confirm` | mutate | trigger | Sets the scene's media and closes; an unchecked AI clip opens `ai-clip-check-dialog` first | d h f x l | — | Disabled until a tile is selected |

### item-photo-sheet (Keep consistent, §3.21 — approved 2026-09-25)

| Label | Action id | Type | Target | Observable result | States | Confirm | Rule |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Close | `item-photo.close` | close | trigger | Closes without changes | d h f | — | — |
| Photo tile | `item-photo.select-photo` | select | self | Selects the photo (ink ring + check) | d h f s | — | Radio group; photos only; reuse across items allowed |
| Upload photos | `item-photo.upload` | upload | self | Runs the Product uploader for photos; the new photo is selected | d h f x l e | — | Product limits and rights confirmation |
| Cancel | `item-photo.cancel` | close | trigger | Closes without changes | d h f | — | — |
| Likeness confirmation (character photo) | `item-photo.confirm-likeness` | toggle | self | Ticks “This is me, someone who agreed to appear in AI video, or a character I have the rights to.”; Use this enables once a photo is also selected | d h f s | — | A story's character items only (§3.23, R28 D3); required for every character photo and asked again when the photo changes; recorded with the item |
| Use this | `item-photo.confirm` | mutate | trigger | Sets the item's photo and closes; autosave | d h f x l | — | Disabled until a tile is selected, and for a story's character until the likeness box is ticked (§3.23) |

### ai-clip-sheet (AI scene clips, §5C — approved 2026-09-25)

Rendered only while AI scene clips are enabled. Entry points on other screens: `media-mapping.generate-clip`, `media-mapping.view-clip-job`, `media-mapping.review-clips` and `media-picker.generate-clip` (rows below). A one-click clip (`media-mapping.generate-consistent-clip`, §3.21) starts without the sheet; its **View** and **Review** open it.

| Label | Action id | Type | Target | Observable result | States | Confirm | Rule |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Customize (scene row; was “Generate a clip”, §3.21) | `media-mapping.generate-clip` | open | `ai-clip-sheet` | Opens the Request view for that scene | d h f p x | — | Hidden unless enabled; disabled offline |
| Generate clip · 4 credits (scene row, §3.21) | `media-mapping.generate-consistent-clip` | submit | self | Holds 4 credits and starts one clip from the scene's Keep consistent photos and, past the first scene, a still of the previous scene; the row shows “Generating 1 clip…” | d h f p x l | — | **Paid**; disabled with its reason until every item has a photo, and (past the first scene) until the first scene holds an AI clip; one job per scene. (§3.23) A story has no photo gate: it sends the photos it has, and a scene with no photo or still is made from the description |
| View (scene row, generating or failed) | `media-mapping.view-clip-job` | open | `ai-clip-sheet` | Opens the Generating view | d h f | — | — |
| Review (scene row, clips ready) | `media-mapping.review-clips` | open | `ai-clip-sheet` | Opens the Review view | d h f | — | — |
| Generate a clip (picker) | `media-picker.generate-clip` | open | `ai-clip-sheet` | Closes the picker and opens the Request view for the same scene | d h f x | — | Hidden unless enabled |
| Close | `ai-clip.close` | close | trigger | Closes; a running job keeps running | d h f | — | — |
| Mode (R23) | `ai-clip.select-mode` | select | self | Switches how the photos are used; keeps still-valid photos; refreshes an unedited description | d h f s x | — | Start from a photo · Move between two · Match my photos; vertical radio list below 640px. (§3.23, R28 D2) A story's sheet adds **Describe only** first, selected by default, which hides Photos |
| Photo tile | `ai-clip.select-photo` | select | self | Selects the source photo (ink ring + check); R23: in Move between two it toggles Start/End in pick order, in Match my photos it toggles up to 4 | d h f s x | — | Radio group in Start from a photo, checkbox group in the other modes; ready photo uploads with confirmed rights only |
| Swap start and end (R23) | `ai-clip.swap-photos` | mutate | self | Swaps the Start and End photos | d h f | — | Move between two, both photos picked |
| How many clips (R23) | `ai-clip.set-count` | select | self | Sets 1 or 2 clips; the Generate label and cost follow | d h f s x | — | 1 clip (default) · 2 to compare |
| Upload photos | `ai-clip.upload` | upload | self | Runs the uploader for photos; the new photo is selected | d h f x l e | — | Product limits and rights confirmation |
| Describe the motion | `ai-clip.edit-prompt` | mutate | self | Counter updates; the description is claim-checked (not in a story, §3.23) | d f e | — | 1–500 characters; flags warn, never block |
| Use the scene's direction | `ai-clip.reset-prompt` | mutate | self | Restores the prefilled description | d h f | — | Shown after an edit |
| Cancel | `ai-clip.cancel` | close | trigger | Closes without starting | d h f | — | — |
| Generate 2 clips · 8 credits | `ai-clip.generate` | submit | self | Holds 8 credits; the Generating view shows | d h f p x l | — | **Paid**; one request per scene in flight; disabled with its reason |
| Try again · 8 credits (failed) | `ai-clip.retry` | submit | self | The panel returns to Queued | d h f p x l | — | **Paid**; same job |
| Change the request (failed) | `ai-clip.edit-request` | navigate | self | Request view with the photo and description kept | d h f | — | — |
| Review (toast action) | `ai-clip.toast-review` | open | `ai-clip-sheet` | Opens the Review view for that scene | d h f | — | — |
| Clip card | `ai-clip.select-clip` | select | self | Selects the clip; the checks reset | d h f s | — | Radio group |
| Play / Pause clip | `ai-clip.play-clip` | toggle | self | Plays the clip with its sound, once; pausing another clip and any other page sound | d h f p s | — | Never autoplays (was muted; §3.22) |
| Accuracy checks | `ai-clip.confirm-accuracy` | toggle | self | Ticks a check; Use enables when both are ticked | d h f s | — | Both required (R20); a story's two checks use the story copy (§3.23) |
| Discard both | `ai-clip.discard` | open | `discard-clips-dialog` | Opens the confirmation | d h f | danger dialog | Credits used aren't returned |
| Try again · 8 credits (review) | `ai-clip.regenerate` | submit | self | Starts a new job with the same photo and description | d h f p x l | — | **Paid**; current clips are kept |
| Use in scene n | `ai-clip.use` | mutate | trigger | Records the check, sets the scene's media to the clip, closes; toast | d h f x l | — | Disabled until a clip is picked and both checks are ticked |

### discard-clips-dialog · ai-clip-check-dialog

| Label | Action id | Type | Target | Observable result | States | Confirm | Rule |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Keep clips | `discard-clips.cancel` | close | trigger | Closes; nothing changes | d h f | — | — |
| Discard clips | `discard-clips.confirm` | destructive | `media-mapping` | Deletes the unused clips of that request; closes the sheet; toast “Clips discarded.” | d h f l | this dialog | A clip already used in a scene is kept |
| Accuracy checks (check dialog) | `ai-clip-check.confirm-accuracy` | toggle | self | Ticks a check | d h f s | — | Both required |
| Cancel (check dialog) | `ai-clip-check.cancel` | close | `media-picker-sheet` | Back to the picker; nothing changes | d h f | — | — |
| Use in scene n (check dialog) | `ai-clip-check.confirm` | mutate | `media-mapping` | Records the check, applies the clip, closes the dialog and picker | d h f x l | — | Disabled until both are ticked |

### voice-studio

| Label | Action id | Type | Target | Observable result | States | Confirm | Rule |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Voiceover source (AI voice · My recording · No voiceover · Sound from your clips) | `voice-studio.select-source` | select | self | Shows that source's controls; autosave; Sound from your clips turns every scene's clip sound on | d h f s x | — | Changing source never deletes a track; AI voice and My recording disabled when no scene has narration (§3.22); (§3.23) an Acted story starts on Sound from your clips, a Narrated one on AI voice |
| Voice row | `voice-studio.select-voice` | select | self | Selects the voice; settings-changed notice when a voiceover exists | d h f s | — | Allowlisted voices only |
| Play sample | `voice-studio.play-sample` | play | self | Plays the voice's sample; toggles to Stop | d h f l s | — | Free; one audio source at a time |
| Speed (0.9× · 1.0× · 1.1×) | `voice-studio.select-speed` | select | self | Saves speed | d h f s | — | — |
| Add a word | `voice-studio.add-pronunciation` | mutate | self | Adds a Word / Say it like row | d h f x | — | Up to 20 |
| Remove pronunciation | `voice-studio.remove-pronunciation` | mutate | self | Removes the row | d h f | — | — |
| Generate voiceover / Generate again · 2 credits | `voice-studio.generate` | submit | self | Starts a voice job; the job panel shows | d h f p x l | — | **Paid**; idempotency key per click intent |
| Try again · 2 credits | `voice-studio.retry-job` | submit | self | Retries the same job | d h f l | — | **Paid**; reuses the job |
| Confirm recording rights | `voice-studio.confirm-recording-rights` | toggle | self | Unlocks the dropzone | d h f s | — | Recorded with the upload |
| Recording dropzone | `voice-studio.upload-recording` | upload | self | Uploads with progress; the track row appears | d h f x l e | — | Audio types; ≤ 20 MB; ≤ 90 s |
| Time captions · 1 credit | `voice-studio.align-recording` | submit | self | Starts a timing job; scene timing appears on success | d h f p x l | — | **Paid** |
| Replace (recording) | `voice-studio.replace-recording` | upload | self | Picks a new file; timing must run again | d h f l | — | — |
| Remove (recording) | `voice-studio.remove-recording` | open | `remove-recording-dialog` | Asks to confirm | d h f | yes | — |
| Play / pause voiceover | `voice-studio.play-voiceover` | play | self | Plays the track | d h f s | — | — |
| Voiceover scrubber | `voice-studio.seek` | seek | self | Moves the playhead | d f | — | — |
| Edit wording in Script | `voice-studio.go-script` | navigate | `script-studio` | Opens Script | d h f | — | Wording changes need a new approved version |
| Media (footer back) | `voice-studio.back` | navigate | `media-mapping` | Opens Media | d h f | — | — |
| Continue to edit | `voice-studio.continue` | navigate | `scene-editor` | Opens Edit & preview | d h f p x | — | Voiceover settled for the video's version |

### remove-recording-dialog

| Label | Action id | Type | Target | Observable result | States | Confirm | Rule |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Keep recording | `remove-recording.cancel` | close | trigger | Closes | d h f | — | — |
| Remove recording | `remove-recording.confirm` | mutate | trigger | Deletes the file and its timing; toast “Removed narration.m4a.” | d h f l | — | Deletes the stored object |

### scene-editor

| Label | Action id | Type | Target | Observable result | States | Confirm | Rule |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Play / pause preview | `scene-editor.play-preview` | play | self | Plays the live preview from the playhead | d h f s | — | — |
| Preview scrubber | `scene-editor.seek-preview` | seek | self | Moves the playhead; the playing scene card is marked | d f | — | — |
| Sound toggle | `scene-editor.toggle-preview-sound` | toggle | self | Mutes or unmutes the preview | d h f s | — | — |
| Scene thumbnail | `scene-editor.seek-to-scene` | seek | self | Seeks the preview to that scene | d h f | — | — |
| On-screen text | `scene-editor.edit-on-screen-text` | mutate | self | Autosaves; the preview updates; claim check runs | d f e x | — | Max 60 |
| Transition in | `scene-editor.set-transition` | select | self | Autosaves; the preview plays it from the scene before | d h f o x | — | Cut · Punch-in · Whip · Dissolve; not at position 1 (“Opens the video.”); editable at every width (§3.19) |
| Clip sound | `scene-editor.toggle-clip-sound` | toggle | self | Autosaves; the preview plays or mutes the clip's own sound | d h f s x | — | Clip scenes only; on by default in a skit (§3.22) |
| Clip sound level | `scene-editor.set-clip-sound-level` | mutate | self | Autosaves; the preview plays at the level | d h f x | — | 0–100% step 5; disabled while off; read-only below 1024px (§3.22) |
| Duration (No voiceover or Sound from your clips, ≥ 1024px) | `scene-editor.edit-duration` | mutate | self | Autosaves; times update | d f e x | — | 2–15 s; read-only with a voiceover and below 1024px |
| Drag handle | `scene-editor.reorder-scene` | reorder | self | Moves the scene; announces the new position | d h f p | — | ≥ 1024px; keyboard Space / arrows |
| Scene menu | `scene-editor.open-scene-menu` | open | scene menu | Shows Move up, Move down, Change media, Adjust clip start | d h f p o | — | — |
| Move up / Move down | `scene-editor.move-scene` | reorder | self | Moves the scene one place | d h f x | — | Disabled at the ends |
| Change media | `scene-editor.change-media` | open | `media-picker-sheet` | Opens the picker | d h f | — | — |
| Adjust clip start… | `scene-editor.set-clip-start` | mutate | self | Popover with Start at; autosaves | d h f e | — | Clips only |
| Show captions | `scene-editor.toggle-captions` | toggle | self | Hides or shows captions in the preview and export | d h f s | — | — |
| Caption style chips | `scene-editor.select-caption-style` | select | self | Changes the style in the preview | d h f s | — | ≥ 1024px; read-only below |
| Caption line | `scene-editor.edit-caption-line` | mutate | self | Autosaves wording and line breaks; claim check runs | d f e x | — | ≤ 2 lines, ≤ 32 characters per line |
| Reset captions to the voiceover | `scene-editor.reset-captions` | open | `reset-captions-dialog` | Asks to confirm | d h f | yes | Hidden with No voiceover; reads “Reset captions to the script” with Sound from your clips (§3.22) |
| Confirm music rights | `scene-editor.confirm-music-rights` | toggle | self | Unlocks Upload a track | d h f s | — | Recorded with the upload; a story's label reads “I have the right to use this music in this video” (§3.23) |
| Upload a track | `scene-editor.upload-music` | upload | self | Uploads with progress; the music row appears | d h f x l e | — | Audio types; ≤ 20 MB |
| Play / stop music | `scene-editor.play-music` | play | self | Plays the track alone | d h f s | — | — |
| Music level | `scene-editor.set-music-level` | mutate | self | Autosaves; the preview mix changes | d f x | — | 0–100% step 5; ≥ 1024px |
| Remove music | `scene-editor.remove-music` | open | `remove-music-dialog` | Asks to confirm | d h f | yes | — |
| Show an end card | `scene-editor.toggle-end-card` | toggle | self | Adds or removes the 2 s end card | d h f s | — | On by default; off by default for a story, whose card shows the title and the end line (§3.23) |
| End line (end card, story) | `scene-editor.edit-end-line` | mutate | self | Autosaves; the end card and its preview line update | d f e x | — | Optional, ≤ 60; stories only, shown while Show an end card is on; not claim-checked (§3.23) |
| Go to voice (banner) | `scene-editor.go-voice` | navigate | `voice-studio` | Opens Voice | d h f | — | — |
| Voice (footer back) | `scene-editor.back` | navigate | `voice-studio` | Opens Voice | d h f | — | — |
| Continue to export | `scene-editor.continue` | navigate | `export` | Opens Export video | d h f p x | — | No flags; voiceover current |

### reset-captions-dialog · remove-music-dialog

| Label | Action id | Type | Target | Observable result | States | Confirm | Rule |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Keep my edits | `reset-captions.cancel` | close | trigger | Closes | d h f | — | — |
| Reset captions | `reset-captions.confirm` | mutate | trigger | Captions return to the voiceover's words; toast “Captions reset.” | d h f l | — | — |
| Keep music | `remove-music.cancel` | close | trigger | Closes | d h f | — | — |
| Remove music | `remove-music.confirm` | mutate | trigger | Removes the track; toast “Removed morning-beat.mp3.” | d h f l | — | Deletes the stored object |

### export

| Label | Action id | Type | Target | Observable result | States | Confirm | Rule |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Fix in Edit & preview | `export.go-edit` | navigate | `scene-editor` | Opens Edit & preview | d h f | — | — |
| Go to voice | `export.go-voice` | navigate | `voice-studio` | Opens Voice | d h f | — | — |
| Caption for posting | `export.edit-post-caption` | mutate | self | Autosaves; claim check runs (not for a story, §3.23) | d f e x | — | Max 2,200 |
| Start with #ad | `export.toggle-ad-tag` | toggle | self | Adds #ad to the copied caption | d h f s | — | Default on; not rendered for a story (§3.23, R28 D7) |
| Copy caption | `export.copy-caption` | copy | clipboard | “Copied” for 2 s | d h f p s e | — | Includes #ad when on; a story's caption never has #ad |
| Render video / Render again · 2 credits | `export.render` | submit | self | Starts a render; the job panel shows | d h f p x l | — | **Paid**; blocked by flags, outdated voiceover or missing media |
| Try again · 2 credits | `export.retry-render` | submit | self | Retries the same render | d h f l | — | **Paid**; reuses the job |
| Back to projects (job panel) | `export.job-back-to-projects` | navigate | `dashboard` | Opens Projects; the render continues | d h f | — | — |
| Back to edit (failed job) | `export.job-back-to-edit` | navigate | `scene-editor` | Opens Edit & preview | d h f | — | — |
| Download MP4 | `export.download` | download | file | Saves `<slug>-v3-export-2.mp4`; the project becomes Exported | d h f p l e | — | Short-lived signed link, fetched on click |
| Download creator brief | `export.download-brief` | download | file | Saves the brief .txt | d h f p | — | Same text as Creator brief |
| History Download | `export.history-download` | download | file | Saves that export's MP4 | d h f l e | — | — |
| History Details | `export.history-details` | toggle | self | Shows the settings snapshot | d h f s | — | Disclosure |
| Edit & preview (footer back) | `export.back` | navigate | `scene-editor` | Opens Edit & preview | d h f | — | — |

## Coverage

- **Screens covered:** all 13 Batch 1 screens and 9 overlays.
- **Unbound controls:** 0. Text fields carry `none` with a note, or `mutate` when they autosave.
- **Batch 2 (approved 2026-09-24):** 4 screens and 4 overlays above; their controls are not rendered until built.
- **AI scene clips (§5C, approved 2026-09-25):** 1 sheet and 2 dialogs; not rendered until enabled.
- **Shot direction (§5.8, revised 2026-09-25):** 6 Script controls.
- **Story episodes (§3.25, approved 2026-09-27, R31):** 5 new `story-setup` controls (`story.open-episode`, `story.show-all-episodes`, `story.next-episode`, `story.open-previous`, `story.toggle-final`); `story.edit-detail`, `story.suggest-premises`, `story.select-premise` and `story.select-own-premise` are reused on episode 2+ with the “What happens next” copy.
- **Entertainment Studio (§3.23, approved 2026-09-26):** 1 screen (`story-setup`, 17 controls) and 1 overlay (`new-video-dialog`, 2 controls), plus `script-studio.go-story`, `item-photo.confirm-likeness` and `scene-editor.edit-end-line` (22 new controls). `dashboard.create-project` and `dashboard.empty-create-project` now open the dialog; 27 other existing rows note their story rule. Not rendered until built (Phases 29–31).
- **Unresolved targets:** `needs-spec:terms`. This control is not rendered.
- **Prototype-only mechanisms:** none. This mode has no prototype; every row maps to a production handler in the Product Specification.
