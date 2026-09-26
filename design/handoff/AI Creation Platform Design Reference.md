# AI Creation Platform: Design Reference

**Mode:** prompt only (no prototypes). **Scope:** Batch 1, Script MVP (§1–§10); Batch 2, Video beta (§5B, approved 2026-09-24); AI scene clips (§5C, approved 2026-09-25); and Entertainment Studio with studio-neutral shared surfaces (§5D and the story variants marked “(revised 2026-09-26, §3.23)”, approved 2026-09-26, R27, R28, R29), including the short Story detail revision (R30) and Story episodes (§3.25, R31, approved 2026-09-27). **Date:** 2026-09-24; last revised 2026-09-27.
**Companion:** [AI Creation Platform Design Handoff Plan](AI%20Creation%20Platform%20Design%20Handoff%20Plan.md), which owns sequencing, coverage and Fidelity QA.

This document owns **look and interaction**. With no prototype, it and [design/system/](../system/) are the visual and behavioral contract. Each screen section records what a prototype would have carried: surface, layout and element order, values, verbatim copy, states, route identity, control bindings and scrollers. Control action ids refer to the [interaction inventory](../planning/interaction-inventory.md); routes refer to the [navigation map](../planning/navigation-map.md).

Values are written as tokens (`--ink-2`) or type classes (`t-sm`) defined in [tokens.md](../system/tokens.md) and [typography.md](../system/typography.md). Spacing in px.

---

## 1. Identity

- **Name:** “AI Creation Platform” is the **working wordmark**, not a brand (open decision 1). Choosing a brand changes only the mark, the wordmark face and the flare tokens.
- **Mark:** a 24px square, `--r-sm` radius, `--ink` fill, with a 8px `--flare` circle centred 3px right of centre and a 2px white vertical bar to its left (a “record + playhead” glyph). On the stage the fill is `--stage-surface` with a `--stage-border` 1px border.
- **Wordmark:** Geist 15/20, weight 700, tracking −0.01em, `--ink`. Below 640px only the mark shows (the link keeps the accessible name “AI Creation Platform, go to projects”).
- **Studio label** (revised 2026-09-26, §3.23, R27): a studio is one kind of video the platform makes, never the platform itself. The rail caption names the project's studio (“Affiliate Studio” or “Entertainment Studio”), the New video dialog (§5.3) lists every built studio, and no shared surface (sign-in, the dashboard, the app shell) names a fixed set of studios. A studio that isn't built isn't listed anywhere and is never shown as “coming soon”. The working wordmark is unchanged (open decision 1).
- **Studios** (§3.23): each studio is one definition in the studio registry (Product Specification §3.23, “The studio contract”) that supplies its area, New video card (icon, title, description), subject line, rail caption, intake steps and step labels. Shared screens read the definition, so a later studio adds its own intake step without changing them. Built studios, in registry order: **Affiliate Studio** (Marketing; shopping-bag icon) and **Entertainment Studio** (Entertainment; drama icon).
- **Personality:** a confident, practical creative tool. It drafts; the creator decides. See [voice-content.md](../system/voice-content.md).

## 2. Design system summary

| Area | Decision |
| --- | --- |
| Theme | Light app, dark stage. Semantic tokens ready for a later dark theme |
| Neutrals | Canvas `#F6F5F1`, surface `#FFFFFF`, sunken `#EFEDE7`, hover `#F1EFEA`; ink `#17161C` / `#4A4852` / `#6B6874`; borders `#E2DFD6` / `#C9C5B9` |
| Accent | Flare `#FF5A36` (non-text only), flare text `#C4380F`, flare soft `#FFE9E2` |
| Status | Success `#1C7A43`, warning `#8A5300`, danger `#B42318`, info `#1F55C8`, each with a soft tint and border |
| Focus | 2px `#1D4ED8` outline at 2px offset on every focusable element |
| Type | Geist (UI), Geist Mono (numbers, timecodes, credits, brief). Scale 32 / 24 / 18 / 15 / 13 / 12 / 11 |
| Space and radius | 4-pt scale; radii 6 / 10 / 14 / pill |
| Controls | 40px (44px below 1024px); small 32px (36px); chips 32px (40px) |
| Motion | 120–280ms, `cubic-bezier(0.23, 1, 0.32, 1)`; press scale 0.97; see [motion.md](../system/motion.md) |
| Icons | Lucide, 16px in buttons and inline, 20px in menus and empty states, stroke 1.75 |
| Imagery | Real uploaded media only. No media → a flat `--surface-sunken` tile with a 20px `--ink-3` film icon. No illustrations or gradients stand in for media |
| Accessibility | WCAG 2.2 AA; see [accessibility.md](../system/accessibility.md) |

## 3. App shell (`app-shell`)

Present on every signed-in screen. `body` background `--canvas`.

### Top bar

- `header`, sticky top 0, height 60px, `--surface`, 1px bottom `--border`, z above content. Inner row: padding 0 24px (16px below 640px), items centred, gap 16px.
- **Left:** brand link (mark + wordmark, gap 8px) → `app-shell.go-home`. Then a `nav` (`aria-label="Primary"`) with one ghost link **Projects** (t-label, 32px tall, 12px padding, `--r-sm`; current: `--surface-sunken` fill, `aria-current="page"`) → `app-shell.go-projects`.
- **Right** (margin-left auto, gap 8px):
  - **Credits pill** → `app-shell.open-credits`: 32px tall, pill radius, 1px `--border-strong`, padding 0 12px, coins icon 16px `--ink-2`, balance in `t-mono` `--ink`. Accessible name “128 credits available”. Hover `--surface-hover`. While the balance loads: a 40px sunken skeleton bar.
  - **Avatar** → `app-shell.open-account`: 32px circle, `--flare-soft` fill, initials t-label 600 `--flare-text` (“MR”). Accessible name “Account menu for Mika Reyes”.

### Credits popover (`credits-popover`)

280px wide, `--surface`, 1px `--border`, `--e2`, `--r-md`, padding 16px, anchored 8px below the pill, right-aligned.

1. Title “Credits” (t-h3).
2. Balance row: “128” in Geist Mono 32/40 600 plus “credits available” (t-sm `--ink-2`), baseline aligned, gap 8px.
3. “Paid actions show their cost before you start. Failed jobs aren't charged.” (t-sm `--ink-2`), margin-top 8px.
4. Divider, then “Recent usage” (t-overline `--ink-3`) and up to 5 rows (t-sm): label left (“Write hooks & script”, second line t-caption `--ink-3` “Portable Blender, Morning Smoothie Hook · 12 min ago”), amount right in `t-mono` (“−3”; a release shows “+3” in `--success` with “Refunded: job failed”). Empty: “No usage yet.” (t-sm `--ink-3`). (Revised 2026-09-26, §3.23.) A premise suggestion job's label reads “Suggest premises”. (§3.25) For episode 2+ it reads “Suggest what happens next”.
5. Loading: three 16px skeleton rows. Error: “We couldn't load your usage.” (t-sm `--danger`).

No top-up or plan controls (open decision 9).

### Account menu (`account-menu`)

Menu 240px, same surface as the popover. Header block (not focusable): “Mika Reyes” (t-label), “mika@example.com” (t-sm `--ink-2`), “Signed in with Google” (t-caption `--ink-3`). Divider. Item **Sign out** (log-out icon 20px) → `app-shell.sign-out`; loading shows a spinner in place of the icon.

### Toasts

Bottom-centre on mobile, bottom-right (24px inset) at ≥ 640px, 88px above the bottom when a sticky footer is present. `--ink` background, white 14/20 text, `--r-md`, padding 12px 16px, `--e3`, success-tinted check icon (`#A9D8BA`) for confirmations. Auto-dismiss about 3.6s. Region `role="status"` polite. Toasts confirm; errors that need action use banners.

### Offline banner (global)

When the browser reports offline, a warning banner is inserted directly under the top bar on every screen (full width, no radius): wifi-off icon, **“You're offline.”** plus the screen-specific detail named in each screen's states.

## 4. Project workflow shell (`project-workflow`)

Wraps every `/projects/:projectId/*` step.

### Layout ≥ 1024px

CSS grid: `232px` rail + `1fr` main.

**Rail** — `nav aria-label="Project steps"`, sticky top 60px, height `calc(100dvh - 60px)`, own scroll, `--surface`, 1px right `--border`, padding 20px 16px.

1. Caption: the project's studio (t-caption `--ink-3`), “Affiliate Studio” or “Entertainment Studio” (revised 2026-09-26, §3.23; was always “Affiliate Studio”).
2. Project title (t-h3, 2-line clamp, margin-top 4px) and the studio's subject line (t-sm `--ink-2`, 1-line ellipsis): for an affiliate video the product name (“No product yet” in `--ink-3` when empty); (§3.23) for a story the genre (“Comedy”; “No genre yet” in `--ink-3` when none is chosen); (§3.25, R31) for an episode of a series with two or more episodes, the genre then “Episode 2 of 3” (“Comedy · Episode 2 of 3”; a final episode reads “Comedy · Episode 3 of 3, final”).
3. Group label “Plan” (t-overline `--ink-3`, margin 24px 0 8px), then the studio's intake steps and Script: an affiliate video 1 Product, 2 Facts, 3 Strategy, 4 Script; (§3.23) a story 1 Story, 2 Script.
4. Group label “Deliver”, then the row “Creator brief” (its circle shows a 14px file-text icon instead of a number).

(Revised 2026-09-26, §3.23.) A story's full rail, with the video beta built: **Plan** (1 Story, 2 Script), **Produce** (3 Media, 4 Voice, 5 Edit & preview), **Deliver** (Creator brief, 6 Export video). The Story row is never locked; Script is locked until the story is done or a version exists, with the reason “Finish the story first.” (accessible name “Script, locked. Finish the story first.”). Media, Voice, Edit & preview, Creator brief and Export video keep their Affiliate Studio rules and reasons (§5B step access).

**Step row:** link, 40px tall, `--r-md`, padding 0 8px, gap 12px, t-label. Circle 24px, t-caption 600:

| Status | Circle | Row | Extra |
| --- | --- | --- | --- |
| done | `--success` fill, white 14px check | `--ink` label | — |
| current | `--flare` fill, white number | `--surface-sunken` fill | `aria-current="step"` |
| open | 1px `--border-strong`, `--ink-2` number | `--ink-2` label; hover `--surface-hover` | — |
| locked | `--surface-sunken` fill, `--ink-3` number | `--ink-3` label, 14px lock icon trailing | `aria-disabled="true"`, accessible name “Strategy, locked. Review every fact first.”; tooltip with the reason on hover or focus |

**Main column:**

- **Head** (padding 28px 32px 0): breadcrumb `nav aria-label="Breadcrumb"`, t-sm: “Projects” link (`workflow.breadcrumb-projects`) / project title (`aria-current="page"`), separator a 14px chevron `--ink-3`. Row (margin-top 8px, space-between, wrap): `h1` step title (t-h1) and the **save state** (t-caption, gap 6px, 14px icon): “Saved” (check, `--success`) · “Saving…” (spinner, `--ink-3`) · “Not saved. Retrying…” (alert, `--warning`) · “Offline” (wifi-off, `--warning`); hidden on steps without autosave. Subtitle t-body `--ink-2`, max-width 640px, margin-top 4px.
- **Content:** padding 24px 32px 120px; max-width 1120px. At ≥ 1200px, screens with an aside use grid `1fr 300px` (Strategy and Product: 280px; Brief: 320px), gap 24px; the aside is sticky from top 84px.
- **Footer action bar:** sticky bottom 0, `--surface`, 1px top `--border`, padding 12px 32px, plus `env(safe-area-inset-bottom)`. Left: back link (ghost button, 16px arrow-left leading). Right (gap 12px): gating reason (t-sm `--ink-2`, `aria-live="polite"`), then the primary button.

### Layout < 1024px

- The rail is replaced by a sticky **step strip** under the top bar (top 60px, `--surface`, 1px bottom `--border`): a horizontal scroller (`workflow.steps`, see §6) of step chips (36px tall, pill, 1px `--border-strong`, gap 8px, padding 0 12px 0 6px; the circle is 20px; current chip has an `--ink` 1.5px border). Below it, “Step 2 of 5: Facts” (t-caption `--ink-3`, padding 4px 16px 8px). (Revised 2026-09-26, §3.23.) The count follows the studio: an affiliate video reads “Step n of 9” (“Step n of 5” while the video beta is off); a story reads “Step n of 7” (“Step n of 3” while the video beta is off: Story, Script, Creator brief), e.g. “Step 1 of 7: Story”. The creator brief counts as a step in the strip only, as today.
- Head padding 20px 16px 0; content padding 16px 16px 112px; footer padding 12px 16px.
- Below 640px the footer back link is hidden, the gating reason becomes the disabled button's `aria-describedby` text and is shown above the bar as a t-caption line, and the primary button fills the bar width.

### Route states (every project step)

All replace the head and content; the stepper is not shown.

