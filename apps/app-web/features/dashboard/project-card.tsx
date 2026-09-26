'use client';

import {
  CircleAlertIcon,
  CopyIcon,
  FilmIcon,
  FolderOpenIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { STAGE_BADGE, STEP_PATH } from '@/lib/studio/labels';
import { studioOf } from '@/lib/studios';
import { cn } from '@/lib/utils';
import { FailureNoticeKind } from '@/react-query/generated__types';
import type { ProjectCard as ProjectCardData } from '@/react-query/projects/projects-operations';
import { formatRelativeTime } from '@/utils/date';

const FAILURE_LINE: Record<FailureNoticeKind, string> = {
  [FailureNoticeKind.AngleSuggestions]:
    'Angle suggestions failed. Open to retry.',
  [FailureNoticeKind.AudienceSuggestions]:
    'Audience suggestions failed. Open to retry.',
  [FailureNoticeKind.PremiseSuggestions]:
    'Premise suggestions failed. Open to retry.',
  [FailureNoticeKind.ScriptWriting]: 'Script writing failed. Open to retry.',
};

const thumbnailClass =
  'relative h-39 w-22 shrink-0 overflow-hidden rounded-md max-sm:h-28.5 max-sm:w-16';

export function ProjectCard({
  project,
  onRename,
  onDuplicate,
  duplicateDisabled,
}: {
  project: ProjectCardData;
  onRename: () => void;
  onDuplicate: () => void;
  duplicateDisabled: boolean;
}) {
  const stage = STAGE_BADGE[project.stage];
  const href = `/projects/${project.id}/${STEP_PATH[project.currentStep]}`;
  const studio = studioOf(project.studio);
  // The studio's subject line; a muted one means the project has no subject
  // yet (no product, no genre), which also gets the dashed draft thumbnail.
  const subject = studio.subjectLine(project);
  const duplicateBlocked = studio.duplicateBlocked(project);
  const exports =
    project.exportCount === 0
      ? 'No exports yet'
      : project.latestExportDownloaded && project.latestExportAt
        ? `Exported ${formatRelativeTime(project.latestExportAt)}`
        : 'Export ready';

  return (
    <article className="group relative flex gap-4 rounded-lg border border-border bg-surface p-4 transition-colors duration-120 focus-within:border-ink-3 hover:border-border-strong hover:shadow-e2">
      <div aria-hidden="true" className={thumbnailClass}>
        {project.thumbnailUrl ? (
          <Image
            src={project.thumbnailUrl}
            alt=""
            fill
            unoptimized
            sizes="88px"
            className="object-cover"
          />
        ) : !subject.muted ? (
          <div className="flex size-full items-center justify-center bg-surface-sunken">
            <FilmIcon className="size-5 text-ink-3" strokeWidth={1.75} />
          </div>
        ) : (
          <div className="flex size-full items-center justify-center rounded-md border-[1.5px] border-dashed border-border-strong bg-canvas">
            <PlusIcon className="size-5 text-ink-3" strokeWidth={1.75} />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5 pr-8">
        <h2 className="t-h3 line-clamp-2">
          <Link
            href={href}
            className="rounded-sm outline-offset-4 after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-focus"
          >
            {project.title}
          </Link>
        </h2>
        <p
          className={cn(
            't-sm w-full truncate',
            subject.muted ? 'text-ink-3' : 'text-ink-2',
          )}
        >
          {subject.text}
        </p>
        <Badge variant={stage.tone}>{stage.label}</Badge>
        {project.failureNotice ? (
          <p className="t-sm flex items-center gap-1.5 text-danger">
            <CircleAlertIcon aria-hidden="true" className="size-3.5 shrink-0" />
            {FAILURE_LINE[project.failureNotice.kind]}
          </p>
        ) : null}
        <p className="t-caption mt-auto text-ink-3">
          Edited {formatRelativeTime(project.lastEditedAt)} · {exports}
        </p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 z-10"
            aria-label={`More actions for ${project.title}`}
          >
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href={href}>
                <FolderOpenIcon />
                Open
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onRename}>
              <PencilIcon />
              Rename…
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={Boolean(duplicateBlocked) || duplicateDisabled}
              onSelect={onDuplicate}
              className="items-start py-2"
            >
              <CopyIcon className="mt-0.5" />
              <span className="flex flex-col">
                Duplicate
                {duplicateBlocked ? (
                  <span className="t-caption text-ink-3">
                    {duplicateBlocked}
                  </span>
                ) : null}
              </span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </article>
  );
}

export function ProjectCardSkeleton({ label }: { label?: string }) {
  return (
    <div className="flex gap-4 rounded-lg border border-border bg-surface p-4">
      <Skeleton className={thumbnailClass} />
      <div className="flex flex-1 flex-col gap-2 pt-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-5.5 w-24 rounded-full" />
        {label ? <p className="t-caption mt-auto text-ink-3">{label}</p> : null}
      </div>
    </div>
  );
}
