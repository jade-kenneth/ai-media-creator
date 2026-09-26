'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowRightIcon,
  CheckIcon,
  CircleCheckIcon,
  ClockIcon,
  InfoIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  Alert,
  AlertAction,
  AlertContent,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { StepPage } from '@/features/project-workflow/step-page';
import { useAutosave } from '@/features/project-workflow/use-autosave';
import { useWorkflow } from '@/features/project-workflow/workflow-state';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { cn } from '@/lib/utils';
import {
  LANGUAGE_LABEL,
  PLATFORM_LABEL,
  STEP_LABEL,
  STEP_PATH,
  TONE_LABEL,
  VERSION_STATUS_BADGE,
} from '@/lib/studio/labels';
import { GENRE_LABEL, STORYTELLING_LABEL, studioOf } from '@/lib/studios';
import {
  projectsQueryKeys,
  type ProjectDetail,
} from '@/react-query/projects/projects-operations';
import {
  ContentStyle,
  GenerationJobStatus,
  GenerationJobType,
  ProjectStepKey,
  ScriptCopyReason,
  ScriptVersionStatus,
  type ScriptVersionsQuery,
  type UpdateScriptVersionInput,
} from '@/react-query/generated__types';
import {
  isJobActive,
  type GenerationJobRecord,
} from '@/react-query/generation-jobs/generation-jobs-operations';
import {
  scriptsQueryKeys,
  useApproveScriptVersionMutation,
  useCopyScriptVersionMutation,
  useRewriteHookMutation,
  useRewriteSceneMutation,
  useUpdateScriptVersionMutation,
  type ClaimFlag,
  type ScriptVersion,
} from '@/react-query/scripts/scripts-operations';
import { formatLongDate, formatTimecode } from '@/utils/date';

import { AddFactDialog } from '@/features/fact-review/add-fact-dialog';
import { useIdempotencyKey } from '@/features/project-workflow/use-project-jobs';

import { ApproveDialog } from './approve-dialog';
import { HistoryDrawer } from './history-drawer';
import { HookRail } from './hook-rail';
import { hookScene, withHook } from './hook-scene';
import { SceneBlock } from './scene-block';
import {
  fitSceneSeconds,
  linePauses,
  minSceneSeconds,
  spokenSeconds,
  spokenText,
} from './spoken-length';

type Patch = Omit<UpdateScriptVersionInput, 'id'>;
type HookValues = Pick<
  ScriptVersion['hooks'][number],
  'id' | 'type' | 'text' | 'openingShot'
>;
type SceneValues = Omit<ScriptVersion['scenes'][number], 'flags'>;

function toHooks(version: ScriptVersion): HookValues[] {
  return version.hooks.map(({ id, type, text, openingShot }) => ({
    id,
    type,
    text,
    openingShot,
  }));
}

/**
 * Shorter than what's said in it takes to say (after every reaction's pause
 * in a skit), or outside 2 to 15 seconds.
 */
function durationInvalid(
  scene: Pick<SceneValues, 'durationSeconds' | 'narration' | 'lines'>,
) {
  return (
    scene.durationSeconds <
      minSceneSeconds(spokenText(scene), linePauses(scene)) ||
    scene.durationSeconds > 15
  );
}

function toScenes(version: ScriptVersion): SceneValues[] {
  return version.scenes.map(({ flags, ...scene }) => {
    void flags;
    return scene;
  });
}

/**
 * Script Studio editor for one version (Design Reference §5.8). Only the
 * newest draft is editable; approved and older versions are read-only.
 */
