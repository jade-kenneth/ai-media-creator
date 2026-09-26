# Navigation map

Normative route table. Surface for every row: **web** (desktop-first, responsive down to 360px). Owning app: `apps/app-web`. Section links point into the [Design Reference](../handoff/AI%20Creation%20Platform%20Design%20Reference.md).

## Route table

| Screen id | Route | Params | Container | Presentation | Guard | Reached from | Exits | Back / cancel / dismiss | Deep link | Not found / no access |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `root` | `/` | — | — | replace | none | direct entry | `dashboard` (signed in), `sign-in` (signed out) | — | yes | — |
| `sign-in` | `/sign-in?returnTo=&reason=` | `returnTo` (optional, same-origin path only), `reason` (`expired`, `signed-out`) | none | full-screen | unauthenticated (signed-in visitors go to `returnTo` or `/projects`) | `root`, any guarded route while signed out, `app-shell.sign-out`, `route-no-access.switch-account` | `dashboard` or `returnTo` after sign-in; `privacy-policy` | Browser back leaves the app | yes | An unsafe `returnTo` (absolute URL, `//`) is ignored |
| `dashboard` | `/projects?filter=&sort=` | `filter` (`all`, `in-progress`, `ready`, `exported`), `sort` (`edited`, `name`) — optional | app-shell | push | authenticated | `root`, sign-in, brand, Projects nav, every workflow “Projects” back link, route error states | project workflow (open card; (§3.23) New video → `new-video-dialog` → the new project's first step) | Browser back goes to the previous page | yes (filter and sort restore) | — |
| `project-resume` | `/projects/:projectId` | `projectId` | app-shell | replace | authenticated + owner | deep links, notifications | the current step for the project's status | — | yes | route error states |
| `product-setup` | `/projects/:projectId/product` | `projectId` | app-shell > project-workflow | push | authenticated + owner | dashboard (`new-video-dialog` Affiliate video card, open draft), stepper, fact-review back link, locked redirect | `fact-review` (Continue), `dashboard` | Footer back → `dashboard`; browser back → previous page | yes | loading, not found / invalid id, no access |
| `fact-review` | `/projects/:projectId/facts` | `projectId` | app-shell > project-workflow | push | authenticated + owner; step lock | product-setup Continue, stepper, strategy aside “Edit facts”, script “Edit facts”, locked redirect | `strategy` (Continue), `product-setup` | Footer back → `product-setup` | yes | as above; locked → `product-setup` |
| `strategy` | `/projects/:projectId/strategy` | `projectId` | app-shell > project-workflow | push | authenticated + owner; step lock | fact-review Continue, stepper, script “Change strategy” / “Change length”, locked redirect | `script-studio` (Write hooks & script, Open script), `fact-review` | Footer back → `fact-review` | yes | as above; locked → earliest incomplete step |
| `story-setup` (§3.23–§3.24) | `/projects/:projectId/story` | `projectId` | app-shell > project-workflow | push | authenticated + owner; never step-locked; a story only | `new-video-dialog` Story card, dashboard card for a story, resume (a story with no script version), stepper, script-studio footer back and “Change story”, the locked redirect from a story's Script | `script-studio` (Write hooks & script, Open script), `dashboard` | Footer back → `dashboard`; browser back → previous page; unsaved edits (including Story detail) → Leave dialog | yes | loading, not found / invalid id, no access |
| `script-studio` | `/projects/:projectId/script?version=` | `projectId`; `version` (optional version number) | app-shell > project-workflow | push | authenticated + owner; step lock | strategy submit, (§3.23) story-setup submit and Open script, stepper, brief “Review v4” and footer back, dashboard card for a project in script review | `creator-brief` (after approval), `strategy`, `fact-review`, (§3.23) `story-setup` (a story: footer back, Change story), `dashboard` (job panel) | Footer back → `strategy` (a story: `story-setup`); unsaved edits → Leave dialog | yes (`version` restores the viewed version; unknown version falls back to the current one) | as above; locked → earliest incomplete step |
| `creator-brief` | `/projects/:projectId/brief` | `projectId` | app-shell > project-workflow | push | authenticated + owner; step lock | script approve banner and footer, stepper, dashboard card | `script-studio`, `dashboard` | Footer back → `script-studio` | yes | as above; locked → `script-studio` |
| `media-mapping` | `/projects/:projectId/media` | `projectId` | app-shell > project-workflow | push | authenticated + owner; step lock | script approved footer, stepper, voice back link, export “Go to” links, locked redirect | `voice-studio` (Continue), `script-studio`, `product-setup` (aside) | Footer back → `script-studio` | yes | as above; locked → `script-studio` |
| `voice-studio` | `/projects/:projectId/voice` | `projectId` | app-shell > project-workflow | push | authenticated + owner; step lock | media Continue, stepper, edit back link and banner, export “Go to voice”, locked redirect | `scene-editor` (Continue), `media-mapping`, `script-studio` (aside) | Footer back → `media-mapping` | yes | as above; locked → `media-mapping` |
| `scene-editor` | `/projects/:projectId/edit` | `projectId` | app-shell > project-workflow | push | authenticated + owner; step lock | voice Continue, stepper, export back link and “Fix in Edit & preview”, locked redirect | `export` (Continue), `voice-studio` | Footer back → `voice-studio`; unsaved edits → Leave dialog | yes | as above; locked → earliest incomplete step |
| `export` | `/projects/:projectId/export` | `projectId` | app-shell > project-workflow | push | authenticated + owner; step lock | edit Continue, stepper, dashboard card for a ready or exported project | `scene-editor`, `voice-studio`, `dashboard` (job panel) | Footer back → `scene-editor` | yes | as above; locked → earliest incomplete step |
| `privacy-policy` | `/privacy-policy` | — | none | full-screen | none | sign-in fine print | browser back | Browser back | yes | — |
| `not-found` | any unknown path | — | none | full-screen | none | mistyped URLs | `dashboard` | “Back to projects” | — | — |

### Overlays

| Overlay id | Host screen(s) | Presentation | Opens from | Closes to |
| --- | --- | --- | --- | --- |
| `credits-popover` | every app-shell screen | popover | `app-shell.open-credits` | trigger (Escape, outside click) |
| `account-menu` | every app-shell screen | menu | `app-shell.open-account` | trigger |
| `rename-project-dialog` | `dashboard` | dialog / bottom sheet | `dashboard.rename-project` | card menu trigger |
| `new-video-dialog` (§3.23) | `dashboard` | dialog (560px) / bottom sheet below 640px | `dashboard.create-project`, `dashboard.empty-create-project` | the New video button that opened it; a studio card creates the project and opens `product-setup` or `story-setup` |
| `add-fact-dialog` | `fact-review`, `script-studio` | dialog | `fact-review.add-fact`, `fact-review.empty-add-fact`, `script-studio.add-flag-as-fact` | trigger |
| `remove-fact-dialog` | `fact-review` | dialog | `fact-review.remove-fact` | row menu trigger |
| `remove-asset-dialog` | `product-setup` | dialog | `product-setup.remove-asset` | tile menu trigger |
| `approve-version-dialog` | `script-studio` | dialog | `script-studio.approve-version` | footer button |
| `version-history-drawer` | `script-studio` | drawer | `script-studio.open-history` | History button |
| `media-picker-sheet` | `media-mapping`, `scene-editor` | sheet | `media-mapping.choose-media`, `media-mapping.change-media`, `scene-editor.change-media` | trigger; “Use this” applies the pick |
| `ai-clip-sheet` (`ai-scene-clips`, §5C) | `media-mapping` | sheet (bottom sheet below 640px) | `media-mapping.generate-clip`, `media-mapping.view-clip-job`, `media-mapping.review-clips`, `media-picker.generate-clip`, `ai-clip.toast-review` | the opening control; “Use in scene n” applies the clip. Rendered only while AI scene clips are enabled |
| `discard-clips-dialog` | `media-mapping` (over `ai-clip-sheet`) | dialog | `ai-clip.discard` | Discard button; confirming also closes the sheet |
| `ai-clip-check-dialog` | `media-mapping`, `scene-editor` (over `media-picker-sheet`) | dialog | `media-picker.confirm` on an unchecked AI clip | the picker; confirming applies the clip and closes both |
| `item-photo-sheet` (§3.21) | `media-mapping` | sheet (bottom sheet below 640px) | `media-mapping.item-photo` | trigger; “Use this” sets the item's photo (for a story's character, after the likeness box is ticked, §3.23) |
| `remove-recording-dialog` | `voice-studio` | dialog | `voice-studio.remove-recording` | Remove button |
| `reset-captions-dialog` | `scene-editor` | dialog | `scene-editor.reset-captions` | Reset button |
| `remove-music-dialog` | `scene-editor` | dialog | `scene-editor.remove-music` | Remove button |
| `leave-unsaved-dialog` | `product-setup`, `strategy`, (§3.23) `story-setup`, `script-studio`, `media-mapping`, `voice-studio`, `scene-editor` | dialog | any in-app navigation while a save is pending or failed | trigger; “Leave anyway” continues the navigation |

