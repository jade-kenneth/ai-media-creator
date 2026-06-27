'use client';

import { useQueryClient } from '@tanstack/react-query';
import { Loader2, MailCheck, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { explainGraphqlErrorMessage } from '@/react-query/graphql-error';
import {
  type WaitlistEntryRecord,
  waitlistQueryKeys,
  useDeleteWaitlistEntryMutation,
} from '@/react-query/waitlist/waitlist-operations';

type DeleteWaitlistEntryDialogProps = {
  entry: WaitlistEntryRecord | null;
  onDeleted?: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function DeleteWaitlistEntryDialog({
  entry,
  onDeleted,
  onOpenChange,
  open,
}: DeleteWaitlistEntryDialogProps) {
  const queryClient = useQueryClient();
  const deleteWaitlistEntryMutation = useDeleteWaitlistEntryMutation();

  async function handleDelete() {
    if (!entry) {
      return;
    }

    try {
      await deleteWaitlistEntryMutation.mutateAsync({
        id: entry.id,
      });

      await queryClient.invalidateQueries({
        queryKey: waitlistQueryKeys.all,
      });

      onDeleted?.();
      toast.success('Waitlist entry deleted');
      onOpenChange(false);
    } catch (error) {
      toast.error(
        explainGraphqlErrorMessage(
          error instanceof Error ? error : undefined,
          'Unable to delete the waitlist entry right now.',
        ),
      );
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (deleteWaitlistEntryMutation.isPending) {
          return;
        }

        onOpenChange(nextOpen);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <MailCheck className="size-5" />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete Waitlist Entry</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{' '}
            <span className="font-semibold text-foreground">
              {entry?.email ?? 'this waitlist entry'}
            </span>
            ? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteWaitlistEntryMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              void handleDelete();
            }}
            disabled={deleteWaitlistEntryMutation.isPending || !entry}
          >
            {deleteWaitlistEntryMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="size-4" />
                Delete
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
