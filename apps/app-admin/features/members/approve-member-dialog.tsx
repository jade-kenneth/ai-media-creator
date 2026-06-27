'use client';

import { useQueryClient } from '@tanstack/react-query';
import { Loader2, UserCheck } from 'lucide-react';
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
  membersQueryKeys,
  type MemberRecord,
  useApproveMemberMutation,
} from '@/react-query/members/members-operations';

type ApproveMemberDialogProps = {
  member: MemberRecord | null;
  open: boolean;
  onApproved?: () => void;
  onOpenChange: (open: boolean) => void;
};

export function ApproveMemberDialog({
  member,
  open,
  onApproved,
  onOpenChange,
}: ApproveMemberDialogProps) {
  const queryClient = useQueryClient();
  const approveMemberMutation = useApproveMemberMutation();

  async function handleApprove() {
    if (!member) {
      return;
    }

    try {
      await approveMemberMutation.mutateAsync({
        userId: member.userId,
      });

      await queryClient.invalidateQueries({
        queryKey: membersQueryKeys.all,
      });

      onApproved?.();
      toast.success('Registration approved — email sent to member.');
      onOpenChange(false);
    } catch (error) {
      toast.error(
        explainGraphqlErrorMessage(
          error instanceof Error ? error : undefined,
          'Unable to approve this member right now.',
        ),
      );
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (approveMemberMutation.isPending) {
          return;
        }

        onOpenChange(nextOpen);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
            <UserCheck className="size-5" />
          </AlertDialogMedia>
          <AlertDialogTitle>Approve Registration</AlertDialogTitle>
          <AlertDialogDescription>
            Approve{' '}
            <span className="font-semibold text-foreground">
              {member?.fullName ?? 'this member'}
            </span>{' '}
            so the member can sign in and use the app. An email and push
            notification will be sent after approval.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={approveMemberMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <Button
            type="button"
            onClick={() => {
              void handleApprove();
            }}
            disabled={approveMemberMutation.isPending || !member}
          >
            {approveMemberMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Approving...
              </>
            ) : (
              <>
                <UserCheck className="size-4" />
                Approve Registration
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
