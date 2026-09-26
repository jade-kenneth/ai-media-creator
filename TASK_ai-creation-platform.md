# AI Creation Platform — Engineering Task Tracker

> Derived from Product Specification.md and Implementation Plan.md.
> Those files remain canonical; this file is the detailed execution tracker.

## Source and status

- Product Specification: `Product Specification.md` · content fingerprint: `ba80be73e58d4d9e88a0788e1ba72474af124fbd`
- Implementation Plan: `Implementation Plan.md` · content fingerprint: `ea75c4f87f9694217150b2672e4e8deab1ac0862`
- Previous reconciliation fingerprints: Product Specification `f4ba1bd…` · Implementation Plan `4af2234…` (2026-09-27, §3.24 and Phase 32); Product Specification `bf9ad8c…` · Implementation Plan `42daba9…` (2026-09-25, before §3.22 and Phase 28); Product Specification `2a543dc…` · Implementation Plan `33a631c…` (2026-09-25, §3.20/§3.21 fold; advanced after the Phase 27 build for §3.21 clarifications and Phase 27 status only, reflected in Phase 27 tasks); Product Specification `1eed476…` · Implementation Plan `daf8072…` (2026-09-25, §3.21 approved; advanced the same day after the §3.20/§3.21 Design Reference fold); Product Specification `1d85f4b…` · Implementation Plan `f5a934b…` (2026-09-25, advanced by hand while Phases 24–25 were added; neither blob is in the Git object store, so the 2026-09-25 §3.21 reconciliation compared content); Product Specification `bdd4749…` · Implementation Plan `dea7e4b…` (2026-09-25, §3.19 added; advanced 2026-09-25 for the §3.19 Seed and Contract row wording and Phase 23 status only, reflected in Phase 23 tasks); Product Specification `8bd9ea205f3d5beb88d1c2ca06e5620fba49bc48` · Implementation Plan `1cd55e05a6ec18dc586008204ec1a7273d5cd1a4` (2026-09-25, Phase 22 status advance); `40a629f…` · `f63f60d…` (2026-09-25, §5C specified); `2e1966c…` · `c1838d9…` (2026-09-24, after Batch 2 approval); before that `050f412…` · `5ce29b6…` (first generation)
- Generated/reconciled: 2026-09-24 (first generation; reconciled 2026-09-24 after Batch 2 approval); reconciled repeatedly through 2026-09-25 for Phases 21–28; reconciled 2026-09-27 after the carried-out Entertainment Studio work (Phases 29–31) and the new short Story detail revision (§3.24, R30, Phase 32); reconciled 2026-09-27 for Story episodes (§3.25, R31, Phase 33)
- Current phase: Phase 33 Story episodes (§3.25, R31, approved 2026-09-27): specified and ready to build; the design fold is done and every build task is `[ ]`. Phase 32 short Story detail: implementation and automated validation completed 2026-09-27, with signed-in Fidelity QA still open. Phases 29–31 are built with their signed-in Spec QA rows open; Phase 31 seed execution still waits on the product owner's approval because it targets the shared Atlas database. Earlier browser/live QA blockers remain recorded below.

Task line format: `[owner] action` then `Req` (Product Specification § · Implementation Plan phase) · `Deps` · `Accept` · `Validate`. Owners: `web` = `apps/app-web`, `api` = `apps/app-api`, `root` = repository root.

## Prototype-to-production mapping

Prompt-only mode: there is no prototype. The “observable outcome” column cites the Design Reference section that replaces it.

| Screen/action            | Observable outcome (Design Reference)                                | Architecture source                                                                                                    | Production state owner                                                                           | Read/write path                                                                                                                                                       | Validation/auth/error contract                                                                                                   | Prototype-only mechanics rejected |
| ------------------------ | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| Sign in                  | §5.2                                                                 | `features/auth/google-sign-in-button.tsx`, `SessionsController.authenticateWithGoogle`, `GoogleAuthService`            | Auth store (`providers/AuthProvider`)                                                            | REST `POST /session/authenticate/google` → provisioning → `AuthPayload`                                                                                               | Google ID token verified server-side; Turnstile when enabled; inactive → error                                                   | none                              |
| App shell credits        | §3                                                                   | new `credits` module                                                                                                   | TanStack Query `['credits','summary']`                                                           | `myCredits`                                                                                                                                                           | auth guard + owner filter                                                                                                        | none                              |
| Dashboard                | §5.3                                                                 | new `projects` module                                                                                                  | Query cache (`['projects', …]`)                                                                  | `projects`, `projectCounts`, `createProject`, `renameProject`, `duplicateProject`                                                                                     | zod 1–80 client + service; owner + workspace filter                                                                              | none                              |
| Workflow shell / resume  | §4, §5.4                                                             | `ProjectsService.steps/currentStep`                                                                                    | Query cache `['projects','detail',id]`                                                           | `project`                                                                                                                                                             | `NotFoundError` / `ForbiddenError`; server gates → `ConflictError`                                                               | none                              |
| Product                  | §5.5                                                                 | `projects` + new `assets` module + `ProductImportService` + `s3`                                                       | Query cache; react-hook-form for field drafts                                                    | `updateProduct`, `importProduct`, `clearImportedProductValues`, `continueToFacts`, `createAssetUpload`, S3 PUT, `completeAssetUpload`, `removeAsset`, `projectAssets` | zod schema + service validation; MIME/size/count caps; server-generated keys; host allowlist, timeout, size cap                  | none                              |
| Facts                    | §5.6                                                                 | new `facts` module + `ClaimCheckService`                                                                               | Query cache (optimistic status)                                                                  | `productFacts`, `setProductFactStatus`, `updateProductFactText`, `addProductFact`, `removeProductFact`                                                                | text limits; creator-only removal; downstream `NEEDS_REVIEW`                                                                     | none                              |
| Strategy                 | §5.7                                                                 | `projects` (strategy) + `generation-jobs` + `credits`                                                                  | Query cache; form drafts in react-hook-form                                                      | `updateStrategy`, `suggestAngles`, `writeScript`, `retryGenerationJob`, `generationJob`                                                                               | gates (buyer, angle, facts, credits) → `ConflictError`; idempotency key                                                          | none                              |
| Story (§3.23–§3.24)     | §5.17 (short-detail revision R30)                                    | `projects` + `generation-jobs` + `credits` + `PremiseSuggestionsHandler`                                               | Query cache; react-hook-form draft; persisted `Story.detail`; server-owned premise suggestion set       | `project` → `updateStory(detail)` → repository; `suggestPremises` → text job → validated set → project invalidation                                                  | owner/studio guard; zod ≤ 160 and server `ValidationError`; genre gate; credits/idempotency; model output coerced              | None — no prototype               |
| Story episodes (§3.25, R31) | §5.17 Episodes, Previously, What happens next, Ending; §4 rail line; §5.3 “Ep 2” badge; §5.8 Ending + stale note; §5.9 `Episode:`; §5.14 end line prefill | new `story-series` module (repository + service) + `projects` (`createNextEpisode`, `Project.series`, `updateStory` locks/`isFinal`) + `scripts`/`studios` prompts + `assets.copyToProject` + `video-edits` consistent items + `project-duplicates` | Server (series record; project `series` field); query cache: project detail and project list (`series`); form draft only until autosave | `useCreateNextEpisode` → `createNextEpisode` → service → repositories; `useUpdateStoryMutation` (`isFinal`); existing `WRITE_SCRIPT`/`REWRITE_SCENE`/premise jobs with the continuity block | Owner-scoped; `assertStudio(ENTERTAINMENT)`; `EPISODE_NOT_LATEST`, `EPISODE_NOT_READY`, `SERIES_ENDED`, `SERIES_FULL`; field `ValidationError` for locked fields and `isFinal`; idempotent create; recap coerced ≤ 300 | None — no prototype |
| Script                   | §5.8 (revised 2026-09-25: Shoot plan, Shot direction, Transition in) | new `scripts` module + jobs + claim check                                                                              | Query cache; per-field drafts via autosave                                                       | `scriptVersions`, `updateScriptVersion`, `rewriteHook`, `rewriteScene`, `approveScriptVersion`, `copyScriptVersion`, `projectJobs`, `generationJob`                   | immutable approvals; flag/hook/job gates on approve                                                                              | none                              |
| Creator brief            | §5.9 (revised 2026-09-25: `SHOOT PLAN`, `Frame:`, `Transition:`)     | `scripts` (`CreatorBriefService`)                                                                                      | Query cache `['brief',projectId]`                                                                | `creatorBrief`                                                                                                                                                        | `ConflictError` when none approved                                                                                               | none                              |
| Jobs + credits           | §7, §8                                                               | `generation-jobs`, `credits`, `text-generation`                                                                        | Server (`GenerationJobs`, `CreditAccounts`, `CreditEntries`)                                     | worker interval + atomic claim                                                                                                                                        | hold/capture/release; idempotency; model output coerced                                                                          | none                              |
| Media (Batch 2)          | §5.12 (revised 2026-09-25: direction line, Punch-in hint, overlap warning; Product Specification §3.20 Shoot plan card) | new `video-edits` module + `assets`                                                                                    | Query cache `['video-edit',projectId]`; autosave                                                 | `videoEdit`, `startVideoEdit`, `updateVideoEdit`, `autoFillSceneMedia`, `switchVideoEditVersion`, `projectAssets`                                                     | ready project asset or text card; clip-start rule; version pinning; owner filter                                                 | none                              |
| Voice (Batch 2)          | §5.13                                                                | new `voice` (provider) + `voice-tracks` modules; media worker                                                          | Server (`VoiceTracks`, immutable); query cache                                                   | `voiceOptions`, `generateVoiceover`, `alignRecording`, `createAssetUpload(purpose: RECORDING)`, `generationJob`                                                       | allowlisted voices; rights per recording; credits held/released; staleness                                                       | none                              |
| Edit & preview (Batch 2) | §5.14 (revised 2026-09-25: Transition in, preview transitions)       | `video-edits` + `ClaimCheckService`                                                                                    | Query cache; autosave; client-only playback clock                                                | `updateVideoEdit`, `resetCaptions`, `createAssetUpload(purpose: MUSIC)`, `removeAsset`                                                                                | permutation-checked order; caption limits; claim flags; music rights                                                             | none                              |
| Export (Batch 2)         | §5.15 (revised 2026-09-25: history details suffix)                   | new `render` (FFmpeg) + `exports` modules; media worker                                                                | Server (`Exports`, immutable)                                                                    | `renderVideo`, `projectExports`, `createExportDownload`, `generationJob`                                                                                              | readiness gates; credits; 10-minute limit; short-lived signed download                                                           | none                              |
| AI scene clips (§5C)     | §5.16 (§5C, approved 2026-09-25)                                     | new `video` provider module (MiniMax adapter) + `assets` (`origin`, `aiClip`) + media worker + `render` ffprobe/poster | Server (`Assets` with `origin AI_CLIP`); query cache `projectAssets`, `['video-edit',projectId]` | `generateSceneClips`, `checkAiClip`, `discardAiClips`, `clipPromptFlags`, `updateVideoEdit`, `generationJob` (operation names from §3.18, not yet in SDL)             | enabled flag + key; ready own photo; prompt 1–500; one job per scene; unchecked clip → `CLIP_NOT_CHECKED`; split capture/release | None — no prototype               |
| Keep consistent + one-click clip (§3.21) | §5.12 Keep consistent, `item-photo-sheet`, scene row entry; §5.16 One-click clips (revised 2026-09-25) | `video-edits` (`consistentItems` on the record) + `ai-clips` (`CONSISTENT` mode) + media worker + `render` frame helper | Server (video edit record; job input holds the resolved photos and continuity source); query cache `['video-edit',projectId]` | `videoEdit.consistentItems`, `updateVideoEdit(consistentItems)`, `generateSceneClips(mode: CONSISTENT)`, `generationJob` (names from §3.21, not yet in SDL) | list rules (product first, ≤ 8, names 1–60 unique, own ready photos); `CONSISTENT_ITEMS_INCOMPLETE`; `FIRST_SCENE_CLIP_NEEDED`; clip still checked before use | None — no prototype |

## Architecture reuse contract

- **KEEP [BP] (Phase 27 extends, never replaces):** `video-edits` service/repository (list derivation on start and switch, legacy read fill, `updateVideoEdit` validation); `ai-clips` `generateSceneClips` gates and job input; `AiClipJobsHandler` input crop/presign/cleanup loop; `RenderService.portraitFrame` (a new still-at-time helper beside it, same FFmpeg toolchain); the shared `ai-clip-storage.ts` key builder and the `S3Service` private-key allowlist, widened together; the Media page `useAutosave`; the media picker sheet anatomy for the item photo picker; `defineQuery`/`defineMutation` and codegen.
- **KEEP [BP] (Phase 22 extends, never replaces):** `generation-jobs` `MEDIA_JOB_QUEUE` + lease heartbeat; `credits` capture/release with split amounts; `assets` (+ `origin`, `aiClip`) and `s3` (`ai-clips/` prefix, presigned GET); `render` toolchain (ffprobe, poster frame); `ClaimCheckService` (prompt flags); the `voice` provider-adapter pattern (timeout, error mapping, recorded-fixture specs); `media-picker` and job panel.
- **KEEP [BP] (Batch 2 extends, never replaces):** `generation-jobs` (claim by type, lease renewal), `credits` (hold/capture/release), `assets` + `s3` (audio purpose, new key prefixes), `ClaimCheckService`, `use-autosave`, the job panel and polling hooks, `@dnd-kit/sortable` (already a web dependency), `scheduler-locks`.
- **KEEP [BP]:** GraphQL client (`react-query/graphql-client.ts`), `defineQuery`/`defineMutation` (`react-query/utils.ts`), `graphql-error.ts`, codegen (`apps/app-web/codegen.ts`, `app-api generate-graphql-types`), auth/session/JWT/guards/`CurrentUser`, `ServiceValidatedArgs`, `ZodValidationPipe`, app errors (`common/errors/app.error.ts`), `MongooseRepository`/`Repository`/`clampPageSize`, tenant filter helper, `scheduler-locks`, `s3`, `turnstile`, `organizations`, `users`, `sessions`, `mail`, async-event module (unused), DataTable/RichText (unused), CI.
- **ADAPT:** Google sign-in (provisioning), S3 service (signed GET, head, delete, copy, video types, `projects/` prefix), env schema, `tenant-scope.config.json`, globals/theme, `components/ui` styling, app providers/layout, privacy page, not-found, README, seed.
- **REMOVE:** `apps/app-mobile`; web admin, super-admin, push tester, organizations, delete-account, login, i18n, proxy, sidebar and admin-only core components; API `payments`, `store-purchases`, `push-notifications`, `push-tokens`, `notifications` (module + SDL + generated types + env + tenant-scope + specs + client operations).

## Pattern scan — auth session lint gate (2026-09-24)

- Exemplars consulted: `.skills-source/skills/web-app/references/auth-patterns.md`, `apps/app-web/features/project-workflow/use-project-jobs.ts`, and `apps/app-web/hooks/use-online-status.ts`.
- End-to-end trace: `AuthProvider` → `useAuth` → `getSession` → token store/session refresh service → global authentication flag + `AuthContext` → `useSession` consumers and route guards.
- Pattern decisions: keep session loading inside `useAuth`; keep the provider thin; use refs for mounted and in-flight guards; use a stable callback when an effect and browser listener share the same async refresh operation; clean up the visibility listener on unmount; include the callback in the effect dependency list.
- Validation and error handling: preserve the existing authenticated, unauthenticated, and error session states; preserve local token cleanup in `getSession`; run focused ESLint, web typecheck, and web build.
- Deviations: none. Do not suppress `react-hooks/set-state-in-effect` or `react-hooks/exhaustive-deps`.

## Pattern scan — product autosave compiler warning (2026-09-24)

- Exemplars consulted: `.skills-source/skills/web-app/references/forms.md`, `apps/app-web/features/strategy/strategy-page.tsx`, `apps/app-web/features/script-studio/script-editor.tsx`, and `apps/app-web/features/project-workflow/use-autosave.ts`.
- End-to-end trace: `ProductPage` React Hook Form draft + `productFormSchema` field validation → `useAutosave` debounce/retry/flush engine → `useUpdateProductMutation` → `UPDATE_PRODUCT_MUTATION` → `ProjectsResolver.updateProduct` → `ProjectsService.updateProduct` → project repository save → project-detail query cache update.
- Pattern decisions: retain React Hook Form as the draft owner and `useAutosave` as the save-state owner; subscribe to value changes without render-time observation; validate only the changed top-level product field; preserve feature-array coalescing, the 800 ms debounce, blur flush, retry behavior, and server-result cache update; use React Hook Form's unsubscribe function during effect cleanup.
- Validation and error handling: preserve invalid-field suppression and the existing autosave failure banner; run focused ESLint, full web lint, web typecheck, and web build.
- Deviations: use React Hook Form's `subscribe` API instead of the older `watch(callback)` overload because the installed API explicitly supports non-rendering form-state subscriptions and avoids the React Compiler incompatibility warning.

## Pattern scan — API foundation lint warnings (2026-09-24)

- Exemplars consulted: `.skills-source/skills/api-app/SKILL.md`, `apps/app-api/src/config/observability-config.ts`, `apps/app-api/src/modules/s3/s3.service.ts`, `apps/app-api/src/scripts/seed-demo.ts`, and `apps/app-api/src/scripts/reset-local-dev.ts`.
- Control-flow trace: validated runtime config → `createObservabilityConfig` → `RequestLoggingMiddleware` request filter/threshold; Mongoose connection query → hydrated documents → cursor encoding + deserialized repository nodes; Nest bootstrap promise → startup success or the existing fatal error handler.
- Pattern decisions: explicitly type stored configuration objects at their factory's return type; convert Mongoose's untyped `document.id` virtual to a string before passing it to the cursor encoder; explicitly discard the top-level bootstrap promise because `bootstrap` already catches and terminates on startup failure.
- Validation and error handling: preserve request logging behavior, cursor bytes, and the existing startup error message/exit behavior; run focused API ESLint, API typecheck and API tests, then the workspace lint gate.
- Deviations: none; no lint suppression or unsafe cast is added.

## Pattern scan — root environment example reconciliation (2026-09-24)

- Exemplars consulted: `apps/app-api/src/config/env.schema.ts`, `apps/app-api/.env.example`, root `.env.example`, and `scripts/generate-catalogs.mjs` (`collectEnvVars` / `renderEnv`).
- Configuration trace: validated API environment schema → root deployment template → generated `docs/catalogs/environment.md`; app-only seed configuration remains documented in `apps/app-api/.env.example` because it is not part of the runtime schema.
- Pattern decisions: remove variables belonging to deleted mobile push and payment modules; remove the deleted mobile CORS origins; add the current auth bypass, text-provider, credits and import variables by name only; retain bootstrap-account and Kafka variables because their surviving scripts/modules still read them outside the main schema.
- Validation and security: examples contain placeholders or blank values only; regenerate all catalogs and require `pnpm catalogs:check`; never copy values from a local `.env`.
- Deviations: the currently implemented Anthropic variables remain documented to keep the template aligned with source, but provider approval remains blocked because the canonical Product Specification still selects OpenAI.

## Pattern scan — Anthropic structured-output compatibility (2026-09-24)

- Exemplars consulted: `apps/app-api/src/modules/text-generation/providers/anthropic-text.provider.ts`, `openai-text.provider.ts`, `text-generation.service.spec.ts`, `apps/app-api/src/modules/scripts/script-writing.ts`, and `script-jobs.handler.ts`.
- End-to-end trace: `writeScript` mutation → credit hold + generation job → worker → `ScriptJobsHandler` → `TextGenerationService` → Anthropic Messages API structured output → Zod `scriptOutput` validation → allowlisted hook/scene coercion → script-version persistence → credit capture or release.
- Pattern decisions: keep the domain JSON schemas and Zod count validation authoritative; normalize only the schema sent to Anthropic because its structured-output API accepts `minItems` only as 0 or 1 and rejects `maxItems`; recurse through nested schema objects/arrays without mutating the source schema; keep OpenAI requests unchanged.
- Validation and error handling: add a provider-level regression assertion for nested array constraints, rerun text-generation/API tests and typecheck, then retry the real worker job and verify terminal completion, script persistence and credit capture; reseed afterward to restore canonical demo state.
- Deviations: provider-specific schema normalization is isolated in the Anthropic adapter. The stricter post-generation Zod parse remains mandatory, so relaxing the transport schema does not relax accepted product output.

## Pattern scan — Phase 19 render and Export video (2026-09-24)

- Exemplars consulted: `apps/app-api/src/modules/video-edits/` and `voice-tracks/` for tenant-scoped repository/service/resolver/module wiring and immutable media records; `apps/app-api/src/modules/generation-jobs/` for paid job creation, handler registration, retry and worker completion; `apps/app-web/features/scene-editor/scene-editor-page.tsx` and `creator-brief/brief-page.tsx` for workflow-step states, autosave, offline behavior, copy/download resources and responsive asides; `apps/app-web/react-query/video-edits/` and `generation-jobs/` for colocated GraphQL documents, derived operation hooks and targeted query keys.
- End-to-end trace: `exports.gql` → generated API types → `ExportsResolver` → `ExportsService` render/download gates → `ExportsRepository` plus `GenerationJobsService` → media-worker `RENDER_VIDEO` handler → `RenderService` / S3 → `react-query/exports/graphql/exports.ts` → `exports-operations.ts` → `ExportPage` loading, error, blocked, rendering, failed, ready, downloaded, changed and empty/history states.
- Pattern decisions: keep `Exports` immutable except `downloadedAt`; scope every read/write by the authenticated owner/workspace; start renders through the existing idempotent credit-hold job path; perform media/render/upload side effects before persisting terminal export success; fetch a fresh five-minute signed URL on every download; use TanStack Query for export/video/project server state and the existing autosave owner for `postCaption` / `adTag`; keep only disclosure, copied and download-error state local; reuse `StepPage`, `JobPanel`, cards, alerts, buttons and token utilities.
- Production mapping: server/cache owns exports, readiness, jobs, credits and the video edit; component state owns only the unsaved caption draft, `#ad` draft, copied feedback and open history disclosure. `renderVideo` is server-gated by readiness and credits, job completion invalidates exports/edit/project/list/credits, `createExportDownload` marks the first download and refreshes project metadata, and caption writes go through `updateVideoEdit` with server claim-checking and the 2,200-character limit.
- Validation and error handling: SDL owns transport shape; `ServiceValidatedArgs` plus service rules own render inputs; download/render controls are guarded and disabled while pending or offline; query failures render inline retry, mutation failures use safe toast/inline copy, and copy timers/object URLs are cleaned up. Validation order is focused API specs and render-tool specs, API/web typecheck and lint, web build, tenant-scope check, then the ffprobe fixture and Fidelity QA when a compliant FFmpeg toolchain is available.
- Deviations: the approved Product Specification explicitly defines a light-only token system and removed the boilerplate dark theme, so the generic `web-ui-design` dark-mode recommendation is not applied. The capped `projectExports` list remains a bounded flat list (50), as specified.

## Pattern scan — Phase 20 seed and privacy (2026-09-24)

- Exemplars consulted: `apps/app-api/src/scripts/seed-demo.ts` and `reset-local-dev.ts` for guarded application-context scripts and deterministic local data; `video-edits.service.ts` plus `repositories/video-edits.repository.ts` for the approved-script-to-edit record shape and No voiceover/text-card defaults; `apps/app-web/app/privacy-policy/page.tsx`, `sign-in/page.tsx` and `not-found.tsx` for static public Server Component routes, metadata and brand chrome.
- End-to-end trace: validated local seed environment → Nest application context → repository modules and DI tokens → deterministic owner/workspace/project/script ids → delete and recreate only the seeded projects' `VideoEdits` records → hero project `videoSummary`; privacy environment values → static route metadata → semantic branded reading page with no client state or data request.
- Pattern decisions: extend the existing seed module rather than call feature services; use the same deterministic id function and repository abstraction; seed one edit for blender v3 with every scene mapped to a `TEXT_CARD`, `VoiceSource.NONE`, no voice track, no audio/media asset and no export; write the matching project summary directly so resume opens Edit & preview. Keep privacy as a zero-JavaScript Server Component and extend its existing lists with direct provider/storage disclosures.
- State, validation and safety: seed runs only outside production, requires `SEED_OWNER_EMAIL`, remains owner/workspace scoped and deletes only records for the five deterministic demo project ids before recreating them. Running it twice must keep project, video-edit, voice-track and export counts unchanged. Privacy adds no persistence or runtime state.
- Validation order: focused API/web lint and typecheck, run the seed twice and compare collection counts plus the hero edit shape, then web build and the existing workspace gates. Browser polish and responsive/accessibility rows remain a separate Phase 20 QA step.
- Deviations: the seed mirrors the production record shape directly because it is deterministic fixture construction, not a user-facing write path. The approved Product Specification is light-only, so the generic `web-ui-design` dark-mode recommendation remains intentionally inapplicable.

## Pattern scan — Phase 22 AI scene clips (2026-09-25)

