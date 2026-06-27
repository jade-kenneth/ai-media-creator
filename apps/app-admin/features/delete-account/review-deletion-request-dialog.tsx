'use client';

import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { AlertTriangle, Loader2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { RichTextField } from '@/components/core';
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
import { Separator } from '@/components/ui/separator';
import {
  accountDeletionRequestsQueryKeys,
  useAdminAccountDeletionRequestQuery,
  useReviewAccountDeletionRequestMutation,
} from '@/react-query/account-deletion-requests/account-deletion-requests-operations';
import { AccountDeletionRequestStatus } from '@/react-query/generated__types';
import { explainGraphqlErrorMessage } from '@/react-query/graphql-error';
import { cn } from '@/utils';
import { getPlainTextFromRichTextHtml } from '@/utils/rich-text';

import { formatAccountDeletionStatus } from './constants';

type ReviewIntent = 'approve' | 'reject' | null;

type ReviewDeletionRequestDialogProps = {
  open: boolean;
  requestId: string | null;
  onOpenChange: (open: boolean) => void;
};

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

function getBadgeClassName(status: AccountDeletionRequestStatus) {
  switch (status) {
    case AccountDeletionRequestStatus.Pending:
      return 'bg-amber-500/10 text-amber-700 dark:text-amber-300';
    case AccountDeletionRequestStatus.Approved:
      return 'bg-destructive/10 text-destructive';
    case AccountDeletionRequestStatus.Rejected:
      return 'bg-muted text-muted-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export function ReviewDeletionRequestDialog({
  open,
  requestId,
  onOpenChange,
}: ReviewDeletionRequestDialogProps) {
  const queryClient = useQueryClient();
  const detailQuery = useAdminAccountDeletionRequestQuery(
    requestId ? { id: requestId } : undefined,
    {
      enabled: open && Boolean(requestId),
    },
  );
  const reviewMutation = useReviewAccountDeletionRequestMutation();
  const request = detailQuery.data?.adminAccountDeletionRequest ?? null;
  const [reviewNote, setReviewNote] = useState('');
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [confirmIntent, setConfirmIntent] = useState<ReviewIntent>(null);

  const isSubmitting = reviewMutation.isPending;
  const isPendingRequest =
    request?.status === AccountDeletionRequestStatus.Pending;

  async function handleConfirmReview() {
    if (!request || !confirmIntent) {
      return;
    }

    const trimmedNote = getPlainTextFromRichTextHtml(reviewNote);

    if (confirmIntent === 'reject' && !trimmedNote) {
      setReviewError('Add a review note before rejecting this request.');
      return;
    }

    try {
      await reviewMutation.mutateAsync({
        input: {
          requestId: request.id,
          status:
            confirmIntent === 'approve'
              ? AccountDeletionRequestStatus.Approved
              : AccountDeletionRequestStatus.Rejected,
          reviewNote: trimmedNote || undefined,
        },
      });

      await queryClient.invalidateQueries({
        queryKey: accountDeletionRequestsQueryKeys.all,
      });

      toast.success(
        confirmIntent === 'approve'
          ? 'Deletion request approved'
          : 'Deletion request rejected',
      );
      onOpenChange(false);
    } catch (error) {
      setReviewError(
        explainGraphqlErrorMessage(
          error instanceof Error ? error : undefined,
          'Unable to review this deletion request right now.',
        ),
      );
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isSubmitting) {
          return;
        }

        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-2xl gap-0 overflow-hidden p-0">
        <DialogHeader className="space-y-2 border-b border-border/70 px-6 py-5">
          <DialogTitle>Account Deletion Request</DialogTitle>
          <DialogDescription>
            Review the member’s submission before you approve irreversible
            account removal.
          </DialogDescription>
        </DialogHeader>

        {detailQuery.isLoading ? (
          <div className="px-6 py-10 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Loading request details...
            </div>
          </div>
        ) : detailQuery.isError ? (
          <div className="space-y-4 px-6 py-6">
            <p className="text-sm text-destructive">
              {explainGraphqlErrorMessage(
                detailQuery.error,
                'Unable to load the deletion request details right now.',
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
        ) : !request ? (
          <div className="px-6 py-10 text-sm text-muted-foreground">
            This deletion request could not be found.
          </div>
        ) : (
          <div className="space-y-5 overflow-y-auto px-6 py-5">
            <div className="grid gap-4 rounded-2xl border border-border/70 bg-muted/20 p-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Full Name
                </p>
                <p className="text-sm font-medium text-foreground">
                  {request.fullName}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Email
                </p>
                <p className="text-sm font-medium text-foreground">
                  {request.email}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Organization
                </p>
                <p className="text-sm font-medium text-foreground">
                  {request.organizationName}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Submitted
                </p>
                <p className="text-sm font-medium text-foreground">
                  {formatDate(request.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Current Status
                </p>
                <p className="text-xs text-muted-foreground">
                  Pending requests can be approved or rejected once.
                </p>
              </div>
              <Badge className={cn(getBadgeClassName(request.status))}>
                {formatAccountDeletionStatus(request.status)}
              </Badge>
            </div>

            <Separator />

            {isPendingRequest ? (
              <div className="space-y-4">
                <RichTextField
                  id="deletion-review-note"
                  label="Review note"
                  value={reviewNote}
                  onChange={(value) => {
                    setReviewNote(value);
                    if (reviewError) {
                      setReviewError(null);
                    }
                  }}
                  enableImageUpload={false}
                  placeholder="Add context for the approval or a reason for rejection."
                  invalid={Boolean(reviewError)}
                  disabled={isSubmitting}
                  limit={500}
                  helperText="A note is optional for approval and required for rejection."
                />

                {reviewError ? (
                  <div className="rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    {reviewError}
                  </div>
                ) : null}

                {confirmIntent ? (
                  <div
                    className={cn(
                      'space-y-3 rounded-2xl border px-4 py-4',
                      confirmIntent === 'approve'
                        ? 'border-destructive/25 bg-destructive/5'
                        : 'border-amber-300/50 bg-amber-50/70 dark:bg-amber-950/20',
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {confirmIntent === 'approve' ? (
                        <ShieldAlert className="mt-0.5 size-4 text-destructive" />
                      ) : (
                        <AlertTriangle className="mt-0.5 size-4 text-amber-700 dark:text-amber-300" />
                      )}
                      <div className="space-y-1 text-sm">
                        <p className="font-medium text-foreground">
                          {confirmIntent === 'approve'
                            ? 'Approve and delete this account?'
                            : 'Reject this deletion request?'}
                        </p>
                        <p className="text-muted-foreground">
                          {confirmIntent === 'approve'
                            ? 'Approving this request permanently removes the matching member account.'
                            : 'The member account will remain active and the rejection note will be recorded.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant={
                          confirmIntent === 'approve'
                            ? 'destructive'
                            : 'outline'
                        }
                        disabled={isSubmitting}
                        onClick={() => {
                          void handleConfirmReview();
                        }}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            Saving...
                          </>
                        ) : confirmIntent === 'approve' ? (
                          'Confirm approval'
                        ) : (
                          'Confirm rejection'
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={isSubmitting}
                        onClick={() => {
                          setConfirmIntent(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => {
                        setReviewError(null);
                        setConfirmIntent('approve');
                      }}
                    >
                      <ShieldCheck className="size-4" />
                      Approve
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setReviewError(null);
                        setConfirmIntent('reject');
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/10 p-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    Review note
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {request.reviewNote || 'No review note was recorded.'}
                  </p>
                </div>
                <Separator />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      Reviewed By
                    </p>
                    <p className="text-sm text-foreground">
                      {request.reviewedBy || '—'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      Reviewed At
                    </p>
                    <p className="text-sm text-foreground">
                      {formatDate(request.reviewedAt)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="border-t border-border/70 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
            }}
            disabled={isSubmitting}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
