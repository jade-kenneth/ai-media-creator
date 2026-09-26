# Screen inventory

Owning app for every screen: `apps/app-web`. Surface: web (responsive). Status values: `planned`, `in-design`, `specified`, `in-build`, `built`, `blocked`.

| Screen id | Screen | Route | Design Reference | Batch | Status |
| --- | --- | --- | --- | --- | --- |
| `app-shell` | App shell (top bar, credits popover, account menu, toasts) | — | §3 (revised 2026-09-26: “Suggest premises” usage label §3.23) | 1 | built 🔁; §3.23 revision specified (Phase 29) |
| `project-workflow` | Project workflow shell (stepper rail and strip, head, footer, route states) | `/projects/:projectId/*` | §4 (revised 2026-09-26: studio caption, subject line, story groups, “Step n of 7” §3.23; episode subject line §3.25) | 1 | built 🔁; §3.23 revision specified (Phase 29); §3.25 revision specified (Phase 33) |
| `root` | Root redirect | `/` | §5.1 | 1 | built 🔁 |
| `sign-in` | Sign in | `/sign-in` | §5.2 (revised 2026-09-26: studio-neutral stage copy §3.23) | 1 | built 🔁; §3.23 revision specified (Phase 29) |
| `dashboard` | Projects dashboard (+ `new-video-dialog`) | `/projects` | §5.3 (revised 2026-09-26: New video and `new-video-dialog`, head, empty state, studio subject line, story Duplicate rule §3.23; episode badge and duplicate §3.25) | 1 | built 🔁; §3.23 revision specified (Phase 29); §3.25 revision specified (Phase 33) |
| `project-resume` | Resume redirect | `/projects/:projectId` | §5.4 (revised 2026-09-26: stories §3.23) | 1 | built 🔁; §3.23 revision specified (Phase 29) |
| `product-setup` | Product | `/projects/:projectId/product` | §5.5 | 1 | built 🔁 |
| `fact-review` | Facts | `/projects/:projectId/facts` | §5.6 | 1 | built 🔁 |
| `strategy` | Strategy | `/projects/:projectId/strategy` | §5.7 (revised 2026-09-25: Skit style §3.22) | 1 | built 🔁; §3.22 revision built (Phase 28 Spec QA open) |
| `story-setup` | Story (Entertainment Studio) | `/projects/:projectId/story` | §5.17 (§5D; new 2026-09-26, §3.23; short-detail revision 2026-09-27, §3.24, R30; episodes 2026-09-27, §3.25, R31) | Studios (§3.23–§3.25) | specified (Phase 29; Phase 32 revision specified; §3.25 episodes specified, Phase 33) |
| `script-studio` | Script | `/projects/:projectId/script` | §5.8 (revised 2026-09-25; transitions §3.19; skit Lines, Sound and Cast §3.22; story versions §3.23, 2026-09-26; Ending and stale continuity §3.25) | 1 | in-build (Phase 21 QA; Phase 23; Phase 28 built, Spec QA open); §3.23 revision specified (Phase 30) |
| `creator-brief` | Creator brief | `/projects/:projectId/brief` | §5.9 (revised 2026-09-25; transitions §3.19; skit rules §3.22; story brief §3.23, 2026-09-26; `Episode:` header §3.25) | 1 | in-build (Phase 21 QA; Phase 23; Phase 28 built, Spec QA open); §3.23 revision specified (Phase 30) |
| `privacy-policy` | Privacy policy (adapted) | `/privacy-policy` | §5.10 (revised 2026-09-26: story wording §3.23, ⚠ legal with R21) | 1 | built 🔁; §3.23 revision specified (Phase 31) |
| `not-found` | Page not found | any unknown path | §5.11 | 1 | built 🔁 |
| `media-mapping` | Media | `/projects/:projectId/media` | §5.12 (revised 2026-09-25; transitions §3.19; Shoot plan §3.20; Keep consistent and one-click clips §3.21; skit lines and clip-sound warnings §3.22; story characters and likeness confirmation §3.23, 2026-09-26) | 2 | approved; Phase 23, 26, 27 and 28 revisions built (Phase 27 and 28 Spec QA open); §3.23 revision specified (Phase 31) |
| `voice-studio` | Voice | `/projects/:projectId/voice` | §5.13 (revised 2026-09-25: Sound from your clips §3.22; story defaults §3.23, 2026-09-26) | 2 | approved; Phase 28 revision built (Spec QA open); §3.23 revision specified (Phase 31) |
| `scene-editor` | Edit & preview | `/projects/:projectId/edit` | §5.14 (revised 2026-09-25; transitions §3.19; Clip sound and captions from the lines §3.22; story end card and end line §3.23, 2026-09-26; end line prefill §3.25) | 2 | approved (R13); Phase 23 revision specified; Phase 28 revision built (Spec QA open); §3.23 revision specified (Phase 31) |
| `export` | Export video | `/projects/:projectId/export` | §5.15 (revised 2026-09-25; transitions §3.19; clip sound in details §3.22; story reminders and no #ad §3.23, 2026-09-26) | 2 | approved (R14); Phase 23 revision specified; Phase 28 revision built (Spec QA open); §3.23 revision specified (Phase 31) |
| `ai-scene-clips` | AI scene clip sheet (on Media) | sheet on `/projects/:projectId/media` | §5.16 (§5C; R23; §3.20 prefill; §3.21 one-click clips; §3.22 skit prefill and clips with sound; §3.23 Describe only and story prefill, 2026-09-26) | Later | in-build (Phases 22 and 24 browser QA open; Phase 27 and 28 revisions built, Spec QA open); §3.23 revision specified (Phase 31) |
| `operator-usage` | Operator usage view | — | — | Later | blocked (decision 3) |
| `terms` | Terms | `/terms` | — | — | blocked (decision 10) |

The Studios batch (Entertainment Studio, Product Specification §3.23, approved 2026-09-26) adds `story-setup` and revises the shared and video screens above; each revision is marked “§3.23 revision specified” until its phase builds it. Story episodes (§3.25, R31, approved 2026-09-27) revise `story-setup`, `project-workflow`, `dashboard`, `script-studio`, `creator-brief` and `scene-editor`; Phase 33 builds them.

`built 🔁` = implemented and QA'd against fixture data; data round-trips re-verify once Phase 0 (database, Google, S3, text provider) is configured. Statuses move to `in-build` when their Implementation Plan phase starts and to `built` when the screen passes its Fidelity QA rows.
