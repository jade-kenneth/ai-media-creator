'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
  CircleAlertIcon,
  FlagIcon,
  HelpCircleIcon,
  LinkIcon,
  PencilIcon,
  PlusIcon,
  TriangleAlertIcon,
  UserIcon,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  Alert,
  AlertAction,
  AlertContent,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChoiceGroup } from '@/components/ui/choice-group';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { useOfflineDetail } from '@/features/app-shell/offline-banner';
import { StepPage } from '@/features/project-workflow/step-page';
import { useWorkflow } from '@/features/project-workflow/workflow-state';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { useScrollFade } from '@/hooks/use-scroll-fade';
import { cn } from '@/lib/utils';
import {
  factsQueryKeys,
  useProductFactsQuery,
  useRemoveProductFactMutation,
  useSetProductFactStatusMutation,
  useUpdateProductFactTextMutation,
  type ProductFact,
} from '@/react-query/facts/facts-operations';
import {
  FactStatus,
  ProjectStepKey,
  type ProductFactsQuery,
} from '@/react-query/generated__types';
import { projectsQueryKeys } from '@/react-query/projects/projects-operations';
import { scriptsQueryKeys } from '@/react-query/scripts/scripts-operations';

import { AddFactDialog } from './add-fact-dialog';
import { FactRow } from './fact-row';

type Filter = 'ALL' | FactStatus;

const SEGMENT: Record<FactStatus, string> = {
  [FactStatus.Approved]: 'bg-success',
  [FactStatus.Rejected]: 'bg-danger',
  [FactStatus.Unknown]: 'bg-border-strong',
  [FactStatus.Unreviewed]: 'stripe-warning',
};

