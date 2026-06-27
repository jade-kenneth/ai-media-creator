'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, UserX } from 'lucide-react';
import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { RichTextField } from '@/components/core';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  RegistrationRejectionReason,
  type RejectMemberMutationVariables,
} from '@/react-query/generated__types';
import { explainGraphqlErrorMessage } from '@/react-query/graphql-error';
import {
  membersQueryKeys,
  useRejectMemberMutation,
  type MemberRecord,
} from '@/react-query/members/members-operations';
import { getPlainTextFromRichTextHtml } from '@/utils/rich-text';

import {
  isOtherRegistrationRejectionReason,
  memberRegistrationRejectionReasonOptions,
} from './constants';

const rejectMemberSchema = z
  .object({
    rejectionReason: z.union([
      z.nativeEnum(RegistrationRejectionReason),
      z.literal(''),
    ]),
    rejectionNote: z
      .string()
      .transform(getPlainTextFromRichTextHtml)
      .pipe(
        z.string().max(500, 'Additional note must be 500 characters or fewer.'),
      ),
  })
  .superRefine((values, context) => {
    if (values.rejectionReason.length === 0) {
      context.addIssue({
        code: 'custom',
        message: 'Select a rejection reason.',
        path: ['rejectionReason'],
      });

      return;
    }

    if (
      isOtherRegistrationRejectionReason(values.rejectionReason) &&
      values.rejectionNote.length === 0
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Add a note when choosing Other.',
        path: ['rejectionNote'],
      });
    }
  });

type RejectMemberFormValues = z.infer<typeof rejectMemberSchema>;

function getDefaultValues(): RejectMemberFormValues {
  return {
    rejectionReason: '',
    rejectionNote: '',
  };
}

type RejectMemberDialogProps = {
  member: MemberRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRejected?: () => void;
};

export function RejectMemberDialog({
  member,
  open,
  onOpenChange,
  onRejected,
}: RejectMemberDialogProps) {
  const queryClient = useQueryClient();
  const rejectMemberMutation = useRejectMemberMutation();

  const form = useForm<RejectMemberFormValues>({
    resolver: zodResolver(rejectMemberSchema),
    defaultValues: getDefaultValues(),
  });

  useEffect(() => {
    form.reset(getDefaultValues());
  }, [form, open, member]);

  const {
    control,
    formState: { errors },
    handleSubmit,
  } = form;

  const selectedReason = useWatch({
    control,
    name: 'rejectionReason',
  });

  const isSubmitting = rejectMemberMutation.isPending;
  const isOtherReason = isOtherRegistrationRejectionReason(selectedReason);

  async function handleReject(values: RejectMemberFormValues) {
    const rejectionReason = values.rejectionReason;

    if (!member || rejectionReason === '') {
      return;
    }

    const variables: RejectMemberMutationVariables = {
      userId: member.userId,
      rejectionReason,
      rejectionNote: values.rejectionNote.trim() || undefined,
    };

    try {
      await rejectMemberMutation.mutateAsync(variables);

      await queryClient.invalidateQueries({
        queryKey: membersQueryKeys.all,
      });

      onRejected?.();
      toast.error('Registration rejected — member has been notified.');
      onOpenChange(false);
    } catch (error) {
      toast.error(
        explainGraphqlErrorMessage(
          error instanceof Error ? error : undefined,
          'Unable to reject this member right now.',
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="space-y-2">
          <DialogTitle>Reject Registration</DialogTitle>
          <DialogDescription>
            Select the reason for rejecting{' '}
            <span className="font-semibold text-foreground">
              {member?.fullName ?? 'this member'}
            </span>
            . The member will receive the reason and any note you include
            here.
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit(handleReject)(event);
          }}
        >
          <div className="flex flex-col gap-2">
            <label
              htmlFor="member-registration-rejection-reason"
              className="text-sm font-medium text-foreground"
            >
              Rejection reason
            </label>
            <Controller
              control={control}
              name="rejectionReason"
              render={({ field }) => (
                <Select
                  value={field.value || undefined}
                  onValueChange={(value) => {
                    field.onChange(value);
                  }}
                >
                  <SelectTrigger id="member-registration-rejection-reason">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {memberRegistrationRejectionReasonOptions.map(
                      (option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.rejectionReason ? (
              <p className="text-sm text-destructive">
                {errors.rejectionReason.message}
              </p>
            ) : null}
          </div>

          <Controller
            control={control}
            name="rejectionNote"
            render={({ field }) => (
              <RichTextField
                id="member-registration-rejection-note"
                label={
                  isOtherReason
                    ? 'Additional note'
                    : 'Additional note (optional)'
                }
                value={field.value}
                onChange={field.onChange}
                enableImageUpload={false}
                placeholder={
                  isOtherReason
                    ? 'Explain the rejection in a few clear words.'
                    : 'Add a note for the member if needed.'
                }
                invalid={Boolean(errors.rejectionNote)}
                errorMessage={errors.rejectionNote?.message}
                disabled={isSubmitting}
                limit={500}
                helperText={
                  isOtherReason
                    ? 'This note is required when the reason is Other.'
                    : 'Leave this blank if the reason alone is enough.'
                }
              />
            )}
          />

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <UserX className="size-4" />
                  Reject Registration
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
