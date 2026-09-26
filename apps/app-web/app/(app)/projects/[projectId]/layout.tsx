import type { ReactNode } from 'react';

import { ProjectWorkflow } from '@/features/project-workflow/project-workflow';

export default async function ProjectLayout({
  params,
  children,
}: {
  params: Promise<{ projectId: string }>;
  children: ReactNode;
}) {
  const { projectId } = await params;

  return <ProjectWorkflow projectId={projectId}>{children}</ProjectWorkflow>;
}
