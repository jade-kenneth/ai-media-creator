'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
  CheckIcon,
  CircleAlertIcon,
  CopyIcon,
  DownloadIcon,
  InfoIcon,
  TriangleAlertIcon,
  XCircleIcon,
} from 'lucide-react';
import Image from 'next/image';
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { toast } from 'sonner';

import { ClaimFlagCallout } from '@/components/studio/claim-flag-callout';
import { JobPanel } from '@/components/studio/job-panel';
import {
  Alert,
  AlertAction,
  AlertContent,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button, ButtonCost } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useOfflineDetail } from '@/features/app-shell/offline-banner';
import { StepPage } from '@/features/project-workflow/step-page';
import { useAutosave } from '@/features/project-workflow/use-autosave';
import {
  useIdempotencyKey,
  useProjectJobs,
} from '@/features/project-workflow/use-project-jobs';
import { useWorkflow } from '@/features/project-workflow/workflow-state';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { CREDIT_COST, SCENE_PURPOSE_LABEL } from '@/lib/studio/labels';
import { studioOf } from '@/lib/studios';
import { cn } from '@/lib/utils';
import { useMyCreditsQuery } from '@/react-query/credits/credits-operations';
import {
  exportsQueryKeys,
  useCreateExportDownloadMutation,
  useProjectExportsQuery,
  useRenderVideoMutation,
  type ExportRecord,
} from '@/react-query/exports/exports-operations';
import {
  isJobActive,
  useRetryGenerationJobMutation,
  type GenerationJobRecord,
} from '@/react-query/generation-jobs/generation-jobs-operations';
import {
  GenerationJobStatus,
  GenerationJobType,
  ProjectStepKey,
  SceneMediaKind,
  VideoEditBlocker,
  VoiceSource,
} from '@/react-query/generated__types';
import { projectsQueryKeys } from '@/react-query/projects/projects-operations';
import { useCreatorBriefQuery } from '@/react-query/scripts/scripts-operations';
import {
  useUpdateVideoEditMutation,
  useVideoEditQuery,
  videoEditsQueryKeys,
  type VideoEdit,
} from '@/react-query/video-edits/video-edits-operations';
import {
  formatDateTime,
  formatFileSize,
  formatLongDate,
  formatRelativeTime,
  formatShortDate,
  formatTimecode,
} from '@/utils/date';

const MAX_POST_CAPTION = 2200;
const RENDER_JOB_COPY = {
  title: 'Rendering your video',
  steps: [
    'Preparing media',
    'Mixing voice and music',
    'Adding captions',
    'Encoding the MP4',
  ],
  failedLead: 'Rendering didn’t finish.',
  kept: 'Your edit and earlier exports are safe.',
  reassurance:
    'Rendering usually takes about a minute. You can leave this page.',
  retryCost: CREDIT_COST.render,
};

type PostCaptionPatch = { postCaption?: string; adTag?: boolean };

/** Export video (Design Reference §5.15). */
export function ExportPage() {
  const { project } = useWorkflow();
  const edit = useVideoEditQuery({ projectId: project.id });
  const exportsQuery = useProjectExportsQuery({ projectId: project.id });
  const online = useOnlineStatus();

  useOfflineDetail('Rendering and downloads need a connection.');

  const video = edit.data?.videoEdit ?? null;

  if (edit.isError || exportsQuery.isError || (edit.isSuccess && !video)) {
    return (
      <ExportStep reason={null}>
        <Alert variant="danger" role="alert">
          <CircleAlertIcon />
          <AlertContent>
            <AlertTitle>We couldn’t load your exports.</AlertTitle>{' '}
            <AlertDescription>
              Check your connection and try again.
            </AlertDescription>
          </AlertContent>
          <AlertAction>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                void edit.refetch();
                void exportsQuery.refetch();
              }}
            >
              Try again
            </Button>
          </AlertAction>
        </Alert>
      </ExportStep>
    );
  }

  if (!video || !exportsQuery.data) {
    return (
      <ExportStep reason={null}>
        <div
          aria-busy="true"
          aria-label="Loading exports"
          className="flex flex-col gap-4"
        >
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </ExportStep>
    );
  }

  return (
    <ExportEditor
      key={video.id}
      video={video}
      exports={exportsQuery.data.projectExports.exports}
      changed={exportsQuery.data.projectExports.changedSinceLatest}
      online={online}
    />
  );
}

