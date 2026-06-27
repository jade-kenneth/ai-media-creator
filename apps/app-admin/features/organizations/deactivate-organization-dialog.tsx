'use client';

import { useQueryClient } from '@tanstack/react-query';
import { Building2, Loader2, PowerOff } from 'lucide-react';
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
  type OrganizationRecord,
  organizationsQueryKeys,
  useDeactivateOrganizationMutation,
} from '@/react-query/organizations/organizations-operations';

type DeactivateOrganizationDialogProps = {
  organization: OrganizationRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DeactivateOrganizationDialog({
  organization,
  open,
  onOpenChange,
}: DeactivateOrganizationDialogProps) {
  const queryClient = useQueryClient();
  const deactivateMutation = useDeactivateOrganizationMutation();

  async function handleDeactivate() {
    if (!organization) return;

    try {
      await deactivateMutation.mutateAsync({ id: organization.id });

      await queryClient.invalidateQueries({
        queryKey: organizationsQueryKeys.all,
      });

      toast.success('Organization deactivated');
      onOpenChange(false);
    } catch (error) {
      toast.error(
        explainGraphqlErrorMessage(
          error instanceof Error ? error : undefined,
          'Unable to deactivate the organization right now.',
        ),
      );
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (deactivateMutation.isPending) return;
        onOpenChange(nextOpen);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <Building2 className="size-5" />
          </AlertDialogMedia>
          <AlertDialogTitle>Deactivate Organization</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to deactivate{' '}
            <span className="font-semibold text-foreground">
              {organization?.name ?? 'this organization'}
            </span>
            ? Their admin and members will lose access until reactivated.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deactivateMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              void handleDeactivate();
            }}
            disabled={deactivateMutation.isPending || !organization}
          >
            {deactivateMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Deactivating...
              </>
            ) : (
              <>
                <PowerOff className="size-4" />
                Deactivate
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
