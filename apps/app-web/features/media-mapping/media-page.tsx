'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowRightIcon,
  CircleAlertIcon,
  ImagePlusIcon,
  InfoIcon,
  SparklesIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';

import { ClaimFlagCallout } from '@/components/studio/claim-flag-callout';
import { Badge } from '@/components/ui/badge';
import { MediaThumb } from '@/components/studio/media-thumb';
import {
  Alert,
  AlertAction,
  AlertContent,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Button, ButtonCost } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChoiceGroup } from '@/components/ui/choice-group';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AiClipSheet,
  type ClipScene,
} from '@/features/ai-scene-clips/ai-clip-sheet';
import {
  oneClickClipPrompt,
  type ClipCharacter,
  type ClipContext,
} from '@/features/ai-scene-clips/clip-prompt';
import { KeepConsistentCard } from '@/features/keep-consistent/keep-consistent-card';
import { useOfflineDetail } from '@/features/app-shell/offline-banner';
import {
  MediaPickerSheet,
  type MediaPick,
} from '@/features/media-picker/media-picker-sheet';
import { useAutosave } from '@/features/project-workflow/use-autosave';
import {
  useIdempotencyKey,
  useProjectJobs,
} from '@/features/project-workflow/use-project-jobs';
import {
  SaveFailedBanner,
  StepPage,
} from '@/features/project-workflow/step-page';
import { useWorkflow } from '@/features/project-workflow/workflow-state';
import { LineBeats } from '@/features/script-studio/scene-lines';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { clipPlaybackRate, formatClipRate } from '@/lib/studio/clip-rate';
import {
  CREDIT_COST,
  SCENE_PURPOSE_LABEL,
  SHOT_FRAMING_LABEL,
} from '@/lib/studio/labels';
import { studioOf } from '@/lib/studios';
import { cn } from '@/lib/utils';
import {
  useCheckAiClipMutation,
  useGenerateSceneClipsMutation,
} from '@/react-query/ai-clips/ai-clips-operations';
import {
  assetsQueryKeys,
  useProjectAssetsQuery,
  type ProjectAsset,
} from '@/react-query/assets/assets-operations';
import { useMyCreditsQuery } from '@/react-query/credits/credits-operations';
import {
  GenerationJobStatus,
  GenerationJobType,
  AssetKind,
  AssetOrigin,
  ConsistentItemKind,
  PhotoMotion,
  ProjectStepKey,
  SceneClipMode,
  SceneMediaKind,
  SceneTransition,
  ShotSubject,
  VoiceSource,
  type SceneMediaChoiceInput,
} from '@/react-query/generated__types';
import {
  isJobActive,
  type GenerationJobRecord,
} from '@/react-query/generation-jobs/generation-jobs-operations';
import { projectsQueryKeys } from '@/react-query/projects/projects-operations';
import {
  useAutoFillSceneMediaMutation,
  useStartVideoEditMutation,
  useSwitchVideoEditVersionMutation,
  useUpdateVideoEditMutation,
  useVideoEditQuery,
  videoEditsQueryKeys,
  type VideoEdit,
  type VideoEditScene,
} from '@/react-query/video-edits/video-edits-operations';
import { formatTimecode } from '@/utils/date';

/** Unsaved scene changes, keyed by scene id; null clears the scene. */
type MediaPatch = Record<string, SceneMediaChoiceInput | null>;

const MOTION_OPTIONS = [
  { value: PhotoMotion.Still, label: 'Still' },
  { value: PhotoMotion.SlowZoom, label: 'Slow zoom' },
];

/** Media (Design Reference §5.12). */
export function MediaPage() {
  const { project } = useWorkflow();
  const queryClient = useQueryClient();
  const online = useOnlineStatus();
  const edit = useVideoEditQuery({ projectId: project.id });
  const assets = useProjectAssetsQuery({ projectId: project.id });
  const start = useStartVideoEditMutation();
  const startedFor = useRef<string | null>(null);

  useOfflineDetail('Changes will save when you reconnect.');

  const setEdit = useCallback(
    (next: VideoEdit) => {
      queryClient.setQueryData(videoEditsQueryKeys.detail(project.id), {
        videoEdit: next,
      });
      void queryClient.invalidateQueries({
        queryKey: projectsQueryKeys.detail(project.id),
      });
    },
    [project.id, queryClient],
  );

  // The first visit starts the video from the approved script (idempotent).
  useEffect(() => {
    if (edit.data?.videoEdit !== null || startedFor.current === project.id) {
      return;
    }
    startedFor.current = project.id;
    start.mutate(
      { projectId: project.id },
      {
        onSuccess: (data) => setEdit(data.startVideoEdit),
        onError: (error) => toast.error(error.message),
      },
    );
  }, [edit.data, project.id, setEdit, start]);

  const video = edit.data?.videoEdit ?? null;

  if (edit.isError || start.isError || assets.isError) {
    return (
      <MediaStep video={null} ready={[]}>
        <Alert variant="danger" role="alert">
          <CircleAlertIcon />
          <AlertContent>
            <AlertTitle>We couldn’t load your video.</AlertTitle>{' '}
            <AlertDescription>
              Check your connection and try again.
            </AlertDescription>
          </AlertContent>
          <AlertAction>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                startedFor.current = null;
                start.reset();
                void edit.refetch();
                void assets.refetch();
              }}
            >
              Try again
            </Button>
          </AlertAction>
        </Alert>
      </MediaStep>
    );
  }

  if (!video || assets.isPending) {
    return (
      <MediaStep video={null} ready={[]}>
        <div
          aria-busy="true"
          aria-label="Loading scenes"
          className="flex flex-col gap-3"
        >
          {Array.from({ length: 5 }, (_, index) => (
            <Card
              key={index}
              className="grid grid-cols-[96px_1fr] gap-4 p-4 md:grid-cols-[120px_1fr]"
            >
              <Skeleton className="aspect-9/16 w-full rounded-md" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </Card>
          ))}
        </div>
      </MediaStep>
    );
  }

  return (
    <MediaEditor
      key={video.id}
      video={video}
      ready={assets.data?.projectAssets ?? []}
      online={online}
      onSaved={setEdit}
    />
  );
}

