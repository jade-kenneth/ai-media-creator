# Data requirements

What each screen shows and edits, in product terms. The storage, transport and schema are decided in the root [Product Specification](../../Product%20Specification.md) production mapping, not here.

## Entities the creator observes

| Entity | Observable fields |
| --- | --- |
| Account | display name, email, “Signed in with Google” |
| Studio (§3.23) | the built studios in registry order, each with its area, New video title, description and icon; a studio appears only once it is registered |
| Credits | balance; recent usage (label, project, amount, time; §3.23 adds “Suggest premises”); per-action estimates |
| Project | title, stage label, last edited, thumbnail (first photo), latest export (Batch 2), failure line, current step; (§3.23) its studio (Affiliate Studio or Entertainment Studio; projects stored before studios read as Affiliate Studio) and the studio's subject line (the product name, or “Story · Comedy”) |
| Product | title, category, price (₱, optional), description, affiliate link, key features; each field's source (imported / you entered / edited); import link and last import result |
| Asset | file name, kind (photo / clip; Batch 2 adds recording and music), size, clip duration, preview, upload progress, validation error, rights confirmation; for an AI clip (§5C): made by AI, the source photo, the description, clip A or B, and whether it has been checked (when) |
| Fact | text, source (listing with link, you entered, edited, not stated), status (unreviewed / approved / rejected / unknown), flag (category + reason), note |
| Strategy | buyer, problem, benefit, platform, script language, length (20 / 30 / 40 s), tone, content style, chosen angle (suggested or own) |
| Angle suggestion | type, title, pitch, facts used; whether the approved facts changed since |
| Story (§3.23–§3.24; stories only) | genre (one of Drama · Action · Comedy · Romance · Horror · Mystery · Fantasy · Slice of life, or none yet); optional Story detail (≤ 160, normalized, used only to guide premise suggestions); premise (a chosen suggestion's title and logline, or the creator's own text up to 280 characters, or none yet); cast of up to 4 characters, each with a name (1–24, unique without case), who they are (≤ 80) and a look (≤ 80); storytelling (Acted or Narrated); script language; length (30 · 45 · 60 s). Defaults: no genre, empty detail, no premise, no cast, Acted, Taglish, 45 s |
| Premise suggestion (§3.23–§3.24) | three per set, each with a title (≤ 60), a logline (≤ 200, ending on the open question, R29) and a cast of 1–4 characters (name, who they are, look); the genre and normalized Story detail the set was made from, so the screen can tell when either changed since |
| Story series (§3.25, R31; stories only) | owner; the episodes in order (project and episode number, 1–50); for each earlier episode a recap (≤ 300, written by the next episode's script job) and the approved version number it was written from; the series premise is Episode 1's premise. Each episode project also stores its episode number, whether it is the final episode, and the previous episode's approved version its script was written from (for the stale-continuity note). Projects with no series are Episode 1 of a series of one, with no backfill; a series record is created the first time Next episode is used |
| Script version | number, status (draft / approved / needs review), origin (written, rewritten, restored from vN, edited from vN), created and approved dates, angle, hooks (type, text, opening shot, selected), scenes (number, purpose, duration, time range, narration, on-screen text, suggested visual, shot direction (in frame, framing, setting, props), transition in (cut, punch-in, whip, dissolve; none on versions from before transitions), CTA, facts used, flags; in a skit (§3.22) up to 3 spoken lines (who, what they say) and a sound cue in place of narration), shoot plan (scenario, who is on camera or the cast), content style it was written in (none on versions from before skits), caption, spoken length, target length; (§3.23) the studio it was written in (none reads as Affiliate Studio); a story's version uses the story hook types and scene purposes, its last scene is always the Cliffhanger scene (R29), it has no CTA, no facts used and no flags, and it keeps the story it was written from |
| Generation job | kind (suggest angles, (§3.23) suggest premises, write hooks & script, rewrite hook, rewrite scene; Batch 2 adds generate voiceover, time a recording, render video; §5C adds generate scene clips, with the scene and the clips it made), status (queued / running / completed / failed), current step, started time, credits reserved or used, failure cause |
| Creator brief | plain text built from the latest approved version, its version number and approval date; (§3.23) a story's brief uses the story template (genre, premise, format, cast, `BEFORE YOU FILM AND POST`) |
| Video edit (Batch 2) | the approved version it uses; scenes in edit order, each with media (upload + motion or clip start, or a text card), on-screen text, duration, transition in, clip sound (on or off and a level, §3.22) and the shot direction, spoken lines and sound cue from the approved version (read-only); voice source (AI voice, my recording, no voiceover or sound from your clips); caption style, caption lines (time range, wording, line breaks), captions on or off; music (file, level, rights confirmed); end card on or off; caption for posting and the #ad choice; (§3.23) for a story: an end line (optional, ≤ 60), the end card off by default, no #ad choice, and Keep consistent characters |
| Voiceover (Batch 2) | source (AI voice, my recording, none); voice, speed and pronunciations, or the recording file and its rights confirmation; the version it reads; one timed segment per scene; word timings; created time |
| Export (Batch 2) | number, rendered time, length, resolution, file size, poster frame, the MP4, whether it was downloaded, and a snapshot of every setting and file it used, including each scene's transition and clip sound; (§3.23) the studio |
| Keep consistent item (§3.21; §3.23 characters) | name, kind (product, prop or, in a story, character), the scenes it is in, an optional photo; for a character's photo, when its likeness confirmation was given (“This is me, someone who agreed to appear in AI video, or a character I have the rights to.”) |

## Per screen

| Screen | Reads | Writes |
| --- | --- | --- |
| Sign in | — | Google sign-in (creates the account, workspace and starter credits the first time) |
| App shell | account, credits (balance, recent usage) | sign out |
| Dashboard | projects (page of 24, filter, sort) with each one's studio and subject line, counts per filter; (§3.23) the built studios for the New video dialog | create project in a studio (§3.23), rename, duplicate |
| Product setup | project, product, assets | product fields (autosave), import from link, clear imported values, rights confirmation, upload / replace / remove asset, continue (creates facts from features the first time) |
| Fact review | facts, whether a script exists | fact status, wording, add fact, remove creator fact |
| Strategy | strategy, approved facts, angle suggestions, credits, active job | strategy fields (autosave), suggest angles (paid job), write hooks & script (paid job) |
| Story (§3.23) | the story, the premise suggestion set and whether it is stale, credits, active job, whether a version exists | story fields (autosave: genre, premise, cast, storytelling, language, length), suggest premises (paid job, 1 credit), write hooks & script (paid job) |
| Script Studio | versions (list and current), active job, facts, strategy summary (a story: its story summary, §3.23), credits | version fields (autosave), select hook, rewrite hook or scene (paid jobs), retry job, approve, restore, edit an approved version as a new draft |
| Creator brief | brief text, newest draft status | — (copy and download happen on the device) |
| Media (Batch 2) | video edit (with its shoot plan, §3.20, and — while AI clips are enabled — its Keep consistent items, §3.21), approved versions, uploads | scene media, motion, clip start (autosave), fill from uploads, switch to a newer approved version, upload from the picker; (§3.21) rename, add, remove and tag Keep consistent items and set each item's photo (autosave), one-click Generate clip (paid job); (§3.23) in a story, character items and each character photo's likeness confirmation |
| AI clip sheet (§5C) | the scene (direction, visual, current media), ready photos, the request's mode and its photos (R23: one, start + end, or 2–4 references), the scene's latest clip job and its clips, description flags, credits | generate scene clips (paid job), retry, check a clip, use it in a scene, discard a request's unused clips; (§3.23) in a story, a Describe only request (no photos) prefilled with the characters' looks and the genre's mood |
| Voice (Batch 2) | voiceover settings and track, video edit's version, allowed voices and samples, active job, credits | source, voice, speed, pronunciations (autosave), generate voiceover (paid job), upload / replace / remove recording, time a recording (paid job) |
| Edit & preview (Batch 2) | video edit, voiceover segments and word timings, uploads, product title and CTA | scene order, on-screen text, durations (no voiceover), caption style, caption lines, captions on/off, reset captions, music upload / level / remove, end card (autosave); (§3.23) a story's end line and the story title for its end card |
| Export (Batch 2) | final-check summary, video edit, exports, active render job, credits | caption for posting and #ad (autosave; a story has no #ad, §3.23), render video (paid job), download an export (marks it downloaded) |

## Rules the data must enforce

- Only **approved** facts are sent to writing jobs; the job records which facts it used.
- An approved script version is immutable. Edits create a new draft.
- Changing or unapproving a fact that an approved version uses marks that version **needs review**.
- A paid job holds its estimated credits when it starts, charges them on completion and releases them on failure. A repeated request with the same idempotency key returns the same job.
- Suggested angles record the fact set they used, so the screen can tell when they are stale.
- Import fills empty fields only and records which fields it filled.
- (Batch 2) A video edit uses exactly one approved version until the creator switches. Voiceovers and exports record the version they read.
- (Batch 2) Every line a viewer reads (on-screen text, captions, the caption for posting) is claim-checked; a flag blocks rendering.
- (Batch 2) Recordings and music keep their own rights confirmation; photos and clips keep theirs from upload.
- (Batch 2) An export is immutable and keeps a snapshot of the settings and files it used.
- (§5C) An AI clip is made only from the project's own photo with confirmed rights; it can fill a scene only after its check is recorded. Each clip's provider task, model and description are kept for troubleshooting.
- (§3.21) The Keep consistent list belongs to the video edit: the product first, at most 8 items, one photo each (the creator's own ready photo, never an AI clip). A one-click clip records the item photos it used and the scene whose still it sent.
- (§3.23) Every project records its studio. A story never needs a product, an affiliate link or an approved fact; the studio's own steps add those requirements.
- (§3.23–§3.24) Premise suggestions record the genre and normalized optional Story detail they were made from, so the screen can tell when either is stale. The detail is context, never a premise. Choosing a suggestion copies its title and logline, and copies its cast only while the story's cast is empty.
- (§3.23) A story's versions, video edit and caption for posting aren't claim-checked and never carry #ad. The AI label, the MP4 metadata and the clip log stay.
- (§3.23) A story's Keep consistent list puts its characters first, then props, with no product, at most 8 items; photos are optional. Every character photo needs its own likeness confirmation, recorded with the item.
- (§3.23) A Describe only AI clip is made from the description alone and exists only in a story; it records the description and no source photo.
- (§3.23) Duplicating a story copies its story and premise suggestions and needs a genre.

## Demo data

The seeded database holds the canonical demo world in [voice-content.md](../system/voice-content.md#canonical-demo-data), bound to the Google account named by the seed script's owner email. (§3.23) It includes two stories: “The Umbrella Standoff” and “Untitled story”. Credit values and file limits are demo values.