export function ScriptEditor({
  version,
  versions,
  jobs,
  track,
  pendingItemIds,
  mergeRequest,
}: {
  version: ScriptVersion;
  versions: ScriptVersion[];
  jobs: GenerationJobRecord[];
  track: (job: GenerationJobRecord) => void;
  /** Items a finished rewrite changed that aren't merged yet; never autosaved. */
  pendingItemIds: string[];
  /** Asks to bring rewritten items in from the (now fresh) server copy. */
  mergeRequest: { ids: string[]; token: number } | null;
}) {
  const { project, navigate, saveStatus } = useWorkflow();
  const router = useRouter();
  const queryClient = useQueryClient();
  const online = useOnlineStatus();
  const studio = studioOf(project.studio);
  // The script is written from the studio's last intake step (Strategy, Story).
  const intake = studio.intakeSteps.at(-1) ?? ProjectStepKey.Strategy;
  const intakeHref = `/projects/${project.id}/${STEP_PATH[intake]}`;
  // A studio without claims (a story) has no flags, fact chips or Claim check.
  const claims = studio.claimCheck;
  const newest = versions[0];
  const editable =
    version.id === newest?.id && version.status === ScriptVersionStatus.Draft;
  // A skit has spoken lines and live sound; older versions read as narrated.
  const skit = version.contentStyle === ContentStyle.Skit;
  const [hooks, setHooks] = useState(() => toHooks(version));
  const [scenes, setScenes] = useState(() => toScenes(version));
  const [caption, setCaption] = useState(version.caption);
  const [shoot, setShoot] = useState(() => ({
    scenario: version.shoot?.scenario ?? '',
    presenter: version.shoot?.presenter ?? '',
  }));
  const [selectedHookId, setSelectedHookId] = useState(
    version.selectedHookId ?? null,
  );
  const [historyOpen, setHistoryOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [addFactClaim, setAddFactClaim] = useState<string | null>(null);
  const rewriteKey = useIdempotencyKey();
  const versionsKey = scriptsQueryKeys.versions(project.id);

  const activeRewrites = jobs.filter(
    (job) =>
      isJobActive(job) &&
      job.versionId === version.id &&
      (job.type === GenerationJobType.RewriteHook ||
        job.type === GenerationJobType.RewriteScene),
  );
  const busy = new Set(
    activeRewrites.flatMap((job) => [job.hookId, job.sceneId]).filter(Boolean),
  );
  const failedItem = (itemId: string) => {
    const job = jobs.find(
      (candidate) =>
        candidate.versionId === version.id &&
        (candidate.hookId === itemId || candidate.sceneId === itemId),
    );
    return job?.status === GenerationJobStatus.Failed ? job : null;
  };

  // A rewrite replaced an item on the server: bring just that item in.
  const [mergedToken, setMergedToken] = useState(mergeRequest?.token ?? 0);
  if (mergeRequest && mergeRequest.token !== mergedToken) {
    const ids = new Set(mergeRequest.ids);
    // A rewritten chosen hook also rewrote scene 1 on the server.
    const opening = hookScene(version.scenes);
    if (selectedHookId && ids.has(selectedHookId) && opening) {
      ids.add(opening.id);
    }
    setMergedToken(mergeRequest.token);
    setHooks((current) =>
      current.map((hook) => {
        const fresh = version.hooks.find((item) => item.id === hook.id);
        return ids.has(hook.id) && fresh
          ? {
              id: fresh.id,
              type: fresh.type,
              text: fresh.text,
              openingShot: fresh.openingShot,
            }
          : hook;
      }),
    );
    setScenes((current) =>
      current.map((scene) => {
        const fresh = version.scenes.find((item) => item.id === scene.id);
        if (!ids.has(scene.id) || !fresh) return scene;
        const { flags, ...values } = fresh;
        void flags;
        return values;
      }),
    );
  }

  const setVersion = (next: ScriptVersion) =>
    queryClient.setQueryData<ScriptVersionsQuery>(versionsKey, (current) =>
      current
        ? {
            scriptVersions: [
              ...current.scriptVersions.map((item) =>
                item.id === next.id ? next : item,
              ),
              ...(current.scriptVersions.some((item) => item.id === next.id)
                ? []
                : [next]),
            ].sort((a, b) => b.number - a.number),
          }
        : current,
    );

  const update = useUpdateScriptVersionMutation();
  const autosave = useAutosave<Patch>({
    source: 'script',
    enabled: editable,
    save: async (patch) => {
      const data = await update.mutateAsync({
        input: { id: version.id, ...patch },
      });
      setVersion(data.updateScriptVersion);
    },
  });

  const skip = (id: string) => busy.has(id) || pendingItemIds.includes(id);

  const saveHooks = (next: HookValues[]) =>
    autosave.schedule({
      hooks: next
        .filter((hook) => !skip(hook.id))
        .map(({ id, text, openingShot }) => ({ id, text, openingShot })),
    });
  const saveScenes = (next: SceneValues[]) =>
    autosave.schedule({
      scenes: next
        .filter((scene) => !skip(scene.id) && !durationInvalid(scene))
        .map(
          ({
            id,
            durationSeconds,
            narration,
            lines,
            sound,
            onScreenText,
            visual,
            direction,
            transitionIn,
            cta,
          }) => ({
            id,
            durationSeconds,
            narration,
            // A skit's lines replace the list; a blank row isn't kept.
            ...(skit
              ? {
                  lines: lines.map(
                    ({
                      speaker,
                      text,
                      shot,
                      reaction,
                      pauseSeconds,
                      delivery,
                    }) => ({
                      speaker,
                      text,
                      shot,
                      reaction,
                      pauseSeconds,
                      delivery,
                    }),
                  ),
                  sound: sound ?? '',
                }
              : {}),
            onScreenText,
            visual,
            direction: direction ?? undefined,
            transitionIn: transitionIn ?? undefined,
            cta,
          }),
        ),
    });
  /**
   * Scene 1 opens with the chosen hook, as the API does: picking or editing
   * the chosen hook puts it there, and the scene autosave carries it. A
   * scene 1 being rewritten is left alone; its rewrite keeps the hook.
   */
  const openScenesWith = (
    hook: HookValues | undefined,
    parts: { words: boolean; visual: boolean },
  ) => {
    const opening = hookScene(scenes);
    if (!opening || skip(opening.id)) return;
    const next = withHook(scenes, hook, skit, parts);
    if (next === scenes) return;
    setScenes(next);
    saveScenes(next);
  };
  const saveShoot = (patch: Partial<typeof shoot>) => {
    const next = { ...shoot, ...patch };
    setShoot(next);
    autosave.schedule({ shoot: next });
  };
  // A skit's presenter names its cast (§3.22), and so does every story's (§3.23).
  const castShoot = skit || studio.castShoot;
  // Versions written before shot direction existed show no shoot plan when read-only.
  const directed =
    Boolean(version.shoot) || version.scenes.some((scene) => scene.direction);

  const rewriteHook = useRewriteHookMutation({
    onSuccess: ({ rewriteHook: job }) => track(job),
    onError: (error) => toast.error(error.message),
    onSettled: () => rewriteKey.rotate(),
  });
  const rewriteScene = useRewriteSceneMutation({
    onSuccess: ({ rewriteScene: job }) => track(job),
    onError: (error) => toast.error(error.message),
    onSettled: () => rewriteKey.rotate(),
  });

  const approve = useApproveScriptVersionMutation({
    onSuccess: ({ approveScriptVersion }) => {
      setVersion(approveScriptVersion);
      void queryClient.invalidateQueries({
        queryKey: projectsQueryKeys.detail(project.id),
      });
      void queryClient.invalidateQueries({
        queryKey: scriptsQueryKeys.brief(project.id),
      });
      toast.success(`v${approveScriptVersion.number} approved.`);
      setApproveOpen(false);
    },
    onError: (error) => {
      toast.error(error.message);
      setApproveOpen(false);
    },
  });

  const copy = useCopyScriptVersionMutation({
    onSuccess: ({ copyScriptVersion }, variables) => {
      setVersion(copyScriptVersion);
      void queryClient.invalidateQueries({
        queryKey: projectsQueryKeys.detail(project.id),
      });
      setHistoryOpen(false);
      toast.success(
        variables?.input.reason === ScriptCopyReason.Restore
          ? `v${copyScriptVersion.origin.fromNumber} restored as v${copyScriptVersion.number}. Nothing was overwritten.`
          : `v${copyScriptVersion.number} is a new draft.`,
      );
      router.replace(`/projects/${project.id}/script`);
    },
    onError: (error) => toast.error(error.message),
  });

  // Flags come from the server copy, which is re-checked on every save.
  const flagsOf = (flags: ClaimFlag[]) => (claims ? flags : []);
  const selectedHookFlags = selectedHookId
    ? flagsOf(
        version.hooks.find((hook) => hook.id === selectedHookId)?.flags ?? [],
      )
    : [];
  const sceneFlags = new Map(
    version.scenes.map((scene) => [scene.id, flagsOf(scene.flags)]),
  );
  const hookFlags = new Map(
    version.hooks.map((hook) => [hook.id, flagsOf(hook.flags)]),
  );
  const flaggedScenes = version.scenes
    .map((scene, index) => ({ index, flags: flagsOf(scene.flags) }))
    .filter((item) => item.flags.length > 0);
  const captionFlags = flagsOf(version.captionFlags);
  const flagCount =
    selectedHookFlags.length +
    flaggedScenes.reduce((sum, item) => sum + item.flags.length, 0) +
    captionFlags.length;

  const spoken = useMemo(
    () => spokenSeconds(scenes.map((scene) => spokenText(scene))),
    [scenes],
  );
  const target = version.lengthSeconds;
  const overLength = spoken > target + 2;
  const facts = new Map(
    project.approvedFacts.map((fact) => [fact.id, fact.text]),
  );
  const status = VERSION_STATUS_BADGE[version.status];
  const approved = version.status === ScriptVersionStatus.Approved;
  // The video beta adds Media after an approved script (Design Reference §5B).
  const hasMediaStep = project.steps.some(
    (step) => step.key === ProjectStepKey.Media,
  );
  const needsReview = version.status === ScriptVersionStatus.NeedsReview;
  const unsaved = saveStatus === 'saving' || saveStatus === 'failed';

  const approveReason = (() => {
    if (approved) return null;
    if (!selectedHookId) return 'Pick a hook first';
    if (activeRewrites.length > 0) return 'Wait for the rewrite to finish';
    if (unsaved) return 'Wait for your edits to save';
    if (flagCount > 0) {
      return flagCount === 1
        ? 'Fix 1 flagged line first'
        : `Fix ${flagCount} flagged lines first`;
    }
    return null;
  })();

  const startRewrite = (target: { hookId?: string; sceneId?: string }) => {
    if (rewriteHook.isPending || rewriteScene.isPending) return;
    autosave.flush();
    const idempotencyKey = rewriteKey.current();
    if (target.hookId) {
      rewriteHook.mutate({
        input: { versionId: version.id, hookId: target.hookId, idempotencyKey },
      });
    } else if (target.sceneId) {
      rewriteScene.mutate({
        input: {
          versionId: version.id,
          sceneId: target.sceneId,
          idempotencyKey,
        },
      });
    }
  };

  const jumpTo = (index: number) => {
    const scene = document.getElementById(`scene-${index + 1}`);
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    scene?.scrollIntoView({
      behavior: reduced ? 'instant' : 'smooth',
      block: 'center',
    });
    scene
      ?.querySelector<HTMLElement>('textarea, p')
      ?.focus({ preventScroll: true });
  };

  const selectedHook = hooks.find((hook) => hook.id === selectedHookId);
  const nextNumber = (newest?.number ?? version.number) + 1;
  const starts = scenes.reduce<number[]>(
    (acc, scene, index) => [
      ...acc,
      index === 0 ? 0 : acc[index - 1] + scenes[index - 1].durationSeconds,
    ],
    [],
  );
  const totalSeconds = scenes.reduce(
    (sum, scene) => sum + scene.durationSeconds,
    0,
  );

  const asideCards = (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Spoken length</CardTitle>
        </CardHeader>
        <CardContent className="gap-2">
          <p
            className={cn(
              'font-mono text-title font-semibold',
              overLength ? 'text-warning' : 'text-ink',
            )}
          >
            ≈{spoken} s of {target} s
          </p>
          <div
            className="relative h-1.5 rounded-full bg-surface-sunken"
            aria-hidden="true"
          >
            <div
              className={cn(
                'h-full origin-left rounded-full',
                overLength ? 'bg-warning' : 'bg-ink',
              )}
              style={{
                transform: `scaleX(${Math.min(1, spoken / (target * 1.5))})`,
              }}
            />
            <span
              className="absolute -top-1 h-3.5 w-0.5 bg-ink-2"
              style={{ left: `${(1 / 1.5) * 100}%` }}
            />
          </div>
          <p className="t-caption text-ink-3">
            Estimated at about 2.5 words per second.
          </p>
        </CardContent>
      </Card>
      {claims ? (
        <Card>
          <CardHeader>
            <CardTitle>Claim check</CardTitle>
          </CardHeader>
          <CardContent className="gap-2">
            {flagCount > 0 ? (
              <>
                <p className="t-label text-warning">
                  {flagCount === 1
                    ? '1 line needs attention'
                    : `${flagCount} lines need attention`}
                </p>
                <ul className="flex flex-col gap-1">
                  {flaggedScenes.map((item) =>
                    item.flags.map((flag: ClaimFlag) => (
                      <li
                        key={`${item.index}-${flag.category}-${flag.claim}`}
                        className="flex items-center justify-between gap-2"
                      >
                        <span className="t-sm">
                          Scene {item.index + 1} ·{' '}
                          {flag.lead.replace(/\.$/, '')}
                        </span>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => jumpTo(item.index)}
                        >
                          Go to scene {item.index + 1}
                        </Button>
                      </li>
                    )),
                  )}
                  {selectedHookFlags.length > 0 ? (
                    <li className="t-sm">
                      Picked hook ·{' '}
                      {selectedHookFlags[0].lead.replace(/\.$/, '')}
                    </li>
                  ) : null}
                  {captionFlags.length > 0 ? (
                    <li className="t-sm">
                      Caption · {captionFlags[0].lead.replace(/\.$/, '')}
                    </li>
                  ) : null}
                </ul>
              </>
            ) : (
              <p className="t-sm flex items-center gap-2">
                <CheckIcon aria-hidden="true" className="size-4 text-success" />
                No flagged lines.
              </p>
            )}
            <p className="t-caption text-ink-3">
              These checks are prompts, not a compliance review.
            </p>
          </CardContent>
        </Card>
      ) : null}
      {project.story ? (
        <StoryCard
          story={project.story}
          language={version.language}
          lengthSeconds={version.lengthSeconds}
          onChange={() => navigate(intakeHref)}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Direction</CardTitle>
          </CardHeader>
          <CardContent className="gap-1">
            {version.angleTitle ? (
              <p className="t-label">{version.angleTitle}</p>
            ) : null}
            {project.strategy.buyer ? (
              <p className="t-sm text-ink-2">{project.strategy.buyer}</p>
            ) : null}
            <p className="t-sm text-ink-2">
              {PLATFORM_LABEL[project.strategy.platform]} ·{' '}
              {LANGUAGE_LABEL[version.language]} · {version.lengthSeconds} s ·{' '}
              {TONE_LABEL[project.strategy.tone]}
              {skit ? ' · Skit' : null}
            </p>
            <div className="mt-2 flex flex-wrap gap-x-4">
              <Button
                variant="link"
                onClick={() => navigate(`/projects/${project.id}/strategy`)}
              >
                Change strategy
              </Button>
              <Button
                variant="link"
                onClick={() => navigate(`/projects/${project.id}/facts`)}
              >
                Edit facts
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );

  return (
    <StepPage
      step={ProjectStepKey.Script}
      title="Script"
      subtitle="Pick a hook, then shape each scene. Nothing is final until you approve a version."
      autosave={editable}
      asideWidth="300"
      headExtra={
        <>
          <Badge variant={status.tone}>
            v{version.number} · {status.label}
          </Badge>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setHistoryOpen(true)}
          >
            <ClockIcon data-icon="inline-start" />
            History
          </Button>
        </>
      }
      banners={
        <>
          {approved ? (
            <Alert variant="success">
              <CircleCheckIcon />
              <AlertContent>
                <AlertTitle>v{version.number} is approved.</AlertTitle>{' '}
                <AlertDescription>
                  Your creator brief is ready. Edits create a new version.
                </AlertDescription>
              </AlertContent>
              <AlertAction>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!online || copy.isPending}
                  onClick={() => {
                    if (!copy.isPending)
                      copy.mutate({
                        input: {
                          id: version.id,
                          reason: ScriptCopyReason.Edit,
                        },
                      });
                  }}
                >
                  {copy.isPending ? <Spinner /> : null}
                  Edit as v{nextNumber}
                </Button>
              </AlertAction>
            </Alert>
          ) : needsReview ? (
            <Alert variant="warning">
              <TriangleAlertIcon />
              <AlertContent>
                <AlertTitle>A fact this script uses changed.</AlertTitle>{' '}
                <AlertDescription>
                  Check the scenes that use it, then approve again.
                </AlertDescription>
              </AlertContent>
            </Alert>
          ) : !editable ? (
            <Alert variant="info">
              <InfoIcon />
              <AlertContent>
                <AlertTitle>You’re viewing v{version.number}.</AlertTitle>{' '}
                <AlertDescription>
                  It’s read-only. Restore it from History to edit it.
                </AlertDescription>
              </AlertContent>
            </Alert>
          ) : null}
          {overLength ? (
            <Alert variant="warning">
              <TriangleAlertIcon />
              <AlertContent>
                <AlertTitle>
                  This script runs about {spoken} s, over your {target} s
                  target.
                </AlertTitle>{' '}
                <AlertDescription>
                  Shorten a scene or change the length.
                </AlertDescription>
              </AlertContent>
              <AlertAction>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigate(intakeHref)}
                >
                  Change length
                </Button>
              </AlertAction>
            </Alert>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2 aside:hidden">
            {asideCards}
          </div>
        </>
      }
      aside={asideCards}
      footer={{
        back: { label: STEP_LABEL[intake], href: intakeHref },
        reason: approved ? null : approveReason,
        actions: approved ? (
          hasMediaStep ? (
            <>
              <Button
                variant="secondary"
                onClick={() => navigate(`/projects/${project.id}/brief`)}
              >
                Open creator brief
              </Button>
              <Button onClick={() => navigate(`/projects/${project.id}/media`)}>
                Continue to media
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
            </>
          ) : (
            <Button onClick={() => navigate(`/projects/${project.id}/brief`)}>
              Open creator brief
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          )
        ) : (
          <Button
            disabled={
              !online || Boolean(approveReason) || (!editable && !needsReview)
            }
            onClick={() => setApproveOpen(true)}
          >
            {needsReview
              ? `Approve v${version.number} again`
              : `Approve v${version.number}`}
          </Button>
        ),
      }}
    >
      <section aria-labelledby="hooks-heading" className="flex flex-col gap-3">
        <div>
          <h2 id="hooks-heading" tabIndex={-1} className="t-h3 outline-none">
            Opening hook
          </h2>
          <p className="t-sm text-ink-2">
            Pick one. Rewriting one leaves the others as they are.
          </p>
        </div>
        <HookRail
          hooks={hooks}
          flags={hookFlags}
          selectedId={selectedHookId}
          readOnly={!editable}
          disabled={!online}
          itemState={(hookId) => ({
            rewriting: busy.has(hookId),
            failed: Boolean(failedItem(hookId)),
          })}
          onSelect={(hookId) => {
            if (hookId === selectedHookId) return;
            setSelectedHookId(hookId);
            openScenesWith(
              hooks.find((hook) => hook.id === hookId),
              {
                words: true,
                visual: true,
              },
            );
            autosave.schedule({ selectedHookId: hookId });
          }}
          onEdit={(hookId, patch) => {
            const next = hooks.map((hook) =>
              hook.id === hookId ? { ...hook, ...patch } : hook,
            );
            setHooks(next);
            saveHooks(next);
            if (hookId === selectedHookId) {
              openScenesWith(
                next.find((hook) => hook.id === hookId),
                {
                  words: patch.text !== undefined,
                  visual: patch.openingShot !== undefined,
                },
              );
            }
          }}
          onRewrite={(hookId) => startRewrite({ hookId })}
        />
      </section>

      {editable || directed ? (
        <Card>
          <CardHeader>
            <CardTitle>Shoot plan</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="script-scenario" className="t-label">
                Scenario
              </label>
              {editable ? (
                <Textarea
                  id="script-scenario"
                  rows={2}
                  maxLength={300}
                  placeholder="The situation the whole video plays out"
                  value={shoot.scenario}
                  disabled={!online}
                  onChange={(event) =>
                    saveShoot({ scenario: event.target.value })
                  }
                  className="min-h-16"
                />
              ) : (
                <p id="script-scenario" className="t-body">
                  {shoot.scenario || '—'}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="script-presenter" className="t-label">
                {castShoot ? 'Cast' : 'On camera'}
              </label>
              {editable ? (
                <Input
                  id="script-presenter"
                  maxLength={160}
                  placeholder={
                    castShoot
                      ? 'Ana, 20s, yellow shirt; Ben, her brother'
                      : 'Nobody. Hands and product only.'
                  }
                  value={shoot.presenter}
                  disabled={!online}
                  onChange={(event) =>
                    saveShoot({ presenter: event.target.value })
                  }
                />
              ) : (
                <p id="script-presenter" className="t-body">
                  {shoot.presenter ||
                    (castShoot
                      ? 'Not named yet.'
                      : 'Nobody. Hands and product only.')}
                </p>
              )}
              <span className="t-caption text-ink-3">
                {castShoot
                  ? studio.castHint
                  : 'Who appears, and what they wear.'}
              </span>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <section aria-labelledby="scenes-heading" className="flex flex-col gap-3">
        <h2 id="scenes-heading" className="t-h3">
          Script · {scenes.length} scenes{' '}
          <span className="t-mono ml-2 font-medium text-ink-2">
            {formatTimecode(totalSeconds)} total
          </span>
        </h2>
        <ol className="flex flex-col gap-3">
          {scenes.map((scene, index) => {
            const start = starts[index] ?? 0;

            return (
              <SceneBlock
                key={scene.id}
                scene={scene}
                index={index}
                start={start}
                flags={sceneFlags.get(scene.id) ?? []}
                facts={facts}
                language={version.language}
                skit={skit}
                claims={claims}
                shotSubjectLabel={studio.shotSubjectLabel}
                readOnly={!editable}
                disabled={!online}
                rewriting={busy.has(scene.id)}
                rewriteFailed={Boolean(failedItem(scene.id))}
                minSeconds={minSceneSeconds(
                  spokenText(scene),
                  linePauses(scene),
                )}
                opensWithHook={
                  editable &&
                  Boolean(selectedHookId) &&
                  hookScene(scenes)?.id === scene.id
                }
                closingNote={
                  editable && index === scenes.length - 1
                    ? studio.lastSceneNote
                    : null
                }
                durationError={editable && durationInvalid(scene)}
                onChange={(patch) => {
                  const next = scenes.map((item) =>
                    item.id !== scene.id
                      ? item
                      : patch.narration === undefined &&
                          patch.lines === undefined
                        ? { ...item, ...patch }
                        : {
                            ...item,
                            ...patch,
                            // The scene grows to fit what's said in it, and
                            // every reaction's pause before a line.
                            durationSeconds: fitSceneSeconds(
                              item.durationSeconds,
                              spokenText({ ...item, ...patch }),
                              linePauses({ ...item, ...patch }),
                            ),
                          },
                  );
                  setScenes(next);
                  saveScenes(next);
                }}
                onTransition={(transitionIn) => {
                  // Save through saveScenes: autosave merges patches shallowly,
                  // so a one-scene `scenes` patch would drop pending edits.
                  const next = scenes.map((item) =>
                    item.id === scene.id ? { ...item, transitionIn } : item,
                  );
                  setScenes(next);
                  saveScenes(next);
                }}
                onRewrite={() => startRewrite({ sceneId: scene.id })}
                onAddFact={(claim) => setAddFactClaim(claim)}
              />
            );
          })}
        </ol>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>
            <label htmlFor="script-caption">Caption</label>
          </CardTitle>
        </CardHeader>
        <CardContent className="gap-1.5">
          {editable ? (
            <Textarea
              id="script-caption"
              rows={3}
              value={caption}
              disabled={!online}
              onChange={(event) => {
                setCaption(event.target.value);
                if (event.target.value.length <= 300)
                  autosave.schedule({ caption: event.target.value });
              }}
              aria-invalid={caption.length > 300}
            />
          ) : (
            <p id="script-caption" className="t-body">
              {caption}
            </p>
          )}
          <span
            className={cn(
              't-mono self-end text-caption',
              caption.length > 300 ? 'text-danger' : 'text-ink-3',
            )}
          >
            {caption.length} / 300
          </span>
        </CardContent>
      </Card>

      {version.approvedAt ? (
        <p className="t-caption text-ink-3">
          Approved {formatLongDate(version.approvedAt)}
        </p>
      ) : null}

      <HistoryDrawer
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        versions={versions}
        viewingId={version.id}
        nextNumber={nextNumber}
        restoringId={copy.isPending ? (copy.variables?.input.id ?? null) : null}
        disabled={!online}
        onView={(item) => {
          setHistoryOpen(false);
          router.replace(
            item.id === newest?.id
              ? `/projects/${project.id}/script`
              : `/projects/${project.id}/script?version=${item.number}`,
          );
        }}
        onRestore={(item) => {
          if (!copy.isPending)
            copy.mutate({
              input: { id: item.id, reason: ScriptCopyReason.Restore },
            });
        }}
      />

      <ApproveDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        number={version.number}
        hookText={selectedHook?.text ?? ''}
        sceneCount={scenes.length}
        spokenSeconds={spoken}
        targetSeconds={target}
        claims={claims}
        approving={approve.isPending}
        onApprove={() => {
          if (!approve.isPending) approve.mutate({ id: version.id });
        }}
      />

      <AddFactDialog
        projectId={project.id}
        open={addFactClaim !== null}
        onOpenChange={(open) => {
          if (!open) setAddFactClaim(null);
        }}
        prefill={addFactClaim ?? undefined}
      />
    </StepPage>
  );
}

/**
 * The story a version is written from (§3.23, in place of Direction): the
 * premise, the format line and **Change story** (`script-studio.go-story`).
 */
function StoryCard({
  story,
  language,
  lengthSeconds,
  onChange,
}: {
  story: NonNullable<ProjectDetail['story']>;
  /** The version's own language and length, as Direction shows them. */
  language: ScriptVersion['language'];
  lengthSeconds: number;
  onChange: () => void;
}) {
  const format = [
    story.genre ? GENRE_LABEL[story.genre] : null,
    STORYTELLING_LABEL[story.storytelling],
    LANGUAGE_LABEL[language],
    `${lengthSeconds} s`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Story</CardTitle>
      </CardHeader>
      <CardContent className="gap-1">
        {story.premise?.title ? (
          <p className="t-label">{story.premise.title}</p>
        ) : null}
        {story.premise?.logline ? (
          <p className="t-sm line-clamp-3 text-ink-2">
            {story.premise.logline}
          </p>
        ) : null}
        <p className="t-sm text-ink-2">{format}</p>
        <div className="mt-2 flex flex-wrap gap-x-4">
          <Button variant="link" onClick={onChange}>
            Change story
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
