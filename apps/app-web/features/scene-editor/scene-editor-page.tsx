'use client';

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowRightIcon,
  CircleAlertIcon,
  GripVerticalIcon,
  LockIcon,
  MoreHorizontalIcon,
  MusicIcon,
  TriangleAlertIcon,
  UploadIcon,
} from 'lucide-react';
import {
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';

import { SampleButton } from '@/components/core/audio-player';
import { ClaimFlagCallout } from '@/components/studio/claim-flag-callout';
import { MediaThumb } from '@/components/studio/media-thumb';
import {
  Alert,
  AlertAction,
  AlertContent,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useOfflineDetail } from '@/features/app-shell/offline-banner';
import { ClipStart } from '@/features/media-mapping/media-page';
import { MediaPickerSheet } from '@/features/media-picker/media-picker-sheet';
import {
  AUDIO_TYPES,
  useAudioUpload,
} from '@/features/product-setup/use-asset-uploads';
import {
  SaveFailedBanner,
  StepPage,
} from '@/features/project-workflow/step-page';
import { useAutosave } from '@/features/project-workflow/use-autosave';
import { useWorkflow } from '@/features/project-workflow/workflow-state';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useOnlineStatus } from '@/hooks/use-online-status';
import {
  SCENE_PURPOSE_LABEL,
  SCENE_TRANSITION_LABEL,
} from '@/lib/studio/labels';
import { STORY_LIMITS, studioOf } from '@/lib/studios';
import { cn } from '@/lib/utils';
import { useRemoveAssetMutation } from '@/react-query/assets/assets-operations';
import {
  AssetKind,
  AssetPurpose,
  CaptionStyle,
  PhotoMotion,
  ProjectStepKey,
  SceneMediaKind,
  SceneTransition,
  ScriptLanguage,
  VoiceSource,
} from '@/react-query/generated__types';
import { projectsQueryKeys } from '@/react-query/projects/projects-operations';
import {
  useResetCaptionsMutation,
  useUpdateVideoEditMutation,
  useVideoEditQuery,
  videoEditsQueryKeys,
  type VideoEdit,
  type VideoEditScene,
} from '@/react-query/video-edits/video-edits-operations';
import { formatFileSize, formatTimecode } from '@/utils/date';

import {
  applyDraft,
  captionError,
  captionPatch,
  clipSoundPatch,
  durationPatch,
  EMPTY_DRAFT,
  scriptTimed,
  textPatch,
  transitionPatch,
  toInput,
  type ClipSoundValue,
  type EditDraft,
  type EditPatch,
} from './draft';
import {
  PreviewPlayer,
  type PreviewPlayerHandle,
} from './preview-player/preview-player';

const STYLE_OPTIONS = [
  { value: CaptionStyle.Clean, label: 'Clean' },
  { value: CaptionStyle.Boxed, label: 'Boxed' },
  { value: CaptionStyle.WordHighlight, label: 'Word highlight' },
];
const STYLE_LABEL: Record<CaptionStyle, string> = {
  [CaptionStyle.Clean]: 'Clean',
  [CaptionStyle.Boxed]: 'Boxed',
  [CaptionStyle.WordHighlight]: 'Word highlight',
};

/** Edit & preview (Design Reference §5.14). */
export function SceneEditorPage() {
  const { project } = useWorkflow();
  const edit = useVideoEditQuery({ projectId: project.id });
  const online = useOnlineStatus();

  useOfflineDetail('Changes will save when you reconnect.');

  const video = edit.data?.videoEdit ?? null;

  if (edit.isError || (edit.isSuccess && !video)) {
    return (
      <EditStep reason={null} ready={false}>
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
              onClick={() => void edit.refetch()}
            >
              Try again
            </Button>
          </AlertAction>
        </Alert>
      </EditStep>
    );
  }

  if (!video) {
    return (
      <EditStep reason={null} ready={false}>
        <div
          aria-busy="true"
          aria-label="Loading editor"
          className="grid gap-6 lg:grid-cols-[minmax(300px,360px)_1fr]"
        >
          <div className="flex aspect-9/16 items-center justify-center rounded-lg bg-stage">
            <Spinner className="size-5 text-stage-ink-2" />
          </div>
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-28 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </EditStep>
    );
  }

  return (
    <SceneEditor
      key={`${video.id}-${video.scriptVersion.id}-${video.voice.track?.id ?? 'none'}-${video.voice.source}`}
      video={video}
      online={online}
    />
  );
}