## Guards

- **Signed-out visitor on a guarded route:** replaced by `/sign-in?returnTo=<path>`. After sign-in they return to that path.
- **Expired session:** a failed token refresh sends the visitor to `/sign-in?returnTo=<path>&reason=expired`.
- **Signed-in visitor on `/sign-in`:** replaced by `returnTo` or `/projects`.
- **Non-owner on a project route:** the designed *No access* state (with the signed-in email, *Back to my projects* and *Switch account*).
- **Unknown or malformed `projectId`:** the designed *We can't find that project* state.
- **Locked step:** replaced by the earliest incomplete step, which shows an info banner (`?locked=<step>`).
- **Episodes (§3.25, R31):** every episode is a story project on the same `story-setup` route with its own `projectId`. `story.next-episode` creates the next episode and pushes its `/projects/:newId/story`; `story.open-episode` and `story.open-previous` push another episode's Story step (leave dialog when unsaved). An episode the viewer doesn't own is no access, like any project. No new route.
- **Locked step in a story (§3.23):** a story's Script is locked until the story is done (a genre, a premise and, for Acted, a character) or a version exists; it redirects to `story-setup`. The Story step is never locked.
- **A step from another studio (§3.23):** ⚠ not settled. §3.23 doesn't say what `/product`, `/facts` or `/strategy` show for a story, or `/story` for an affiliate video. The web never links to them and the API rejects the wrong studio's mutations (`WRONG_STUDIO`).