function ExportEditor({
  video,
  exports,
  changed,
  online,
}: {
  video: VideoEdit;
  exports: ExportRecord[];
  changed: boolean;
  online: boolean;
}) {
  const { project, navigate } = useWorkflow();
  const queryClient = useQueryClient();
  const credits = useMyCreditsQuery();
  const balance = credits.data?.myCredits.balance ?? null;
  const [caption, setCaption] = useState(video.postCaption.text);
  const [adTag, setAdTag] = useState(video.postCaption.adTag);
  const renderKey = useIdempotencyKey();
  const latest = exports[0] ?? null;
  const focusLatestAfterRender = useRef<string | null>(null);
  const latestHeading = useRef<HTMLHeadingElement>(null);

  const refresh = useCallback(
    () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: exportsQueryKeys.project(project.id),
        }),
        queryClient.invalidateQueries({
          queryKey: videoEditsQueryKeys.detail(project.id),
        }),
        queryClient.invalidateQueries({
          queryKey: projectsQueryKeys.detail(project.id),
        }),
        queryClient.invalidateQueries({ queryKey: projectsQueryKeys.lists }),
      ]),
    [project.id, queryClient],
  );

  const update = useUpdateVideoEditMutation();
  const autosave = useAutosave<PostCaptionPatch>({
    source: 'export',
    enabled: online,
    save: async (patch) => {
      const data = await update.mutateAsync({
        input: { projectId: project.id, ...patch },
      });
      queryClient.setQueryData(videoEditsQueryKeys.detail(project.id), {
        videoEdit: data.updateVideoEdit,
      });
    },
  });

  const { latest: latestJob, track } = useProjectJobs(project.id, (job) => {
    if (job.type !== GenerationJobType.RenderVideo) return;
    if (job.status === GenerationJobStatus.Completed) {
      focusLatestAfterRender.current = latest?.id ?? '';
    }
    void refresh();
  });
  const renderJob = latestJob(GenerationJobType.RenderVideo);
  const panelJob: GenerationJobRecord | null =
    renderJob &&
    (isJobActive(renderJob) ||
      (renderJob.status === GenerationJobStatus.Failed &&
        (!latest ||
          new Date(latest.createdAt) < new Date(renderJob.createdAt))))
      ? renderJob
      : null;
  const rendering = Boolean(panelJob && isJobActive(panelJob));

  const render = useRenderVideoMutation({
    onSuccess: ({ renderVideo }) => {
      track(renderVideo);
      void queryClient.invalidateQueries({
        queryKey: projectsQueryKeys.detail(project.id),
      });
    },
    onError: (error) => toast.error(error.message),
    onSettled: () => renderKey.rotate(),
  });
  const retry = useRetryGenerationJobMutation({
    onSuccess: ({ retryGenerationJob }) => track(retryGenerationJob),
    onError: (error) => toast.error(error.message),
  });

  const blocking = video.readiness.blocking;
  const flagged =
    video.scenes.filter((scene) => scene.flags.length).length +
    video.captions.lines.filter((line) => line.flags.length).length +
    (video.postCaption.flags.length ? 1 : 0);
  const short = balance !== null && balance < CREDIT_COST.render;
  const needsRender = !latest || changed;
  const captionOverLimit = caption.length > MAX_POST_CAPTION;
  const reason = rendering
    ? 'Wait for the render to finish'
    : captionOverLimit
      ? 'Use 2,200 caption characters or fewer'
      : autosave.status === 'saving'
        ? 'Wait for your caption to save'
        : autosave.status === 'failed'
          ? 'Save your caption before rendering'
          : blocking.includes(VideoEditBlocker.VoiceOutdated)
            ? `Generate a voiceover for v${video.scriptVersion.number} first`
            : blocking.includes(VideoEditBlocker.VoiceNotSettled)
              ? 'Add a voiceover first'
              : blocking.includes(VideoEditBlocker.MediaIncomplete)
                ? 'Choose media for every scene first'
                : flagged
                  ? `Fix ${flagged} flagged line${flagged === 1 ? '' : 's'} first`
                  : blocking.length
                    ? 'Finish the earlier steps first'
                    : needsRender && short
                      ? `You need ${CREDIT_COST.render} credits. You have ${balance}.`
                      : null;

  const startRender = () => {
    if (!online || reason || render.isPending || rendering) return;
    render.mutate({
      input: { projectId: project.id, idempotencyKey: renderKey.current() },
    });
  };

  useEffect(() => {
    if (
      !latest ||
      focusLatestAfterRender.current === null ||
      focusLatestAfterRender.current === latest.id
    ) {
      return;
    }

    focusLatestAfterRender.current = null;
    latestHeading.current?.focus();
    toast.success(
      `Export ${latest.number} is ready. Used ${CREDIT_COST.render} credits.`,
    );
  }, [latest]);

  return (
    <ExportStep
      reason={reason}
      balance={balance}
      primary={
        needsRender ? (
          <Button
            onClick={startRender}
            disabled={!online || Boolean(reason) || render.isPending}
            aria-busy={render.isPending || undefined}
          >
            {render.isPending ? <Spinner /> : null}
            {render.isPending
              ? 'Starting…'
              : latest
                ? 'Render again'
                : 'Render video'}
            {render.isPending ? null : (
              <ButtonCost>{CREDIT_COST.render} credits</ButtonCost>
            )}
          </Button>
        ) : latest ? (
          <DownloadButton
            exportRecord={latest}
            online={online}
            onDownloaded={refresh}
            primary
          />
        ) : null
      }
    >
      {panelJob ? (
        <JobPanel
          job={panelJob}
          copy={RENDER_JOB_COPY}
          retrying={retry.isPending}
          online={online}
          onRetry={() => {
            if (!online || retry.isPending) return;
            retry.mutate({ id: panelJob.id });
          }}
          onBackToProjects={() => navigate('/projects')}
          secondaryAction={{
            label: 'Back to edit',
            onClick: () => navigate(`/projects/${project.id}/edit`),
          }}
        />
      ) : (
        <>
          <FinalCheck video={video} />
          <Card>
            <CardHeader>
              <CardTitle>Preset</CardTitle>
            </CardHeader>
            <CardContent className="flex-row items-baseline gap-3">
              <p className="t-label">TikTok</p>
              <p className="t-sm text-ink-2">
                9:16 · 1080 × 1920 · 30 fps · MP4
              </p>
            </CardContent>
          </Card>
          <PostCaptionCard
            video={video}
            caption={caption}
            adTag={adTag}
            disabled={!online}
            onCaption={(text) => {
              setCaption(text);
              if (text.length <= MAX_POST_CAPTION)
                autosave.schedule({ postCaption: text });
            }}
            onAdTag={(value) => {
              setAdTag(value);
              autosave.schedule({ adTag: value });
            }}
          />
        </>
      )}

      {latest && changed && !rendering ? (
        <Alert variant="info">
          <InfoIcon />
          <AlertContent>
            <AlertTitle>
              You changed the video after Export {latest.number}.
            </AlertTitle>{' '}
            <AlertDescription>
              Render again to include your changes. Export {latest.number} stays
              available below.
            </AlertDescription>
          </AlertContent>
        </Alert>
      ) : null}

      {latest ? (
        <LatestExport
          exportRecord={latest}
          headingRef={latestHeading}
          online={online}
          onDownloaded={refresh}
        />
      ) : null}

      <ExportHistory exports={exports} online={online} onDownloaded={refresh} />

      <div className="aside:hidden">
        <TikTokReminders />
      </div>
    </ExportStep>
  );
}

