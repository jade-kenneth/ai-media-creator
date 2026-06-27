'use client';

import { Loader2, RefreshCw } from 'lucide-react';
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
  type MemberRecord,
  useRetriggerApprovalNotificationMutation,
} from '@/react-query/members/members-operations';

type RetriggerApprovalDialogProps = {
  member: MemberRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RetriggerApprovalDialog({
  member,
  open,
  onOpenChange,
}: RetriggerApprovalDialogProps) {
  const retriggerMutation = useRetriggerApprovalNotificationMutation();

  async function handleRetrigger() {
    if (!member) {
      return;
    }

    try {
      await retriggerMutation.mutateAsync({ userId: member.userId });
      toast.success('Approval notification resent to member.');
      onOpenChange(false);
    } catch (error) {
      toast.error(
        explainGraphqlErrorMessage(
          error instanceof Error ? error : undefined,
          'Unable to resend the approval notification right now.',
        ),
      );
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (retriggerMutation.isPending) {
          return;
        }

        onOpenChange(nextOpen);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-blue-500/10 text-blue-700 dark:text-blue-300">
            <RefreshCw className="size-5" />
          </AlertDialogMedia>
          <AlertDialogTitle>Resend Approval Notification</AlertDialogTitle>
          <AlertDialogDescription>
            Resend the approval email and push notification to{' '}
            <span className="font-semibold text-foreground">
              {member?.fullName ?? 'this member'}
            </span>
            . Use this if the member did not receive the original notification.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={retriggerMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <Button
            type="button"
            onClick={() => {
              void handleRetrigger();
            }}
            disabled={retriggerMutation.isPending || !member}
          >
            {retriggerMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <RefreshCw className="size-4" />
                Resend Notification
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
