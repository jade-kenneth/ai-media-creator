'use client';

import { useRouter, useSelectedLayoutSegment } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import type { ProjectStepKey } from '@/react-query/generated__types';
import { STEP_FOR_PATH, STEP_PATH } from '@/lib/studio/labels';
import { useProjectQuery } from '@/react-query/projects/projects-operations';

import {
  ProjectLoading,
  ProjectNoAccess,
  ProjectNotFound,
} from './route-states';
import { StepRail, StepStrip } from './step-nav';
import { WorkflowStateProvider } from './workflow-state';

/**
 * The project workflow shell (Design Reference §4): loads the project, shows
 * the route states, and lays out the rail or step strip beside the step.
 */
export function ProjectWorkflow({
  projectId,
  children,
}: {
  projectId: string;
  children: ReactNode;
}) {
  const segment = useSelectedLayoutSegment();
  const project = useProjectQuery({ id: projectId });

  if (project.isPending) return <ProjectLoading />;

  if (project.isError) {
    return project.error.name === 'ForbiddenError' ? (
      <ProjectNoAccess />
    ) : (
      <ProjectNotFound />
    );
  }

  const data = project.data.project;
  const current = segment ? STEP_FOR_PATH[segment] : undefined;

  if (!current) {
    return <ProjectResume step={data.currentStep} projectId={data.id} />;
  }

  return (
    <WorkflowStateProvider project={data}>
      <div className="lg:grid lg:grid-cols-[var(--rail-w)_minmax(0,1fr)]">
        <StepRail current={current} />
        <div className="min-w-0">
          <StepStrip current={current} />
          {children}
        </div>
      </div>
    </WorkflowStateProvider>
  );
}

/** `/projects/:id` resumes at the project's current step. */
function ProjectResume({
  step,
  projectId,
}: {
  step: ProjectStepKey;
  projectId: string;
}) {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/projects/${projectId}/${STEP_PATH[step]}`);
  }, [projectId, router, step]);

  return <ProjectLoading />;
}