function ExportStep({
  reason,
  balance = null,
  primary,
  children,
}: {
  reason: string | null;
  balance?: number | null;
  primary?: ReactNode;
  children: ReactNode;
}) {
  const { project } = useWorkflow();

  return (
    <StepPage
      step={ProjectStepKey.Export}
      title="Export video"
      subtitle="Check the details, then render your MP4. Every export keeps the settings it used."
      autosave
      asideWidth="320"
      aside={<TikTokReminders />}
      footer={{
        back: { label: 'Edit & preview', href: `/projects/${project.id}/edit` },
        reason,
        meta:
          balance !== null ? (
            <p className="t-sm text-ink-2 max-md:hidden">
              You have <span className="t-mono text-ink">{balance}</span>{' '}
              credits
            </p>
          ) : null,
        actions: primary,
      }}
    >
      {children}
    </StepPage>
  );
}

function FinalCheck({ video }: { video: VideoEdit }) {
  const { project, navigate } = useWorkflow();
  // A studio without claims (a story) has nothing to flag (§3.23).
  const { claimCheck } = studioOf(project.studio);
  const flaggedCaptions = video.captions.lines.filter(
    (line) => line.flags.length,
  ).length;
  const flaggedText = video.scenes.filter((scene) => scene.flags.length).length;
  const track = video.voice.track;
  const textCards = video.scenes.filter(
    (scene) => scene.media?.kind === SceneMediaKind.TextCard,
  ).length;
  const total =
    video.totalSeconds +
    (video.endCard.enabled ? video.endCard.durationSeconds : 0);
  const goEdit = (
    <Button
      variant="link"
      className="h-auto px-0"
      onClick={() => navigate(`/projects/${project.id}/edit`)}
    >
      Fix in Edit &amp; preview
    </Button>
  );
  const rows: { state: 'ok' | 'warn' | 'block'; text: ReactNode }[] = [
    {
      state: 'ok',
      text: `Script v${video.scriptVersion.number}, approved${
        video.scriptVersion.approvedAt
          ? ` ${formatShortDate(video.scriptVersion.approvedAt)}`
          : ''
      }`,
    },
    video.readiness.mediaComplete
      ? {
          state: 'ok',
          text: `Media in all ${video.scenes.length} scenes${textCards ? ` (${textCards} text card${textCards === 1 ? '' : 's'})` : ''}`,
        }
      : {
          state: 'block',
          text: (
            <>
              {video.readiness.missingMediaCount} scene
              {video.readiness.missingMediaCount === 1 ? '' : 's'} without media
              ·{' '}
              <Button
                variant="link"
                className="h-auto px-0"
                onClick={() => navigate(`/projects/${project.id}/media`)}
              >
                Go to media
              </Button>
            </>
          ),
        },
    video.readiness.voiceOutdated
      ? {
          state: 'block',
          text: (
            <>
              Voiceover reads v{track?.scriptVersionNumber} ·{' '}
              <Button
                variant="link"
                className="h-auto px-0"
                onClick={() => navigate(`/projects/${project.id}/voice`)}
              >
                Go to voice
              </Button>
            </>
          ),
        }
      : {
          state: video.readiness.voiceSettled ? 'ok' : 'block',
          text:
            video.voice.source === VoiceSource.None
              ? 'No voiceover'
              : video.voice.source === VoiceSource.Scene
                ? 'Sound from your clips'
                : track?.source === VoiceSource.Recording
                  ? `Your recording, reads v${track.scriptVersionNumber}`
                  : track
                    ? `Voiceover: ${track.voiceName ?? 'AI voice'}, reads v${track.scriptVersionNumber}`
                    : 'No voiceover yet',
        },
    video.captions.enabled
      ? flaggedCaptions
        ? {
            state: 'block',
            text: (
              <>
                {flaggedCaptions} flagged caption
                {flaggedCaptions === 1 ? '' : 's'} · {goEdit}
              </>
            ),
          }
        : {
            state: 'ok',
            text: `Captions: ${video.captions.lines.length} lines${claimCheck ? ', none flagged' : ''}`,
          }
      : { state: 'ok', text: 'Captions off' },
    ...(flaggedText
      ? [
          {
            state: 'block' as const,
            text: (
              <>
                {flaggedText} flagged on-screen line
                {flaggedText === 1 ? '' : 's'} · {goEdit}
              </>
            ),
          },
        ]
      : []),
    video.music.asset
      ? {
          state: 'ok',
          text: `Music: ${video.music.asset.fileName} at ${video.music.levelPercent}%, rights confirmed`,
        }
      : { state: 'ok', text: 'No music' },
    {
      state: 'ok',
      text: `Length ${formatTimecode(total)}${video.endCard.enabled ? ' with the end card' : ''}`,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Final check</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="t-sm flex flex-col gap-2.5">
          {rows.map((row, index) => (
            <li key={index} className="flex items-start gap-2">
              {row.state === 'ok' ? (
                <CheckIcon
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-success"
                />
              ) : row.state === 'warn' ? (
                <TriangleAlertIcon
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-warning"
                />
              ) : (
                <XCircleIcon
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-danger"
                />
              )}
              <span className="sr-only">
                {row.state === 'block' ? 'Needs fixing:' : 'Ready:'}
              </span>
              <span>{row.text}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function PostCaptionCard({
  video,
  caption,
  adTag,
  disabled,
  onCaption,
  onAdTag,
}: {
  video: VideoEdit;
  caption: string;
  adTag: boolean;
  disabled: boolean;
  onCaption: (text: string) => void;
  onAdTag: (value: boolean) => void;
}) {
  const id = useId();
  // Only a studio that offers #ad adds it (a story never does, §3.23).
  const offersAdTag = studioOf(useWorkflow().project.studio).adTag;
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const over = caption.length > MAX_POST_CAPTION;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const counterId = `${id}-counter`;

  useEffect(
    () => () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    },
    [],
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(
        offersAdTag && adTag ? `#ad${caption ? ` ${caption}` : ''}` : caption,
      );
      setCopied(true);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Couldn’t copy. Select the text and copy it instead.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <label htmlFor={id}>Caption for posting</label>
        </CardTitle>
      </CardHeader>
      <CardContent className="gap-3">
        <div className="relative">
          <Textarea
            id={id}
            rows={4}
            value={caption}
            disabled={disabled}
            aria-invalid={over || undefined}
            aria-describedby={`${counterId}${over ? ` ${errorId}` : ''}`}
            onChange={(event) => onCaption(event.target.value)}
          />
          <span
            id={counterId}
            className={cn(
              't-mono t-caption absolute right-3 bottom-2',
              over ? 'text-danger' : 'text-ink-3',
            )}
          >
            {caption.length} / {MAX_POST_CAPTION.toLocaleString('en')}
          </span>
        </div>
        {over ? (
          <p id={errorId} className="t-sm text-danger" role="alert">
            Use 2,200 characters or fewer.
          </p>
        ) : null}
        {video.postCaption.flags.map((flag) => (
          <ClaimFlagCallout
            key={flag.category}
            lead={flag.lead}
            reason={flag.reason}
          />
        ))}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {offersAdTag ? (
            <label className="flex items-start gap-3">
              <Checkbox
                checked={adTag}
                disabled={disabled}
                aria-describedby={hintId}
                onCheckedChange={(checked) => onAdTag(checked === true)}
                className="mt-0.5"
              />
              <span className="flex flex-col">
                <span className="t-label">Start with #ad</span>
                <span id={hintId} className="t-sm text-ink-3">
                  Adds #ad to the start when you copy the caption.
                </span>
              </span>
            </label>
          ) : null}
          <Button
            variant="ghost"
            className={offersAdTag ? undefined : 'ml-auto'}
            onClick={() => void copy()}
          >
            {copied ? (
              <CheckIcon data-icon="inline-start" />
            ) : (
              <CopyIcon data-icon="inline-start" />
            )}
            {copied ? 'Copied' : 'Copy caption'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function LatestExport({
  exportRecord,
  headingRef,
  online,
  onDownloaded,
}: {
  exportRecord: ExportRecord;
  headingRef: RefObject<HTMLHeadingElement | null>;
  online: boolean;
  onDownloaded: () => Promise<unknown>;
}) {
  const { project } = useWorkflow();
  const brief = useCreatorBriefQuery({ projectId: project.id });
  const snapshot = exportRecord.snapshot;
  const briefDownload = useRef<{
    url: string;
    timer: ReturnType<typeof setTimeout>;
  } | null>(null);

  useEffect(
    () => () => {
      if (!briefDownload.current) return;
      clearTimeout(briefDownload.current.timer);
      URL.revokeObjectURL(briefDownload.current.url);
      briefDownload.current = null;
    },
    [],
  );

  const downloadBrief = () => {
    const data = brief.data?.creatorBrief;
    if (!online || !data) return;
    if (briefDownload.current) {
      clearTimeout(briefDownload.current.timer);
      URL.revokeObjectURL(briefDownload.current.url);
    }
    const url = URL.createObjectURL(
      new Blob([data.text], { type: 'text/plain;charset=utf-8' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = data.fileName;
    link.click();
    const timer = setTimeout(() => {
      URL.revokeObjectURL(url);
      if (briefDownload.current?.url === url) briefDownload.current = null;
    }, 0);
    briefDownload.current = { url, timer };
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3">
        <CardTitle
          ref={headingRef}
          tabIndex={-1}
          id="latest-export"
          className="outline-none"
        >
          Export {exportRecord.number}
        </CardTitle>
        <Badge variant={exportRecord.downloadedAt ? 'neutral' : 'success'}>
          {exportRecord.downloadedAt ? 'Downloaded' : 'Ready'}
        </Badge>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-[240px_minmax(0,1fr)]">
        <div className="rounded-lg bg-stage p-3">
          <video
            controls
            playsInline
            preload="metadata"
            poster={exportRecord.posterUrl ?? undefined}
            src={exportRecord.videoUrl ?? undefined}
            aria-label={`Export ${exportRecord.number}`}
            className="mx-auto aspect-9/16 w-full max-w-80 rounded-md bg-stage-surface"
          />
        </div>
        <div className="flex flex-col gap-3">
          <ul className="t-sm flex flex-col gap-1 text-ink-2">
            <li>
              <span className="t-mono text-ink">
                {formatTimecode(exportRecord.durationMs / 1000)}
              </span>{' '}
              · {exportRecord.width} × {exportRecord.height} ·{' '}
              {formatFileSize(exportRecord.sizeBytes)}
            </li>
            <li>
              Script v{snapshot.scriptVersionNumber} · {snapshot.voice} ·{' '}
              {snapshot.captions} · {snapshot.music}
            </li>
            <li>Rendered {formatRelativeTime(exportRecord.createdAt)}</li>
          </ul>
          <div className="flex flex-wrap gap-2">
            <DownloadButton
              exportRecord={exportRecord}
              online={online}
              onDownloaded={onDownloaded}
              primary
            />
            <Button
              variant="secondary"
              disabled={!online || !brief.data}
              onClick={downloadBrief}
            >
              <DownloadIcon data-icon="inline-start" />
              Download creator brief
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Fetches a fresh signed link on each click, so an old link is never reused. */
function DownloadButton({
  exportRecord,
  online,
  onDownloaded,
  primary = false,
  small = false,
}: {
  exportRecord: ExportRecord;
  online: boolean;
  onDownloaded: () => Promise<unknown>;
  primary?: boolean;
  small?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const download = useCreateExportDownloadMutation({
    onSuccess: ({ createExportDownload }) => {
      const link = document.createElement('a');
      link.href = createExportDownload.url;
      link.download = createExportDownload.fileName;
      link.click();
      setFailed(false);
      if (!exportRecord.downloadedAt) void onDownloaded();
    },
    onError: () => setFailed(true),
  });

  return (
    <span className="inline-flex flex-col gap-1">
      <Button
        variant={primary ? 'default' : 'ghost'}
        size={small ? 'sm' : 'default'}
        disabled={!online || download.isPending}
        aria-busy={download.isPending || undefined}
        onClick={() => {
          if (!online || download.isPending) return;
          download.mutate({ id: exportRecord.id });
        }}
      >
        {download.isPending ? (
          <Spinner />
        ) : (
          <DownloadIcon data-icon="inline-start" />
        )}
        {small ? 'Download' : 'Download MP4'}
      </Button>
      {failed ? (
        <span className="t-sm text-danger" role="alert">
          The download didn’t start. Try again.
        </span>
      ) : null}
    </span>
  );
}

function ExportHistory({
  exports,
  online,
  onDownloaded,
}: {
  exports: ExportRecord[];
  online: boolean;
  onDownloaded: () => Promise<unknown>;
}) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export history</CardTitle>
      </CardHeader>
      <CardContent>
        {exports.length === 0 ? (
          <p className="t-sm text-ink-3">
            No exports yet. Your first render appears here.
          </p>
        ) : (
          <ul>
            {exports.map((item) => {
              const expanded = open === item.id;
              const detailsId = `export-details-${item.id}`;

              return (
                <li
                  key={item.id}
                  className="border-b border-border py-3 last:border-b-0"
                >
                  <div className="grid grid-cols-[36px_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[36px_minmax(0,1fr)_auto]">
                    <div className="relative aspect-9/16 w-9 overflow-hidden rounded-sm bg-stage">
                      {item.posterUrl ? (
                        <Image
                          src={item.posterUrl}
                          alt=""
                          fill
                          unoptimized
                          sizes="36px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <p className="t-label">Export {item.number}</p>
                      <p className="t-caption text-ink-3">
                        {formatDateTime(item.createdAt)} · v
                        {item.snapshot.scriptVersionNumber} ·{' '}
                        {formatTimecode(item.durationMs / 1000)} ·{' '}
                        {formatFileSize(item.sizeBytes)}
                      </p>
                    </div>
                    <div className="col-start-2 flex flex-wrap items-start gap-1 sm:col-start-auto">
                      <DownloadButton
                        exportRecord={item}
                        online={online}
                        onDownloaded={onDownloaded}
                        small
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-expanded={expanded}
                        aria-controls={detailsId}
                        aria-label={`${expanded ? 'Hide' : 'Show'} details for Export ${item.number}`}
                        onClick={() => setOpen(expanded ? null : item.id)}
                      >
                        Details
                      </Button>
                    </div>
                  </div>
                  {expanded ? (
                    <dl
                      id={detailsId}
                      className="t-sm mt-3 grid gap-1 text-ink-2"
                    >
                      <div>
                        <dt className="inline font-medium text-ink">Script:</dt>{' '}
                        <dd className="inline">
                          v{item.snapshot.scriptVersionNumber}
                        </dd>
                      </div>
                      {item.snapshot.scenes.map((scene) => (
                        <div key={scene.order}>
                          <dt className="inline font-medium text-ink">
                            {scene.order} {SCENE_PURPOSE_LABEL[scene.purpose]}:
                          </dt>{' '}
                          <dd className="inline">{scene.media}</dd>
                        </div>
                      ))}
                      <div>
                        <dt className="inline font-medium text-ink">
                          Voiceover:
                        </dt>{' '}
                        <dd className="inline">{item.snapshot.voice}</dd>
                      </div>
                      <div>
                        <dt className="inline font-medium text-ink">
                          Captions:
                        </dt>{' '}
                        <dd className="inline">{item.snapshot.captions}</dd>
                      </div>
                      <div>
                        <dt className="inline font-medium text-ink">Music:</dt>{' '}
                        <dd className="inline">{item.snapshot.music}</dd>
                      </div>
                      <div>
                        <dt className="inline font-medium text-ink">
                          End card:
                        </dt>{' '}
                        <dd className="inline">
                          {item.snapshot.endCard ? 'On' : 'Off'}
                        </dd>
                      </div>
                      {item.snapshot.postCaption ? (
                        <div>
                          <dt className="inline font-medium text-ink">
                            Caption for posting:
                          </dt>{' '}
                          <dd className="inline">
                            {item.snapshot.adTag ? '#ad ' : ''}
                            {item.snapshot.postCaption}
                          </dd>
                        </div>
                      ) : null}
                      <div>
                        <dt className="inline font-medium text-ink">
                          Rendered:
                        </dt>{' '}
                        <dd className="inline">
                          {formatLongDate(item.createdAt)}
                        </dd>
                      </div>
                    </dl>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/** The studio's reminders before posting (§5.15, §3.23). */
function TikTokReminders() {
  const { exportReminders } = studioOf(useWorkflow().project.studio);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Before you post on TikTok</CardTitle>
      </CardHeader>
      <CardContent className="gap-3">
        <ul className="t-sm flex list-disc flex-col gap-2 pl-4">
          {exportReminders.map((reminder) => (
            <li key={reminder}>{reminder}</li>
          ))}
        </ul>
        <p className="t-caption text-ink-3">
          These are reminders, not a compliance check. The final review is
          yours.
        </p>
      </CardContent>
    </Card>
  );
}
