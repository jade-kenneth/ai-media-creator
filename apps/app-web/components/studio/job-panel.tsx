'use client';

import {
  CheckIcon,
  CircleAlertIcon,
  CircleIcon,
  ClockIcon,
} from 'lucide-react';
import { useEffect, useRef } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button, ButtonCost } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { failureCause } from '@/lib/studio/labels';
import type { GenerationJobRecord } from '@/react-query/generation-jobs/generation-jobs-operations';
import { GenerationJobStatus } from '@/react-query/generated__types';
import { formatRelativeTime } from '@/utils/date';

/** What a job panel says about its job (Design Reference §5.8 and §5B). */
export interface JobPanelCopy {
  title: string;
  steps: string[];
  /** Bold lead of the failure message, e.g. “Script writing didn’t finish.” */
  failedLead: string;
  /** What was kept, e.g. “Your facts, strategy and earlier versions are safe.” */
  kept: string;
  reassurance: string;
  retryCost: number;
}

/**
 * The paid-job panel: replaces the work area while a job is queued or
 * running, and explains a failure with a retry that reuses the same job.
 */
export function JobPanel({
  job,
  copy,
  retrying,
  online,
  onRetry,
  onBackToProjects,
  secondaryAction,
}: {
  job: GenerationJobRecord;
  copy: JobPanelCopy;
  retrying: boolean;
  online: boolean;
  onRetry: () => void;
  /** Shown while the job runs; omitted where the panel sits inside a card. */
  onBackToProjects?: () => void;
  /** Shown next to Try again on failure, e.g. “Back to strategy”. */
  secondaryAction?: { label: string; onClick: () => void };
}) {
  const failed = job.status === GenerationJobStatus.Failed;
  const queued = job.status === GenerationJobStatus.Queued;
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (failed) heading.current?.focus();
  }, [failed]);

  const progress = queued ? 0.08 : Math.max(0.12, (job.step + 0.5) / job.stepCount);

  return (
    <Card className={cn('max-w-160', failed && 'border-danger-border')}>
      <CardContent className="gap-5">
        <div
          className="flex flex-wrap items-center gap-3"
          role={failed ? 'alert' : 'status'}
        >
          {failed ? (
            <CircleAlertIcon aria-hidden="true" className="size-5 text-danger" />
          ) : queued ? (
            <ClockIcon aria-hidden="true" className="size-5 text-ink-3" />
          ) : (
            <Spinner className="size-5 text-ink" />
          )}
          <h2 ref={heading} tabIndex={-1} className="t-h3 outline-none">
            {copy.title}
          </h2>
          <Badge variant={failed ? 'danger' : queued ? 'neutral' : 'info'}>
            {failed ? 'Failed' : queued ? 'Queued' : 'Running'}
          </Badge>
          <p className="t-caption w-full text-ink-3">
            {failed
              ? `Stopped ${formatRelativeTime(job.finishedAt ?? job.createdAt)} · not charged`
              : `Started ${formatRelativeTime(job.startedAt ?? job.createdAt)} · ${job.creditCost} credits held`}
          </p>
        </div>

        {failed ? (
          <>
            <p className="t-body">
              <span className="font-semibold">{copy.failedLead}</span>{' '}
              {failureCause(job.type, job.failureCode)} {copy.kept} You weren’t
              charged.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={onRetry} disabled={!online || retrying} aria-busy={retrying}>
                {retrying ? <Spinner /> : null}
                Try again
                <ButtonCost>
                  {copy.retryCost} {copy.retryCost === 1 ? 'credit' : 'credits'}
                </ButtonCost>
              </Button>
              {secondaryAction ? (
                <Button variant="secondary" onClick={secondaryAction.onClick}>
                  {secondaryAction.label}
                </Button>
              ) : null}
            </div>
          </>
        ) : (
          <>
            <div className="h-1 overflow-hidden rounded-full bg-surface-sunken">
              <div
                className={cn(
                  'h-full origin-left transition-transform duration-280 ease-out',
                  queued ? 'bg-border-strong' : 'bg-ink',
                )}
                style={{ transform: `scaleX(${progress})` }}
              />
            </div>
            <ol className="t-sm flex flex-col gap-2">
              {copy.steps.map((label, index) => {
                const state = queued
                  ? 'pending'
                  : index < job.step
                    ? 'done'
                    : index === job.step
                      ? 'current'
                      : 'pending';

                return (
                  <li
                    key={label}
                    className={cn(
                      'flex items-center gap-2',
                      state === 'done' && 'text-success',
                      state === 'current' && 'text-ink',
                      state === 'pending' && 'text-ink-3',
                    )}
                  >
                    {state === 'done' ? (
                      <CheckIcon aria-hidden="true" className="size-4" />
                    ) : state === 'current' ? (
                      <Spinner className="size-4" />
                    ) : (
                      <CircleIcon aria-hidden="true" className="size-4" />
                    )}
                    {label}
                  </li>
                );
              })}
            </ol>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="t-sm text-ink-2">{copy.reassurance}</p>
              {onBackToProjects ? (
                <Button variant="ghost" onClick={onBackToProjects}>
                  Back to projects
                </Button>
              ) : null}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
