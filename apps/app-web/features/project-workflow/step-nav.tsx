'use client';

import { CheckIcon, FileTextIcon, LockIcon } from 'lucide-react';
import { useEffect, useRef, type MouseEvent } from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useScrollFade } from '@/hooks/use-scroll-fade';
import { cn } from '@/lib/utils';
import { STEP_LABEL, STEP_PATH } from '@/lib/studio/labels';
import { studioOf } from '@/lib/studios';
import {
  ProjectStepKey,
  ProjectStepStatus,
} from '@/react-query/generated__types';

import { useWorkflow } from './workflow-state';

type Group = 'Plan' | 'Produce' | 'Deliver';

/**
 * The rail groups. Produce and Deliver are the same for every studio; every
 * other step (a studio's intake steps, then Script) is Plan. The server
 * returns the steps a project has, in rail order.
 */
const GROUP_OF: Partial<Record<ProjectStepKey, Group>> = {
  [ProjectStepKey.Media]: 'Produce',
  [ProjectStepKey.Voice]: 'Produce',
  [ProjectStepKey.Edit]: 'Produce',
  [ProjectStepKey.Brief]: 'Deliver',
  [ProjectStepKey.Export]: 'Deliver',
};
const GROUPS: Group[] = ['Plan', 'Produce', 'Deliver'];
/** The creator brief shows a document glyph instead of a number. */
const UNNUMBERED: ProjectStepKey[] = [ProjectStepKey.Brief];

type Visual = 'done' | 'current' | 'open' | 'locked';

function useSteps(current: ProjectStepKey) {
  const { project, navigate } = useWorkflow();
  const numbered = project.steps
    .map((step) => step.key)
    .filter((key) => !UNNUMBERED.includes(key));

  return project.steps.map((step) => {
    const { key } = step;
    const locked = step.status === ProjectStepStatus.Locked;
    const visual: Visual =
      key === current
        ? 'current'
        : locked
          ? 'locked'
          : step.status === ProjectStepStatus.Done
            ? 'done'
            : 'open';

    return {
      key,
      group: GROUP_OF[key] ?? 'Plan',
      label: STEP_LABEL[key],
      number: numbered.indexOf(key) + 1,
      visual,
      lockedReason: step.lockedReason ?? null,
      href: `/projects/${project.id}/${STEP_PATH[key]}`,
      onClick: (event: MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        if (locked) return;
        navigate(`/projects/${project.id}/${STEP_PATH[key]}`);
      },
    };
  });
}

function StepCircle({
  number,
  visual,
  size,
}: {
  number: number;
  visual: Visual;
  size: 'rail' | 'strip';
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        't-caption flex shrink-0 items-center justify-center rounded-full font-semibold',
        size === 'rail' ? 'size-6' : 'size-5',
        visual === 'done' && 'bg-success text-white',
        visual === 'current' && 'bg-flare text-white',
        visual === 'open' && 'border border-border-strong text-ink-2',
        visual === 'locked' && 'bg-surface-sunken text-ink-3',
      )}
    >
      {visual === 'done' ? (
        <CheckIcon className="size-3.5" strokeWidth={2.5} />
      ) : number > 0 ? (
        number
      ) : (
        <FileTextIcon className="size-3.5" />
      )}
    </span>
  );
}

function StepLink({
  step,
  variant,
}: {
  step: ReturnType<typeof useSteps>[number];
  variant: 'rail' | 'strip';
}) {
  const locked = step.visual === 'locked';
  const link = (
    <a
      href={step.href}
      onClick={step.onClick}
      aria-current={step.visual === 'current' ? 'step' : undefined}
      aria-disabled={locked || undefined}
      aria-label={
        locked ? `${step.label}, locked. ${step.lockedReason ?? ''}` : undefined
      }
      data-current={step.visual === 'current' || undefined}
      className={cn(
        't-label flex items-center gap-3 transition-colors duration-120',
        variant === 'rail' &&
          'h-10 rounded-md px-2 hover:bg-surface-hover data-current:bg-surface-sunken',
        variant === 'strip' &&
          'h-9 shrink-0 gap-2 rounded-full border border-border-strong bg-surface pr-3 pl-1.5 data-current:border-[1.5px] data-current:border-ink',
        step.visual === 'open' && 'text-ink-2',
        step.visual === 'locked' &&
          'cursor-not-allowed text-ink-3 hover:bg-transparent',
        (step.visual === 'current' || step.visual === 'done') && 'text-ink',
      )}
    >
      <StepCircle number={step.number} visual={step.visual} size={variant} />
      <span className="truncate">{step.label}</span>
      {locked ? (
        <LockIcon aria-hidden="true" className="ml-auto size-3.5 shrink-0" />
      ) : null}
    </a>
  );

  if (!locked || !step.lockedReason) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side={variant === 'rail' ? 'right' : 'bottom'}>
        {step.lockedReason}
      </TooltipContent>
    </Tooltip>
  );
}

/** The ≥ 1024px stepper rail (Design Reference §4, §3.23). */
export function StepRail({ current }: { current: ProjectStepKey }) {
  const { project } = useWorkflow();
  const steps = useSteps(current);
  const studio = studioOf(project.studio);
  const subject = studio.railSubject(project);

  return (
    <div className="border-r border-border bg-surface max-lg:hidden">
      <nav
        aria-label="Project steps"
        className="sticky top-15 flex max-h-[calc(100dvh-var(--topbar-h))] flex-col overflow-y-auto px-4 py-5"
      >
        <p className="t-caption text-ink-3">{studio.name}</p>
        <p className="t-h3 mt-1 line-clamp-2">{project.title}</p>
        <p
          className={cn(
            't-sm truncate',
            subject.muted ? 'text-ink-3' : 'text-ink-2',
          )}
        >
          {subject.text}
        </p>

        {GROUPS.map((group) => {
          const rows = steps.filter((step) => step.group === group);

          if (rows.length === 0) return null;

          return (
            <div key={group}>
              <p className="t-overline mt-6 mb-2 text-ink-3">{group}</p>
              <ol className="flex flex-col gap-0.5">
                {rows.map((step) => (
                  <li key={step.key}>
                    <StepLink step={step} variant="rail" />
                  </li>
                ))}
              </ol>
            </div>
          );
        })}
      </nav>
    </div>
  );
}

/** The < 1024px step strip with “Step n of N: Name” over the project's steps. */
export function StepStrip({ current }: { current: ProjectStepKey }) {
  const steps = useSteps(current);
  const [scrollerRef, scrollerFade] = useScrollFade<HTMLOListElement>();
  const index = steps.findIndex((step) => step.key === current);
  const didScroll = useRef(false);

  useEffect(() => {
    if (didScroll.current) return;
    didScroll.current = true;
    scrollerRef.current
      ?.querySelector('[data-current]')
      ?.scrollIntoView({
        block: 'nearest',
        inline: 'center',
        behavior: 'instant',
      });
  }, [scrollerRef]);

  return (
    <nav
      aria-label="Project steps"
      className="sticky top-15 z-20 border-b border-border bg-surface lg:hidden"
    >
      <ol
        ref={scrollerRef}
        data-fade={scrollerFade}
        className="scroller flex gap-2 px-4 pt-3 pb-2"
        data-scroller-id="workflow.steps"
      >
        {steps.map((step) => (
          <li key={step.key} className="shrink-0">
            <StepLink step={step} variant="strip" />
          </li>
        ))}
      </ol>
      <p className="t-caption px-4 pb-2 text-ink-3">
        Step {index + 1} of {steps.length}: {STEP_LABEL[current]}
      </p>
    </nav>
  );
}