function SceneEditor({ video, online }: { video: VideoEdit; online: boolean }) {
  const { project, navigate } = useWorkflow();
  const queryClient = useQueryClient();
  const desktop = useMediaQuery('(min-width: 1024px)');
  const [draft, setDraft] = useState<EditDraft>(EMPTY_DRAFT);
  const [playingScene, setPlayingScene] = useState<string | null>(null);
  const [picking, setPicking] = useState<VideoEditScene | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const preview = useRef<PreviewPlayerHandle>(null);
  const shown = useMemo(() => applyDraft(video, draft), [draft, video]);
  const studio = studioOf(project.studio);
  const endCardLines = studio.edit.endCardLines(shown.endCard);
  const endLineId = useId();
  // No voiceover and Sound from your clips both keep the script's scene lengths.
  const timedByScript = scriptTimed(video.voice.source);
  const sceneSound = video.voice.source === VoiceSource.Scene;
  // Creator content carries the script's language (accessibility.md § Content language).
  const lang =
    (project.story ?? project.strategy).language === ScriptLanguage.Filipino
      ? 'fil'
      : 'en';

  const setVideo = useCallback(
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
  const refresh = useCallback(
    () =>
      queryClient.invalidateQueries({
        queryKey: videoEditsQueryKeys.detail(project.id),
      }),
    [project.id, queryClient],
  );

  const update = useUpdateVideoEditMutation();
  const autosave = useAutosave<EditPatch>({
    source: 'edit',
    enabled: online,
    save: async (patch) => {
      const data = await update.mutateAsync({
        input: toInput(project.id, patch),
      });
      setVideo(data.updateVideoEdit);
    },
  });
  const reset = useResetCaptionsMutation({
    onSuccess: ({ resetCaptions }) => {
      setDraft((current) => ({ ...current, captions: {} }));
      setVideo(resetCaptions);
      setResetOpen(false);
      toast.success('Captions reset.');
    },
    onError: (error) => toast.error(error.message),
  });

  const move = (from: number, to: number) => {
    const ids = shown.scenes.map((scene) => scene.sceneId);
    if (to < 0 || to >= ids.length) return;
    const order = arrayMove(ids, from, to);
    setDraft((current) => ({ ...current, order }));
    autosave.schedule({ order });
  };

  const changeMedia = async (
    sceneId: string,
    media: Parameters<typeof toMediaInput>[0],
  ) => {
    try {
      const data = await update.mutateAsync({
        input: {
          projectId: project.id,
          sceneMedia: [{ sceneId, media: toMediaInput(media) }],
        },
      });
      setVideo(data.updateVideoEdit);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'That didn’t save. Try again.',
      );
    }
  };

  const flagged =
    shown.scenes.filter((scene) => scene.flags.length).length +
    video.captions.lines.filter((line) => line.flags.length).length;
  const reason = video.readiness.voiceOutdated
    ? `Generate a voiceover for v${video.scriptVersion.number} first`
    : flagged
      ? `Fix ${flagged} flagged line${flagged === 1 ? '' : 's'} first`
      : null;

  return (
    <EditStep
      reason={reason}
      ready
      online={online}
      onContinue={() => {
        if (!online || reason) return;
        autosave.flush();
        navigate(`/projects/${project.id}/export`);
      }}
      banners={
        <>
          <SaveFailedBanner />
          {video.readiness.voiceOutdated ? (
            <Alert variant="warning">
              <TriangleAlertIcon />
              <AlertContent>
                <AlertTitle>
                  Your voiceover reads v{video.voice.track?.scriptVersionNumber}
                  , but this video now uses v{video.scriptVersion.number}.
                </AlertTitle>{' '}
                <AlertDescription>
                  Generate a new voiceover before you export.
                </AlertDescription>
              </AlertContent>
              <AlertAction>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    autosave.flush();
                    navigate(`/projects/${project.id}/voice`);
                  }}
                >
                  Go to voice
                </Button>
              </AlertAction>
            </Alert>
          ) : null}
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(300px,360px)_minmax(0,1fr)]">
        <div className="lg:sticky lg:top-21 lg:self-start">
          <PreviewPlayer
            ref={preview}
            video={shown}
            onSceneChange={setPlayingScene}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <section
            aria-labelledby="edit-scenes-heading"
            className="flex flex-col gap-3"
          >
            <h2 id="edit-scenes-heading" className="t-h3">
              Scenes · {shown.scenes.length}
              <span className="t-mono ml-2 font-normal text-ink-2">
                {formatTimecode(shown.totalSeconds)} total
              </span>
            </h2>
            <SceneList
              scenes={shown.scenes}
              playingScene={playingScene}
              desktop={desktop}
              timedByScript={timedByScript}
              online={online}
              lang={lang}
              durationErrors={draft.durations}
              onSeek={(scene) =>
                preview.current?.seekTo(scene.startSeconds * 1000)
              }
              onMove={move}
              onText={(sceneId, text) => {
                setDraft((current) => ({
                  ...current,
                  text: { ...current.text, [sceneId]: text },
                }));
                if (text.length <= 60)
                  autosave.schedule(textPatch(sceneId, text));
              }}
              onDuration={(sceneId, seconds) => {
                setDraft((current) => ({
                  ...current,
                  durations: { ...current.durations, [sceneId]: seconds },
                }));
                if (
                  Number.isInteger(seconds) &&
                  seconds >= 2 &&
                  seconds <= 15
                ) {
                  autosave.schedule(durationPatch(sceneId, seconds));
                }
              }}
              onTransition={(sceneId, transitionIn) => {
                setDraft((current) => ({
                  ...current,
                  transitions: {
                    ...current.transitions,
                    [sceneId]: transitionIn,
                  },
                }));
                autosave.schedule(transitionPatch(sceneId, transitionIn));
              }}
              onClipSound={(sceneId, sound) => {
                setDraft((current) => ({
                  ...current,
                  clipSounds: { ...current.clipSounds, [sceneId]: sound },
                }));
                autosave.schedule(clipSoundPatch(sceneId, sound));
              }}
              onChangeMedia={(scene) => setPicking(scene)}
              onClipStart={(scene, clipStartSeconds) =>
                void changeMedia(scene.sceneId, {
                  kind: 'asset',
                  assetId: scene.media?.asset?.id ?? '',
                  motion: scene.media?.motion ?? PhotoMotion.Still,
                  clipStartSeconds,
                })
              }
            />
          </section>

          <CaptionsSection
            video={shown}
            saved={video}
            sceneSound={sceneSound}
            desktop={desktop}
            online={online}
            lang={lang}
            draft={draft}
            onEnabled={(enabled) => {
              setDraft((current) => ({ ...current, captionsEnabled: enabled }));
              autosave.schedule({ captionsEnabled: enabled });
            }}
            onStyle={(style) => {
              setDraft((current) => ({ ...current, captionStyle: style }));
              autosave.schedule({ captionStyle: style });
            }}
            onLine={(id, text) => {
              setDraft((current) => ({
                ...current,
                captions: { ...current.captions, [id]: text },
              }));
              if (!captionError(text))
                autosave.schedule(captionPatch(id, text));
            }}
            onReset={() => setResetOpen(true)}
          />

          <MusicSection
            video={shown}
            desktop={desktop}
            online={online}
            onLevel={(level) => {
              setDraft((current) => ({ ...current, musicLevel: level }));
              autosave.schedule({ musicLevel: level });
            }}
            onStored={refresh}
          />

          <section
            aria-labelledby="end-card-heading"
            className="flex flex-col gap-2"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 id="end-card-heading" className="t-h3">
                End card
              </h2>
              <label className="t-label flex items-center gap-3">
                Show an end card
                <Switch
                  checked={shown.endCard.enabled}
                  onCheckedChange={(enabled) => {
                    setDraft((current) => ({ ...current, endCard: enabled }));
                    autosave.schedule({ endCard: enabled });
                  }}
                />
              </label>
            </div>
            <p className="t-sm text-ink-2">{studio.edit.endCardHint}</p>
            {shown.endCard.enabled && studio.edit.endLine ? (
              <div className="flex flex-col gap-1.5">
                <label htmlFor={endLineId} className="t-label">
                  End line{' '}
                  <span className="t-caption font-normal text-ink-3">
                    Optional
                  </span>
                </label>
                <Input
                  id={endLineId}
                  maxLength={STORY_LIMITS.endLine}
                  placeholder="e.g. Part 2 tomorrow"
                  value={shown.endCard.endLine ?? ''}
                  lang={lang}
                  onChange={(event) => {
                    const endLine = event.target.value;
                    setDraft((current) => ({ ...current, endLine }));
                    autosave.schedule({ endLine });
                  }}
                />
              </div>
            ) : null}
            {shown.endCard.enabled ? (
              <p className="t-sm text-ink">
                {[endCardLines.title, endCardLines.line]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            ) : null}
          </section>
        </div>
      </div>

      <MediaPickerSheet
        open={Boolean(picking)}
        onOpenChange={(open) => !open && setPicking(null)}
        projectId={project.id}
        sceneNumber={picking?.order ?? 0}
        current={
          picking?.media
            ? picking.media.kind === SceneMediaKind.TextCard
              ? { kind: 'text' }
              : picking.media.asset
                ? { kind: 'asset', assetId: picking.media.asset.id }
                : null
            : null
        }
        usedIn={
          new Map(
            shown.scenes.flatMap((scene) =>
              scene.media?.asset
                ? [[scene.media.asset.id, [scene.order]] as const]
                : [],
            ),
          )
        }
        online={online}
        onConfirm={(pick) => {
          if (!picking) return;
          void changeMedia(
            picking.sceneId,
            pick.kind === 'text'
              ? { kind: 'text' }
              : { ...pick, motion: PhotoMotion.SlowZoom, clipStartSeconds: 0 },
          );
          setPicking(null);
        }}
      />

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset captions?</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <DialogDescription>
              {sceneSound
                ? 'Your caption edits will be replaced with the script’s lines.'
                : 'Your caption edits will be replaced with the voiceover’s words.'}{' '}
              This can’t be undone.
            </DialogDescription>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setResetOpen(false)}>
              Keep my edits
            </Button>
            <Button
              variant="destructive"
              disabled={!online || reset.isPending}
              aria-busy={reset.isPending || undefined}
              onClick={() => {
                if (!online || reset.isPending) return;
                reset.mutate({ projectId: project.id });
              }}
            >
              {reset.isPending ? <Spinner /> : null}
              Reset captions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </EditStep>
  );
}

