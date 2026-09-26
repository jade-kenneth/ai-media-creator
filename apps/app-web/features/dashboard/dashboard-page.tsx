'use client';

import { useQueryClient } from '@tanstack/react-query';
import { ClapperboardIcon, CircleAlertIcon, PlusIcon } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useRef, useState, type MouseEvent } from 'react';
import { toast } from 'sonner';

import { ChoiceGroup } from '@/components/ui/choice-group';
import {
  Alert,
  AlertAction,
  AlertContent,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useOfflineDetail } from '@/features/app-shell/offline-banner';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { useScrollFade } from '@/hooks/use-scroll-fade';
import {
  ProjectListFilter,
  ProjectSortField,
} from '@/react-query/generated__types';
import {
  projectsQueryKeys,
  useDuplicateProjectMutation,
  useProjectCountsQuery,
  useProjectsQuery,
  type ProjectCard as ProjectCardData,
} from '@/react-query/projects/projects-operations';

import { NewVideoDialog } from './new-video-dialog';
import { ProjectCard, ProjectCardSkeleton } from './project-card';
import { RenameProjectDialog } from './rename-project-dialog';

const FILTERS: Record<string, ProjectListFilter> = {
  all: ProjectListFilter.All,
  'in-progress': ProjectListFilter.InProgress,
  ready: ProjectListFilter.Ready,
  exported: ProjectListFilter.Exported,
};
const FILTER_PARAM: Record<ProjectListFilter, string> = {
  [ProjectListFilter.All]: 'all',
  [ProjectListFilter.InProgress]: 'in-progress',
  [ProjectListFilter.Ready]: 'ready',
  [ProjectListFilter.Exported]: 'exported',
};

const GRID = 'grid grid-cols-1 gap-4 md:grid-cols-2 aside:grid-cols-3';

