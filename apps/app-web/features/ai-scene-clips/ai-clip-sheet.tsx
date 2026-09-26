'use client';

import { CheckIcon, InfoIcon, UploadIcon } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';
import { useDebounce } from 'use-debounce';

import { ClaimFlagCallout } from '@/components/studio/claim-flag-callout';
import { JobPanel, type JobPanelCopy } from '@/components/studio/job-panel';
import { MediaThumb } from '@/components/studio/media-thumb';
import { Button, ButtonCost } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ChoiceGroup } from '@/components/ui/choice-group';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { UploadTile } from '@/features/product-setup/media-card';
import { useAssetUploads } from '@/features/product-setup/use-asset-uploads';
import { useIdempotencyKey } from '@/features/project-workflow/use-project-jobs';
import { useProject } from '@/features/project-workflow/workflow-state';
import { CREDIT_COST } from '@/lib/studio/labels';
import { studioOf, type StudioPresentation } from '@/lib/studios';
import { cn } from '@/lib/utils';
import {
  useClipPromptFlagsQuery,
  useDiscardAiClipsMutation,
  useGenerateSceneClipsMutation,
} from '@/react-query/ai-clips/ai-clips-operations';
import {
  assetsQueryKeys,
  type ProjectAsset,
} from '@/react-query/assets/assets-operations';
import {
  isJobActive,
  useRetryGenerationJobMutation,
  type GenerationJobRecord,
} from '@/react-query/generation-jobs/generation-jobs-operations';
import {
  GenerationJobStatus,
  SceneClipMode,
  type ShotFraming,
  type ShotSubject,
} from '@/react-query/generated__types';

import { AccuracyCheck } from './accuracy-check';
import { ClipCard } from './clip-card';
import {
  CLIP_PROMPT_MAX,
  DEFAULT_CLIP_COUNT,
  clipSecondsFor,
  MODE_PHOTOS,
  clipPrompt,
  type ClipAudio,
  type ClipContext,
  sheetModeOf,
  type SheetClipMode,
} from './clip-prompt';

/** Clip jobs made before the count existed asked for two clips (R20). */
const LEGACY_CLIP_COUNT = 2;
const costOf = (count: number) => count * CREDIT_COST.aiClip;
const clipsLabel = (count: number) =>
  `${count} ${count === 1 ? 'clip' : 'clips'}`;
const countOf = (job: GenerationJobRecord | null) =>
  job?.clipCount ?? LEGACY_CLIP_COUNT;

/** The modes that start from the creator's photos. */
type PhotoClipMode = Exclude<SheetClipMode, SceneClipMode.Describe>;

const PHOTO_MODE_OPTIONS: { value: SheetClipMode; label: string }[] = [
  { value: SceneClipMode.FirstFrame, label: 'Start from a photo' },
  { value: SceneClipMode.FirstLastFrame, label: 'Move between two' },
  { value: SceneClipMode.References, label: 'Match my photos' },
];
/** A studio that describes clips offers Describe only first (§3.23, R28 D2). */
const DESCRIBE_MODE_OPTIONS: { value: SheetClipMode; label: string }[] = [
  { value: SceneClipMode.Describe, label: 'Describe only' },
  ...PHOTO_MODE_OPTIONS,
];
const MODE_HINT: Record<SheetClipMode, string> = {
  [SceneClipMode.Describe]:
    'The AI makes the clip from your description. Name who is in it and how they look.',
  [SceneClipMode.FirstFrame]:
    'The clip starts on your photo and moves from there.',
  [SceneClipMode.FirstLastFrame]:
    'The clip starts on the first photo and ends on the second. The AI makes the move between them.',
  // Worded by the studio (`clips.referencesHint`).
  [SceneClipMode.References]: '',
};
const COUNT_OPTIONS = [
  { value: '1', label: '1 clip' },
  { value: '2', label: '2 to compare' },
];

/** The photos a job used, in request order. */
export function jobPhotos(job: GenerationJobRecord | null): string[] {
  if (!job) return [];
  if (
    job.clipMode === SceneClipMode.References ||
    job.clipMode === SceneClipMode.Consistent
  ) {
    return job.referenceAssetIds ?? [];
  }
  return [job.sourceAssetId, job.endAssetId].filter((id): id is string =>
    Boolean(id),
  );
}
const PHOTO_TYPES = 'image/jpeg,image/png,image/webp';
const OFFLINE =
  'Generating and using clips will be possible when you reconnect.';