function toMediaInput(
  pick:
    | { kind: 'text' }
    | {
        kind: 'asset';
        assetId: string;
        motion: PhotoMotion;
        clipStartSeconds: number;
      },
) {
  return pick.kind === 'text'
    ? { kind: SceneMediaKind.TextCard }
    : {
        kind: SceneMediaKind.Asset,
        assetId: pick.assetId,
        motion: pick.motion,
        clipStartSeconds: pick.clipStartSeconds,
      };
}

/** Page chrome shared by the loading, error and editing states. */
function EditStep({
  reason,
  ready,
  online = true,
  banners,
  onContinue,
  children,
}: {
  reason: string | null;
  ready: boolean;
  online?: boolean;
  banners?: ReactNode;
  onContinue?: () => void;
  children: ReactNode;
}) {
  const { project } = useWorkflow();

  return (
    <StepPage
      step={ProjectStepKey.Edit}
      title="Edit & preview"
      subtitle="Put the scenes in order, tidy the captions and watch the whole video."
      autosave
      banners={banners}
      footer={{
        back: { label: 'Voice', href: `/projects/${project.id}/voice` },
        reason,
        actions: (
          <Button
            disabled={!ready || !online || Boolean(reason)}
            onClick={onContinue}
          >
            Continue to export
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        ),
      }}
    >
      {children}
    </StepPage>
  );
}