- **Loading:** rail skeleton (title bar 160px, 5 step bars), head skeleton (h1 bar 200 × 28px), three 120px content blocks. `aria-busy="true"`, `aria-label="Loading project"`.
- **Not found / invalid id:** centred block, max 440px, padding-top 96px: 56px `--surface-sunken` tile with a 24px search icon `--ink-2`; `h1` “We can't find that project” (t-h2); “It may have been removed, or the link is wrong.” (t-body `--ink-2`); primary **Back to projects** (`route-not-found.back`).
- **No access** (only on an explicit `ForbiddenError`; tenant-scoped reads return Not found for another account's project, so Batch 1 never shows this): same block with a lock icon; `h1` “You don't have access to this project”; “You're signed in as mika@example.com. This project belongs to another account.”; primary **Back to my projects** (`route-no-access.back`) and secondary **Switch account** (`route-no-access.switch-account`).
- **Locked step redirect:** the destination step shows an info banner at the top of its content: **“Finish Facts first.”** “Strategy opens after you review every fact.” (the step and reason vary; see the IA step-access table). (Revised 2026-09-26, §3.23.) A story's locked Script redirects to Story. For a story's Script (settled 2026-09-26 as built): **“Finish the story first.”** “Script opens after you choose a genre and a premise, and add a character for an acted story.” A studio supplies its own banner for a step when the shared copy doesn't fit.

### Unsaved changes

When an autosave is pending or has failed, any in-app navigation opens `leave-unsaved-dialog`: title “Leave without saving?”, body “Your last change hasn't saved yet. If you leave now, it will be lost.”, buttons **Stay on page** (secondary) and **Leave anyway** (danger). Closing or reloading the tab triggers the browser's own prompt.

## 5. Screens

### 5.1 Root: `root` · `/`

No UI. Replaces itself with `/projects` (signed in) or `/sign-in` (signed out). While the session is being read, the page shows the canvas only (no spinner flash under 300ms).

### 5.2 Sign in: `sign-in` · `/sign-in?returnTo=&reason=`

Surface web · container none · presentation full-screen · guard unauthenticated.

**Layout ≥ 1024px:** grid `1.1fr 1fr`, `min-height: 100dvh`.

- **Stage panel** (left, `aria-hidden="true"` except the brand is repeated accessibly in the right panel): `--stage` background, padding 48px, flex column, space-between.
  1. Mark (stage variant) + wordmark in `--stage-ink`.
  2. Middle block, max 440px (copy revised 2026-09-26, §3.23; it names no studio): “Make short videos you can stand behind.” (t-display, `--stage-ink`); “A studio for each kind of short video, from product videos to short stories. It drafts; you decide.” (t-body `--stage-ink-2`, margin-top 12px); then an ordered list (margin-top 32px, gap 12px) of three rows, each a 24px circle (1px `--stage-border`, mono t-caption `--stage-flare`) and text in `--stage-ink` t-body: “Choose what you're making”, “Shape the script”, “Edit, preview and export”. (Was “Turn real products into short videos you can stand behind.”, “Affiliate Studio drafts hooks and scripts from facts you approve. You decide what gets said.” and “Add a product” · “Approve its facts” · “Pick a hook and approve the script”.)
  3. Bottom: a 9:16 frame 120 × 213px, `--stage-surface`, 1px `--stage-border`, `--r-lg`, containing three caption bars (8px tall, `--stage-border`, widths 70 / 50 / 60%) near its bottom and a 2px `--stage-flare` progress line at 40% width along its bottom edge. Unchanged by §3.23.
- **Sign-in panel** (right): `--canvas`, flex centre, padding 48px; inner column max 400px.

**Layout < 1024px:** panel only; the brand (mark + wordmark) sits above the title, margin-bottom 32px; padding 24px 16px, column top-aligned with padding-top 64px.

**Panel content, in order:**

1. (Below 1024px only) brand.
2. Banner slot (margin-bottom 20px), one of the state banners below.
3. `h1` “Sign in to continue” (t-h1).
4. “Use your Google account. If this is your first time, we'll set up your workspace automatically.” (t-body `--ink-2`, margin-top 8px).
5. Bot check (only when the bot check is enabled for the environment): the Cloudflare Turnstile widget, full width, margin-top 24px.
6. **Continue with Google** (`sign-in.continue-with-google`), margin-top 24px: **Google's own button** rendered by Google Identity Services — theme `outline`, size `large` (40px), shape `rectangular`, text `continue_with` (“Continue with Google”), logo left, width equal to the panel column (max 400px). Its look is Google's and is not restyled. While the credential is being exchanged, the button is covered by a `--canvas` overlay at 80% with a 16px spinner and “Signing you in…” (t-sm `--ink-2`), and it is inert.
7. Fine print (t-caption `--ink-3`, margin-top 16px): “By continuing, you acknowledge our Privacy Policy.” with “Privacy Policy” as an underlined `--flare-text` link (`sign-in.open-privacy`). No Terms link (decision 10).

**States (banner copy is verbatim):**

| State | Trigger | Banner / change |
| --- | --- | --- |
| Default | — | No banner |
| Signing in | Google returned a credential; the API call is pending | Overlay on the button (above) |
| Sign-in error | The API rejected the credential or the request failed | Danger: **“Google sign-in didn't finish.”** “Something went wrong on our side or Google's. Try again in a moment.” |
| Google unavailable | The Google script failed to load, or Google sign-in isn't configured for this environment | Warning: **“Google sign-in isn't available right now.”** “Check your connection or try again later.” The button area shows nothing else |
| Inactive account | The account is turned off | Danger: **“This account can't sign in right now.”** “Contact support if you think this is a mistake.” |
| Session expired | `reason=expired` | Warning: **“Your session ended.”** “Sign in again to go back where you were.” |
| Signed out | `reason=signed-out` | Success: **“You're signed out.”** |
| Offline | Browser offline | Warning: **“You're offline.”** “Connect to the internet to sign in.” The button is covered by the inert overlay without a spinner |

Closing the Google window or declining consent returns the visitor to this screen unchanged. Google Identity Services reports neither event, so no banner is shown for them.

**Behaviour:** on success, replace the route with a safe `returnTo` (same-origin path starting with a single `/`) or `/projects`. A signed-in visitor opening `/sign-in` is replaced the same way. Browser back from sign-in leaves the app.

### 5.3 Projects dashboard: `dashboard` · `/projects?filter=&sort=`

Surface web · container app-shell · presentation push · guard authenticated.

**Page container:** max-width 1200px, centred; padding 32px 32px 64px (24px at 640–1023, 16px below 640).

**Head** (flex, space-between, wrap, gap 16px):

- Left: `h1` “Projects” (t-h1); “Each project is one short vertical video, made in the studio that fits it.” (t-body `--ink-2`, max 560px, margin-top 4px). (Revised 2026-09-26, §3.23; was “Affiliate Studio, under Marketing. Each project turns one product into a short vertical video.”)
- Right: primary **New video** (`dashboard.create-project`) with a 16px plus icon. It opens `new-video-dialog` (below) and no longer creates a project directly, so it has no loading state (revised 2026-09-26, §3.23; was **New affiliate video**, loading “Creating…”). Below 640px it is full width under the text.

**Toolbar** (margin-top 24px, flex, space-between, gap 12px; below 640px it stacks):

- Filter chip row (`dashboard.filters` scroller, `role="radiogroup"`, `aria-label="Filter projects"`): **All** · **In progress** · **Ready to export** · **Exported**, each followed by its count in `t-mono` at 70% opacity (“All 5”). Selected chip: `--ink` fill, white text. `dashboard.filter-projects`.
- Sort (`dashboard.sort-projects`): label “Sort” (visually hidden), a 180px select, 40px: **Last edited** (default), **Name A–Z**.

**Grid** (margin-top 20px): 3 columns ≥ 1200px, 2 columns 768–1199px, 1 below; gap 16px.

**Project card** (`article`):

- `--surface`, 1px `--border`, `--r-lg`, padding 16px, flex row, gap 16px, `position: relative`. Hover (pointer devices): `--border-strong` border and `--e2`. Focus-within: `--ink-3` border plus the link's focus ring drawn around the whole card.
- **Thumbnail:** 88 × 156px (64 × 114px below 640px), `--r-md`, `object-fit: cover`, the project's first photo. No photo: the empty-media tile. Draft with no product, or (§3.23) a story with no genre: 1.5px dashed `--border-strong`, `--canvas` fill, 20px plus icon `--ink-3`.
- **Body** (flex column, gap 6px, min-width 0):
  1. Title (`h2`, t-h3, 2-line clamp) as a link whose `::after` covers the card (`dashboard.open-project`).
  2. The studio's subject line (t-sm `--ink-2`, ellipsis; revised 2026-09-26, §3.23): an affiliate video shows the product name, or “No product yet” (`--ink-3`), as before; a story shows “Story · Comedy”, or “Story · No genre yet” (`--ink-3`). (§3.25, R31) An episode of a series with two or more episodes adds a no-dot neutral badge after the subject line, “Ep 2” (the line ellipsizes before the badge does). Each episode keeps its own card, and a lone story shows no badge.
  3. Stage badge (see the stage table).
  4. Optional failure line (t-sm `--danger`, 14px alert icon): “Script writing failed. Open to retry.” or “Angle suggestions failed. Open to retry.”; (§3.23) for a story also “Premise suggestions failed. Open to retry.”
  5. Meta (t-caption `--ink-3`): “Edited 12 min ago · No exports yet”.
- **Menu button** (`dashboard.open-card-menu`): 32px ghost icon button (more-horizontal), absolute top 12px right 12px, above the stretched link (`z-index: 1`). Accessible name “More actions for Portable Blender, Morning Smoothie Hook”. Menu items: **Open** (`dashboard.menu-open-project`), **Rename…** (`dashboard.rename-project`), **Duplicate** (`dashboard.duplicate-project`; disabled for a draft with no product with the description line “Add a product first”, and (§3.23) for a story with no genre with the description line “Pick a genre first”). Duplicating a story copies its story (genre, premise, cast, format) and its premise suggestions. (§3.25, R31) Duplicating an episode makes a standalone story: the copy is Episode 1 of a new series, keeps that episode's story, cast and suggestions, and is not linked to the original series.

**Stage labels:**

| Project state | Badge |
| --- | --- |
| `draft` | neutral “Draft” |
| `facts_review` | info “Reviewing facts” |
| `script_review`, no approved version | info “Writing script” |
| `script_review`, approved version exists | success “Script approved” |
| `media_review` | info “Choosing media” |
| `generating` | neutral “Generating” |
| `ready` | success “Ready to export” |
| `exported` | success “Exported” |

Filters: **In progress** = draft, facts_review, script_review, media_review, generating; **Ready to export** = ready; **Exported** = exported.

(§3.23) The badges are unchanged for stories. A story moves from `draft` to `script_review` when its first script is written; it never enters `facts_review`. There is no studio filter (it becomes worth adding at three or more studios).

**Pagination:** 24 cards per page; when more exist, a secondary **Show more projects** button centred under the grid (`dashboard.load-more`, loading “Loading…”).

**States:**

| State | Presentation |
| --- | --- |
| Populated | As above |
| Loading | 6 skeleton cards (thumbnail block + three bars); grid `aria-busy="true"`, `aria-label="Loading projects"` |
| Empty (first run) | (Revised 2026-09-26, §3.23.) Toolbar hidden. Centred empty state, max 480px, padding-top 48px: 56px `--flare-soft` tile with a 24px clapperboard icon `--flare-text` (unchanged); `h2` “Make your first video” (t-h2); “Pick a studio, give it your product or your idea, and we'll draft hooks and a script you can edit.” (t-body `--ink-2`); an ordered list of three steps (mono numbers): “Choose a studio” · “Add your product or idea” · “Pick a hook and approve the script”; primary **New video** with a 16px plus icon (`dashboard.empty-create-project`), which opens `new-video-dialog`. (Was “Make your first affiliate video”, “Add a product, approve what's true about it, and we'll draft hooks and a script you can edit.”, “Add a product” · “Approve its facts” · “Pick a hook and approve the script” and **New affiliate video**.) |
| Filter empty | In the grid area: “No projects here yet” (t-h3) and ghost **Show all projects** (`dashboard.clear-filter`) |
| Populated with both studios (§3.23) | Affiliate and story cards share the grid, sorted together; only line 2 (the subject line) and the thumbnail rule differ |
| Story with no genre (§3.23) | Dashed plus thumbnail; “Story · No genre yet” in `--ink-3`; **Duplicate** disabled with “Pick a genre first” |
| Creating | (Revised 2026-09-26, §3.23.) The pressed card in `new-video-dialog` shows its spinner and “Creating…”; on success the route becomes the new project's first step (Product for an affiliate video, Story for a story) |
| Duplicating | The menu closes; a skeleton card with the caption “Copying…” is inserted first; on success it becomes the copy and a toast says “Duplicated. The original is unchanged.” |
| Duplicate failed | The skeleton disappears; danger toast-free banner above the grid: **“We couldn't duplicate that project.”** “Nothing changed. Try again.” |
| Load error | Danger banner: **“We couldn't load your projects.”** “Check your connection and try again.” + **Try again** (`dashboard.retry-load`) |
| Offline | Global banner detail: “Your projects will load when you reconnect.” **New video** is disabled |

**Rename dialog (`rename-project-dialog`):** 480px dialog (bottom sheet below 640px). Title “Rename project”. Field label “Project name”, value preselected, 40px input, hint “Up to 80 characters.” Errors: “Add a project name.” / “Use 80 characters or fewer.” Footer (canvas tint): **Cancel** (secondary, `rename-project.cancel`) and **Save name** (primary, `rename-project.save`, loading “Saving…”). Success: dialog closes, toast “Renamed.”, focus returns to the card menu button.

**New video dialog (`new-video-dialog`; new 2026-09-26, §3.23, R27):** opened by **New video** in the head (`dashboard.create-project`) or the empty state (`dashboard.empty-create-project`).

- **Frame:** 560px dialog (a bottom sheet below 640px) with the rename dialog's anatomy: `--r-lg`, `--e3`, the dialog backdrop; header with the title “What are you making?” and the close icon button; body; footer on the canvas tint. Focus is trapped inside while it is open.
- **Body:** one **studio card** per built studio, in registry order (today: Affiliate video, then Story), in a grid of 2 columns at ≥ 640px and 1 column below, gap 12px. A studio that isn't registered isn't listed; nothing is shown as “coming soon”. With more than 4 studios the body scrolls inside the dialog (max-height `min(560px, 70dvh)`) and the footer stays put.
- **Studio card** (the angle card anatomy, §5.7): a `button` (`new-video.create-project`, with the studio), padding 16px, `--r-lg`, 1px `--border`, `--surface`, spacing as the angle card. Hover (pointer devices): `--border-strong` border and `--e1`. Focus-visible: the focus ring. Content, in order:
  1. The studio's icon, 20px, `--ink-2` (Affiliate video: shopping-bag; Story: drama).
  2. The studio's area, t-overline `--ink-3`: “Marketing” · “Entertainment”.
  3. The New video title, t-h3: “Affiliate video” · “Story”.
  4. The description, t-sm `--ink-2`: “Turn a product into a short video that sells, from facts you approve.” · “A short drama, action or comedy scene with a cast, lines and sound.”
  Accessible name “Create a story, Entertainment Studio” (each card follows the same pattern: “Create an affiliate video, Affiliate Studio”).
- **Creating:** the pressed card shows a 16px spinner in place of its icon and “Creating…”, with `aria-busy="true"`; every card is inert until the request settles. On success the route becomes the new project's first step: Product (`product-setup`) for an affiliate video, Story (`story-setup`) for a story.
- **Failed:** a danger banner inside the dialog, above the cards (`role="alert"`): **“We couldn't create the project.”** “Nothing was created. Try again.” The cards become active again.
- **Offline:** every card is disabled, and a warning banner at the top of the body reads **“You're offline.”** “Projects can be created when you reconnect.” (New video is already disabled while offline, so this shows when the connection drops with the dialog open.)
- **Footer** (canvas tint, flex end): secondary **Cancel** (`new-video.cancel`). Cancel, the close icon and Escape close the dialog and return focus to the button that opened it.
- While the studio list loads (settled 2026-09-26 as built): one skeleton card per slot (a 20px icon block and a short bar), the grid `aria-busy="true"`. The list is requested when the dashboard loads, so it is usually ready when the dialog opens. If it fails to load, the dialog lists the studios the web app knows (the same cards), so creating still works.

### 5.4 Resume: `project-resume` · `/projects/:projectId`

No UI beyond the route loading state. Replaces itself with the current step: `draft` → Product; `facts_review` → Facts, or Strategy when every fact is reviewed; `script_review` → Script when a version exists, otherwise Strategy; approved version with no newer draft → Creator brief. Not found and no access render the route states (§4).

(Revised 2026-09-26, §3.23.) A story with no script version → Story. From Script on, a story resumes as an affiliate video does (the rules above and the §5B resume rule).

### 5.5 Product: `product-setup` · `/projects/:projectId/product`

Container app-shell > project-workflow · push · authenticated + owner. Autosave: on (head save state).

- `h1` “Product”. Subtitle: “Tell us what you're promoting. Manual entry always works; importing from a link just fills fields faster.”
- Content ≥ 1200px: main column + 280px aside.

**Card 1: Import from a product link** (`section`, card: `--surface`, 1px `--border`, `--r-lg`; header padding 20px 24px with 1px bottom `--border`; body padding 24px; below 640px 16px):

- Header: “Import from a product link” (`h2`, t-h3) + neutral badge “Optional”.
- Body: label “Product page link”; row (gap 8px; stacks below 640px): url input (placeholder “https://”) and secondary **Import** (`product-setup.import-product`; loading “Importing…”; disabled while empty or offline). Hint: “We fill empty fields only. Anything you typed stays.”
- Result banner (margin-top 16px):
  - Partial: info **“Imported 4 of 7 fields from shop.example.”** “Not found: price, features, description. Fill those in below.” Action: ghost **Clear imported values** (`product-setup.clear-imported`).
  - Complete: success **“Imported 7 of 7 fields from shop.example.”** Same action.
  - Failed: danger **“We couldn't import from that link.”** “The page didn't respond or had no product details. Enter the details below; nothing you typed changed.”
  - Not allowed: warning **“We can't import from this site.”** “Enter the details below. Manual entry always works.”
  - Invalid link: field error “Enter a full link that starts with https://”.

**Card 2: Product details:**

Field order (stack gap 24px; each label row: t-label, then “Required” or “Optional” in t-caption `--ink-3`, then the source badge when the field has a value — **Imported** info, **You entered** neutral, **Edited** warning):

1. **Product title** (Required), 40px input, max 120. Error “Add a product title.”
2. Row, two columns at ≥ 640px (gap 16px): **Category** (Optional, input, placeholder “e.g. Kitchen & Dining”) and **Price** (Optional; prefix group: 40px sunken “₱” cell joined to a numeric input; error “Enter a price in pesos, like 899.”).
3. **Description** (Optional), textarea 4 rows, max 2,000, counter bottom-right in `t-mono` t-caption.
4. **Affiliate link** (Required), url input, placeholder “https://”. Errors “Add the affiliate link.” / “Enter a full link that starts with https://”. Hint: “The link you earn commission from. It goes into your creator brief.”
5. **Key features** (Optional): hint “One per line item. Each becomes a fact you'll review next.”; a list of rows, each an input (max 160) + a 32px ghost icon button (x) “Remove feature: BPA-free cup” (`product-setup.remove-feature`); then ghost **Add a feature** with plus icon (`product-setup.add-feature`; disabled at 12 with hint “You can add up to 12 features.”).

**Card 3: Photos and clips:**

- Header “Photos and clips” + t-sm `--ink-2` “Used as scene visuals later. Stored once per project.”
- Rights checkbox (`product-setup.confirm-rights`, 18px): “I have the right to use these photos and clips” (t-label) and, under it, “Only upload media you own or have permission to use in ads.” (t-sm `--ink-2`).
- Dropzone (`product-setup.upload-assets`), margin-top 16px: 1.5px dashed `--border-strong`, `--r-lg`, `--canvas`, padding 32px, centred: 24px upload icon `--ink-2`, “Drag photos or clips here, or **browse your files**” (t-body; “browse your files” is an underlined `--flare-text` button that opens the picker), limits line (t-caption `--ink-3`): “JPG, PNG or WebP up to 10 MB · MP4 or MOV up to 100 MB and 60 seconds · up to 20 files”. Drag-over: 1.5px solid `--ink` border, `--surface` fill. **Locked** (rights unchecked): 60% opacity, lock icon instead of upload, text “Confirm your rights to upload”, `aria-disabled`.
- Tile grid (margin-top 16px): 4 columns ≥ 1024, 3 at 640–1023, 2 below; gap 12px. **Tile:** `--r-lg`, 1px `--border`, `--surface`, overflow hidden. Media 4:5 (`object-fit: cover`); clips show a duration pill bottom-left (`t-mono` t-caption, `rgba(14,14,18,.72)` fill, white text, pill). Footer padding 8px 10px: file name (t-caption 500, ellipsis) + meta (t-caption `--ink-3`: “1.2 MB”, “8 s · 14.3 MB”), and a 28px ghost menu button (`product-setup.open-asset-menu`, “More actions for blendgo-front.jpg”): **Replace** (`product-setup.replace-asset`), **Remove** (`product-setup.remove-asset`, `--danger` text).
  - Uploading: media area `--surface-sunken`; 4px progress bar (`--ink` on `--surface-sunken`) with “64%” `t-mono`; ghost **Cancel** (`product-setup.cancel-upload`).
  - Failed: 1px `--danger-border`, `--danger-soft` media area with a 20px alert icon; reason t-caption `--danger`: “Larger than 10 MB.” / “Clips can be up to 60 seconds.” / “This file type isn't supported.” / “Upload failed. Try again.”; ghost **Dismiss** (`product-setup.dismiss-upload-error`).
  - More than 20: “You can upload up to 20 files per project.” as a warning banner above the grid; extra files are not started.

**Remove dialog (`remove-asset-dialog`):** title “Remove blendgo-front.jpg?”; body “It won't be used in new scripts or videos. This can't be undone.”; **Keep file** (secondary) · **Remove file** (danger, loading “Removing…”). Success toast “Removed blendgo-front.jpg.”

**Aside (≥ 1200px): “Where values come from”** (card): three rows, each a badge and one sentence: Imported “Filled from the product link. Check it; listings aren't proof.” · You entered “Typed by you.” · Edited “Imported, then changed by you.”

**Footer:** back **Projects** (`product-setup.back-to-projects`); gating reason “Add a product title and affiliate link to continue” (only while missing); primary **Continue to facts** with trailing arrow (`product-setup.continue`, loading “Saving…”).

**States:** new draft (empty fields, rights unchecked) · imported partial · import complete · importing · import failed · import not allowed · invalid link · uploads in progress and failed tiles · rights not confirmed · missing required fields (errors shown after the first Continue attempt or on blur of a touched field) · save failed (warning banner at the top of content: **“Your last change didn't save.”** “We'll keep retrying. Don't close this tab yet.”) · offline (global banner detail “Changes will save when you reconnect.”; Continue and Import disabled) · loading · not found · no access.

### 5.6 Facts: `fact-review` · `/projects/:projectId/facts`

Container project-workflow · push · authenticated + owner + step lock.

- `h1` “Facts”. Subtitle: “Approve only what you can stand behind. Only approved facts are used to write your script.”
- Content ≥ 1200px: list + 300px aside.

**Script-exists banner** (only when a script version exists), warning: **“Your script uses these facts.”** “Changing an approved fact marks script v3 as needing review.”

**Summary card** (padding 20px 24px):

- Meter: a row of segments, one per fact, 8px tall, gap 2px, first and last segments rounded 4px. Colours: approved `--success`, rejected `--danger`, unknown `--border-strong`, unreviewed a 45° stripe of `--warning` and `--warning-soft` (6px). `role="img"`, `aria-label` “4 approved, 1 rejected, 1 unknown, 2 need review”.
- Line 1 (t-label, margin-top 12px, `aria-live="polite"`): “2 of 8 facts need review.” or “All 8 facts reviewed.”
- Line 2 (t-sm `--ink-2`): “4 approved · 1 rejected · 1 unknown”.

**Toolbar** (margin-top 20px, space-between): chip row `fact-review.filters` (`fact-review.filter-facts`): **All 8 · Needs review 2 · Approved 4 · Rejected 1 · Unknown 1**; secondary **Add a fact** with plus icon (`fact-review.add-fact`).

**Claim list** (`ul`, gap 12px, margin-top 16px). **Claim row** (`li`, card, padding 16px 20px; grid `1fr auto`, gap 16px; below 768px a single column with actions under the claim):

- Left:
  1. Claim text (15/22 500 `--ink`). Rejected: line-through, `--ink-3`.
  2. Source line (t-sm `--ink-2`, 14px icon, gap 6px): listing → link icon “From the listing ·” + the listing URL (host + path, ellipsis) as an external link (`fact-review.open-source`, 12px external icon) · creator → user icon “You entered” · edited → pencil icon “Edited from the listing” · not stated → help-circle icon “Not stated in the listing”.
  3. Optional flag (claim flag callout, margin-top 10px): e.g. **“Performance claim.”** “Speed and results claims need proof the listing doesn't show. Approve it only if you've checked it yourself.”
  4. Optional note (t-sm `--ink-3`, margin-top 6px): “Note: box says hand-wash only.”
- Right (flex, gap 8px, items centred): status badge (**Needs review** warning, **Approved** success, **Rejected** danger, **Unknown** neutral); segmented control **Approve | Reject** (32px, `fact-review.approve-fact` / `fact-review.reject-fact`; selected Approve success-filled white text, selected Reject danger-filled; hidden for Unknown); row menu 32px (`fact-review.open-fact-menu`, “More actions for Holds 380 ml”): **Edit wording** (`fact-review.edit-fact`), **Mark as unknown** (`fact-review.mark-unknown`; for an unknown fact the item reads **Add what you know** and opens the editor), **Remove** (`fact-review.remove-fact`, creator facts only, `--danger`).
- Unreviewed row: `--warning-soft` at 45% over `--surface`, and a 3px `--warning` inset bar on the left edge.
- **Editing:** the claim becomes a textarea (2 rows, max 200) with hint “Edited facts need your approval again.”, then **Cancel** (ghost small) and **Save** (primary small, loading “Saving…”). Escape cancels.

**Add a fact dialog (`add-fact-dialog`):** title “Add a fact”; field **Fact** (textarea 3 rows, max 200, placeholder “e.g. Comes with a travel lid”, error “Write the fact.”); field **Where did you confirm this?** (Optional, input max 160, placeholder “e.g. Checked the box myself”); checkbox **Approve now**; footer **Cancel** · **Add fact** (loading “Adding…”). When opened from Script Studio, Fact is prefilled with the flagged claim and the dialog subtitle reads “This line is flagged until the fact is approved.”

**Remove fact dialog (`remove-fact-dialog`):** title “Remove this fact?”; body ““BPA-free cup” will be removed from your facts. Scripts that already use it keep their text, but it won't be used for new writing. This can't be undone.”; **Keep fact** · **Remove fact** (danger).

**Aside (≥ 1200px):** card “What we flag”: list (t-sm, 14px flag icon each): “Speed and performance claims” · “Health or safety outcomes” · “Guarantees and superlatives, like ‘best’ or ‘#1’” · “Prices, discounts and stock” · “Reviews and testimonials”; closing line t-sm `--ink-3`: “These are prompts, not verdicts. The final call is yours.” Second card “Sources”: the three source lines as a legend.

**Footer:** back **Product** (`fact-review.back`); gating reason “2 facts still need review” / “Approve at least one fact”; primary **Continue to strategy** (`fact-review.continue`).

**Status changes** apply immediately (optimistic). On failure the row reverts and a danger toast-free inline line appears under the row: “That change didn't save. Try again.” (t-sm `--danger`).

**States:** needs review · editing · all reviewed · script exists · locked-redirect banner · empty (“No facts yet” t-h3; “Add key features on the Product step, or add a fact here.”; **Add a fact** `fact-review.empty-add-fact` and ghost **Go to product** `fact-review.empty-go-product`) · filter empty (“No facts match this filter.”) · load error (danger banner **“We couldn't load your facts.”** + **Try again** `fact-review.retry-load`) · offline (detail “Fact changes will be possible when you reconnect.”; segments and menu disabled) · loading (summary skeleton + 4 row skeletons) · not found · no access.

### 5.7 Strategy: `strategy` · `/projects/:projectId/strategy`

Container project-workflow · push · authenticated + owner + step lock. Autosave: on.

- `h1` “Strategy”. Subtitle: “Who is this for, and what's the angle? We use this with your approved facts to write hooks and a script.”
- Content ≥ 1200px: main + 280px aside.

**Card “Audience”** (revised 2026-09-25, R24): header row “Audience” (`h2` t-h3) and, right, the paid secondary button **Suggest audiences** with cost segment “1 credit” (after the first suggestion: **Suggest again**) (`strategy.suggest-audiences`; loading “Suggesting…”). Before suggestions: t-sm `--ink-2` “Get three audiences grounded in your approved facts, or type your own.” Suggesting: three skeleton cards; live status “Suggesting audiences…”. Suggestions: a `role="radiogroup" aria-label="Suggested audiences"` grid, 3 columns ≥ 768px, 1 below, gap 12px, above the fields; each **audience card** (`strategy.select-audience`; the angle card anatomy): buyer (t-h3), “Problem:” (t-sm 500) + text and “Wants:” + text (t-sm `--ink-2`), “Uses” + fact chips. Picking a card fills the three fields below (replacing what is there) and saves; the fields stay editable, and the card shows as selected only while all three fields still match it. Failed: danger banner **“Audience suggestions didn't finish.”** + cause + “You weren't charged.” + **Try again · 1 credit** (`strategy.retry-audiences`). Facts changed: warning **“Your approved facts changed after these audiences were suggested.”** “Suggest again to use the latest facts.” Then the fields: **Who is the buyer?** (Required, input, max 120, placeholder “e.g. Office workers who skip breakfast”, error “Add who the buyer is.”) · **What problem do they have?** (Optional, max 160, placeholder “e.g. No time to eat before the commute”) · **What do they want instead?** (Optional, max 160, placeholder “e.g. A filling breakfast they can take along”).

**Card “Format”** (each group: label t-label, then the control, margin-bottom 24px):

- **Platform** chips (`strategy.select-platform`): TikTok Shop · Shopee Video · Other. Under it, t-sm `--ink-3`: “Add the affiliate disclosure your platform requires. We'll remind you in the creator brief.”
- **Script language** chips (`strategy.select-language`): English · Filipino · Taglish.
- **Length** segmented control (`strategy.select-length`): 20 s · 30 s · 40 s (the track is content-width; it never stretches).
- **Tone** chips (`strategy.select-tone`): Friendly · Energetic · Calm · Straight-talking.
- **Content style** chips (`strategy.select-style`): Voiceover on product shots · Talking to camera · Text-only captions · Hands-on demo · Skit with live sound (revised 2026-09-25, §3.22). With **Skit with live sound** chosen, a t-sm `--ink-3` hint sits under the chips, linked with `aria-describedby`: “People act out a short scene. Viewers hear what they say and the real sound, not a narrator.” The style shapes the next script written; a version keeps the style it was written in.
- Defaults for a new project: TikTok Shop, Taglish, 30 s, Friendly, Voiceover on product shots.

**Card “Selling angle”:**

- Header row: “Selling angle” (`h2` t-h3) and, right, the paid secondary button **Suggest angles** with cost segment “1 credit” (after the first suggestion: **Suggest again**) (`strategy.suggest-angles`; loading “Suggesting…”).
- Before suggestions: t-sm `--ink-2` “Get three angles grounded in your approved facts, or write your own.”
- Suggesting: three skeleton cards; live status “Suggesting angles…”; the header button is loading.
- Grid of angle cards: 2 columns ≥ 768px, 1 below; gap 12px. **Angle card** (`role="radio"` in `role="radiogroup" aria-label="Selling angle"`, `strategy.select-angle`): card padding 16px, `--r-lg`, 1px `--border`; neutral no-dot badge with the type (“Use case”, “Feature demo”, “Problem → solution”, “Routine”, “Gift idea”); title (t-h3, margin-top 8px); pitch (t-sm `--ink-2`); “Uses” (t-caption `--ink-3`) + fact chips (no-dot neutral badges). Selected: 1.5px `--ink` border, 1px `--ink` ring, and a 20px filled `--ink` check circle top-right.
- **Write my own angle** card (`strategy.select-own-angle`): 1.5px dashed `--border-strong`, pencil icon, “Write my own angle”, “Describe it in your words.” Selected: solid ink border and a textarea **Describe your angle** (max 280, `strategy.edit-own-angle`, error “Describe your angle, or pick a suggestion.”).
- Suggestion failed: danger banner **“Angle suggestions didn't finish.”** + the cause sentence (see §7) + “You weren't charged.” + secondary **Try again** with “1 credit” segment (`strategy.retry-suggestions`).
- Facts changed: warning banner **“Your approved facts changed after these angles were suggested.”** “Suggest again to use the latest facts.”

**Aside (≥ 1200px):** card “Approved facts”: list (t-sm, 14px check icon `--success`) of every approved fact; link **Edit facts** (`strategy.go-facts`). Below 1200px this card is not shown (the stepper gives access).

**Footer:** back **Facts** (`strategy.back`); when a version exists, ghost **Open script** (`strategy.open-script`); credits line (t-sm `--ink-2`): “You have **128** credits” (number in `t-mono`); primary paid **Write hooks & script · 3 credits** — once a version exists **Write a new version · 3 credits** (`strategy.write-script`; loading “Starting…”). Gating reasons: “Add who the buyer is” · “Choose or write an angle” · “You need 3 credits. You have 2.”

**States:** (§3.22) Skit with live sound chosen (hint shown) · (R24) audiences: before suggestions · suggesting · suggested · one chosen · edited after choosing (none selected) · failed · facts changed · angle chosen · before suggestions · suggesting · suggestion failed · own angle · facts changed · missing buyer · not enough credits · save failed · offline (detail “Changes will save when you reconnect.”; paid buttons disabled) · loading · not found · no access · locked-redirect banner.

### 5.8 Script: `script-studio` · `/projects/:projectId/script?version=`

Container project-workflow · push · authenticated + owner + step lock. Autosave: on for draft versions.

- `h1` “Script”. Head right (before the save state): version badge — “v3 · Draft” (neutral), “v3 · Approved” (success), “v3 · Needs review” (warning) — and secondary small **History** with a 16px clock icon (`script-studio.open-history`). Subtitle: “Pick a hook, then shape each scene. Nothing is final until you approve a version.”
- Content ≥ 1200px: main + 300px aside. 1024–1199px: the aside cards come first as a 2-column row, then main. Below 640px aside cards stack 1-up above main.

**Story versions** (revised 2026-09-26, §3.23, R28 D7–D8, R29; Affiliate Studio versions are unchanged). A version keeps the studio it was written in (versions from before studios read as Affiliate Studio). For a story's version:

- Hook badges and scene purposes use the story labels: hooks **Cold open** · **Flash-forward** · **Question** · **Relatable moment** · **Mystery**; purposes **Hook** · **Setup** · **Build-up** · **Turn** · **Cliffhanger**. There is no Call to action scene, so there is no **CTA** field.
- **Every story ends on a cliffhanger** (R29): the last scene is always the Cliffhanger scene (an earlier one reads Turn). It lands the moment the story built to, then leaves a reveal, a twist or a question open so viewers want the next part; in an Acted story its last line is the cliffhanger. Under the last scene of a story **draft**, a t-caption `--ink-3` line: “Stories end on a cliffhanger, so viewers want the next part.” (not on read-only versions). **Rewrite scene** on the last scene keeps it a cliffhanger. The purpose reads “Cliffhanger” everywhere a story's scene is named (Script, Media, Edit & preview, the brief's `SHOT LIST` and the export details).
- **Episodes** (§3.25, R31): a **final episode's** last scene reads **Ending** instead of Cliffhanger everywhere a story's scene is named. It resolves the story and opens no new question. Under it in a draft, the caption reads “This is the final episode, so the last scene ends the story.” **Rewrite scene** on it keeps it the ending. Episode 2+'s first scene picks up the previous episode's cliffhanger; nothing new is shown for that. When the previous episode has a newer approved version than the one this episode's script was written from, a t-caption `--ink-3` note with a 14px info icon sits above the scenes of a draft: “Episode 2's script changed after this episode was written. Rewrite it to follow the new version.” Nothing is rewritten automatically, and read-only versions don't show the note.
- An **Acted** version uses the skit UI below (Lines, Sound and Cast, with the lines acted as beats per Product Specification §3.22 “Revision 2026-09-26”); a **Narrated** version uses **Narration**.
- There are no flag callouts, no “Uses” fact chips or “Uses no facts” line, no **Claim check** aside card and no **Add as a fact**: a story has no facts, and its lines aren't claim-checked.
- The Shoot plan's presenter field reads **Cast** (as in a skit), written from the story's cast (“Ana, a nurse heading home after a night shift, 20s, yellow raincoat; Ben, …”).
- In frame options read **Cast on camera** · **Hands only** · **No one in frame** (the stored values are the same three).
- The **Direction** aside card becomes **Story** (below). The job panel, approve dialog and footer use the story copy given in their sections.
- The needs-review banner never shows: a story has no facts, and a version keeps the story it was written from.

**Status banners** (top of main, one at a time, priority order):

- Approved: success **“v3 is approved.”** “Your creator brief is ready. Edits create a new version.” + secondary small **Edit as v4** (`script-studio.edit-as-new`).
- Needs review: warning **“A fact this script uses changed.”** “Check scene 2, then approve again.” Never on a story's version (§3.23).
- Viewing an older version: info **“You're viewing v2.”** “It's read-only. Restore it from History to edit it.”
- Over length: warning **“This script runs about 34 s, over your 30 s target.”** “Shorten a scene or change the length.” + ghost small **Change length** (`script-studio.change-length`). For a story, **Change length** opens the Story step, where the length lives (settled 2026-09-26 as built): every Script link back to the plan points at the studio's last intake step.

**Section “Opening hook”:** `h2` t-h3 + t-sm `--ink-2` “Pick one. Rewriting one leaves the others as they are.”; rail `script-studio.hooks` (§6), `role="radiogroup" aria-label="Opening hook"`.

- **Hook card:** width per the rail, `--r-lg`, 1px `--border`, `--surface`. Selectable area (`role="radio"`, `script-studio.select-hook`, padding 16px): type badge (neutral no-dot: “Problem first”, “Question”, “Show, don't tell”, “Relatable moment”, “Direct pitch”; (§3.23) a story's hooks: “Cold open”, “Flash-forward”, “Question”, “Relatable moment”, “Mystery”); hook text in quotes (17/24 600 −0.01em, margin-top 10px); “Opening shot:” (t-sm 500) + text (t-sm `--ink-2`). Selected: 1.5px `--ink` border, 1px ring, 20px ink check top-right. Footer (1px top `--border`, padding 8px 12px, flex gap 4px): ghost small **Edit** (`script-studio.edit-hook`) and ghost small paid **Rewrite · 1 credit** (`script-studio.rewrite-hook`). Accessible name “Hook 2 of 3: Problem first”.
- Editing a hook: the text and opening shot become a textarea (2 rows, max 160) and an input (max 200), with **Done** (ghost small).
- Rewriting: the card body becomes a 3-line skeleton; live status (t-sm `--ink-2`) “Rewriting this hook…”. Failure inside the card: t-sm `--danger` “Rewrite didn't finish. Your hook is unchanged. You weren't charged.” + ghost small **Try again** (`script-studio.retry-rewrite`).
- Below 1024px: under the rail, a row with “1 of 3” (`t-mono` t-caption) and two 36px secondary icon buttons **Previous hook** / **Next hook** (`script-studio.page-hooks`).

**Shoot plan card** (between “Opening hook” and the scenes; revised 2026-09-25, §3.17): card (`--surface`, 1px `--border`, `--r-lg`), header padding 16px 20px with “Shoot plan” (`h2` t-h3); body padding 16px 20px, two columns at ≥ 768px (gap 16px), one column below:

1. **Scenario** (t-label, `for` the field) → textarea 2 rows, min-height 64px, max 300, placeholder “The situation the whole video plays out” (`script-studio.edit-scenario`).
2. **On camera** (t-label) → input, max 160, placeholder “Nobody. Hands and product only.” (`script-studio.edit-presenter`); below it t-caption `--ink-3` “Who appears, and what they wear.” An empty value means nobody appears. (Revised 2026-09-25, §3.22.) In a skit version the label reads **Cast**, the placeholder “Ana, 20s, yellow shirt; Ben, her brother” and the caption “1 to 3 people: a first name, who they are and what they wear.”; read-only, an empty cast reads “Not named yet.” (Revised 2026-09-26, §3.23.) A story's version (Acted or Narrated) uses the Cast label too; the value is written from the story's cast.

Read-only: values as t-body; an empty scenario reads “—” and an empty On camera reads “Nobody. Hands and product only.” A version written before shot direction existed (no shoot plan and no scene direction) does not show the card when read-only; its editable newest draft shows the empty card.

**Section “Script · 5 scenes”:** `h2` t-h3 with the total “0:34 total” (`t-mono`, `--ink-2`, margin-left 8px). An ordered list (gap 12px) of **scene blocks** (`li`, card, overflow hidden):

- Header (`--canvas` tint, padding 10px 16px, flex, gap 12px, wrap): 28px square scene number tile (`--ink` fill, white `t-mono`, `--r-sm`); purpose (t-h3: “Hook”, “Problem”, “Demo”, “Feature”, “Proof”, “Call to action”; (§3.23) a story's scenes: “Hook”, “Setup”, “Build-up”, “Turn”, “Cliffhanger”, the last always Cliffhanger, R29); time range (`t-mono` `--ink-2`, “0:04–0:10”); duration field (label “Duration” visually hidden; 56px number input, 32px tall, + “s”, `script-studio.edit-duration`, range 2–15, error “Use 2 to 15 seconds.”; revised 2026-09-25, §3.20: a scene is never shorter than its narration takes to say, at the Spoken length pace, so the field grows as the narration grows and never shrinks, its minimum follows the narration, and a lower value shows “Use 9 to 15 seconds. The narration takes about 9 s to say.” (“Use 15 seconds, or shorten the narration.” at the cap) and is not saved; read-only versions show no error); right-aligned ghost small paid **Rewrite scene · 1 credit** (`script-studio.rewrite-scene`).
- Body (padding 16px, stack gap 16px):
  1. **Narration** label row: label + language tag badge (no-dot neutral “Taglish”) → auto-growing textarea (min 2 rows) (`script-studio.edit-narration`). The textarea's `lang` follows the script language (`fil` for Filipino, `en` for English and Taglish).
     **Skit versions** (revised 2026-09-25, §3.22) show **Lines** and **Sound** in place of Narration (a skit has no narrator):
     - **Lines** label row: t-label “Lines” + the language badge. Up to 3 rows (gap 8px), each a flex row (gap 8px, items centred): a 112px **who** input (max 24, placeholder “Name”, accessible name “Who says line 1”; `script-studio.edit-line-speaker`), a flexible **line** input (max 120, placeholder “What they say out loud”, accessible name “Line 1, said by Ben”, `lang` as the script, `aria-describedby` the scene's flags; `script-studio.edit-line-text`) and a 36px ghost icon button with a 16px x (`script-studio.remove-line`, “Remove line 1”). Then ghost small **Add line** with a 16px plus (`script-studio.add-line`; disabled at 3 lines) and a `t-mono` t-caption `--ink-3` counter “2 of 3”. With no rows: t-sm `--ink-3` “No one speaks yet. The scene plays its natural sound.” A new row starts empty; a row without words isn't saved and stays on screen until it has words or is removed.
     - **Sound** (t-label) → input, max 80, placeholder “e.g. Sandals slapping on the pavement” (`script-studio.edit-sound`); under it t-caption `--ink-3` “The natural sound the action makes. Record it with the scene.”
     - Lines are claim-checked like narration, and the flag callout attaches to the line inputs. The scene grows with its lines (all of them together, at the Spoken length pace): the duration error reads “Use 9 to 15 seconds. The lines take about 9 s to say.” (“Use 15 seconds, or shorten the lines.” at the cap).
     - In frame's first option reads “Cast on camera” in a skit (the value is the same). (§3.23) In a story all three read “Cast on camera” · “Hands only” · “No one in frame”.
     - Read-only: each line a t-body paragraph, “Ben: “Uy, bago 'yan ah?”” with the speaker and colon in 600 (a line without a speaker is the quote alone); a scene with no lines reads t-sm `--ink-2` “No one speaks in this scene.”; Sound as t-body, empty “—”. The read-only Shot direction line uses “Cast on camera” too.
  2. Flag callout (when flagged), attached with `aria-describedby`: **“Not an approved fact.”** “‘Blends ice in 10 seconds’ isn't one of your approved facts. Edit the line, or add it as a fact and approve it.” + link-button **Add as a fact** (`script-studio.add-flag-as-fact`). Rule-based flags use their category lead (“Performance claim.”, “Health claim.”, “Guarantee.”, “Price or stock claim.”, “Testimonial.”, “Superlative.”). Never on a story's version (§3.23).
  3. Two columns at ≥ 768px (gap 16px): **On-screen text** (input, max 60, counter) (`script-studio.edit-on-screen-text`) and **Suggested visual** (textarea 2 rows, max 200) (`script-studio.edit-visual`).
  4. **Shot direction** (revised 2026-09-25, §3.17): a `fieldset` with legend “Shot direction” (t-label, margin-bottom 6px); a 2-column grid at ≥ 768px (gap 16px), one column below. Each field has a visible t-sm `--ink-2` label above it:
     - **In frame**: select, full width, options “You on camera” · “Hands only” · “Product only” (`script-studio.set-in-frame`); (§3.23) in a story “Cast on camera” · “Hands only” · “No one in frame”. The read-only Shot direction line uses the same labels.
     - **Framing**: select, options “Close-up” · “Medium” · “Wide” · “Overhead” · “POV” (`script-studio.set-framing`).
     - **Setting**: input, max 80, placeholder “Where, and the light” (`script-studio.edit-setting`).
     - **Props**: input, max 120, placeholder “Separate with commas” (`script-studio.edit-props`).
     - **Transition in** (revised 2026-09-25, §3.19): spans both columns. Select, full width, options “Cut” · “Punch-in” · “Whip” · “Dissolve” (`script-studio.set-transition`). Under it a t-caption `--ink-3` hint for the chosen value: Cut “Goes straight to this scene.” · Punch-in “Cuts in close, then eases back.” · Whip “Slides in fast from the side. Best used once.” · Dissolve “Fades in slowly. For time passing, like before and after.” On scene 1 the select and hint are replaced by the label and a t-caption `--ink-3` line “Opens the video.”
     Select menus open below their trigger (popper) and never cover the trigger. A scene with no direction (written before shot direction existed) starts from “Product only” · “Medium” with an empty setting and props; the first edit saves all four. A scene with no transition (written before transitions existed) shows “Cut”. Transition in saves on its own, and it doesn't save the other four fields.
  5. **CTA** (input, max 80) on the Call to action scene only (`script-studio.edit-cta`). A story has no Call to action scene, so no CTA field (§3.23).
  6. “Uses” (t-caption `--ink-3`) + fact chips; or “Uses no facts” (t-caption `--ink-3`). Neither shows on a story's version (§3.23).
- Flagged scene: 1px `--warning-border` border. Rewriting: body becomes a skeleton; live status “Rewriting this scene…”; failure line “Rewrite didn't finish. Your scene is unchanged. You weren't charged.” + **Try again**.
- Read-only (approved or older versions): fields render as text (same type sizes), no inputs; Rewrite and Edit are not rendered. Shot direction renders as the label “Shot direction” (t-label), one t-body line “Close-up · Hands only · Bus stop, early morning” (empty parts left out), and “Props: Tote bag” (t-sm `--ink-2`) when there are props; a scene with no direction shows nothing. From scene 2 onward, a transition other than Cut adds a suffix to that line: “· Punch-in”, “· Whip in” or “· Dissolve in” (e.g. “Close-up · Hands only · Apartment doorway, early morning · Whip in”). Scene 1, Cut and a scene with no transition add nothing; a scene with a transition but no direction shows the transition alone on the line (“Whip in”).
- Limits on the Shoot plan and Shot direction text fields are enforced by `maxlength` as the creator types; the server enforces the same limits, and a rejected save shows the head's “Not saved. Retrying…” state like every other Script field.

**Section “Caption”:** textarea 3 rows, max 300 (`script-studio.edit-caption`), counter “124 / 300” (`t-mono` t-caption, `--danger` when over).

**Aside cards** (gap 16px):

1. **Spoken length:** (a skit counts its lines; §3.22) “≈34 s of 30 s” (Geist Mono 18/26 600; `--warning` when over by more than 2 s); a 6px meter (`--surface-sunken` track; fill `--ink`, or `--warning` when over) with a 2px `--ink-2` target marker at the target's position (scale max = target × 1.5); t-caption `--ink-3` “Estimated at about 2.5 words per second.”
2. **Claim check:** flagged: “1 line needs attention” (t-label `--warning`), then per flag a row “Scene 4 · Not an approved fact” with ghost small **Go to scene 4** (`script-studio.jump-to-flag`). Clear: 16px check `--success` + “No flagged lines.” Always ends with t-caption `--ink-3` “These checks are prompts, not a compliance review.” Not shown on a story's version (§3.23).
3. **Direction:** angle title (t-label), audience (t-sm `--ink-2`), format line “TikTok Shop · Taglish · 30 s · Friendly” (t-sm `--ink-2`; a skit adds “ · Skit”, §3.22); links **Change strategy** (`script-studio.go-strategy`) · **Edit facts** (`script-studio.go-facts`).
   **Story** (in place of Direction on a story's version; revised 2026-09-26, §3.23): title “Story”; the premise title (t-label); its logline (t-sm `--ink-2`, 3-line clamp); the format line “Comedy · Acted · Taglish · 45 s” (t-sm `--ink-2`; genre · storytelling · script language · length); link **Change story** (`script-studio.go-story`) to the Story step. An own premise has no title, so the card leaves the title line out and shows the logline alone (settled 2026-09-26 as built).

**Job panel** (replaces the hooks, scenes, caption and aside while a *write* job for this project is queued, running, or failed with no newer version): card padding 24px, max 640px.

- Status row: 20px spinner (queued: 20px clock icon `--ink-3`; failed: 20px alert `--danger`), title “Writing hooks & script” (t-h3), status badge (Queued neutral / Running info / Failed danger), meta (t-caption `--ink-3`): “Started 12 s ago · 3 credits held”.
- Progress: 4px bar (queued: 8% `--border-strong`, static; running: `--ink`, `scaleX` from the step index).
- Steps (ordered list, t-sm, 16px icons): “Reading your approved facts” · “Writing hooks and scenes” · “Checking claims” (hooks and scenes are written in one pass, so they are one step); (§3.23) for a story “Reading your story” · “Writing hooks and scenes” · “Checking the script”. Done `--success` check, current `--ink` spinner, pending `--ink-3` circle.
- Reassurance (t-sm `--ink-2`): “You can leave this page. We'll keep writing and save the result to this project.” + ghost **Back to projects** (`script-studio.job-back-to-projects`).
- Failed: the card gets a 1px `--danger-border`; body: **“Script writing didn't finish.”** + cause sentence (§7) + “Your facts, strategy and earlier versions are safe. You weren't charged.” ((§3.23) for a story: “Your story and earlier versions are safe. You weren't charged.”); actions: primary paid **Try again · 3 credits** (`script-studio.retry-job`) and secondary **Back to strategy** (`script-studio.job-back-to-strategy`). For a story the secondary action reads **Back to story** and opens the Story step (settled 2026-09-26 as built).
- Announcements: `role="status"` while queued or running; `role="alert"` when failed.
- Completion: the panel is replaced by the editor, focus moves to the “Opening hook” heading, toast “Script v1 is ready. Used 3 credits.”

**Version history drawer (`version-history-drawer`):** right side, 420px (full width below 640px), `--surface`, `--e3`. Header “Version history” + close (`version-history.close`). List, newest first; each item (padding 16px, 1px bottom `--border`): “v3” (t-h3) + status badge; meta (t-caption `--ink-3`): “Approved 23 Sep, 10:42 · Written by AI” / “Restored from v1” / “Edited from v2”; angle title (t-sm); hook excerpt in quotes (t-sm `--ink-2`, 2-line clamp). The viewed version has a 1.5px `--ink` outline and the caption “Viewing”. Actions: ghost small **View** (`version-history.view`) and secondary small **Restore as v4** (`version-history.restore`) on versions other than the newest draft. Restore → the drawer closes, toast “v2 restored as v4. Nothing was overwritten.”

**Approve dialog (`approve-version-dialog`):** title “Approve v3?”; checklist (t-sm, 16px icons, gap 8px): check “Hook picked: “Late ka na naman sa breakfast?…”” · check “5 scenes, about 34 s” (warning icon and “about 34 s, over your 30 s target” when over) · check “No flagged lines” · check “Every claim is one of your approved facts”; body “Approving locks this version. Later edits create a new version.”; footer **Keep editing** · **Approve v3** (loading “Approving…”). Success: dialog closes, the approved banner shows, toast “v3 approved.” (Revised 2026-09-26, §3.23.) For a story's version the checklist has two rows only: “Hook picked: “…”” and “5 scenes, about 44 s” (approval needs a picked hook and no running job).

**Footer:** back **Strategy** (`script-studio.back`); (§3.23) for a story the back link reads **Story** and opens the Story step (same action id); gating reason (“Fix 1 flagged line first” · “Pick a hook first” · “Wait for the rewrite to finish”; a story never shows the flag reason); primary **Approve v3** / **Approve v3 again** (needs review) (`script-studio.approve-version`). When the viewed version is approved: primary **Open creator brief** with trailing arrow (`script-studio.open-brief`).

**States:** draft (flag + over length) · (§3.23) story draft, Acted (story purposes and hooks, Lines, Sound, Cast, Story card, no claim UI or CTA) · story draft's last scene (Cliffhanger, with the cliffhanger caption; R29) · (§3.25) final episode's last scene (Ending, with the ending caption) · episode draft with stale continuity (note) · rewriting a story's last scene (stays the cliffhanger) · story draft, Narrated (Narration, Cast) · story job running (story steps) · story job failed (story copy) · story approve dialog (two rows) · story read-only (story In frame labels) · (§3.20) duration below the narration (field error, not saved) · (§3.22) skit draft (Lines, Sound, Cast) · skit scene with no lines · blank line row (on screen, not saved) · 3 lines (Add line disabled) · flagged line · duration below the lines · skit read-only · job queued · job running · job failed · just completed · rewriting a hook · rewriting a scene (its Shot direction and Transition in are replaced with the scene) · rewrite failed · ready to approve · approved (Shoot plan and Shot direction read-only) · needs review · viewing an older version · version from before shot direction (read-only: no Shoot plan card, no Shot direction; editable: empty card, fieldset starts from Product only · Medium) · version from before transitions (read-only: no suffix; editable: Transition in shows Cut) · scene 1 (“Opens the video.”) · save failed · offline (detail “Edits and rewrites will be possible when you reconnect.”; inputs and selects read-only, paid buttons and Approve disabled) · leave with unsaved edits · loading · not found · no access · locked-redirect banner.

### 5.9 Creator brief: `creator-brief` · `/projects/:projectId/brief`

Container project-workflow · push · authenticated + owner + step lock (approved version).

- `h1` “Creator brief”. Subtitle: “A plain-text brief for filming or handing off. It comes from your approved script.”
- Content ≥ 1200px: brief + 320px aside.

**Newer draft banner** (when a draft newer than the approved version exists and has a flagged line or a fact not in the approved version): warning **“v4 is a newer draft with a new claim.”** “This brief still uses approved v3.” + secondary small **Review v4** (`creator-brief.review-draft`). If the newer draft has no new claim: info **“v4 is a newer draft.”** “This brief uses approved v3 until you approve v4.”

**Brief card:** header row (padding 16px 20px, 1px bottom `--border`, wrap): “Brief for filming” (`h2` t-h3) + success badge “From v3 · Approved”; right: secondary **Copy brief** with copy icon (`creator-brief.copy`; for 2 s after success the label reads “Copied” with a check) and secondary **Download .txt** with download icon (`creator-brief.download`). Body: `pre`, Geist Mono 13/20 (12/18 below 640px), `white-space: pre-wrap`, `--canvas` background, padding 20px, max-height none. Copy failure: t-sm `--danger` “Couldn't copy. Select the text and copy it instead.”

**Brief text** (exact structure; values from the approved version):

```text
PORTABLE BLENDER, MORNING SMOOTHIE HOOK
Product: BlendGo Mini Portable Blender
Link: https://shop.example/blendgo-mini
Format: TikTok Shop · Taglish · 30 s · Friendly
Angle: Breakfast that fits in your bag
Script: v3, approved 23 Sep 2026

HOOK
"Late ka na naman sa breakfast? Ito ang kasya sa bag mo."
Opening shot: Hand pulling the blender out of a tote bag at a bus stop.

SHOOT PLAN
Scenario: An office worker running late grabs the blender on the way out, then makes a smoothie at their desk.
On camera: Office worker in their 20s, heard in voiceover; only their hands and smart-casual sleeves show.
Locations:
- Bus stop, early morning (scene 1)
- Apartment doorway, early morning (scene 2)
- Office desk, daylight (scenes 3, 4, 5)
Props:
- Tote bag
- Keys
- Shoes
- Banana
- Milk carton
- Power bank
- USB-C cable

SHOT LIST
1. Hook (0:00–0:04)
   Say: Late ka na naman sa breakfast? Ito ang kasya sa bag mo.
   Text: Breakfast, pero portable
   Shot: Hand pulling the blender out of a tote bag at a bus stop.
   Frame: Close-up · Hands only · Bus stop, early morning
   Props: Tote bag
2. Problem (0:04–0:10)
   Say: …
   Text: …
   Shot: …
   Frame: Close-up · Hands only · Apartment doorway, early morning
   Props: Keys, Shoes
   Transition: Whip
3. …
5. Call to action (0:25–0:30)
   Say: …
   Text: …
   Shot: …
   Frame: Medium · Hands only · Office desk, daylight
   Props: Tote bag
   CTA: Tap the orange cart to check today's price.

CAPTION
…

APPROVED FACTS USED
- Holds 380 ml (from the listing)
- Charges by USB-C (from the listing)
- BPA-free cup (you entered)

BEFORE YOU POST
- Add the affiliate disclosure your platform requires.
- Label AI-assisted content if your platform asks for it.
- Check the price and stock on the listing on the day you post.
These are reminders, not a compliance check. The final review is yours.
```

`SHOOT PLAN` rules (revised 2026-09-25, §3.17): locations are grouped case-insensitively, keep the first spelling, and list their scene numbers (“scene 2”, “scenes 1, 3”); each prop appears once, in first-use order; with no presenter the line reads “On camera: Nobody. Hands and product only.”; `Scenario:` is left out when empty. A scene's `Frame:` line joins framing, in frame and setting with “ · ” and leaves empty parts out; `Props:` appears only when the scene has props. A version with neither a shoot plan nor scene direction has no `SHOOT PLAN` block and no `Frame:` lines.

`Transition:` rule (revised 2026-09-25, §3.19): from scene 2 onward, a scene whose transition isn't Cut gets `Transition: Punch-in`, `Transition: Whip` or `Transition: Dissolve` as its last line before `CTA:`, after `Props:` or `Frame:`. Scene 1, Cut, and a scene with no transition (written before transitions existed) get no line, so a version with no transitions reads exactly as before.

Skit rules (revised 2026-09-25, §3.22): for a skit version, `Format:` ends “ · Skit”. In `SHOOT PLAN` the presenter line reads `Cast: …` (`Cast: Not named yet.` when empty) and is followed by the line `Record with sound on. What people say and the natural sound go into the video.` Each scene lists its lines in place of `Say:`, as `   Ben: "Uy, bago 'yan ah?"` (a line without a speaker is the quoted text alone; no line when nobody speaks), then `   Sound: …` when the scene has a cue, before `Text:`. `Frame:` reads “Cast on camera” in place of “You on camera”. A skit scene:

```text
2. Problem (0:05–0:11)
   Ben: "Uy, bago 'yan ah?"
   Ana: "Oo! Tingnan mo 'yung strap."
   Sound: sandals slapping on the pavement with each step
   Text: Bagong tsinelas check
   Shot: Ben points at Ana's feet as she walks past.
   Frame: Medium · Cast on camera · Sidewalk, noon
   Transition: Whip
```

Story rules (revised 2026-09-26, §3.23, R28 D7 and D10; built deterministically like every brief, with no AI call and no credits). A story's brief has no `Product:`, `Link:` or `Angle:` line and no `APPROVED FACTS USED` block. The header lists, after the title: `Genre: {genre} · {Acted or Narrated}`, `Premise: …`, `Format: {script language} · {length}` and the `Script:` line. (§3.25, R31) For an episode of a series with two or more episodes, `Episode: 2 of 3` follows the title (`Episode: 3 of 3, final` for a final episode), `Premise:` is that episode's premise, and a final episode's last scene is `Ending` instead of `Cliffhanger`. `SHOOT PLAN` lists the cast one character per line, as `- Name: who they are. Look.`, followed for an Acted story by the skit's live-sound note. `SHOT LIST` follows the skit rules above for an Acted story and the narrated rules (`Say:`) for a Narrated one; the last scene is always `Cliffhanger` and ends on the open question (R29); `Frame:` uses the story's In frame labels (“Cast on camera”, “Hands only”, “No one in frame”), and there is no `CTA:` line. The last block is `BEFORE YOU FILM AND POST` with the three story reminders and the closing line. The seeded story (values elided with “…” where the script supplies them):

```text
THE UMBRELLA STANDOFF
Genre: Comedy · Acted
Premise: Two strangers fight over the last umbrella at a bus stop, then find out they're neighbours.
Format: Taglish · 45 s
Script: v1, approved 26 Sep 2026

HOOK
"…"
Opening shot: …

SHOOT PLAN
Scenario: …
Cast:
- Ana: a nurse heading home after a night shift. 20s, yellow raincoat, short hair.
- Ben: a delivery rider on a break. 20s, green rider jacket, helmet under his arm.
Record with sound on. What people say and the natural sound go into the video.
Locations:
- …
Props:
- …

SHOT LIST
1. Hook (…)
   Ana: "…"
   Sound: …
   Text: …
   Shot: …
   Frame: … · Cast on camera · …
2. Setup (…)
   …
3. Build-up (…)
   …
4. Turn (…)
   …
5. Cliffhanger (…)
   Ana: "…"
   Ben: "Teka… ikaw pala ang 4B? E sino'ng nag-iiwan ng sulat sa pinto ko?"
   Sound: …
   Text: …
   Shot: …
   Frame: … · Cast on camera · …

CAPTION
…

BEFORE YOU FILM AND POST
- Get permission from everyone who appears.
- Fake fights and stunts with angles and cuts. Never film real danger.
- Label AI-generated scenes if your platform asks for it.
These are reminders, not a compliance check. The final review is yours.
```

Settled 2026-09-26 as built: `Cast:` is a label line above the list, as `Locations:` and `Props:`; `Premise:` prints a suggested premise as its title, a full stop and its logline (`Premise: The Last Umbrella. Two strangers …`) and an own premise as its text alone; a story with no characters prints one line, `Cast: Not named yet.` (Acted) or `Cast: Nobody. The narrator tells the story over the scenes.` (Narrated).

The download filename is `<project-slug>-brief-v<n>.txt` (for example `portable-blender-morning-smoothie-hook-brief-v3.txt`), UTF-8.

**Aside:** card “Before you post” with the three reminders as a list (t-sm) and the closing line in t-caption `--ink-3`. (Revised 2026-09-26, §3.23.) For a story the card title reads “Before you film and post” and lists the three `BEFORE YOU FILM AND POST` reminders.

**Footer:** back **Script** (`creator-brief.back`); primary **Back to projects** (`creator-brief.done`).

**States:** ready · (§3.23) story brief, Acted (Genre, Premise, cast lines, live-sound note, skit shot list, Before you film and post) · story brief, Narrated (cast lines, `Say:` lines, no live-sound note) · (§3.22) skit version (Cast, live-sound note, lines, Sound) · newer draft (with or without a new claim) · no approved version (step locked → redirect to Script with the banner) · offline (brief stays readable; copy and download work) · loading (header bar + 18 text-line skeletons) · not found · no access.

### 5.10 Privacy policy: `privacy-policy` · `/privacy-policy`

The boilerplate page, adapted: product name from the app name setting, the contact email from the existing privacy-contact setting, sections for Google sign-in data (name, email, Google account id), uploaded media (private, signed links), generated text (sent to the text-writing provider with the approved facts and strategy), and credit usage records. Page chrome: brand at top, max 720px reading column, t-body, headings t-h2. No app shell.

(Revised 2026-09-26, §3.23.) Generated text: “… with your approved facts and strategy, or, for a story, its genre, premise and cast.” AI clips: “the photos you choose (for a story, this can be a photo of a person who agreed to appear), a still from the scene before, and your description”. ⚠ Legal confirms both with the pending R21 wording.

### 5.11 Page not found: `not-found`

Centred block (as the route not-found state) with `h1` “Page not found”, “The link may be wrong or the page may have moved.”, primary **Back to projects** (`not-found.back`).

## 5B. Batch 2 screens (Video beta)

> **Status: approved by the product owner 2026-09-24.** Every screen below is buildable in Implementation Plan order (Phases 15–20). Decisions it rests on: R13 (light edits on mobile web), R14 (TikTok-first preset), R15 (user-uploaded music with rights confirmation), R16 (ElevenLabs voice), R17 (FFmpeg render), R18 (separate worker process). Credit costs are demo values (open decision 11).

### Batch 2 changes to shared surfaces

- **Rail and strip (§4):** a **Produce** group appears between Plan and Deliver: 5 **Media**, 6 **Voice**, 7 **Edit & preview**. Deliver becomes **Creator brief** (document glyph, no number) and 8 **Export video**. The step strip reads “Step n of 9: Name”; the creator brief counts as a step in the strip only. (Revised 2026-09-26, §3.23.) A story numbers them 3 **Media**, 4 **Voice**, 5 **Edit & preview** and 6 **Export video**, and its strip reads “Step n of 7: Name”.
- **Step access** (reasons shown in the rail tooltip and the locked-redirect banner):

  | Step | Opens when | Locked reason |
  | --- | --- | --- |
  | Media | An approved script version exists | “Approve a script first.” |
  | Voice | Every scene has media or a text card | “Choose media for every scene first.” |
  | Edit & preview | The voiceover is settled: an AI voiceover or timed recording for the version the edit uses, or No voiceover or (§3.22) Sound from your clips chosen | “Add a voiceover first.” |
  | Export video | Same as Edit & preview | “Add a voiceover first.” |

  The same rules and reasons apply to a story's video steps (§3.23).

- **Resume (§5.4):** approved version and no media chosen → Media; media incomplete → Media; voice not settled → Voice; settled and no export → Edit & preview; an export exists → Export video. Stories follow the same rule (§3.23).
- **Script footer (§5.8):** when the viewed version is approved, primary **Continue to media** with trailing arrow (`script-studio.continue-to-media`) and secondary **Open creator brief** (`script-studio.open-brief`).
- **Dashboard card (§5.3):** meta reads “Edited 12 min ago · Exported 2 h ago” once an export has been downloaded, “Edited 12 min ago · Export ready” when one is rendered but not downloaded. The thumbnail uses the latest export's poster frame when one exists, otherwise the first photo.
- **Preview frame (shared by Edit & preview and Export):** a 9:16 frame on the dark stage. Container `--stage`, `--r-lg`, padding 16px. Frame `--stage-surface`, 1px `--stage-border`, `--r-md`, overflow hidden, width 100% up to 328px. On-screen text: Geist 20/26 700, white on `rgba(14,14,18,.72)`, padding 6px 10px, `--r-sm`, centred, top edge at 14% of the frame. Captions sit with their bottom edge at 22% from the bottom, max width 86%, centred, in the chosen style (see Captions below).

### 5.12 Media: `media-mapping` · `/projects/:projectId/media`

Container project-workflow · push · authenticated + owner + step lock. Autosave: on (head save state). **Approved: 2026-09-24**

- `h1` “Media”. Subtitle: “Pick what viewers see in each scene. Use your photos and clips, or a text card.”
- Content ≥ 1200px: main + 300px aside.

**Version banner** (only when a newer approved version exists than the one this video uses): info **“v4 is approved. This video still uses v3.”** “Switch to v4 to match your latest script. Scenes keep their media where they still match.” + secondary small **Use v4** (`media-mapping.use-latest-version`, loading “Switching…”). After switching, the voiceover is marked outdated (Voice shows its banner).

**Shoot plan** (revised 2026-09-25, §3.20; hidden when the version has no shoot plan): a read-only card above “Scenes · N”, as the Script's read-only Shoot plan card (§5.8): `h2` t-h3 “Shoot plan”; Scenario (empty “—”) and On camera (empty “Nobody. Hands and product only.”); (§3.22) when no scene has narration (a skit) the label reads **Cast** and an empty cast “Not named yet.”; (§3.23) a story's version always reads **Cast**, as in Script. With a settled voiceover (AI voice or My recording), a t-sm `--ink-2` line under the heading: “Your voiceover sets these scene lengths, so they can differ from the script.”

**Keep consistent** (revised 2026-09-25, §3.21, R25; rendered only while AI scene clips are enabled, never locked or “coming soon”): a card below the Shoot plan card (in its place when there is none), above “Scenes · N”. Card `--surface`, 1px `--border`, `--r-lg`, padding 16px, stack gap 12px.

- Heading row: `h2` t-h3 “Keep consistent” + “3 of 8 have photos” (`t-mono` numbers, t-sm `--ink-2`, margin-left 8px; below 640px it wraps under the heading). Subtitle t-sm `--ink-2`: “The product and props that appear across scenes. Add a photo of each so every AI clip shows the same thing.”
- The list starts from the script: the product first (every scene), then each prop the scenes name, merged and deduplicated, in first-appearance order, each tagged with the scenes that name it. Nothing is charged and no AI runs. At most 8 items.
- Ordered list, gap 8px, of **item rows** (grid `48px 1fr auto`, gap 12px, align center; below 640px the scene chips wrap to a second line under the name):
  - **Photo slot** 48 × 60 (4:5, `--r-sm`): a button (`media-mapping.item-photo`) that opens `item-photo-sheet`. Empty: 1.5px dashed `--border-strong`, `--canvas` fill, centred 16px image-plus icon `--ink-3`, accessible name “Add a photo for Tote bag”. Filled: `object-fit: cover`, accessible name “Change the photo for Tote bag”.
  - **Name:** the product row shows the product title (t-label) + no-dot neutral badge “Product”; it can't be renamed or removed. A prop row shows an inline 36px text input (`media-mapping.rename-item`, max 60, accessible name “Name of item 2”). Errors under the input (t-caption `--danger`): empty “Name it, or remove it.” · duplicate (case-insensitive) “You already have “Tote bag”.” · over 60 “Use 60 characters or fewer.” An invalid row isn't saved.
  - **Scenes:** t-caption `--ink-3` “Scenes” + one small system chip per scene in edit order (36px, 28px at ≥ 1024px; `t-mono` number; `media-mapping.toggle-item-scene`, `aria-pressed`, accessible name “In scene 2, Problem”), on = the chip's ink fill (components-states.md). The product row's chips work the same, but its last one on is disabled so it keeps a scene.
  - **Remove** (prop rows only): 32px ghost icon button, 16px x icon (`media-mapping.remove-item`, accessible name “Remove Tote bag”). Immediate (autosave), toast “Tote bag removed. Its photo stays in your uploads.”
- Ghost small **Add an item** with a 16px plus icon (`media-mapping.add-item`): adds a row whose name input takes focus, with no scenes on. At 8 items it is disabled and the hint below reads “Up to 8 items.”
- Hint (t-caption `--ink-3`): “Objects and places only. Describe people in the shot direction.”
- Ready line (t-sm `--ink-2`, 16px sparkles icon `--ink-2`), once every item has a photo: “Ready. Start with scene 1: every clip after it follows its look.”; once the first scene in edit order holds an AI clip: “Scene 1 sets the look. Make the rest in order, so each clip follows the one before it.”
- Autosave as the rest of the page (head save state).
- **In a story** (revised 2026-09-26, §3.23, R28 D3; lifts “Objects and places only” for stories only):
  - Subtitle: “The characters and props that appear across scenes. Add a photo to keep one looking the same, or let the words describe them.”
  - The list starts from the story's cast and the script: the **characters** first, one per cast member, each tagged with the scenes where the character has a line or is named in the suggested visual (every Cast-on-camera scene when none match); then the props, as above. There is no product row. At most 8 items.
  - A character row is a prop row plus a no-dot neutral badge “Character” after the name input; it is renamed (`media-mapping.rename-item`) and removed (`media-mapping.remove-item`) like a prop. Renaming a character item doesn't change the story's cast.
  - A character's photo slot opens `item-photo-sheet` with the likeness confirmation (below). A photo is optional for every item: a character without one is described by its look in the clip description, and the still from the scene before carries the look forward.
  - Hint: “Characters and props only. Describe places in the shot direction.”
  - The counter reads as today (“2 of 6 have photos”) and gates nothing.
  - In a story the ready line shows as soon as the list has an item (settled 2026-09-26 as built), since nothing waits on photos.

**Section “Scenes · 5”:** `h2` t-h3 with the total “0:31 total” (`t-mono` `--ink-2`, margin-left 8px); right, secondary **Fill from uploads** (`media-mapping.auto-fill`, loading “Filling…”; disabled with tooltip “Upload photos or clips first” when the project has no ready uploads). Hint (t-sm `--ink-2`): “Fill from uploads places your photos and clips, in order, in empty scenes only. It's free, and you can change every pick.”

Ordered list (gap 12px) of **scene media rows** (`li`, card, padding 16px; grid `120px 1fr`, gap 16px; below 768px `96px 1fr`):

- **Media slot** (9:16, 120 × 213px; 96 × 171px below 768px; `--r-md`): a button (`media-mapping.choose-media`) that opens `media-picker-sheet`, accessible name “Choose media for scene 2, Problem”.
  - Empty: 1.5px dashed `--border-strong`, `--canvas` fill, centred 20px image-plus icon `--ink-3` and “Choose media” (t-caption `--ink-2`).
  - Photo: `object-fit: cover`. Clip: its poster frame plus the duration pill (as the Product tile). Text card: `--stage` fill with the scene's on-screen text in `--stage-ink` t-label, centred, padding 12px.
- **Body** (flex column, gap 8px, min-width 0):
  1. Header row: 28px scene number tile, purpose (t-h3), time range (`t-mono` `--ink-2`, “0:04–0:10”), duration (`t-mono` `--ink-3`, “6 s”).
  2. Narration excerpt in quotes (t-sm `--ink-2`, 2-line clamp). (Revised 2026-09-25, §3.22.) A skit scene shows its lines instead, “Ben: “Uy, bago 'yan ah?” Ana: “Oo!”” (same style and clamp), and nothing when nobody speaks; then “Sound:” (t-sm 500) + the cue (t-sm `--ink-2`) when it has one.
  3. “Suggested visual:” (t-sm 500) + text (t-sm `--ink-2`).
  4. **Shot direction** (revised 2026-09-25, §3.19): “Shot direction:” (t-sm 500) + one t-sm `--ink-2` line built like the Script's read-only line, framing · in frame · setting, with empty parts left out, then “ · Props: Tote bag” when the scene has props. Example: “Shot direction: Close-up · Hands only · Bus stop, early morning · Props: Tote bag”. A scene with no direction (written before shot direction existed) shows no line. (§3.23) A story's line uses the story In frame labels (“Cast on camera”, “Hands only”, “No one in frame”).
  5. **Punch-in hint** (revised 2026-09-25, §3.19): when the scene comes in with a Punch-in and isn't first in the video, a t-caption `--ink-3` line: “Comes in with a Punch-in. Pick a shot with some room around the product.” Other transitions show nothing here. For a story (settled 2026-09-26 as built): “Comes in with a Punch-in. Pick a shot with some room around the subject.”
  6. Controls, only when filled (flex, wrap, gap 12px, margin-top 4px):
     - Photo: **Motion** segmented control, 32px: **Still** · **Slow zoom** (`media-mapping.set-motion`; default Slow zoom).
     - Clip: **Start at** 72px number input (step 0.5, 32px tall) + “s of 8 s” (`t-mono` t-caption `--ink-3`) (`media-mapping.set-clip-start`); hint “Uses 0:02–0:08 of this clip.” Error “Start earlier. This clip is 8 s and the scene needs 6 s.” When the clip is shorter than the scene, a warning line instead (t-sm `--warning`, 14px alert icon): “This clip is 4 s, so it plays at 0.67× speed to fill the scene.” (revised 2026-09-25, §3.19; the clip is slowed, not held on its last frame) When the next scene comes in with a Whip or a Dissolve, this clip also plays under that transition, 0.25 s or 0.4 s past the scene's end. The needed length is then the scene plus that overlap: the speed in the warning above includes it, and when the clip covers the scene but not the overlap, the same warning style reads “This clip runs out during the Whip into scene 3, so it plays at 0.96× speed.” (or “the Dissolve into scene 3”). When a voiceover makes the scene longer than the clip left after Start at, it reads “This clip runs out before the scene ends, so it plays at 0.8× speed.” and the hint's range stops at the clip's end. Speeds show up to two decimals and never read 1×. Neither case blocks anything; the Start at error still compares only against the scene's own length. (Revised 2026-09-25, §3.22.) With the scene's **Clip sound** on (Edit & preview), the clip plays at normal speed with its sound and is never slowed, so the warnings give the hold instead of the speed: “This clip is 4.2 s and the scene needs 6 s. It plays at normal speed with its sound, then holds its last frame for 1.8 s.” and “This clip runs out before the scene ends. It plays at normal speed with its sound, then holds its last frame for 1.2 s.” (the Whip/Dissolve version keeps its first clause). Holds show one decimal.
     - (§3.22) A clip scene with its sound on adds a t-caption `--ink-3` line after the controls: “Sound on · 100%. Change it in Edit & preview.”
     - Ghost small **Change** (`media-mapping.change-media`) and ghost small **Clear** (`media-mapping.clear-media`).
  7. **AI clip entry** (§5C; rendered only while AI scene clips are enabled; revised 2026-09-25, §3.21): on every row, empty or filled, after the controls: secondary small paid **Generate clip** with a 16px sparkles icon and `ButtonCost` “4 credits” (`media-mapping.generate-consistent-clip`, loading “Starting…”), then ghost small **Customize** (`media-mapping.generate-clip`, opens `ai-clip-sheet`; was “Generate a clip”). **Generate clip** makes one clip as long as the scene, straight away, with no sheet: it sends the photos of the Keep consistent items on for that scene and, past the first scene, a still of the previous scene (the frame viewers see last before the cut), and its description is the scene's direction with the one-click close (§5.16 prefills). Disabled, its reason shows on a t-caption `--ink-3` line after the buttons: “Add photos for 2 items first” (“Add a photo for 1 item first”) · “Make scene 1’s clip first” (any scene but the first, until the first scene in edit order holds an AI clip) · “You need 4 credits. You have 3.” · offline “Reconnect to generate a clip”. (Revised 2026-09-26, §3.23.) In a story there is no photo reason: **Generate clip** sends the photos of the scene's items that have one plus the still from the scene before, and a scene with neither (scene 1 of a story with no photos) is made from the description alone, as Describe only (§5.16). “Make scene 1’s clip first” still applies. The first scene's row adds a t-caption `--ink-2` line under the buttons: “Sets the look for every clip after it.” While that scene has a clip job: a status line instead (t-sm `--ink-2`, 14px spinner) “Generating 2 clips…” + ghost small **View** (`media-mapping.view-clip-job`); when its clips are ready and unchecked: 16px sparkles `--ink-2` + “2 clips ready to check” + ghost small **Review** (`media-mapping.review-clips`); when it failed: 14px alert `--danger` + t-sm `--danger` “Clip generation didn't finish.” + ghost small **View** (same action).

**Media picker (`media-picker-sheet`):** right sheet 480px (bottom sheet at full height below 640px), `--surface`, `--e3`. Header: “Choose media for scene 2” (t-h2) + close (`media-picker.close`). Filter segmented control **All · Photos · Clips** (`media-picker.filter`). Grid (margin-top 16px; 3 columns, 2 below 640px; gap 12px) inside `role="radiogroup"` “Media for scene 2”: each upload as a 4:5 tile (`role="radio"`, `media-picker.select-media`) with file name and meta; a tile already used elsewhere shows the caption “In scene 4” (reuse is allowed). The last tile is always **Text card**: `--stage` fill, 20px type icon `--stage-ink-2`, “Text card”, “Your on-screen text on a dark background.” Selected: 1.5px `--ink` border, 1px ring, 20px ink check. Below the grid, secondary **Upload photos or clips** (`media-picker.upload`) runs the Product uploader in place (same rights checkbox, limits and tile states). While AI scene clips are enabled (§5C): the filter gains a fourth segment **AI clips**; AI clip tiles carry a no-dot neutral “AI clip” badge top-left, and an unchecked one the caption “Not checked yet”; a secondary **Generate a clip** with a sparkles icon (`media-picker.generate-clip`) sits beside Upload and closes the picker into `ai-clip-sheet` for the same scene. Choosing an unchecked AI clip and **Use this** opens `ai-clip-check-dialog` first. Footer (canvas tint): **Cancel** (`media-picker.cancel`) · **Use this** (primary, disabled until a tile is selected, `media-picker.confirm`). Empty: “No photos or clips yet.” (t-sm `--ink-2`) above the upload button; the Text card tile stays available.

**Item photo picker (`item-photo-sheet`, §3.21):** the `media-picker-sheet` anatomy with header “Photo for Tote bag” (t-h2) + close (`item-photo.close`); photos only (no filter, no Text card, no AI clips) inside `role="radiogroup"` “Photo for Tote bag” (`item-photo.select-photo`); a photo already on another item shows the caption “For Keys” (reuse is allowed); below the grid, secondary **Upload photos** (`item-photo.upload`) runs the Product uploader in place limited to photos (same rights checkbox, limits and tile states), and a finished upload is selected. Footer (canvas tint): **Cancel** (`item-photo.cancel`) · **Use this** (primary, disabled until a tile is selected, `item-photo.confirm`). Empty: “No photos yet.” (t-sm `--ink-2`) above the upload button.

**Likeness confirmation** (revised 2026-09-26, §3.23, R28 D3; a story's **character** items only, never props or Affiliate Studio items): a required checkbox above the footer (`item-photo.confirm-likeness`, the 18px checkbox with a two-line label): “This is me, someone who agreed to appear in AI video, or a character I have the rights to.” and under it t-caption `--ink-3` “Never a real public figure or anyone under 18.” **Use this** stays disabled until a tile is selected and the box is ticked. Each character photo needs its own confirmation: setting or changing the photo asks again, and the confirmation is recorded with the item. Header example “Photo for Ana”.

**Aside (≥ 1200px):** card “Your uploads”: “4 files · 3 used” (`t-mono` for the numbers), link **Manage on Product** (`media-mapping.go-product`), then t-sm `--ink-2`: “Check that each photo shows the product you're promoting. What viewers see counts as a claim too.” (Revised 2026-09-26, §3.23.) For a story the sentence reads “Use photos you have the rights to, and only people who agreed to appear.” A story has no Product step, so **Manage on Product** isn't rendered there (settled 2026-09-26 as built); the uploads count and the note stay.

**Footer:** back **Script** (`media-mapping.back`); gating reason “Choose media for 2 more scenes”; primary **Continue to voice** with trailing arrow (`media-mapping.continue`).

**States:** nothing chosen · partly filled · all filled · no uploads (Fill disabled; the picker shows upload + Text card) · (§3.23) story: characters first, no product row · character with a photo / without · item photo picker for a character (likeness box unticked, ticked) · Generate clip with no item photos (scene 1 made from the description) · story aside copy · (§3.22) skit scene (lines, Sound line, Cast label) · clip with its sound on (hold warning, Sound on line) · (§3.20) with a shoot plan / without (no card) · voiced-timing line · (§3.21, AI clips enabled) keep-consistent list from the script · product only (no props) · some item photos missing · every photo in, first scene without an AI clip · first scene holds an AI clip · invalid item name · at 8 items · item photo picker (empty, uploading) · one-click disabled per reason · one-click starting · clip shorter than its scene · clip runs out during the next scene's Whip or Dissolve · scene with shot direction / without (no line) · Punch-in hint · start past the end (field error) · newer approved version · switching version · uploading from the picker · save failed (warning banner as Product) · offline (detail “Changes will save when you reconnect.”; picker upload and Fill disabled) · loading (5 row skeletons with a 9:16 block) · not found · no access · locked-redirect banner.

### 5.13 Voice: `voice-studio` · `/projects/:projectId/voice`

Container project-workflow · push · authenticated + owner + step lock. Autosave: on for settings. **Approved: 2026-09-24**

- `h1` “Voice”. Subtitle: “Choose how the script is spoken. The voiceover sets the timing for scenes and captions.”
- Content ≥ 1200px: main + 300px aside.

**Card “Voiceover”:** `role="radiogroup"` “Voiceover source” (`voice-studio.select-source`) of four option cards (revised 2026-09-25, §3.22; grid 2 columns ≥ 768px, 1 below; gap 12px; each padding 16px, `--r-lg`, 1px `--border`; selected ink ring + check): **AI voice** “We read your approved script in a voice you pick.” · **My recording** “Upload narration you recorded yourself.” · **No voiceover** “Music and on-screen text only. Scenes keep the script's timing.” · **Sound from your clips** “Each clip plays its own sound: what people say and the real sound. Free.” Default: AI voice; a skit's video starts on Sound from your clips, already settled. When no scene has narration (a skit), AI voice and My recording are disabled (60% opacity, `not-allowed`), their detail reads “This skit has no narration.” (a story: “This story has no narration.”, revised 2026-09-26, §3.23), and the arrow keys skip them. (Revised 2026-09-26, §3.23.) A story's video starts on Sound from your clips when the story is Acted (it is a skit, so the rules above apply) and on AI voice when it is Narrated. Nothing else changes on this step.

**AI voice** (shown when selected):

- **Voice** list, `role="radiogroup"` “Voice” (`voice-studio.select-voice`): rows 56px, padding 0 12px, `--r-md`, 1px `--border`, gap 8px. Each: radio circle, name (t-label, “Ava”) over a descriptor (t-caption `--ink-3`, “Warm · English and Filipino”), right a 32px secondary icon button **Play sample** / **Stop sample** (`voice-studio.play-sample`, accessible name “Play sample of Ava”; spinner while loading). Selected: ink ring + check. Only one sample plays at a time. Samples are free.
- **Speed** segmented control: **0.9×** · **1.0×** · **1.1×** (`voice-studio.select-speed`; default 1.0×).
- **Pronunciation** (Optional): hint “Spell a word the way it should sound. Your script doesn't change.”; rows of two inputs, **Word** (max 40, placeholder “BlendGo”) → 14px arrow-right `--ink-3` → **Say it like** (max 60, placeholder “BLEND-go”), and a 32px ghost remove button (`voice-studio.remove-pronunciation`, “Remove pronunciation for BlendGo”); ghost **Add a word** (`voice-studio.add-pronunciation`; disabled at 20 with hint “You can add up to 20 words.”).
- Action row (margin-top 20px): paid primary **Generate voiceover** with cost segment “2 credits” (`voice-studio.generate`; loading “Starting…”). Once a voiceover exists it is secondary **Generate again** · “2 credits”.

**Voice job panel** (replaces the action row and the track while a voice job for this project is queued, running, or failed with no newer track): status row (20px spinner / clock / alert), “Generating voiceover” (t-h3), badge Queued / Running / Failed, meta “Started 8 s ago · 2 credits held”; 4px progress bar; steps “Reading your script” · “Recording each scene” · “Timing each word”; reassurance “You can leave this page. We'll save the voiceover to this project.” Failed: 1px `--danger-border`; **“Voiceover didn't finish.”** + cause (§7) + “Your script and any earlier voiceover are safe. You weren't charged.”; primary paid **Try again · 2 credits** (`voice-studio.retry-job`). Announcements as the Script job panel. Completion toast “Voiceover ready. Used 2 credits.” A new voiceover or timed recording rebuilds the captions from its words; when captions had edits, the toast reads “Voiceover ready. Captions were rebuilt, so your caption edits were replaced. Used 2 credits.”

**My recording** (shown when selected):

- Rights checkbox (`voice-studio.confirm-recording-rights`): “This is my voice, or I have permission to use it” and under it “Don't upload someone else's voice without their consent.” (t-sm `--ink-2`).
- Dropzone (Product uploader pattern, locked until rights are confirmed; `voice-studio.upload-recording`): “Drag an audio file here, or **browse your files**”; limits “MP3, M4A or WAV up to 20 MB and 90 seconds”. Upload progress and failure reasons as the Product tile (“Larger than 20 MB.” / “Recordings can be up to 90 seconds.” / “This file type isn't supported.”).
- After upload: the track row (below) plus paid primary **Time captions** · “1 credit” (`voice-studio.align-recording`) with hint “We match your recording to the script, word by word, so scenes and captions line up.” Job panel as above with title “Timing your recording” and steps “Listening to your recording” · “Matching words to the script”. Row actions ghost small **Replace** (`voice-studio.replace-recording`) and **Remove** (`voice-studio.remove-recording` → `remove-recording-dialog`: “Remove narration.m4a?” “The recording and its timing will be removed. This can't be undone.” **Keep recording** · **Remove recording**).

**No voiceover** (shown when selected): info banner **“Scenes use your script's timing (0:30 total).”** “Captions show each scene's on-screen text.”

**Sound from your clips** (shown when selected; §3.22): info banner **“Scenes use your script's timing (0:30 total).”** “4 of 5 clip scenes play their sound. Change it in Edit & preview. Captions follow what people say.” With no clip scenes: “No scene uses a clip yet, so only music plays. Captions follow what people say.” Choosing it turns every scene's Clip sound on, keeping each level. No job, no credits.

**Track row** (an AI voiceover or a timed recording): card padding 16px. **Audio player**: 40px round secondary play/pause button (`voice-studio.play-voiceover`, “Play voiceover” / “Pause voiceover”), a range scrubber (`voice-studio.seek`, `aria-label="Voiceover position"`, `aria-valuetext="0:12 of 0:31"`), time `t-mono` “0:12 / 0:31”. Meta (t-caption `--ink-3`): “Ava · 1.0× · Generated 2 min ago · reads v3” or “narration.m4a · Timed 1 min ago · reads v3”. Then a **scene timing** list (t-sm, gap 4px): “1 Hook” + `t-mono` “0:00–0:04”, one row per scene.

**Banners** (top of main, one at a time): warning **“Your script changed after this voiceover.”** “Generate again so the voice matches v4.” (blocks Continue) · info **“Voice settings changed.”** “Generate again to hear them. Your current voiceover still works.” (does not block).

**Aside (≥ 1200px):** card “What will be read”: the approved version's narration per scene (scene number tile + t-sm text), “≈31 s spoken” (`t-mono`); (§3.22) for a skit the title reads “What people say” and each row lists the scene's lines as “Ben: “Uy, bago 'yan ah?”” (“—” when nobody speaks), and the estimate counts the lines; link **Edit wording in Script** (`voice-studio.go-script`) and t-caption `--ink-3` “Changing words needs a new approved version.”

**Footer:** back **Media** (`voice-studio.back`); credits line “You have **128** credits”; gating reasons “Generate a voiceover first” · “Time your recording first” · “Generate again to match v4” · “Wait for the voiceover to finish” · “You need 2 credits. You have 1.”; primary **Continue to edit** with trailing arrow (`voice-studio.continue`).

**States:** (§3.23) Acted story (starts on Sound from your clips) · Narrated story (starts on AI voice) · (§3.22) Sound from your clips (with clip scenes / none) · skit (AI voice and My recording disabled, “What people say”) · AI voice, none yet · sample playing · generating (queued, running) · voice failed · voiceover ready · settings changed · script changed (outdated) · my recording: rights unchecked, uploading, upload failed, uploaded but untimed, timing, timing failed, timed · no voiceover · not enough credits · save failed · offline (detail “Voice changes will be possible when you reconnect.”; paid buttons, upload and samples disabled) · loading · not found · no access · locked-redirect banner.

### 5.14 Edit & preview: `scene-editor` · `/projects/:projectId/edit`

Container project-workflow · push · authenticated + owner + step lock. Autosave: on. **Approved: 2026-09-24**

- `h1` “Edit & preview”. Subtitle: “Put the scenes in order, tidy the captions and watch the whole video.”
- **Layout ≥ 1024px:** grid `minmax(300px, 360px) 1fr`, gap 24px. Left: the preview, sticky from top 84px. Right: Scenes, Captions, Music and End card sections (stack gap 24px). No aside.
- **Layout < 1024px:** the preview first (frame max height 60dvh, centred), then the sections.

**Preview player (`preview-player`):** the shared preview frame (above) composing, in edit order: each scene's photo (Slow zoom scales 100% → 108% across the scene; none under reduced motion) or clip (from its start point; muted unless its Clip sound is on, then at its level and at normal speed, holding its last frame when it runs out; §3.22) or text card; the on-screen text; captions; the end card; the voiceover and the music at its level. Controls under the frame on the stage (flex, gap 12px, margin-top 12px): 40px round play/pause in `--stage-ink` (`scene-editor.play-preview`, “Play preview” / “Pause preview”), a scrubber with a 2px tick at each scene boundary (`scene-editor.seek-preview`, `aria-valuetext="0:12 of 0:31, scene 3"`), time `t-mono` `--stage-ink-2` “0:12 / 0:31”, 32px sound toggle (`scene-editor.toggle-preview-sound`, “Mute preview” / “Unmute preview”; it mutes clip sound too). During a Whip or Dissolve the outgoing scene's sound stops at the cut, as in the export. Under it, t-caption `--stage-ink-2`: “Live preview. Text in the exported video can wrap slightly differently.” While media loads, the frame shows a 20px spinner in `--stage-ink-2`. A clip or photo that fails to load shows the empty-media tile inside the frame.

**Transitions in the preview** (revised 2026-09-25, §3.19): each scene comes in with its **Transition in** value. **Cut:** straight to the scene. **Punch-in:** a cut, then the incoming media scales from 115% to 100% over 300ms with `--ease-out`, centred, on top of any slow zoom. **Whip:** the outgoing scene slides out to the left as the incoming one slides in from the right, over 250ms with `--ease-in-out`. **Dissolve:** the two scenes crossfade over 400ms, and the outgoing clip keeps playing through the overlap. Scene 1 and the end card always cut. Scene start times don't move: the scrubber ticks, the time range on each card and the playing-card bar all change at the scene's start, and the voice and captions stay where they were. Reduced motion: Punch-in and Whip play as cuts, and Dissolve stays because it is opacity only. The preview matches the export.

**Section “Scenes · 5”** (`h2` t-h3 + “0:31 total” `t-mono` `--ink-2`): ordered list (gap 8px) of **scene cards** (`li`, card, padding 12px; grid `56px 1fr auto`, gap 12px). The scene playing in the preview has a 3px `--ink` inset bar on the left. Clicking a card's thumbnail seeks the preview to that scene (`scene-editor.seek-to-scene`).

- Thumbnail 56 × 100px (9:16, `--r-sm`) of the scene's media.
- Body: number tile (24px) + purpose (t-label) + time range (`t-mono` t-caption `--ink-2`); **On-screen text** input (max 60, 36px, counter; `scene-editor.edit-on-screen-text`); **Transition in** row (revised 2026-09-25, §3.19): t-sm `--ink-2` label “Transition in” + a 36px select, 160px wide at ≥ 640px and full width below, options “Cut” · “Punch-in” · “Whip” · “Dissolve” (`scene-editor.set-transition`), editable at every width. It autosaves, and the preview plays the new transition from the start of the scene before it. The card at position 1 shows the label with the t-caption `--ink-3` line “Opens the video.” instead of the select. After a reorder, the card now at position 1 shows that line and keeps its stored value, and the card that left position 1 gets its select back showing its stored value; **Clip sound** row (revised 2026-09-25, §3.22; clip scenes only; same row layout as Transition in): t-sm `--ink-2` label “Clip sound” + a switch (`scene-editor.toggle-clip-sound`) + a 128px range slider 0–100% step 5 (`scene-editor.set-clip-sound-level`, disabled while off, accessible name “Clip sound level for scene 2”, `aria-valuetext="80 percent"`) + the value (`t-mono` t-caption `--ink-2`, 40px, right-aligned) “80%”. On at 100% by default in a skit, off elsewhere. Below 1024px a read-only t-caption `--ink-3` line “Clip sound: on · 80%” / “Clip sound: off”. Photo and text-card scenes have no row. It autosaves and the preview plays it at once; **Adjust clip start…** shows the Media hold warning for a clip with its sound on; duration line (t-caption `--ink-3`): with a voiceover “6 s · follows the voiceover”; with No voiceover or Sound from your clips (≥ 1024px) a 56px number input 2–15 + “s” (`scene-editor.edit-duration`, error “Use 2 to 15 seconds.”).
- Right: a 32px ghost drag handle (grip-vertical, `scene-editor.reorder-scene`, “Reorder scene 2, Problem”) at ≥ 1024px, and a 32px ghost menu (`scene-editor.open-scene-menu`, “More actions for scene 2”) with **Move up** · **Move down** (`scene-editor.move-scene`; the first and last items disable) · **Change media** (`scene-editor.change-media` → `media-picker-sheet`) · **Adjust clip start…** (clips only; `scene-editor.set-clip-start`, a popover with the Media step's Start at field).
- **Reorder:** drag with a pointer (the lifted card gets `--e2` and 1.02 scale; the drop slot is a 2px `--ink` line). Keyboard on the handle: Space lifts, arrow keys move, Space drops, Escape cancels; a polite live region announces “Scene 2 moved to position 3 of 5.” (moving to position 1 adds “It now opens the video.”) Below 1024px there is no handle; the menu's Move up / Move down are the reorder controls. Each scene keeps its own voiceover segment, so reordering never needs a new voiceover.
- A flagged on-screen text gets the claim flag callout under the input and a 1px `--warning-border` card border.

**Section “Captions”:** header row: `h2` t-h3 + a switch **Show captions** (`scene-editor.toggle-captions`, default on).

- **Style** (`role="radiogroup"` “Caption style”, chips, `scene-editor.select-caption-style`): **Clean** (white text with a soft shadow) · **Boxed** (white text on a `rgba(14,14,18,.72)` box) · **Word highlight** (white text; the word being spoken turns `--stage-flare`). Default Boxed. Below 1024px: read-only line “Style: Boxed” + t-caption `--ink-3` “Edit on a larger screen.”
- Caption lines: a list (gap 8px) of rows, each a time range (`t-mono` t-caption `--ink-2`, “0:04–0:07”, 88px column) and a 2-row textarea (`scene-editor.edit-caption-line`, `lang` as the script). Hint (once, above the list): “Change wording or where a line breaks. Timing follows the voice.” Errors “Keep each caption to 2 lines.” / “Use 32 characters or fewer per line.” Flags: the claim flag callout under the row.
- Ghost small **Reset captions to the voiceover** (`scene-editor.reset-captions` → `reset-captions-dialog`: “Reset captions?” “Your caption edits will be replaced with the voiceover's words. This can't be undone.” **Keep my edits** · **Reset captions**, danger). With No voiceover the list shows one read-only row per scene with its on-screen text and no Reset. (Revised 2026-09-25, §3.22.) With Sound from your clips the list holds captions built from the spoken lines (a skit's lines, or a narrated scene's narration), each scene's time shared by word count and each line broken on its own; they are editable as above, a scene with nothing spoken shows its on-screen text, the hint reads “Change wording or where a line breaks. Timing follows the script.”, and the button reads **Reset captions to the script** with the dialog body “Your caption edits will be replaced with the script's lines. This can't be undone.”

**Section “Music”** (`h2` t-h3 + “Optional” t-caption `--ink-3`):

- Empty: rights checkbox (`scene-editor.confirm-music-rights`) “I have the right to use this music in ads” ((§3.23) for a story “I have the right to use this music in this video”) with t-sm `--ink-2` “Only upload music you own or have licensed. Platforms can mute videos with unlicensed music.”; secondary **Upload a track** (`scene-editor.upload-music`, locked until the rights box is checked); limits t-caption `--ink-3` “MP3, M4A or WAV up to 20 MB”.
- With a track: row with a 20px music icon, file name (t-label, ellipsis), duration (`t-mono` t-caption), 32px secondary play/stop (`scene-editor.play-music`), and ghost small **Remove** (`scene-editor.remove-music` → `remove-music-dialog`: “Remove morning-beat.mp3?” “The video will have no music. This can't be undone.” **Keep music** · **Remove music**). Under it **Music level** slider 0–100% step 5, default 20% (`scene-editor.set-music-level`, `aria-valuetext="20 percent"`), value `t-mono`; hint “Keep it low so the voice stays clear. Most creators use 15 to 25%. The track loops if it's shorter than the video and fades out over the last second.” Below 1024px the level is read-only: “Level 20%” + “Edit on a larger screen.”
- Uploading and failed states follow the Product tile rules.

**Section “End card”:** a switch **Show an end card** (`scene-editor.toggle-end-card`, default on) and t-sm `--ink-2` “2 s at the end with your product name and call to action.” When on, a read-only preview line (t-sm): “BlendGo Mini Portable Blender · Tap the orange cart to check today's price.”

(Revised 2026-09-26, §3.23.) **For a story:** **Show an end card** is off by default, and the text reads “2 s at the end with the story's title and your end line.” When it is on, an **End line** field follows (label “End line” + “Optional” in t-caption `--ink-3`; 40px input, max 60, placeholder “e.g. Part 2 tomorrow”; `scene-editor.edit-end-line`; autosaves; the end line isn't claim-checked), then the read-only preview line (t-sm): “The Umbrella Standoff · Part 2 tomorrow”. (§3.25, R31) The first time **Show an end card** is turned on while the End line is empty, a story that isn't a final episode prefills it with “Episode 3 next” (its episode number + 1; a lone story “Episode 2 next”). It stays editable and clearable, and it is never refilled after being cleared. A final episode's end line starts empty. The end card shows the project title and the end line in the end card's existing layout, and the preview plays the change at once.

**Banners** (top of the right column): warning **“Your voiceover reads v3, but this video now uses v4.”** “Generate a new voiceover before you export.” + secondary small **Go to voice** (`scene-editor.go-voice`).

**Footer:** back **Voice** (`scene-editor.back`); gating reasons “Fix 1 flagged line first” · “Generate a voiceover for v4 first”; primary **Continue to export** with trailing arrow (`scene-editor.continue`). (§3.23) A story has no flag callouts on on-screen text or captions and never shows the flag reason.

**States:** default · playing · reordering (pointer and keyboard) · (§3.23) story end card off (default) · story end card on, with and without an end line · (§3.25) end line prefilled “Episode N next” · final episode (no prefill) · story music rights label · story with no flag callouts · (§3.22) clip sound on / off / at 0% · Sound from your clips (editable durations, captions from the lines, Reset to the script) · first scene after a reorder (“Opens the video.”) · transitions under reduced motion (Punch-in and Whip as cuts) · video edit from before transitions (every scene Cut) · flagged on-screen text or caption · captions hidden · no voiceover (editable durations ≥ 1024px) · music: none, rights unchecked, uploading, failed, added · end card off · voiceover outdated · mobile read-only controls (style, level, durations) · save failed · offline (detail “Changes will save when you reconnect.”; uploads disabled; the preview keeps playing loaded media) · loading (stage block with a centred spinner + 5 card skeletons) · not found · no access · locked-redirect banner.

### 5.15 Export video: `export` · `/projects/:projectId/export`

Container project-workflow · push · authenticated + owner + step lock. **Approved: 2026-09-24**

- `h1` “Export video”. Subtitle: “Check the details, then render your MP4. Every export keeps the settings it used.”
- Content ≥ 1200px: main + 320px aside.

**Card “Final check”:** a list (gap 10px, t-sm, 16px icons: check `--success`, alert `--warning`, x-circle `--danger`). Rows: “Script v3, approved 23 Sep” · “Media in all 5 scenes” · “Voiceover: Ava, reads v3” (or “Your recording, reads v3”, or “No voiceover”, or (§3.22) “Sound from your clips”) · “Captions: 14 lines, none flagged” · “Music: morning-beat.mp3 at 20%, rights confirmed” (or “No music”) · “Length 0:31 with the end card”. A blocking row uses the danger icon and ends with a link: “1 flagged caption · **Fix in Edit & preview**” (`export.go-edit`), “Voiceover reads v2 · **Go to voice**” (`export.go-voice`). (Revised 2026-09-26, §3.23.) For a story the captions row reads “Captions: 14 lines” (no “none flagged”), and no row is ever a flag.

**Card “Preset”:** one row, not a choice: “TikTok” (t-label) + t-sm `--ink-2` “9:16 · 1080 × 1920 · 30 fps · MP4”.

**Card “Caption for posting”:** textarea 4 rows (`export.edit-post-caption`), prefilled from the approved version's caption, max 2,200 (TikTok's caption limit; recheck it before build, per the brief §16) with counter (`t-mono` t-caption, `--danger` when over); checkbox **Start with #ad** (`export.toggle-ad-tag`, default checked) and hint “Adds #ad to the start when you copy the caption.”; ghost **Copy caption** with copy icon (`export.copy-caption`; “Copied” for 2 s). Flags use the claim flag callout and block rendering. (Revised 2026-09-26, §3.23, R28 D7.) For a story there is no **Start with #ad** checkbox or hint, the caption is copied without `#ad`, and it isn't claim-checked.

**Render job panel** (replaces the three cards while a render for this project is queued, running, or failed with no newer export): as the Script job panel with title “Rendering your video”, steps “Preparing media” · “Mixing voice and music” · “Adding captions” · “Encoding the MP4”, meta “Started 20 s ago · 2 credits held”, reassurance “Rendering usually takes about a minute. You can leave this page.” + ghost **Back to projects** (`export.job-back-to-projects`). Failed: **“Rendering didn't finish.”** + cause (§7) + “Your edit and earlier exports are safe. You weren't charged.”; primary paid **Try again · 2 credits** (`export.retry-render`) and secondary **Back to edit** (`export.job-back-to-edit`). Completion: focus moves to the export card heading; toast “Export 2 is ready. Used 2 credits.”

**Latest export card** (`h2` “Export 2”, success badge “Ready” or neutral “Downloaded”): grid `240px 1fr` at ≥ 768px (stacked below, player max 320px wide): a native `<video controls playsinline>` on the dark stage (9:16, `--r-md`, poster frame), and a meta list (t-sm): “0:31 · 1080 × 1920 · 12.4 MB” · “Script v3 · Ava · Boxed captions · music 20%” · “Rendered 2 min ago”. Actions: primary **Download MP4** with download icon (`export.download`; file `<project-slug>-v3-export-2.mp4`), secondary **Download creator brief** (`export.download-brief`). A failed download (expired link) shows t-sm `--danger` “The download didn't start. Try again.”

**Changed since export** (info banner above the latest export card, when the edit, voiceover, music or script changed after it): **“You changed the video after Export 2.”** “Render again to include your changes. Export 2 stays available below.”

**Card “Export history”** (`export-history`): `h2` t-h3; list, newest first, each row (padding 12px 0, 1px bottom `--border`; grid `36px 1fr auto`, gap 12px): 36 × 64px poster, “Export 2” (t-label) + meta t-caption `--ink-3` “24 Sep, 14:05 · v3 · 0:31 · 12.4 MB”, ghost small **Download** (`export.history-download`) and ghost small **Details** (`export.history-details`, a disclosure, `aria-expanded`). Details list (t-sm `--ink-2`): script version; media per scene in order (“1 Hook: blendgo-in-bag.jpg, slow zoom”; revised 2026-09-25, §3.19: from scene 2 onward, a transition other than Cut adds “ · Punch-in”, “ · Whip in” or “ · Dissolve in”, as in “2 Problem: morning-rush.mp4, from 2 s · Whip in”; exports from before transitions add nothing; (§3.22) a clip scene that plays its sound adds “ · sound 80%”); voiceover (voice and speed, “Your recording”, “None”, or “Sound from your clips”); caption style or “Captions off”; music file and level, or “No music”; end card on or off; the caption for posting. Empty: “No exports yet. Your first render appears here.” (t-sm `--ink-3`).

**Aside (≥ 1200px):** card “Before you post on TikTok”: list (t-sm): “Turn on TikTok's content disclosure setting when you earn commission from the video.” · “Add TikTok's AI-generated label when your platform asks for it, for example for an AI voice.” · “Check the price and stock on the listing on the day you post.”; closing t-caption `--ink-3` “These are reminders, not a compliance check. The final review is yours.” Below 1200px the card sits after the export history. (Revised 2026-09-26, §3.23.) For a story the same card lists: “Add TikTok's AI-generated label when a scene uses an AI clip or voice.” · “Make sure everyone who appears agreed to be in the video.” · “Don't present the story as something that really happened.” and the closing line. The preset, render, history and the R21 AI label are unchanged.

**Footer:** back **Edit & preview** (`export.back`); credits line “You have **128** credits”; gating reasons “Fix 1 flagged line first” · “Generate a voiceover for v4 first” · “You need 2 credits. You have 1.” · “Wait for the render to finish”; primary: **Render video** · “2 credits” (`export.render`) before the first export or after changes (**Render again** · “2 credits”), otherwise **Download MP4** (`export.download`).

**States:** ready to render · (§3.23) story (no #ad option, story reminders, “Captions: 14 lines”) · blocked (flag, outdated voiceover, missing media) · not enough credits · rendering (queued, running) · render failed · export ready · downloaded · changed since export · history empty · history with details open · download failed · offline (detail “Rendering and downloads need a connection.”; render and download disabled; history stays readable) · loading · not found · no access · locked-redirect banner.

### Batch 2 failure copy (extends §7)

| Job | Cause | Sentence |
| --- | --- | --- |
| Voice | Timeout | “The voice service timed out after 60 seconds.” |
| Voice | Rejected | “The voice service turned the request down.” |
| Voice | Not set up | “The voice service isn't set up yet.” |
| Recording | No match | “Your recording doesn't match the script closely enough.” + “Re-record it, or edit the script to match what you said.” |
| Recording | Unreadable | “We couldn't read that audio file.” |
| Render | Missing file | “A photo, clip or track this video uses is missing.” + “Check Media and Edit & preview.” |
| Render | Too long | “Rendering took longer than 10 minutes.” |
| Any | Other | “Something went wrong on our side.” |

Every Batch 2 job failure also names what was kept and says “You weren't charged.”

### Batch 2 interaction rules (extends §8)

- **The video is pinned to one approved version.** A newer approved version never changes the video until the creator chooses **Use v4** on Media; the voiceover and every export record the version they read.
- **Voiceovers are made per scene.** Reordering scenes moves each scene's voice with it; a new voiceover replaces all scenes at once.
- **Every line the viewer reads is claim-checked:** on-screen text, captions and the caption for posting use the same checks as the script, and a flag blocks rendering. (Revised 2026-09-26, §3.23, R28 D7.) This is Affiliate Studio's rule: a story has no facts, so none of its lines are claim-checked and nothing is flagged; the AI label, the MP4 metadata and the clip log stay.
- **Rights are confirmed per upload.** Photos and clips, recordings and music each need their own confirmation, recorded with the file.
- **Exports never change after rendering.** Each keeps a snapshot of the settings it used; later edits need a new render.

## 5C. AI scene clips (Later batch)

> **Status: approved by the product owner 2026-09-25.** **Approved: 2026-09-25** Rests on R19 (MiniMax `MiniMax-H3-Max` image-to-video) and R20 (sheet from Media, 2 clips per request, photo and check required, fixed 6 s, 4 credits per clip). Hidden everywhere until it is enabled: it needs Batch 2 (`VIDEO_BETA_ENABLED`), `AI_CLIPS_ENABLED` and a configured video service, and open 19 (terms review) must be closed before it is enabled for anyone. Hidden means not rendered, never locked or “coming soon” (R11). Scene cards work fully without it. **Revised 2026-09-25 (§3.21, R25, approved):** one-click clips from Media — the Keep consistent card and the scene row’s **Generate clip** are in §5.12; this section gains the one-click description, Made from line, failed-view mapping and the revised input rule. **Revised 2026-09-26 (§3.23, R28 D2–D3, approved):** stories — the **Describe only** mode (Entertainment Studio only), the story prefill, the story check copy and Made from line, the story one-click description, and the revised input rule. Affiliate Studio's sheet is unchanged.

### 5.16 AI scene clip: `ai-scene-clips` · sheet `ai-clip-sheet` on `/projects/:projectId/media`

Container media-mapping · sheet over the page · authenticated + owner + Media step open (the host's guard). No route of its own; closing returns focus to the control that opened it. Surface: web; right sheet 560px, `--surface`, `--e3`; below 640px a full-height bottom sheet. All controls are available on mobile web (R13 does not list clip generation as desktop-only).

**Header** (padding 20px 24px, 1px bottom `--border`): “Generate a clip for scene 2” (`h2` t-h2) + close icon button (`ai-clip.close`, accessible name “Close”). Below the title t-sm `--ink-2`: “Makes clips as long as the scene from your photos. Check a clip before you use it.” (revised 2026-09-25, R23; was “Makes two 6-second clips that start from one of your photos. Check them before you use one.”)

The sheet body shows one of three views, chosen by the scene's latest clip job: **Request** (no job, or after **Change the request**), **Generating** (job queued or running, or failed), **Review** (job completed with at least one clip not yet used or discarded).

#### Request view

> **Revision R23, approved by the product owner 2026-09-25.** Adds the photo **mode**, multi-photo selection and the clip count (one by default). **Approved: 2026-09-25**

Body padding 24px, stack gap 24px:

0. **How the clip uses your photos** (t-label, id-labelled group) → a segmented control, 36px, of three options (`ai-clip.select-mode`, `role="radiogroup"`): **Start from a photo** · **Move between two** · **Match my photos**. Below 640px the three render as a vertical radio list (40px rows) instead. Default **Start from a photo**; Change the request and Try again keep the request's mode. Under it a t-sm `--ink-2` hint for the chosen mode:
   - Start from a photo: “The clip starts on your photo and moves from there.”
   - Move between two: “The clip starts on the first photo and ends on the second. The AI makes the move between them.”
   - Match my photos: “The AI keeps the product looking like these photos. It picks the opening frame itself.”
   Switching mode keeps every photo still valid for the new mode (in order), drops the rest, and replaces the description with the new mode's prefill unless the creator edited it.
   **Describe only** (revised 2026-09-26, §3.23, R28 D2; a story's sheet only, never Affiliate Studio's): the control gains a fourth option, **Describe only**, placed first and selected by default: **Describe only** · **Start from a photo** · **Move between two** · **Match my photos** (below 640px it tops the radio list). Hint: “The AI makes the clip from your description. Name who is in it and how they look.” The **Photos** group is hidden in this mode, and no photo is sent. The other three modes work as above in a story. Story wording (settled 2026-09-26 as built): sheet subtitle “Makes clips as long as the scene from your description or your photos. Check a clip before you use it.”; description hint “Describe the camera, the place and who is in the shot.”; Match my photos hint “The AI keeps people and things looking like these photos. It picks the opening frame itself.” and label “Pick 2 to 4 photos”; picker hints Start from a photo “The clip starts on this frame. Pick a clear photo of the person or place.”, Move between two “Use two photos of the same scene, for example a character before and after the moment.”, Match my photos “Different angles of the same person or thing help them stay the same.”; no photos “No photos yet. Use Describe only, or add a photo.”; the uploader's rights line “Only upload media you own or have permission to use, and only people who agreed to appear.”
1. **Photos** — the project's ready **photo** uploads (never AI clips) as 4:5 tiles in a grid, 3 columns (2 below 640px), gap 12px, with the Media picker tile anatomy (image, file name t-caption). The group label, selection and hint follow the mode:
   - **Start from a photo:** label “Start from a photo”; `role="radiogroup"`, one tile (`role="radio"`, `ai-clip.select-photo`). Selected: 1.5px `--ink` border, 1px ring, 20px ink check. Preselected: the scene's current photo when its slot holds a photo; otherwise none. Hint (t-sm `--ink-2`): “The clip starts on this frame. Pick a clear photo of the real product.”
   - **Move between two:** label “Pick the start and end photos”; a group of toggle tiles (`role="checkbox"`, `ai-clip.select-photo`), at most two, in the order picked. A picked tile shows the 1.5px `--ink` border and ring and, top-left, a 20px ink pill “Start” or “End” (t-caption, white) instead of the check; its accessible name adds “, start photo” or “, end photo”. Clicking a picked tile unpicks it; if that was Start, End becomes Start. With both picked, the other tiles are disabled and a link-button **Swap start and end** (`ai-clip.swap-photos`) appears under the grid. Preselected: the scene's current photo as Start. Hint: “Use two photos of the same product, for example the box and then the product in use.”
   - **Match my photos:** label “Pick 2 to 4 photos of the product” + counter “2 of 4” (`t-mono` t-caption `--ink-3`, right); toggle tiles (`role="checkbox"`, `ai-clip.select-photo`) with the check as in Start mode; at 4 picked, the other tiles are disabled and the hint reads “Up to 4 photos.” Preselected: the scene's current photo when it is a photo. Hint: “Different angles of the same product help it stay accurate.”
   - No photos: t-sm `--ink-2` “Add a product photo first. Clips always use your own photos.” + secondary **Upload photos** (`ai-clip.upload`), which runs the Product uploader in place limited to photos (same rights checkbox, limits and tile states); a finished upload is picked if the mode has room.
   - One photo, in Move between two or Match my photos: the grid shows it, and a t-sm `--ink-2` line “Add one more photo to use this.” + the same **Upload photos** button.
2. **Describe the motion** (t-label) → textarea 4 rows, max 500 (`ai-clip.edit-prompt`), counter “184 / 500” (`t-mono` t-caption `--ink-3`, right). Prefilled from the scene (Start from a photo): “{Framing}, {in frame}, {setting}. {Suggested visual} Slow, steady camera. Keep the product exactly as it is.” Move between two (R23): “{Framing}, {in frame}, {setting}. Starts on the first photo and ends on the second. {Suggested visual} Smooth, steady camera move. Keep the product exactly as it is.” Match my photos (R23): “{Framing}, {in frame}, {setting}. {Suggested visual} Show the product exactly as it looks in the photos. Slow, steady camera.” Start from a photo for the demo scene 1: “Close-up, hands only, bus stop, early morning. Hand pulling the blender out of a tote bag at a bus stop. Slow, steady camera. Keep the product exactly as it is.” (a scene with no direction uses its suggested visual only). (Revised 2026-09-25, §3.20.) For a shot of the creator, {in frame} is the shoot plan’s presenter (e.g. “Office worker in their 20s, heard in voiceover”) instead of “a person on camera”; hands and product-only shots are unchanged. Over 500 characters the suggested visual is shortened first, so the closing sentences stay. (Revised 2026-09-25, §3.22.) For a skit scene, every prefill and the one-click description end with “Sound: {sound}.”, then `{Speaker} says: "{line}"` for each line, then “No background music.”, e.g. “… Keep the product exactly as it is. Sound: sandals slapping on the pavement with each step. Ben says: "Uy, bago 'yan ah?" No background music.” Over 500 characters the suggested visual gives way first, then the sound; lines are never cut. Hint (t-sm `--ink-2`): “Describe the camera and the scene. Don't add features the product doesn't have.” When edited: link-button **Use the scene's direction** (`ai-clip.reset-prompt`) restores the prefill.
   (Revised 2026-09-26, §3.23.) **Story prefill** (every mode): the shot lead, which names each character in the scene with their look, “Ana (20s, yellow raincoat, short hair)”, then the suggested visual; the Mood line reads from the genre (Drama “quiet and emotional” · Action “fast and tense” · Comedy “light and comic” · Romance “warm and tender” · Horror “tense and eerie” · Mystery “hushed and curious” · Fantasy “bright and wondrous” · Slice of life “natural and everyday”); then the §3.22 sound, language and lines. There is no product close (“Keep the product exactly as it is.” and its variants are left out). The give-way order is unchanged.
   - Claim check on the description (the §5.8 rules against the approved facts), as a **warning** flag callout attached with `aria-describedby`, e.g. **“Performance claim.”** “‘blends ice’ isn't one of your approved facts. A clip that shows it makes that claim.” It does not block generating; the check dialog repeats it. A story's description has no claim check (§3.23).
3. **How many clips** (t-label; revised 2026-09-25, R23) → segmented control, 32px (`ai-clip.set-count`): **1 clip** · **2 to compare**; default **1 clip**; Change the request and Try again keep the request's count. Under it the meta row (t-caption `--ink-3`, numbers `t-mono`): “7 s each, the length of scene 2 · 9:16 · Its sound is off unless you turn on Clip sound · 4 credits per clip” (revised 2026-09-25, §3.22; for a skit scene with a sound cue or lines: “With its sound: the lines and the scene's sound”). The length is the scene's (5 to 15 s); a scene under 5 s reads “5 s each (the shortest the service makes; scene 2 plays 3 s of it)”.

**Footer** (canvas tint, padding 16px 24px, flex end, gap 8px): the gating reason (t-sm `--ink-2`) when disabled — “Pick a photo first” · (R23) “Pick the start and end photos” · “Pick at least 2 photos” · “Describe the motion first” · “You need 8 credits. You have 5.” (the server also refuses a second request for a scene whose clip job is still queued or running) — then secondary **Cancel** (`ai-clip.cancel`) and primary paid **Generate 1 clip** with `ButtonCost` “4 credits” (**Generate 2 clips** · “8 credits” with two; `ai-clip.generate`; loading “Starting…”). Starting holds 4 credits per clip and switches to the Generating view; toast none. The not-enough-credits reason uses the chosen count (“You need 4 credits. You have 3.”).

#### One-click clips (§3.21)

**Generate clip** on a Media scene row (§5.12) starts a job without opening the sheet: one clip, 4 credits, as long as the scene. It sends the photos of the Keep consistent items on for that scene (product first) and, past the first scene, a still of the previous scene in edit order (an empty or text-card scene is skipped for the nearest earlier photo or clip), all as reference photos. Its description is the scene’s direction with the one-click close: “{Framing}, {in frame}, {setting}. {Suggested visual} Keep {BlendGo Mini Portable Blender and Tote bag} exactly as they look in the reference images. The last reference image is the scene before this one: match its light and setting. Slow, steady camera.” The first scene leaves out the “last reference image” sentence. A scene no item is in sends the product’s photo. The row then shows the status lines (§5.12 item 7), and **View** / **Review** open this sheet in the Generating or Review view as for any clip job.

(Revised 2026-09-26, §3.23.) **In a story** the one-click description uses the story prefill (characters named with their looks in the shot lead, no product close), and “Keep {names} looking the same as in the reference images.” names only the items that have a photo; the continuity sentence is unchanged. It sends the photos of the scene's items that have one plus the still from the scene before; with neither (scene 1 of a story with no photos) the clip is made from the description alone, as Describe only.

#### Generating view

The §5.8 job panel anatomy inside the body (no max width):

- Status row: spinner (queued: clock `--ink-3`), title “Generating 1 clip” / “Generating 2 clips” (t-h3), badge Queued / Running, meta “Started 40 s ago · 4 credits held” (8 with two).
- 4px progress bar; steps: “Sending your photo” (“Sending your photos” when the request uses more than one; R23) · “Making the clips (usually 1 to 3 minutes)” · “Checking the files”. For a Describe only clip the first step reads “Sending your description” (settled 2026-09-26 as built).
- Reassurance (t-sm `--ink-2`): “You can close this and keep working. We'll save the clip to this project, and scene 2 shows when it's ready.” (with two: “…save both clips… when they're ready.”) Footer: primary **Close** (`ai-clip.close`).
- Completion while open: the view becomes Review, focus moves to its heading, toast “1 clip for scene 2 is ready to check. Used 4 credits.” (“2 clips … are ready … Used 8 credits.” with two). Completion while closed: the same toast with action **Review** (`ai-clip.toast-review`), and the scene row status line.
- One of two failed (a two-clip request only): Review shows the one clip, with an info line “1 clip didn't finish. You weren't charged for it.” and the toast says “Used 4 credits.”
- Failed (both): 1px `--danger-border` panel; **“Clip generation didn't finish.”** + cause sentence (table below) + “Your scene's media is unchanged. You weren't charged.”; actions primary paid **Try again · 4 credits** (8 with two; `ai-clip.retry`, same job) and secondary **Change the request** (`ai-clip.edit-request`, back to Request with the mode, photos and description kept; for a one-click clip, §3.21, Request opens in Match my photos with the first 4 item photos picked and the description kept).
- Announcements: `role="status"` while queued or running; `role="alert"` when failed.

#### Review view

Body stack gap 20px:

1. `h3` “Pick one” (t-label; “Your clip” when there is one, and that clip is preselected so the check shows at once) → `role="radiogroup" aria-label="Clips for scene 2"`, 2 columns at every width (gap 12px). Each **clip card** (`--r-lg`, 1px `--border`, `--surface`):
   - Selectable area (`role="radio"`, `ai-clip.select-clip`, accessible name “Clip A, 7 seconds” (whole seconds)): a 9:16 frame (`--stage-surface`, 1px `--stage-border`, `--r-md`, overflow hidden) showing the poster frame; below it “Clip A” (t-label) + “6 s” (`t-mono` t-caption `--ink-3`) + no-dot neutral badge “AI clip”. Selected: 1.5px `--ink` border, 1px ring, 20px ink check top-right.
   - Footer (1px top `--border`, padding 8px): 36px round secondary play/pause (`ai-clip.play-clip`, “Play clip A” / “Pause clip A”). Clips play with their own sound (revised 2026-09-25, §3.22; was muted), once, in the frame; only one plays at a time, and playing one stops any other sound on the page; they never autoplay. Reduced motion: the poster stays and play is still available on request.
2. **Check before you use it** (shown once a clip is selected; card `--canvas`, 1px `--border`, `--r-md`, padding 16px): two checkboxes (`ai-clip.confirm-accuracy`), labels t-sm:
   - “The packaging, logo, buttons and colors match my product.”
   - “It doesn't show the product doing anything my approved facts don't say.”
   then t-caption `--ink-3` “AI clips can change small details. What viewers see counts as a claim too.” When the description had a flag, its callout repeats above the checkboxes. Selecting the other clip clears both ticks.
   (Revised 2026-09-26, §3.23.) **In a story** the two checkboxes read “The characters and places look the way the story needs.” and “It doesn't show a real person who hasn't agreed to appear.”, and the caption reads “AI clips can change small details between scenes. Check faces and clothes against scene 1.” The same copy is used in `ai-clip-check-dialog`. There is no flag callout.
3. **Made from** (R23): t-caption `--ink-3` line under the cards naming the request's photos, so the check compares against them: “Made from blendgo-front.jpg” · “Made from blendgo-box.jpg → blendgo-in-bag.jpg” · “Matched to 3 photos: blendgo-front.jpg, blendgo-port.jpg, blendgo-in-bag.jpg” (file names ellipsize; the full list is the element's accessible text). A one-click clip (§3.21) past the first scene: “Matched to 2 photos and scene 4: blendgo-front.jpg, tote-bag.jpg”. When its description had a claim flag, the callout repeats above the checks. (§3.23) A Describe only clip, including a one-click story clip made with no photo or still: “Made from your description”; every other story clip as today.
4. Scene changed since the request (a newer version was switched in, or the scene was removed): info line “Scene 2 changed after you asked for these. Check they still fit.”

**Footer:** ghost danger **Discard both** (`ai-clip.discard`, opens `discard-clips-dialog`; “Discard clip” with one clip); secondary paid **Try again** + “4 credits” (8 with two; `ai-clip.regenerate`, a new job with the same mode, photos, count and description; the current clips stay until checked or discarded); primary **Use in scene 2** (`ai-clip.use`, loading “Adding…”), disabled with the reason “Pick a clip first” · “Tick both checks first” · offline. Use → the sheet closes, the scene's slot holds the clip (poster, “6 s” duration pill, “AI clip” badge top-left, **Start at** control and the §5.12 shorter-than-scene rule), toast “Clip A is in scene 2.” The other clip stays in the picker's AI clips as “Not checked yet”.

**Discard dialog (`discard-clips-dialog`):** title “Discard both clips?” (“Discard clip A?”); body “You'll need to generate again to get them back. Credits you used aren't returned.”; footer **Keep clips** · danger **Discard clips** (loading “Discarding…”). Result: the sheet closes, toast “Clips discarded.”

**Check dialog (`ai-clip-check-dialog`):** opened by **Use this** in the media picker for an unchecked AI clip. Title “Check clip A before you use it”; a 9:16 frame with the play button as above (max 240px wide); the two checkboxes and caption from the Review view; footer **Cancel** · primary **Use in scene 4** (disabled until both are ticked). A checked clip stays checked; later uses skip the dialog.

**States:** request (photo preselected) · (§3.23) story request, Describe only (default; Photos hidden) · story request, a photo mode · story prefill (characters and looks, no product close) · story review (story checks, “Made from your description”) · story one-click clip with no photos · (R23) request, two clips chosen · request, Move between two (none / start only / both picked) · request, Match my photos (1–4 picked, at the limit) · request, one photo in a two-photo mode · request, no photos · request, uploading a photo · request, description flagged · request, not enough credits · request, offline (detail “Generating and using clips will be possible when you reconnect.”; Generate and Upload disabled) · starting · queued · running · closed while running (row status line) · one clip failed · failed, per cause · review, none selected · review, selected, unchecked · review, ready · review, scene changed · adding · discard confirm · check dialog · loading (sheet body: two 9:16 skeleton blocks + 3 text lines) · not enabled (no entry points rendered) · (§3.21) review, one-click clip (Made from names the scene) · failed, one-click clip (Change the request opens Match my photos).

**AI clip failure copy** (extends the Batch 2 table):

| Cause | Sentence |
| --- | --- |
| Timeout | “The video service timed out after 10 minutes.” |
| Rejected | “The video service turned the request down.” + “Try different photos or a different description.” |
| Not set up | “The video service isn't set up yet.” |
| Unusable result | “The clips came back unusable, so we didn't keep them.” |
| Other | “Something went wrong on our side.” |

**Rules:**

- (Revised 2026-09-25, R23; revised again 2026-09-25, §3.21; revised 2026-09-26, §3.23, R28 D2.) In Affiliate Studio every clip is made from the creator's own photos with confirmed rights: one (Start from a photo), two (Move between two), two to four (Match my photos), or the Keep consistent item photos (one-click, §3.21), because product accuracy depends on it. Prompt-only generation exists only in Entertainment Studio: **Describe only**, and a one-click story clip with no photo or still. An AI clip is never picked as a photo input; a one-click clip past the first scene also sends a still of the previous scene’s media, which may be a checked AI clip.
- (Added 2026-09-26, §3.23, R28 D3.) A story's character photo is used only after its own likeness confirmation (§5.12): never a real public figure or anyone under 18.
- A clip is usable only after both checks are ticked; the check is recorded with the clip, once.
- Generated clips are stored with the project's files and kept while the project exists (as open 16). They appear only in this project's picker.
- Credits: 4 per clip; a request holds 4 per clip asked for (4 by default, 8 with two), and each clip that fails is released. Demo values (open 11). (Revised 2026-09-25, R23: one clip by default, two to compare.)
- (Added 2026-09-25, §3.22.) The service makes each clip's sound with its picture. That sound plays in the video only when the scene's Clip sound is on (on by default in a skit, §5.14); in a skit it can speak the approved script's lines, under the “AI-generated” pill below (R26).
- (Added 2026-09-25, R21.) A scene that uses an AI clip shows an “AI-generated” pill (top-left, white on 45 % black) for its whole duration, in the Edit & preview player and in the export. Scenes with uploaded media never show it.

## 5D. Entertainment Studio (approved 2026-09-26; Story detail revised 2026-09-27)

> **Status: approved by the product owner 2026-09-26** (Product Specification §3.23; R27 for the platform change, R28 for decisions D1–D10, approved as recommended, and R29: every story ends on a cliffhanger). **Story detail revision approved 2026-09-27** (Product Specification §3.24, R30): one optional short detail guides the existing three-option premise job. Build in Implementation Plan Phases 29–32; the AI clip parts stay behind `AI_CLIPS_ENABLED` as §5C. Entertainment Studio is the second studio on the studio registry (§1), not the last. A story has no product, affiliate link, facts or `#ad` (D10); a video that sells a product stays in Affiliate Studio's Skit style. **Story episodes approved 2026-09-27** (Product Specification §3.25, R31, E1–E10 as recommended): a story continues as episodes, each its own project and video, linked into a series; build in Implementation Plan Phase 33. Out of scope and not shown anywhere (never “coming soon”): branching storylines, reordering episodes, a series page or grouped dashboard card, a combined export of several episodes, AI voices per character, generated character looks (D4), generated music, landscape presets (R14), a studio filter on the dashboard, and any other studio in this batch.

### Entertainment Studio changes to shared surfaces

Specified in place and marked “(revised 2026-09-26, §3.23)”:

- §1 the studio label rule and the registry · §3 the credits popover's “Suggest premises” label · §4 the rail caption and subject line, the story step groups, “Step n of 7” and the locked Script reason · §5.2 the sign-in stage copy · §5.3 the dashboard head, **New video** and `new-video-dialog`, the empty state, the card's subject line, the no-genre thumbnail and the Duplicate rule · §5.4 resume · §5.10 the privacy wording.
- Story variants of the later steps: §5.8 Script, §5.9 Creator brief, §5.12 Media, §5.13 Voice, §5.14 Edit & preview, §5.15 Export video and §5.16 the AI clip sheet.
- **Cliffhanger ending** (R29, product owner 2026-09-26): every story's last scene is the Cliffhanger scene and ends on a reveal, a twist or a question left open. It shows in the Script (purpose label and the last-scene caption, §5.8), the brief (§5.9), the premise loglines (§5.17), and wherever a story's scene purpose is named (Media, Edit & preview, export details). (Revised 2026-09-27, §3.25, R31.) The cliffhanger leads into the next episode. Every episode ends on one except an episode the creator marks **Final episode**, whose last scene reads **Ending**.
- **Episodes** (§3.25, R31, approved 2026-09-27): each episode is its own story project with every step and one exported video. Episodes are linked in a series, in order and with no branches. **Next episode** on the latest episode's Story step (once its script is approved) creates the next one and copies the genre, format, cast and the Keep consistent characters and props with their photos and likeness confirmations. Episode 2+'s Story step shows how the previous episode ended and asks what happens next. Its script picks up from the cliffhanger with the series premise, a recap of every earlier episode and the previous episode in full. Specified in place: §4 rail subject line · §5.3 card badge and the Duplicate rule · §5.8 Ending label and stale-continuity note · §5.9 `Episode:` header · §5.14 end line prefill · §5.17 Episodes, Previously, What happens next and Ending cards.
- Product, Facts and Strategy (§5.5–§5.7) are Affiliate Studio's intake steps; a story doesn't have them. Every Affiliate Studio screen, rule and output is unchanged, and projects stored before studios read as Affiliate Studio.

### 5.17 Story: `story-setup` · `/projects/:projectId/story`

Container app-shell > project-workflow · push · authenticated + owner (the step is never locked). Autosave: on (head save state). Surface web. **Approved: 2026-09-26; short-detail revision approved 2026-09-27 (R30).**

- `h1` “Story”. Subtitle: “Pick a genre and give AI one detail. It will build the premise, cast and every scene.”
- Content ≥ 1200px: main + 280px aside, as Strategy. Cards, in order, use Strategy's card anatomy.

**Card “Genre”** (`h2` t-h3):

- Chips (the radio chip, components-states.md) in `role="radiogroup" aria-label="Genre"` (`story.select-genre`): **Drama** · **Action** · **Comedy** · **Romance** · **Horror** · **Mystery** · **Fantasy** · **Slice of life**. Nothing is chosen on a new story.
- Under the chips, a t-sm `--ink-3` hint for the chosen genre, linked with `aria-describedby` (none while no genre is chosen): Drama “Real feelings, a hard choice, a moment that lands.” · Action “Clear stakes and movement. Fights and chases stay stylised, with no gore.” · Comedy “A setup, a turn and a punchline. Timing does the work.” · Romance “Two people and one spark or misunderstanding. No sexual content.” · Horror “Scares come from suspense and sound, not gore.” · Mystery “A question in the first seconds and a reveal at the end.” · Fantasy “One impossible thing in an ordinary world.” · Slice of life “Small, true-to-life moments people recognise.”

**Card “Premise”** (the Selling angle card's anatomy, §5.7):

- Header row: “Premise” (`h2` t-h3) and, right, the paid secondary **Suggest premises** with cost segment “1 credit”; after the first suggestion it reads **Suggest again** · “1 credit” (`story.suggest-premises`; loading “Suggesting…”). Until a genre is chosen it is disabled with the tooltip “Pick a genre first”. Disabled offline and when credits are short, like Suggest angles.
- **Story detail (optional)** (`story.edit-detail`): a full-width two-row textarea before the suggestion results, max 160, placeholder “e.g. Two strangers reach for the same umbrella.” Helper (t-caption `--ink-3`): “A person, place, object or moment is enough. AI will build the premise and cast.” The visible label, helper and any error are connected to the textarea with `for` / `id` and `aria-describedby`; the server error is t-caption `--danger`, `role="alert"`: “Use 160 characters or fewer.” The field autosaves, stays visible while suggesting and after results arrive, and is disabled offline. Empty is valid. The server collapses whitespace before storing it.
- Before suggestions: t-sm `--ink-2` “Add one detail, then get three complete story ideas—or write the premise yourself.”
- Suggesting: three skeleton cards; live status “Suggesting premises…”; the header button is loading.
- Grid of **premise cards**, 2 columns at ≥ 768px, 1 below, gap 12px, in `role="radiogroup" aria-label="Premise"` (`story.select-premise`). AI receives the chosen genre and the optional normalized detail and writes exactly three complete, clearly distinct ideas; it invents the wider story and cast instead of merely rephrasing the detail. Each card (the angle card anatomy with no type badge): title (t-h3); logline (t-sm `--ink-2`), which ends on the open question the story's cliffhanger leaves (R29); “Cast” (t-caption `--ink-3`) + the character names as no-dot neutral badges. Selected: the angle card's 1.5px `--ink` border, 1px ring and 20px filled check. Choosing a premise saves it and, only while the Cast card is empty, fills the cast from the suggestion; typed characters are never replaced. A detail is context only: it is never treated as a premise and never unlocks Script.
- **Write my own premise** card (`story.select-own-premise`; the dashed own-angle card): pencil icon, “Write my own premise”, “Describe it in your words.” Selected: solid ink border and a textarea **Describe your story** (max 280, placeholder “e.g. Two strangers fight over the last umbrella at a bus stop, then find out they're neighbours.”, `story.edit-own-premise`, error “Describe your story, or pick a suggestion.”).
- Failed: danger banner **“Premise suggestions didn't finish.”** + the cause sentence (§7) + “You weren't charged.” + secondary **Try again** with the “1 credit” segment (`story.retry-premises`).
- Genre changed after the suggestions were made: warning banner **“You changed the genre after these premises were suggested.”** “Suggest again for Comedy ideas.” (the current genre's name). The chosen premise stays chosen.
- Story detail changed after the suggestions were made, while the genre is unchanged: warning banner **“You changed the story detail after these premises were suggested.”** “Suggest again to use the new detail.” If both genre and detail changed, show the genre-changed banner first. The chosen premise stays chosen. A suggestion set records the normalized detail and genre used to make it, so changing either marks the set stale; changing back to both recorded values clears the warning.
- Keyboard order inside the card is the Story detail field, Suggest premises, the warnings or status, then the premise choices. The field remains full width at 390px and 1440px and introduces no horizontal scroll.

**Card “Cast”:**

- Header row: “Cast” (`h2` t-h3) + counter “2 of 4” (`t-mono` t-sm `--ink-2`). Subtitle t-sm `--ink-2`: “Who appears. We use their names in the lines and their look in AI clips.”
- Up to 4 **character rows** (gap 8px). At ≥ 768px each row is a 3-column grid `160px 1fr 1fr` plus a 32px remove button; below 768px the fields stack:
  - **Name** (input, max 24, placeholder “Name”, `story.edit-character-name`).
  - **Who they are** (input, max 80, placeholder “e.g. A nurse heading home after a night shift”, `story.edit-character-role`).
  - **Look** (input, max 80, placeholder “e.g. 20s, yellow raincoat, short hair”, `story.edit-character-look`).
  - A 32px ghost icon button with a 16px x (`story.remove-character`, accessible name “Remove Ana”).
  - Errors under the name (t-caption `--danger`): “Add a name.” · “You already have Ana.” (names are compared without case) · “Use 24 characters or fewer.” A row with no name stays on screen and isn't saved.
- Ghost small **Add a character** with a 16px plus (`story.add-character`); at 4 characters it is disabled and the hint “Up to 4 characters.” shows.
- Hint (t-caption `--ink-3`): “Fictional characters, played by you, by people who agreed, or by AI. Never a real public figure.”
- Empty: t-sm `--ink-3` “No characters yet. A narrated story can go without one.”

**Card “Format”** (groups as Strategy's Format card: label t-label, then the control, margin-bottom 24px):

- **Storytelling** chips (`story.select-storytelling`): **Acted** · **Narrated**, with a t-sm `--ink-3` hint for the chosen one, linked with `aria-describedby`: Acted “The cast acts it out. Viewers hear what they say and the real sound.” · Narrated “A narrator tells the story over the scenes.”
- **Script language** chips (`story.select-language`): **English** · **Filipino** · **Taglish**.
- **Length** segmented control (`story.select-length`): **30 s** · **45 s** · **60 s** (content-width track, as Strategy's).
- Defaults for a new story: Acted, Taglish, 45 s. There is no Tone: the genre sets the mood.

**Aside:** card “Story rules” (≥ 1200px in the aside; below 1200px it sits after the Format card), a list (t-sm): “Stories are fiction. Don't present one as real news.” · “Action and scares stay stylised, with no gore.” · “No sexual content, and no one under 18 in romance or violence.” · “Never use a real public figure as a character.” Closing t-caption `--ink-3`: “These are reminders, not a compliance check. The final review is yours.” These rules are also written into every story prompt (R28 D6); there is no keyword check.

**Footer:** back **Projects** (`story.back-to-projects`); when a version exists, ghost **Open script** (`story.open-script`); the credits line (t-sm `--ink-2`) “You have **128** credits” (number in `t-mono`); primary paid **Write hooks & script · 3 credits**, or **Write a new version · 3 credits** once a version exists (`story.write-script`; loading “Starting…”). Gating reasons: “Pick a genre” · “Choose or write a premise” · “Add a character, or switch to Narrated” (Acted with no character) · “You need 3 credits. You have 2.” Writing saves the story, starts the job and opens Script with its job panel, as from Strategy.

**Episodes** (§3.25, R31, approved 2026-09-27). A story continues as episodes. Each episode is its own project (its own Story, Script, video steps and export), and episodes are linked into a series in order. What changes on this step:

- **Card “Episodes”**, first in the main column (above Genre). Shown when the story has an approved version or its series has two or more episodes; a new story doesn't show it. Header row: “Episodes” (`h2` t-h3) + “Episode 2 of 3” (`t-mono` t-sm `--ink-2`). A list (`ol aria-label="Episodes"`, gap 4px) of rows, 40px tall, `--r-md`, padding 0 8px, gap 12px: the 24px episode number tile (the scene number tile, §5.8), the episode's title (t-label, 1-line ellipsis, a link to that episode's Story step, `story.open-episode`), the dashboard stage badge (§5.3), and a trailing 14px arrow. The current episode's row is `--surface-sunken`, not a link, with t-caption `--ink-3` “This episode” in place of the arrow and `aria-current="page"`. It shows up to 6 rows (the current episode and those around it, oldest first). With more, a ghost small **Show all 12 episodes** (`story.show-all-episodes`) expands the list in place.
  - Under the list, secondary **Next episode** with a 16px plus (`story.next-episode`; free, no cost segment; loading “Creating…”). On success it opens the new episode's Story step with the toast “Episode 3 is ready. It picks up where Episode 2 ended.” It is idempotent: a repeat opens the same episode. When this isn't the latest episode, the button is secondary **Open episode 3** with a 16px arrow (`story.open-episode`), and it opens the next one. Disabled reasons (t-caption `--ink-3` under the button, and the tooltip): “Approve this episode's script first.” · “This is the final episode.” · “This series has 50 episodes, the most one series can have.” · offline “Reconnect to make the next episode.” Failure: danger banner in the card, **“We couldn't make the next episode.”** “Nothing changed. Try again.”
- **Card “Previously”** (episode 2+ only, after Episodes). Header “Previously” (`h2` t-h3) and t-caption `--ink-3` “How Episode 2 ended” with the episode name as a link (`story.open-previous`). Body t-sm `--ink-2`: the previous episode's last scene from its approved version: Acted, its lines as “Ben: Ikaw pala ang 4B?”, one per line; Narrated, its narration. Above it, t-caption `--ink-3` “Series: ” + the series premise (Episode 1's premise, 2-line clamp). When the previous episode has a newer approved version than the one this episode's script was written from, the §5.8 stale-continuity note shows at the bottom of this card.
- **Genre and Format** on episode 2+: the chips and segmented control show the series' values, disabled, with t-caption `--ink-3` under each card: “Set by Episode 1. Every episode keeps the series' genre and format.” Episode 1's own Genre and Format stay editable. A change there shapes only episodes made later (existing episodes keep their copies).
- **Card “Premise”** on episode 2+ becomes **“What happens next”** (`h2`), with the same anatomy and ids: **What happens next (optional)** (`story.edit-detail`, ≤ 160, placeholder “e.g. Ana admits the notes were hers.”, helper “A twist, a choice or a moment is enough. AI will pick up from the cliffhanger.”); **Suggest what happens next · 1 credit**, then **Suggest again · 1 credit** (`story.suggest-premises`; live status “Suggesting what happens next…”); three **episode idea cards** (title, a logline that picks up the cliffhanger and ends on a new open question, or resolves the story when **Final episode** is on, and Cast badges); and **Write my own** (`story.select-own-premise`, “Describe what happens in this episode.”, textarea label **What happens in this episode**, placeholder “e.g. Ana admits the notes were hers, and Ben has one of his own.”, error “Describe what happens, or pick a suggestion.”). Before suggestions: “Add one detail, then get three ideas for this episode—or write it yourself.” Episode ideas use only the current cast, so choosing one never changes the Cast card. Add a character first to have ideas use them. Stale and failure banners read as Premise's, with “these ideas” in place of “these premises”.
- **Cast** on episode 2+ is the copy made from the previous episode. It is editable as on Episode 1 (up to 4), and edits never change earlier episodes. Subtitle adds “Copied from Episode 2.” (t-caption `--ink-3`).
- **Card “Ending”** (episode 2+ only, after Format). **Final episode** switch (components-states Switch, `story.toggle-final`) and t-sm `--ink-2` “The last scene ends the story instead of leaving a cliffhanger. There's no next episode after it.” It autosaves and shapes the next version written (a written version keeps the ending it was written with). It is disabled with t-caption `--ink-3` “Episode 4 already follows this one.” when a later episode exists. Episode 1 has no Ending card: it always ends on a cliffhanger (R29).
- **Footer** on episode 2+: the gating reason “Choose or write a premise” reads “Choose or write what happens next”. Everything else as above.
- Episode states: Episodes card hidden (new story) · lone story with an approved version (Next episode enabled) · series of 3 on the latest episode · on an earlier episode (Open episode N) · creating · create failed · Next disabled (script not approved · final · 50 episodes · offline) · more than 6 episodes (Show all) · episode 2+ (Previously, locked Genre and Format, What happens next, Ending) · stale continuity · Final episode on · Final disabled (a later episode exists).
- Keyboard order: Episodes list → Next episode → Previously → Genre → What happens next → Cast → Format → Ending → footer. At 390px every card is full width, and the Episodes rows keep the number, title (ellipsis) and badge on one line; the badge drops under the title below 360px.

**Seeded example:** “The Umbrella Standoff”: Comedy; story detail “Two strangers reach for the same umbrella.”; own premise “Two strangers fight over the last umbrella at a bus stop, then find out they're neighbours.”; cast Ana (a nurse heading home after a night shift; 20s, yellow raincoat, short hair) and Ben (a delivery rider on a break; 20s, green rider jacket, helmet under his arm); Acted · Taglish · 45 s; v1 approved, so the footer shows **Open script** and **Write a new version · 3 credits**. “Untitled story” is a new story with no genre and an empty detail.

**States:** no genre (hint hidden; Suggest premises disabled) · genre chosen (hint) · optional detail empty · detail entered before suggestions · suggestions generated from a detail · detail over limit (server error) · premises: before suggestions · suggesting · suggested · one chosen · own premise · suggestion failed · genre changed after suggestions · detail changed after suggestions · cast: empty (Acted: gating reason; Narrated: fine) · filled from a suggestion · 4 characters (Add disabled) · invalid name · version exists (Open script, Write a new version) · not enough credits · save failed (warning banner as Product) · offline (detail “Changes will save when you reconnect.”; paid buttons disabled) · leave with unsaved edits · loading · not found · no access · (§3.25) the episode states above.

Settled 2026-09-26 as built: each character row is a group named by its name (“Character 2” until it has one); its inputs have visible labels **Name**, **Who they are** and **Look** below 768px, visually hidden at ≥ 768px where the row reads as columns. A step the project doesn't have (Product, Facts or Strategy for a story, Story for an affiliate video, or a video step while the video beta is off) replaces itself with the project's current step; the API also refuses the other studio's writes.

## 6. Scrollers

Scrollbar hidden on every touch surface (`scrollbar-width: none`; `::-webkit-scrollbar { display: none }`), `overscroll-behavior-x: contain`, `scroll-snap-type: x mandatory` for item snap. A 40px edge fade (`mask-image` linear gradient) on the end that has more content; it disappears at the end. Grid and flex parents of a scroller get `min-width: 0`.

| Id | Type | Snap | Items visible | Peek | Autoplay / loop | Controls | Boundaries |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `dashboard.filters` | chip-row | item | 3.3 @ < 640; all fit ≥ 640 | 24px | none / false | the chips | All fit at ≥ 640px, so no fade |
| `fact-review.filters` | chip-row | item | 3.2 @ < 640; all fit ≥ 768 | 24px | none / false | the chips | as above |
| `workflow.steps` | tab-strip | item | 2.6 @ < 640; all fit 640–1023 | 32px | none / false | the chips; current scrolled into view on load | Only below 1024px |
| `script-studio.hooks` | rail | item | 1.15 @ < 640, 2.2 @ 640–1023, 3 @ ≥ 1024 (grid, no scroll) | 24px | none / false | “n of m” + Previous / Next (`script-studio.page-hooks`) below 1024px | Previous disabled on the first card, Next on the last; one hook → no controls; two hooks at ≥ 1024 align start |

Keyboard: arrow keys move selection within radio-group scrollers and scroll the selected item fully into view, so focus never lands on a clipped item. Screen readers hear “Hook n of 3”. Reduced motion: paging jumps instantly.

Vertical (revised 2026-09-26, §3.23): the `new-video-dialog` body scrolls inside the dialog once it lists more than 4 studios (max-height `min(560px, 70dvh)`), with the footer fixed; with 4 or fewer it doesn't scroll. It isn't a horizontal scroller, so the table above doesn't list it.

## 7. Failure copy (shared)

Cause sentences used by job failures, in the form “<what happened>. <cause>. <what was kept>. <charge>.”:

| Cause | Sentence |
| --- | --- |
| Timeout | “The writing service timed out after 60 seconds.” |
| Rejected | “The writing service turned the request down.” |
| Not set up | “The writing service isn't set up yet.” |
| Unusable result | “The draft came back incomplete, so we didn't use it.” |
| Other | “Something went wrong on our side.” |

Every job failure also says what was kept (“Your facts, strategy and earlier versions are safe.”, or for one item “Your hook is unchanged.”; (§3.23) for a story's script “Your story and earlier versions are safe.”) and “You weren't charged.” (§3.23) Premise suggestions use these cause sentences; the video service's refusal of a story clip reads as the §5C Rejected sentence, “The video service turned the request down.”

## 8. Interaction rules (cross-screen)

- **Paid actions** show their estimate on the button, enter loading on the first activation and ignore repeats. A retry reuses the same job. Completion toasts state what was used.
- **Autosave** saves 800ms after the last change (immediately on blur). The head shows Saving…, Saved, Not saved. Retrying…, or Offline.
- **Upstream edits never silently change approved work.** Changing or unapproving a fact that an approved version uses marks it *needs review*. A newer draft never replaces the approved brief until it is approved. (§3.23) A story's version keeps the story it was written from; changing the story shapes only the next version written.
- **Model output is a draft.** It never approves anything; every line is re-checked against the approved facts. (§3.23) A story has no facts: its lines aren't claim-checked, and the story rules (R28 D6) are written into every story prompt instead.
- **Studios** (§3.23): shared screens read the project's studio from the registry and never name a fixed set of studios; a studio's own copy lives in its steps and variants.
- **Destructive actions** (remove file, remove fact, leave with unsaved edits) name their object, state that they can't be undone, and use a danger button.

## 9. Canonical demo data

The fictional demo world is Mika Reyes and the BlendGo Mini blender project; full values in [voice-content.md](../system/voice-content.md#canonical-demo-data). It is seeded into the database for demos. Every value is fictional and uses `example` domains; credit numbers and file limits are demo values. (Revised 2026-09-26, §3.23.) The world also holds two stories: “The Umbrella Standoff” (Comedy · Acted · Taglish · 45 s, cast Ana and Ben, v1 approved) and “Untitled story” (a draft with no genre). (§3.25, R31) “The Umbrella Standoff · Episode 2” continues it: Episode 2 of 2, a draft with no script yet, own premise “Ana admits the notes were hers, and Ben has one of his own.”, cast copied from Episode 1.

## 10. Planned but not specified

- **Batch 2:** `media-mapping`, `voice-studio`, `scene-editor`, `export` are specified in §5B (approved 2026-09-24). Their steps and entry points stay hidden until built.
- **Later:** `ai-scene-clips` is specified in §5C (approved 2026-09-25); build follows Phase 22; `operator-usage` (if confirmed).
- **Entertainment Studio:** `story-setup` (§5.17), `new-video-dialog` (§5.3) and the story variants are specified in §5D (approved 2026-09-26, §3.23); build in Phases 29–31. Story episodes (§3.25, R31) are specified in §5.17 and the variants marked §3.25; build in Phase 33. The gaps §3.23 left open were settled from the build on 2026-09-26 and are written into each section.
- **Later studios and story extensions** (not designed; never shown as “coming soon”): more studios on the same registry (education, business, personal and others), a dashboard studio filter (at three or more studios), branching episodes, a series page, AI voices per character, generated character looks (R28 D4), generated music and landscape presets.
- **Legal:** `terms`; the §3.23 privacy wording (§5.10) with R21.
- **Billing:** plans and credit top-ups.

The Batch 2 components (scene card with reorder, 9:16 preview player, voice picker with sample playback, caption style chips, music level control, export history row) are specified in §5B and [components-states.md](../system/components-states.md). See [open-decisions.md](../planning/open-decisions.md).