## Navigation graph: signed-out visitor

```text
root → sign-in → (Google) → returnTo | dashboard
sign-in → privacy-policy → (browser back) sign-in
any guarded route → sign-in?returnTo=…
```

## Navigation graph: creator

```text
root → dashboard
dashboard → new-video-dialog → product-setup | story-setup                     (§3.23)
dashboard ⇄ product-setup (new affiliate video | open) ⇄ fact-review ⇄ strategy ⇄ script-studio ⇄ creator-brief
dashboard ⇄ story-setup (new story | open) ⇄ script-studio ⇄ creator-brief       (§3.23, Entertainment Studio)
story-setup (episode N) → story-setup (episode N+1)  via Next episode / Open episode / Previously   (§3.25)
script-studio ⇄ media-mapping ⇄ voice-studio ⇄ scene-editor ⇄ export        (Batch 2; both studios)
export → scene-editor | voice-studio (blocking check links) · dashboard → export (ready or exported card)
dashboard → project-resume → current step
script-studio → strategy | fact-review (aside links)
script-studio → story-setup (a story: Change story, footer back)
creator-brief → script-studio (Review newer draft)
every workflow step → dashboard (breadcrumb, footer back on Product, job panel)
app-shell → dashboard (brand, Projects) | sign-in (Sign out)
route error states → dashboard | sign-in (Switch account)
```

## Coverage audit

- **Screens with no inbound edge:** none. `project-resume` is reached by deep link and by dashboard cards for projects whose current step is resolved at open time. (§3.23) `story-setup` is reached from the New video dialog's Story card, a story's dashboard card through resume, the stepper, and Script's Change story and footer back.
- **Terminal screens:** `creator-brief` is the last Batch 1 step; its footer primary returns to Projects because the next steps are Batch 2. `privacy-policy` is a leaf left with browser back.
- **Targets that do not resolve (not rendered in the built app):** `needs-spec:terms`. The Batch 2 routes above are approved and stay unrendered until built. See [open-decisions.md](open-decisions.md).
