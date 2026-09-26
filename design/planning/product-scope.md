# Product scope

**Product:** AI Creation Platform (working title), a general AI video workspace. **Studios:** Affiliate Studio (Marketing, first) and Entertainment Studio (stories, R27, 2026-09-26).
**Mode:** prompt only; no prototypes. See [CLAUDE_DESIGN_PROMPT.md](../CLAUDE_DESIGN_PROMPT.md).

## Outcome

A creator picks what they're making and leaves with an editable, exportable 9:16 video, staying in control of every line and every scene:

- **Affiliate Studio:** enters a product, approves its facts, and exports a 20–40 second affiliate video with several testable hooks, in control of every claim.
- **Entertainment Studio:** picks a genre, can give AI one small detail to expand into three complete story options, chooses a premise and cast, and exports a 30–60 second story (drama, action, comedy and more), acted by a cast or told by a narrator.

## Batches

| Batch | Scope | Status | Exit condition |
| --- | --- | --- | --- |
| 1: Script MVP | Foundation, sign-in, dashboard, product setup, fact review, strategy, Script Studio, creator brief | Built; signed-in Fidelity QA open | A creator goes from sign-in to an approved creator brief without outside tools |
| 2: Video beta | Media mapping, Voice Studio, scene editor and 9:16 preview, export with history | Built (Phases 15–20); signed-in QA open | A creator exports one 9:16 MP4 in the app |
| Later: AI video scenes | Image-to-video per scene card, compare alternatives, review of AI product depictions | Built behind `AI_CLIPS_ENABLED` (Phases 22, 24, 27); open 19 gates enabling | Generated clips improve accepted exports |
| Entertainment Studio | A studio-neutral New video entry; a Story step (genre, optional short detail → three AI premises, cast, format); story scripts; the video steps for stories; Describe only AI clips | **Approved 2026-09-26 (§3.23, R28); short-detail revision approved 2026-09-27 (§3.24, R30)**; build Phases 29–32 | A creator can seed AI with one detail and export a story video with no product in the project |
| Later: Learning loop | Variant labels, manually entered metrics, hook comparison | Planned | Creators reuse stronger angles |
| Later: More studios | Education, business and personal studios; branching episodes and a series page for stories | Planned | Each reuses the shared tools without a product |

## In scope for Batch 1

1. Google sign-in; the first sign-in creates the account, a personal workspace and a starter credit balance.
2. Projects dashboard: create, rename, duplicate, reopen, filter by stage, sort.
3. Product setup: manual entry (primary), optional import from a product link, photo and clip upload with rights confirmation.
4. Fact review: approve, reject, mark unknown, edit wording, add and remove creator facts, claim flags.
5. Strategy: audience, format, three suggested angles or the creator's own.
6. Script Studio: three or more hooks, a scene-by-scene script, caption, spoken-length check, claim check, rewrite one hook or scene, version history with restore, approval.
7. Creator brief: plain text from the approved version; copy and download.
8. Credits: estimate before every paid action, actual usage after, balance and recent usage. Failed jobs are not charged.
9. Background jobs with `queued` / `running` / `completed` / `failed`, leave-able, retryable without duplicates.

## In scope for Entertainment Studio (§3.23, approved 2026-09-26)

1. **New video** asks what the creator is making: an affiliate video or a story. Every project records its studio; existing projects are Affiliate Studio projects.
2. Story step: genre (one of eight), an optional short detail (≤ 160) that AI expands into three complete premise-and-cast suggestions, or the creator's own full premise; cast (up to 4 characters with a role and a look); format (Acted or Narrated, script language, 30 · 45 · 60 s).
3. Story scripts in Script Studio: story hooks and scene purposes; acted lines with beats and sound, or narration; versions, rewrites and approval as today; no fact claims; every story ends on a cliffhanger (R29).
4. Creator brief, Media, Voice, Edit & preview and Export for stories, reusing Batch 2: characters in Keep consistent, Describe only AI clips, no `#ad`, the AI label unchanged.
5. (§3.25, R31, approved 2026-09-27) **Episodes:** a story continues as episodes. Next episode on the latest episode (once its script is approved) makes a new story project that copies the genre, format, cast and Keep consistent items. Its Story step shows how the previous episode ended and asks what happens next (optional detail, three ideas for 1 credit, or own). Its script picks up from the cliffhanger using recaps of every earlier episode, and a Final episode ends the story instead. Each episode is still one 30–60 s video; a series holds at most 50.

## Explicitly out of scope

Automatic posting; sales attribution or commission reporting; scraping restricted pages or bypassing access controls; full AI generation of every second; AI presenters for products, face or voice cloning; a multitrack editor; any promise of guaranteed sales, compliance certification or perfect AI fidelity. For stories: a product inside a story, branching episodes, a series page or combined episode export, AI voices per character, generated character portraits, and landscape presets. None of these is shown as "coming soon".

## Scope rules

- A project must not require a product, affiliate link or approved fact to exist. Affiliate Studio adds those requirements to its own steps; Entertainment Studio has none of them.
- Shared surfaces (sign-in, dashboard, the app shell) never assume one studio or a fixed set of studios. Studio-specific copy lives in that studio's steps.
- More studios will follow (R27). Every studio is one definition in the studio registry (Product Specification §3.23, “The studio contract”); shared code reads the definition and never branches on a studio by name.
- A workflow step that isn't built yet is **hidden** in the built app. It is never shown as locked or "coming soon".
- The boilerplate's admin, super-admin, push-tester and organizations UI is discarded. The mobile app is removed.
