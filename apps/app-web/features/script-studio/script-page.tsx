'use client';

import { useQueryClient } from '@tanstack/react-query';
import { CircleAlertIcon } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  Alert,
  AlertAction,
  AlertContent,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { JobPanel } from '@/components/studio/job-panel';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useOfflineDetail } from '@/features/app-shell/offline-banner';
import { StepPage } from '@/features/project-workflow/step-page';
import { useProjectJobs } from '@/features/project-workflow/use-project-jobs';
import { useWorkflow } from '@/features/project-workflow/workflow-state';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { CREDIT_COST, STEP_LABEL, STEP_PATH } from '@/lib/studio/labels';
import { studioOf } from '@/lib/studios';
import {
  isJobActive,
  useRetryGenerationJobMutation,
  type GenerationJobRecord,
} from '@/react-query/generation-jobs/generation-jobs-operations';
import {
  GenerationJobStatus,
  GenerationJobType,
  ProjectStepKey,
} from '@/react-query/generated__types';
import { projectsQueryKeys } from '@/react-query/projects/projects-operations';
import {
  scriptsQueryKeys,
  useScriptVersionsQuery,
} from '@/react-query/scripts/scripts-operations';

import { ScriptEditor } from './script-editor';

/** Script (Design Reference §5.8). */
export function ScriptPage() {
  const { project, navigate } = useWorkflow();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const online = useOnlineStatus();
  const [pendingItemIds, setPendingItemIds] = useState<string[]>([]);
  const [mergeRequest, setMergeRequest] = useState<{ ids: string[]; token: number } | null>(null);
  const versionsQuery = useScriptVersionsQuery({ projectId: project.id });
  const versions = useMemo(() => versionsQuery.data?.scriptVersions ?? [], [versionsQuery.data]);
  const studio = studioOf(project.studio);
  // The script is written from the studio's last intake step (Strategy, Story).
  const intake = studio.intakeSteps.at(-1) ?? ProjectStepKey.Strategy;
  const intakeLabel = STEP_LABEL[intake];
  const intakeHref = `/projects/${project.id}/${STEP_PATH[intake]}`;

  useOfflineDetail('Edits and rewrites will be possible when you reconnect.');

  const onFinished = useCallback(
    (job: GenerationJobRecord) => {
      const completed = job.status === GenerationJobStatus.Completed;

      if (job.type === GenerationJobType.WriteScript) {
        void queryClient
          .invalidateQueries({ queryKey: scriptsQueryKeys.versions(project.id) })
          .then(() => {
            if (!completed) return;
            const newest = queryClient
              .getQueryData<{ scriptVersions: Array<{ number: number }> }>(
                scriptsQueryKeys.versions(project.id),
              )
              ?.scriptVersions[0];
            toast.success(
              `Script v${newest?.number ?? ''} is ready. Used ${job.creditCost} credits.`,
            );
            router.replace(`/projects/${project.id}/script`);
            document.getElementById('hooks-heading')?.focus();
          });
        void queryClient.invalidateQueries({ queryKey: projectsQueryKeys.detail(project.id) });
        return;
      }

      if (
        job.type === GenerationJobType.RewriteHook ||
        job.type === GenerationJobType.RewriteScene
      ) {
        const itemId = job.hookId ?? job.sceneId;

        if (completed && itemId) {
          setPendingItemIds((current) => [...current, itemId]);
          toast.success(`Used ${job.creditCost} credit.`);
        }
        void queryClient
          .invalidateQueries({ queryKey: scriptsQueryKeys.versions(project.id) })
          .then(() => {
            if (!completed || !itemId) return;
            setMergeRequest({ ids: [itemId], token: Date.now() });
            setPendingItemIds((current) => current.filter((id) => id !== itemId));
          });
      }
    },
    [project.id, queryClient, router],
  );

  const { jobs, latest, track, isLoading: jobsLoading } = useProjectJobs(project.id, onFinished);

  const retry = useRetryGenerationJobMutation({
    onSuccess: ({ retryGenerationJob }) => track(retryGenerationJob),
    onError: (error) => toast.error(error.message),
  });

  const writeJob = latest(GenerationJobType.WriteScript);
  const newest = versions[0];
  const showJobPanel =
    writeJob !== null &&
    (isJobActive(writeJob) ||
      (writeJob.status === GenerationJobStatus.Failed &&
        (!newest || new Date(writeJob.createdAt) > new Date(newest.createdAt))));

  const requested = Number(searchParams.get('version'));
  const viewed = versions.find((version) => version.number === requested) ?? newest ?? null;

  useEffect(() => {
    if (searchParams.get('version') && versionsQuery.isSuccess && !versions.some((version) => version.number === requested)) {
      router.replace(`/projects/${project.id}/script`);
    }
  }, [project.id, requested, router, searchParams, versions, versionsQuery.isSuccess]);

  const shell = (content: React.ReactNode) => (
    <StepPage
      step={ProjectStepKey.Script}
      title="Script"
      subtitle="Pick a hook, then shape each scene. Nothing is final until you approve a version."
      footer={{ back: { label: intakeLabel, href: intakeHref } }}
    >
      {content}
    </StepPage>
  );

  if (versionsQuery.isPending || jobsLoading) {
    return shell(
      <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading script">
        <div className="grid gap-3 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-44 rounded-lg" />
          ))}
        </div>
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-48 rounded-lg" />
        ))}
      </div>,
    );
  }

  if (versionsQuery.isError) {
    return shell(
      <Alert variant="danger" role="alert">
        <CircleAlertIcon />
        <AlertContent>
          <AlertTitle>We couldn’t load your script.</AlertTitle>{' '}
          <AlertDescription>Check your connection and try again.</AlertDescription>
        </AlertContent>
        <AlertAction>
          <Button size="sm" variant="secondary" onClick={() => void versionsQuery.refetch()}>
            Try again
          </Button>
        </AlertAction>
      </Alert>,
    );
  }

  if (showJobPanel && writeJob) {
    return shell(
      <JobPanel
        job={writeJob}
        retrying={retry.isPending}
        online={online}
        onRetry={() => {
          if (!retry.isPending) retry.mutate({ id: writeJob.id });
        }}
        copy={{
          title: 'Writing hooks & script',
          steps: [...studio.writeJob.steps],
          failedLead: 'Script writing didn’t finish.',
          kept: studio.writeJob.kept,
          reassurance:
            'You can leave this page. We’ll keep writing and save the result to this project.',
          retryCost: CREDIT_COST.writeScript,
        }}
        onBackToProjects={() => navigate('/projects')}
        secondaryAction={{
          label: `Back to ${intakeLabel.toLowerCase()}`,
          onClick: () => navigate(intakeHref),
        }}
      />,
    );
  }

  if (!viewed) {
    return shell(
      <Card>
        <CardContent className="items-start gap-3">
          <h2 className="t-h3">No script yet</h2>
          <p className="t-body text-ink-2">
            Write hooks and a script from your {intakeLabel.toLowerCase()}.
          </p>
          <Button onClick={() => navigate(intakeHref)}>
            Go to {intakeLabel.toLowerCase()}
          </Button>
        </CardContent>
      </Card>,
    );
  }

  return (
    <ScriptEditor
      key={viewed.id}
      version={viewed}
      versions={versions}
      jobs={jobs}
      track={track}
      pendingItemIds={pendingItemIds}
      mergeRequest={mergeRequest}
    />
  );
}