- Exemplars consulted: `.skills-source/skills/api-app/SKILL.md` (non-negotiables: media processing streams to temp files, side-effect ordering, model output and outbound fetches), `.skills-source/skills/web-app/SKILL.md`, `modules/voice/` (provider adapter: `isConfigured`, timeout, error mapping, zod-parsed responses), `modules/video-edits/voiceover-jobs.handler.ts` (media-worker handler registration on init, provider first, persist after), `modules/exports/exports.service.ts` (render handler), `modules/assets/assets.service.ts` (records, keys, delete object before row), `modules/generation-jobs/` (queues, runner, hold/capture/release), `features/media-mapping/`, `features/media-picker/`, `features/voice-studio/` (job panel in a card).
- End-to-end trace: sheet → `useGenerateSceneClipsMutation` → `generateSceneClips` → `AiClipsService.generate` (gates) → `GenerationJobsService.create` (HOLD 8) → media worker `MEDIA_JOB_QUEUE` → `AiClipJobsHandler` (crop source to 9:16 with FFmpeg → presigned GET → `MiniMaxVideoProvider` create ×2 → poll → stream download to a temp file → `RenderService.probe` → `S3Service.putObjectFromFile` → `AssetsService.createGeneratedClip`) → `complete(job, creditsUsed)` (CAPTURE used, RELEASE rest) → client polls `generationJob`, invalidates `projectAssets` and the video edit → Review → `checkAiClip` + `updateVideoEdit`.
- MiniMax endpoints (rechecked 2026-09-25 against platform.minimax.io docs): create `POST https://api.minimax.io/v2/video_generation` with `Authorization: Bearer <MINIMAX_API_KEY>`, body `{ model, content: [{ type: "text", text }, { type: "image_url", image_url: { url }, role: "first_frame" }], duration, resolution, ratio: "adaptive" }` → `task_id`; query `GET /v2/query/video_generation/{task_id}` → `task.status` (`queued` · `running` · `succeeded` · `failed` · `cancelled`), `task.content.url`, `task.error { code, message }`. `MiniMax-H3-Max` supports 480P/768P, 5–15 s. With a first frame the ratio is adaptive (it follows the image), so the worker crops the source photo to 9:16 first.
- Pattern decisions: generated clips are `Assets` (`origin AI_CLIP`) so picker, slot, preview and render read them unchanged; AI clips don't count toward the 20-file upload cap, are excluded from Fill from uploads and from the Product grid, and can fill a scene only once checked; the enablement check is one shared function used by the API and the video edit.
- Deviations: none from the recorded spec; the §5C poster frame uses the clip's own first frame in the browser (as uploaded clips do), so no server-side poster is generated.

## Pattern scan — Phase 22 AI clip storage-key fix (2026-09-25)

- Exemplars consulted: `apps/app-api/src/modules/s3/s3.service.ts` and `s3.service.spec.ts` (one allowlist enforced by every private-object operation), `apps/app-api/src/modules/exports/exports.service.ts` (server-built MP4/poster keys followed by S3 writes), `apps/app-api/src/modules/video-edits/voiceover-jobs.handler.ts` (server-built generated-media keys and cleanup), `apps/app-api/src/modules/generation-jobs/generation-jobs.runner.ts` and `generation-jobs.service.spec.ts` (typed handler failures preserved; other failures become `INTERNAL` and release credits), and `apps/app-api/src/modules/ai-clips/ai-clip-jobs.handler.ts` / its spec (frame and clip key producers).
- End-to-end trace: claimed `GENERATE_SCENE_CLIPS` job → source asset lookup and download → `buildAiClipFrameStorageKey` → crop → `S3Service.putObjectFromFile` / signed GET → MiniMax create and poll → `buildAiClipStorageKey` → S3 write → generated asset record → runner completion; any thrown error goes through `GenerationJobsRunner.process` to a stable `GenerationFailureCode` and credit release.
- Pattern decisions: keep the spec-backed `projects/<projectId>/ai-clips/` namespace; add only the two server-owned shapes (`<jobId>-frame.jpg` and `<assetId>.mp4`) to the existing exact S3 allowlist; centralize those two builders in the `ai-clips` domain so the handler and S3 contract spec cannot drift; retain traversal, extension and identifier rejection; convert unexpected handler errors to `INTERNAL` while preserving existing `GenerationJobError` codes.
- Validation and error handling: first reproduce the rejected real key shapes in `s3.service.spec.ts`; then require both handler-generated shapes to sign, malformed neighboring shapes to fail, and a pre-provider S3 exception to emerge as `GenerationFailureCode.INTERNAL` without calling MiniMax. Run focused S3, AI clip handler and generation-job specs before API typecheck, lint and build.
- Deviations: none. This extends the existing private-key allowlist instead of moving clips under `assets/`, because Product Specification §3.18 owns the `ai-clips/` namespace and cleanup/read paths already use it.

## Pattern scan — Phase 27 keep consistent and one-click clips (2026-09-25)

