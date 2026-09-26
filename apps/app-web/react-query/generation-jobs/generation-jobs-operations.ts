import {
  GenerationJobStatus,
  type GenerationJobQuery,
  type GenerationJobQueryVariables,
  type GenerationJobRecordFragment,
  type ProjectJobsQuery,
  type ProjectJobsQueryVariables,
  type RetryGenerationJobMutation,
  type RetryGenerationJobMutationVariables,
} from '@/react-query/generated__types';
import { client } from '@/react-query/graphql-client';
import { unwrapGraphqlResult } from '@/react-query/graphql-error';
import { defineMutation, defineQuery } from '@/react-query/utils';

import {
  GENERATION_JOB_QUERY,
  PROJECT_JOBS_QUERY,
  RETRY_GENERATION_JOB_MUTATION,
} from './graphql/generation-jobs';

export type GenerationJobRecord = GenerationJobRecordFragment;

/** How often a queued or running job is polled for its status. */
export const JOB_POLL_INTERVAL_MS = 1500;

export function isJobActive(job: Pick<GenerationJobRecord, 'status'>) {
  return (
    job.status === GenerationJobStatus.Queued ||
    job.status === GenerationJobStatus.Running
  );
}

export const generationJobsQueryKeys = {
  all: ['jobs'] as const,
  detail: (id: string) => ['jobs', 'detail', id] as const,
  project: (projectId: string) => ['jobs', 'project', projectId] as const,
};

/** Polls while the job is queued or running; stops at a terminal status. */
export const useGenerationJobQuery = defineQuery<
  GenerationJobQuery,
  GenerationJobQueryVariables
>({
  queryKey: (input) => generationJobsQueryKeys.detail(input?.id ?? ''),
  queryFn: async (input, context) => {
    if (!input) throw new Error('A job id is required.');

    return unwrapGraphqlResult(
      await client.request<GenerationJobQuery, GenerationJobQueryVariables>(
        GENERATION_JOB_QUERY,
        input,
        { signal: context?.signal },
      ),
    );
  },
});

export const useProjectJobsQuery = defineQuery<
  ProjectJobsQuery,
  ProjectJobsQueryVariables
>({
  queryKey: (input) => generationJobsQueryKeys.project(input?.projectId ?? ''),
  queryFn: async (input, context) => {
    if (!input) throw new Error('A project id is required.');

    return unwrapGraphqlResult(
      await client.request<ProjectJobsQuery, ProjectJobsQueryVariables>(
        PROJECT_JOBS_QUERY,
        input,
        { signal: context?.signal },
      ),
    );
  },
});

export const useRetryGenerationJobMutation = defineMutation<
  RetryGenerationJobMutation,
  RetryGenerationJobMutationVariables
>({
  mutationKey: ['jobs', 'retry'],
  mutationFn: async (variables) => {
    if (!variables) throw new Error('A job id is required.');

    return unwrapGraphqlResult(
      await client.request<
        RetryGenerationJobMutation,
        RetryGenerationJobMutationVariables
      >(RETRY_GENERATION_JOB_MUTATION, variables),
    );
  },
});
