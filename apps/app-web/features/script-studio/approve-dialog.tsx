'use client';

import { CheckIcon, TriangleAlertIcon } from 'lucide-react';

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
import { Spinner } from '@/components/ui/spinner';

export function ApproveDialog({
  open,
  onOpenChange,
  number,
  hookText,
  sceneCount,
  spokenSeconds,
  targetSeconds,
  claims,
  approving,
  onApprove,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  number: number;
  hookText: string;
  sceneCount: number;
  spokenSeconds: number;
  targetSeconds: number;
  /** A studio without claims (a story) lists only the hook and the scenes. */
  claims: boolean;
  approving: boolean;
  onApprove: () => void;
}) {
  const over = spokenSeconds > targetSeconds + 2;
  const excerpt = hookText.length > 48 ? `${hookText.slice(0, 48)}…` : hookText;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve v{number}?</DialogTitle>
        </DialogHeader>
        <DialogBody className="gap-4">
          <ul className="t-sm flex flex-col gap-2">
            <li className="flex gap-2">
              <CheckIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
              Hook picked: “{excerpt}”
            </li>
            <li className="flex gap-2">
              {over ? (
                <TriangleAlertIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
              ) : (
                <CheckIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
              )}
              {sceneCount} scenes,{' '}
              {over
                ? `about ${spokenSeconds} s, over your ${targetSeconds} s target`
                : `about ${spokenSeconds} s`}
            </li>
            {claims ? (
              <>
                <li className="flex gap-2">
                  <CheckIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
                  No flagged lines
                </li>
                <li className="flex gap-2">
                  <CheckIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
                  Every claim is one of your approved facts
                </li>
              </>
            ) : null}
          </ul>
          <DialogDescription>
            Approving locks this version. Later edits create a new version.
          </DialogDescription>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Keep editing
          </Button>
          <Button onClick={onApprove} disabled={approving} aria-busy={approving}>
            {approving ? <Spinner /> : null}
            {approving ? 'Approving…' : `Approve v${number}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