- Exemplars consulted: `.skills-source/skills/api-app/SKILL.md` and `web-app/SKILL.md` (non-negotiables), `video-edits.service.ts` (`directionsFor` / `pinnedVersion` legacy read), `voice-timing.ts` (pure module beside the service), `ai-clips.service.ts` `photosFor`, `ai-clip-jobs.handler.ts` input loop, `ai-clip-storage.ts` + `s3.service.ts` (the storage-key lesson), `media-picker-sheet.tsx`, `use-autosave.ts`.
- MiniMax v2 recheck (platform.minimax.io create-task reference and video guide, read 2026-09-25): `MiniMax-H3-Max` takes reference images ≤ 9 (and first/last frame ≤ 1 each), and image-to-video and reference-to-video roles are mutually exclusive in one request; images JPG/JPEG/PNG/WEBP/HEIC/HEIF, ≤ 30 MB, 256–5760 px, aspect ratio 0.4–2.5 (720 × 1280 = 0.56); with references `ratio` is optional (default adaptive) and may be `9:16`; 5–15 s at 480P or 768P. The docs have no index syntax for references; their example names them in words (“the character's appearance follows reference images 1 and 2”), so the one-click prompt says “the last reference image”. Stills from a video are not addressed; the still is an ordinary JPEG. `reference_video` also exists and could carry the previous clip itself — not used (out of scope, noted for later).
- End-to-end trace: Media row **Generate clip** → `useGenerateSceneClipsMutation` (`mode: CONSISTENT`, `oneClickClipPrompt`) → `AiClipsService.generate` → `consistentPhotos` (items incomplete / first scene gates; tagged photos; continuity source) → `GenerationJobsService.create` (HOLD 4) → media worker → `AiClipJobsHandler` (item photos → `portraitFrame`; continuity clip → `portraitStill` at `clipStart + duration`; indexed frames; all `reference_image`) → MiniMax → probe → S3 → `createGeneratedClip` (continuity ids) → Review as any clip. Keep consistent card → `useAutosave('keep-consistent')` → `updateVideoEdit.consistentItems` → `validateConsistentItems` → record.
- Pattern decisions: the list lives on the video edit (production data), not the script version; derived ids come from names so a legacy list read without storing stays addressable; the product row reads the live product title; the web gates from the saved video, the same state the server checks; the provider needed no change.
- Deviations: none from §3.21 beyond the recorded clarifications (product name ignored on write; the product's photo when no item is in the scene; “reference images” wording; the scene chips use the system chip style).

## Pattern scan — Phase 28 skit style and clip sound (2026-09-25)

- Exemplars consulted: `script-writing.ts` (schemas, prompt rules, allowlist coercion, `fitDuration`), `scripts.service.ts` (`update` partial edits, `flagsFor`, copies), `video-edits.service.ts` (`scenesFrom`, `voiceState`, `presentCaptions`, `renderSource`, `videoFingerprint`), `voice-timing.ts` (`buildSceneCaptions`, `spreadEvenly`), `render.service.ts` (`sceneArgs`, `audioArgs`, `clipPlaybackRate`), `features/script-studio/script-editor.tsx` (`saveScenes`, the Phase 23 autosave lesson), `features/voice-studio/voice-page.tsx` (`RadioCards`), `features/scene-editor/draft.ts` and `preview-player/`, `features/ai-scene-clips/clip-prompt.ts`.
- MiniMax audio (platform video guide and H3 prompt guides, read 2026-09-25): every H3 clip carries stereo audio made with the picture, and no request field switches it off or sets a language. A quoted line is spoken with matching mouth movement; a sentence or two fits a 5 s shot; foley tied to a visible action (“as”, “when”) is its strength; background music can be ruled out in the prompt; reference audio (≤ 3 clips) exists but isn't used. Filipino speech isn't documented. Live run: English `445586085634370`, Taglish `445585110557039` (text only, 9:16, 6 s, 480P; evidence in Implementation Plan Phase 28).
- End-to-end trace: Strategy style `SKIT` → `WRITE_SCRIPT` (`SKIT_SCRIPT_SCHEMA`, skit rules, `coerceScene(…, skit)`) → version `contentStyle`, scene `lines` / `sound` → Script Studio `SceneLines` → `updateScriptVersion` (`editLines`, fitted by `spokenText`) → approve → `startVideoEdit` (`scenesFrom` copies lines/sound, `clipSound` on, voice `SCENE`) → Media / Edit & preview (`clipSounds`, preview unmuted at level, 1×) → `renderVideo` → `renderSource` (`sound` per clip scene) → `RenderService` (1× clip, scene-sound bed, `alimiter`) → export snapshot `clipSound`.
- Pattern decisions: the skit is a second schema beside the narrated one, not new optional fields in it, so narrated prompts and output stay byte-identical; the version stamps its style so rewrites and the brief follow it; clip sound lives on the video edit (production data), off by default, so existing videos and export fingerprints don't change; `SCENE` captions are derived on read (like `NONE`) with wording edits stored by place, so they follow duration edits; the limiter joins the mix only with clip sound.
- Deviations: the Voice card's preselection is server-side (a skit's video starts on `SCENE`) rather than a client write; `clipSounds` uses 5% steps like music; clip sound is kept across a switch only within one style. All recorded in §3.22.

## Pattern scan — premise generation retry failure (2026-09-27)

- Exemplars consulted: `projects/premise-suggestions.handler.ts`, `projects/audience-suggestions.handler.ts` and `projects/angle-suggestions.handler.ts` (text-job handler registration, provider call, untrusted-output parsing and persistence); `generation-jobs.resolver.ts`, `generation-jobs.service.ts`, `generation-jobs.runner.ts` and `repositories/generation-jobs.repository.ts` (retry, claim, crash-loop guard and credit lifecycle); `react-query/generation-jobs/graphql/generation-jobs.ts` and `features/story-setup/story-page.tsx` (client retry mutation and polling).
- End-to-end trace: Story **Try again** → `retryGenerationJob` → `GenerationJobsResolver.retryGenerationJob` → `GenerationJobsService.retry` (fresh credit hold, failed job requeued) → repository atomic claim increments `attempts` → `GenerationJobsRunner.process` crash-loop guard → `PremiseSuggestionsHandler` → `TextGenerationService` → selected provider → validated premise set → `ProjectsService.setPremiseSuggestions` → job completion and credit capture → project cache invalidation.
- Evidence and root cause: the live failed `SUGGEST_PREMISES` job was still at step 0 with `attempts: 6` and `INTERNAL` / “The job stopped several times and was not retried again.” The explicit retry path cleared failure state but preserved `attempts`, so the runner rejected every retry before the premise handler or provider ran. `attempts` belongs to one queue run/reclaim cycle; a creator-authorized retry starts a new cycle and must reset it while retaining the same job id and idempotency record.
- Pattern decisions: keep the existing in-place retry, credit hold/release and tenant filter; reset only `attempts` with the other execution-state fields in the same conditional failed-to-queued update; add a regression that drives a job beyond the crash limit, retries it, and proves the handler can complete. No SDL, client, provider or premise-output contract changes.
- Validation: 15 focused premise-handler and generation-job tests pass; API typecheck, targeted ESLint, Prettier and `git diff --check` pass; watch-mode compilation reports 0 errors; `/health` is `ok` with MongoDB connected.
- Deviations: none.

## Pattern scan — Anthropic to DeepSeek fallback (2026-09-27)

- Exemplars consulted: `modules/text-generation/providers/anthropic-text.provider.ts` and `openai-text.provider.ts` (provider configuration, timeout, HTTP/error mapping and parsed untrusted JSON); `text-generation.service.ts` / `text-generation.service.spec.ts` (provider selection and service-level contract); `modules/voice/voice.service.ts` and `modules/video/video.config.ts` (configured-provider selection and failure behavior); `config/env.schema.ts`, both `.env.example` files and `docs/catalogs/environment.md` (validated runtime configuration and generated documentation).
- End-to-end trace: a text generation handler (`PremiseSuggestionsHandler`, `AudienceSuggestionsHandler`, `AngleSuggestionsHandler` or `ScriptJobsHandler`) → `TextGenerationService.generateJson` → primary `AnthropicTextProvider` → one `DeepSeekTextProvider` attempt after an eligible failure → handler-owned Zod parse and allowlisted coercion → domain persistence → generation-job completion and credit capture; if both providers fail, the DeepSeek `GenerationJobError` reaches the runner and the job fails with credit release.
- Pattern decisions: keep fallback orchestration in `TextGenerationService`, not in handlers; select providers through validated `TEXT_PROVIDER` / `TEXT_FALLBACK_PROVIDER`; deduplicate equal primary/fallback selections; allow the configured fallback to become the only active provider when the named primary is not configured; do not route around `PROVIDER_REJECTED`; send DeepSeek Chat Completions JSON mode with the domain schema appended to the prompt, then keep each handler's Zod parse authoritative.
- Validation and error handling: cover Anthropic failure → DeepSeek success, refusal without fallback, unavailable Anthropic → DeepSeek, duplicate provider selection, both-fail propagation, DeepSeek request shape and DeepSeek error mapping; run the focused Jest spec, API typecheck/lint/build, catalog check and diff check. Local runtime configuration is checked by variable name/status only; secret values are never printed or recorded.
- Deviations: DeepSeek has JSON-object mode rather than the strict JSON-schema transport used by Anthropic and OpenAI, so the schema is included as a system instruction and downstream domain validation remains the shape guarantee.
- Live premise failure (2026-09-27): three `SUGGEST_PREMISES` jobs reached step 1 and failed in about one second as `PROVIDER_REJECTED`; a minimal read-only diagnostic against the configured Anthropic model returned HTTP 400 `invalid_request_error` with “credit balance is too low.” The adapter had grouped that operator/billing failure with model refusals, so `NO_FALLBACK_CODES` suppressed DeepSeek. Adopted fix: recognize Anthropic billing responses (the SDK's `billing_error` type and its current low-credit message) as `PROVIDER_NOT_CONFIGURED`; retain `PROVIDER_REJECTED` and no fallback only for an actual model `stop_reason: refusal` and other request rejections. Add a regression proving low balance routes Anthropic → DeepSeek and succeeds.
- Live verification (2026-09-27): the API watcher reloaded the fix; the latest failed premise job was retried through `GenerationJobsService` with `attempts: 0`, then Anthropic correctly routed to DeepSeek. DeepSeek returned HTTP 401 `authentication_error` for the configured key, so the job ended `PROVIDER_NOT_CONFIGURED` at step 1 and persisted no premise set; Anthropic is also blocked by its empty provider balance and OpenAI is blank. The app credit hold was released. MiniMax is now the final configured fallback, but its separate `MINIMAX_TEXT_API_KEY` is blank; a Token Plan Subscription Key, valid DeepSeek key or funded Anthropic account is the remaining external blocker. No mock/local premise may replace this production path.
- Validation (2026-09-27): focused premise/job/provider suites 33/33 and full API 55 suites / 476 tests pass; API typecheck, targeted lint, build and `git diff --check` pass. Live retry credit balance returned to 60 with 0 held.

## Pattern scan — MiniMax final text fallback (2026-09-27)

- Exemplars consulted: `modules/text-generation/providers/anthropic-text.provider.ts`, `deepseek-text.provider.ts` and `openai-text.provider.ts` (provider boundary, timeout/error mapping, schema instructions and untrusted JSON parsing); `text-generation.service.ts` / `text-generation.service.spec.ts` (selection, fallback and refusal policy); `modules/video/providers/minimax-video.provider.ts` (existing MiniMax HTTP/key isolation); `config/env.schema.ts`, both `.env.example` files and the generated environment catalog (validated runtime configuration).
- End-to-end trace: text generation handler → `TextGenerationService.generateJson` → configured primary Anthropic → configured fallback DeepSeek → configured final fallback MiniMax M3 over MiniMax's Anthropic-compatible Messages endpoint → handler-owned Zod parse/allowlist → persistence → generation-job completion and credit capture. Any actual model refusal stops the chain; if every eligible provider fails, the final provider error reaches the runner and releases the credit hold.
- Pattern decisions: generalize fallback configuration to ordered `TEXT_FALLBACK_PROVIDERS` while retaining the singular `TEXT_FALLBACK_PROVIDER` as a backwards-compatible one-item fallback; deduplicate providers; skip unconfigured entries; keep `MINIMAX_TEXT_API_KEY` separate from the existing pay-as-you-go `MINIMAX_API_KEY` used by video because MiniMax documents Subscription Keys and standard API keys as non-interchangeable; default text model to `MiniMax-M3`; use the officially recommended Anthropic-compatible endpoint and put the JSON schema in the system instruction because MiniMax does not document Anthropic structured-output parameters.
- Validation and error handling: cover Anthropic failure → DeepSeek failure → MiniMax success, request shape, malformed/truncated output, authentication/billing failures and refusal behavior; run focused and full API tests, typecheck, targeted lint, API build, catalog check and diff check. Never log or record either MiniMax key.
- Deviations: MiniMax's transport does not enforce the supplied JSON schema. As with DeepSeek, the prompt carries the schema and the existing handler-level Zod parse remains authoritative. Token Plan is used only because the product owner explicitly selected it as the last fallback; MiniMax describes Token Plan as intended for individual/interactive usage rather than production traffic.
- Validation (2026-09-27): focused provider suite 21/21 and full API suite 55 suites / 479 tests pass; API typecheck, targeted lint, build, catalog generation and `git diff --check` pass. The local chain is `anthropic` → `deepseek` → `minimax`; no live MiniMax request was made because `MINIMAX_TEXT_API_KEY` is not configured.
- Live verification (2026-09-27): configured a separate Token Plan Subscription Key and corrected `MINIMAX_TEXT_MODEL` to `MiniMax-M3`. A minimal live call returned valid JSON. Retried failed `SUGGEST_PREMISES` job `6ab800c84ffc91af4ae44b9d` through the application service: Anthropic returned `PROVIDER_NOT_CONFIGURED`, DeepSeek returned `PROVIDER_NOT_CONFIGURED`, MiniMax completed the request, the job reached step 3/3 with no failure, and exactly 3 valid premises were persisted. One credit was captured (balance 50 → 49) and the hold returned to 0.

## Dependency map

1. Phase 1 trim → Phase 2 API foundations → Phase 3 tokens/shell → Phase 4 sign-in.
2. Phase 6 projects → Phase 7 workflow shell → Phases 8 → 9 → 10 → 11 → 12 → 13 → 14.
3. Phase 5 seed ran after the Phase 6–12 schemas; MongoDB connectivity and an idempotency rerun are verified.
4. Within a phase: SDL → API types codegen → repository → service (+ specs) → resolver → web codegen → operations → UI.
5. Batch 2: gate ✓ → Phase 15 foundations (worker, claim by type, audio uploads, env) → 16 Media → 17 Voice (live runs need ElevenLabs keys) → 18 Edit & preview → 19 Render + Export (needs FFmpeg in the worker) → 20 seed/privacy/QA and `VIDEO_BETA_ENABLED`.
6. Phase 23: gate ✓ + fold-in ✓ → 23.1 SDL + codegen → 23.2 API (scripts and video edits in parallel; render after video edits; seed last) → 23.3 web (Script after scripts; Edit & preview and preview player after video edits; Export after the snapshot) → 23.4 live run and Spec QA.

## Phase 0 — Environment and identity

References: Product Specification §0 · Implementation Plan Phase 0

- [x] [root] Configure `MONGODB_URI` (database `ai-creation-platform`) in `apps/app-api/.env`
  - Req: PS §0 · IP P0 · Accept: API compiles and connects without exposing the value · Validate: `pnpm api` compiled with 0 errors and logged `MongoDB connection established` on 2026-09-24; listener then stopped at `EADDRINUSE` because port 3001 was already occupied
- [x] [api/web] Add variable names (no values) to `.env.example` files: `OPENAI_API_KEY`, `OPENAI_TEXT_MODEL`, `ANTHROPIC_API_KEY`, `ANTHROPIC_TEXT_MODEL`, `TEXT_PROVIDER`, `STARTER_CREDITS`, `PRODUCT_IMPORT_ALLOWED_HOSTS`, `SEED_OWNER_EMAIL`; web `NEXT_PUBLIC_APP_NAME=AI Creation Platform`
  - Req: IP P0 · Accept: examples list every new variable · Validate: review
  - Reconciliation 2026-09-24: revised — acceptance now includes the approved Anthropic names; already present in both examples and the environment catalog (`pnpm catalogs:check` passes), so `[x]` stands
- [x] [root] Design documents, build documents and this tracker written (2026-09-24)

## Phase 1 — Boilerplate trim

References: Product Specification §0, §1 · Implementation Plan Phase 1 (Boilerplate Trim List)

### 1.1 Mobile app removal

- [x] [root] Delete `apps/app-mobile`; remove root `mobile` script; update `boilerplate-sync.config.json`, `.github/workflows/ci.yml`, `scripts/project-init.mjs` (tolerate the missing app) and README
  - Deps: none · Accept: no live reference to `app-mobile` outside history docs; `pnpm install` succeeds · Validate: `grep -r app-mobile` review, `pnpm install`
- [x] [root] Regenerate `pnpm-lock.yaml`
  - Validate: `pnpm install --frozen-lockfile` passes afterward

### 1.2 Web trim

- [x] [web] Remove `app/(super-admin)`, `app/admin`, `app/login`, `app/delete-account`; features `admin-management`, `admin-shell`, `dashboard`, `organizations`, `push-tester`, `super-admin-shell`, `delete-account`; `features/auth` login form, login page, super-admin guard
- [x] [web] Remove `react-query/account-deletion-requests`, `admin-management`, `organizations`, `payments`, `push-notifications`
- [x] [web] Remove `i18n/`, `proxy.ts`, next-intl plugin/provider/dependency; theme provider/toggle; `components/ui/sidebar.tsx`; admin-only `components/core` files
- [x] [web] Adapt `app/layout.tsx` (metadata “AI Creation Platform”, `lang="en"`), `providers/app-providers.tsx`
  - Accept (1.2): `pnpm --filter app-web exec tsc --noEmit` and `next build` pass with no admin routes · Validate: typecheck, lint, build

### 1.3 API trim

- [x] [api] Remove `payments`, `store-purchases`, `push-notifications`, `push-tokens`, `notifications` modules, SDL, env vars (Xendit, IAP, Expo push), `AppModule` imports, tenant-scope entries, specs; regenerate API types
  - Accept: API compiles; remaining specs pass; tenant-scope check passes · Validate: `pnpm --filter app-api exec tsc --noEmit`, `jest`, `pnpm check-tenant-scope`
- [x] [web] Re-run web codegen after SDL removal
  - Validate: `pnpm --filter app-web codegen` then typecheck

## Phase 2 — API foundations

References: Product Specification §3.11 · Implementation Plan Phase 2

### 2.1 Credits

- [x] [api] SDL `credits.gql`: `CreditSummary { balance held recentUsage: [CreditUsage!]! }` (capped 5), `CreditUsage { id label projectTitle amount kind createdAt }`, `myCredits: CreditSummary!`
- [x] [api] `credits` module: `CreditAccounts`, `CreditEntries` repositories (one factory per file); `CreditsService.grant/hold/capture/release/summary`; hold uses a conditional `updateOne({ ownerId, balance: { gte: cost } })`
- [x] [api] Specs: grant, hold success, insufficient balance → `ConflictError`, capture, release, summary ordering
  - Accept: balance never negative; every change writes an entry · Validate: jest

### 2.2 Generation jobs

- [x] [api] SDL `generation-jobs.gql`: `GenerationJob`, enums `GenerationJobType`, `GenerationJobStatus`, `GenerationFailureCode`; `generationJob(id)`, `projectJobs(projectId, active)` (capped 20), `retryGenerationJob(id)`
- [x] [api] `generation-jobs` module: repository (unique `{ ownerId, idempotencyKey }`), `GenerationJobsService.create` (idempotent: existing key returns the existing job; holds credits), `claimNext`, `markStep`, `complete` (capture), `fail` (release), `retry` (failed → queued, re-hold)
- [x] [api] `GenerationWorker` with `@Interval(1000)`, `SCHEDULER_ENABLED`, lease reclaim, handler registry (`GENERATION_JOB_HANDLERS` token)
- [x] [api] Specs: idempotent create, claim race (second claim false), success capture, failure release, retry re-hold, ownership on read
  - Accept: no double charge on repeated key or retry · Validate: jest

### 2.3 Text generation and claim check

- [x] [api] `text-generation` module: `TextGenerationService.generateJson(schemaName, schema, messages)` → `OpenAiTextProvider`, `AnthropicTextProvider`, `DeepSeekTextProvider` or `MiniMaxTextProvider` selected by `TEXT_PROVIDER` (3-minute timeout; JSON schema output where supported, otherwise prompt schema); `TEXT_FALLBACK_PROVIDERS` supplies an ordered fallback chain after eligible failures and singular `TEXT_FALLBACK_PROVIDER` remains compatible; config via validated env; none configured → `PROVIDER_NOT_CONFIGURED`
  - Reconciliation 2026-09-24: revised — Anthropic approved (PS §0, §3.11). Evidence: `anthropic-text.provider.ts` + specs pass; all four handlers completed against the live Anthropic model on the blender seed; `[x]` stands
  - Evidence 2026-09-27: DeepSeek provider and Anthropic → DeepSeek fallback implemented; refusal is not retried; local runtime selects Anthropic then DeepSeek by variable name only. Focused 17/17 and full API 55 suites / 475 tests pass; API typecheck, targeted lint, build, catalog check and `git diff --check` pass. No paid live generation was run.
- [x] [api] `ClaimCheckService` (exported from `facts`): categories PERFORMANCE, HEALTH, GUARANTEE, SUPERLATIVE, PRICE_STOCK, TESTIMONIAL, NOT_APPROVED_FACT; English + Filipino terms; `normalizeClaim`
- [x] [api] Specs for both (provider error mapping with a mocked fetch; claim rules table-driven)
- [x] [root] `tenant-scope.config.json` entries for `credits`, `generation-jobs`, `text-generation`, `projects`, `assets`, `facts`, `scripts`
  - Validate: `pnpm check-tenant-scope`

## Phase 3 — Design tokens, primitives, app shell

References: Product Specification §1, §2, §3.2 · Implementation Plan Phase 3

- [x] [web] `app/globals.css`: §1 tokens, Tailwind `@theme` mapping, type classes (`t-*`), motion tokens, reduced-motion rules, `scroller` utility, focus ring base
- [x] [web] Restyle primitives: button (variants primary/secondary/ghost/danger, sizes, `cost` segment, press scale), input, textarea, checkbox, select, toggle-group chips + segment, badge (neutral/success/warning/danger/info/ink, no-dot), new `banner`, dialog (bottom sheet < 640), sheet (drawer), dropdown-menu, popover, tooltip, skeleton, sonner
- [x] [web] `components/brand/brand-mark.tsx` (default/stage) and `app/icon.svg`
- [x] [web] `hooks/use-online-status.ts`
- [x] [web] `react-query/credits/` (`myCredits`), `features/app-shell/` (top bar, credits popover, account menu, offline banner), `app/(app)/layout.tsx`
  - Accept: matches DR §3 at 1440 and 390 · Validate: typecheck, lint, Fidelity QA app-shell column

## Phase 4 — Google sign-in with provisioning

References: Product Specification §3.1 · Implementation Plan Phase 4

- [x] [api] Extend `GoogleAuthService.loginWithGoogle`: provision user (role USER, names from token) + workspace organization + `CreditsService.grant(STARTER_CREDITS)` when no account matches a verified identity; keep inactive and unverified-email rejections
- [x] [api] Specs: new identity provisions once (second sign-in finds it), inactive rejected, unverified email not provisioned, existing email adopts
- [x] [web] `app/sign-in/page.tsx`, `features/sign-in/` (stage panel, GIS button `continue_with` with measured width, Turnstile when enabled, 8 states, safe `returnTo`)
- [x] [web] Guarded `(app)` layout redirect with `returnTo`; expired-session redirect; sign out → `reason=signed-out`; `app/page.tsx` redirect
  - Accept: DR §5.2 states reproducible (error via API down, unavailable via missing client id, offline via devtools) · Validate: typecheck, lint, Fidelity QA sign-in column
  - Reconciliation 2026-09-24: blocker resolved — Google OAuth configured, `QA-BYPASS(Phase 0)` removed; a real first sign-in provisioned account, workspace, 50 credits and a session. Remaining `🔁`: `returnTo` deep link and expired-session redirect in the browser

## Phase 5 — Seed data

References: Product Specification §5 · Implementation Plan Phase 5

- [x] [api] `src/scripts/seed-demo.ts` + `seed:demo` script; idempotent by `seedKey`; requires `SEED_OWNER_EMAIL`; all §5 records
- [x] [api] Run the seed against the configured database using the configured local development sign-in identity; rerun verifies idempotency, all five canonical projects and 128 credits while preserving one unrelated project
  - Reconciliation 2026-09-24: revised — reseeded twice under the product owner's Google account (`SEED_OWNER_EMAIL` now set locally): 5 seeded projects, 18 facts, 4 versions, 1 failed job, one credit account 128/0; the owner's own project preserved

## Phase 6 — Projects API + dashboard

References: Product Specification §3.3 · Implementation Plan Phase 6

- [x] [api] SDL `projects.gql` (Project, ProjectStage, ProjectStep, filter/sort inputs, connection, counts; product/strategy types used later)
- [x] [api] `projects` module: repository (embedded product, strategy, angle suggestions), service (create, rename, duplicate incl. S3 copy and version copy, list, counts, steps, currentStep, stage, thumbnail), resolver with auth guard
- [x] [api] Specs: owner isolation (other owner → `ForbiddenError`), rename validation, duplicate copies and keeps original, steps/lock rules
- [x] [web] `react-query/projects/` operations + keys
- [x] [web] `app/(app)/projects/page.tsx` + `features/dashboard/` (head, filters, sort, grid, card, menu, rename dialog, all states, load more)
  - Accept: DR §5.3 · Validate: typecheck, lint, jest, Fidelity QA dashboard column

## Phase 7 — Project workflow shell

References: Product Specification §3.4 · Implementation Plan Phase 7

- [x] [web] `app/(app)/projects/[projectId]/layout.tsx` + `page.tsx` (resume)
- [x] [web] `features/project-workflow/`: rail, step strip, head + save state, footer, route states (not found / no access), locked redirect banner, `use-autosave`, leave-unsaved guard (`useGuardedNavigation`, `beforeunload`)
  - Accept: DR §4 · Validate: Fidelity QA workflow column

## Phase 8 — Product setup

References: Product Specification §3.5 · Implementation Plan Phase 8

- [x] [api] `updateProduct` (field sources), `importProduct` (`ProductImportService`), `clearImportedProductValues`, `continueToFacts` (gate + fact creation)
- [x] [api] `s3` extensions: `createPresignedGetUrl`, `headObject`, `deleteObject`, `copyObject`; video content types
- [x] [api] `assets` module: `projectAssets`, `createAssetUpload`, `completeAssetUpload`, `removeAsset` (limits, rights, keys, replace)
- [x] [api] Specs: import allowlist/timeout/partial fill, field sources, continue gate, upload validation, remove deletes object first
- [x] [web] `react-query/assets/`, product operations; `features/product-setup/` (form schema, autosave, import card, uploader with XHR progress, tiles, remove dialog, aside, states)
  - Accept: DR §5.5 · Validate: typecheck, lint, jest, Fidelity QA product column
  - Reconciliation 2026-09-24: blocker resolved — AWS keys configured, bucket CORS added (README “S3 bucket CORS”); upload → complete → preview → remove passed end to end. Remaining `🔁`: in-browser uploader (XHR progress, tiles, replace) after signed-in session

## Phase 9 — Fact review

References: Product Specification §3.6 · Implementation Plan Phase 9

- [x] [api] SDL `facts.gql`; `facts` module: repository, service (status, text, add, remove, flags, downstream NEEDS_REVIEW), resolver
- [x] [api] Specs: creator-only removal, edit resets status, downstream rule, cap 50
- [x] [web] `react-query/facts/`; `features/fact-review/` (meter, filters, rows with optimistic status + rollback, editor, add/remove dialogs, aside, banners, states)
  - Accept: DR §5.6 · Validate: Fidelity QA facts column

## Phase 10 — Strategy and angle suggestions

References: Product Specification §3.7 · Implementation Plan Phase 10

- [x] [api] `updateStrategy`; `suggestAngles` + `SUGGEST_ANGLES` handler (approved facts only, coerced output, fingerprint)
- [x] [web] `react-query/generation-jobs/` (job polling), strategy operations; `features/strategy/` (cards, chips, segment, angle radio cards, own angle, job states, aside, footer with credits and gates)
  - Accept: DR §5.7 · Validate: Fidelity QA strategy column
  - Reconciliation 2026-09-24: blocker resolved — text provider approved and configured (Anthropic); `SUGGEST_ANGLES` completed live. Remaining `🔁`: browser job-panel completion state

## Phase 11 — Script writing and Script Studio

References: Product Specification §3.8 · Implementation Plan Phase 11

- [x] [api] SDL `scripts.gql`; `scripts` module: repository, `writeScript` + `WRITE_SCRIPT` handler, `scriptVersions`, `updateScriptVersion` (draft-only, flags, spoken length)
- [x] [web] `features/script-studio/` job panel, hook rail (scroller + pager), scene blocks, caption, aside cards, banners, autosave

## Phase 12 — Rewrites, versions, approval

References: Product Specification §3.8 · Implementation Plan Phase 12

- [x] [api] `rewriteHook`, `rewriteScene` handlers; `approveScriptVersion` gates; `copyScriptVersion`
- [x] [api] Specs: approved immutable, approve rejects with flags/no hook/running job, rewrite touches only its target, copy origin
- [x] [web] Per-item rewrite states, history drawer, approve dialog, banners, footer switch
  - Accept: DR §5.8 · Validate: Fidelity QA script column

## Phase 13 — Creator brief

References: Product Specification §3.9 · Implementation Plan Phase 13

- [x] [api] `CreatorBriefService` + `creatorBrief` (exact text structure, filename, newer-draft detection) + spec
- [x] [web] `features/creator-brief/` (banners, brief card, copy, download, aside)
  - Accept: DR §5.9 · Validate: Fidelity QA brief column

## Phase 14 — Privacy, not found, polish, accessibility, QA

References: Product Specification §3.10, §7 · Implementation Plan Phase 14

- [x] [web] Adapt `app/privacy-policy`, `app/not-found.tsx`, `app/error.tsx`, `app/global-error.tsx`, `app/loading.tsx`
- [x] [web] impeccable audit + polish; design-engineering motion review
- [x] [web] Keyboard, screen-reader, reduced-motion and 360/390/820/1024/1440 passes
- [x] [root] Update `design/planning/screen-inventory.md` statuses and the plan checkboxes

## Batch 2 gate

References: Implementation Plan “Batch 2 gate”

- [x] [root] Product owner approved Design Reference §5B and Product Specification §3.12–§3.16 (2026-09-24); each §5.12–§5.15 section records `Approved: 2026-09-24`
  - Reconciliation: added; replaces the former “Phase 15+ — Batch 2 `⚠ needs spec`” placeholder (history: decisions 2, 4, 5 resolved as R13–R15, then R16–R18 recorded, then drafted and approved on 2026-09-24)

## Phase 15 — Batch 2 foundations

References: Product Specification §3.12 · Implementation Plan Phase 15 · Design Reference §5B failure copy

### 15.1 Contract

- [x] [api] Extend `graphql/schemas/generation-jobs.gql`: `GenerationJobType` + `GENERATE_VOICEOVER`, `ALIGN_RECORDING`, `RENDER_VIDEO`; `GenerationFailureCode` + `RECORDING_MISMATCH`, `UNREADABLE_MEDIA`, `MEDIA_MISSING`, `RENDER_TIMEOUT`
  - Deps: gate · Accept: SDL compiles; existing text job behavior unchanged · Validate: `pnpm --filter app-api generate-graphql-types`, API typecheck, jest
- [x] [api] Extend `graphql/schemas/assets.gql`: `AssetPurpose { MEDIA RECORDING MUSIC }` on `CreateAssetUploadInput.purpose` (default `MEDIA`) and `ProjectAsset.purpose`
  - Deps: gate · Accept: omitting `purpose` behaves exactly as today · Validate: API types regenerated; existing assets specs pass
- [x] [web] Regenerate web codegen; extend the job failure-copy map with the Batch 2 causes (DR §5B “Batch 2 failure copy”, verbatim)
  - Deps: both SDL tasks · Validate: `pnpm --filter app-web codegen`, web typecheck

### 15.2 Job claiming and leases `[BP] extend generation-jobs`

- [x] [api] `GenerationJobsRepository.claimNext(now, leaseUntil, types)` adds `type: { $in: types }` to the atomic `QUEUED → RUNNING` update; `TEXT_JOB_TYPES` / `MEDIA_JOB_TYPES` constants in `generation-jobs.types.ts`; `GenerationJobsWorker` claims `TEXT_JOB_TYPES` only
  - Accept: a text worker never claims a media job and vice versa; the claim stays a single conditional update · Validate: spec “claims only its own types”, existing claim-race spec
- [x] [api] `GenerationJobsService.renewLease(job)` (conditional on `status: RUNNING` and the job id) + 120 s media lease; expired-lease reclaim unchanged
  - Accept: a running media job is not reclaimed while heartbeating; a crashed one is reclaimed after its lease · Validate: renew spec ✓; reclaim is the unchanged repository query (not unit-tested; the spec double does not model leases)

### 15.3 Media worker process

- [x] [api] `src/worker.ts` + `MediaWorkerModule` (application context: config, Mongoose, repositories, `s3`, `credits`, `generation-jobs`; no HTTP or GraphQL) with a `@Interval` claim loop over `MEDIA_JOB_TYPES`, 30 s lease heartbeat, `SCHEDULER_ENABLED` honoured
  - Accept: the process boots without opening a port; with no media jobs it idles · Validate: boot locally; unit spec for the loop with a stub handler
- [x] [api] Worker boot checks: `ffmpeg -version` / `ffprobe -version` (paths from `FFMPEG_PATH` / `FFPROBE_PATH`), required `libx264`, `libass`, `drawtext`; `ELEVENLABS_API_KEY` without `ELEVENLABS_VOICE_IDS` fails fast
  - Accept: a missing binary or filter exits with a named, actionable error · Validate: spec with a stubbed spawn
- [x] [api] Nx/package targets for the worker (dev with watch, prod from `dist`); README run instructions
  - Validate: `pnpm build` ✓ (`dist/worker.js`); `node dist/worker` refuses to start on the local FFmpeg (“FFmpeg lacks filters: drawtext, ass”), and with a stub toolchain runs with 0 listening ports and shuts down cleanly

### 15.4 Audio uploads `[BP] extend assets + s3`

- [x] [api] `AssetsService.createUpload` honours `purpose`: audio MIME allowlist (`audio/mpeg`, `audio/mp4`, `audio/x-m4a`, `audio/wav`, `audio/x-wav`), ≤ 20 MB, recordings ≤ 90 s (client-reported, advisory), rights required for every purpose, audio not counted in the 20-file media cap, one current recording and one current music per project (a new upload replaces the old object and record)
  - Accept: ProductSpec §3.12 “Audio uploads” rules hold server-side · Validate: specs per rule incl. wrong tenant
- [x] [api] `S3Service` key pattern admits `projects/<id>/audio/<id>.<ext>` (and later `voice/`, `exports/`) without loosening the private-key check for other shapes
  - Accept: arbitrary keys are still rejected · Validate: s3 spec table for allowed and rejected keys

### 15.5 Configuration and tenancy

- [x] [api/root] Env names in `env.schema.ts`, root and app `.env.example`, `pnpm catalogs`: `ELEVENLABS_API_KEY`, `ELEVENLABS_MODEL_ID`, `ELEVENLABS_VOICE_IDS`, `FFMPEG_PATH`, `FFPROBE_PATH`, `RENDER_TMP_DIR`, `VIDEO_BETA_ENABLED` (default false)
  - Accept: names only, no values · Validate: `pnpm catalogs:check`, API typecheck
- [x] [root] `tenant-scope.config.json`: `render` declared `no-persistence`
  - Validate: `pnpm check-tenant-scope` ✓
  - Reconciliation 2026-09-24: revised — the checker rejects entries for modules not on disk, so `video-edits`, `voice-tracks` and `exports` are declared with their modules (tasks 16.1, 17.2, Phase 19)

### 15.6 Evidence (2026-09-24)

- API: typecheck ✓ · `pnpm lint` 3 projects ✓ · jest 28 suites / 162 tests ✓ (new: claim-by-type, lease heartbeat, audio purpose rules, one current recording, audio excluded from media list, S3 key shapes, FFmpeg toolchain) · `pnpm catalogs:check` ✓ · `pnpm check-tenant-scope` ✓ · `pnpm build` ✓ · API booted on a spare port and served the new `GenerationJobType` values.
- Web: codegen regenerated · `tsc --noEmit` ✓ · `FAILURE_CAUSE` replaced by `failureCause(type, code)` (Strategy and Script Studio consumers updated).
- Design notes: claim and process logic moved into `GenerationJobsRunner` (exported); `GenerationJobsWorker` (text) is registered only in `AppModule` and `MediaJobsWorker` only in `MediaWorkerModule`, so one handler registry per process and no worker runs in the wrong process. `RenderToolchainCheck` runs in `onModuleInit`, before intervals start in `onApplicationBootstrap`.

## Phase 16 — Video edit API + Media

References: Product Specification §3.13 · Design Reference §5B shared surfaces, §5.12 · Implementation Plan Phase 16

### 16.1 Production mapping (API)

- [x] [api] SDL `video-edits.gql`: `VideoEdit`, scene media types, captions, voice settings, music, `VideoEditReadiness`, `UpdateVideoEditInput`; `videoEdit(projectId)`, `startVideoEdit`, `updateVideoEdit`, `autoFillSceneMedia`, `switchVideoEditVersion`
  - Deps: Phase 15 · Validate: API types regenerated
- [x] [api] `video-edits` module: `VideoEditsRepository` (unique per project, tenant-scoped), `VideoEditsService`, `VideoEditsResolver` (auth guard, `CurrentOwner`)
  - Accept: start copies on-screen text and durations from the approved version and never mutates it; start is idempotent; project → `MEDIA_REVIEW` · Validate: specs for start, idempotency, wrong tenant
- [x] [api] Media writes: scene media validation (ready `MEDIA` asset of the project, clip start rule, text card), `autoFillSceneMedia` (empty scenes only, upload order, free), `switchVideoEditVersion` (keep media where position + purpose match; voiceover outdated)
  - Accept: DR §5.12 rules hold server-side · Validate: specs per rule
- [x] [api] `readiness` computation (`mediaComplete`, `voiceSettled`, `voiceOutdated`, `flags`, `blocking`, `changedSinceExport`, `latestExportNumber`) and `newerApprovedVersion`
  - Validate: table-driven spec
- [x] [api] `ProjectsService.steps` / `currentStep` / resume: `MEDIA`, `VOICE`, `EDIT`, `EXPORT` with DR §5B locks and reasons, returned only when `VIDEO_BETA_ENABLED`
  - Accept: flag off → Batch 1 steps exactly as today · Validate: projects spec for both flag states

### 16.2 Web

- [x] [web] `react-query/video-edits/` (graphql documents, operations, keys `['video-edit', projectId]`) with `setQueryData` from mutation results and project invalidation on readiness changes
  - Deps: 16.1 · Validate: web codegen, typecheck
- [x] [web] `features/project-workflow/`: Produce group, Export row, “Step n of 9”, Batch 2 locked reasons, driven only by the server `steps`
  - Accept: DR §5B shared surfaces; flag off renders no Batch 2 row · Validate: Fidelity QA workflow rows
- [x] [web] `features/script-studio/` footer: **Continue to media** primary + **Open creator brief** secondary when the viewed version is approved and the Media step exists (`script-studio.continue-to-media`)
- [x] [web] `features/media-picker/` sheet (filter, radio tile grid, “In scene n”, Text card, in-sheet uploader reusing the Product uploader, Cancel / Use this)
- [x] [web] `app/(app)/projects/[projectId]/media/page.tsx` + `features/media-mapping/` (rows, slot, motion, clip start with range hint/error/short-clip warning, Change/Clear, Fill from uploads, version banner, aside, footer gate, autosave via `use-autosave`, all DR §5.12 states)
  - Accept: DR §5.12 at 1440 and 390 · Validate: typecheck, lint, Fidelity QA Media column

### 16.3 Evidence (2026-09-24)

- API: `video-edits.gql` + module (repository unique per project, service, resolver), `ScriptsService.currentApproved`, `ProjectsService.syncVideo` + optional `videoSummary`, `computeProgress(record, { videoBeta })` with MEDIA/VOICE/EDIT/EXPORT, locks and resume; `video-edits` tenant-scoped entry. Specs: video-edits 10 (start idempotency and status, approval gate, photo/clip/text-card media, clip start rule, autofill order, removed file reads empty, version switch keeps position+purpose media, on-screen claim flags, wrong tenant) and projects +5 (beta off unchanged, rail order, resume per video state, approval lapse relocks Media). API jest 29 suites / 178 tests ✓.
- Real database (water-bottle seed, restored afterwards): start → `MEDIA_REVIEW`, idempotent, autofill with no uploads leaves 3 empty, all text cards → media complete, steps `…MEDIA:DONE VOICE:OPEN EDIT:LOCKED BRIEF:OPEN EXPORT:LOCKED`, resume `VOICE`.
- Web: `react-query/video-edits/`, asset fragment gains `purpose`, rail Produce group + numbering + “Step n of N”, locked banners, Script footer **Continue to media**, shared `components/studio/media-thumb.tsx`, `features/media-picker/` (reuses `useAssetUploads` and `UploadTile`), `features/media-mapping/` + route. Typecheck, lint, build ✓.
- Open: browser Fidelity QA (signed-in session, `VIDEO_BETA_ENABLED=true`); **Continue to voice** targets `/voice`, built in Phase 17.

## Phase 17 — Voice

References: Product Specification §3.14 · Design Reference §5.13 · Implementation Plan Phase 17

### 17.1 Provider adapter

- [x] [api] `voice` module (no persistence): `VoiceProvider` interface + `ElevenLabsVoiceProvider` — voices by allowlist (1 h in-memory cache), text-to-speech with timestamps (per scene, neighbour context), forced alignment; `AbortSignal.timeout(60s)`; error mapping `PROVIDER_TIMEOUT` / `PROVIDER_REJECTED` / `PROVIDER_NOT_CONFIGURED`
  - Accept: endpoints and fields rechecked against current ElevenLabs docs and recorded in the pattern scan · Validate: specs with recorded fixtures and a mocked fetch
  - ⚠ blocked for live validation: `ELEVENLABS_API_KEY`, `ELEVENLABS_MODEL_ID`, `ELEVENLABS_VOICE_IDS` not configured (open decision 17 picks the voices). Implementation complete and covered by mocked-fetch specs.

### 17.2 Tracks, jobs and captions

- [x] [api] SDL `voice-tracks.gql`: `VoiceOption`, `VoiceTrack`, segments and words; `voiceOptions`, `generateVoiceover`, `alignRecording`
- [x] [api] `voice-tracks` module: immutable `VoiceTracksRepository`, `voiceOptions`, `generateVoiceover` (2 credits, idempotency key) + `GENERATE_VOICEOVER` handler registered in the media worker; segments stored under `projects/<id>/voice/<trackId>/`
  - Accept: provider call first, persistence after; failure releases credits; pronunciations never change the script · Validate: handler specs (success, provider failure, retry)
- [x] [api] `alignRecording` (1 credit) + `ALIGN_RECORDING` handler: ffprobe read, forced alignment, `RECORDING_MISMATCH` below the confidence threshold, per-scene ranges
  - Validate: specs incl. unreadable file and mismatch
- [x] [api] `CaptionBuilder` (pure): scene boundaries, sentence punctuation, ≤ 2 × 32 characters, ≥ 0.8 s, word timings kept, `NONE` source → one line per scene; used by both handlers and `resetCaptions`
  - Validate: table-driven spec
- [x] [api] Staleness: `voiceOutdated` (version mismatch, blocking) vs settings changed (non-blocking)
  - Validate: readiness spec

### 17.3 Web

- [x] [web] `components/core/audio-player.tsx` (play/pause, scrubber with `aria-valuetext`, `t-mono` time, one audio source per page)
- [x] [web] `react-query/voice-tracks/` operations and keys; job seeding and credit invalidation as the Strategy pattern
- [x] [web] `app/(app)/projects/[projectId]/voice/page.tsx` + `features/voice-studio/` (source cards, voice picker with samples, speed, pronunciations, paid generate, job panel, recording rights/upload/timing/replace/remove dialog, track row with scene timing, banners, aside, footer gates, all DR §5.13 states)
  - Accept: DR §5.13 at 1440 and 390 · Validate: typecheck, lint, Fidelity QA Voice column (generation rows `🔁 re-verify (Phase 17)` until ElevenLabs is configured)

### 17.4 Evidence and notes (2026-09-24)

- ElevenLabs endpoints rechecked against the API reference on 2026-09-24: `GET /v1/voices/{id}` (`name`, `labels`, `preview_url`), `POST /v1/text-to-speech/{voice_id}/with-timestamps` (`text`, `model_id`, `voice_settings.speed`, `previous_text`, `next_text` → `audio_base64` + per-character `alignment` in seconds), `POST /v1/forced-alignment` (multipart `file`, `text` → `words[{text,start,end}]`, `loss`); auth header `xi-api-key`.
- Deviation (recorded in the Implementation Plan): `generateVoiceover`/`alignRecording` and `VoiceoverJobsHandler` live in `video-edits`, not `voice-tracks`, so module dependencies run one way (video-edits → voice-tracks → voice). `voice-tracks` owns the immutable `VoiceTracks` collection and `voiceOptions`.
- Calibration item: the aligner's `loss` scale is undocumented, so a recording is rejected on structure (≥ 90% of script words matched in order, times increasing); each track stores `alignmentLoss` to calibrate a loss ceiling during live QA.
- Shared web pieces promoted: `components/studio/job-panel.tsx` (copy passed in; Script Studio updated), `components/core/audio-player.tsx`, `useAudioUpload` beside `useAssetUploads`.
- Checks: API jest 34 suites / 206 tests ✓, tenant scope ✓ (`voice` no-persistence, `voice-tracks` tenant-scoped), API and web lint/typecheck/build ✓, API and worker boot ✓ (worker loads the voice handlers), real-database voice run ✓ (restored afterwards).

## Phase 18 — Edit & preview

References: Product Specification §3.15 · Design Reference §5.14 · Implementation Plan Phase 18

- [x] [api] `updateVideoEdit` for order (permutation check), on-screen text, durations (NONE source only), captions (style, lines, enabled), music (purpose `MUSIC` asset, level 0–100 step 5), end card; `resetCaptions`
  - Validate: specs per rule incl. wrong tenant
- [x] [api] `ClaimCheckService` `[BP] reuse` on on-screen text and caption lines feeding `readiness.flags`
  - Validate: spec that a flagged caption blocks readiness
- [x] [web] `features/scene-editor/preview-player/` (single clock, photos with slow zoom, muted clips from start, text cards, overlays, three caption styles, voice segments, music level + loop + 1 s fade, end card, reduced motion, load/failed media states)
  - Accept: DR §5.14 preview; design-engineering review of the motion · Validate: manual timing check against the voiceover
- [x] [web] Scene cards with `@dnd-kit/sortable` `[BP] reuse dependency` + keyboard sensor + live announcements + Move up / Move down; playing-scene bar; seek on thumbnail
- [x] [web] Captions, Music (rights, upload, level, remove dialog), End card sections; mobile read-only controls (R13); reset dialog
- [x] [web] `app/(app)/projects/[projectId]/edit/page.tsx` + banners, footer gates, autosave, all DR §5.14 states
  - Accept: DR §5.14 at 1440 and 390 · Validate: typecheck, lint, Fidelity QA Edit & preview column

### 18.1 Evidence and notes (2026-09-24)

- API: `updateVideoEdit` gains `sceneOrder` (permutation), `sceneText` (≤ 60), `sceneDurations` (2–15, No voiceover only), `captions` (enabled, style, line wording ≤ 2 × 32, marks edited), `musicLevelPercent` (0–100 step 5), `endCardEnabled`; `resetCaptions`; caption lines claim-checked when edited and counted in `FLAGGED_LINES`; `VideoEdit.music` (the project's current music upload + level) and `endCard` (2 s, product title, CTA). video-edits specs 32 ✓.
- Web: `features/scene-editor/` (page, `draft.ts` overlay so the preview reflects unsaved edits, `preview-player/timeline.ts` + `preview-player.tsx` single-clock player with voice parts per scene, looped music with fade, clip sync, slow zoom off under reduced motion, three caption styles, end card), `@dnd-kit/sortable` reorder with keyboard instructions and announcements plus Move up/down, captions/music/end-card sections, mobile read-only controls via `hooks/use-media-query.ts`; `components/ui/switch.tsx` restyled to the component spec; `ClipStart` shared from Media. Typecheck, lint, build ✓.
- No web test runner exists; the pure web modules (`draft.ts`, `timeline.ts`) are covered by typecheck and the browser QA rows.

## Phase 19 — Render + Export

References: Product Specification §3.16 · Design Reference §5.15 · Implementation Plan Phase 19

- [~] [api] `render` module (no persistence): FFmpeg pipeline per ProductSpec §3.16 (scene build 1080 × 1920 30 fps, drawtext with bundled Geist, concat, voice + music mix, ASS captions for three styles, end card, H.264 CRF 20 `+faststart` + AAC 128k, poster at 1 s, ffprobe verification), per-job temp dir removed in `finally`, 10-minute kill → `RENDER_TIMEOUT`
  - Validate: integration spec rendering a 3-scene fixture, asserting dimensions, fps, codecs and duration
  - Local conformance ✓ with `/opt/homebrew/Cellar/ffmpeg-full/9.0.2/bin/ffmpeg` and matching ffprobe: the real three-scene fixture passed its dimensions, fps, codec and duration assertions. The deploy worker image still needs the same capability confirmation.
- [~] [api] SDL `exports.gql` + `exports` module: immutable `ExportsRepository`, `renderVideo` (gates, 2 credits, `GENERATING`), `RENDER_VIDEO` handler (upload MP4 + poster, number = last + 1, `READY`, restore status on failure), `projectExports`, `createExportDownload` (5-minute attachment URL, `downloadedAt`, `EXPORTED`), `changedSinceExport` fingerprint
  - Validate: specs for gates, failure release, numbering, download status, wrong tenant
- [~] [api] Dashboard: `exportCount`, `latestExportAt`, `latestExportDownloaded` (new), poster thumbnail
- [~] [web] `react-query/exports/`; `app/(app)/projects/[projectId]/export/page.tsx` + `features/export/` (final check with fix links, preset, caption for posting with #ad + copy, render job panel, latest export card with player and downloads, changed banner, history with details, TikTok aside, footer, all DR §5.15 states); dashboard card meta
  - Accept: DR §5.15 at 1440 and 390 · Validate: typecheck, lint, Fidelity QA Export column incl. the ffprobe MP4 conformance row
  - Evidence 2026-09-24: API typecheck/build ✓ · web typecheck/build ✓ (`/projects/[projectId]/export`) · workspace lint ✓ · tenant-scope ✓ · catalogs ✓ · 36 API suites / 225 tests ✓ · real 3-scene ffprobe conformance fixture ✓ with Homebrew `ffmpeg-full` 9.0.2. The default FFmpeg correctly fails the worker capability check because it lacks `ass` and `drawtext`; 🔁 confirm the deploy worker image and run the signed-in 390/1440 Export browser rows.

## Phase 20 — Batch 2 seed, privacy, polish, QA

References: Product Specification §5, §3.10 · Implementation Plan Phase 20

- [~] [api] `seed-demo.ts`: hero project video edit with text cards and No voiceover (idempotent; no media or audio files); no seeded export
  - Validate: run twice; counts unchanged
- [~] [web] Privacy policy: ElevenLabs (narration text, recordings), rendered exports, audio uploads
- [ ] [web] impeccable audit, design-engineering review (preview, reorder), keyboard and screen-reader pass, 360/390/820/1024/1440 layout pass for Media, Voice, Edit & preview, Export
- [ ] [root] Enable `VIDEO_BETA_ENABLED` locally; run the full Batch 2 Fidelity QA table; update the Implementation Plan phase checkboxes and Batch 2 exit

## Phase 21 — Shot direction and shoot plan

References: Product Specification §3.17 · Design Reference §5.8, §5.9 (revised 2026-09-25) · Implementation Plan Phase 21

- [x] [api] SDL `scripts.gql`: `ShotSubject`, `ShotFraming`, `SceneDirection`, `ShootPlan` + inputs; nullable `ScriptScene.direction`, `ScriptVersion.shoot`; `pnpm generate-graphql-types`
- [x] [api] `script-writing.ts`: output schemas, content-style guide in prompts, `coerceDirection` / `coerceShoot` / `joinProps`; scene rewrite receives the shoot plan
- [x] [api] `scripts.service.ts`: partial direction and shoot edits (limits 80 / 120 / 300 / 160), copies carry both, GraphQL mapping
- [x] [api] `creator-brief.service.ts`: `SHOOT PLAN` block (scenario, on camera, locations with scene numbers, props once) and `Frame:` / `Props:` per scene; left out for older versions
- [x] [api] Specs: coercion, allowlist rejection, props dedupe, autosave edits and limits, copy carries the shoot plan, brief block and legacy omission
  - Validate: 37 suites / 233 tests pass
- [x] [api] `seed-demo.ts`: direction + shoot plan on blender v1–v3 and bottle v1
- [x] [web] Fragment + codegen; `SHOT_SUBJECT_LABEL`, `SHOT_FRAMING_LABEL`; Shot direction fieldset (`scene-block.tsx`); Shoot plan card + autosave (`script-editor.tsx`)
  - Validate: web typecheck, lint, build pass
- [x] [root] Live `WRITE_SCRIPT` / `REWRITE_SCENE` against the configured provider; confirm style rules (no `CREATOR` for voiceover on product shots)
  - Evidence: 2026-09-25 live run against the running API's text worker (`TEXT_PROVIDER=anthropic`, dev DB, seeded LED Desk Lamp project `c83f…d209c`, style `VOICEOVER_PRODUCT_SHOTS`): `WRITE_SCRIPT` completed in 23 s (3 hooks, 5 scenes) with a shoot plan (scenario, `presenter` null) and a direction on every scene; `REWRITE_SCENE` on scene 2 completed in 13 s with a new setting and props and left the shoot plan unchanged. Checked: enums inside the allowlist, no `CREATOR` (4 × `HANDS`, 1 × `PRODUCT_ONLY`), props ≤ 4 with no duplicates, non-empty settings; every product action in the shoot plan maps to an approved fact (3 colour temperatures, USB power, desk clamp). 4 credits charged as priced (write 3 + rewrite 1; balance 116 → 112). Only the voiceover style was exercised; the talking-to-camera and hands-on-demo mappings still rely on specs
- [ ] [root] Re-seed; Fidelity QA on Script and Brief at 390/1440 against Design Reference §5.8/§5.9 as revised, including a version from before this phase
  - Accept: Shoot plan card and Shot direction fieldset match §5.8 (editable, read-only, pre-direction version, offline, save failed); brief text matches the §5.9 block and rules; 6 new controls behave per `interaction-inventory.md`
  - Reconciliation (2026-09-25): revised — the reference moved from §3.17 to the revised Design Reference; not started
- [x] [root] Fold §3.17 into Design Reference §5.8/§5.9, `interaction-inventory.md`, `data-requirements.md`, `components-states.md`, `voice-content.md` and the handoff coverage
  - Evidence: 2026-09-25 via `/generate-design-request` (prompt-only; request in `design/CLAUDE_DESIGN_REQUEST.md`). The §5.8 limit rule was aligned with the built autosave behavior (“Not saved. Retrying…”), so no code change was needed
  - Reconciliation (2026-09-25): unblocked and done

## Phase 22 — AI scene clips

References: Product Specification §3.18 · Design Reference §5C (§5.16) · Implementation Plan Phase 22 · decisions R19, R20, open 11, open 19

- [x] [root] Gate: product owner approved Design Reference §5C and Product Specification §3.18 (2026-09-25)
  - Reconciliation (2026-09-25): added; resolves the approval blocker on every task below

> ⚠ Enabling (not building): `AI_CLIPS_ENABLED` stays off in any shared environment until open 19 (MiniMax terms review) closes and `MINIMAX_API_KEY` is configured. Live-provider validation sub-items wait on the key; stub-provider specs do not.

### 22.1 Configuration and provider contract

- [x] [api] Env names in `apps/app-api/src/config/env.schema.ts`: `AI_CLIPS_ENABLED` (boolean, default false), `MINIMAX_API_KEY` (optional secret), `MINIMAX_VIDEO_MODEL` (default `MiniMax-H3-Max`); both `.env.example` files (names only, blank values); `pnpm catalogs`
  - Req: §3.18 Configuration · Plan Phase 22 item 1 · Deps: approval · Accept: schema validates; missing key does not crash boot · Validate: `pnpm catalogs:check`, API typecheck
- [x] [root] Recheck the MiniMax video API against current docs (create task, query task, file retrieval, first-frame image input, 9:16, 480P, 6 s, error codes) and record the endpoint details here
  - Req: Plan Phase 22 item 1 · Deps: approval · Accept: endpoints, auth header name and status values written below this task · Validate: review
  - Evidence (2026-09-25): recorded in “Pattern scan — Phase 22 AI scene clips”. H3 uses the v2 API; its first-frame ratio is adaptive, so the worker crops the photo to 720 × 1280 before sending it (verified with the configured FFmpeg)
- [x] [api] SDL (`assets.gql`, `generation-jobs.gql`, `video-edits.gql`): `AssetOrigin`, `Asset.origin`, `Asset.aiClip: AiClipInfo`, `GenerationJobType.GENERATE_SCENE_CLIPS`, `VideoEdit.aiClipsEnabled`, `generateSceneClips`, `checkAiClip`, `discardAiClips`, `clipPromptFlags`; `pnpm generate-graphql-types`; web `pnpm codegen`
  - Req: §3.18 Contract · Deps: approval · Parallel with the provider adapter · Validate: both typechecks
  - Evidence (2026-09-25): new `ai-clips.gql`; `GenerationJob.sourceAssetId` / `prompt` added for Change the request and Try again; the second-request refusal reuses `JOB_ALREADY_RUNNING` (no new code)

### 22.2 API

- [x] [api] `modules/video/`: `VideoProvider` interface + `MiniMaxVideoProvider` (create, poll every 10 s, download, 10-minute ceiling, error → `PROVIDER_TIMEOUT` / `PROVIDER_REJECTED` / `INVALID_OUTPUT` / `PROVIDER_NOT_CONFIGURED`) following `modules/voice/` [BP] adapter pattern; recorded-fixture specs
  - Req: §3.18 Job, Failure mapping · Deps: 22.1 contract · Validate: provider specs
- [x] [api] `assets` [BP] extend: `origin` (missing reads `UPLOAD`) and `aiClip` on `AssetRecord`; `ai-clips/` key prefix; GraphQL mapping; tenant scope unchanged
  - Req: §3.18 Records · Deps: SDL · Validate: assets specs incl. a legacy record without `origin`
- [x] [api] `generateSceneClips` service + resolver: gates (enabled, video edit + scene, own ready `PHOTO`, prompt 1–500, `CLIP_JOB_RUNNING`, credits), job create with idempotency key, HOLD 8
  - Req: §3.18 Contract · Deps: SDL, assets · Validate: specs for each gate and a wrong-tenant source photo
- [x] [api] `GENERATE_SCENE_CLIPS` handler in the media worker: presigned 5-minute source GET, two provider tasks, ffprobe (H.264, 9:16, ≈ 6 s), poster via FFmpeg, S3 put, asset per clip, lease heartbeat; provider first, persist after
  - Req: §3.18 Job · Deps: provider, assets · Validate: handler spec with a stub provider (both succeed, one fails, both fail, timeout)
- [x] [api] Credits [BP] extend: CAPTURE 4 per clip created and RELEASE the remainder in one completion; both failed → RELEASE 8
  - Req: §3.18 Credits · Deps: handler · Accept: ledger entries sum to the held amount · Validate: credits spec for partial success
  - Evidence (2026-09-25): `GenerationJobResult.creditsUsed`; `complete()` captures it and releases the rest with “Refunded: part of the job didn’t finish”; spec “charges only the credits a partly finished job used”
- [x] [api] `checkAiClip` (sets `checkedAt` once), `discardAiClips` (deletes unused clips and files; keeps clips in use), `updateVideoEdit` rejects unchecked `AI_CLIP` media with `CLIP_NOT_CHECKED`
  - Req: §3.18 Contract, Use in a scene · Deps: assets · Validate: specs incl. discard keeping a used clip
- [x] [api] `clipPromptFlags(projectId, prompt)` via `ClaimCheckService` [BP] against approved facts; free
  - Req: §3.18 Contract · Validate: spec with a performance-claim prompt
- [x] [api] `VideoEdit.aiClipsEnabled` computed from `VIDEO_BETA_ENABLED`, `AI_CLIPS_ENABLED` and a configured key
  - Req: §3.18 Enablement · Validate: spec for each flag combination

### 22.3 Web

- [x] [web] Operations + hooks in `react-query/` (assets, video-edits, generation-jobs) via `defineQuery`/`defineMutation` [BP]; failure copy for `GENERATE_SCENE_CLIPS` in `failureCause(type, code)` (§5C table)
  - Req: §3.18 Cache · Deps: SDL codegen · Validate: web typecheck
- [x] [web] `features/ai-scene-clips/` sheet: Request view (photo radiogroup, in-place photo upload, prompt prefilled from shot direction with reset, debounced `clipPromptFlags` callout, gating reasons, paid Generate), Generating view (job panel, leave-and-return, partial and failed variants), Review view (2 clip cards, muted players, accuracy check, Discard / Try again / Use)
  - Req: Design Reference §5.16 · Deps: operations · Accept: all 21 §5C states; `role="status"`/`role="alert"`; radiogroups follow APG; reduced motion shows posters · Validate: lint, typecheck, build
- [x] [web] `discard-clips-dialog` and `ai-clip-check-dialog`
  - Req: §5.16 · Accept: destructive copy per `voice-content.md`; check dialog gates Use on both ticks · Validate: keyboard pass
- [x] [web] Entry points: `features/media-mapping/` row action and status lines (generating, ready to check, failed) and toast action; `features/media-picker/` AI clips filter, “AI clip” badge, “Not checked yet”, Generate a clip; everything hidden unless `aiClipsEnabled`
  - Req: Design Reference §5.12 (AI clip entry), §5C · Accept: with the flag off, Media and the picker render exactly as before · Validate: build; manual flag-off check
  - Evidence (2026-09-25): entry points render only with `aiClipsEnabled`; existing AI clips still show in the picker (AI clips filter) after the flag is turned off; AI clips hidden from the Product grid and the upload count; the unchecked-clip check dialog lives in the picker so Edit & preview gets it too. Manual flag-off browser check still open

### 22.4 Privacy, QA

- [x] [web] Privacy policy: MiniMax receives the chosen photo and description; generated clips are stored with the project
  - Req: §3.18 Privacy · Deps: none to draft; recheck wording once open 19 closes · Validate: copy review
- [x] [api] Review fix: AI clip S3 keys (`projects/<id>/ai-clips/…`) fail `S3Service` `PRIVATE_KEY_PATTERN`, so every live job dies at step 0 with `Invalid storage key.` (found by the 2026-09-25 live smoke test; the handler spec mocks S3)
  - Req: §3.18 Job · Deps: none · Validate: an `s3.service` spec that runs the handler's real frame and clip keys against the pattern; a failure before the provider call maps to a `GenerationFailureCode`, not a raw `BadRequestException`
  - Evidence (2026-09-25): `ai-clip-storage.ts` is the handler and contract-test source for the exact frame and clip keys; `S3Service` accepts those two shapes and still rejects wrong extensions and traversal; the handler converts an unexpected pre-provider storage exception to `INTERNAL` without calling MiniMax. Focused 32 tests and all 40 API suites / 258 tests pass; Prettier, targeted ESLint, API typecheck/build, tenant scope and locked-skills checks pass.
  - Verified: 2026-09-25 live end-to-end job (after the key fix; `AiClipsService.generate` → `MEDIA_JOB_QUEUE` → media worker → `AiClipJobsHandler`, dev DB, project `b863…6f9e`): claimed in 3 s, both MiniMax tasks created by 10 s, `COMPLETED` 3/3 in 71 s; two `READY` `AI_CLIP` assets (6.6 s, ~4.6 MB each) stored under `ai-clips/<assetId>.mp4` with provider task ids, `checkedAt` null; 8 credits held and 8 captured (2 × 4); no frame-cleanup warning. API 40 suites / 258 tests and typecheck pass
- [x] [root] Live MiniMax run (provider path, outside the queue)
  - Req: R19 · Evidence: 2026-09-25 live run (funded pay-as-you-go key): one `MiniMax-H3-Max` 6 s 480P task from a presigned 720 × 1280 frame — created, `succeeded` in ~11 s, downloaded from `video-product.cdn.minimax.io` (2.6 MB), probed 480 × 832 h264/aac 24 fps 6.59 s; the temporary frame was deleted. The output is near, not exact, 9:16 and carries audio — both fine for render (`COVER` crop, scene segments encoded `-an`). Earlier blockers were billing only: Token Plan credits exclude H3 (2013), then an empty cash balance (402, 1008)
- [x] [web] Review fix (2026-09-25 Spec QA): the Review view shows “1 clip didn't finish. You weren't charged for it.” after one of two finished clips has been used — `media-page.tsx` passes only unused clips (`pendingClips`) and `ai-clip-sheet.tsx` computes `missing = CLIPS_PER_REQUEST - clips.length`. Derive the failed count from the job (clips it made, e.g. every asset with `aiClip.jobId === job.id` or `creditsUsed / CLIP_CREDIT_COST`), not from what is still unused; add a spec for “one used, one pending” and “one failed”
- [x] [web] Review fix (2026-09-25 Spec QA, minor): clip labels read “7 s” / “Clip B, 7 seconds” — MiniMax returns 6.59 s and `clip-card.tsx` rounds it — while §5C fixes the label at “6 s”. Show the requested length (`CLIP_SECONDS`) or floor to whole seconds; the scene's “of 6.6 s” Start-at bound stays exact. Also confirm the Request view's uploader and rights checkbox with photos present (§5C lists **Upload photos** only in the no-photos state)
  - Evidence (2026-09-25): `clip-card.tsx` floors the label to whole seconds (`Math.floor(clip.durationSeconds)`); covered by the Phase 24 clip-length task (40 suites / 288 tests, web build). The Upload photos check moved to the Phase 22 Fidelity QA row, as the Implementation Plan records
  - Reconciliation (2026-09-25): `[ ]` → `[x]` to match Implementation Plan Phase 22, which records it done with this evidence; the tracker had not been updated
- [ ] [api] R21 AI label (render): in `render`, scenes whose media is an `AI_CLIP` asset get the “AI-generated” pill per §3.18 AI label (Geist SemiBold 30 px, white on `rgba(0,0,0,0.45)`, radius 999, 12 × 20 px padding, top-left 48 px inset, whole scene, above the on-screen text layer); MP4 metadata `comment` + `ai_generated=1` with `-movflags use_metadata_tags`; the ffprobe conformance check asserts both when any scene uses an AI clip and neither when none does; specs for both cases
- [ ] [api] R21 AI provenance (exports): `ExportRecord.aiClips [{ sceneId assetId providerTaskId model }]` snapshot written with the export (empty when none), immutable like the rest of the export; tenant-scope entry unchanged; spec
- [ ] [web] R21 AI label (preview): the Edit & preview player draws the same pill on AI clip scenes (position and size scaled to the player), so the preview matches the export; not on uploaded media
- [ ] [web] R21 Privacy copy: replace the MiniMax sentence with §3.18 Privacy (“a third-party video generation service, which stores data in the United States and may use it to maintain and improve its services”); the provider is not named anywhere user-facing. ⚠ legal confirms the wording before enabling
- [~] [root] Fidelity QA of §5C at 390/1440 with the flag on (stub or live provider), and a render conformance check with one AI clip in a scene
  - Evidence: 2026-09-25 Spec QA (signed-in Google session, headless Chromium at 1440 and 390, project `b863…6f9e`, no paid or destructive clicks): 58 scripted checks; 54 passed and the 4 misses were checker wording, rechecked by hand. Passed: Media entry points, “1 clip ready to check” row status and Review, AI clip badge and Start at; Review view (title, subcopy, Pick one radiogroup, both checks, caption, Use gated “Pick a clip first” → “Tick both checks first”, Discard clip, Try again · 8 credits); Request view (title, photo radiogroup with the scene's photo preselected, hint, prefill “… Slow, steady camera. Keep the product exactly as it is.”, counter, meta row, Generate 2 clips · 8 credits, Performance-claim callout on “in seconds” wired by `aria-describedby` and not blocking, Use the scene's direction, empty prompt → “Describe the motion first”); picker AI clips filter, “Not checked yet”, Generate a clip, check dialog gated until both ticks. Footer fits at 360/390/1440. The check → Use in scene flow was used live by the product owner (clip A in scene 1). Render conformance: `RENDER_VIDEO` with clip A in scene 1 completed in 54 s on the restarted media worker; export 1080 × 1920 H.264 High 30 fps yuv420p, one AAC 44.1 kHz stereo track (clip audio dropped), 37.0 s; scene-1 frame shows the clip filling 9:16. Not exercised (paid, destructive or needs another state): starting/queued/running/failed and one-failed views, discard dialog, adding, offline, not enough credits, no photos, loading, not enabled
  - Req: Plan Phase 22 item 7 · Deps: all of Phase 22 · Validate: QA rows, ffprobe
  - Evidence (2026-09-25): API — typecheck, lint, `nest build`, 40 suites / 252 tests (new: `ai-clips.service`, `ai-clip-jobs.handler`, `minimax-video.provider`, plus clip cases in assets, generation-jobs and video-edits); built API (port 3099, scheduler off) and media worker boot with `AiClipsModule`. Web — typecheck, lint, production build. `pnpm check-tenant-scope` (`ai-clips`, `video` declared no-persistence) and `pnpm catalogs:check` pass
  - 🔁 Open: signed-in browser QA with `VIDEO_BETA_ENABLED` and `AI_CLIPS_ENABLED` on; a live MiniMax run once open 19 closes and `MINIMAX_API_KEY` is set

## Phase 23 — Scene transitions

References: Product Specification §3.19 · Design Reference §5.8, §5.9, §5.12, §5.14, §5.15 (revised 2026-09-25) · Implementation Plan Phase 23 · decision R22

### Pattern scan

- Script contract and production trace: `graphql/schemas/scripts.gql` → generated API types → `scripts.resolver.ts` → `scripts.service.ts` → `repositories/scripts.repository.ts` → `react-query/scripts/graphql/scripts.ts` → `scripts-operations.ts` → `script-editor.tsx` / `scene-block.tsx`. Exemplars: Phase 21 `SceneDirection` and `ShootPlan`, plus hook/scene rewrite output validation in `script-writing.ts`. Adopted: SDL first; optional persisted field for legacy rows; generated types only; model enum allowlist through JSON schema + zod; GraphQL maps missing storage to the product default; draft autosave stays partial and creator edits are not model-normalized.
- Video edit and export trace: `video-edits.gql` / `exports.gql` → generated types → thin resolvers → `video-edits.service.ts` / `exports.service.ts` → tenant-scoped repositories → web fragments and TanStack operations → `scene-editor-page.tsx` / `export-page.tsx`. Exemplars: `sceneText` and `sceneDurations` scene-id validation, `switchVideoEditVersion`, immutable export snapshots, and `videoFingerprint`. Adopted: validate every supplied scene id with the stable `ValidationError` shape; return the complete mutation result; replace the detail cache with `setQueryData`; legacy video edits and snapshots are defaulted only at the presentation boundary.
- Render and preview trace: `VideoEditsService.renderSource` → `ExportsService.download` → `RenderPlan` → `RenderService` fixture conformance, mirrored by `draft.ts` → `timeline.ts` → `preview-player.tsx`. Exemplars: all-cut concat, slow zoom, the single playback clock, caption/voice absolute times, end-card cut, and the existing FFmpeg toolchain probe. Adopted: scene starts remain authoritative; overlap extends only the outgoing render segment; audio/caption clocks remain unchanged; all-cut keeps the current concat fast path; non-cut uses one filter graph; reduced motion changes only client presentation.
- Web UI exemplars: Shot direction's responsive `Select` fields and read-only line in `scene-block.tsx`; on-screen text/duration autosave and reorder announcements in `scene-editor-page.tsx`; current export-history disclosure in `export-page.tsx`. Adopted: project tokens and existing shadcn primitives only; popper selects; full-width narrow controls; 160px transition select from 640px; explicit “Opens the video.” at position 1; no new theme or component system.

### Production mapping

- State ownership: script and video transition values are server records and TanStack Query cache state; pending field edits are only the existing debounced draft state; preview playback position and reduced-motion preference stay ephemeral client state.
- Reads/writes: GraphQL SDL → generated contracts → authenticated owner-scoped resolver/service/repository path → colocated web documents and operation hooks → query cache. Script edits use `updateScriptVersion`; video edits use `updateVideoEdit.sceneTransitions`; generation jobs persist normalized model output; exports keep an immutable transition snapshot.
- Validation and errors: GraphQL owns enum shape; zod rejects model values outside the allowlist as `INVALID_OUTPUT`; services enforce draft/ownership and scene membership; mutation failures use the established autosave error state/toast mapping.
- States and cache: legacy missing fields read as Cut without backfill; creator edits are optimistic only in the existing local draft and roll back to the mutation result on cache replacement; loading/error/offline/read-only/rewrite/reorder states remain the existing surfaces; first position is visually Cut while retaining its stored value.
- End-to-end exemplar extended: Phase 21 shot direction for script generation/edit/copy/brief and Phase 18–19 video edit → preview → render → immutable export.

- [x] [root] Gate: product owner approved Product Specification §3.19 on 2026-09-25; open 20 closed as R22 (the script model picks, within the §3.19 rules)
  - Reconciliation (2026-09-25): added; no task below was ever blocked on it
- [x] [root] Fold §3.19 into Design Reference §5.8, §5.9, §5.14, §5.15, `interaction-inventory.md`, `data-requirements.md`, `voice-content.md`, the screen inventory and the handoff coverage
  - Evidence: 2026-09-25 via `/generate-design-request` (prompt-only; request in `design/CLAUDE_DESIGN_REQUEST.md`, carried out)
  - Reconciliation (2026-09-25): added and done

### 23.1 Contract

- [x] [api] SDL `scripts.gql`: `enum SceneTransition { CUT PUNCH_IN WHIP DISSOLVE }`, nullable `ScriptScene.transitionIn`, `ScriptSceneInput.transitionIn`; `video-edits.gql`: `VideoEditScene.transitionIn: SceneTransition!`, `input SceneTransitionInput { sceneId transitionIn }`, `UpdateVideoEditInput.sceneTransitions`; `exports.gql`: `ExportSnapshotScene.transitionIn: SceneTransition!`; `pnpm generate-graphql-types`; web `pnpm codegen`
  - Req: §3.19 Contract · Plan Phase 23 item 2 · Deps: gate ✓ · Accept: the schema builds; nothing existing changes shape · Validate: API and web typecheck
  - Evidence (2026-09-25 review): SDL matches §3.19; API and web typecheck pass

### 23.2 API

- [x] [api] `modules/scripts/script-writing.ts`: add `transitionIn` to the scene JSON schema and zod `sceneOutput` (enum allowlist; any other value → `INVALID_OUTPUT`, as with `direction`); a prompt rule stating the §3.19 generation rules; `REWRITE_SCENE` messages include the neighbours' transitions
  - Req: §3.19 Generation · Plan Phase 23 item 3 · Deps: 23.1
  - Evidence (2026-09-25 review): schema, zod allowlist (`SPIN` rejected in spec) and prompt rule present
- [x] [api] `normalizeTransitions` (pure, in `script-writing.ts`): scene 1 → `CUT`; only the first `WHIP` and the first `DISSOLVE` are kept; a non-cut straight after a non-cut → `CUT`. Applied after `WRITE_SCRIPT` and, for `REWRITE_SCENE`, against the unchanged neighbours
  - Req: §3.19 Generation · Deps: previous · Accept: each rule has a spec; a rewrite between two non-cuts comes back `CUT` · Validate: `script-writing.spec.ts`
  - Evidence (2026-09-25 review): applied after `WRITE_SCRIPT` and against neighbours on `REWRITE_SCENE`; spec per rule
- [x] [api] `scripts.service.ts` + record: optional `transitionIn` on the scene record (missing reads `CUT` in GraphQL mapping; no backfill); `updateScriptVersion` partial edit, draft only, no normalization; restore, edit-as-new and duplicate-project carry it
  - Req: §3.19 Contract, Creator edits, Copies · Deps: 23.1 · Validate: `scripts.service.spec.ts` (edit, legacy version, copy)
  - Evidence (2026-09-25 review): partial edit without normalization, copies carry it, legacy reads `CUT`; specs
- [x] [api] `creator-brief.service.ts`: `Transition: <label>` as the scene's last line before `CTA:` for scene 2 onward when not `CUT`; no line for scene 1, `CUT` or legacy
  - Req: Design Reference §5.9 `Transition:` rule · Deps: record field · Validate: brief spec incl. a legacy version reading exactly as before
  - Evidence (2026-09-25 review): `sceneTransitionLines` omits scene 1, `CUT` and legacy; spec
- [x] [api] `modules/video-edits/video-edits.service.ts`: copy `transitionIn` on `startVideoEdit` and `switchVideoEditVersion` (null → `CUT`); legacy edits read `CUT`; `updateVideoEdit.sceneTransitions` with the scene-id check (`ValidationError`); export snapshot `transitionIn` and the media-line suffix (“ · Punch-in” / “ · Whip in” / “ · Dissolve in”, scene 2 onward); `changedSinceExport` fingerprint includes transitions
  - Req: §3.19 Copies and video edit, Export · Design Reference §5.15 · Deps: 23.1 · Validate: video-edits and exports specs (copy, switch, legacy edit, unknown scene id, snapshot text, fingerprint change)
  - Evidence (2026-09-25 review): start/switch copy, legacy `CUT`, scene-id check, snapshot field + suffix, fingerprint; specs
- [x] [api] `modules/render/`: `RenderScene.transitionIn` in `render.types.ts`; `xfade` in `REQUIRED_FILTERS` (`render.toolchain.ts` + its spec message); in `render.service.ts`, the outgoing segment built 250 ms (Whip) or 400 ms (Dissolve) longer, `PUNCH_IN` as a 115% → 100% scale envelope over 300 ms inside the incoming segment, first scene and end card always cut, all-cut edits keep the concat path, others join through one `filter_complex` (`concat` for cuts, `xfade` with `offset` = the next scene's start); `exports.service.ts` passes the value into the plan
  - Req: §3.19 Render (timing contract) · Deps: 23.1, video edits · Accept: scene starts, voice parts and caption times don't move; total length is unchanged
  - Validate: integration spec with a 4-scene fixture (Cut, Whip, Punch-in, Dissolve) + end card — ffprobe duration equals the sum of the scenes, and the frame at each scene start + 500 ms shows that scene's media; the existing 3-scene conformance spec still passes; toolchain spec
  - Evidence (2026-09-25 review): 4-scene transition spec rendered for real with `FFMPEG_PATH`/`FFPROBE_PATH` from `apps/app-api/.env` (Homebrew `ffmpeg-full` 9.0.2, which has `xfade`): 4.5 s, each scene's frame at start + 0.5 s correct. Without those env vars the render specs pass without rendering (pre-existing gate)
- [x] [api] `scripts/seed-demo.ts`: hero blender v1–v3 scene 2 (Problem) `WHIP`, scene 4 (Demo) `PUNCH_IN`, the rest `CUT`; the hero video edit copies v3; run twice with identical results
  - Req: §3.19 Seed · `voice-content.md` Transitions · Deps: record fields
  - Evidence (2026-09-25 review): values match §3.19; the two consecutive runs are not evidenced
  - Evidence (2026-09-25): corrected to scene 4 Punch-in (the earlier task text said scene 3, which put two non-cuts in a row); two runs identical; DB reads Cut · Whip · Cut · Punch-in · Cut

### 23.3 Web

- [x] [web] Fragments + codegen; `SCENE_TRANSITION_LABEL` and hint copy (`voice-content.md`); `features/script-studio/scene-block.tsx`: **Transition in** select spanning both columns of the Shot direction fieldset, hint under it, “Opens the video.” on scene 1, read-only direction-line suffix, autosave through the existing draft path; interaction `script-studio.set-transition`
  - Req: Design Reference §5.8 · Deps: 23.1, scripts service · Accept: §5.8 editable, read-only, legacy (Cut, no suffix) and scene-1 states · Validate: web typecheck, lint, build
  - Evidence (2026-09-25 review): built; open review fixes 23.5 (autosave data loss, orphan label)
  - Evidence (2026-09-25): review fixes applied; web typecheck, lint (0 warnings), build pass
- [x] [web] `features/scene-editor/scene-editor-page.tsx` (+ `draft.ts`): **Transition in** row on each scene card (160px select ≥ 640px, full width below; editable at every width), “Opens the video.” at position 1 including after a reorder, the reorder announcement suffix; `setQueryData` from the `updateVideoEdit` result; interaction `scene-editor.set-transition`
  - Req: Design Reference §5.14 · Deps: video edits service · Validate: web typecheck, lint, build
  - Evidence (2026-09-25 review): built; keyed `transition:<id>` patches are merge-safe; open review fix 23.5 (orphan label)
  - Evidence (2026-09-25): review fix applied; checks as above
- [x] [web] `features/scene-editor/preview-player/` (`timeline.ts`, `preview-player.tsx`): transitions on the single clock — Punch-in scale 1.15 → 1 over 300 ms `--ease-out`; Whip two layers translating over 250 ms `--ease-in-out`; Dissolve two layers crossfading over 400 ms with the outgoing clip playing; scene starts unchanged; reduced motion plays Punch-in and Whip as cuts
  - Req: Design Reference §5.14 “Transitions in the preview” · Deps: previous · Validate: a `timeline.ts` unit check of overlap windows if the web has a test runner, else typecheck + the QA row
  - Evidence (2026-09-25 review): two-layer Whip/Dissolve, eased Punch-in, reduced motion as cuts; open review fix 23.5 (lost eslint-disable)
  - Evidence (2026-09-25): lint comment restored; checks as above
- [x] [web] `features/export/export-page.tsx`: the history Details line shows the snapshot media text as delivered (suffix comes from the API)
  - Req: Design Reference §5.15 · Deps: exports snapshot · Validate: web typecheck
  - Evidence (2026-09-25 review): no change needed: the page renders the snapshot media text, and the API adds the suffix

### 23.5 Review fixes (2026-09-25 review)

- [x] [web] Data loss: `features/script-studio/script-editor.tsx` `onTransition` schedules `{ scenes: [{ id, transitionIn }] }`; `use-autosave.ts` merges shallowly, so a pending `scenes` patch from `saveScenes` (text or direction typed within 800 ms) is replaced and never sent while the head shows “Saved”. Build `next` and call `saveScenes(next)` as `onChange` does
  - Req: Design Reference §5.8 autosave · Accept: narration typed, then a transition changed within a second, survives a reload · Validate: web typecheck, lint; browser check
  - Evidence (2026-09-25): fixed
- [x] [web] A11y: position 1 renders `<label htmlFor>` with no control in `scene-block.tsx` and `scene-editor-page.tsx`; render it as text when the select is absent
  - Evidence (2026-09-25): fixed
- [x] [web] Lint: restore `// eslint-disable-next-line @next/next/no-img-element -- signed preview URL` on the `<img>` moved into `SceneLayer` (`preview-player.tsx:451`)
  - Evidence (2026-09-25): fixed
- [x] [api] Contract: `ScriptScene.transitionIn` description says null for legacy versions but the mapping returns `CUT`; update the description, regenerate API types and web codegen
  - Evidence (2026-09-25): fixed

### 23.6 Media follow-up (§3.19 Media step, Design Reference §5.12, revised 2026-09-25)

- [x] [api] `video-edits.gql`: `VideoEditScene.direction: SceneDirection` (nullable); `video-edits.service.ts` + record: copy `direction` in `scenesFrom` on `startVideoEdit` and `switchVideoEditVersion`; when a stored scene has no `direction` key, fill it on read from the pinned script version's scene (one version read, only for such records; no backfill); `pnpm generate-graphql-types`; web `pnpm codegen`
  - Req: §3.19 Media step · Deps: none · Accept: new edits carry direction; a legacy edit returns its version's direction; a scene with no direction returns null · Validate: video-edits specs (start, switch, legacy), API typecheck
  - Evidence (2026-09-25): `video-edits.gql`, record (no schema default, so absent marks older edits), `scenesFrom`, `directionsFor`; seed copies direction; specs pass (40 suites / 271 tests); API lint and typecheck pass
- [x] [web] `features/media-mapping/media-page.tsx`: add `direction` to the video-edit fragment; read it per scene and remove the `useScriptVersionsQuery` direction lookup (the AI clip prefill uses the same field, §5C format unchanged); render the §5.12 “Shot direction:” line (framing · in frame · setting · Props, empty parts left out; no line without direction)
  - Req: Design Reference §5.12 item 4 · Deps: API task · Validate: web typecheck, lint, build
  - Evidence (2026-09-25): fragment + codegen; lookup removed; line renders framing · in frame · setting · Props; web typecheck, lint, build pass
- [x] [web] Same file: Punch-in hint (§5.12 item 5) for a Punch-in scene past position 1; clip warning adds the next scene's overlap (Whip 0.25 s, Dissolve 0.4 s) to the needed length — hold time includes it, and a clip that covers the scene but not the overlap shows “This clip runs out during the Whip into scene 3. Its last frame holds for 0.2 s.” (0.1 s rounding); never blocks; the Start at error is unchanged
  - Req: Design Reference §5.12 item 6 · Deps: none · Validate: web typecheck, lint, build; Spec QA row
  - Evidence (2026-09-25): Punch-in hint and `ClipStart` `overlap` prop (Media passes it; Edit & preview's popover is unchanged); web checks as above

### 23.4 Live run and QA

- [x] [root] Live `WRITE_SCRIPT` and `REWRITE_SCENE` against the configured text provider: record the raw model picks, how many scenes `normalizeTransitions` corrected, and tighten the prompt if more than one scene in five needed correcting
  - Req: Plan Phase 23 item 9 · Deps: 23.2 scripts tasks
  - Evidence (2026-09-25): direct provider calls (Anthropic) with the Phase 23 prompt/schema/normalizer on 3 seeded projects, nothing written: 19 picks, 1 corrected (5%); no prompt change
- [ ] [root] Spec QA at 390/1440: Script, Brief, Media and Edit & preview (editable, read-only, legacy version, first scene after a reorder, reduced motion) and Export details; render one export with all four transitions and watch it end to end next to the preview
  - Req: Design Reference §5.8, §5.9, §5.14, §5.15 · Handoff Plan QA items for those screens · Deps: all of Phase 23 · 🔁 needs a signed-in browser session and `VIDEO_BETA_ENABLED=true`
  - Evidence (2026-09-25): 🔁 not run: needs the product owner's signed-in browser session and a rebuilt, restarted API (the running `dist` on :3001 predates Phase 23)

## Phase 24 — Multi-photo AI clips

References: Product Specification §3.18 (R23 rows, approved 2026-09-25) · Design Reference §5.16 (R23 revision, approved) · Implementation Plan Phase 24 · decision R23

- [x] [root] Gate: product owner approved R23 on 2026-09-25 (“implement it all”) and set one clip as the default
  - Reconciliation (2026-09-25): approval blocker resolved; every task below unblocked

- [x] [root] Recheck MiniMax v2 for `MiniMax-H3-Max`: `last_frame`, `reference_image` and its cap, `ratio: "9:16"` with no first frame; record here; settle the §3.18 R23 ⚠
  - Req: §3.18 Modes · Plan Phase 24 item 2 · Validate: review
  - Evidence (2026-09-25): recorded in §3.18 Modes (frame and reference roles exclusive; ratio adaptive with frames, `9:16` with references; 5–15 s, 480P/768P)
- [x] [api] SDL (`ai-clips.gql`, `assets.gql`, `generation-jobs.gql`): `SceneClipMode`, input `mode` / `endAssetId` / `referenceAssetIds`, optional `sourceAssetId`, `AiClipInfo` and `GenerationJob` fields; `pnpm generate-graphql-types`; web `pnpm codegen`
  - Req: §3.18 Contract (R23) · Deps: approval · Validate: API and web typecheck
  - Evidence (2026-09-25): plus `clipCount`; API types + web codegen regenerated
- [x] [api] `modules/ai-clips/`: mode rules (`ValidationError` per field), photo checks (ready own `PHOTO` uploads, origin `UPLOAD`, distinct, counts), job input fields, clip record `mode` / `endAssetId` / `referenceAssetIds`; source-only request unchanged
  - Req: §3.18 Contract (R23) · Deps: SDL · Validate: specs per mode, per rejection, wrong-tenant photo, legacy source-only request
  - Evidence (2026-09-25): `photosFor` + count rules; `ai-clips.service.spec.ts` covers default count, 2 clips, bad counts, each mode and rejection, AI clip refused as a reference
- [x] [api] `AiClipJobsHandler` + `ai-clip-storage.ts` + `s3.service.ts`: crop and presign every input, indexed temporary keys `…/<jobId>-frame-<n>.jpg` added to the builder and the allowlist together, contract spec through the real validator, delete every temporary key in `finally`; `MiniMaxVideoProvider` body per mode; `rightsConfirmedAt` = latest input
  - Req: §3.18 Job (R23) · Deps: previous · Validate: handler spec with a stub provider per mode; provider mocked-fetch specs; `s3.service` contract spec
  - Evidence (2026-09-25): indexed frames through the real validator (contract spec n = 0…3, 5 malformed neighbours rejected); handler specs for default single clip, start+end frames with latest rights, 3 references with every frame deleted; provider spec for ratio per mode
- [x] [api] `script-writing.ts`: `visual` rule covers the shot from opening to ending
  - Req: §3.18 Script visuals (R23) · Validate: `script-writing.spec.ts`
  - Evidence (2026-09-25): rule + spec across write and rewrite prompts
- [x] [web] `features/ai-scene-clips/` (`ai-clip-sheet.tsx`, `clip-prompt.ts`): mode control, per-mode photo selection (radio · Start/End toggles + Swap · 2–4 toggles + counter), per-mode prefill and reset, gating reasons, “Sending your photos”, Review “Made from” line, mode and photos kept on Change the request and Try again; the §5.16 states
  - Req: Design Reference §5.16 (R23) · Deps: SDL · Validate: web typecheck, lint, build
  - Evidence (2026-09-25): sheet, picker, prompt and media-page wiring; web typecheck, lint, build pass
- [x] [web] Privacy copy “the photos you choose” (⚠ legal, with R21)
  - Evidence (2026-09-25): “photos you chose”; R21 rewrite still open under Phase 22
- [x] [root] Live run, one request per mode (24 credits of provider spend); first/last frame and product match checked by eye; task ids recorded
  - Evidence (2026-09-25): 3 live tasks (`445501113790833`, `445501020041781`, `445500915900899`) succeeded in 15–23 s; frames checked by eye; temporary frames deleted
- [x] [api][web] Clip length follows the scene (product owner, 2026-09-25): `clipSecondsFor` in `ai-clips.service.ts` (ceil, clamp 5–15) from `VideoEditsService.get` at request time; `clipSeconds` on job input + GraphQL (legacy 6); handler sends it as `duration`; sheet meta line; `clip-card.tsx` floors the label
  - Req: §3.18 Clip length · Design Reference §5.16
  - Evidence (2026-09-25): service spec (7 → 7, 3 → 5, 15 → 15) and handler spec (duration 9); 40 suites / 288 tests, typecheck, API and web lint, web build pass; no live clip generated at the product owner's request
- [ ] [root] Spec QA §5.16 at 390/1440: three modes, one photo in a two-photo mode, limit at 4, Review “Made from” · 🔁 signed-in session, flags on

## Phase 25 — Audience suggestions

References: Product Specification §3.7 (Audience suggestions row, R24) · Design Reference §5.7 (revised 2026-09-25) · Implementation Plan Phase 25 · decision R24

- [x] [root] Gate: R24 — three suggestion cards, 1 credit, picking fills the fields (2026-09-25)
- [x] [api] SDL (`generation-jobs.gql`, `projects.gql`) + `pnpm generate-graphql-types`; web `pnpm codegen`
  - Evidence (2026-09-25): API and web typecheck pass
- [x] [api] `projects.service.ts` (`suggestAudiences`, `setAudienceSuggestions`, mapping + `isStale`, failure notice, latest-failure types), `projects.repository.ts` record, `projects.resolver.ts`, `TEXT_JOB_QUEUE`; `audience-suggestions.handler.ts` + module registration
  - Evidence (2026-09-25): `audience-suggestions.handler.spec.ts` (2 tests: grounding, caps, fact filtering; three incomplete outputs); 41 suites / 290 tests pass; web build and catalogs check pass; API lint pass
- [x] [web] `features/strategy/audience-picker.tsx`, `strategy-page.tsx` Audience card (button, skeleton, banners, pick → `updateStrategy` + flush), `lib/studio/labels.ts`, `features/dashboard/project-card.tsx`, projects fragment + `useSuggestAudiencesMutation`
  - Evidence (2026-09-25): web typecheck and lint pass
- [x] [root] Live `SUGGEST_AUDIENCES` against the configured text provider — 2026-09-25: direct provider call (Anthropic) with the real prompt and schema on the seeded blender project, nothing written: 3 audiences in 9 s, all within 120/160/160, every fact id approved. Two phrases stretched past the facts (“carry in one hand”, “doubles as the drinking cup”), so the prompt now requires product details in an approved fact's words; not re-run
- [ ] [root] Spec QA §5.7 audience states at 390/1440 · 🔁 signed-in session, API rebuilt and restarted

## Phase 26 — Scene length follows narration; shoot plan on Media

References: Product Specification §3.20 · Design Reference §5.8, §5.12, §5.16 (revised 2026-09-25) · Implementation Plan Phase 26

> Reconciliation (2026-09-25): section added from Implementation Plan Phase 26, which was built before this tracker was reconciled. Statuses and evidence copy the plan's; the repository still carries them (`fitDuration` / `narrationSeconds` in `script-writing.ts`, `features/script-studio/spoken-length.ts`, `VideoEdit.shoot` in `video-edits.gql`, the Media `ShootPlanCard`).

- [x] [root] Gate: product owner reported Script and Media totals out of sync and asked for the shoot plan on Media (2026-09-25)
  - Evidence: dev database read-only diagnosis — scenes declared 4 s with up to 22 words; Script 0:21 vs a voiced Media 0:50, and 0:30 vs 0:35 on a second project
- [x] [api] `modules/scripts/script-writing.ts`: `WORDS_PER_SECOND`, `narrationSeconds`, `fitDuration`; word budget in the `WRITE_SCRIPT` and `REWRITE_SCENE` prompts; `coerceScene` fits; `updateScriptVersion` fits edited scenes; drafts read fitted; approval stores fitted scenes; the rewrite prompt quotes the fitted length
  - Req: §3.20 Rule, Generation, Creator edits, Reads and approval · Validate: specs for coercion, the 15 s cap, a longer scene kept, the prompt rule, the update path, a legacy draft read and approved, an approved legacy version read as stored
  - Evidence (2026-09-25): as the plan records
- [x] [api] SDL `video-edits.gql`: `VideoEdit.shoot: ShootPlan` and the `totalSeconds` description; `pinnedVersion` (current approval, else by id) feeds `shoot` and the legacy direction fill; API types and web codegen
  - Req: §3.20 Contract · Validate: spec for a current, needs-review and pre-§3.17 version
  - Evidence (2026-09-25): as the plan records
- [x] [web] Script: duration grows with narration and never shrinks; the input's `min` follows the narration; the §3.20 duration error copy; not saved while invalid; no error on read-only versions
  - Req: §3.20 Creator edits · Evidence (2026-09-25): as the plan records
- [x] [web] Media `features/media-mapping/media-page.tsx`: read-only Shoot plan card; the voiced-timing line; `ClipScene.presenter` into `clipPrompt` for creator shots, with the close kept under 500 characters
  - Req: §3.20 Media UI, AI clip prompt · Evidence (2026-09-25): API 41 suites / 296 tests, API and web typecheck, lint on the changed API and web folders pass. Web build not run (a dev server held `.next`) — rerun it with the Phase 27 web build
- [ ] [root] Live `WRITE_SCRIPT` and `REWRITE_SCENE` on a Taglish and an English project: record how often `coerceScene` lengthened a scene; tighten the prompt if more than one scene in five
- [x] [root] Fold §3.20 into the Design Reference (§5.8 duration error copy, §5.12 Shoot plan card and voiced-timing line, §5.16 prefill) via `/generate-design-request` (prompt-only)
  - Evidence (2026-09-25): carried out with §3.21 (`design/CLAUDE_DESIGN_REQUEST.md`): §5.8 duration rule, error copy and state; §5.12 Shoot plan card and voiced-timing line; §5.16 presenter prefill; handoff coverage for §5.8
- [ ] [root] Spec QA: Script (narration past the scene's length, duration below it, a legacy draft, a read-only approved legacy version) and Media (with and without a shoot plan, before and after a voiceover, a creator-shot clip prefill) at 390/1440 · 🔁 signed-in session, API rebuilt and restarted

## Phase 27 — Keep consistent and one-click scene clips

References: Product Specification §3.21 (approved 2026-09-25) · Design Reference §5.12, §5.16 (revised 2026-09-25; look and interaction live there) · Implementation Plan Phase 27 · decision R25

> Behind `AI_CLIPS_ENABLED`; open 19 still gates enabling in any shared environment. Reconciliation (2026-09-25): all tasks below are new; none has started.

### 27.0 Gate and provider recheck

- [x] [root] Gate: product owner approved §3.21 (2026-09-25); R25 records the four decisions (all-reference request, list from the script's props, scene 1 first, check then use)
- [x] [root] Recheck the MiniMax v2 create-task reference for `MiniMax-H3-Max`: 9 `reference_image` inputs in one request; a still from a generated video accepted as a reference; whether the prompt can address one reference (“the last photo”). Record in a Phase 27 pattern scan below; settle the §3.21 Prompt ⚠
  - Req: §3.21 Job, Prompt · Plan Phase 27 item 2 · Deps: none · Parallel: yes, with 27.1 · Validate: review
  - Accept: the recorded cap and roles match what the handler sends; if fewer than 9 references are allowed, §3.21's 8-item cap is lowered in both root documents before 27.2 starts
  - Evidence (2026-09-25): see “Pattern scan — Phase 27 keep consistent and one-click clips” below; the 8-item cap stands; the §3.21 Prompt ⚠ is settled (“the last reference image”)

### 27.1 Contract

- [x] [api] SDL: `enum ConsistentItemKind { PRODUCT PROP }`, `type ConsistentItem { id kind name sceneIds photo: Asset }` and `VideoEdit.consistentItems: [ConsistentItem!]!` in `video-edits.gql`; `input ConsistentItemInput { id name sceneIds assetId }` and `UpdateVideoEditInput.consistentItems`; `SceneClipMode.CONSISTENT` in `ai-clips.gql`; `continuitySceneId` / `continuityAssetId` on `AiClipInfo` (`assets.gql`) and `GenerationJob` (`generation-jobs.gql`); `pnpm --filter app-api generate-graphql-types`; web `pnpm --filter app-web codegen`
  - Req: §3.21 Contract · Deps: gate · Validate: API and web typecheck
  - Accept: generated types carry every field; no client reads a field the SDL lacks
  - Evidence (2026-09-25): `video-edits.gql`, `ai-clips.gql`, `assets.gql`, `generation-jobs.gql`; API types and web codegen regenerated; API and web typecheck pass

### 27.2 API

- [x] [api] `modules/video-edits/` [BP] extend (`video-edits.service.ts`, `repositories/video-edits.repository.ts`): `consistentItems` on the record; derive on `startVideoEdit` (product item from `product.title`, else “The product”, every scene; then one `PROP` per distinct `direction.props` item, split on “, ”, trimmed, whitespace collapsed, case-insensitive dedupe, first-appearance order, tagged with the scenes that name it; cap 8); re-derive on `switchVideoEditVersion` (photos kept by case-insensitive name, `CREATOR` tags kept where the scene still exists, unnamed `SCRIPT` items dropped); legacy read fill from `pinnedVersion` without persisting; GraphQL mapping resolves `photo` under the owner scope
  - Req: §3.21 Record, Derivation, Legacy, Tenancy · Deps: 27.1 · Validate: `video-edits.service.spec.ts` — derivation and dedupe, the cap, a version with no directions (product only), a switch keeping photos by name, a legacy read that writes nothing, a wrong-tenant photo resolved as absent
  - Evidence (2026-09-25): `consistent-items.ts` (`deriveConsistentItems` with ids derived from names, so an unstored list reads the same on every read and a later write matches it; `validateConsistentItems`), record field without a default, `itemsOf` legacy read, present mapping (product reads its live title; a removed or non-upload photo reads as none); `consistent-items.spec.ts` (3) and service specs for start, legacy read then store, switch
- [x] [api] `updateVideoEdit.consistentItems` (same file): replace the list; `ValidationError` with the field for a missing, renamed or scene-less product item, more than 8, an empty / over-60 / duplicate name, a scene id not in the edit, an `assetId` that isn't a ready `PHOTO` with origin `UPLOAD` in this project; new items get an id and `origin CREATOR`; a renamed `SCRIPT` item becomes `CREATOR`
  - Req: §3.21 Writes · Deps: previous · Validate: a spec per rejection, the id and origin rules, an AI clip refused as an item photo
  - Evidence (2026-09-25): service specs: save with photo, scenes, rename (origin → CREATOR) and a client-id new item; 8 rejections by field; AI clip refused as an item photo. The product’s sent name is ignored (it reads the title), recorded in §3.21 Writes
- [x] [api] `modules/ai-clips/ai-clips.service.ts`: `CONSISTENT` mode — explicit photo ids rejected (`ValidationError`); after the existing gates, `ConflictError CONSISTENT_ITEMS_INCOMPLETE` (“Add a photo for every item first.”) and `FIRST_SCENE_CLIP_NEEDED` (“Make scene 1's clip first.”); resolve and store on the job input the scene's tagged item photos (product first, list order, deduped by asset) and, past the first scene, the continuity source (previous scene in edit order, or the nearest earlier scene whose media is a photo or clip); `clipSeconds` as today; cost 4 × `clipCount`
  - Req: §3.21 One-click request · Deps: 27.1, video-edits task · Validate: `ai-clips.service.spec.ts` — each gate, the first scene with no continuity source, a text-card previous scene skipped, a reorder that changes the first scene, dedupe of a photo shared by two items
  - Evidence (2026-09-25): `consistentPhotos`: 6 specs (first scene photos product-first with no still; a later scene following the nearest earlier media past a text card at `clipStart + duration`; the product photo for a scene no item is in; items incomplete; first scene without an AI clip, scenes listed out of order; caller photo ids refused)
- [x] [api] `modules/render/render.service.ts`: a still-at-time helper beside `portraitFrame` (FFmpeg seek to `clipStartSeconds + scene seconds`, clamped to the clip's last frame, output cropped to 720 × 1280 JPEG)
  - Req: §3.21 Job · Deps: none · Parallel: yes · Validate: a render spec on a fixture clip for a mid-clip time and a time past the end (ffprobe reads 720 × 1280)
  - Evidence (2026-09-25): `portraitStill` (probe, clamp one frame inside the end, cover-crop); real-FFmpeg spec with the worker’s `ffmpeg-full`: 1 s and 5 s (past the end) of a 2 s fixture → 720 × 1280 mjpeg
- [x] [api] `ai-clip-storage.ts` + `s3.service.ts`: `MAX_AI_CLIP_FRAMES` 4 → 9 and the `PRIVATE_KEY_PATTERN` frame index `[0-3]` → `[0-8]`, changed together; the builder-to-allowlist contract spec covers n = 0…8 and still rejects n = 9 and the malformed neighbours
  - Req: §3.21 Job (the 2026-09-25 storage-key lesson) · Deps: none · Parallel: yes · Validate: `s3.service.spec.ts` contract spec through the real validator
  - Evidence (2026-09-25): builder and allowlist changed together; `s3.service.spec.ts` signs n = 0…8 through the real validator, rejects `-frame-9.jpg`, and the builder throws for index 9
- [x] [api] `ai-clip-jobs.handler.ts` + `modules/video/providers/minimax-video.provider.ts`: for `CONSISTENT`, crop each item photo, take the continuity still (the new helper for a clip source; a photo source through `portraitFrame`), presign all, send every image as `reference_image` with the still last and `ratio: "9:16"`; delete every temporary key in `finally`; `rightsConfirmedAt` = latest of all inputs; `aiClip.continuitySceneId` / `continuityAssetId` on the clip record
  - Req: §3.21 Job · Deps: storage keys, still helper, ai-clips task · Validate: handler spec (stub provider) for the first scene (no still) and a later scene (still last, every frame deleted, latest rights); provider mocked-fetch spec for the all-reference body
  - Evidence (2026-09-25): handler adds the continuity source after the item photos (clip → `portraitStill`, photo → `portraitFrame`), rights from all inputs, continuity ids on the clip; 2 handler specs. The provider needed no change: it already sends `ratio: "9:16"` whenever a reference is present

### 27.3 Web

- [x] [web] Operations: `consistentItems` (with `photo`) in the video-edit fragment (`react-query/video-edits/graphql/video-edits.ts`); `consistentItems` in the `updateVideoEdit` variables; `CONSISTENT` in the clip request; failure copy for the two new conflict codes in `lib/studio/labels.ts`
  - Req: §3.21 Contract, Cache · Deps: 27.1 · Validate: web typecheck
  - Evidence (2026-09-25): fragments carry `consistentItems { id kind name sceneIds photo }` and the continuity ids; server messages are user-safe and shown as they are (the web maps no conflict codes elsewhere), so `labels.ts` needed no change
- [x] [web] `features/media-mapping/media-page.tsx`: **Keep consistent** card below the Shoot plan card (item rows, 48 × 60 photo slot, product row read-only with the “Product” badge, inline rename with the three errors, scene toggle chips with `aria-pressed`, remove with its toast, **Add an item** with the 8-item limit, counter, hint, both ready lines); autosave through the page's `useAutosave` with `setQueryData` from the result; hidden unless `aiClipsEnabled`
  - Req: Design Reference §5.12 Keep consistent (§3.21) · Deps: operations · Validate: web typecheck, lint; keyboard and screen-reader names per the row table; no horizontal scroll at 360px
  - Evidence (2026-09-25): `features/keep-consistent/keep-consistent-card.tsx`, its own autosave source `keep-consistent` replacing the whole list; client-generated ids for new rows; an invalid row sends its last valid name, a new unnamed row waits; scene chips use the system `Toggle` chip; keyed by the script version so a switch reloads the list
- [x] [web] Item photo picker: the `features/media-picker/media-picker-sheet.tsx` anatomy titled “Photo for {name}”, photos only (no filter, no Text card, no AI clips), in-place Product uploader limited to photos with the rights checkbox, **Cancel** · **Use this**
  - Req: Design Reference §5.12 Item photo picker (`item-photo.*` in the interaction inventory) · Deps: card · Validate: upload in place, offline disabled, a photo reused across two items
  - Evidence (2026-09-25): `features/keep-consistent/item-photo-sheet.tsx`: photos only (uploads, never AI clips), APG radio group, “For Keys” reuse caption, in-place upload with rights checkbox, the finished upload selected
- [x] [web] Scene rows: the first-scene line; one-click **Generate clip** with `ButtonCost` “4 credits” (loading “Starting…”, idempotency key per click) and the four disabled reasons; the existing entry relabelled **Customize**; the status lines unchanged; `clipPrompt` `CONSISTENT` close in `features/ai-scene-clips/clip-prompt.ts` (item names; the “last photo” sentence past the first scene; the visual gives way first over 500)
  - Req: Design Reference §5.12 item 7 and §5.16 One-click clips; §3.21 Prompt · Deps: operations · Validate: a `clipPrompt` case per scene position and the 500 cap; web typecheck, lint
  - Evidence (2026-09-25): `ClipStatus` gains one-click **Generate clip** (`ButtonCost`, “Starting…”, idempotency key rotated per request, every row disabled while one starts) and **Customize**; reasons from the saved video (what the server gates on); `oneClickClipPrompt` + `SheetClipMode` in `clip-prompt.ts`. Checked by running the real module: first scene, a later scene with the “last reference image” sentence, the 500 cap keeping the close, and the sheet prefill unchanged
- [x] [web] `features/ai-scene-clips/ai-clip-sheet.tsx`: Review “Made from” for `CONSISTENT` (“Matched to 3 photos and scene 1: …”); the job prompt's claim flag above the checks; failed view — **Try again** reruns the same job, **Change the request** opens Match my photos with the first 4 item photos and the prompt kept
  - Req: Design Reference §5.16 Made from and Failed (one-click) · Deps: operations · Validate: web typecheck, lint, build (also closes the Phase 26 web build gap)
  - Evidence (2026-09-25): “Matched to 3 photos and scene 1: …”; Change the request opens Match my photos with the first 4; Try again from Review sends `CONSISTENT` only. Web typecheck and lint pass; production build passes (webpack, isolated copy; Turbopack rejects the copy’s symlinked `node_modules`, and the running dev server holds `.next`)

### 27.4 Privacy, live run, docs and QA

- [x] [web] Privacy copy: “the photos you choose, a still from the scene before, and your description” (⚠ legal confirms it with the pending R21 wording)
  - Req: §3.21 Privacy · Deps: none
  - Evidence (2026-09-25): `app/privacy-policy/page.tsx` adds “for a one-click clip a still from the scene before it”; legal confirmation stays open with R21
- [x] [root] Live run: scene 1 then scene 2 of one project with 3 items (8 credits of provider spend); check by eye that the props match across both clips and scene 2 follows scene 1's light and setting; record task ids here
  - Req: Plan Phase 27 item 9 · Deps: 27.2, 27.3 · 🔁 `MINIMAX_API_KEY` configured (already funded locally)
  - Evidence (2026-09-25): temporary script through the real frame helpers, key builder + allowlist, S3 and the MiniMax adapter on project `b863…6f9e` (no jobs or assets written; deleted after): scene 1 `445545061077487` (blender, tote bag, sneakers) succeeded in 27 s; scene 2 `445546148041159` (the same 3 + the still at 6 s, sent last) in 25 s; both 480 × 832 H.264 24 fps 6.59 s. By eye: every prop matches its photo; scene 2 keeps the blender, the cream sweater, the warm light and the tote. 4 temporary frames deleted
- [x] [root] Fold §3.21 into the Design Reference (§5.12 Keep consistent card and scene row entries, §5.16 Rules, Made from, failed view), `interaction-inventory.md` (the new `media-mapping.*` actions), `voice-content.md` and the screen inventory via `/generate-design-request` (prompt-only)
  - Evidence (2026-09-25): §5.12 (card, `item-photo-sheet`, scene row entry, 12 states), §5.16 (One-click clips, Made from, failed view, Rules, 2 states); interaction inventory (6 Media rows, `generate-clip` relabelled Customize, `item-photo-sheet` section); navigation map overlay; screen inventory; data requirements; demo list of 8 items in `voice-content.md`; handoff coverage (Media 29, clip sheet 28) and 4 Media QA items. §3.21's Media UI table is now a pointer
  - Req: Plan Phase 27 item 10 · Deps: none · Parallel: yes
- [ ] [root] Spec QA: every §3.21 state in Design Reference §5.12 and §5.16 and the four Media QA items in the handoff plan at 390/1440, a chain of three scenes, a reorder after scene 1's clip · 🔁 signed-in session, `VIDEO_BETA_ENABLED` and `AI_CLIPS_ENABLED` on, API rebuilt and restarted

## Phase 28 — Skit style and clip sound

References: Product Specification §3.22 (approved 2026-09-25) · Design Reference §5.7, §5.8, §5.9, §5.12–§5.16 (revised 2026-09-25; look and interaction live there) · Implementation Plan Phase 28 · decision R26

> Clip sound and the Skit style work without AI clips; only the AI clip prompt rows sit behind `AI_CLIPS_ENABLED` (open 19 still gates enabling in any shared environment). Reconciliation (2026-09-25): every task below was built the day it was approved, at the product owner's instruction “approve implement all”.

### 28.0 Gate and provider recheck

- [x] [root] Gate: product owner approved §3.22 with every open 21 decision as recommended; R26 recorded
  - Req: §3.22 Decisions · Plan Phase 28 item 1 · Evidence (2026-09-25): R26 in `open-decisions.md`
- [x] [root] Recheck MiniMax native audio (switch, language, spoken-line format, music) and settle the §3.22 prompt format
  - Req: §3.22 AI clip prompt · Deps: none · Evidence (2026-09-25): pattern scan “Phase 28 skit style and clip sound” above

### 28.1 Contract

- [x] [api] SDL: `ContentStyle.SKIT`; `SceneLine` / `SceneLineInput`; `ScriptScene.lines` / `sound`; `ScriptSceneInput.lines` / `sound`; `ScriptVersion.contentStyle`; `ClipSound` / `ClipSoundInput`; `VideoEditScene.lines` / `sound` / `clipSound`; `UpdateVideoEditInput.clipSounds`; `VoiceSource.SCENE`; `ExportSnapshotScene.clipSound`; API types and web codegen
  - Req: §3.22 Contract · Validate: API and web typecheck · Evidence (2026-09-25): `projects.gql`, `scripts.gql`, `video-edits.gql`, `voice-tracks.gql`, `exports.gql`; both generated

### 28.2 API

- [x] [api] `modules/scripts/` [BP] extend: skit schema and zod (`SKIT_SCRIPT_SCHEMA`, `SKIT_SCENE_SCHEMA`, `skitScriptOutput`, `skitSceneRewriteOutput`), `STYLE_GUIDE.SKIT`, skit rules (incl. the fact's-own-words rule added after the live run), `coerceScene(…, skit)` + `coerceLines`, `spokenText` for `fitDuration` / `spokenSeconds` / reported claims, `contentStyle` stamped and copied, rewrites following the version's style (`versionContext`), line claim check, `updateScriptVersion` `lines` / `sound` limits, brief skit lines
  - Req: §3.22 Generation, Coercion, Spoken length, Claim check, Creator edits, Copies and rewrites, Brief · Validate: `script-writing.spec.ts` (skits 6, brief 1), `scripts.service.spec.ts` (skits 7) · Evidence (2026-09-25): narrated prompts unchanged (asserted), 41 scripts tests pass
- [x] [api] `modules/video-edits/` [BP] extend: copy lines/sound; `clipSound` defaults and the within-style switch rule; `clipSounds` validation (5% steps); `VoiceSource.SCENE` (settles free, turns clip sound on, script timing, a skit's video starts on it); `SCENE` captions from the lines, editable by place (`captions.sceneEdits`), reset and switch clear them; `NO_NARRATION`; the voice jobs skip scenes without narration
  - Req: §3.22 Video edit, Voice step, Captions · Validate: `video-edits.service.spec.ts` (9), `voiceover-jobs.handler.spec.ts` (1), `voice-timing.spec.ts` (1) · Evidence (2026-09-25): 63 video-edits tests pass
- [x] [api] `modules/render/` + `modules/exports/`: `RenderScene.sound`; a sound-on clip at 1× holding its last frame; the scene-sound bed with 20 ms fades; a clip with no audio stream is silence; `alimiter=limit=0.95:level=false` only with clip sound; `alimiter` in `REQUIRED_FILTERS`; snapshot `clipSound`, details suffix, fingerprint only when a scene plays clip sound
  - Req: §3.22 Render, Export · Validate: real-FFmpeg render spec, export and toolchain specs · Evidence (2026-09-25): see Implementation Plan Phase 28 (6000 ms, tone RMS 2072 vs 388, held frame 0.0004); 42 suites / 353 tests with `ffmpeg-full`

### 28.3 Web

- [x] [web] Strategy: Skit with live sound and its hint · Req: §3.22 Style · Design Reference §5.7
- [x] [web] Script Studio: `scene-lines.tsx` (Lines, Sound), Cast, “Cast on camera”, lines' duration error, “· Skit”, `spoken-length.ts` `spokenText`; saved through `saveScenes`
  - Req: §3.22 Script Studio · Design Reference §5.8
- [x] [web] Voice: Sound from your clips card, disabled narrated cards with reason, info banner, “What people say” aside · Req: §3.22 Voice step · Design Reference §5.13
- [x] [web] Media + Edit & preview: Clip sound row, preview clip sound (level, 1×, muted with the toggle, silent outgoing layer), draft `clipSounds` and script timing, captions stretching until saved, Reset to the script, Media skit row, hold warnings, “Sound on” line, Cast label, Export final check · Req: §3.22 Edit & preview, Preview, Media, Export · Design Reference §5.12, §5.14, §5.15
- [x] [web] AI clips: skit tail in `clipPrompt` / `oneClickClipPrompt`; meta row sound copy; Review clips play with sound · Req: §3.22 AI clip prompt · Design Reference §5.16
  - Evidence (2026-09-25): web typecheck, lint on the changed features and a production build (isolated copy) pass; the composer was checked by a scratch script (the web app has no unit-test runner)

### 28.4 Live runs, fold and QA

- [x] [root] Live runs: skit `WRITE_SCRIPT` + `REWRITE_SCENE` in English and Taglish; two MiniMax clips with a sound cue and a line · Evidence (2026-09-25): Implementation Plan Phase 28; task ids in the pattern scan
- [x] [root] Fold §3.22 into the Design Reference and planning documents via `/generate-design-request` (prompt-only) · Evidence (2026-09-25): `design/CLAUDE_DESIGN_REQUEST.md` (carried out)
- [ ] [root] Spec QA: Strategy, Script (skit draft, read-only skit, narrated unchanged), Brief, Voice, Media, Edit & preview at 390/1440 per the §3.22 handoff QA items; one skit export (filmed clip with sound, AI clip with sound, photo) watched next to the preview · 🔁 signed-in session; API and media worker restarted on the Phase 28 build
- [ ] [root] ⚠ Product owner listens to the Taglish clip (`445585110557039`) to settle the §3.22 Filipino ⚠; if the line isn't Taglish, Filipino and Taglish skits leave lines out of the clip prompt

## Phase 29 — Studios and the Story step

References: Product Specification §3.23 · Design Reference §5.17 · Implementation Plan Phase 29 · R27–R29

- [x] [root] Fold Entertainment Studio into the prompt-only design source and record R27–R29.
  - Accept: §5D/§5.17, planning/system docs and handoff coverage specify every Story state and shared-surface revision.
  - Evidence/history: carried out 2026-09-26; preserved as completed by the 2026-09-27 reconciliation.
- [x] [api] Build the exhaustive studio registry and route shared step, prompt, claim-check, Keep consistent, clip, voice, end-card and reminder behavior through it.
  - Accept: every `StudioType` has one definition; Affiliate behavior is unchanged.
  - Evidence/history: `modules/studios/`; registry specs pass per Implementation Plan Phase 29.
- [x] [api] Add the studio/Story GraphQL contract, projects Story persistence, guards, steps, duplicate rules and premise suggestion job; regenerate types.
  - Accept: wrong-studio and wrong-tenant writes fail; story completion and resume are server-owned; exactly three validated premises persist.
  - Evidence/history: Phase 29 API items completed 2026-09-26; focused and full-suite evidence remains in the Implementation Plan.
- [x] [web] Build studio-neutral shared surfaces, New video dialog and the complete Story step through GraphQL/codegen/TanStack Query and react-hook-form/zod autosave.
  - Accept: Design Reference §5.17 states and actions are implemented at responsive widths; no mock/local production state.
  - Evidence/history: Phase 29 web items completed 2026-09-26; typecheck, lint and production build passed.
- [x] [root] Run live premise generation for Comedy, Action and Horror and record validation/safety results.
  - Evidence/history: completed 2026-09-26; three distinct premises per genre, caps and D6 rules passed.
- [ ] [root] Spec QA at 390/1440 for the shared surfaces and every Story state.
  - Reconciliation: revised by Phase 32; the Story rows must use the current §5.17 including R30.
  - Validate: signed-in browser, keyboard/screen-reader path, no horizontal overflow.

## Phase 30 — Story scripts and the story creator brief

References: Product Specification §3.23 · Design Reference §5.8–§5.9 · Implementation Plan Phase 30

- [x] [api] Add story script contract, prompt/schema/coercion, per-studio rewrites, approval without claim checks, cliffhanger enforcement and story brief template.
  - Accept: Affiliate prompts remain byte-identical; story values use only story allowlists; the last scene is Cliffhanger; generated records stay drafts.
  - Evidence/history: completed 2026-09-26; API suites and recorded live runs in the Implementation Plan.
- [x] [web] Add story variants to Script Studio and Creator brief.
  - Accept: story hooks/purposes, Cast, Story card, no fact/CTA UI, story job copy, approval and footer match §5.8–§5.9.
  - Evidence/history: completed 2026-09-26; web typecheck, lint and build passed.
- [x] [root] Run three rounds of live story scripts across Acted/Narrated, languages and genres.
  - Evidence/history: completed 2026-09-26; 0 of 50 scenes and 0 of 27 hooks needed coercion; D6 and cliffhanger rules held.
- [ ] [root] Spec QA at 390/1440 for Acted/Narrated story drafts, rewrites, approval, read-only version and brief; Affiliate unchanged.

## Phase 31 — Stories in the video steps

References: Product Specification §3.23 · Design Reference §5.12–§5.16 · Implementation Plan Phase 31

- [x] [api] Extend video edit, AI clips, render and exports for story characters, likeness, Describe only, story end card and no `#ad`.
  - Accept: owner/studio guards and likeness gate are server-owned; story renders and snapshots are correct; Affiliate behavior is unchanged.
  - Evidence/history: completed 2026-09-26; focused specs and real-FFmpeg story end-card evidence in the Implementation Plan.
- [x] [web] Build Media, AI clip sheet, Voice, Edit & preview and Export story variants.
  - Accept: every story-specific state and copy in §5.12–§5.16 is present; AI clip entry points remain behind `AI_CLIPS_ENABLED`.
  - Evidence/history: completed 2026-09-26; web typecheck, lint and build passed.
- [~] [api] Seed The Umbrella Standoff and Untitled story idempotently.
  - Evidence/history: seed code written; not run because the configured shared Atlas seed resets the owner's credits, ledger and demo renders.
  - Validate: run twice only with product-owner approval; assert identical records.
- [x] [root] Run two live Describe only clips and record provider results.
  - Evidence/history: completed 2026-09-26; visual continuity checked; spoken words and absence of music still need a human listen.
- [ ] [root] Spec QA at 390/1440 across story Media, clip sheet, Voice, Edit & preview and Export; render and watch one story export next to preview.

## Phase 32 — Short Story detail → complete AI premises

References: Product Specification §3.24 · Design Reference §5.17 (revised 2026-09-27) · Implementation Plan Phase 32 · R30

### Pattern scan — required before implementation

- Exemplars consulted: `apps/app-api/src/graphql/schemas/projects.gql`; `modules/projects/projects.service.ts`, `projects.story.spec.ts`, `premise-suggestions.handler.ts`, `premise-suggestions.handler.spec.ts`, `repositories/projects.repository.ts`; `apps/app-web/react-query/projects/graphql/projects.ts`, `projects-operations.ts`; `features/story-setup/story-form.schema.ts`, `premise-picker.tsx`, `story-page.tsx`; Design Reference §5.17.
- End-to-end trace: Story detail textarea → react-hook-form/zod → `useAutosave` → `useUpdateStoryMutation` → `updateStory` resolver/service → project repository → `Project.story.detail`; **Suggest premises** → `useSuggestPremisesMutation` → generation job/credit hold → `PremiseSuggestionsHandler` → text provider → zod/allowlisted coercion → `setPremiseSuggestions` with genre/detail snapshot → job completion/credit capture → project detail invalidation → premise cards.
- Pattern decisions: extend the existing Story record and `UpdateStoryInput`; normalize and validate in `ProjectsService`; keep server state in the project query cache; keep typed text as form draft only until autosave; reuse current paid-job/idempotency/polling/error patterns and wait for queued autosaves before the paid premise job starts; preserve the own-premise path and cast-fill-only-when-empty rule; no new component, token, route or cache key.
- Production mapping: persisted detail belongs to the project; suggestion-set genre/detail snapshot owns staleness; client zod gives immediate feedback while the API is authoritative; loading/failure/offline/retry remain the current premise-job states; an empty detail is valid; a detail alone never satisfies `isStoryDone`.
- Deviations: none.

### 32.1 Design and contract

- [x] [root] Carry R30 through the prompt-only design source and build documents via `/generate-design-request`.
  - Accept: Design Reference §5.17 has exact copy/layout/states/accessibility; interaction, planning, system, Product Specification and Implementation Plan agree.
  - Evidence/history: completed 2026-09-27; `design/CLAUDE_DESIGN_REQUEST.md` is marked carried out.
- [x] [api/web] SDL/codegen: add `Story.detail: String!`, `PremiseSuggestionSet.detail: String!`, optional `UpdateStoryInput.detail`; add both fields to the web project fragment; regenerate API types and web codegen.
  - Deps: 32.1 design. Parallel: no, contract first.
  - Accept: legacy records resolve both fields as `''`; generated files are changed only by their generators.
  - Validate: API and web typecheck.
  - Evidence/history: completed 2026-09-27 through `generate-graphql-types` and web `codegen`; both typechecks pass.

### 32.2 API

- [x] [api] Extend Story persistence/default/read/duplicate/seed with normalized `detail`; validate ≤ 160 in `ProjectsService.updateStory`; make `PremiseSuggestionSet.isStale` compare genre and normalized detail.
  - Deps: 32.1 contract.
  - Accept: empty detail clears to `''`; over limit throws the standard field error at `input.detail`; detail does not affect `isStoryDone`; missing legacy fields read empty; wrong tenant still fails at the project read.
  - Validate: `projects.story.spec.ts` covers blank, collapse, limit, legacy, detail-only stale/unstale, duplicate and wrong tenant.
  - Evidence/history: completed 2026-09-27; Story/default/legacy/stale/duplicate/tenant regression passes.
- [x] [api] Extend `PremiseSuggestionsHandler` to send the optional detail as one constraint and require three complete, distinct premises/casts; persist the genre/detail snapshot.
  - Deps: persistence task.
  - Accept: prompt says to develop rather than paraphrase the detail; no-detail requests remain valid; existing JSON schema, zod, D6 and cliffhanger rules remain.
  - Validate: handler specs with and without detail, snapshot assertion, existing invalid-output cases.
  - Evidence/history: completed 2026-09-27; present/missing detail, prompt rule, snapshot and existing invalid-output cases pass.
- [x] [api] Update the demo seed with the approved detail and preserve idempotence; do not execute against the shared database without approval.
  - Deps: persistence task.
  - Accept: Umbrella stores “Two strangers reach for the same umbrella.”; Untitled stores empty.
  - Evidence/history: source completed 2026-09-27; shared Atlas reset intentionally not run without approval.

### 32.3 Web

- [x] [web] Add `detail` to the Story form schema/defaults/patch mapping and the Premise card field; autosave with the existing debounce and flush behavior.
  - Deps: codegen.
  - Accept: exact §5.17 label, placeholder, helper and error; two rows/full width; visible during jobs/results; empty valid; disabled offline; mutation pending is guarded by existing autosave serialization.
  - Validate: web typecheck and lint; keyboard order and `aria-describedby`/`role=alert` inspection.
  - Evidence/history: completed 2026-09-27; exact field copy, two-row layout, helper/error associations, offline state and autosave-before-paid-job guard implemented; typecheck and lint pass.
- [x] [web] Derive staleness from the API snapshot and render the detail-only warning, with genre warning priority when both changed.
  - Deps: previous web task.
  - Accept: chosen premise and typed cast remain; changing back clears stale; the detail never sets `hasPremise` or unlocks Script.
  - Validate: web typecheck, lint and production build.
  - Evidence/history: completed 2026-09-27; local snapshot comparison clears when values are restored, genre has priority, and the production build passes.

### 32.4 Validation

- [x] [root] Run focused API specs, API/web typecheck and lint, web production build, and an Affiliate prompt regression.
  - Accept: no unrelated generated churn; existing Affiliate and own-premise behavior unchanged.
  - Evidence/history: focused 18/18 and full API 55 suites / 483 tests pass (including the Affiliate prompt digest); API/web typecheck and full lint, API build, web production build and generated outputs pass.
- [ ] [root] Fidelity QA at 390/1440: empty/typed detail, generated results, server error, detail stale, both-changed priority, suggesting, failure/retry, offline, own premise and keyboard/screen-reader order.
  - Deps: all Phase 32 build tasks; signed-in session.
  - Accept: current §5.17 passes and Phase 29's open Story rows are rerun against the revision.

## Phase 33 — Story episodes

References: Product Specification §3.25 · Design Reference §5.17, §4, §5.3, §5.8, §5.9, §5.14 (revised 2026-09-27) · Implementation Plan Phase 33 · R31

### Pattern scan — required before implementation

- Exemplars to consult: `apps/app-api/src/graphql/schemas/projects.gql`; `modules/projects/projects.service.ts` (`updateStory`, `assertStudio`), `repositories/projects.repository.ts`, `premise-suggestions.handler.ts`; `modules/project-duplicates/project-duplicates.service.ts` (copy pattern, `AssetsService.copyToProject`); `modules/scripts/script-jobs.handler.ts`, `script-studios.ts`, `story-writing.ts`, `creator-brief.service.ts`; `modules/studios/story.ts`, `studios.ts`; `modules/video-edits/consistent-items.ts`; web `features/story-setup/*`, `features/project-workflow/step-nav.tsx`, `features/dashboard/project-card.tsx`, `features/scene-editor/draft.ts`, `lib/studios/index.ts`, `react-query/projects/*`.
- End-to-end trace to confirm: **Next episode** → `useCreateNextEpisode` → `createNextEpisode` resolver → `ProjectsService` (+ `StorySeriesService`, `AssetsService`, video-edit consistent items) → repositories → project list/detail invalidation → route push. Episode 2+ **Write hooks & script** → existing job → handler adds `storyContinuity` → coercion → version saved with `isFinal`; `previousRecap` → series repository.
- Record deviations here before building.

### 33.1 Design and contract

- [x] [root] Carry R31 through the prompt-only design source and build documents via `/generate-design-request`.
  - Req: Product Specification §3.25 · Implementation Plan Phase 33 item 1.
  - Accept: Design Reference §4, §5.3, §5.8, §5.9, §5.14, §5.17 carry exact copy, layout, states and accessibility; interaction, navigation, screen inventory, planning, voice, Product Specification and Implementation Plan agree; open 23 resolved as R31.
  - Evidence/history: completed 2026-09-27; `design/CLAUDE_DESIGN_REQUEST.md` marked carried out.
  - Reconciliation: added.
- [ ] [api/web] SDL/codegen: `StorySeries`, `StoryEpisode`, `StoryPreviously`, `Project.series`, `createNextEpisode(projectId: ID!): Project!`, `UpdateStoryInput.isFinal`; error codes `EPISODE_NOT_LATEST`, `EPISODE_NOT_READY`, `SERIES_ENDED`, `SERIES_FULL`; add `series` to the web project fragment and the list query; regenerate API types and web codegen.
  - Req: §3.25 Contract · Phase 33 item 2. Deps: 33.1 design. Parallel: no, contract first.
  - Accept: affiliate projects resolve `series: null`; a story with no stored series resolves Episode 1 of 1 (`id: null`); generated files are changed only by their generators.
  - Validate: API and web typecheck.
  - Reconciliation: added.

### 33.2 API

- [ ] [api] `src/modules/story-series/`: repository (owner-scoped; unique `episodes.projectId`; unique series + episode number) and service; the project record's optional `series` field; `Project.series` field resolver (episodes with title and stage, `previous` from the previous episode's approved last scene, computed `continuityStale`).
  - Req: §3.25 Series storage, Stale continuity · Phase 33 item 3. Deps: contract.
  - Accept: wrong-owner reads return nothing; legacy stories read as a series of one; stale is true only when the previous episode's latest approved version differs from `writtenFromVersion`.
  - Validate: repository and service specs.
  - Reconciliation: added.
- [ ] [api] `createNextEpisode` in `ProjectsService`: `assertStudio(ENTERTAINMENT)`; refusals `EPISODE_NOT_LATEST`, `EPISODE_NOT_READY`, `SERIES_ENDED`, `SERIES_FULL` (50); idempotent on the series key; title “<episode 1 title> · Episode N” (≤ 80); copy genre, storytelling, language, length, cast; empty detail, premise and suggestions; no script; copy photos via `AssetsService.copyToProject`; seed character and prop Keep consistent items (with likeness confirmations) for Media; create the series on first use and write `series` onto Episode 1; no credits.
  - Req: §3.25 Next episode, E2, E3, E10 · Phase 33 item 4. Deps: series module.
  - Accept: a double call returns the same episode; editing the new episode's cast or items leaves the earlier episode unchanged; no ledger movement.
  - Validate: specs for every refusal, idempotency, copied and not-copied fields, asset copy, the cap.
  - Reconciliation: added.
- [ ] [api] `updateStory` rules and duplicate: episode 2+ refuses genre, storytelling, language and length (“Set by Episode 1.” at the field); `isFinal` accepted only on episode 2+ with no later episode; `ProjectDuplicatesService` drops `series` on the copy.
  - Req: §3.25 Locks, Duplicate, E7 · Phase 33 item 5. Deps: series module.
  - Accept: Episode 1 edits still work and don't propagate; a duplicated episode resolves as Episode 1 of 1.
  - Validate: projects story specs, duplicate spec.
  - Reconciliation: added.
- [ ] [api] Prompts and recaps: `storyContinuity(series)` and `STORY_FINAL_RULE` in `studios/story.ts`; the continuity block in episode 2+ `WRITE_SCRIPT`, `REWRITE_SCENE` and premise suggestions (the idea cast coerced to the project's cast); the final rule replaces the cliffhanger rule when `isFinal`; `previousRecap` (≤ 300, coerced) stored on the series with `recapFromVersion`; `writtenFromVersion` and the version's `isFinal` recorded; the last-scene fallback when a recap is missing.
  - Req: §3.25 Continuity prompt, Ending rule, Episode ideas, E4–E7 · Phase 33 item 6. Deps: series module, `updateStory` rules.
  - Accept: Episode 1 and affiliate prompts are byte-identical to today (digest spec); the `lastScene` coercion is unchanged; an idea naming a non-cast character loses it.
  - Validate: story-writing, script-jobs, premise-handler specs.
  - Reconciliation: added.
- [ ] [api] Brief and credits label: `Episode: N of M` (`…, final`) when the series has 2+ episodes; the episode premise; `Ending` for a final version's last scene; usage label “Suggest what happens next” for episode 2+.
  - Req: §3.25 Brief · Design Reference §5.9, §3 · Phase 33 item 7. Deps: prompts (version `isFinal`).
  - Validate: creator-brief story spec; credits label spec.
  - Reconciliation: added.
- [ ] [api] Seed: “The Umbrella Standoff · Episode 2” and the series record linking Episodes 1–2; idempotent (ids in the delete-then-recreate list). Do not run it against the shared Atlas database without the product owner's go-ahead.
  - Req: §5 demo data · Phase 33 item 10. Deps: series module.
  - Reconciliation: added. ⚠ Execution keeps the existing shared-database approval gate.

### 33.3 Web

- [ ] [web] `features/story-setup/`: `episodes-card.tsx` (rows, `aria-current`, Show all after 6, Next episode / Open episode N, the four disabled reasons, failed banner, toast); `useCreateNextEpisode` in `react-query/projects/` (invalidate the project list and this project, then push the new route); `previously-card.tsx`; the locked Genre and Format on episode 2+; the “What happens next” copy on `premise-picker.tsx`; the Cast copy line; `ending-card.tsx` (Final episode switch through the existing autosave; disabled rule); the footer reason “Choose or write what happens next”.
  - Req: Design Reference §5.17 Episodes · Phase 33 item 8. Deps: contract; API create and `updateStory`.
  - Accept: every §5.17 episode state renders from server data; nothing is held only in local state; offline disables Next episode and paid buttons.
  - Validate: web typecheck, lint.
  - Reconciliation: added.
- [ ] [web] Shared surfaces: rail subject line in `features/project-workflow/step-nav.tsx` via `lib/studios/index.ts` (“Comedy · Episode 2 of 3”, “…, final”); the “Ep 2” badge in `features/dashboard/project-card.tsx`; Script Studio's Ending label, caption and stale-continuity note; the end line prefill in `features/scene-editor/` (first switch-on only, not final, never refilled).
  - Req: Design Reference §4, §5.3, §5.8, §5.14 · Phase 33 item 9. Deps: contract.
  - Validate: web typecheck, lint, production build.
  - Reconciliation: added.

### 33.4 Validation

- [ ] [root] Live run: Next episode from The Umbrella Standoff; write Episode 2 (the first scene picks up Ben's question; Episode 1's recap saved); suggest ideas for Episode 3 (cast unchanged); write a final Episode 3 (last scene resolves, labelled Ending); record coercion corrections.
  - Req: Phase 33 item 11. Deps: 33.2. Needs the configured text provider.
  - Reconciliation: added.
- [ ] [root] Focused and full validation: story-series, projects, scripts, premise and brief specs; full API suite; API/web typecheck and lint; API build and web production build; Affiliate and Episode 1 prompt regressions unchanged; `pnpm check-skills`.
  - Req: Phase 33 item 12.
  - Reconciliation: added.
- [ ] [root] Fidelity QA at 390/1440 against the §5.17 episode states and the §4, §5.3, §5.8, §5.9, §5.14 revisions (Handoff Plan rows marked §3.25), including keyboard order, screen-reader names, offline and the create failure.
  - Req: Phase 33 item 13. Deps: all Phase 33 build tasks; signed-in session.
  - Reconciliation: added.

## Cross-phase verification

- [x] Security and authorization (owner filters on every resolver; upload key generation; import allowlist; model output coercion)
- [x] Data and seed integrity (seed idempotent; no demo values in production code paths)
- [x] GraphQL/codegen and client integration (API types + web codegen regenerated after every SDL change)
- [x] Accessibility and responsive behavior
- [~] Fidelity QA (Implementation Plan checklist) — fixture-backed visual rows ran; live data, sign-in and generation rows remain to be re-verified
- [ ] (Batch 2) Security: media worker has no network listener; rights recorded per upload; signed download URLs expire in 5 minutes; secrets by name only
- [ ] (Batch 2) Data: `VideoEdits`, `VoiceTracks`, `Exports` tenant-scoped with wrong-tenant specs; exports and tracks immutable; seed idempotent
- [ ] (Batch 2) Fidelity QA: Batch 2 table in the Implementation Plan, incl. the Media output row
- [x] (Phase 22) Security and data: `MINIMAX_API_KEY` by name only; the provider sees only a 15-minute presigned GET of a server-made 9:16 frame (deleted after the job), never the original key; downloads are https-only, 100 MB-capped and time-limited, streamed to a task temp dir; AI clips stay tenant-scoped assets (wrong-tenant check spec); unchecked clips can't fill a scene (`CLIP_NOT_CHECKED` spec), so they never render — 2026-09-25
- [x] (Phase 27) Security and data: the provider sees only 15-minute presigned GETs of server-made 720 × 1280 frames (item photos and the continuity still), every one deleted after the job; the continuity source and every item photo resolve under the job's owner scope (wrong-tenant spec); an AI clip is never accepted as an item photo; items and clips stay tenant-scoped on the video edit and assets
  - Evidence (2026-09-25): frames are server-made, presigned 15 minutes and deleted in `finally` (handler spec counts them); item photos are validated against the project’s owner-scoped ready assets and the continuity source is read from the owner-scoped presented edit and media records; an AI clip is refused as an item photo (spec); the video-edit service’s wrong-tenant spec covers the new write path (the project read fails first); `pnpm check-tenant-scope` passes
- [~] (Phase 23) Render timing: an export with transitions keeps every scene start, voice part and caption time of the all-cut timeline, and its length is unchanged (23.2 render spec); `xfade` available in the deploy media-worker image
- [x] Lint, typecheck, tests, and build (`pnpm lint`, `pnpm typecheck`, `pnpm --filter app-api test`, `pnpm --filter app-web build`) — auth hook lint error and product autosave React Compiler warning fixed; web lint is clean

## Decisions and blockers

- [x] Google OAuth configured; `QA-BYPASS(Phase 0)` sign-in path removed (API, web, env examples, environment catalog) and stale `dev:` Google links cleared from local accounts.
- [x] Live Google sign-in round-trip passed in the browser (account, workspace, 50 starter credits, session, then a dashboard `createProject`). Demo data reseeded under the QA Google account (`SEED_OWNER_EMAIL` supplied by the product owner); authenticated per-screen browser reruns remain.
- [x] Anthropic approved by the product owner 2026-09-24 as a supported text provider alongside OpenAI; recorded in the Product Specification (Runtime, Provider, secrets rule), the Implementation Plan and resolved decision R9. Browser job-panel completion QA remains open.
- [x] S3 unblocked: real AWS keys configured; bucket CORS rule added for the local web origins (preflight was `403`) and documented in the README; the upload path passed end to end. The in-browser uploader still needs the signed-in browser pass.
- ⚠ review (product owner declined the change 2026-09-24, on the premise that an unset `NODE_ENV` means production): verified that the API resolves an unset `NODE_ENV` to `development` (`env.schema.ts` default; `start:prod` is `node dist/main` and sets nothing), and with `TURNSTILE_ENABLED=true` `TurnstileService.isEnabled` is then `false`. Every deployment must set `NODE_ENV=production` explicitly, or bot protection is silently off.
- ⚠ blocked (Batch 2 runtime): `ELEVENLABS_API_KEY` / `ELEVENLABS_MODEL_ID` / `ELEVENLABS_VOICE_IDS` are not configured for Phase 17 live runs. Phase 19 renders pass locally with `ffmpeg-full`; the deploy media-worker image still needs `libx264`, `libass` and `drawtext` confirmation.
- ⚠ open (Batch 1 QA): the signed-in browser pass per screen — sign-in `returnTo`/expired redirect, in-browser uploader, job-panel completion states, and every row verified earlier through `QA-BYPASS(Phase 0)`.
- [x] Phase 22 approval: product owner approved Design Reference §5C and Product Specification §3.18 on 2026-09-25.
- ⚠ blocked (Phase 22 enabling only): open 19 reviewed 2026-09-25 and decided as R21; it closes when the R21 items ship, legal confirms the privacy wording, and the product owner requests MiniMax's written approval to be named. The live provider, the S3 key fix, a live job and the AI clip render check all passed 2026-09-25. Browser QA is partly done (see Phase 22); two review fixes are open.
- [x] Phase 27 approval: product owner approved Product Specification §3.21 on 2026-09-25; R25 records its four decisions.
- [x] Phase 28 approval: product owner approved Product Specification §3.22 on 2026-09-25 with every decision as recommended (R26: filmed and AI clips, AI clips may speak the approved lines, no AI sound effects yet, no new prices).
- [x] Phase 33 approval: product owner approved Product Specification §3.25 on 2026-09-27 as recommended (R31, E1–E10; open 23 resolved).
- [x] Phase 32 approval: product owner chose the recommended R30 flow on 2026-09-27 — one optional short detail guides three complete premise suggestions; it does not generate one final story directly.
- ⚠ open (Phase 28): nobody has listened to the Taglish live-run clip yet; the §3.22 Filipino ⚠ stays until the product owner does.
- ⚠ blocked (Phase 27 enabling only): the same open 19 gate as Phase 22. Building, specs and the local live run proceed behind `AI_CLIPS_ENABLED`.
- Decisions: open decisions 1, 3, 7–19 in `design/planning/open-decisions.md` (2, 4, 5 resolved as R13–R15; R16–R18 record voice, render and worker; 6 resolved as R19 (MiniMax `MiniMax-H3-Max`); R20 records the clip experience; 19 is the MiniMax terms review); `⚠ decision` trim items (password auth kept unused, admin-management kept, account deletion kept unlinked, React 19.1 override kept). R22 (2026-09-25, was open 20): the script model picks scene transitions within the §3.19 rules; the server corrects model output only. R23 (multi-photo clip modes, one clip by default), R24 (audience suggestions) and R25 (2026-09-25: keep-consistent list from the script's props, one-click clips sent as all references with a still of the previous scene, scene 1 first, check then use).
- Assumptions: the Kafka async-event module is not used for jobs (not wired, needs a broker); the in-API worker runs in every API instance with an atomic claim.

## Progress log

- 2026-09-24: Tracker generated from the first Product Specification and Implementation Plan. Design docs (prompt, planning, system, handoff) complete.
- 2026-09-24: Fixed the auth-session React lint gate; verified web lint/typecheck/build, API tests, MongoDB connectivity, tenant scope and the locked skills snapshot.
- 2026-09-24: Seeded the canonical demo data through the configured local development identity and reran it successfully; live GraphQL authentication returned 128 credits, all five seeded projects and no errors. One unrelated existing project was preserved.
- 2026-09-24: Extended live read-only GraphQL QA through `QA-BYPASS(Phase 0)`: all five deterministic seed ids are present; credits are 128/held 0; workflow stages, fact counts, blender script v1–v3, bottle script v1, and both creator briefs match the seed. Three unrelated local projects are currently present and were left untouched.
- 2026-09-24: Removed a real Anthropic key from tracked `.env.example`; confirmed no key remains in the Git index or tracked worktree. Rotate that key before any provider QA.
- 2026-09-24: Diagnosed S3 upload: corrected local region from `us-east-1` to the bucket's `eu-west-1`; AWS then reported `InvalidAccessKeyId`. Removed all five exact temporary QA asset records; no object upload succeeded.
- 2026-09-24: Regenerated the four source catalogs and verified they match; removed all four API lint warnings without suppressions; full workspace lint and production build pass, API typecheck passes, and all 27 suites / 146 tests pass.
- 2026-09-24: Reconciled the root `.env.example` with the validated runtime schema: removed deleted mobile push/payment configuration and mobile CORS origins, added the current auth/text/credits/import variable names with blank values, then regenerated the environment catalog. Only intentional script/module variables outside the main schema remain in its cross-check section.
- 2026-09-24: Removed `QA-BYPASS(Phase 0)` after Google OAuth was configured (API and web client ids verified well-formed and matching); cleared the `dev:` Google subject on two local placeholder accounts so real Google sign-in can link them; typecheck, lint and all 27 suites / 147 tests pass. Ran `SUGGEST_ANGLES`, `WRITE_SCRIPT`, `REWRITE_HOOK` and `REWRITE_SCENE` handlers against the live Anthropic model on the blender seed with persistence intercepted — all passed output validation (7s/22s/9s/10s). S3 object operations still fail with `InvalidAccessKeyId`.
- 2026-09-24: Turnstile is now skipped in local development on both sides: the web ignores the site key under `next dev`, and the API skips verification while `NODE_ENV=development` regardless of `TURNSTILE_ENABLED`. Spec added; turnstile/auth suites, typecheck and lint pass.
- 2026-09-24: Review pass over the uncommitted bypass-removal and Turnstile changes: zero `QA-BYPASS`/`DEV_BYPASS`/`DEV_SIGN_IN` hits in `apps/`, `packages/`, `docs/`; zero `qa-fixtures` references. API typecheck, web `tsc --noEmit`, `pnpm lint` (3 projects), `pnpm catalogs:check`, `pnpm check-tenant-scope`, `pnpm check-skills` pass; API jest 27 suites / 148 tests pass. Filed the `NODE_ENV` default Turnstile finding above. No Notion Projects/Pipeline Items state layer exists for this project, so no phase status was synced.
- 2026-09-24: Product owner supplied the seed Google account and approved Anthropic. Confirmed from the database that the first real Google sign-in (13:11 local) provisioned a Google-linked user, personal workspace, a 50-credit `GRANT`, a session, and a user-created project 5s later. Ran `seed:demo` twice for that account: 5 deterministic projects, 18 facts, 4 script versions, 1 failed job, one credit account at 128/0; the user-created project was preserved.
- 2026-09-24: Product owner resolved Batch 2 decisions: R13 light scene edits on mobile web, R14 TikTok-first export preset, R15 user-uploaded music with rights confirmation. Recorded in `design/planning/`, the handoff plan, the design prompt, the Product Specification, the Implementation Plan and this tracker.
- 2026-09-24: Product owner chose ElevenLabs voice (R16), FFmpeg render (R17) and a separate worker process (R18). Drafted Batch 2 across `design/` (Design Reference §5B for Media, Voice, Edit & preview and Export video; components; IA, navigation map, 78 interaction rows, data requirements, flows F11–F14; handoff coverage and QA), Product Specification §3.12–§3.16 and Implementation Plan Phases 15–20 behind an approval gate and `VIDEO_BETA_ENABLED`. New open decisions 16–18 (export retention, voice allowlist, audio limits).
- 2026-09-24: S3 QA after the product owner configured AWS keys: `S3Service` presigned PUT / head / signed GET / delete round trip passed. The bucket had no CORS configuration, so browser preflights returned `403`; with owner approval, added a CORS rule (origins `http://localhost:4302`, `http://127.0.0.1:4302`; `PUT`/`GET`/`HEAD`; header `content-type`; expose `ETag`) and the preflight now returns 200. Then ran `AssetsService` end to end on the hero project with a 70-byte PNG: upload ticket → PUT with `Origin` 200 → `READY` → preview 200 → remove (object 404, no leftover record). Temporary QA scripts deleted. Product Specification corrected: `AssetUploadTicket` returns `asset`, not `assetId`.
- 2026-09-24: Product owner set `SEED_OWNER_EMAIL` locally and approved Batch 2. Recorded `Approved: 2026-09-24` on Design Reference §5.12–§5.15 and cleared every draft marker across `design/`, the Product Specification, the Implementation Plan (Batch 2 gate `[x]`) and this tracker.
- 2026-09-24: Phase 18 built: Edit & preview API rules and page with live preview, reorder, captions, music and end card; API specs, lint, typecheck and build pass; browser QA open.
- 2026-09-24: Phase 17 built: ElevenLabs adapter, voice tracks, voiceover and recording-timing jobs in the media worker, caption builder, Voice step; mocked-provider specs and a real-database run pass; live generation waits for ElevenLabs keys.
- 2026-09-24: Phase 16 built: video edit API, Batch 2 steps behind `VIDEO_BETA_ENABLED`, Media step and media picker; API, real-database and build checks pass; browser QA open.
- 2026-09-24: Phase 15 built and validated (12 tasks `[x]`): job queues and runner, media worker process with FFmpeg boot check, audio uploads, Batch 2 env names, `render` tenant-scope entry, web failure copy by job type. Local FFmpeg (Homebrew 8.0.1) lacks `drawtext`/`ass`, so the worker refuses to start locally until a libass + freetype build is installed.
- 2026-09-24: Reconciled this tracker after Batch 2 approval (`/generate-project-tasks`): Product Specification `050f412…` → `2e1966c…`, Implementation Plan `5ce29b6…` → `c1838d9…`. See the reconciliation report.
- 2026-09-24: Attempted the remaining local screenshot pass with Safari WebDriver. Safari requires its persistent “Allow remote automation” security setting, and enabling that setting was not authorized, so the driver was stopped without opening a browser session.
- 2026-09-24: Phase 21 (shot direction and shoot plan) built outside a reconciliation: SDL, generation, autosave edits, brief block, seed and web; 37 suites / 233 API tests, API and web typecheck/lint, web build and catalogs pass. Tasks were added to this file by hand at the time (fingerprints not advanced).
- 2026-09-25: Decision 6 resolved as R19 (MiniMax `MiniMax-H3-Max`, pay-as-you-go) and R20 (sheet from Media, 2 clips, own photo + required check, 6 s, 4 credits per clip); open 19 added for the terms review.
- 2026-09-25: `/generate-design-request` (prompt-only, per the locked canonical command) carried out `design/CLAUDE_DESIGN_REQUEST.md`: Design Reference §5.8/§5.9 revised, §5C (§5.16) added with 21 states, §5.12 entry points; navigation map (3 overlays), interaction inventory (6 Script + 26 clip rows), screen inventory, data requirements, components, flow F15, voice/demo data, handoff coverage; Product Specification §3.17 trimmed to a pointer and §3.18 added; Implementation Plan Phase 22 added behind an approval gate.
- 2026-09-25: Reconciled this tracker (`/generate-project-tasks`): Product Specification `2e1966c…` → `40a629f…`, Implementation Plan `c1838d9…` → `f63f60d…`. See the reconciliation report.
- 2026-09-25: Phase 22 built (16 tasks and the cross-phase check `[x]`; Fidelity QA open): env names, SDL + codegen, MiniMax v2 adapter, `ai-clips` module and media-worker handler, asset origin and AI clip record, split credit capture, video-edit rules, clip sheet with Request/Generating/Review views, check and discard dialogs, Media and picker entry points, privacy copy. Evidence under Phase 22.
- 2026-09-25: Product owner approved Design Reference §5C and Product Specification §3.18. Recorded `Approved: 2026-09-25` in §5C and cleared the draft markers across `design/`, both root documents and this tracker; `design/CLAUDE_DESIGN_REQUEST.md` marked carried out; the project `.claude/commands/generate-design-request.md` wrapper now delegates to the locked canonical command (it had said the command applied only to Claude Design). Reconciled: Product Specification `40a629f…` → `ba45151…`, Implementation Plan `f63f60d…` → `2c10e9d…`.
- 2026-09-25: Fixed the Phase 22 live-job S3 blocker: shared AI clip key builders now match the private S3 allowlist for the temporary frame and generated MP4, malformed shapes still fail, and unexpected pre-provider errors become `INTERNAL`. Focused 32 tests and all 40 API suites / 258 tests pass; API formatting, lint, typecheck and build plus tenant-scope and locked-skills checks pass. The funded MiniMax live run remains separate and open.
- 2026-09-25: Product owner approved Product Specification §3.19 (scene transitions) and closed open 20 as R22. `/generate-design-request` (prompt-only) superseded the carried-out request and folded §3.19 into Design Reference §5.8, §5.9, §5.14 and §5.15, the interaction inventory (2 rows), screen inventory, data requirements, `voice-content.md` and the handoff coverage and QA items. §3.19 Surfaces became a pointer; Implementation Plan Phase 23 gate and fold-in `[x]`.
- 2026-09-25: Reconciled this tracker (`/generate-project-tasks`): Product Specification `8bd9ea2…` → `bdd4749…`, Implementation Plan `1cd55e0…` → `dea7e4b…`. See the reconciliation report.
- 2026-09-25: Reviewed Codex's Phase 23 build against §3.19 and Design Reference §5.8/§5.9/§5.14/§5.15. Workspace typecheck, 40 API suites / 270 tests, web lint (1 warning) and web production build pass; the transition render spec rendered for real with the worker's `ffmpeg-full`. 8 build tasks `[x]` (plus the gate and fold-in), 4 `[~]`, 4 review fixes added (23.5; one is a Script autosave data loss). Implementation Plan Phase 23 synced.
- 2026-09-25: Applied the four Phase 23 review fixes, corrected the seed's Punch-in to scene 4, re-seeded twice (identical), ran the live model check (1 of 19 picks corrected) and regenerated API types. Typecheck, 40 API suites / 270 tests with `ffmpeg-full`, API and web lint (0 warnings), web build pass. Only Spec QA remains (needs a signed-in session and a rebuilt API); the deploy-image `xfade` check stays open.
- 2026-09-25: Media follow-up specified (Product Specification §3.19 Media step row; Design Reference §5.12 items 4–6 and 3 states; handoff coverage 14 → 17 and 2 QA items; data requirements; voice copy; screen inventory). 3 tasks added under 23.6 (`[ ]`); Implementation Plan Phase 23 gains 2 items; Spec QA now includes Media. Fingerprints not advanced (additive scope, recorded here).
- 2026-09-25: Implemented 23.6 (Media follow-up) at the product owner's request: API `VideoEditScene.direction` with a read-time fallback for older edits, Media direction line, Punch-in hint and overlap-aware clip warning, and the seed stores directions. Typecheck, 40 API suites / 271 tests, API and web lint, web build pass. Spec QA still open.
- 2026-09-25: R23 recorded (multi-photo AI clips: three modes, AI clips only). Drafted Design Reference §5.16 revision (mode control, per-mode photo selection, prefills, Made from line, 4 new states → 25), Product Specification §3.18 R23 rows and build-order row 24, Implementation Plan Phase 24 behind an approval gate, 2 interaction rows + 1 revised, data requirements, voice copy. Phase 24 tasks added here, all `⚠ blocked` on approval.
- 2026-09-25: Phase 24 built at the product owner's request (R23 approved; one clip by default): API modes, count, indexed frames + allowlist, provider roles, script visual rule; web sheet with modes, count, multi-photo picker, Made from line; privacy wording. 40 API suites / 286 tests, workspace typecheck, API and web lint, web build pass; live run of all three modes succeeded. Only Spec QA remains (signed-in session).
- 2026-09-25: AI clips now match their scene's length (5–15 s, from the presented edit) instead of a fixed 6 s; clip labels show whole seconds. Checks pass; nothing generated.
- 2026-09-25: R24 audience suggestions built (Phase 25): `SUGGEST_AUDIENCES` job, `audienceSuggestionSet`, Strategy Audience card picker. Specs, typecheck and lints pass; live run and Spec QA open.
- 2026-09-25: Phase 26 (scene length follows narration; shoot plan on Media) built outside a reconciliation; evidence is in the Implementation Plan and now in Phase 26 here.
- 2026-09-25: Product owner asked for a Media list of props to keep consistent and a one-click scene clip built from them and the previous scene. The four product decisions were answered (R25) and Product Specification §3.21 drafted with Implementation Plan Phase 27; the product owner approved it the same day.
- 2026-09-25: Reconciled this tracker (`/generate-project-tasks`): Product Specification `1d85f4b…` → `1eed476…`, Implementation Plan `f5a934b…` → `daf8072…`. See the reconciliation report.
- 2026-09-25: `/generate-design-request` (prompt-only) superseded the carried-out scene transitions request and folded §3.20 and §3.21 into Design Reference §5.8, §5.12 and §5.16, the interaction inventory, navigation map, screen inventory, data requirements, `voice-content.md` and the handoff coverage and QA items. Implementation Plan Phase 26 and 27 fold items `[x]`; reconciled again: Product Specification `1eed476…` → `2a543dc…`, Implementation Plan `daf8072…` → `33a631c…`.
- 2026-09-25: Phase 27 built at the product owner's request (“implement it all yourself”): SDL + codegen; API Keep consistent list (derive, legacy read, validate, switch), one-click `CONSISTENT` mode with gates and continuity source, `portraitStill`, frame keys 0…8 with the allowlist, handler continuity still; web Keep consistent card, item photo sheet, one-click Generate clip + Customize, one-click prompt, sheet Made from and Change the request; privacy line. API 42 suites / 327 tests (with `ffmpeg-full`), workspace lint, API and web typecheck, web production build (isolated), tenant scope, catalogs (collections regenerated) and locked skills pass. Live MiniMax chain of two clips passed and was checked by eye. Only Spec QA remains.
- 2026-09-25: Fixed Media “We couldn't load your video.”: the running API (`pnpm start:dev`, started 16:02) predated the Phase 27 SDL, so `videoEdit` and `projectAssets` failed with `GRAPHQL_VALIDATION_FAILED` on the new fields; its watcher had recompiled files but never restarted the app. With no job queued or running, the watcher and the media worker were stopped, `nest build` rebuilt `dist`, and both were restarted; introspection lists `consistentItems` and the web's operation now reaches auth instead of failing validation. Learning proposal `skill-contributions/2026-09-25-restart-schema-first-api-after-sdl-change.json` (validated).
- 2026-09-25: Phase 28 (§3.22 skit style and clip sound, R26) approved (“approve implement all”) and built the same day: SDL + codegen; API skit writing (second schema, rules, coercion, spoken text, line claim check, brief), video edits (clip sound, `SCENE` voice source, captions from the lines, `NO_NARRATION`, voice jobs skipping scenes without narration), render (1× sound-on clips, scene-sound bed, limiter) and exports; web Strategy, Script Studio, Voice, Media, Edit & preview, AI clip prompt and Export. API 42 suites / 353 tests with `ffmpeg-full`, typecheck, lint and tenant scope pass; web typecheck, lint and a production build pass. Live runs with Anthropic and MiniMax (task ids in the pattern scan); a fact-wording rule was added after the first run (3 flags down to 0). Folded into the Design Reference via `/generate-design-request` (prompt-only). Open: signed-in Spec QA and listening to the Taglish clip.
- 2026-09-27: `/generate-design-request AI Creation Platform` carried out in prompt-only mode for R30. The completed 2026-09-26 request was superseded with a focused Story-detail revision; §5.17, handoff coverage, interaction inventory, planning/system docs, Product Specification §3.24 and Implementation Plan Phase 32 now specify one optional ≤160-character detail expanded into three complete premise-and-cast options. Phases 29–31 were added to this tracker from their canonical completed history; Phase 32 implementation is unstarted.
- 2026-09-27: Phase 32 implemented end to end: GraphQL contract/codegen; normalized Story persistence and legacy reads; genre/detail suggestion snapshots and staleness; complete-premise prompt behavior; exact Story field/copy/accessibility/offline/stale states; autosave completion before the paid job; and the approved seed values. Focused 18/18 and full API 55 suites / 483 tests, both typechecks and full lints, API build, web production build and diff check pass. Shared Atlas seed execution and signed-in 390/1440 Fidelity QA were not run.

- 2026-09-27: Story episodes requested (“the entertainment should not just end with 5 scenes, it should continue like by episodes”), drafted as §3.25 with E1–E10 and approved as recommended (R31). Folded into the prompt-only design source via `/generate-design-request`; Phase 33 added to the Implementation Plan and this tracker. No application code changed.

## Reconciliation report

### 2026-09-27 (§3.25 Story episodes, R31)

- Canonical documents compared: Product Specification `f4ba1bd…` → `ba80be73e58d4d9e88a0788e1ba72474af124fbd` (new §3.25, §3.23 out-of-scope line superseded, §5 demo data, §6 build order, §7 checklist); Implementation Plan `4af2234…` → `ea75c4f87f9694217150b2672e4e8deab1ac0862` (Phase 33, dependency graph, scope line).
- Preserved unchanged tasks: every Phase 0–32 task, its status and evidence. Phases 29–32 acceptance criteria are unaffected: Episode 1 behaves as today, and R29 still holds for every non-final episode.
- New: Phase 33, 13 tasks — design fold `[x]`; contract, 6 API (series, create, `updateStory`/duplicate, prompts/recaps, brief/label, seed), 2 web, live run, validation and Fidelity QA `[ ]`. Added the Story episodes production-mapping row.
- Revised: source fingerprints, current phase, decisions (Phase 33 approval), progress log.
- Blockers: none for building. Running the seed against shared Atlas keeps its product-owner approval gate; Fidelity QA needs the signed-in session.
- Superseded/removed/reopened: none in this tracker. In the canonical docs, §3.23's “episodes or linked parts” exclusion and R29's “Parts and series stay out of scope” clause are superseded by R31 (history kept in place).
- Validation still required: all Phase 33 build, live-run and Fidelity QA rows.

### 2026-09-27 (§3.24 short Story detail, R30)

- Canonical documents compared: Product Specification `0a6f9e1…` → `f4ba1bd34feb164fdfaa1a97bf47ee8b6d0844f4`; Implementation Plan `f814344…` → `4af223436452eefc6b74eafb6e72df36e18cb218` (Phase 32 implementation evidence/status advanced after the original design reconciliation).
- Preserved unchanged tasks: every existing Phase 0–28 task and its evidence/status.
- Added from previously untracked canonical history: Phases 29–31, 14 summarized executable/history tasks (10 completed, 1 in-progress seed and 3 open Spec QA groups), matching the Implementation Plan evidence without reopening completed work.
- New: Phase 32, 9 tasks — design fold, contract, 3 API/seed, 2 web and focused validation `[x]`; Fidelity QA `[ ]`.
- Revised: the Story production-mapping row, source fingerprints/current phase, one Phase 29 Story QA acceptance criterion (rerun against current §5.17), decisions and progress log.
- Blockers: no design or implementation blocker remains. Fidelity QA needs the existing signed-in session; running the seed against shared Atlas retains its product-owner approval gate.
- Superseded/removed/reopened: none. The earlier carried-out design request is preserved by reference in the new request and its delivered scope remains in §5D.
- Validation still required: the revised signed-in Story Fidelity QA at 390/1440; existing browser/live QA rows remain unchanged.

### 2026-09-25 (§3.22 skit style and clip sound: approved, built and folded)

- Canonical documents compared: Product Specification `bf9ad8c…` → `0a6f9e1…` (§3.22 added, approved as R26, refined to the build and pointed at the Design Reference; §3.20's voiced-timing condition excludes `SCENE`; §6 row 28) · Implementation Plan `42daba9…` → `f814344…` (Phase 28 added; every build task, the live runs and the fold `[x]`).
- Preserved unchanged tasks: every task before Phase 28.
- New: Phase 28 (13 tasks, 11 `[x]`, 2 open: Spec QA and the Taglish listen).
- Revised / reopened / superseded / removed: 0. Blocked: 0 (Spec QA waits on a signed-in session, as every phase's does).
- Phase status check: matches the Implementation Plan.

### 2026-09-25 (§3.20 and §3.21 Design Reference fold)

- Canonical documents compared: Product Specification `1eed476…` → `2a543dc…` (§3.20 and §3.21 statuses record the fold; §3.21's Media UI table replaced by a Surfaces pointer; the product item is named from `product.title`) · Implementation Plan `daf8072…` → `33a631c…` (Phase 26 and 27 fold items `[x]`).
- Preserved unchanged tasks: every task except the six below. The fold moved §3.21's UI copy into Design Reference §5.12/§5.16 word for word, so no acceptance criterion changed.
- Revised: 6 — both fold tasks `[ ]` → `[x]` (evidence above); four Phase 27 web and QA tasks now cite the Design Reference sections instead of the removed table; the mapping table's Observable outcome for §3.21 names §5.12/§5.16.
- New / reopened / superseded / removed / blocked: 0.
- Phase status check: matches the Implementation Plan.
- Validation still required: unchanged from the entry below.

### 2026-09-25 (§3.21 keep consistent and one-click scene clips)

- Canonical documents compared: Product Specification `1d85f4b…` → `1eed476…` (§3.20 and its build-order row 26; §3.18 Clip length revision; new §3.21 with Media UI and production mapping, approved; build-order row 27) · Implementation Plan `f5a934b…` → `daf8072…` (Phase 22 label review fix `[x]`; Phase 24 clip-length item; Phase 26; Phase 27 with its gate `[x]`; dependency-graph line). The previous blobs are not in the Git object store, so the comparison was by content: every Implementation Plan item in Phases 22–27 was matched to a task here, and statuses were checked against the repository where they differed.
- Preserved unchanged tasks: every Phase 0–21, 23 and 25 task; Phase 22 except one; Phase 24 (only its references line changed from “draft” to approved). §3.21 changes no existing acceptance criterion: `SceneClipMode` gains a value, the three existing modes and the sheet keep their behavior, and the widened frame allowlist still rejects every malformed shape.
- Revised: 1 — Phase 22 clip-label review fix `[ ]` → `[x]` (the plan records it done; `clip-card.tsx` floors the label; the Upload photos check stays with Phase 22 Fidelity QA). Mapping table: Media row names §3.20; one new row for §3.21. Reuse contract: a Phase 27 KEEP [BP] line.
- New: 27 — Phase 26 (8, copied from the plan with its statuses: 5 `[x]`, 3 `[ ]`); Phase 27 (18: gate `[x]`, 17 `[ ]` — the provider recheck, 1 contract, 6 API, 5 web, privacy, live run, fold and Spec QA); 1 Phase 27 cross-phase security/data check `[ ]`.
- Reopened / superseded / removed: 0.
- Blocked: 0 new. Retained — Phase 22 and 27 enabling (open 19), ElevenLabs keys for Phase 17 live runs, deploy-image FFmpeg (`libx264`, `libass`, `drawtext`, `xfade`), signed-in browser reruns, Turnstile `NODE_ENV` review note.
- Phase status check: matches the Implementation Plan after the Phase 22 fix above. Phase 26's web build was not run (the plan says so); it rides on the Phase 27 web build task.
- Validation still required: all Phase 27 work, then its live run and Spec QA; Phase 26 live-model run, fold and Spec QA; open Spec QA rows for Phases 21–25.

### 2026-09-25 (§3.19 scene transitions)

- Canonical documents compared: Product Specification `8bd9ea2…` → `bdd4749…` (new §3.19 Scene transitions with its production mapping; Surfaces a pointer to the revised Design Reference; build-order row 23) · Implementation Plan `1cd55e0…` → `dea7e4b…` (Phase 23 with gate and fold-in `[x]`; dependency-graph line). The pre-session index versions (`7b9951e…` · `abeaf32…`) also differ from the stored fingerprints; that drift is the Phase 22 R21 and review-fix items, which this tracker already carries (the Phase 22 review-fix and R21 tasks), so no Phase 22 task changed.
- Preserved unchanged tasks: every Phase 0–22 task and cross-phase check. §3.19 only adds scope, and Phase 23 changes no existing acceptance criterion: legacy script versions, video edits and export snapshots read `CUT`, so the Phase 16–21 behavior and specs still hold.
- New: 17 — Phase 23 gate `[x]`, fold-in `[x]`, 1 contract, 7 API, 4 web, live run and Spec QA (14 `[ ]`), plus 1 Phase 23 cross-phase render-timing check `[ ]`.
- Revised: 0 tasks; the mapping table's Observable outcome column for Script, Creator brief, Edit & preview and Export now names the §3.19 revisions.
- Reopened / superseded / removed: 0.
- Blocked: 0 new. Retained — Phase 22 enabling (open 19), ElevenLabs keys for Phase 17 live runs, deploy-image FFmpeg (now also needs `xfade`), signed-in browser reruns, Turnstile `NODE_ENV` review note.
- Phase status check: matches the Implementation Plan — Phase 23 gate and fold-in `[x]`, the rest `[ ]`; Phases 19–22 unchanged.
- Validation still required: all Phase 23 build tasks; the live model run; Spec QA and the transition render check.

### 2026-09-25 (after approval)

- Canonical documents compared: Product Specification `40a629f…` → `ba45151…` (§3.18 status: approved) · Implementation Plan `f63f60d…` → `2c10e9d…` (Phase 22 gate `[x]`; enabling note; dependency graph).
- Preserved unchanged tasks: all Phase 0–21 tasks; all 17 Phase 22 tasks keep their acceptance criteria.
- Unblocked: 18 — the 17 Phase 22 tasks and the Phase 22 cross-phase check (`⚠ blocked` → `[ ]`; none has started). Blocker history: approval requested 2026-09-25, granted 2026-09-25.
- New: 1 — Phase 22 gate task (`[x]`).
- Revised: 1 — privacy-policy task no longer depends on open 19 to draft; its wording is rechecked when open 19 closes.
- Reopened / superseded / removed: 0.
- Retained blockers: enabling and live-provider runs for Phase 22 (open 19, `MINIMAX_API_KEY`); ElevenLabs keys (Phase 17 live runs); signed-in browser reruns; Turnstile `NODE_ENV` note.
- Phase status check: matches the Implementation Plan — Phase 21 `[x]` except the live-model run and Fidelity QA; Phase 22 gate `[x]`, work `[ ]`.
- Validation still required: Phase 21 live run and QA; all Phase 22 work.

### 2026-09-25 (§5C specified)

- Canonical documents compared: Product Specification `2e1966c…` → `40a629f…` (§3.17 shot direction, now a pointer to revised §5.8/§5.9; §3.18 AI scene clips; build-order rows 21–22; planned-but-not-specified note) · Implementation Plan `c1838d9…` → `f63f60d…` (Phase 21 with the fold item `[x]`; Phase 22 with its gate; dependency graph). The Phase 21 tasks written by hand on 2026-09-24 were compared against the repository and the revised Design Reference.
- Preserved unchanged tasks: every Phase 0–20 task (no acceptance criterion in those phases changed) and 8 of 10 Phase 21 tasks (implementation and validation evidence still hold: 37 suites / 233 tests; builds pass).
- Revised: 1 — Phase 21 Fidelity QA now targets the revised Design Reference §5.8/§5.9 (not started, `[ ]`).
- Unblocked and completed: 1 — Phase 21 “Fold §3.17 into the Design Reference” (`⚠` → `[x]`, done 2026-09-25). One spec line (server-rejection field error) was corrected to the built autosave behavior instead of adding a task.
- Reopened: 0.
- New: 18 — Phase 22 (17 tasks across configuration/contract, API, web, privacy and QA) and 1 Phase 22 cross-phase security/data check. All `⚠ blocked` on approval of §5C/§3.18.
- Blocked: 18 new (approval gate); retained — ElevenLabs keys for Phase 17 live runs, signed-in browser reruns, Turnstile `NODE_ENV` review note.
- Superseded/removed: 0.
- Phase status check: matches the Implementation Plan — Phase 21 items `[x]` except the live-model run and Fidelity QA (`[ ]`); Phase 22 `[ ]` behind its gate. Mismatch noted: `design/planning/screen-inventory.md` lists `script-studio` and `creator-brief` as `in-build` until the Phase 21 QA passes.
- Validation still required: Phase 21 live-model run and Fidelity QA; all of Phase 22 after approval.

### 2026-09-24

- Canonical documents compared (2026-09-24): Product Specification `050f412…` → `2e1966c…` (Anthropic approved; Batch 2 §3.12–§3.16 added and approved; demo-data and database notes; `AssetUploadTicket.asset` correction; bucket CORS note) · Implementation Plan `5ce29b6…` → `c1838d9…` (runtime inputs, Batch 2 gate, Phases 15–20, Batch 2 QA table and exit, blocker text).
- Preserved unchanged tasks: 55 of 61 Batch 1 tasks (status, evidence and notes untouched).
- Revised (acceptance or evidence updated, `[x]` kept because current evidence validates it): 3 — Phase 0 env names (Anthropic names present), 2.3 text generation (Anthropic provider verified live), Phase 5 seed (reseeded under the owner's Google account).
- Unblocked (blocker history kept, remaining browser rows named): 3 — Phase 4 sign-in (Google configured, bypass removed, live provisioning), Phase 8 product (AWS keys + bucket CORS, upload path verified), Phase 10 strategy (text provider configured, handler live).
- Reopened: 0 — no Batch 1 acceptance criterion gained unstarted work; browser-only reruns stay in Implementation Plan `[~]` Fidelity QA rows.
- New: 49 — Batch 2 gate (1, `[x]`: approved 2026-09-24), Phases 15–20 (45 `[ ]`: 15 → 12, 16 → 10, 17 → 9, 18 → 6, 19 → 4, 20 → 4) and 3 Batch 2 cross-phase checks.
- Blocked: 1 validation sub-item — ElevenLabs keys for Phase 17 live runs. Phase 19 local FFmpeg conformance is resolved; deploy-image capability confirmation and signed-in browser rows remain release QA. No Batch 2 task is blocked from starting.
- Superseded/removed: 1 — the “Phase 15+ — Batch 2 `⚠ needs spec`” placeholder, replaced by the gate and Phases 15–20 (history in the gate task's note).
- Resolved or retained blockers: resolved — Google OAuth, text-provider scope, S3 upload, Batch 2 product decisions and approval; retained — signed-in browser reruns (Batch 1 `[~]`), Turnstile `NODE_ENV` review note.
- Phase status check: matches the Implementation Plan — Phases 0–14 build items `[x]` with Fidelity QA `[~]`; Batch 2 gate `[x]`; Phases 15–20 `[ ]`.
- Validation still required: Batch 1 signed-in browser pass; all Batch 2 phases.

## Verification

Change: Batch 1 built — boilerplate trimmed (mobile, payments, push, notifications, admin web removed); credits, generation-jobs, text-generation, projects, assets, facts, scripts, project-duplicates modules added; creator web studio (sign-in, projects, product, facts, strategy, script, brief) built.
Before: `git ls-tree HEAD --name-only apps/app-api/src/modules/` → `… notifications organizations payments push-notifications push-tokens s3 … store-purchases …` (no projects/facts/scripts/credits); `apps/app-web/app/` → `(super-admin) admin delete-account … login …`
After: `ls apps/app-api/src/modules` → `… assets auth credits facts generation-jobs … project-duplicates projects s3 scheduler-locks scripts sessions text-generation …`; `ls apps/app-web/app` → `(app) … icon.svg … privacy-policy sign-in`
Checks: api `npx tsc --noEmit` — pass · api `npx jest --runInBand` — pass, 27 suites / 146 tests · `node scripts/check-tenant-scope.mjs` — pass · `pnpm check-skills` — pass (matches lock @ 331af58f) · `pnpm catalogs:check` — pass, 4 generated catalogs match source · `pnpm test:design-handoff` — pass (incremental release and prompt-only design source tests) · `pnpm lint` — clean pass across shared constants, API and web · `pnpm build` — pass for API and web, 12 web routes · product autosave uses React Hook Form's non-rendering `subscribe` API and render-time `useWatch` · Playwright fixture pass, 7 app screens × 1440/390 — no page errors, no horizontal overflow · live read-only GraphQL pass through `QA-BYPASS(Phase 0)` — 128 credits, five deterministic seeds, workflow/fact/script/brief data consistent
Tenant: `npx jest -t "wrong|another owner|other owner|tenant"` — 30 passed; new modules: projects, facts, scripts, assets, generation-jobs "treats a … from another tenant as not found", credits "does not read or spend credits from a wrong tenant"
Not run: real Google sign-in round trip — OAuth client ids not configured; local `QA-BYPASS(Phase 0)` authentication and seeded GraphQL reads passed · successful S3 upload/signed GET — presign reached the correct `eu-west-1` bucket, but AWS credentials are placeholders and AWS rejected the access key with `InvalidAccessKeyId` · approved OpenAI job completion — `OPENAI_API_KEY`/`OPENAI_TEXT_MODEL` not configured; an Anthropic provider change is present but not approved in the canonical specification, and its exposed key must be rotated · screenshot after header-alignment fix — Safari WebDriver requires the persistent “Allow remote automation” security setting; enabling it was not authorized, so no browser session was opened
