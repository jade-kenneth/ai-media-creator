'use client';

import { useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ProjectDetail } from '@/react-query/projects/projects-operations';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'failed';

interface WorkflowState {
  project: ProjectDetail;
  /** Reports one autosave source's status (a form, the script editor, …). */
  reportSave: (source: string, status: SaveStatus) => void;
  saveStatus: SaveStatus;
  /** Navigates in-app, asking first when a save is pending or failed. */
  navigate: (href: string) => void;
}

const WorkflowContext = createContext<WorkflowState | null>(null);

export function useWorkflow(): WorkflowState {
  const context = useContext(WorkflowContext);

  if (!context) throw new Error('useWorkflow must be used inside a project.');

  return context;
}

export function useProject(): ProjectDetail {
  return useWorkflow().project;
}

function combine(statuses: Iterable<SaveStatus>): SaveStatus {
  const all = [...statuses];

  if (all.includes('failed')) return 'failed';
  if (all.includes('saving')) return 'saving';
  if (all.includes('saved')) return 'saved';
  return 'idle';
}

/**
 * Holds the project for every step, the combined autosave status shown in the
 * head, and the unsaved-changes guard (Design Reference §4).
 */
export function WorkflowStateProvider({
  project,
  children,
}: {
  project: ProjectDetail;
  children: ReactNode;
}) {
  const router = useRouter();
  const [statuses, setStatuses] = useState<Record<string, SaveStatus>>({});
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const saveStatus = combine(Object.values(statuses));
  const unsavedRef = useRef(false);

  useEffect(() => {
    unsavedRef.current = saveStatus === 'saving' || saveStatus === 'failed';
  }, [saveStatus]);

  const reportSave = useCallback((source: string, status: SaveStatus) => {
    setStatuses((current) =>
      current[source] === status ? current : { ...current, [source]: status },
    );
  }, []);

  const navigate = useCallback(
    (href: string) => {
      if (unsavedRef.current) {
        setPendingHref(href);
        return;
      }
      router.push(href);
    },
    [router],
  );

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!unsavedRef.current) return;
      event.preventDefault();
    };

    window.addEventListener('beforeunload', warn);

    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  const value = useMemo(
    () => ({ project, reportSave, saveStatus, navigate }),
    [navigate, project, reportSave, saveStatus],
  );

  return (
    <WorkflowContext.Provider value={value}>
      {children}
      <Dialog
        open={pendingHref !== null}
        onOpenChange={(open) => {
          if (!open) setPendingHref(null);
        }}
      >
        <DialogContent role="alertdialog">
          <DialogHeader>
            <DialogTitle>Leave without saving?</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <DialogDescription>
              Your last change hasn’t saved yet. If you leave now, it will be
              lost.
            </DialogDescription>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setPendingHref(null)}>
              Stay on page
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                const href = pendingHref;
                setPendingHref(null);
                if (href) {
                  unsavedRef.current = false;
                  router.push(href);
                }
              }}
            >
              Leave anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </WorkflowContext.Provider>
  );
}
