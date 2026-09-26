'use client';

import { useQueryClient } from '@tanstack/react-query';
import { CircleAlertIcon, WifiOffIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useId, useRef, useState, type RefObject } from 'react';

import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { STEP_PATH } from '@/lib/studio/labels';
import { STUDIOS, studioOf } from '@/lib/studios';
import type { StudioType } from '@/react-query/generated__types';
import {
  projectsQueryKeys,
  useCreateProjectMutation,
  useStudiosQuery,
} from '@/react-query/projects/projects-operations';

interface StudioOption {
  type: StudioType;
  area: string;
  title: string;
  description: string;
}

/** The web registry's studios, used only when the studios query can't load. */
const FALLBACK_OPTIONS: StudioOption[] = Object.values(STUDIOS).map(
  ({ type, area, title, description }) => ({ type, area, title, description }),
);

/**
 * “What are you making?” (Product Specification §3.23): one option card per
 * built studio, in registry order. A card creates the project straight away
 * and opens its first step. The studios load with the dashboard, so the
 * dialog opens without a wait.
 */
export function NewVideoDialog({
  open,
  onOpenChange,
  returnFocusRef,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The button that opened the dialog; focus goes back to it on close. */
  returnFocusRef: RefObject<HTMLElement | null>;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const online = useOnlineStatus();
  const studios = useStudiosQuery();
  const [pressed, setPressed] = useState<StudioType | null>(null);
  const [failed, setFailed] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const create = useCreateProjectMutation({
    onSuccess: ({ createProject }) => {
      queryClient.setQueryData(projectsQueryKeys.detail(createProject.id), {
        project: createProject,
      });
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: projectsQueryKeys.lists }),
        queryClient.invalidateQueries({ queryKey: projectsQueryKeys.counts }),
      ]);
      router.push(
        `/projects/${createProject.id}/${STEP_PATH[createProject.currentStep]}`,
      );
    },
    onError: () => {
      setPressed(null);
      setFailed(true);
    },
  });
  // Stays busy after success until the route changes.
  const creating = create.isPending || create.isSuccess;

  const options =
    studios.data?.studios ?? (studios.isError ? FALLBACK_OPTIONS : null);

  const start = (studio: StudioType) => {
    if (creating || !online) return;
    setFailed(false);
    setPressed(studio);
    create.mutate({ input: { studio } });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setFailed(false);
        onOpenChange(next);
      }}
    >
      <DialogContent
        aria-describedby={undefined}
        className="sm:w-140"
        onOpenAutoFocus={(event) => {
          const first = gridRef.current?.querySelector<HTMLButtonElement>(
            'button:not(:disabled)',
          );
          if (!first) return;
          event.preventDefault();
          first.focus();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocusRef.current?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle>What are you making?</DialogTitle>
        </DialogHeader>
        <DialogBody className="max-h-[min(560px,70dvh)] gap-4">
          {!online ? (
            <Alert variant="warning">
              <WifiOffIcon />
              <AlertContent>
                <AlertTitle>You’re offline.</AlertTitle>{' '}
                <AlertDescription>
                  Projects can be created when you reconnect.
                </AlertDescription>
              </AlertContent>
            </Alert>
          ) : null}
          {failed ? (
            <Alert variant="danger" role="alert">
              <CircleAlertIcon />
              <AlertContent>
                <AlertTitle>We couldn’t create the project.</AlertTitle>{' '}
                <AlertDescription>
                  Nothing was created. Try again.
                </AlertDescription>
              </AlertContent>
            </Alert>
          ) : null}
          <p className="sr-only" role="status">
            {creating ? 'Creating…' : ''}
          </p>
          <div
            ref={gridRef}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2"
            aria-busy={options === null || creating || undefined}
          >
            {options
              ? options.map((option) => (
                  <StudioCard
                    key={option.type}
                    option={option}
                    pressed={pressed === option.type && creating}
                    inert={creating}
                    disabled={!online}
                    onPress={() => start(option.type)}
                  />
                ))
              : Array.from({ length: 2 }, (_, index) => (
                  <div
                    key={index}
                    className="flex flex-col gap-2 rounded-lg border border-border p-4"
                  >
                    <Skeleton className="size-5" />
                    <Skeleton className="mt-2 h-3 w-20" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                ))}
          </div>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * A studio's option card (the angle card anatomy). While a project is being
 * created every card is inert (`aria-disabled`, so focus stays put) and the
 * pressed one shows the spinner.
 */
function StudioCard({
  option,
  pressed,
  inert,
  disabled,
  onPress,
}: {
  option: StudioOption;
  pressed: boolean;
  inert: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const studio = studioOf(option.type);
  const Icon = studio.icon;
  const descriptionId = useId();

  return (
    <button
      type="button"
      aria-label={studio.createLabel}
      aria-describedby={descriptionId}
      aria-disabled={inert || undefined}
      aria-busy={pressed || undefined}
      disabled={disabled}
      onClick={() => {
        if (inert) return;
        onPress();
      }}
      className="flex w-full flex-col items-start gap-1 rounded-lg border border-border bg-surface p-4 text-left transition-[border-color,box-shadow] duration-120 hover:border-border-strong hover:shadow-e1 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-border disabled:hover:shadow-none aria-disabled:cursor-not-allowed aria-disabled:hover:border-border aria-disabled:hover:shadow-none"
    >
      <span className="t-sm flex h-5 items-center gap-2 text-ink-2">
        {pressed ? (
          <>
            <Spinner />
            Creating…
          </>
        ) : (
          <Icon aria-hidden="true" className="size-5" strokeWidth={1.75} />
        )}
      </span>
      <span className="t-overline mt-2 text-ink-3">{option.area}</span>
      <span className="t-h3">{option.title}</span>
      <span id={descriptionId} className="t-sm text-ink-2">
        {option.description}
      </span>
    </button>
  );
}
