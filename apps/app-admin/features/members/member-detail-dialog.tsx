'use client';

import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAdminMemberQuery } from '@/react-query/members/members-operations';
import { explainGraphqlErrorMessage } from '@/react-query/graphql-error';

import {
  formatGender,
  formatMemberRegistrationRejectionReason,
  formatMemberReviewer,
} from './constants';

function formatDate(value?: string | null) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return format(date, 'MMM d, yyyy');
}

type MemberDetailDialogProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  memberId: string | null;
};

export function MemberDetailDialog({
  onOpenChange,
  open,
  memberId,
}: MemberDetailDialogProps) {
  const detailQuery = useAdminMemberQuery(
    memberId ? { id: memberId } : undefined,
    {
      enabled: open && Boolean(memberId),
    },
  );

  const member = detailQuery.data?.adminMember ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="shrink-0 space-y-2 border-b border-border/70 px-6 py-5">
          <DialogTitle>Member details</DialogTitle>
          <DialogDescription>
            Review the member profile and linked account details.
          </DialogDescription>
        </DialogHeader>

        {detailQuery.isLoading ? (
          <div className="min-h-0 overflow-y-auto px-6 py-10 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Loading member details...
            </div>
          </div>
        ) : detailQuery.isError ? (
          <div className="min-h-0 overflow-y-auto px-6 py-6">
            <div className="space-y-4">
              <p className="text-sm text-destructive">
                {explainGraphqlErrorMessage(
                  detailQuery.error,
                  'Unable to load the member details right now.',
                )}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  void detailQuery.refetch();
                }}
              >
                Retry
              </Button>
            </div>
          </div>
        ) : !member ? (
          <div className="min-h-0 overflow-y-auto px-6 py-10 text-sm text-muted-foreground">
            This member could not be found.
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
              {member.user?.registrationStatus === 'rejected' ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-destructive">
                        Registration not approved
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Reason:{' '}
                        {formatMemberRegistrationRejectionReason(
                          member.user?.registrationReview?.rejectionReason,
                        )}
                      </p>
                      {member.user?.registrationReview?.rejectionNote ? (
                        <p className="text-sm text-muted-foreground">
                          Note: {member.user.registrationReview.rejectionNote}
                        </p>
                      ) : null}
                      <p className="text-sm text-muted-foreground">
                        Reviewed by:{' '}
                        {formatMemberReviewer(
                          member.user?.registrationReview,
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Reviewed on:{' '}
                        {formatDate(
                          member.user?.registrationReview?.reviewedAt,
                        )}
                      </p>
                    </div>
                    <Badge variant="destructive">
                      {formatMemberRegistrationRejectionReason(
                        member.user?.registrationReview?.rejectionReason,
                      )}
                    </Badge>
                  </div>
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Full name
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {member.fullName || '—'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Contact number
                  </p>
                  <p className="text-sm text-foreground">
                    {member.contactNumber || '—'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Account status
                  </p>
                  <Badge
                    variant={member.user?.isActive ? 'secondary' : 'outline'}
                    className={
                      member.user?.isActive
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                        : 'text-muted-foreground'
                    }
                  >
                    {member.user?.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Registered
                  </p>
                  <p className="text-sm text-foreground">
                    {formatDate(member.createdAt)}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 rounded-xl border border-border/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Personal details
                  </p>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>
                      <span className="font-medium text-foreground">
                        Birthdate:
                      </span>{' '}
                      {formatDate(member.birthdate)}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">
                        Gender:
                      </span>{' '}
                      {formatGender(member.gender)}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">
                        Purok:
                      </span>{' '}
                      {member.purok || '—'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 rounded-xl border border-border/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Account and address
                  </p>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>
                      <span className="font-medium text-foreground">
                        Email:
                      </span>{' '}
                      {member.user?.email ?? '—'}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">
                        Address:
                      </span>{' '}
                      {member.address || '—'}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">
                        Last updated:
                      </span>{' '}
                      {formatDate(member.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