function SceneList({
  scenes,
  playingScene,
  desktop,
  timedByScript,
  online,
  lang,
  durationErrors,
  onSeek,
  onMove,
  onText,
  onDuration,
  onTransition,
  onClipSound,
  onChangeMedia,
  onClipStart,
}: {
  scenes: VideoEditScene[];
  playingScene: string | null;
  desktop: boolean;
  timedByScript: boolean;
  online: boolean;
  lang: string;
  durationErrors: Record<string, number>;
  onSeek: (scene: VideoEditScene) => void;
  onMove: (from: number, to: number) => void;
  onText: (sceneId: string, text: string) => void;
  onDuration: (sceneId: string, seconds: number) => void;
  onTransition: (sceneId: string, transitionIn: SceneTransition) => void;
  onClipSound: (sceneId: string, sound: ClipSoundValue) => void;
  onChangeMedia: (scene: VideoEditScene) => void;
  onClipStart: (scene: VideoEditScene, seconds: number) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const ids = scenes.map((scene) => scene.sceneId);
  const label = (id: string | number) => {
    const scene = scenes.find((item) => item.sceneId === id);
    return scene
      ? `Scene ${scene.order}, ${SCENE_PURPOSE_LABEL[scene.purpose]}`
      : 'Scene';
  };
  const position = (id: string | number | undefined) =>
    ids.indexOf(String(id)) + 1;
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${label(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over
        ? `${label(active.id)} is over position ${position(over.id)} of ${ids.length}.`
        : '',
    onDragEnd: ({ active, over }) =>
      over
        ? `${label(active.id)} moved to position ${position(over.id)} of ${ids.length}.${position(over.id) === 1 ? ' It now opens the video.' : ''}`
        : `${label(active.id)} was dropped.`,
    onDragCancel: ({ active }) => `Moving ${label(active.id)} was cancelled.`,
  };
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    onMove(ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
  };
  // Menu moves need the same announcement the drag sensor gives (§5.14 Reorder).
  const [moved, setMoved] = useState('');
  const moveFromMenu = (from: number, to: number) => {
    if (to < 0 || to >= scenes.length) return;
    onMove(from, to);
    setMoved(
      `${label(scenes[from].sceneId)} moved to position ${to + 1} of ${scenes.length}.${to === 0 ? ' It now opens the video.' : ''}`,
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={onDragEnd}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable:
            'To reorder, press Space to pick up a scene, use the arrow keys to move it, then press Space to drop it or Escape to cancel.',
        },
      }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ol className="flex flex-col gap-2">
          {scenes.map((scene, index) => (
            <SceneCard
              key={scene.sceneId}
              scene={scene}
              index={index}
              count={scenes.length}
              playing={playingScene === scene.sceneId}
              desktop={desktop}
              timedByScript={timedByScript}
              online={online}
              lang={lang}
              duration={durationErrors[scene.sceneId]}
              onSeek={() => onSeek(scene)}
              onMove={(to) => moveFromMenu(index, to)}
              onText={(text) => onText(scene.sceneId, text)}
              onDuration={(seconds) => onDuration(scene.sceneId, seconds)}
              onTransition={(transitionIn) =>
                onTransition(scene.sceneId, transitionIn)
              }
              onClipSound={(sound) => onClipSound(scene.sceneId, sound)}
              onChangeMedia={() => onChangeMedia(scene)}
              onClipStart={(seconds) => onClipStart(scene, seconds)}
            />
          ))}
        </ol>
      </SortableContext>
      <p className="sr-only" aria-live="polite">
        {moved}
      </p>
    </DndContext>
  );
}

function SceneCard({
  scene,
  index,
  count,
  playing,
  desktop,
  timedByScript,
  online,
  lang,
  duration,
  onSeek,
  onMove,
  onText,
  onDuration,
  onTransition,
  onClipSound,
  onChangeMedia,
  onClipStart,
}: {
  scene: VideoEditScene;
  index: number;
  count: number;
  playing: boolean;
  desktop: boolean;
  timedByScript: boolean;
  online: boolean;
  lang: string;
  /** The typed duration, which may be out of range. */
  duration: number | undefined;
  onSeek: () => void;
  onMove: (to: number) => void;
  onText: (text: string) => void;
  onDuration: (seconds: number) => void;
  onTransition: (transitionIn: SceneTransition) => void;
  onClipSound: (sound: ClipSoundValue) => void;
  onChangeMedia: () => void;
  onClipStart: (seconds: number) => void;
}) {
  const {
    setNodeRef,
    transform,
    transition,
    isDragging,
    attributes,
    listeners,
  } = useSortable({
    id: scene.sceneId,
    disabled: !desktop,
  });
  const [clipOpen, setClipOpen] = useState(false);
  const openClipAfterMenu = useRef(false);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const purpose = SCENE_PURPOSE_LABEL[scene.purpose];
  const textId = useId();
  const typed = duration ?? scene.durationSeconds;
  const durationInvalid = !Number.isInteger(typed) || typed < 2 || typed > 15;
  const isClip = scene.media?.asset?.kind === AssetKind.Clip;
  const tooLong = scene.onScreenText.length > 60;
  const textDescribedBy =
    [
      tooLong ? `${textId}-error` : null,
      ...scene.flags.map((_, flagIndex) => `${textId}-flag-${flagIndex}`),
    ]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn('relative', isDragging && 'z-10')}
    >
      <Card
        className={cn(
          'grid grid-cols-[56px_minmax(0,1fr)_auto] gap-3 p-3',
          playing && 'shadow-[inset_3px_0_0_var(--ink)]',
          scene.flags.length && 'border-warning-border',
          isDragging && 'scale-102 shadow-e2',
        )}
      >
        <button
          type="button"
          onClick={onSeek}
          aria-label={`Show scene ${scene.order} in the preview`}
          className="aspect-9/16 w-14 overflow-hidden rounded-sm"
        >
          <MediaThumb
            asset={scene.media?.asset}
            textCard={
              scene.media?.kind === SceneMediaKind.TextCard
                ? scene.onScreenText
                : undefined
            }
            className="size-full"
            sizes="56px"
          />
        </button>

        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="t-mono flex size-6 items-center justify-center rounded-sm bg-ink text-white">
              {scene.order}
            </span>
            <span className="t-label">{purpose}</span>
            <span className="t-mono t-caption text-ink-2">
              {formatTimecode(scene.startSeconds)}–
              {formatTimecode(scene.startSeconds + scene.durationSeconds)}
            </span>
          </div>
          <label htmlFor={textId} className="sr-only">
            On-screen text for scene {scene.order}
          </label>
          <div className="relative">
            <Input
              id={textId}
              value={scene.onScreenText}
              maxLength={80}
              lang={lang}
              aria-invalid={tooLong || undefined}
              aria-describedby={textDescribedBy}
              onChange={(event) => onText(event.target.value)}
              className="h-11 pr-14 lg:h-9"
            />
            <span
              className={cn(
                't-mono t-caption absolute top-1/2 right-3 -translate-y-1/2',
                tooLong ? 'text-danger' : 'text-ink-3',
              )}
              aria-hidden="true"
            >
              {scene.onScreenText.length}/60
            </span>
          </div>
          {tooLong ? (
            <p id={`${textId}-error`} className="t-sm text-danger">
              Use 60 characters or fewer.
            </p>
          ) : null}
          {scene.flags.map((flag, flagIndex) => (
            <ClaimFlagCallout
              key={flag.category}
              id={`${textId}-flag-${flagIndex}`}
              lead={flag.lead}
              reason={flag.reason}
            />
          ))}
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
            {index === 0 ? (
              <span className="t-sm text-ink-2">Transition in</span>
            ) : (
              <label
                htmlFor={`${textId}-transition`}
                className="t-sm text-ink-2"
              >
                Transition in
              </label>
            )}
            {index === 0 ? (
              <p className="t-caption text-ink-3">Opens the video.</p>
            ) : (
              <Select
                value={scene.transitionIn}
                onValueChange={(value) =>
                  onTransition(value as SceneTransition)
                }
              >
                <SelectTrigger
                  id={`${textId}-transition`}
                  className="w-full sm:w-40"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectGroup>
                    {Object.values(SceneTransition).map((value) => (
                      <SelectItem key={value} value={value}>
                        {SCENE_TRANSITION_LABEL[value]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          </div>
          {isClip ? (
            desktop ? (
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                <label htmlFor={`${textId}-sound`} className="t-sm text-ink-2">
                  Clip sound
                </label>
                <div className="flex items-center gap-3">
                  <Switch
                    id={`${textId}-sound`}
                    checked={scene.clipSound.on}
                    onCheckedChange={(on) =>
                      onClipSound({ ...scene.clipSound, on })
                    }
                  />
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={scene.clipSound.levelPercent}
                    disabled={!scene.clipSound.on}
                    aria-label={`Clip sound level for scene ${scene.order}`}
                    aria-valuetext={`${scene.clipSound.levelPercent} percent`}
                    onChange={(event) =>
                      onClipSound({
                        ...scene.clipSound,
                        levelPercent: Number(event.target.value),
                      })
                    }
                    className="w-32 accent-ink disabled:opacity-60"
                  />
                  <span className="t-mono t-caption w-10 text-right text-ink-2">
                    {scene.clipSound.levelPercent}%
                  </span>
                </div>
              </div>
            ) : (
              <p className="t-caption text-ink-3">
                Clip sound:{' '}
                {scene.clipSound.on
                  ? `on · ${scene.clipSound.levelPercent}%`
                  : 'off'}
              </p>
            )
          ) : null}
          {timedByScript && desktop ? (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <label
                  htmlFor={`${textId}-duration`}
                  className="t-caption text-ink-3"
                >
                  Duration
                </label>
                <Input
                  id={`${textId}-duration`}
                  type="number"
                  min={2}
                  max={15}
                  step={1}
                  value={Number.isNaN(typed) ? '' : typed}
                  aria-invalid={durationInvalid || undefined}
                  aria-describedby={
                    durationInvalid ? `${textId}-duration-error` : undefined
                  }
                  onChange={(event) => onDuration(Number(event.target.value))}
                  className="h-8 w-14 font-mono"
                />
                <span className="t-caption text-ink-3">s</span>
              </div>
              {durationInvalid ? (
                <p id={`${textId}-duration-error`} className="t-sm text-danger">
                  Use 2 to 15 seconds.
                </p>
              ) : null}
            </div>
          ) : (
            <p className="t-caption text-ink-3">
              {scene.durationSeconds} s
              {timedByScript ? '' : ' · follows the voiceover'}
            </p>
          )}
        </div>

        <div className="flex items-start gap-1">
          {desktop ? (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Reorder scene ${scene.order}, ${purpose}`}
              className="cursor-grab touch-none active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              <GripVerticalIcon />
            </Button>
          ) : null}
          <Popover open={clipOpen} onOpenChange={setClipOpen}>
            <DropdownMenu>
              <PopoverAnchor asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    ref={menuTrigger}
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`More actions for scene ${scene.order}`}
                  >
                    <MoreHorizontalIcon />
                  </Button>
                </DropdownMenuTrigger>
              </PopoverAnchor>
              <DropdownMenuContent
                align="end"
                onCloseAutoFocus={(event) => {
                  // Opening the clip popover takes focus instead of the trigger.
                  if (!openClipAfterMenu.current) return;
                  event.preventDefault();
                  openClipAfterMenu.current = false;
                  setClipOpen(true);
                }}
              >
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    disabled={index === 0}
                    onSelect={() => onMove(index - 1)}
                  >
                    Move up
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={index === count - 1}
                    onSelect={() => onMove(index + 1)}
                  >
                    Move down
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={!online} onSelect={onChangeMedia}>
                    Change media
                  </DropdownMenuItem>
                  {isClip ? (
                    <DropdownMenuItem
                      disabled={!online}
                      onSelect={() => {
                        openClipAfterMenu.current = true;
                      }}
                    >
                      Adjust clip start…
                    </DropdownMenuItem>
                  ) : null}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            {isClip && scene.media?.asset ? (
              <PopoverContent
                align="end"
                className="w-auto"
                onCloseAutoFocus={(event) => {
                  event.preventDefault();
                  menuTrigger.current?.focus();
                }}
              >
                <ClipStart
                  sceneOrder={scene.order}
                  asset={scene.media.asset}
                  sceneSeconds={scene.durationSeconds}
                  withSound={
                    scene.clipSound.on && scene.clipSound.levelPercent > 0
                  }
                  value={scene.media.clipStartSeconds}
                  disabled={!online}
                  onChange={onClipStart}
                />
              </PopoverContent>
            ) : null}
          </Popover>
        </div>
      </Card>
    </li>
  );
}

function CaptionsSection({
  video,
  saved,
  sceneSound,
  desktop,
  online,
  lang,
  draft,
  onEnabled,
  onStyle,
  onLine,
  onReset,
}: {
  video: VideoEdit;
  saved: VideoEdit;
  /** Captions come from the spoken lines, timed by the script. */
  sceneSound: boolean;
  desktop: boolean;
  online: boolean;
  lang: string;
  draft: EditDraft;
  onEnabled: (enabled: boolean) => void;
  onStyle: (style: CaptionStyle) => void;
  onLine: (id: string, text: string) => void;
  onReset: () => void;
}) {
  const flagsById = new Map(
    saved.captions.lines.map((line) => [line.id, line.flags]),
  );

  return (
    <section aria-labelledby="captions-heading" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id="captions-heading" className="t-h3">
          Captions
        </h2>
        <label className="t-label flex items-center gap-3">
          Show captions
          <Switch
            checked={video.captions.enabled}
            onCheckedChange={onEnabled}
          />
        </label>
      </div>
      {desktop ? (
        <ChoiceGroup<CaptionStyle>
          label="Caption style"
          value={video.captions.style}
          onValueChange={onStyle}
          options={STYLE_OPTIONS}
        />
      ) : (
        <p className="t-sm text-ink-2">
          Style: {STYLE_LABEL[video.captions.style]}{' '}
          <span className="t-caption text-ink-3">Edit on a larger screen.</span>
        </p>
      )}
      {video.captions.editable ? (
        <p className="t-sm text-ink-3">
          Change wording or where a line breaks. Timing follows the{' '}
          {sceneSound ? 'script' : 'voice'}.
        </p>
      ) : null}
      <ul className="flex flex-col gap-2">
        {video.captions.lines.map((line) => {
          const error = video.captions.editable
            ? captionError(line.text)
            : null;
          const flags =
            draft.captions[line.id] !== undefined
              ? []
              : (flagsById.get(line.id) ?? []);
          const lineId = `caption-${line.id}`;
          const describedBy =
            [
              error ? `${lineId}-error` : null,
              ...flags.map((_, flagIndex) => `${lineId}-flag-${flagIndex}`),
            ]
              .filter(Boolean)
              .join(' ') || undefined;

          return (
            <li
              key={line.id}
              className="grid grid-cols-[88px_minmax(0,1fr)] gap-3"
            >
              <span className="t-mono t-caption pt-2 text-ink-2">
                {formatTimecode(line.startMs / 1000)}–
                {formatTimecode(line.endMs / 1000)}
              </span>
              <div className="flex flex-col gap-1">
                {video.captions.editable ? (
                  <Textarea
                    rows={2}
                    value={line.text}
                    lang={lang}
                    aria-label={`Caption ${formatTimecode(line.startMs / 1000)}`}
                    aria-invalid={Boolean(error) || undefined}
                    aria-describedby={describedBy}
                    onChange={(event) => onLine(line.id, event.target.value)}
                  />
                ) : (
                  <p className="t-sm whitespace-pre-line text-ink" lang={lang}>
                    {line.text}
                  </p>
                )}
                {error ? (
                  <p id={`${lineId}-error`} className="t-sm text-danger">
                    {error}
                  </p>
                ) : null}
                {flags.map((flag, flagIndex) => (
                  <ClaimFlagCallout
                    key={flag.category}
                    id={`${lineId}-flag-${flagIndex}`}
                    lead={flag.lead}
                    reason={flag.reason}
                  />
                ))}
              </div>
            </li>
          );
        })}
      </ul>
      {video.captions.editable ? (
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          disabled={!online}
          onClick={onReset}
        >
          {sceneSound
            ? 'Reset captions to the script'
            : 'Reset captions to the voiceover'}
        </Button>
      ) : null}
    </section>
  );
}

function MusicSection({
  video,
  desktop,
  online,
  onLevel,
  onStored,
}: {
  video: VideoEdit;
  desktop: boolean;
  online: boolean;
  onLevel: (level: number) => void;
  onStored: () => Promise<unknown>;
}) {
  const { project } = useWorkflow();
  const { musicRightsLabel } = studioOf(project.studio).edit;
  const [rights, setRights] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const browseRef = useRef<HTMLInputElement>(null);
  const rightsId = useId();
  const levelId = useId();
  const track = video.music.asset;
  const { state, upload, cancel, dismiss } = useAudioUpload(
    project.id,
    AssetPurpose.Music,
    onStored,
  );
  const remove = useRemoveAssetMutation({
    onSuccess: async () => {
      await onStored();
      toast.success(`Removed ${track?.fileName ?? 'music'}.`);
      setRemoveOpen(false);
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <section aria-labelledby="music-heading" className="flex flex-col gap-3">
      <h2 id="music-heading" className="t-h3">
        Music <span className="t-caption font-normal text-ink-3">Optional</span>
      </h2>
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
      {track && !state ? (
        <>
          <div className="flex items-center gap-3 rounded-md border border-border p-3">
            <MusicIcon
              aria-hidden="true"
              className="size-5 shrink-0 text-ink-2"
            />
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="t-label truncate">{track.fileName}</p>
              <p className="t-mono t-caption text-ink-3">
                {track.durationSeconds
                  ? formatTimecode(track.durationSeconds)
                  : formatFileSize(track.sizeBytes)}
              </p>
            </div>
            <SampleButton
              url={track.previewUrl ?? null}
              label={track.fileName}
            />
            <Button
              variant="ghost"
              size="sm"
              disabled={!online}
              onClick={() => setRemoveOpen(true)}
            >
              Remove
            </Button>
          </div>
          {desktop ? (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <label htmlFor={levelId} className="t-label shrink-0">
                  Music level
                </label>
                <input
                  id={levelId}
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={video.music.levelPercent}
                  aria-valuetext={`${video.music.levelPercent} percent`}
                  onChange={(event) => onLevel(Number(event.target.value))}
                  className="min-w-0 flex-1 accent-ink"
                />
                <span className="t-mono w-11 text-right">
                  {video.music.levelPercent}%
                </span>
              </div>
              <p className="t-sm text-ink-3">
                Keep it low so the voice stays clear. Most creators use 15 to
                25%. The track loops if it’s shorter than the video and fades
                out over the last second.
              </p>
            </div>
          ) : (
            <p className="t-sm text-ink-2">
              Level {video.music.levelPercent}%{' '}
              <span className="t-caption text-ink-3">
                Edit on a larger screen.
              </span>
            </p>
          )}
        </>
      ) : (
        <>
          <div className="flex items-start gap-3">
            <Checkbox
              id={rightsId}
              checked={rights}
              onCheckedChange={(checked) => setRights(checked === true)}
              className="mt-0.5"
            />
            <label htmlFor={rightsId} className="flex flex-col">
              <span className="t-label text-ink">{musicRightsLabel}</span>
              <span className="t-sm text-ink-2">
                Only upload music you own or have licensed. Platforms can mute
                videos with unlicensed music.
              </span>
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              disabled={!rights || !online || state?.status === 'uploading'}
              onClick={() => {
                if (!rights || !online || state?.status === 'uploading') return;
                browseRef.current?.click();
              }}
            >
              {rights ? (
                <UploadIcon data-icon="inline-start" />
              ) : (
                <LockIcon data-icon="inline-start" />
              )}
              Upload a track
            </Button>
            <span className="t-caption text-ink-3">
              MP3, M4A or WAV up to 20 MB
            </span>
          </div>
          {state ? (
            <div
              className={cn(
                'flex items-center gap-3 rounded-md border p-3',
                state.status === 'failed'
                  ? 'border-danger-border bg-danger-soft'
                  : 'border-border',
              )}
            >
              <MusicIcon
                aria-hidden="true"
                className="size-5 shrink-0 text-ink-3"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="t-caption truncate font-medium">
                  {state.fileName}
                </p>
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
      )}

      <Dialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {track?.fileName ?? 'music'}?</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <DialogDescription>
              The video will have no music. This can’t be undone.
            </DialogDescription>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setRemoveOpen(false)}>
              Keep music
            </Button>
            <Button
              variant="destructive"
              disabled={!online || remove.isPending}
              aria-busy={remove.isPending || undefined}
              onClick={() => {
                if (!online || !track || remove.isPending) return;
                remove.mutate({ id: track.id });
              }}
            >
              {remove.isPending ? <Spinner /> : null}
              {remove.isPending ? 'Removing…' : 'Remove music'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