function MediaEditor({
  video,
  ready,
  online,
  onSaved,
}: {
  video: VideoEdit;
  ready: ProjectAsset[];
  online: boolean;
  onSaved: (next: VideoEdit) => void;
}) {
  const queryClient = useQueryClient();
  const studio = studioOf(useWorkflow().project.studio);
  const [draft, setDraft] = useState<MediaPatch>({});
  const [picking, setPicking] = useState<VideoEditScene | null>(null);
  const [clipsFor, setClipsFor] = useState<string | null>(null);
  const update = useUpdateVideoEditMutation();
  const aiClips = video.aiClipsEnabled;
  /**
   * A story's characters in a scene, with the look that describes them
   * (§3.23 Clip prompts): the Keep consistent characters tagged in it, or,
   * with none on the list, the cast members who speak or are named there.
   */
  const charactersIn = (scene: VideoEditScene): ClipCharacter[] => {
    const cast = video.clipContext.cast;
    const items = video.consistentItems.filter(
      (item) => item.kind === ConsistentItemKind.Character,
    );

    if (items.length) {
      return items
        .filter((item) => item.sceneIds.includes(scene.sceneId))
        .map((item) => ({
          name: item.name,
          look:
            cast.find(
              (member) =>
                member.id === item.id ||
                comparable(member.name) === comparable(item.name),
            )?.look ?? null,
        }));
    }

    const speakers = new Set(
      scene.lines.map((line) => comparable(line.speaker)),
    );
    const visual = ` ${comparable(scene.visual)} `;

    return cast
      .filter(
        (member) =>
          speakers.has(comparable(member.name)) ||
          visual.includes(` ${comparable(member.name)} `),
      )
      .map((member) => ({ name: member.name, look: member.look }));
  };
  /** What a scene's AI clip takes from the script beyond the scene itself. */
  const clipContextFor = (scene: VideoEditScene): ClipContext => ({
    scenario: video.shoot?.scenario ?? null,
    tone: video.clipContext.tone,
    language: video.clipContext.language,
    // The chosen hook opens the video, so only the first scene takes it,
    // and not when that scene's visual already is the hook's opening shot.
    openingShot:
      scene.order === 1 &&
      comparable(video.clipContext.openingShot ?? '') !==
        comparable(scene.visual)
        ? video.clipContext.openingShot
        : null,
    product:
      video.consistentItems.find(
        (item) => item.kind === ConsistentItemKind.Product,
      )?.name ?? null,
    story: studio.characters
      ? {
          genre: video.clipContext.genre ?? null,
          characters: charactersIn(scene),
        }
      : null,
  });
  const uploads = ready.filter((asset) => asset.origin !== AssetOrigin.AiClip);
  const credits = useMyCreditsQuery();
  const checkClip = useCheckAiClipMutation();
  const { latest, track } = useProjectJobs(video.projectId, (job) => {
    if (job.type !== GenerationJobType.GenerateSceneClips) return;
    void (async () => {
      await queryClient.invalidateQueries({
        queryKey: assetsQueryKeys.list(video.projectId),
      });
      if (job.status !== GenerationJobStatus.Completed) return;
      const made =
        queryClient
          .getQueryData<{ projectAssets: ProjectAsset[] }>(
            assetsQueryKeys.list(video.projectId),
          )
          ?.projectAssets.filter((asset) => asset.aiClip?.jobId === job.id)
          .length ??
        job.clipCount ??
        1;
      const order = video.scenes.find(
        (scene) => scene.sceneId === job.sceneId,
      )?.order;
      toast.success(
        `${made} ${made === 1 ? 'clip' : 'clips'} for scene ${order ?? ''} ${made === 1 ? 'is' : 'are'} ready to check. Used ${made * CREDIT_COST.aiClip} credits.`,
        job.sceneId
          ? {
              action: {
                label: 'Review',
                onClick: () => setClipsFor(job.sceneId ?? null),
              },
            }
          : undefined,
      );
    })();
  });
  const clipJobFor = (sceneId: string) =>
    latest(
      GenerationJobType.GenerateSceneClips,
      (job) => job.sceneId === sceneId,
    );
  const autoFill = useAutoFillSceneMediaMutation({
    onSuccess: ({ autoFillSceneMedia }) => {
      setDraft({});
      onSaved(autoFillSceneMedia);
    },
    onError: (error) => toast.error(error.message),
  });
  const switchVersion = useSwitchVideoEditVersionMutation({
    onSuccess: ({ switchVideoEditVersion }) => {
      setDraft({});
      onSaved(switchVideoEditVersion);
      toast.success(
        `This video now uses v${switchVideoEditVersion.scriptVersion.number}.`,
      );
    },
    onError: (error) => toast.error(error.message),
  });

  const oneClickKey = useIdempotencyKey();
  const [startingFor, setStartingFor] = useState<string | null>(null);
  const oneClick = useGenerateSceneClipsMutation({
    onSuccess: ({ generateSceneClips }) => track(generateSceneClips),
    onError: (error) => toast.error(error.message),
    onSettled: () => {
      oneClickKey.rotate();
      setStartingFor(null);
    },
  });

  const autosave = useAutosave<MediaPatch>({
    source: 'media',
    enabled: online,
    save: async (patch) => {
      const data = await update.mutateAsync({
        input: {
          projectId: video.projectId,
          sceneMedia: Object.entries(patch).map(([sceneId, media]) => ({
            sceneId,
            media,
          })),
        },
      });
      onSaved(data.updateVideoEdit);
      // Keep only changes made while this save was in flight.
      setDraft((current) =>
        Object.fromEntries(
          Object.entries(current).filter(
            ([sceneId, value]) => patch[sceneId] !== value,
          ),
        ),
      );
    },
  });

  const assetsById = useMemo(
    () => new Map(ready.map((asset) => [asset.id, asset])),
    [ready],
  );

  /** A scene's media with unsaved changes applied. */
  const mediaOf = (scene: VideoEditScene): SceneView => {
    if (!(scene.sceneId in draft)) {
      return scene.media
        ? {
            kind: scene.media.kind,
            asset: scene.media.asset ?? null,
            motion: scene.media.motion,
            clipStartSeconds: scene.media.clipStartSeconds,
          }
        : null;
    }

    const choice = draft[scene.sceneId];
    if (!choice) return null;

    return {
      kind: choice.kind,
      asset: choice.assetId ? (assetsById.get(choice.assetId) ?? null) : null,
      motion: choice.motion ?? PhotoMotion.Still,
      clipStartSeconds: choice.clipStartSeconds ?? 0,
    };
  };

  const change = (sceneId: string, choice: SceneMediaChoiceInput | null) => {
    setDraft((current) => ({ ...current, [sceneId]: choice }));
    autosave.schedule({ [sceneId]: choice });
  };

  const scenes = video.scenes.map((scene) => ({
    scene,
    media: mediaOf(scene),
  }));
  const missing = scenes.filter(({ media }) => !media).length;
  const usedIn = new Map<string, number[]>();
  for (const { scene, media } of scenes) {
    if (media?.asset) {
      usedIn.set(media.asset.id, [
        ...(usedIn.get(media.asset.id) ?? []),
        scene.order,
      ]);
    }
  }
  const pickingMedia = picking ? mediaOf(picking) : null;
  const ordered = [...video.scenes].sort((a, b) => a.order - b.order);
  // The server gates on what is saved, so these read the saved video.
  const firstSceneHasClip =
    ordered[0]?.media?.asset?.origin === AssetOrigin.AiClip;
  const itemsMissing = video.consistentItems.filter(
    (item) => !item.photo,
  ).length;
  const balance = credits.data?.myCredits.balance ?? null;
  const photosById = new Map(
    uploads
      .filter((asset) => asset.kind === AssetKind.Photo)
      .map((asset) => [asset.id, asset]),
  );

  /** One-click Generate clip (§5.12 item 7): its reason, or how to start it. */
  const oneClickFor = (scene: VideoEditScene) => {
    const index = ordered.findIndex((item) => item.sceneId === scene.sceneId);
    // A story's photos are optional (R28 D3), so they never hold a clip back.
    const reason = !online
      ? 'Reconnect to generate a clip'
      : itemsMissing && !studio.media.photosOptional
        ? itemsMissing === 1
          ? 'Add a photo for 1 item first'
          : `Add photos for ${itemsMissing} items first`
        : index > 0 && !firstSceneHasClip
          ? 'Make scene 1’s clip first'
          : balance !== null && balance < CREDIT_COST.aiClip
            ? `You need ${CREDIT_COST.aiClip} credits. You have ${balance}.`
            : null;

    return {
      reason,
      starting: startingFor === scene.sceneId,
      disabled: Boolean(reason) || oneClick.isPending,
      onClick: () => {
        if (reason || oneClick.isPending) return;

        const inScene = video.consistentItems.filter((item) =>
          item.sceneIds.includes(scene.sceneId),
        );
        // With optional photos, the close names only the items it sends.
        const names = (
          studio.media.photosOptional
            ? inScene.filter((item) => item.photo)
            : inScene.length
              ? inScene
              : video.consistentItems.filter(
                  (item) => item.kind === ConsistentItemKind.Product,
                )
        ).map((item) => item.name);
        const follows = ordered
          .slice(0, Math.max(0, index))
          .some(
            (item) =>
              item.media?.kind === SceneMediaKind.Asset && item.media.asset,
          );

        setStartingFor(scene.sceneId);
        oneClick.mutate({
          input: {
            projectId: video.projectId,
            sceneId: scene.sceneId,
            mode: SceneClipMode.Consistent,
            clipCount: 1,
            prompt: oneClickClipPrompt(
              scene.visual,
              scene.direction ?? null,
              video.shoot?.presenter,
              names,
              follows,
              {
                sound: scene.sound ?? null,
                lines: scene.lines,
                seconds: scene.durationSeconds,
              },
              clipContextFor(scene),
            ),
            idempotencyKey: oneClickKey.current(),
          },
        });
      },
    };
  };
  const newer = video.newerApprovedVersion;
  // A skit has no narrator, so no scene carries narration.
  const skit = video.scenes.every((scene) => !scene.narration.trim());
  // A settled voiceover sets each scene's length (§3.14), not the script.
  const voiced =
    (video.voice.source === VoiceSource.Ai ||
      video.voice.source === VoiceSource.Recording) &&
    video.readiness.voiceSettled;

  /** A clip job's clips that no scene uses yet, oldest first. */
  const pendingClips = (job: GenerationJobRecord | null) =>
    job
      ? ready.filter(
          (asset) => asset.aiClip?.jobId === job.id && !usedIn.has(asset.id),
        )
      : [];
  const clipSceneRecord = clipsFor
    ? (video.scenes.find((scene) => scene.sceneId === clipsFor) ?? null)
    : null;
  const clipJob = clipSceneRecord ? clipJobFor(clipSceneRecord.sceneId) : null;
  const clipScene: ClipScene | null = clipSceneRecord
    ? {
        sceneId: clipSceneRecord.sceneId,
        order: clipSceneRecord.order,
        durationSeconds: clipSceneRecord.durationSeconds,
        visual: clipSceneRecord.visual,
        direction: clipSceneRecord.direction ?? null,
        presenter: video.shoot?.presenter ?? null,
        audio: {
          sound: clipSceneRecord.sound ?? null,
          lines: clipSceneRecord.lines,
          seconds: clipSceneRecord.durationSeconds,
        },
        context: clipContextFor(clipSceneRecord),
        photoId: (() => {
          const media = mediaOf(clipSceneRecord);
          return media?.asset?.kind === AssetKind.Photo ? media.asset.id : null;
        })(),
      }
    : null;

  return (
    <MediaStep
      video={video}
      ready={uploads}
      used={
        [...usedIn.keys()].filter((id) =>
          uploads.some((asset) => asset.id === id),
        ).length
      }
      online={online}
      reason={
        missing
          ? `Choose media for ${missing} more scene${missing === 1 ? '' : 's'}`
          : null
      }
      banners={
        <>
          <SaveFailedBanner />
          {newer ? (
            <Alert variant="info">
              <InfoIcon />
              <AlertContent>
                <AlertTitle>
                  v{newer.number} is approved. This video still uses v
                  {video.scriptVersion.number}.
                </AlertTitle>{' '}
                <AlertDescription>
                  Switch to v{newer.number} to match your latest script. Scenes
                  keep their media where they still match.
                </AlertDescription>
              </AlertContent>
              <AlertAction>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!online || switchVersion.isPending}
                  aria-busy={switchVersion.isPending || undefined}
                  onClick={() => {
                    if (!online || switchVersion.isPending) return;
                    switchVersion.mutate({
                      input: {
                        projectId: video.projectId,
                        scriptVersionId: newer.id,
                      },
                    });
                  }}
                >
                  {switchVersion.isPending ? <Spinner /> : null}
                  {switchVersion.isPending
                    ? 'Switching…'
                    : `Use v${newer.number}`}
                </Button>
              </AlertAction>
            </Alert>
          ) : null}
        </>
      }
    >
      {video.shoot ? (
        <ShootPlanCard shoot={video.shoot} cast={skit || studio.castShoot} />
      ) : null}
      {aiClips ? (
        <KeepConsistentCard
          key={video.scriptVersion.id}
          video={video}
          photos={photosById}
          firstSceneHasClip={firstSceneHasClip}
          online={online}
          onSaved={onSaved}
        />
      ) : null}

      <section aria-labelledby="scenes-heading" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="scenes-heading" className="t-h3">
            Scenes · {video.scenes.length}
            <span className="t-mono ml-2 font-normal text-ink-2">
              {formatTimecode(video.totalSeconds)} total
            </span>
          </h2>
          <FillButton
            disabled={!online || uploads.length === 0}
            empty={uploads.length === 0}
            pending={autoFill.isPending}
            onClick={() => {
              if (!online || uploads.length === 0 || autoFill.isPending) return;
              autoFill.mutate({ projectId: video.projectId });
            }}
          />
        </div>
        {voiced ? (
          <p className="t-sm text-ink-2">
            Your voiceover sets these scene lengths, so they can differ from the
            script.
          </p>
        ) : null}
        <p className="t-sm text-ink-2">
          Fill from uploads places your photos and clips, in order, in empty
          scenes only. It’s free, and you can change every pick.
        </p>
        <ol className="flex flex-col gap-3">
          {scenes.map(({ scene, media }, index) => (
            <SceneMediaRow
              key={scene.sceneId}
              scene={scene}
              skit={skit}
              shotSubjectLabel={studio.shotSubjectLabel}
              next={scenes[index + 1]?.scene ?? null}
              media={media}
              disabled={!online}
              onChoose={() => setPicking(scene)}
              onClear={() => change(scene.sceneId, null)}
              onChange={(choice) => change(scene.sceneId, choice)}
              clips={
                aiClips ? (
                  <ClipStatus
                    job={clipJobFor(scene.sceneId)}
                    pending={pendingClips(clipJobFor(scene.sceneId)).length}
                    disabled={!online}
                    first={scene.sceneId === ordered[0]?.sceneId}
                    oneClick={oneClickFor(scene)}
                    onOpen={() => setClipsFor(scene.sceneId)}
                  />
                ) : null
              }
            />
          ))}
        </ol>
      </section>

      <MediaPickerSheet
        open={Boolean(picking)}
        onOpenChange={(open) => !open && setPicking(null)}
        projectId={video.projectId}
        sceneNumber={picking?.order ?? 0}
        current={
          pickingMedia
            ? pickingMedia.kind === SceneMediaKind.TextCard
              ? { kind: 'text' }
              : pickingMedia.asset
                ? { kind: 'asset', assetId: pickingMedia.asset.id }
                : null
            : null
        }
        usedIn={usedIn}
        online={online}
        sceneId={picking?.sceneId}
        aiClipsEnabled={aiClips}
        onGenerate={() => {
          if (!picking) return;
          setClipsFor(picking.sceneId);
          setPicking(null);
        }}
        onConfirm={(pick: MediaPick) => {
          if (!picking) return;
          change(
            picking.sceneId,
            pick.kind === 'text'
              ? { kind: SceneMediaKind.TextCard }
              : {
                  kind: SceneMediaKind.Asset,
                  assetId: pick.assetId,
                  motion: PhotoMotion.SlowZoom,
                  clipStartSeconds: 0,
                },
          );
          setPicking(null);
        }}
      />

      {aiClips || clipsFor ? (
        <AiClipSheet
          open={Boolean(clipScene)}
          onOpenChange={(open) => !open && setClipsFor(null)}
          projectId={video.projectId}
          scene={clipScene}
          job={clipJob}
          clips={pendingClips(clipJob)}
          made={
            clipJob
              ? ready.filter((asset) => asset.aiClip?.jobId === clipJob.id)
                  .length
              : 0
          }
          photos={uploads.filter((asset) => asset.kind === AssetKind.Photo)}
          uploadCount={uploads.length}
          online={online}
          balance={balance}
          sceneNumbers={
            new Map(video.scenes.map((scene) => [scene.sceneId, scene.order]))
          }
          onTrack={track}
          onUse={async (clip) => {
            if (!clipScene) return;
            await checkClip.mutateAsync({ id: clip.id });
            await queryClient.invalidateQueries({
              queryKey: assetsQueryKeys.list(video.projectId),
            });
            change(clipScene.sceneId, {
              kind: SceneMediaKind.Asset,
              assetId: clip.id,
              clipStartSeconds: 0,
            });
            setClipsFor(null);
            toast.success(
              `Clip ${clip.aiClip?.label ?? ''} is in scene ${clipScene.order}.`,
            );
          }}
        />
      ) : null}
    </MediaStep>
  );
}