/** Facts (Design Reference §5.6). */
export function FactsPage() {
  const { project, navigate } = useWorkflow();
  const queryClient = useQueryClient();
  const online = useOnlineStatus();
  const [filter, setFilter] = useState<Filter>('ALL');
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<ProductFact | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [chipsRef, chipsFade] = useScrollFade<HTMLDivElement>();
  const listKey = factsQueryKeys.list(project.id);

  useOfflineDetail('Fact changes will be possible when you reconnect.');

  const facts = useProductFactsQuery({ projectId: project.id });
  const all = facts.data?.productFacts ?? [];
  const count = (status: FactStatus) => all.filter((fact) => fact.status === status).length;
  const unreviewed = count(FactStatus.Unreviewed);
  const approved = count(FactStatus.Approved);

  const refreshDerived = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: projectsQueryKeys.detail(project.id) }),
      queryClient.invalidateQueries({ queryKey: scriptsQueryKeys.versions(project.id) }),
    ]);

  const replaceFact = (next: ProductFact) =>
    queryClient.setQueryData<ProductFactsQuery>(listKey, (current) =>
      current
        ? { productFacts: current.productFacts.map((fact) => (fact.id === next.id ? next : fact)) }
        : current,
    );

  const setStatus = useSetProductFactStatusMutation({
    onMutate: async ({ input }) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<ProductFactsQuery>(listKey);
      const fact = previous?.productFacts.find((item) => item.id === input.id);
      if (fact) replaceFact({ ...fact, status: input.status });
      setRowErrors(({ [input.id]: _cleared, ...rest }) => rest);
      return { previous };
    },
    onError: (_error, variables, context) => {
      const previous = (context as { previous?: ProductFactsQuery } | undefined)?.previous;
      if (previous) queryClient.setQueryData(listKey, previous);
      if (variables) {
        setRowErrors((current) => ({
          ...current,
          [variables.input.id]: 'That change didn’t save. Try again.',
        }));
      }
    },
    onSuccess: ({ setProductFactStatus }) => replaceFact(setProductFactStatus),
    onSettled: () => void refreshDerived(),
  });

  const updateText = useUpdateProductFactTextMutation({
    onSuccess: ({ updateProductFactText }) => {
      replaceFact(updateProductFactText);
      void refreshDerived();
    },
  });

  const remove = useRemoveProductFactMutation({
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: listKey }),
        refreshDerived(),
      ]);
      toast.success('Fact removed.');
      setRemoving(null);
    },
    onError: (error) => toast.error(error.message),
  });

  const visible =
    filter === 'ALL' ? all : all.filter((fact) => fact.status === filter);
  const gateReason =
    unreviewed > 0
      ? `${unreviewed} ${unreviewed === 1 ? 'fact still needs' : 'facts still need'} review`
      : approved === 0
        ? 'Approve at least one fact'
        : null;

  return (
    <StepPage
      step={ProjectStepKey.Facts}
      title="Facts"
      subtitle="Approve only what you can stand behind. Only approved facts are used to write your script."
      asideWidth="300"
      banners={
        project.hasScript ? (
          <Alert variant="warning">
            <TriangleAlertIcon />
            <AlertContent>
              <AlertTitle>Your script uses these facts.</AlertTitle>{' '}
              <AlertDescription>
                Changing an approved fact marks the approved script as needing
                review.
              </AlertDescription>
            </AlertContent>
          </Alert>
        ) : null
      }
      aside={
        <>
          <Card>
            <CardHeader>
              <CardTitle>What we flag</CardTitle>
            </CardHeader>
            <CardContent className="gap-3">
              <ul className="t-sm flex flex-col gap-2">
                {[
                  'Speed and performance claims',
                  'Health or safety outcomes',
                  'Guarantees and superlatives, like ‘best’ or ‘#1’',
                  'Prices, discounts and stock',
                  'Reviews and testimonials',
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <FlagIcon aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-warning" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="t-sm text-ink-3">
                These are prompts, not verdicts. The final call is yours.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Sources</CardTitle>
            </CardHeader>
            <CardContent className="t-sm gap-2 text-ink-2">
              <p className="flex items-center gap-2"><LinkIcon aria-hidden="true" className="size-3.5" />From the listing</p>
              <p className="flex items-center gap-2"><UserIcon aria-hidden="true" className="size-3.5" />You entered</p>
              <p className="flex items-center gap-2"><PencilIcon aria-hidden="true" className="size-3.5" />Edited from the listing</p>
              <p className="flex items-center gap-2"><HelpCircleIcon aria-hidden="true" className="size-3.5" />Not stated in the listing</p>
            </CardContent>
          </Card>
        </>
      }
      footer={{
        back: { label: 'Product', href: `/projects/${project.id}/product` },
        reason: facts.isSuccess ? gateReason : null,
        actions: (
          <Button
            disabled={!facts.isSuccess || gateReason !== null}
            onClick={() => navigate(`/projects/${project.id}/strategy`)}
          >
            Continue to strategy
          </Button>
        ),
      }}
    >
      {facts.isPending ? (
        <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading facts">
          <Skeleton className="h-24 rounded-lg" />
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-22 rounded-lg" />
          ))}
        </div>
      ) : facts.isError ? (
        <Alert variant="danger" role="alert">
          <CircleAlertIcon />
          <AlertContent>
            <AlertTitle>We couldn’t load your facts.</AlertTitle>{' '}
            <AlertDescription>Check your connection and try again.</AlertDescription>
          </AlertContent>
          <AlertAction>
            <Button size="sm" variant="secondary" onClick={() => void facts.refetch()}>
              Try again
            </Button>
          </AlertAction>
        </Alert>
      ) : all.length === 0 ? (
        <Card>
          <CardContent className="items-start gap-3">
            <h2 className="t-h3">No facts yet</h2>
            <p className="t-body text-ink-2">
              Add key features on the Product step, or add a fact here.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setAdding(true)} disabled={!online}>
                <PlusIcon data-icon="inline-start" />
                Add a fact
              </Button>
              <Button variant="ghost" onClick={() => navigate(`/projects/${project.id}/product`)}>
                Go to product
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="gap-3 py-5">
              <div
                role="img"
                aria-label={`${approved} approved, ${count(FactStatus.Rejected)} rejected, ${count(FactStatus.Unknown)} unknown, ${unreviewed} need review`}
                className="flex h-2 gap-0.5"
              >
                {all.map((fact) => (
                  <span
                    key={fact.id}
                    className={cn('flex-1 first:rounded-l-sm last:rounded-r-sm', SEGMENT[fact.status])}
                  />
                ))}
              </div>
              <div aria-live="polite">
                <p className="t-label">
                  {unreviewed > 0
                    ? `${unreviewed} of ${all.length} facts need review.`
                    : `All ${all.length} facts reviewed.`}
                </p>
                <p className="t-sm text-ink-2">
                  {approved} approved · {count(FactStatus.Rejected)} rejected ·{' '}
                  {count(FactStatus.Unknown)} unknown
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="mt-1 flex items-center justify-between gap-3">
            <div ref={chipsRef} data-fade={chipsFade} className="scroller min-w-0">
              <ChoiceGroup<Filter>
                label="Filter facts"
                value={filter}
                onValueChange={setFilter}
                className="flex-nowrap pr-6"
                options={[
                  { value: 'ALL', label: 'All', meta: all.length },
                  { value: FactStatus.Unreviewed, label: 'Needs review', meta: unreviewed },
                  { value: FactStatus.Approved, label: 'Approved', meta: approved },
                  { value: FactStatus.Rejected, label: 'Rejected', meta: count(FactStatus.Rejected) },
                  { value: FactStatus.Unknown, label: 'Unknown', meta: count(FactStatus.Unknown) },
                ]}
              />
            </div>
            <Button variant="secondary" onClick={() => setAdding(true)} disabled={!online} className="shrink-0">
              <PlusIcon data-icon="inline-start" />
              Add a fact
            </Button>
          </div>

          {visible.length === 0 ? (
            <p className="t-body py-6 text-center text-ink-2">No facts match this filter.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {visible.map((fact) => (
                <FactRow
                  key={fact.id}
                  fact={fact}
                  disabled={!online}
                  saving={updateText.isPending && updateText.variables?.input.id === fact.id}
                  error={rowErrors[fact.id] ?? null}
                  onDecide={(status) => {
                    setStatus.mutate({ input: { id: fact.id, status } });
                  }}
                  onMarkUnknown={() => {
                    setStatus.mutate({ input: { id: fact.id, status: FactStatus.Unknown } });
                  }}
                  onSaveText={async (text) => {
                    try {
                      await updateText.mutateAsync({ input: { id: fact.id, text } });
                      return true;
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : 'That didn’t save.');
                      return false;
                    }
                  }}
                  onRemove={() => setRemoving(fact)}
                />
              ))}
            </ul>
          )}
        </>
      )}

      <AddFactDialog projectId={project.id} open={adding} onOpenChange={setAdding} />

      <Dialog
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open && !remove.isPending) setRemoving(null);
        }}
      >
        <DialogContent role="alertdialog">
          <DialogHeader>
            <DialogTitle>Remove this fact?</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <DialogDescription>
              “{removing?.text}” will be removed from your facts. Scripts that
              already use it keep their text, but it won’t be used for new
              writing. This can’t be undone.
            </DialogDescription>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setRemoving(null)} disabled={remove.isPending}>
              Keep fact
            </Button>
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => {
                if (removing && !remove.isPending) remove.mutate({ id: removing.id });
              }}
            >
              {remove.isPending ? <Spinner /> : null}
              Remove fact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StepPage>
  );
}
