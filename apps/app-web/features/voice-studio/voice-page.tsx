'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowRightIcon,
  CheckIcon,
  CircleAlertIcon,
  InfoIcon,
  LockIcon,
  MicIcon,
  PlusIcon,
  TriangleAlertIcon,
  UploadIcon,
  XIcon,
} from 'lucide-react';
import {
  useCallback,
  useId,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';

import { AudioPlayer, SampleButton } from '@/components/core/audio-player';
import { JobPanel } from '@/components/studio/job-panel';
import {
  Alert,
  AlertAction,
  AlertContent,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Button, ButtonCost } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { useOfflineDetail } from '@/features/app-shell/offline-banner';
import {
  AUDIO_TYPES,
  useAudioUpload,
} from '@/features/product-setup/use-asset-uploads';
import {
  SaveFailedBanner,
  StepPage,
} from '@/features/project-workflow/step-page';
import { useAutosave } from '@/features/project-workflow/use-autosave';
import {
  useIdempotencyKey,
  useProjectJobs,
} from '@/features/project-workflow/use-project-jobs';
import { useWorkflow } from '@/features/project-workflow/workflow-state';
import { studioOf } from '@/lib/studios';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { CREDIT_COST, SCENE_PURPOSE_LABEL } from '@/lib/studio/labels';
import { cn } from '@/lib/utils';
import { useRemoveAssetMutation } from '@/react-query/assets/assets-operations';
import { useMyCreditsQuery } from '@/react-query/credits/credits-operations';
import {
  isJobActive,
  useRetryGenerationJobMutation,
  type GenerationJobRecord,
} from '@/react-query/generation-jobs/generation-jobs-operations';
import {
  AssetKind,
  AssetPurpose,
  GenerationJobStatus,
  GenerationJobType,
  ProjectStepKey,
  VoiceSource,
  type VoiceSettingsInput,
} from '@/react-query/generated__types';
import { projectsQueryKeys } from '@/react-query/projects/projects-operations';
import {
  useAlignRecordingMutation,
  useGenerateVoiceoverMutation,
  useUpdateVideoEditMutation,
  useVideoEditQuery,
  useVoiceOptionsQuery,
  videoEditsQueryKeys,
  type VideoEdit,
  type VoiceOption,
} from '@/react-query/video-edits/video-edits-operations';
import { formatFileSize, formatRelativeTime, formatTimecode } from '@/utils/date';

type Pronunciation = { key: string; word: string; sayAs: string };

const SPEEDS = ['0.9', '1', '1.1'] as const;
const MAX_PRONUNCIATIONS = 20;

type SourceOption = {
  value: VoiceSource;
  title: string;
  detail: string;
  /** Why it can't be picked; shown in place of the detail. */
  disabledReason?: string;
};

const SOURCES: SourceOption[] = [
  {
    value: VoiceSource.Ai,
    title: 'AI voice',
    detail: 'We read your approved script in a voice you pick.',
  },
  {
    value: VoiceSource.Recording,
    title: 'My recording',
    detail: 'Upload narration you recorded yourself.',
  },
  {
    value: VoiceSource.None,
    title: 'No voiceover',
    detail: 'Music and on-screen text only. Scenes keep the script’s timing.',
  },
  {
    value: VoiceSource.Scene,
    title: 'Sound from your clips',
    detail:
      'Each clip plays its own sound: what people say and the real sound. Free.',
  },
];

/** A skit has no narrator, so a voice can't read it. */

const VOICE_JOB_COPY = {
  title: 'Generating voiceover',
  steps: ['Reading your script', 'Recording each scene', 'Timing each word'],
  failedLead: 'Voiceover didn’t finish.',
  kept: 'Your script and any earlier voiceover are safe.',
  reassurance: 'You can leave this page. We’ll save the voiceover to this project.',
  retryCost: CREDIT_COST.voiceover,
};

const ALIGN_JOB_COPY = {
  title: 'Timing your recording',
  steps: ['Listening to your recording', 'Matching words to the script'],
  failedLead: 'Timing didn’t finish.',
  kept: 'Your recording and script are safe.',
  reassurance: 'You can leave this page. We’ll save the timing to this project.',
  retryCost: CREDIT_COST.alignRecording,
};

/** Voice (Design Reference §5.13). */
export function VoicePage() {
  const { project } = useWorkflow();
  const edit = useVideoEditQuery({ projectId: project.id });
  const online = useOnlineStatus();

  useOfflineDetail('Voice changes will be possible when you reconnect.');

  const video = edit.data?.videoEdit ?? null;

  if (edit.isError || (edit.isSuccess && !video)) {
    return (
      <VoiceStep video={null} reason={null}>
        <Alert variant="danger" role="alert">
          <CircleAlertIcon />
          <AlertContent>
            <AlertTitle>We couldn’t load your video.</AlertTitle>{' '}
            <AlertDescription>Check your connection and try again.</AlertDescription>
          </AlertContent>
          <AlertAction>
            <Button size="sm" variant="secondary" onClick={() => void edit.refetch()}>
              Try again
            </Button>
          </AlertAction>
        </Alert>
      </VoiceStep>
    );
  }

  if (!video) {
    return (
      <VoiceStep video={null} reason={null}>
        <div aria-busy="true" aria-label="Loading voice" className="flex flex-col gap-4">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </VoiceStep>
    );
  }

  return <VoiceEditor key={video.id} video={video} online={online} />;
}

function VoiceEditor({ video, online }: { video: VideoEdit; online: boolean }) {
  const { project, navigate } = useWorkflow();
  const queryClient = useQueryClient();
  const options = useVoiceOptionsQuery();
  const credits = useMyCreditsQuery();
  const balance = credits.data?.myCredits.balance ?? null;
  const [source, setSource] = useState(video.voice.source);
  const [voiceId, setVoiceId] = useState(video.voice.voiceId ?? null);
  const [speed, setSpeed] = useState(String(video.voice.speed));
  const [rules, setRules] = useState<Pronunciation[]>(() =>
    video.voice.pronunciations.map((rule) => ({ key: crypto.randomUUID(), ...rule })),
  );
  const generateKey = useIdempotencyKey();
  const alignKey = useIdempotencyKey();

  const refresh = useCallback(
    () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: videoEditsQueryKeys.detail(project.id) }),
        queryClient.invalidateQueries({ queryKey: projectsQueryKeys.detail(project.id) }),
      ]),
    [project.id, queryClient],
  );

  const setVideo = useCallback(
    (next: VideoEdit) => {
      queryClient.setQueryData(videoEditsQueryKeys.detail(project.id), { videoEdit: next });
      void queryClient.invalidateQueries({ queryKey: projectsQueryKeys.detail(project.id) });
    },
    [project.id, queryClient],
  );

  const update = useUpdateVideoEditMutation();
  const autosave = useAutosave<VoiceSettingsInput>({
    source: 'voice',
    enabled: online,
    save: async (patch) => {
      const data = await update.mutateAsync({
        input: { projectId: project.id, voice: patch },
      });
      setVideo(data.updateVideoEdit);
    },
  });

  const { latest, track } = useProjectJobs(project.id, (job) => {
    if (
      job.type !== GenerationJobType.GenerateVoiceover &&
      job.type !== GenerationJobType.AlignRecording
    ) {
      return;
    }
    void refresh();
    if (job.status === GenerationJobStatus.Completed) {
      const rebuilt = video.captions.lines.some((line) => line.edited);
      toast.success(
        job.type === GenerationJobType.GenerateVoiceover
          ? `Voiceover ready.${rebuilt ? ' Captions were rebuilt, so your caption edits were replaced.' : ''} Used ${job.creditCost} credits.`
          : `Recording timed.${rebuilt ? ' Captions were rebuilt, so your caption edits were replaced.' : ''} Used ${job.creditCost} credit.`,
      );
    }
  });

  const generate = useGenerateVoiceoverMutation({
    onSuccess: ({ generateVoiceover }) => track(generateVoiceover),
    onError: (error) => toast.error(error.message),
    onSettled: () => generateKey.rotate(),
  });
  const align = useAlignRecordingMutation({
    onSuccess: ({ alignRecording }) => track(alignRecording),
    onError: (error) => toast.error(error.message),
    onSettled: () => alignKey.rotate(),
  });
  const retry = useRetryGenerationJobMutation({
    onSuccess: ({ retryGenerationJob }) => track(retryGenerationJob),
    onError: (error) => toast.error(error.message),
  });

  const trackMadeAt = video.voice.track ? new Date(video.voice.track.createdAt) : null;
  const panelJob = (type: GenerationJobType): GenerationJobRecord | null => {
    const job = latest(type);

    if (!job) return null;
    if (isJobActive(job)) return job;
    // A failure shows until a newer track replaces it.
    return job.status === GenerationJobStatus.Failed &&
      (!trackMadeAt || trackMadeAt < new Date(job.createdAt))
      ? job
      : null;
  };
  const voiceJob = panelJob(GenerationJobType.GenerateVoiceover);
  const alignJob = panelJob(GenerationJobType.AlignRecording);

  const change = (patch: VoiceSettingsInput) => autosave.schedule(patch);
  const saveRules = (next: Pronunciation[]) => {
    setRules(next);
    const complete = next.filter((rule) => rule.word.trim() && rule.sayAs.trim());
    change({
      pronunciations: complete.map(({ word, sayAs }) => ({
        word: word.trim(),
        sayAs: sayAs.trim(),
      })),
    });
  };

  const readyTrack =
    video.voice.track && video.voice.track.source === source ? video.voice.track : null;
  const noNarration = video.scenes.every((scene) => !scene.narration.trim());
  const sourceOptions = SOURCES.map((option) =>
    noNarration &&
    (option.value === VoiceSource.Ai || option.value === VoiceSource.Recording)
      ? { ...option, disabledReason: studioOf(video.studio).noNarration }
      : option,
  );
  const clipScenes = video.scenes.filter(
    (scene) => scene.media?.asset?.kind === AssetKind.Clip,
  );
  const soundOn = clipScenes.filter((scene) => scene.clipSound.on).length;
  const outdated = video.readiness.voiceOutdated;
  const settled = video.readiness.voiceSettled;
  const needsCredits = (cost: number) => balance !== null && balance < cost;
  const jobRunning = Boolean(
    (voiceJob && isJobActive(voiceJob)) || (alignJob && isJobActive(alignJob)),
  );

  const reason = jobRunning
    ? 'Wait for the voiceover to finish'
    : outdated
      ? `Generate again to match v${video.scriptVersion.number}`
      : settled
        ? null
        : source === VoiceSource.Recording
          ? 'Time your recording first'
          : source === VoiceSource.Ai && needsCredits(CREDIT_COST.voiceover)
            ? `You need ${CREDIT_COST.voiceover} credits. You have ${balance}.`
            : 'Generate a voiceover first';

  const startGenerate = () => {
    if (!online || !voiceId || generate.isPending || needsCredits(CREDIT_COST.voiceover)) {
      return;
    }
    autosave.flush();
    generate.mutate({
      input: { projectId: project.id, idempotencyKey: generateKey.current() },
    });
  };

  return (
    <VoiceStep
      video={video}
      reason={reason}
      balance={balance}
      online={online}
      onContinue={() => navigate(`/projects/${project.id}/edit`)}
      banners={
        <>
          <SaveFailedBanner />
          {outdated ? (
            <Alert variant="warning">
              <TriangleAlertIcon />
              <AlertContent>
                <AlertTitle>Your script changed after this voiceover.</AlertTitle>{' '}
                <AlertDescription>
                  Generate again so the voice matches v{video.scriptVersion.number}.
                </AlertDescription>
              </AlertContent>
            </Alert>
          ) : video.voice.settingsChanged && source === VoiceSource.Ai ? (
            <Alert variant="info">
              <InfoIcon />
              <AlertContent>
                <AlertTitle>Voice settings changed.</AlertTitle>{' '}
                <AlertDescription>
                  Generate again to hear them. Your current voiceover still works.
                </AlertDescription>
              </AlertContent>
            </Alert>
          ) : null}
        </>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Voiceover</CardTitle>
        </CardHeader>
        <CardContent className="gap-5">
          <RadioCards
            label="Voiceover source"
            value={source}
            disabled={!online || jobRunning}
            options={sourceOptions}
            onChange={(next) => {
              setSource(next);
              change({ source: next });
            }}
          />

          {source === VoiceSource.Ai ? (
            <AiVoice
              options={options.data?.voiceOptions ?? null}
              optionsError={options.isError}
              onRetryOptions={() => void options.refetch()}
              online={online}
              voiceId={voiceId}
              speed={speed}
              rules={rules}
              disabled={!online || jobRunning}
              onVoice={(id) => {
                setVoiceId(id);
                change({ voiceId: id });
              }}
              onSpeed={(next) => {
                setSpeed(next);
                change({ speed: Number(next) });
              }}
              onRules={saveRules}
            />
          ) : null}

          {source === VoiceSource.None ? (
            <Alert variant="info">
              <InfoIcon />
              <AlertContent>
                <AlertTitle>
                  Scenes use your script’s timing ({formatTimecode(video.totalSeconds)} total).
                </AlertTitle>{' '}
                <AlertDescription>Captions show each scene’s on-screen text.</AlertDescription>
              </AlertContent>
            </Alert>
          ) : null}

          {source === VoiceSource.Scene ? (
            <Alert variant="info">
              <InfoIcon />
              <AlertContent>
                <AlertTitle>
                  Scenes use your script’s timing ({formatTimecode(video.totalSeconds)} total).
                </AlertTitle>{' '}
                <AlertDescription>
                  {clipScenes.length > 0
                    ? `${soundOn} of ${clipScenes.length} clip scenes play their sound. Change it in Edit & preview. Captions follow what people say.`
                    : 'No scene uses a clip yet, so only music plays. Captions follow what people say.'}
                </AlertDescription>
              </AlertContent>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      {source === VoiceSource.Ai ? (
        voiceJob ? (
          <JobPanel
            job={voiceJob}
            copy={VOICE_JOB_COPY}
            retrying={retry.isPending}
            online={online}
            onRetry={() => online && !retry.isPending && retry.mutate({ id: voiceJob.id })}
          />
        ) : (
          <>
            {readyTrack ? <TrackCard video={video} /> : null}
            <div>
              <Button
                variant={readyTrack ? 'secondary' : 'default'}
                onClick={startGenerate}
                disabled={
                  !online ||
                  !voiceId ||
                  generate.isPending ||
                  needsCredits(CREDIT_COST.voiceover)
                }
                aria-busy={generate.isPending || undefined}
              >
                {generate.isPending ? <Spinner /> : null}
                {generate.isPending
                  ? 'Starting…'
                  : readyTrack
                    ? 'Generate again'
                    : 'Generate voiceover'}
                {generate.isPending ? null : (
                  <ButtonCost>{CREDIT_COST.voiceover} credits</ButtonCost>
                )}
              </Button>
            </div>
          </>
        )
      ) : null}

      {source === VoiceSource.Recording ? (
        <RecordingCard
          video={video}
          online={online}
          job={alignJob}
          retrying={retry.isPending}
          onRetry={(job) => online && !retry.isPending && retry.mutate({ id: job.id })}
          timing={align.isPending}
          short={needsCredits(CREDIT_COST.alignRecording)}
          onTime={() => {
            if (!online || align.isPending || needsCredits(CREDIT_COST.alignRecording)) {
              return;
            }
            autosave.flush();
            align.mutate({
              input: { projectId: project.id, idempotencyKey: alignKey.current() },
            });
          }}
          onStored={refresh}
        />
      ) : null}
    </VoiceStep>
  );
}

/** Page chrome shared by the loading, error and editing states. */
function VoiceStep({
  video,
  reason,
  balance = null,
  online = true,
  banners,
  onContinue,
  children,
}: {
  video: VideoEdit | null;
  reason: string | null;
  balance?: number | null;
  online?: boolean;
  banners?: ReactNode;
  onContinue?: () => void;
  children: ReactNode;
}) {
  const { project, navigate } = useWorkflow();
  // A skit has no narration: the card shows what the cast says instead.
  const skit = video ? video.scenes.every((scene) => !scene.narration.trim()) : false;
  const spoken = video
    ? Math.round(
        video.scenes.reduce(
          (total, scene) =>
            total +
            [scene.narration, ...scene.lines.map((line) => line.text)]
              .join(' ')
              .split(/\s+/)
              .filter(Boolean).length,
          0,
        ) / 2.5,
      )
    : 0;

  return (
    <StepPage
      step={ProjectStepKey.Voice}
      title="Voice"
      subtitle="Choose how the script is spoken. The voiceover sets the timing for scenes and captions."
      autosave
      banners={banners}
      aside={
        video ? (
          <Card>
            <CardHeader>
              <CardTitle>{skit ? 'What people say' : 'What will be read'}</CardTitle>
            </CardHeader>
            <CardContent className="gap-3">
              <ol className="flex flex-col gap-2">
                {video.scenes.map((scene) => (
                  <li key={scene.sceneId} className="flex gap-2">
                    <span className="t-mono flex size-6 shrink-0 items-center justify-center rounded-sm bg-ink text-white">
                      {scene.order}
                    </span>
                    <p className="t-sm text-ink-2">
                      {skit
                        ? scene.lines
                            .map(
                              (line) =>
                                `${line.speaker ? `${line.speaker}: ` : ''}“${line.text}”`,
                            )
                            .join(' ') || '—'
                        : scene.narration}
                    </p>
                  </li>
                ))}
              </ol>
              <p className="t-mono text-ink">≈{spoken} s spoken</p>
              <Button
                variant="link"
                className="self-start px-0"
                onClick={() => navigate(`/projects/${project.id}/script`)}
              >
                Edit wording in Script
              </Button>
              <p className="t-caption text-ink-3">Changing words needs a new approved version.</p>
            </CardContent>
          </Card>
        ) : undefined
      }
      footer={{
        back: { label: 'Media', href: `/projects/${project.id}/media` },
        reason: video ? reason : null,
        meta:
          balance !== null ? (
            <p className="t-sm text-ink-2 max-md:hidden">
              You have <span className="t-mono text-ink">{balance}</span> credits
            </p>
          ) : null,
        actions: (
          <Button
            disabled={!video || !online || Boolean(reason)}
            onClick={() => {
              if (!video || !online || reason) return;
              onContinue?.();
            }}
          >
            Continue to edit
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        ),
      }}
    >
      {children}
    </StepPage>
  );
}

/** Radio cards for the voiceover source (APG radio group). */
function RadioCards<Value extends string>({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: Value;
  options: {
    value: Value;
    title: string;
    detail: string;
    disabledReason?: string;
  }[];
  disabled: boolean;
  onChange: (value: Value) => void;
}) {
  const enabled = options.filter((option) => !option.disabledReason);
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    // Arrows move between the options that can be picked.
    const index = enabled.findIndex((option) => option.value === value);
    const next = radioTarget(event.key, index, enabled);

    if (!next) return;
    event.preventDefault();
    onChange(next.value);
    event.currentTarget
      .querySelector<HTMLElement>(`[data-value="${next.value}"]`)
      ?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className="grid gap-3 md:grid-cols-2"
    >
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            data-value={option.value}
            disabled={disabled || Boolean(option.disabledReason)}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative flex flex-col gap-1 rounded-lg border border-border bg-surface p-4 text-left transition-colors duration-120 hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-60',
              selected && 'border-ink ring-1 ring-ink',
            )}
          >
            <span className="t-label text-ink">{option.title}</span>
            <span className="t-sm text-ink-2">
              {option.disabledReason ?? option.detail}
            </span>
            {selected ? <SelectedCheck /> : null}
          </button>
        );
      })}
    </div>
  );
}