/**
 * The approved script's shoot plan, read-only, as the Script shows it (§5.8):
 * the scenario and who is on camera, so each pick fits the same shoot.
 */
function ShootPlanCard({
  shoot,
  cast,
}: {
  shoot: NonNullable<VideoEdit['shoot']>;
  /** The presenter names a cast: a skit's (§3.22) or a story's (§3.23). */
  cast: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Shoot plan</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <dt className="t-label">Scenario</dt>
            <dd className="t-body">{shoot.scenario || '—'}</dd>
          </div>
          <div className="flex flex-col gap-1.5">
            <dt className="t-label">{cast ? 'Cast' : 'On camera'}</dt>
            <dd className="t-body">
              {shoot.presenter ||
                (cast ? 'Not named yet.' : 'Nobody. Hands and product only.')}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}

/** A scene row's AI clip entry or the state of its latest clip job (§5.12). */
function ClipStatus({
  job,
  pending,
  disabled,
  first,
  oneClick,
  onOpen,
}: {
  job: GenerationJobRecord | null;
  pending: number;
  disabled: boolean;
  /** The first scene in edit order sets the look (§3.21). */
  first: boolean;
  /** One-click Generate clip from the Keep consistent photos. */
  oneClick: {
    reason: string | null;
    starting: boolean;
    disabled: boolean;
    onClick: () => void;
  };
  onOpen: () => void;
}) {
  if (job && isJobActive(job)) {
    return (
      <p className="t-sm flex flex-wrap items-center gap-2 text-ink-2">
        <Spinner className="size-3.5" />
        Generating {job.clipCount ?? 2}{' '}
        {(job.clipCount ?? 2) === 1 ? 'clip' : 'clips'}…
        <Button size="sm" variant="ghost" onClick={onOpen}>
          View
        </Button>
      </p>
    );
  }

  if (job?.status === GenerationJobStatus.Failed) {
    return (
      <p className="t-sm flex flex-wrap items-center gap-2 text-danger">
        <CircleAlertIcon aria-hidden="true" className="size-3.5 shrink-0" />
        Clip generation didn’t finish.
        <Button size="sm" variant="ghost" onClick={onOpen}>
          View
        </Button>
      </p>
    );
  }

  if (job?.status === GenerationJobStatus.Completed && pending > 0) {
    return (
      <p className="t-sm flex flex-wrap items-center gap-2 text-ink-2">
        <SparklesIcon aria-hidden="true" className="size-4 shrink-0" />
        {pending} {pending === 1 ? 'clip' : 'clips'} ready to check
        <Button size="sm" variant="ghost" onClick={onOpen}>
          Review
        </Button>
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={oneClick.disabled}
          aria-busy={oneClick.starting || undefined}
          onClick={oneClick.onClick}
        >
          {oneClick.starting ? (
            <Spinner />
          ) : (
            <SparklesIcon data-icon="inline-start" />
          )}
          {oneClick.starting ? 'Starting…' : 'Generate clip'}
          {oneClick.starting ? null : (
            <ButtonCost>{CREDIT_COST.aiClip} credits</ButtonCost>
          )}
        </Button>
        <Button size="sm" variant="ghost" disabled={disabled} onClick={onOpen}>
          Customize
        </Button>
      </div>
      {oneClick.reason ? (
        <p className="t-caption text-ink-3">{oneClick.reason}</p>
      ) : null}
      {first ? (
        <p className="t-caption text-ink-2">
          Sets the look for every clip after it.
        </p>
      ) : null}
    </div>
  );
}

type SceneView = {
  kind: SceneMediaKind;
  asset: ProjectAsset | null;
  motion: PhotoMotion;
  clipStartSeconds: number;
} | null;

/** Page chrome shared by the loading, error and editing states. */
function MediaStep({
  video,
  ready,
  used = 0,
  online = true,
  reason = null,
  banners,
  children,
}: {
  video: VideoEdit | null;
  ready: ProjectAsset[];
  used?: number;
  online?: boolean;
  reason?: string | null;
  banners?: ReactNode;
  children: ReactNode;
}) {
  const { project, navigate } = useWorkflow();
  const studio = studioOf(project.studio);

  return (
    <StepPage
      step={ProjectStepKey.Media}
      title="Media"
      subtitle="Pick what viewers see in each scene. Use your photos and clips, or a text card."
      autosave
      banners={banners}
      aside={
        <Card>
          <CardHeader>
            <CardTitle>Your uploads</CardTitle>
          </CardHeader>
          <CardContent className="gap-2">
            <p className="t-sm text-ink-2">
              <span className="t-mono text-ink">{ready.length}</span>{' '}
              {ready.length === 1 ? 'file' : 'files'} ·{' '}
              <span className="t-mono text-ink">{used}</span> used
            </p>
            {/* Uploads are managed on Product only where the studio has it. */}
            {studio.intakeSteps.includes(ProjectStepKey.Product) ? (
              <Button
                variant="link"
                className="self-start px-0"
                onClick={() => navigate(`/projects/${project.id}/product`)}
              >
                Manage on Product
              </Button>
            ) : null}
            <p className="t-sm text-ink-2">{studio.media.uploadsNote}</p>
          </CardContent>
        </Card>
      }
      footer={{
        back: { label: 'Script', href: `/projects/${project.id}/script` },
        reason: video ? reason : null,
        actions: (
          <Button
            disabled={!video || !online || Boolean(reason)}
            onClick={() => navigate(`/projects/${project.id}/voice`)}
          >
            Continue to voice
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        ),
      }}
    >
      {children}
    </StepPage>
  );
}

function FillButton({
  disabled,
  empty,
  pending,
  onClick,
}: {
  disabled: boolean;
  empty: boolean;
  pending: boolean;
  onClick: () => void;
}) {
  const button = (
    <Button
      variant="secondary"
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      onClick={onClick}
    >
      {pending ? <Spinner /> : null}
      {pending ? 'Filling…' : 'Fill from uploads'}
    </Button>
  );

  if (!empty) return button;

  // A disabled button gets no pointer events, so the tooltip hangs on a wrapper.
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} className="inline-flex rounded-md">
          {button}
        </span>
      </TooltipTrigger>
      <TooltipContent>Upload photos or clips first</TooltipContent>
    </Tooltip>
  );
}