/** The scene a clip request is for. */
export interface ClipScene {
  sceneId: string;
  order: number;
  /** The scene's length in the video; the clip is made this long. */
  durationSeconds: number;
  visual: string;
  direction: {
    framing: ShotFraming;
    inFrame: ShotSubject;
    setting: string;
    props?: string;
  } | null;
  /** The scene's current photo, preselected as the first frame. */
  photoId: string | null;
  /** The shoot plan's on-camera person, for shots of the creator. */
  presenter: string | null;
  /** A skit scene's sound cue and lines; the clip is made with that sound. */
  audio: ClipAudio;
  /** The script's situation, tone, language, opening shot and product name. */
  context: ClipContext;
}

function jobCopy(sceneNumber: number, job: GenerationJobRecord): JobPanelCopy {
  const count = countOf(job);

  return {
    title: `Generating ${clipsLabel(count)}`,
    steps: [
      jobPhotos(job).length > 1
        ? 'Sending your photos'
        : job.clipMode === SceneClipMode.Describe
          ? 'Sending your description'
          : 'Sending your photo',
      'Making the clips (usually 1 to 3 minutes)',
      'Checking the files',
    ],
    failedLead: 'Clip generation didn’t finish.',
    kept: 'Your scene’s media is unchanged.',
    reassurance: `You can close this and keep working. We’ll save ${count === 1 ? 'the clip' : 'both clips'} to this project, and scene ${sceneNumber} shows when ${count === 1 ? 'it’s' : 'they’re'} ready.`,
    retryCost: costOf(count),
  };
}

/**
 * `ai-clip-sheet` (Design Reference §5.16): request one or two AI clips for a
 * scene from the creator's photos (one of three modes, R23), follow the job,
 * then check one and use it.
 * The view follows the scene's latest clip job.
 */
