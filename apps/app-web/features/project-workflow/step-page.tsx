'use client';

import {
  ArrowLeftIcon,
  CheckIcon,
  ChevronRightIcon,
  InfoIcon,
  TriangleAlertIcon,
  WifiOffIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useId, type ReactNode } from 'react';

import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { cn } from '@/lib/utils';
import { STEP_FOR_PATH, STEP_PATH } from '@/lib/studio/labels';
import { studioOf, type LockedBanner } from '@/lib/studios';
import {
  ProjectStepKey,
  ProjectStepStatus,
} from '@/react-query/generated__types';

import { useWorkflow } from './workflow-state';

/** Shared locked banners; a studio's `lockedBanner` overrides its own steps. */
const LOCKED_BANNER: Record<ProjectStepKey, LockedBanner> = {
  [ProjectStepKey.Story]: { title: '', detail: '' },
  [ProjectStepKey.Product]: { title: '', detail: '' },
  [ProjectStepKey.Facts]: {
    title: 'Finish Product first.',
    detail: 'Facts open after you add the product title and link.',
  },
  [ProjectStepKey.Strategy]: {
    title: 'Finish Facts first.',
    detail: 'Strategy opens after you review every fact.',
  },
  [ProjectStepKey.Script]: {
    title: 'Finish Strategy first.',
    detail: 'Script opens after you choose an angle.',
  },
  [ProjectStepKey.Media]: {
    title: 'Finish Script first.',
    detail: 'Media opens after you approve a script.',
  },
  [ProjectStepKey.Voice]: {
    title: 'Finish Media first.',
    detail: 'Voice opens after every scene has media or a text card.',
  },
  [ProjectStepKey.Edit]: {
    title: 'Finish Voice first.',
    detail: 'Edit & preview opens after you settle the voiceover.',
  },
  [ProjectStepKey.Brief]: {
    title: 'Finish Script first.',
    detail: 'The creator brief opens after you approve a script.',
  },
  [ProjectStepKey.Export]: {
    title: 'Finish Voice first.',
    detail: 'Export opens after you settle the voiceover.',
  },
};

const ASIDE: Record<'280' | '300' | '320', string> = {
  '280': 'aside:grid-cols-[minmax(0,1fr)_280px]',
  '300': 'aside:grid-cols-[minmax(0,1fr)_300px]',
  '320': 'aside:grid-cols-[minmax(0,1fr)_320px]',
};

export interface StepFooter {
  back?: { label: string; href: string };
  /** Why the primary action is disabled; read politely. */
  reason?: string | null;
  meta?: ReactNode;
  actions?: ReactNode;
}

/**
 * One project step's page: head (breadcrumb, h1, save state, subtitle),
 * content with an optional aside, and the sticky footer action bar. A locked
 * step replaces itself with the project's current step.
 */
export function StepPage({
  step,
  title,
  subtitle,
  headExtra,
  autosave = false,
  banners,
  aside,
  asideWidth = '300',
  footer,
  children,
}: {
  step: ProjectStepKey;
  title: string;
  subtitle: string;
  headExtra?: ReactNode;
  autosave?: boolean;
  banners?: ReactNode;
  aside?: ReactNode;
  asideWidth?: '280' | '300' | '320';
  footer: StepFooter;
  children: ReactNode;
}) {
  const { project, navigate } = useWorkflow();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lockedFrom = searchParams.get('locked');
  const entry = project.steps.find((candidate) => candidate.key === step);
  const locked = entry?.status === ProjectStepStatus.Locked;
  // A step this project's studio doesn't have (or a hidden beta step) opens
  // the current step instead, without a locked banner.
  const missing = !entry;

  useEffect(() => {
    if (!locked && !missing) return;
    router.replace(
      `/projects/${project.id}/${STEP_PATH[project.currentStep]}${locked ? `?locked=${STEP_PATH[step]}` : ''}`,
    );
  }, [locked, missing, project.currentStep, project.id, router, step]);

  if (locked || missing) return null;

  const lockedKey = lockedFrom ? STEP_FOR_PATH[lockedFrom] : undefined;
  const lockedBanner = lockedKey
    ? (studioOf(project.studio).lockedBanner[lockedKey] ??
      LOCKED_BANNER[lockedKey])
    : null;

  return (
    <main className="flex min-h-[calc(100dvh-var(--topbar-h))] min-w-0 flex-col">
      <header className="px-8 pt-7 max-lg:px-4 max-lg:pt-5">
        <div className="mx-auto max-w-280">
          <nav aria-label="Breadcrumb">
            <ol className="t-sm flex items-center gap-1.5 text-ink-2">
              <li>
                <Link
                  href="/projects"
                  onClick={(event) => {
                    event.preventDefault();
                    navigate('/projects');
                  }}
                  className="rounded-sm hover:text-ink hover:underline"
                >
                  Projects
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRightIcon className="size-3.5 text-ink-3" />
              </li>
              <li aria-current="page" className="truncate text-ink">
                {project.title}
              </li>
            </ol>
          </nav>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <h1 className="t-h1">{title}</h1>
            <div className="flex flex-wrap items-center gap-3">
              {headExtra}
              {autosave ? <SaveState /> : null}
            </div>
          </div>
          <p className="t-body mt-1 max-w-160 text-ink-2">{subtitle}</p>
        </div>
      </header>

      <div className="flex-1 px-8 pt-6 pb-30 max-lg:px-4 max-lg:pt-4 max-lg:pb-28">
        <div className="mx-auto flex max-w-280 flex-col gap-4">
          {lockedBanner ? (
            <Alert variant="info">
              <InfoIcon />
              <AlertContent>
                <AlertTitle>{lockedBanner.title}</AlertTitle>{' '}
                <AlertDescription>{lockedBanner.detail}</AlertDescription>
              </AlertContent>
            </Alert>
          ) : null}
          {banners}
          <div
            className={cn('grid gap-6', aside ? ASIDE[asideWidth] : undefined)}
          >
            <div className="flex min-w-0 flex-col gap-4">{children}</div>
            {aside ? (
              <aside className="flex min-w-0 flex-col gap-4 max-aside:hidden aside:sticky aside:top-21 aside:self-start">
                {aside}
              </aside>
            ) : null}
          </div>
        </div>
      </div>

      <StepFooterBar footer={footer} />
    </main>
  );
}