/** Words only, lower-case, for telling whether two directions say the same. */
function comparable(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function SceneMediaRow({
  scene,
  skit,
  shotSubjectLabel,
  next,
  media,
  disabled,
  onChoose,
  onClear,
  onChange,
  clips,
}: {
  scene: VideoEditScene;
  /** A skit's cast is on camera, not only the creator. */
  skit: boolean;
  /** The studio's In frame labels (§3.23). */
  shotSubjectLabel: Record<ShotSubject, string>;
  /** The scene after this one in edit order; its transition can play over this clip. */
  next: VideoEditScene | null;
  media: SceneView;
  disabled: boolean;
  onChoose: () => void;
  onClear: () => void;
  onChange: (choice: SceneMediaChoiceInput) => void;
  /** The AI clip entry or status line, when AI scene clips are enabled. */
  clips?: ReactNode;
}) {
  const purpose = SCENE_PURPOSE_LABEL[scene.purpose];
  const studio = studioOf(useWorkflow().project.studio);
  const end = scene.startSeconds + scene.durationSeconds;
  const isTextCard = media?.kind === SceneMediaKind.TextCard;
  const isClip = media?.asset?.kind === AssetKind.Clip;
  const isPhoto = media?.asset?.kind === AssetKind.Photo;
  const withSound =
    isClip && scene.clipSound.on && scene.clipSound.levelPercent > 0;
  const direction = scene.direction
    ? [
        SHOT_FRAMING_LABEL[scene.direction.framing],
        skit && scene.direction.inFrame === ShotSubject.Creator
          ? 'Cast on camera'
          : shotSubjectLabel[scene.direction.inFrame],
        scene.direction.setting.trim(),
        scene.direction.props.trim()
          ? `Props: ${scene.direction.props.trim()}`
          : '',
      ]
        .filter(Boolean)
        .join(' · ')
    : null;

  return (
    <li>
      <Card
        className={cn(
          'grid grid-cols-[96px_minmax(0,1fr)] gap-4 p-4 md:grid-cols-[120px_minmax(0,1fr)]',
          scene.flags.length && 'border-warning-border',
        )}
      >
        <button
          type="button"
          onClick={onChoose}
          disabled={disabled}
          aria-label={`Choose media for scene ${scene.order}, ${purpose}`}
          className={cn(
            'relative aspect-9/16 w-full overflow-hidden rounded-md',
            !media &&
              'flex flex-col items-center justify-center gap-1.5 border-[1.5px] border-dashed border-border-strong bg-canvas',
          )}
        >
          {media ? (
            <>
              <MediaThumb
                asset={media.asset}
                textCard={isTextCard ? scene.onScreenText : undefined}
                className="size-full"
              />
              {media.asset?.origin === AssetOrigin.AiClip ? (
                <Badge dot={false} className="absolute top-2 left-2">
                  AI clip
                </Badge>
              ) : null}
            </>
          ) : (
            <>
              <ImagePlusIcon aria-hidden="true" className="size-5 text-ink-3" />
              <span className="t-caption text-ink-2">Choose media</span>
            </>
          )}
        </button>

        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="t-mono flex size-7 items-center justify-center rounded-sm bg-ink text-white">
              {scene.order}
            </span>
            <h3 className="t-h3">{purpose}</h3>
            <span className="t-mono text-ink-2">
              {formatTimecode(scene.startSeconds)}–{formatTimecode(end)}
            </span>
            <span className="t-mono text-ink-3">{scene.durationSeconds} s</span>
          </div>
          {/* A skit scene shows each line as it plays; a narrated one its narration. */}
          {scene.lines.length ? (
            <div className="flex flex-col gap-1">
              <LineBeats
                lines={scene.lines}
                durationSeconds={scene.durationSeconds}
                size="sm"
              />
            </div>
          ) : scene.narration.trim() ? (
            <p className="t-sm line-clamp-2 text-ink-2">“{scene.narration}”</p>
          ) : null}
          {scene.sound ? (
            <p className="t-sm text-ink-2">
              <span className="font-medium text-ink">Sound:</span> {scene.sound}
            </p>
          ) : null}
          <p className="t-sm text-ink-2">
            <span className="font-medium text-ink">Suggested visual:</span>{' '}
            {scene.visual}
          </p>
          {direction ? (
            <p className="t-sm text-ink-2">
              <span className="font-medium text-ink">Shot direction:</span>{' '}
              {direction}
            </p>
          ) : null}
          {scene.order > 1 && scene.transitionIn === SceneTransition.PunchIn ? (
            <p className="t-caption text-ink-3">{studio.media.punchInHint}</p>
          ) : null}
          {scene.flags.map((flag) => (
            <ClaimFlagCallout
              key={flag.category}
              lead={flag.lead}
              reason={flag.reason}
            />
          ))}

          {media ? (
            <div className="mt-1 flex flex-wrap items-start gap-3">
              {isPhoto && media.asset ? (
                <ChoiceGroup<PhotoMotion>
                  label="Motion"
                  variant="segment"
                  value={media.motion}
                  disabled={disabled}
                  onValueChange={(motion) =>
                    onChange({
                      kind: SceneMediaKind.Asset,
                      assetId: media.asset?.id,
                      motion,
                    })
                  }
                  options={MOTION_OPTIONS}
                />
              ) : null}
              {isClip && media.asset ? (
                <ClipStart
                  sceneOrder={scene.order}
                  asset={media.asset}
                  sceneSeconds={scene.durationSeconds}
                  overlap={overlapInto(next)}
                  withSound={withSound}
                  value={media.clipStartSeconds}
                  disabled={disabled}
                  onChange={(clipStartSeconds) =>
                    onChange({
                      kind: SceneMediaKind.Asset,
                      assetId: media.asset?.id,
                      clipStartSeconds,
                    })
                  }
                />
              ) : null}
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={disabled}
                  onClick={onChoose}
                >
                  Change
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={disabled}
                  onClick={onClear}
                >
                  Clear
                </Button>
              </div>
            </div>
          ) : null}
          {withSound ? (
            <p className="t-caption text-ink-3">
              Sound on · {scene.clipSound.levelPercent}%. Change it in Edit &
              preview.
            </p>
          ) : null}
          {clips}
        </div>
      </Card>
    </li>
  );
}

/**
 * Where the clip starts. Feedback mirrors the server rule: a clip at least as
 * long as its scene must leave room for it; a shorter one plays from 0 s,
 * slowed to fill the scene, or, with its sound on, at normal speed before
 * holding its last frame.
 */
export function ClipStart({
  sceneOrder,
  asset,
  sceneSeconds,
  overlap = null,
  withSound = false,
  value,
  disabled,
  onChange,
}: {
  sceneOrder: number;
  asset: ProjectAsset;
  sceneSeconds: number;
  /** The next scene's Whip or Dissolve, which also plays this clip past the scene's end. */
  overlap?: ClipOverlap | null;
  /** The clip plays its own sound, so it is never slowed (§3.22). */
  withSound?: boolean;
  value: number;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  const clipSeconds = asset.durationSeconds ?? 0;
  const [text, setText] = useState(String(value));
  const [error, setError] = useState<string | null>(null);
  const id = `clip-start-${sceneOrder}`;
  const neededSeconds = sceneSeconds + (overlap?.seconds ?? 0);

  if (clipSeconds < sceneSeconds) {
    return (
      <p className="t-sm flex items-center gap-1.5 text-warning">
        <TriangleAlertIcon aria-hidden="true" className="size-3.5 shrink-0" />
        {withSound ? (
          <>
            This clip is {formatSeconds(clipSeconds)} s and the scene needs{' '}
            {formatSeconds(neededSeconds)} s. It plays at normal speed with its
            sound, then holds its last frame for{' '}
            {formatSeconds(roundTenth(neededSeconds - clipSeconds))} s.
          </>
        ) : (
          <>
            This clip is {formatSeconds(clipSeconds)} s, so it plays at{' '}
            {formatClipRate(clipPlaybackRate(clipSeconds, neededSeconds))}×
            speed to fill the scene.
          </>
        )}
      </p>
    );
  }

  const latest = clipSeconds - sceneSeconds;
  const parsed = Number(text);
  const shown = error ? value : parsed;
  // Warns only; the start rule still compares against the scene alone.
  const rate = clipPlaybackRate(clipSeconds - shown, neededSeconds);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <label htmlFor={id} className="t-label">
          Start at
        </label>
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          min={0}
          max={latest}
          step={0.5}
          value={text}
          disabled={disabled}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={`${id}-hint`}
          className="h-8 w-18 font-mono"
          onChange={(event) => {
            const next = event.target.value;
            const number = Number(next);
            setText(next);

            if (
              next === '' ||
              !Number.isFinite(number) ||
              number < 0 ||
              Math.round(number * 2) / 2 !== number
            ) {
              setError('Use a start time in half seconds.');
              return;
            }
            if (number > latest) {
              setError(
                `Start earlier. This clip is ${formatSeconds(clipSeconds)} s and the scene needs ${sceneSeconds} s.`,
              );
              return;
            }
            setError(null);
            onChange(number);
          }}
        />
        <span className="t-mono t-caption text-ink-3">
          s of {formatSeconds(clipSeconds)} s
        </span>
      </div>
      <p
        id={`${id}-hint`}
        className={cn(
          't-sm',
          error ? 'flex items-center gap-1.5 text-danger' : 'text-ink-3',
        )}
        role={error ? 'alert' : undefined}
      >
        {error ? (
          <>
            <CircleAlertIcon aria-hidden="true" className="size-3.5 shrink-0" />
            {error}
          </>
        ) : (
          `Uses ${formatTimecode(shown)}–${formatTimecode(Math.min(clipSeconds, shown + sceneSeconds))} of this clip.`
        )}
      </p>
      {!error && rate < 1 ? (
        <p className="t-sm flex items-center gap-1.5 text-warning">
          <TriangleAlertIcon aria-hidden="true" className="size-3.5 shrink-0" />
          {overlap && shown + sceneSeconds <= clipSeconds
            ? `This clip runs out during the ${overlap.label} into scene ${overlap.nextOrder}`
            : 'This clip runs out before the scene ends'}
          {withSound
            ? `. It plays at normal speed with its sound, then holds its last frame for ${formatSeconds(roundTenth(neededSeconds - (clipSeconds - shown)))} s.`
            : `, so it plays at ${formatClipRate(rate)}× speed.`}
        </p>
      ) : null}
    </div>
  );
}

export interface ClipOverlap {
  seconds: number;
  label: 'Whip' | 'Dissolve';
  nextOrder: number;
}

/** How long the next scene's transition plays over this one (Product Specification §3.19). */
export function overlapInto(next: VideoEditScene | null): ClipOverlap | null {
  if (next?.transitionIn === SceneTransition.Whip) {
    return { seconds: 0.25, label: 'Whip', nextOrder: next.order };
  }
  if (next?.transitionIn === SceneTransition.Dissolve) {
    return { seconds: 0.4, label: 'Dissolve', nextOrder: next.order };
  }
  return null;
}

function formatSeconds(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function roundTenth(value: number): number {
  return Math.round(value * 10) / 10;
}
