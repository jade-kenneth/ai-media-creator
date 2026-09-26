'use client';

import { InfoIcon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { useProject } from '@/features/project-workflow/workflow-state';
import { studioOf } from '@/lib/studios';
import type { ProjectAsset } from '@/react-query/assets/assets-operations';

import { AccuracyCheck } from './accuracy-check';
import { ClipPlayer } from './clip-card';

/**
 * `ai-clip-check-dialog` (Design Reference §5C): the accuracy check for an AI
 * clip chosen from the media picker before it was checked. A checked clip
 * skips it on later uses.
 */
export function AiClipCheckDialog({
  clip,
  sceneNumber,
  madeForAnotherScene,
  pending,
  onCancel,
  onConfirm,
}: {
  clip: ProjectAsset | null;
  sceneNumber: number;
  madeForAnotherScene: boolean;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { checks } = studioOf(useProject().studio).clips;
  const [checked, setChecked] = useState<boolean[]>(checks.map(() => false));
  const ready = checked.every(Boolean);

  return (
    <Dialog
      open={clip !== null}
      onOpenChange={(open) => {
        if (!open && !pending) {
          setChecked(checks.map(() => false));
          onCancel();
        }
      }}
    >
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>
            Check clip {clip?.aiClip?.label} before you use it
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          {clip ? (
            <ClipPlayer clip={clip} className="w-full max-w-60 self-center" />
          ) : null}
          {madeForAnotherScene ? (
            <p className="t-sm flex items-start gap-2 text-info">
              <InfoIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              This clip was made for another scene. Check it still fits.
            </p>
          ) : null}
          <AccuracyCheck checked={checked} onChange={setChecked} />
        </DialogBody>
        <DialogFooter>
          {!ready ? (
            <p className="t-sm mr-auto text-ink-2">Tick both checks first</p>
          ) : null}
          <Button variant="secondary" disabled={pending} onClick={onCancel}>
            Cancel
          </Button>
          <Button
            disabled={!ready || pending}
            aria-busy={pending || undefined}
            onClick={() => {
              if (!ready || pending) return;
              onConfirm();
            }}
          >
            {pending ? <Spinner /> : null}
            {pending ? 'Adding…' : `Use in scene ${sceneNumber}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