/** Projects dashboard (Design Reference §5.3). */
export function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const online = useOnlineStatus();
  const filter = FILTERS[searchParams.get('filter') ?? 'all'] ?? ProjectListFilter.All;
  const sort =
    searchParams.get('sort') === 'name'
      ? ProjectSortField.Name
      : ProjectSortField.LastEdited;
  const [renaming, setRenaming] = useState<ProjectCardData | null>(null);
  const [duplicateFailed, setDuplicateFailed] = useState(false);
  const [newVideoOpen, setNewVideoOpen] = useState(false);
  const newVideoOpener = useRef<HTMLButtonElement | null>(null);
  const [chipsRef, chipsFade] = useScrollFade<HTMLDivElement>();

  useOfflineDetail('Your projects will load when you reconnect.');

  const counts = useProjectCountsQuery();
  const projects = useProjectsQuery({
    filter: { stage: filter },
    sort: { field: sort },
  });

  const refreshLists = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: projectsQueryKeys.lists }),
      queryClient.invalidateQueries({ queryKey: projectsQueryKeys.counts }),
    ]);

  const duplicate = useDuplicateProjectMutation({
    onSuccess: async () => {
      await refreshLists();
      toast.success('Duplicated. The original is unchanged.');
    },
    onError: () => setDuplicateFailed(true),
  });

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value === null) next.delete(key);
    else next.set(key, value);
    router.replace(`${pathname}${next.toString() ? `?${next}` : ''}`, {
      scroll: false,
    });
  };

  const openNewVideo = (event: MouseEvent<HTMLButtonElement>) => {
    newVideoOpener.current = event.currentTarget;
    setNewVideoOpen(true);
  };

  const startDuplicate = (project: ProjectCardData) => {
    if (duplicate.isPending) return;
    setDuplicateFailed(false);
    duplicate.mutate({ id: project.id });
  };

  const items = projects.data?.pages.flatMap((page) =>
    page.projects.edges.map((edge) => edge.node),
  );
  const firstRun = counts.data?.projectCounts.all === 0;
  const loading = projects.isPending || counts.isPending;

  // Opens the studio chooser; creating happens there (§3.23).
  const newButton = (className?: string) => (
    <Button onClick={openNewVideo} aria-haspopup="dialog" className={className}>
      <PlusIcon data-icon="inline-start" />
      New video
    </Button>
  );

  return (
    <main className="mx-auto w-full max-w-300 px-8 pt-8 pb-16 max-lg:px-6 max-sm:px-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-140">
          <h1 className="t-h1">Projects</h1>
          <p className="t-body mt-1 text-ink-2">
            Each project is one short vertical video, made in the studio that
            fits it.
          </p>
        </div>
        {firstRun ? null : newButton('max-sm:w-full')}
      </div>

      {firstRun ? (
        <Empty className="mx-auto max-w-120 pt-12">
          <EmptyHeader>
            <EmptyMedia>
              <ClapperboardIcon strokeWidth={1.75} />
            </EmptyMedia>
            <EmptyTitle>Make your first video</EmptyTitle>
            <EmptyDescription>
              Pick a studio, give it your product or your idea, and we’ll draft
              hooks and a script you can edit.
            </EmptyDescription>
          </EmptyHeader>
          <ol className="t-body flex flex-col gap-2 text-left">
            {[
              'Choose a studio',
              'Add your product or idea',
              'Pick a hook and approve the script',
            ].map(
              (step, index) => (
                <li key={step} className="flex items-center gap-3">
                  <span className="t-mono flex size-6 items-center justify-center rounded-full border border-border-strong text-ink-2">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ),
            )}
          </ol>
          <EmptyContent>{newButton()}</EmptyContent>
        </Empty>
      ) : (
        <>
          <div className="mt-6 flex items-center justify-between gap-3 max-sm:flex-col max-sm:items-stretch">
            <div
              ref={chipsRef}
              data-fade={chipsFade}
              className="scroller min-w-0"
            >
              <ChoiceGroup
                label="Filter projects"
                variant="chip"
                value={filter}
                onValueChange={(value) =>
                  setParam('filter', value === ProjectListFilter.All ? null : FILTER_PARAM[value])
                }
                className="flex-nowrap pr-6"
                options={[
                  { value: ProjectListFilter.All, label: 'All', meta: counts.data?.projectCounts.all },
                  { value: ProjectListFilter.InProgress, label: 'In progress', meta: counts.data?.projectCounts.inProgress },
                  { value: ProjectListFilter.Ready, label: 'Ready to export', meta: counts.data?.projectCounts.ready },
                  { value: ProjectListFilter.Exported, label: 'Exported', meta: counts.data?.projectCounts.exported },
                ]}
              />
            </div>
            <Select
              value={sort === ProjectSortField.Name ? 'name' : 'edited'}
              onValueChange={(value) => setParam('sort', value === 'name' ? 'name' : null)}
            >
              <SelectTrigger aria-label="Sort" className="w-45 max-sm:w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="end">
                <SelectGroup>
                  <SelectItem value="edited">Last edited</SelectItem>
                  <SelectItem value="name">Name A–Z</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {duplicateFailed ? (
            <Alert variant="danger" role="alert" className="mt-5">
              <CircleAlertIcon />
              <AlertContent>
                <AlertTitle>We couldn’t duplicate that project.</AlertTitle>{' '}
                <AlertDescription>Nothing changed. Try again.</AlertDescription>
              </AlertContent>
            </Alert>
          ) : null}

          {projects.isError ? (
            <Alert variant="danger" role="alert" className="mt-5">
              <CircleAlertIcon />
              <AlertContent>
                <AlertTitle>We couldn’t load your projects.</AlertTitle>{' '}
                <AlertDescription>
                  Check your connection and try again.
                </AlertDescription>
              </AlertContent>
              <AlertAction>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => void projects.refetch()}
                  disabled={projects.isFetching}
                >
                  {projects.isFetching ? <Spinner /> : null}
                  Try again
                </Button>
              </AlertAction>
            </Alert>
          ) : loading ? (
            <div
              className={`${GRID} mt-5`}
              aria-busy="true"
              aria-label="Loading projects"
            >
              {Array.from({ length: 6 }, (_, index) => (
                <ProjectCardSkeleton key={index} />
              ))}
            </div>
          ) : items && items.length === 0 && !duplicate.isPending ? (
            <div className="mt-10 flex flex-col items-center gap-3 text-center">
              <p className="t-h3">No projects here yet</p>
              <Button variant="ghost" onClick={() => setParam('filter', null)}>
                Show all projects
              </Button>
            </div>
          ) : (
            <div className={`${GRID} mt-5`}>
              {duplicate.isPending ? <ProjectCardSkeleton label="Copying…" /> : null}
              {items?.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onRename={() => setRenaming(project)}
                  onDuplicate={() => startDuplicate(project)}
                  duplicateDisabled={!online || duplicate.isPending}
                />
              ))}
            </div>
          )}

          {projects.hasNextPage ? (
            <div className="mt-6 flex justify-center">
              <Button
                variant="secondary"
                onClick={() => {
                  if (!projects.isFetchingNextPage) void projects.fetchNextPage();
                }}
                disabled={projects.isFetchingNextPage}
              >
                {projects.isFetchingNextPage ? <Spinner /> : null}
                {projects.isFetchingNextPage ? 'Loading…' : 'Show more projects'}
              </Button>
            </div>
          ) : null}
        </>
      )}

      <NewVideoDialog
        open={newVideoOpen}
        onOpenChange={setNewVideoOpen}
        returnFocusRef={newVideoOpener}
      />

      <RenameProjectDialog
        project={renaming}
        onOpenChange={(open) => {
          if (!open) setRenaming(null);
        }}
      />
    </main>
  );
}
