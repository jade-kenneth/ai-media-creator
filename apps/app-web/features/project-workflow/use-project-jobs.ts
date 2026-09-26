'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { creditsQueryKeys } from '@/react-query/credits/credits-operations';
import {
  generationJobsQueryKeys,
  isJobActive,
  JOB_POLL_INTERVAL_MS,
  useProjectJobsQuery,
  type GenerationJobRecord,
} from '@/react-query/generation-jobs/generation-jobs-operations';
import type {
  GenerationJobType,
  ProjectJobsQuery,
} from '@/react-query/generated__types';

/**
 * One poller per screen for the project's recent paid jobs. It polls only
 * while a job is queued or running, and calls `onFinished` once when a job
 * reaches completed or failed so the screen can refresh what it changed.
 */
export function useProjectJobs(
  projectId: string,
  onFinished?: (job: GenerationJobRecord) => void,
) {
  const queryClient = useQueryClient();
  const queryKey = generationJobsQueryKeys.project(projectId);
  const jobs = useProjectJobsQuery(
    { projectId, active: null },
    {
      refetchInterval: (query) =>
        query.state.data?.projectJobs.some(isJobActive) ? JOB_POLL_INTERVAL_MS : false,
    },
  );
  const seen = useRef(new Map<string, string>());
  const onFinishedRef = useRef(onFinished);

  useEffect(() => {
    onFinishedRef.current = onFinished;
  }, [onFinished]);

  useEffect(() => {
    const list = jobs.data?.projectJobs ?? [];

    for (const job of list) {
      const previous = seen.current.get(job.id);

      if (previous && previous !== job.status && !isJobActive(job)) {
        void queryClient.invalidateQueries({ queryKey: creditsQueryKeys.summary });
        onFinishedRef.current?.(job);
      }
      seen.current.set(job.id, job.status);
    }
  }, [jobs.data, queryClient]);

  /** Adds a just-started (or retried) job so polling begins immediately. */
  const track = useCallback(
    (job: GenerationJobRecord) => {
      queryClient.setQueryData<ProjectJobsQuery>(queryKey, (current) => ({
        projectJobs: [
          job,
          ...(current?.projectJobs ?? []).filter((item) => item.id !== job.id),
        ],
      }));
      seen.current.set(job.id, job.status);
      void queryClient.invalidateQueries({ queryKey: creditsQueryKeys.summary });
    },
    [queryClient, queryKey],
  );

  const list = useMemo(() => jobs.data?.projectJobs ?? [], [jobs.data]);

  /** The newest job of a type, optionally for one hook or scene. */
  const latest = useCallback(
    (type: GenerationJobType, match?: (job: GenerationJobRecord) => boolean) =>
      list.find((job) => job.type === type && (!match || match(job))) ?? null,
    [list],
  );

  return { jobs: list, isLoading: jobs.isPending, track, latest };
}

/**
 * An idempotency key for one click intent. Repeats and network retries of the
 * same intent reuse it, so the server returns the same job instead of
 * starting a second paid one; rotate it once the request settles.
 */
export function useIdempotencyKey() {
  const key = useRef<string | null>(null);

  return {
    current: () => {
      key.current ??= crypto.randomUUID();
      return key.current;
    },
    rotate: () => {
      key.current = null;
    },
  };
}