function AiVoice({
  options,
  optionsError,
  onRetryOptions,
  online,
  voiceId,
  speed,
  rules,
  disabled,
  onVoice,
  onSpeed,
  onRules,
}: {
  options: VoiceOption[] | null;
  optionsError: boolean;
  onRetryOptions: () => void;
  online: boolean;
  voiceId: string | null;
  speed: string;
  rules: Pronunciation[];
  disabled: boolean;
  onVoice: (id: string) => void;
  onSpeed: (speed: string) => void;
  onRules: (rules: Pronunciation[]) => void;
}) {
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!options?.length || disabled) return;
    const index = options.findIndex((option) => option.id === voiceId);
    const next = radioTarget(event.key, index, options);

    if (!next) return;
    event.preventDefault();
    onVoice(next.id);
    event.currentTarget.querySelector<HTMLElement>(`[data-voice="${next.id}"]`)?.focus();
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <p className="t-label">Voice</p>
        {optionsError ? (
          <Alert variant="danger" role="alert">
            <CircleAlertIcon />
            <AlertContent>
              <AlertTitle>We couldn’t load the voices.</AlertTitle>{' '}
              <AlertDescription>Check your connection and try again.</AlertDescription>
            </AlertContent>
            <AlertAction>
              <Button size="sm" variant="secondary" disabled={!online} onClick={onRetryOptions}>
                Try again
              </Button>
            </AlertAction>
          </Alert>
        ) : options === null ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-14 w-full rounded-md" />
            ))}
          </div>
        ) : !options?.length ? (
          <Alert variant="warning">
            <TriangleAlertIcon />
            <AlertContent>
              <AlertTitle>The voice service isn’t set up yet.</AlertTitle>{' '}
              <AlertDescription>
                Use My recording, or No voiceover, for now.
              </AlertDescription>
            </AlertContent>
          </Alert>
        ) : (
          <div
            role="radiogroup"
            aria-label="Voice"
            onKeyDown={onKeyDown}
            className="flex flex-col gap-2"
          >
            {options.map((option, index) => {
              const selected = option.id === voiceId;
              const tabbable = selected || (!voiceId && index === 0);

              return (
                <div
                  key={option.id}
                  className={cn(
                    'flex h-14 items-center gap-3 rounded-md border border-border px-3',
                    selected && 'border-ink ring-1 ring-ink',
                  )}
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    tabIndex={tabbable ? 0 : -1}
                    data-voice={option.id}
                    disabled={disabled}
                    onClick={() => onVoice(option.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 self-stretch text-left"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'flex size-4 shrink-0 items-center justify-center rounded-full border border-border-strong',
                        selected && 'border-ink bg-ink',
                      )}
                    >
                      {selected ? <span className="size-1.5 rounded-full bg-white" /> : null}
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="t-label truncate text-ink">{option.name}</span>
                      {option.descriptor ? (
                        <span className="t-caption truncate text-ink-3">{option.descriptor}</span>
                      ) : null}
                    </span>
                  </button>
                  <SampleButton
                    url={option.sampleUrl ?? null}
                    label={`sample of ${option.name}`}
                    disabled={!online}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className="t-label">Speed</p>
        <ChoiceGroup<(typeof SPEEDS)[number]>
          label="Speed"
          variant="segment"
          value={(SPEEDS.find((value) => Number(value) === Number(speed)) ?? '1')}
          disabled={disabled}
          onValueChange={onSpeed}
          options={SPEEDS.map((value) => ({
            value,
            label: `${Number(value).toFixed(1)}×`,
          }))}
        />
      </div>

      <div className="flex flex-col gap-2">
        <p className="t-label">
          Pronunciation <span className="t-caption font-normal text-ink-3">Optional</span>
        </p>
        <p className="t-sm text-ink-3">
          Spell a word the way it should sound. Your script doesn’t change.
        </p>
        {rules.map((rule, index) => (
          <div key={rule.key} className="flex items-center gap-2">
            <Input
              aria-label={`Word ${index + 1}`}
              placeholder="BlendGo"
              maxLength={40}
              value={rule.word}
              disabled={disabled}
              className="min-w-0 flex-1"
              onChange={(event) =>
                onRules(rules.map((item) => (item.key === rule.key ? { ...item, word: event.target.value } : item)))
              }
            />
            <ArrowRightIcon aria-hidden="true" className="size-3.5 shrink-0 text-ink-3" />
            <Input
              aria-label={`Say ${rule.word || `word ${index + 1}`} like`}
              placeholder="BLEND-go"
              maxLength={60}
              value={rule.sayAs}
              disabled={disabled}
              className="min-w-0 flex-1"
              onChange={(event) =>
                onRules(rules.map((item) => (item.key === rule.key ? { ...item, sayAs: event.target.value } : item)))
              }
            />
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={disabled}
              aria-label={`Remove pronunciation for ${rule.word || `word ${index + 1}`}`}
              onClick={() => onRules(rules.filter((item) => item.key !== rule.key))}
            >
              <XIcon />
            </Button>
          </div>
        ))}
        <div className="flex flex-col items-start gap-1">
          <Button
            variant="ghost"
            disabled={disabled || rules.length >= MAX_PRONUNCIATIONS}
            onClick={() =>
              onRules([...rules, { key: crypto.randomUUID(), word: '', sayAs: '' }])
            }
          >
            <PlusIcon data-icon="inline-start" />
            Add a word
          </Button>
          {rules.length >= MAX_PRONUNCIATIONS ? (
            <p className="t-sm text-ink-3">You can add up to 20 words.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** The voiceover or timed recording the video uses, with scene timing. */
function TrackCard({ video }: { video: VideoEdit }) {
  const track = video.voice.track;

  if (!track) return null;

  const segments = track.segments.map((segment) => ({
    url: segment.audioUrl ?? null,
    offsetMs: segment.offsetMs,
    durationMs: segment.durationMs,
  }));
  const meta =
    track.source === VoiceSource.Recording
      ? `${track.recordingFileName ?? 'Your recording'} · Timed ${formatRelativeTime(track.createdAt)} · reads v${track.scriptVersionNumber}`
      : `${track.voiceName ?? 'AI voice'} · ${track.speed.toFixed(1)}× · Generated ${formatRelativeTime(track.createdAt)} · reads v${track.scriptVersionNumber}`;
  const starts = track.segments.map((_, index) =>
    track.segments.slice(0, index).reduce((total, segment) => total + segment.durationMs, 0),
  );

  return (
    <Card>
      <CardContent className="gap-3">
        <AudioPlayer segments={segments} label="Voiceover" />
        <p className="t-caption text-ink-3">{meta}</p>
        <ol className="t-sm flex flex-col gap-1">
          {track.segments.map((segment, index) => {
            const scene = video.scenes.find((item) => item.sceneId === segment.sceneId);
            const from = starts[index];
            const to = from + segment.durationMs;

            return (
              <li key={segment.sceneId} className="flex items-center justify-between gap-3">
                <span className="text-ink-2">
                  {scene ? `${scene.order} ${SCENE_PURPOSE_LABEL[scene.purpose]}` : 'Scene'}
                </span>
                <span className="t-mono text-ink-2">
                  {formatTimecode(from / 1000)}–{formatTimecode(to / 1000)}
                </span>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}

function RecordingCard({
  video,
  online,
  job,
  retrying,
  onRetry,
  timing,
  short,
  onTime,
  onStored,
}: {
  video: VideoEdit;
  online: boolean;
  job: GenerationJobRecord | null;
  retrying: boolean;
  onRetry: (job: GenerationJobRecord) => void;
  timing: boolean;
  short: boolean;
  onTime: () => void;
  onStored: () => Promise<unknown>;
}) {
  const { project } = useWorkflow();
  const recording = video.voice.recording;
  const [rights, setRights] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const browseRef = useRef<HTMLInputElement>(null);
  const rightsId = useId();
  const { state, upload, cancel, dismiss } = useAudioUpload(
    project.id,
    AssetPurpose.Recording,
    onStored,
  );
  const remove = useRemoveAssetMutation({
    onSuccess: async () => {
      await onStored();
      toast.success(`Removed ${recording?.fileName ?? 'recording'}.`);
      setRemoveOpen(false);
    },
    onError: (error) => toast.error(error.message),
  });
  const locked = !rights || !online;
  const timed =
    video.voice.track?.source === VoiceSource.Recording && video.readiness.voiceSettled;

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (!locked && file) void upload(file);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>My recording</CardTitle>
        <CardDescription>
          We match your recording to the script, word by word, so scenes and captions line up.
        </CardDescription>
      </CardHeader>
      <CardContent className="gap-4">
        {!recording || state ? (
          <>
            <div className="flex items-start gap-3">
              <Checkbox
                id={rightsId}
                checked={rights}
                onCheckedChange={(checked) => setRights(checked === true)}
                className="mt-0.5"
              />
              <label htmlFor={rightsId} className="flex flex-col">
                <span className="t-label text-ink">
                  This is my voice, or I have permission to use it
                </span>
                <span className="t-sm text-ink-2">
                  Don’t upload someone else’s voice without their consent.
                </span>
              </label>
            </div>
            <input
              ref={browseRef}
              type="file"
              accept={AUDIO_TYPES}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void upload(file);
                event.target.value = '';
              }}
            />
            <div
              aria-disabled={locked || undefined}
              onDragOver={(event) => {
                event.preventDefault();
                if (!locked) setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={cn(
                'flex flex-col items-center gap-2 rounded-lg border-[1.5px] border-dashed border-border-strong bg-canvas p-8 text-center',
                dragging && 'border-solid border-ink bg-surface',
                locked && 'opacity-60',
              )}
            >
              {locked ? (
                <LockIcon aria-hidden="true" className="size-6 text-ink-2" />
              ) : (
                <UploadIcon aria-hidden="true" className="size-6 text-ink-2" />
              )}
              {locked ? (
                <p className="t-body">
                  {online ? 'Confirm your rights to upload' : 'Uploads need a connection'}
                </p>
              ) : (
                <p className="t-body">
                  Drag an audio file here, or{' '}
                  <button
                    type="button"
                    className="text-flare-text underline"
                    onClick={() => browseRef.current?.click()}
                  >
                    browse your files
                  </button>
                </p>
              )}
              <p className="t-caption text-ink-3">MP3, M4A or WAV up to 20 MB and 90 seconds</p>
            </div>
            {state ? (
              <div
                className={cn(
                  'flex items-center gap-3 rounded-md border p-3',
                  state.status === 'failed' ? 'border-danger-border bg-danger-soft' : 'border-border',
                )}
              >
                <MicIcon aria-hidden="true" className="size-5 shrink-0 text-ink-3" />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="t-caption truncate font-medium">{state.fileName}</p>
                  {state.status === 'failed' ? (
                    <p className="t-caption text-danger" role="alert">
                      {state.error}
                    </p>
                  ) : (
                    <div
                      className="h-1 overflow-hidden rounded-full bg-surface-sunken"
                      role="progressbar"
                      aria-label={`Uploading ${state.fileName}`}
                      aria-valuenow={state.progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="h-full origin-left bg-ink transition-transform duration-280 ease-out"
                        style={{ transform: `scaleX(${state.progress / 100})` }}
                      />
                    </div>
                  )}
                </div>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={state.status === 'failed' ? dismiss : cancel}
                >
                  {state.status === 'failed' ? 'Dismiss' : 'Cancel'}
                </Button>
              </div>
            ) : null}
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 rounded-md border border-border p-3">
              <MicIcon aria-hidden="true" className="size-5 shrink-0 text-ink-3" />
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="t-label truncate">{recording.fileName}</p>
                <p className="t-caption text-ink-3">
                  {recording.durationSeconds
                    ? `${Math.round(recording.durationSeconds)} s · `
                    : ''}
                  {formatFileSize(recording.sizeBytes)}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                disabled={!online}
                onClick={() => {
                  setRights(false);
                  browseRef.current?.click();
                }}
              >
                Replace
              </Button>
              <Button size="sm" variant="ghost" disabled={!online} onClick={() => setRemoveOpen(true)}>
                Remove
              </Button>
              <input
                ref={browseRef}
                type="file"
                accept={AUDIO_TYPES}
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void upload(file);
                  event.target.value = '';
                }}
              />
            </div>

            {job ? (
              <JobPanel
                job={job}
                copy={ALIGN_JOB_COPY}
                retrying={retrying}
                online={online}
                onRetry={() => onRetry(job)}
              />
            ) : timed ? (
              <TrackCard video={video} />
            ) : (
              <div className="flex flex-col items-start gap-2">
                <Button
                  onClick={onTime}
                  disabled={!online || timing || short}
                  aria-busy={timing || undefined}
                >
                  {timing ? <Spinner /> : null}
                  {timing ? 'Starting…' : 'Time captions'}
                  {timing ? null : (
                    <ButtonCost>{CREDIT_COST.alignRecording} credit</ButtonCost>
                  )}
                </Button>
                <p className="t-sm text-ink-3">
                  We match your recording to the script, word by word, so scenes and captions
                  line up.
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>

      <Dialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {recording?.fileName ?? 'recording'}?</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <DialogDescription>
              The recording and its timing will be removed. This can’t be undone.
            </DialogDescription>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setRemoveOpen(false)}>
              Keep recording
            </Button>
            <Button
              variant="destructive"
              disabled={remove.isPending}
              aria-busy={remove.isPending || undefined}
              onClick={() => recording && remove.mutate({ id: recording.id })}
            >
              {remove.isPending ? <Spinner /> : null}
              {remove.isPending ? 'Removing…' : 'Remove recording'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/** APG radio-group navigation: arrows wrap, Home/End jump. */
function radioTarget<Option>(key: string, index: number, options: Option[]) {
  if (key === 'Home') return options[0];
  if (key === 'End') return options.at(-1);

  const step =
    key === 'ArrowRight' || key === 'ArrowDown'
      ? 1
      : key === 'ArrowLeft' || key === 'ArrowUp'
        ? -1
        : 0;

  if (!step) return undefined;
  // With nothing selected, the first arrow press lands on the first option.
  if (index < 0) return options[0];
  return options[(index + step + options.length) % options.length];
}

function SelectedCheck() {
  return (
    <span className="absolute top-3 right-3 flex size-5 items-center justify-center rounded-full bg-ink text-white">
      <CheckIcon aria-hidden="true" className="size-3.5" strokeWidth={2.5} />
    </span>
  );
}

