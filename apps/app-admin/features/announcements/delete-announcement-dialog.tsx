'use client';

import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Megaphone, Trash2 } from 'lucide-react';
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
import {
  announcementsQueryKeys,
  useDeleteAnnouncementMutation,
  type AnnouncementRecord,
} from '@/react-query/announcements/announcements-operations';
import { explainGraphqlErrorMessage } from '@/react-query/graphql-error';

type DeleteAnnouncementDialogProps = {
  announcement: AnnouncementRecord | null;
  open: boolean;
  onDeleted?: () => void;
  onOpenChange: (open: boolean) => void;
};

export function DeleteAnnouncementDialog({
  announcement,
  open,
  onDeleted,
  onOpenChange,
}: DeleteAnnouncementDialogProps) {
  const queryClient = useQueryClient();
  const deleteAnnouncementMutation = useDeleteAnnouncementMutation();

  async function handleDelete() {
    if (!announcement) {
      return;
    }

    try {
      await deleteAnnouncementMutation.mutateAsync({
        id: announcement.id,
      });

      await queryClient.invalidateQueries({
        queryKey: announcementsQueryKeys.all,
      });

      onDeleted?.();
      toast.success('Announcement deleted');
      onOpenChange(false);
    } catch (error) {
      toast.error(
        explainGraphqlErrorMessage(
          error instanceof Error ? error : undefined,
          'Unable to delete the announcement right now.',
        ),
      );
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (deleteAnnouncementMutation.isPending) {
          return;
        }

        onOpenChange(nextOpen);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <Megaphone className="size-5" />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{' '}
            <span className="font-semibold text-foreground">
              {announcement?.title ?? 'this announcement'}
            </span>
            ? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteAnnouncementMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              void handleDelete();
            }}
            disabled={deleteAnnouncementMutation.isPending || !announcement}
          >
            {deleteAnnouncementMutation.isPending ? (
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