export function AiClipSheet({
  open,
  onOpenChange,
  projectId,
  scene,
  job,
  clips,
  made,
  photos,
  uploadCount,
  online,
  balance,
  sceneNumbers,
  onTrack,
  onUse,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  scene: ClipScene | null;
  /** The scene's latest clip job. */
  job: GenerationJobRecord | null;
  /** That job's clips that no scene uses yet. */
  clips: ProjectAsset[];
  /** How many clips that job made, used or not. */
  made: number;
  /** The project's own ready photos. */
  photos: ProjectAsset[];
  /** Uploads counted toward the 20-file limit. */
  uploadCount: number;
  online: boolean;
  balance: number | null;
  /** Each scene's number in the video, for the one-click “Made from” line. */
  sceneNumbers: Map<string, number>;
  onTrack: (job: GenerationJobRecord) => void;
  /** Records the check and puts the clip in the scene. */
  onUse: (clip: ProjectAsset) => Promise<void>;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent aria-describedby={undefined} className="sm:w-140">
        {open && scene ? (
          <ClipSheetBody
            key={scene.sceneId}
            projectId={projectId}
            scene={scene}
            job={job}
            clips={clips}
            made={made}
            photos={photos}
            uploadCount={uploadCount}
            online={online}
            balance={balance}
            sceneNumbers={sceneNumbers}
            onClose={() => onOpenChange(false)}
            onTrack={onTrack}
            onUse={onUse}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function ClipSheetBody({
  projectId,
  scene,
  job,
  clips,
  made,
  photos,
  uploadCount,
  online,
  balance,
  sceneNumbers,
  onClose,
  onTrack,
  onUse,
}: {
  projectId: string;
  scene: ClipScene;
  job: GenerationJobRecord | null;
  clips: ProjectAsset[];
  made: number;
  photos: ProjectAsset[];
  uploadCount: number;
  online: boolean;
  balance: number | null;
  sceneNumbers: Map<string, number>;
  onClose: () => void;
  onTrack: (job: GenerationJobRecord) => void;
  onUse: (clip: ProjectAsset) => Promise<void>;
}) {
  const [requesting, setRequesting] = useState(false);
  const studioCopy = studioOf(useProject().studio).clips;
  const retry = useRetryGenerationJobMutation({
    onSuccess: ({ retryGenerationJob }) => onTrack(retryGenerationJob),
    onError: (error) => toast.error(error.message),
  });
  const failed = job?.status === GenerationJobStatus.Failed;
  const view = requesting
    ? 'request'
    : job && (isJobActive(job) || failed)
      ? 'generating'
      : job?.status === GenerationJobStatus.Completed && clips.length > 0
        ? 'review'
        : 'request';

  return (
    <>
      <SheetHeader>
        <SheetTitle>Generate a clip for scene {scene.order}</SheetTitle>
        <SheetDescription>
          {studioCopy.sheetDescription}
        </SheetDescription>
      </SheetHeader>

      {view === 'request' ? (
        <RequestView
          projectId={projectId}
          scene={scene}
          previous={requesting || failed ? job : null}
          photos={photos}
          uploadCount={uploadCount}
          online={online}
          balance={balance}
          onCancel={onClose}
          onStarted={(started) => {
            setRequesting(false);
            onTrack(started);
          }}
        />
      ) : view === 'generating' && job ? (
        <>
          <SheetBody className="flex flex-col gap-4 p-5">
            <JobPanel
              job={job}
              copy={jobCopy(scene.order, job)}
              retrying={retry.isPending}
              online={online}
              onRetry={() => {
                if (!online || retry.isPending) return;
                retry.mutate({ id: job.id });
              }}
              secondaryAction={{
                label: 'Change the request',
                onClick: () => setRequesting(true),
              }}
            />
          </SheetBody>
          <SheetFooter>
            <Button onClick={onClose}>Close</Button>
          </SheetFooter>
        </>
      ) : job ? (
        <ReviewView
          projectId={projectId}
          scene={scene}
          job={job}
          clips={clips}
          made={made}
          photos={photos}
          online={online}
          balance={balance}
          sceneNumbers={sceneNumbers}
          onClose={onClose}
          onTrack={onTrack}
          onUse={onUse}
        />
      ) : null}
    </>
  );
}

function RequestView({
  projectId,
  scene,
  previous,
  photos,
  uploadCount,
  online,
  balance,
  onCancel,
  onStarted,
}: {
  projectId: string;
  scene: ClipScene;
  /** A failed or edited request whose photo and description are kept. */
  previous: GenerationJobRecord | null;
  photos: ProjectAsset[];
  uploadCount: number;
  online: boolean;
  balance: number | null;
  onCancel: () => void;
  onStarted: (job: GenerationJobRecord) => void;
}) {
  const studio = studioOf(useProject().studio);
  const has = (id: string | null | undefined) =>
    Boolean(id && photos.some((photo) => photo.id === id));
  // A one-click clip's request reopens as Match my photos with its photos; a
  // story's that sent none reopens as Describe only, the story's first mode.
  const initialMode: SheetClipMode =
    studio.clips.describe &&
    previous?.clipMode === SceneClipMode.Consistent &&
    !jobPhotos(previous).some(has)
      ? SceneClipMode.Describe
      : sheetModeOf(
          previous?.clipMode,
          studio.clips.describe
            ? SceneClipMode.Describe
            : SceneClipMode.FirstFrame,
        );
  const [mode, setMode] = useState<SheetClipMode>(initialMode);
  const [count, setCount] = useState(previous?.clipCount ?? DEFAULT_CLIP_COUNT);
  const [picked, setPicked] = useState<string[]>(() => {
    const kept = jobPhotos(previous)
      .filter(has)
      .slice(0, MODE_PHOTOS[initialMode].max);
    if (kept.length) return kept;
    return has(scene.photoId) && scene.photoId ? [scene.photoId] : [];
  });
  const prefill = clipPrompt(
    scene.visual,
    scene.direction,
    mode,
    scene.presenter,
    scene.audio,
    scene.context,
  );
  const [prompt, setPrompt] = useState(previous?.prompt ?? prefill);
  const [debounced] = useDebounce(prompt.trim(), 300);
  // A story's description has no claim check (§3.23 Checks).
  const flags = useClipPromptFlagsQuery(
    { projectId, prompt: debounced },
    { enabled: studio.claimCheck && online && debounced.length > 0 },
  );
  const key = useIdempotencyKey();
  const generate = useGenerateSceneClipsMutation({
    onSuccess: ({ generateSceneClips }) => onStarted(generateSceneClips),
    onError: (error) => toast.error(error.message),
    onSettled: () => key.rotate(),
  });
  const promptId = useId();
  const flagsId = `${promptId}-flags`;
  const promptFlags = studio.claimCheck
    ? (flags.data?.clipPromptFlags ?? [])
    : [];

  const clipSeconds = clipSecondsFor(scene.durationSeconds);
  const limits = MODE_PHOTOS[mode];
  const pick = (id: string) =>
    setPicked((current) => {
      if (limits.max === 1) return [id];
      if (current.includes(id)) return current.filter((item) => item !== id);
      return current.length < limits.max ? [...current, id] : current;
    });
  const changeMode = (next: SheetClipMode) => {
    setMode(next);
    // Describe only sends no photos, so the picks wait for a photo mode.
    if (next !== SceneClipMode.Describe) {
      setPicked((current) => current.slice(0, MODE_PHOTOS[next].max));
    }
    // An edited description stays; an untouched one follows the mode.
    if (prompt === prefill) {
      setPrompt(
        clipPrompt(
          scene.visual,
          scene.direction,
          next,
          scene.presenter,
          scene.audio,
          scene.context,
        ),
      );
    }
  };

  // A photo uploaded here is picked once it is ready, when the mode has room.
  const [known, setKnown] = useState(
    () => new Set(photos.map((photo) => photo.id)),
  );
  const fresh = photos.find((photo) => !known.has(photo.id));
  if (fresh) {
    setKnown(new Set(photos.map((photo) => photo.id)));
    pick(fresh.id);
  }

  const cost = costOf(count);
  const short = balance !== null && balance < cost;
  const reason = !online
    ? OFFLINE
    : picked.length < limits.min
      ? mode === SceneClipMode.FirstFrame
        ? 'Pick a photo first'
        : mode === SceneClipMode.FirstLastFrame
          ? 'Pick the start and end photos'
          : `Pick at least ${limits.min} photos`
      : !prompt.trim()
        ? 'Describe the motion first'
        : short
          ? `You need ${cost} credits. You have ${balance}.`
          : null;

  return (
    <>
      <SheetBody className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-2">
          <p id={`${promptId}-mode`} className="t-label">
            How the clip uses your photos
          </p>
          <ChoiceGroup<SheetClipMode>
            label="How the clip uses your photos"
            variant="segment"
            value={mode}
            options={
              studio.clips.describe ? DESCRIBE_MODE_OPTIONS : PHOTO_MODE_OPTIONS
            }
            disabled={!online}
            onValueChange={changeMode}
            aria-describedby={`${promptId}-mode-hint`}
            className={cn(
              'w-full flex-col items-stretch sm:w-fit sm:flex-row sm:items-center',
              // Four modes can outgrow the sheet's row; they wrap, never overflow.
              studio.clips.describe && 'sm:flex-wrap',
            )}
            itemClassName="h-10 justify-start sm:h-9 sm:justify-center"
          />
          <p id={`${promptId}-mode-hint`} className="t-sm text-ink-2">
            {mode === SceneClipMode.References
              ? studio.clips.referencesHint
              : MODE_HINT[mode]}
          </p>
        </div>

        {mode !== SceneClipMode.Describe ? (
          <PhotoPicker
            projectId={projectId}
            mode={mode}
            photos={photos}
            uploadCount={uploadCount}
            selected={picked}
            online={online}
            onSelect={pick}
            onSwap={() => setPicked((current) => [...current].reverse())}
          />
        ) : null}

        <div className="flex flex-col gap-1.5">
          <label htmlFor={promptId} className="t-label">
            Describe the motion
          </label>
          <Textarea
            id={promptId}
            rows={4}
            maxLength={CLIP_PROMPT_MAX}
            value={prompt}
            disabled={!online}
            aria-describedby={
              promptFlags.length
                ? `${promptId}-hint ${flagsId}`
                : `${promptId}-hint`
            }
            onChange={(event) => setPrompt(event.target.value)}
          />
          <div className="flex items-start justify-between gap-3">
            <p id={`${promptId}-hint`} className="t-sm text-ink-2">
              {studio.clips.promptHint}
            </p>
            <span className="t-mono t-caption shrink-0 text-ink-3">
              {prompt.length} / {CLIP_PROMPT_MAX}
            </span>
          </div>
          {prompt !== prefill ? (
            <Button
              variant="link"
              className="self-start text-small"
              onClick={() => setPrompt(prefill)}
            >
              Use the scene’s direction
            </Button>
          ) : null}
          {promptFlags.length ? (
            <div id={flagsId} className="flex flex-col gap-2">
              {promptFlags.map((flag) => (
                <ClaimFlagCallout
                  key={`${flag.category}-${flag.claim}`}
                  lead={flag.lead}
                  reason={`${flag.reason} A clip that shows it makes that claim.`}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <p className="t-label">How many clips</p>
          <ChoiceGroup
            label="How many clips"
            variant="segment"
            value={String(count)}
            options={COUNT_OPTIONS}
            disabled={!online}
            onValueChange={(value) => setCount(Number(value))}
          />
          <p className="t-caption text-ink-3">
            <span className="t-mono">{clipSeconds}</span> s each
            {clipSeconds === scene.durationSeconds ? (
              <>, the length of scene {scene.order}</>
            ) : clipSeconds > scene.durationSeconds ? (
              <>
                {' '}
                (the shortest the service makes; scene {scene.order} plays{' '}
                <span className="t-mono">{scene.durationSeconds}</span> s of it)
              </>
            ) : null}{' '}
            · <span className="t-mono">9:16</span> ·{' '}
            {scene.audio?.sound || scene.audio?.lines.length
              ? 'With its sound: the lines and the scene’s sound'
              : 'Its sound is off unless you turn on Clip sound'}{' '}
            · <span className="t-mono">{CREDIT_COST.aiClip}</span> credits per
            clip
          </p>
        </div>
      </SheetBody>
      <SheetFooter>
        {reason ? <p className="t-sm mr-auto text-ink-2">{reason}</p> : null}
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          disabled={!online || Boolean(reason) || generate.isPending}
          aria-busy={generate.isPending || undefined}
          onClick={() => {
            if (!online || reason || generate.isPending) return;
            generate.mutate({
              input: {
                projectId,
                sceneId: scene.sceneId,
                ...requestPhotos(mode, picked),
                clipCount: count,
                prompt: prompt.trim(),
                idempotencyKey: key.current(),
              },
            });
          }}
        >
          {generate.isPending ? <Spinner /> : null}
          {generate.isPending ? 'Starting…' : `Generate ${clipsLabel(count)}`}
          {generate.isPending ? null : <ButtonCost>{cost} credits</ButtonCost>}
        </Button>
      </SheetFooter>
    </>
  );
}

/**
 * The request's photo fields for a mode (R23); one-click clips and Describe
 * only (stories) send none.
 */
function requestPhotos(mode: SceneClipMode, picked: string[]) {
  if (mode === SceneClipMode.Consistent || mode === SceneClipMode.Describe) {
    return { mode };
  }
  return mode === SceneClipMode.References
    ? { mode, referenceAssetIds: picked }
    : mode === SceneClipMode.FirstLastFrame
      ? { mode, sourceAssetId: picked[0], endAssetId: picked[1] }
      : { mode, sourceAssetId: picked[0] };
}

/** The photo picker's label and hint; the studio words them (§3.23). */
function pickerCopy(
  mode: PhotoClipMode,
  clips: StudioPresentation['clips'],
): { label: string; hint: string } {
  switch (mode) {
    case SceneClipMode.FirstFrame:
      return { label: 'Start from a photo', hint: clips.pickerHint.firstFrame };
    case SceneClipMode.FirstLastFrame:
      return {
        label: 'Pick the start and end photos',
        hint: clips.pickerHint.firstLastFrame,
      };
    case SceneClipMode.References:
      return {
        label: `Pick ${MODE_PHOTOS[SceneClipMode.References].min} to ${MODE_PHOTOS[SceneClipMode.References].max} ${clips.referencesPhotos}`,
        hint: clips.pickerHint.references,
      };
  }
}

function PhotoPicker({
  projectId,
  mode,
  photos,
  uploadCount,
  selected,
  online,
  onSelect,
  onSwap,
}: {
  projectId: string;
  mode: PhotoClipMode;
  photos: ProjectAsset[];
  uploadCount: number;
  /** Picked photo ids, in pick order (Start, End for Move between two). */
  selected: string[];
  online: boolean;
  onSelect: (id: string) => void;
  onSwap: () => void;
}) {
  const { uploads, upload, cancel, dismiss, limitReached } = useAssetUploads(
    projectId,
    uploadCount,
  );
  const [rights, setRights] = useState(false);
  const browseRef = useRef<HTMLInputElement>(null);
  const labelId = useId();
  const rightsId = useId();
  const ids = photos.map((photo) => photo.id);
  const limits = MODE_PHOTOS[mode];
  const studio = studioOf(useProject().studio);
  const copy = pickerCopy(mode, studio.clips);
  const single = limits.max === 1;
  const full = selected.length >= limits.max;
  const current = selected[0] ?? null;
  const tabStop = current && ids.includes(current) ? current : ids[0];

  // Start from a photo is a radio group (APG): arrow keys move and select.
  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!single) return;
    const step =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? -1
          : 0;
    const edge =
      event.key === 'Home' ? ids[0] : event.key === 'End' ? ids.at(-1) : null;

    if (!step && !edge) return;
    event.preventDefault();

    const index = Math.max(0, ids.indexOf(current ?? ids[0]));
    const next = edge ?? ids[(index + step + ids.length) % ids.length];
    if (!next) return;

    onSelect(next);
    event.currentTarget
      .querySelector<HTMLElement>(`[data-option="${next}"]`)
      ?.focus();
  };
  const tag = (id: string) =>
    mode === SceneClipMode.FirstLastFrame
      ? (['Start', 'End'][selected.indexOf(id)] ?? null)
      : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <p id={labelId} className="t-label">
          {copy.label}
        </p>
        {mode === SceneClipMode.References ? (
          <span className="t-mono t-caption text-ink-3">
            {selected.length} of {limits.max}
          </span>
        ) : null}
      </div>
      {photos.length ? (
        <>
          <div
            role={single ? 'radiogroup' : 'group'}
            aria-labelledby={labelId}
            onKeyDown={onKey}
            className="grid grid-cols-2 gap-3 sm:grid-cols-3"
          >
            {photos.map((photo) => {
              const on = selected.includes(photo.id);
              const label = tag(photo.id);
              const locked = !single && !on && full;

              return (
                <button
                  key={photo.id}
                  type="button"
                  role={single ? 'radio' : 'checkbox'}
                  aria-checked={on}
                  aria-label={
                    label
                      ? `${photo.fileName}, ${label.toLowerCase()} photo`
                      : undefined
                  }
                  tabIndex={single ? (tabStop === photo.id ? 0 : -1) : 0}
                  disabled={locked}
                  data-option={photo.id}
                  onClick={() => onSelect(photo.id)}
                  className={cn(
                    'relative flex flex-col overflow-hidden rounded-lg border border-border bg-surface text-left transition-shadow duration-120 disabled:opacity-50',
                    on && 'border-ink ring-1 ring-ink',
                  )}
                >
                  <MediaThumb
                    asset={photo}
                    className="aspect-4/5 w-full"
                    sizes="160px"
                  />
                  <span className="t-caption truncate px-2.5 py-2 font-medium text-ink">
                    {photo.fileName}
                  </span>
                  {on && label ? (
                    <span className="t-caption absolute top-2 left-2 rounded-full bg-ink px-2 py-0.5 font-medium text-white">
                      {label}
                    </span>
                  ) : on ? (
                    <span className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-ink text-white">
                      <CheckIcon
                        aria-hidden="true"
                        className="size-3.5"
                        strokeWidth={2.5}
                      />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          {mode === SceneClipMode.FirstLastFrame && selected.length === 2 ? (
            <Button
              variant="link"
              className="self-start text-small"
              onClick={onSwap}
            >
              Swap start and end
            </Button>
          ) : null}
          <p className="t-sm text-ink-2">
            {mode === SceneClipMode.References && full
              ? `Up to ${limits.max} photos.`
              : copy.hint}
          </p>
          {photos.length < limits.min ? (
            <p className="t-sm text-ink-2">Add one more photo to use this.</p>
          ) : null}
        </>
      ) : (
        <p className="t-sm text-ink-2">
          {studio.clips.noPhotos}
        </p>
      )}

      {uploads.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {uploads.map((item) => (
            <UploadTile
              key={item.key}
              upload={item}
              onCancel={() => cancel(item.key)}
              onDismiss={() => dismiss(item.key)}
            />
          ))}
        </div>
      ) : null}
      {limitReached ? (
        <p className="t-sm text-warning" role="status">
          You can upload up to 20 files per project.
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <Checkbox
            id={rightsId}
            checked={rights}
            onCheckedChange={(checked) => setRights(checked === true)}
            className="mt-0.5"
          />
          <label htmlFor={rightsId} className="flex flex-col">
            <span className="t-label text-ink">
              I have the right to use these photos
            </span>
            <span className="t-sm text-ink-2">
              {studio.uploadRightsNote}
            </span>
          </label>
        </div>
        <input
          ref={browseRef}
          type="file"
          accept={PHOTO_TYPES}
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => {
            upload(Array.from(event.target.files ?? []));
            event.target.value = '';
          }}
        />
        <Button
          variant="secondary"
          className="self-start"
          disabled={!rights || !online}
          onClick={() => browseRef.current?.click()}
        >
          <UploadIcon data-icon="inline-start" />
          Upload photos
        </Button>
      </div>
    </div>
  );
}

function ReviewView({
  projectId,
  scene,
  job,
  clips,
  made,
  photos,
  online,
  balance,
  sceneNumbers,
  onClose,
  onTrack,
  onUse,
}: {
  projectId: string;
  scene: ClipScene;
  job: GenerationJobRecord;
  clips: ProjectAsset[];
  /** Clips the job made, used or not (the rest failed). */
  made: number;
  photos: ProjectAsset[];
  online: boolean;
  balance: number | null;
  sceneNumbers: Map<string, number>;
  onClose: () => void;
  onTrack: (job: GenerationJobRecord) => void;
  onUse: (clip: ProjectAsset) => Promise<void>;
}) {
  const studio = studioOf(useProject().studio);
  // With one clip there is nothing to pick between.
  const [selected, setSelected] = useState<string | null>(
    clips.length === 1 ? (clips[0]?.id ?? null) : null,
  );
  const [checked, setChecked] = useState<boolean[]>(
    studio.clips.checks.map(() => false),
  );
  const [using, setUsing] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const flags = useClipPromptFlagsQuery(
    { projectId, prompt: job.prompt ?? '' },
    { enabled: studio.claimCheck && online && Boolean(job.prompt) },
  );
  const key = useIdempotencyKey();
  const regenerate = useGenerateSceneClipsMutation({
    onSuccess: ({ generateSceneClips }) => onTrack(generateSceneClips),
    onError: (error) => toast.error(error.message),
    onSettled: () => key.rotate(),
  });
  const queryClient = useQueryClient();
  const discard = useDiscardAiClipsMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: assetsQueryKeys.list(projectId),
      });
      setDiscarding(false);
      onClose();
      toast.success('Clips discarded.');
    },
    onError: (error) => toast.error(error.message),
  });
  const headingId = useId();
  const ids = clips.map((clip) => clip.id);
  const tabStop = selected && ids.includes(selected) ? selected : ids[0];
  const clip = clips.find((item) => item.id === selected) ?? null;
  const count = countOf(job);
  const cost = costOf(count);
  const short = balance !== null && balance < cost;
  const inputs = jobPhotos(job);
  const names = inputs.map(
    (id) =>
      photos.find((photo) => photo.id === id)?.fileName ?? 'a removed photo',
  );
  const followed = job.continuitySceneId
    ? sceneNumbers.get(job.continuitySceneId)
    : undefined;
  const matched = `Matched to ${names.length} ${names.length === 1 ? 'photo' : 'photos'}`;
  const describedOnly = job.clipMode === SceneClipMode.Describe;
  const madeFrom = describedOnly
    ? 'Made from your description'
    : job.clipMode === SceneClipMode.Consistent
      ? `${matched}${followed ? ` and scene ${followed}` : ''}: ${names.join(', ')}`
      : job.clipMode === SceneClipMode.References
        ? `${matched}: ${names.join(', ')}`
        : `Made from ${names.join(' → ')}`;
  // Try again resends the job's photos; Describe only, and a story's
  // one-click clip (its photos are optional), need none.
  const needsPhotos = !(
    describedOnly ||
    (studio.media.photosOptional && job.clipMode === SceneClipMode.Consistent)
  );
  const reason = !online
    ? OFFLINE
    : !clip
      ? 'Pick a clip first'
      : !checked.every(Boolean)
        ? 'Tick both checks first'
        : null;
  const missing = Math.max(0, count - made);

  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const step =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? -1
          : 0;
    if (!step) return;
    event.preventDefault();
    const index = Math.max(0, ids.indexOf(selected ?? ids[0]));
    const next = ids[(index + step + ids.length) % ids.length];
    select(next);
    event.currentTarget
      .querySelector<HTMLElement>(`[data-option="${next}"]`)
      ?.focus();
  };

  const select = (id: string) => {
    if (id === selected) return;
    setSelected(id);
    setChecked(studio.clips.checks.map(() => false));
  };

  return (
    <>
      <SheetBody className="flex flex-col gap-5 p-6">
        <h3 id={headingId} tabIndex={-1} className="t-label outline-none">
          {clips.length > 1 ? 'Pick one' : 'Your clip'}
        </h3>
        {missing > 0 ? (
          <p className="t-sm flex items-start gap-2 text-info">
            <InfoIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {missing} clip didn’t finish. You weren’t charged for it.
          </p>
        ) : null}
        <div
          role="radiogroup"
          aria-label={`Clips for scene ${scene.order}`}
          onKeyDown={onKey}
          className="grid grid-cols-2 gap-3"
        >
          {clips.map((item) => (
            <ClipCard
              key={item.id}
              clip={item}
              selected={selected === item.id}
              tabbable={tabStop === item.id}
              onSelect={() => select(item.id)}
            />
          ))}
        </div>
        {inputs.length || describedOnly ? (
          <p className="t-caption truncate text-ink-3" title={madeFrom}>
            {madeFrom}
          </p>
        ) : null}
        {clip ? (
          <AccuracyCheck
            checked={checked}
            onChange={setChecked}
            flags={studio.claimCheck ? (flags.data?.clipPromptFlags ?? []) : []}
          />
        ) : null}
      </SheetBody>
      <SheetFooter>
        {reason ? <p className="t-sm mr-auto text-ink-2">{reason}</p> : null}
        <Button
          variant="ghost"
          className="text-danger"
          disabled={!online}
          onClick={() => setDiscarding(true)}
        >
          {clips.length > 1 ? 'Discard both' : 'Discard clip'}
        </Button>
        <Button
          variant="secondary"
          disabled={
            !online ||
            short ||
            regenerate.isPending ||
            (needsPhotos && !inputs.length) ||
            !job.prompt
          }
          aria-busy={regenerate.isPending || undefined}
          onClick={() => {
            if (
              !online ||
              short ||
              regenerate.isPending ||
              (needsPhotos && !inputs.length) ||
              !job.prompt
            ) {
              return;
            }
            regenerate.mutate({
              input: {
                projectId,
                sceneId: scene.sceneId,
                ...requestPhotos(
                  job.clipMode ?? SceneClipMode.FirstFrame,
                  inputs,
                ),
                clipCount: count,
                prompt: job.prompt,
                idempotencyKey: key.current(),
              },
            });
          }}
        >
          {regenerate.isPending ? <Spinner /> : null}
          Try again
          <ButtonCost>{cost} credits</ButtonCost>
        </Button>
        <Button
          disabled={Boolean(reason) || using}
          aria-busy={using || undefined}
          onClick={async () => {
            if (reason || using || !clip) return;
            setUsing(true);
            try {
              await onUse(clip);
            } catch (error) {
              toast.error((error as Error).message);
            } finally {
              setUsing(false);
            }
          }}
        >
          {using ? <Spinner /> : null}
          {using ? 'Adding…' : `Use in scene ${scene.order}`}
        </Button>
      </SheetFooter>

      <Dialog
        open={discarding}
        onOpenChange={(open) => {
          if (!open && !discard.isPending) setDiscarding(false);
        }}
      >
        <DialogContent role="alertdialog">
          <DialogHeader>
            <DialogTitle>
              {clips.length > 1
                ? 'Discard both clips?'
                : `Discard clip ${clips[0]?.aiClip?.label}?`}
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            <DialogDescription>
              You’ll need to generate again to get them back. Credits you used
              aren’t returned.
            </DialogDescription>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="secondary"
              disabled={discard.isPending}
              onClick={() => setDiscarding(false)}
            >
              Keep clips
            </Button>
            <Button
              variant="destructive"
              disabled={discard.isPending}
              aria-busy={discard.isPending || undefined}
              onClick={() => {
                if (discard.isPending) return;
                discard.mutate({ jobId: job.id });
              }}
            >
              {discard.isPending ? <Spinner /> : null}
              {discard.isPending ? 'Discarding…' : 'Discard clips'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SheetFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border bg-canvas px-5 py-3">
      {children}
    </div>
  );
}