function StepFooterBar({ footer }: { footer: StepFooter }) {
  const { navigate } = useWorkflow();
  const reasonId = useId();

  return (
    <div
      data-footer-bar
      className="sticky bottom-0 z-20 border-t border-border bg-surface px-8 py-3 pb-[max(12px,env(safe-area-inset-bottom))] max-lg:px-4"
    >
      {footer.reason ? (
        <p
          id={reasonId}
          className="t-caption mb-2 text-ink-2 sm:hidden"
          aria-live="polite"
        >
          {footer.reason}
        </p>
      ) : null}
      <div className="mx-auto flex max-w-280 items-center gap-3">
        {footer.back ? (
          <Button
            variant="ghost"
            className="max-sm:hidden"
            onClick={() => navigate(footer.back?.href ?? '/projects')}
          >
            <ArrowLeftIcon data-icon="inline-start" />
            {footer.back.label}
          </Button>
        ) : null}
        <div className="ml-auto flex min-w-0 items-center gap-3 max-sm:w-full max-sm:[&>*:last-child]:flex-1">
          {footer.reason ? (
            <p
              className="t-sm text-right text-ink-2 max-sm:hidden"
              aria-live="polite"
            >
              {footer.reason}
            </p>
          ) : null}
          {footer.meta}
          {footer.actions}
        </div>
      </div>
    </div>
  );
}

/** Saved · Saving… · Not saved. Retrying… · Offline */
function SaveState() {
  const { saveStatus } = useWorkflow();
  const online = useOnlineStatus();

  const state = !online
    ? {
        icon: <WifiOffIcon className="size-3.5 text-warning" />,
        label: 'Offline',
      }
    : saveStatus === 'saving'
      ? { icon: <Spinner className="size-3.5 text-ink-3" />, label: 'Saving…' }
      : saveStatus === 'failed'
        ? {
            icon: <TriangleAlertIcon className="size-3.5 text-warning" />,
            label: 'Not saved. Retrying…',
          }
        : saveStatus === 'saved'
          ? {
              icon: <CheckIcon className="size-3.5 text-success" />,
              label: 'Saved',
            }
          : null;

  if (!state) return null;

  return (
    <p className="t-caption flex items-center gap-1.5 text-ink-2" role="status">
      {state.icon}
      {state.label}
    </p>
  );
}

/** Save-failed banner shared by the autosaving steps. */
export function SaveFailedBanner() {
  const { saveStatus } = useWorkflow();

  if (saveStatus !== 'failed') return null;

  return (
    <Alert variant="warning" role="alert">
      <TriangleAlertIcon />
      <AlertContent>
        <AlertTitle>Your last change didn’t save.</AlertTitle>{' '}
        <AlertDescription>
          We’ll keep retrying. Don’t close this tab yet.
        </AlertDescription>
      </AlertContent>
    </Alert>
  );
}
