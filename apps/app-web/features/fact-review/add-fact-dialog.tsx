'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useId } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { FieldError, FieldLabel } from '@/components/studio/field-label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import {
  factsQueryKeys,
  useAddProductFactMutation,
} from '@/react-query/facts/facts-operations';
import { projectsQueryKeys } from '@/react-query/projects/projects-operations';
import { scriptsQueryKeys } from '@/react-query/scripts/scripts-operations';

const addFactSchema = z.object({
  text: z.string().trim().min(1, 'Write the fact.').max(200, 'Use 200 characters or fewer.'),
  sourceNote: z.string().trim().max(160, 'Use 160 characters or fewer.'),
  approve: z.boolean(),
});

type AddFactValues = z.infer<typeof addFactSchema>;

/**
 * Add a fact (Design Reference §5.6). From Script Studio it opens with the
 * flagged claim prefilled; the line stays flagged until the fact is approved.
 */
export function AddFactDialog({
  projectId,
  open,
  onOpenChange,
  prefill,
}: {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefill?: string;
}) {
  const queryClient = useQueryClient();
  const id = useId();
  const form = useForm<AddFactValues>({
    resolver: zodResolver(addFactSchema),
    defaultValues: { text: prefill ?? '', sourceNote: '', approve: false },
  });

  useEffect(() => {
    if (open) form.reset({ text: prefill ?? '', sourceNote: '', approve: false });
  }, [form, open, prefill]);

  const add = useAddProductFactMutation({
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: factsQueryKeys.list(projectId) }),
        queryClient.invalidateQueries({ queryKey: projectsQueryKeys.detail(projectId) }),
        queryClient.invalidateQueries({ queryKey: scriptsQueryKeys.versions(projectId) }),
      ]);
      toast.success('Fact added.');
      onOpenChange(false);
    },
    onError: (error) => form.setError('text', { message: error.message }),
  });

  const submit = form.handleSubmit((values) => {
    if (add.isPending) return;

    add.mutate({
      input: {
        projectId,
        text: values.text,
        sourceNote: values.sourceNote || null,
        approve: values.approve,
      },
    });
  });

  const errors = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={prefill ? `${id}-description` : undefined}>
        <form onSubmit={submit} className="flex min-h-0 flex-col" noValidate>
          <DialogHeader>
            <DialogTitle>Add a fact</DialogTitle>
            {prefill ? (
              <DialogDescription id={`${id}-description`}>
                This line is flagged until the fact is approved.
              </DialogDescription>
            ) : null}
          </DialogHeader>
          <DialogBody>
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor={`${id}-text`}>Fact</FieldLabel>
              <Textarea
                id={`${id}-text`}
                rows={3}
                maxLength={200}
                placeholder="e.g. Comes with a travel lid"
                autoFocus
                aria-invalid={Boolean(errors.text)}
                aria-describedby={errors.text ? `${id}-text-error` : undefined}
                {...form.register('text')}
              />
              {errors.text ? (
                <FieldError id={`${id}-text-error`}>{errors.text.message}</FieldError>
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor={`${id}-note`} requirement="optional">
                Where did you confirm this?
              </FieldLabel>
              <Input
                id={`${id}-note`}
                maxLength={160}
                placeholder="e.g. Checked the box myself"
                {...form.register('sourceNote')}
              />
            </div>
            <Controller
              control={form.control}
              name="approve"
              render={({ field }) => (
                <label className="flex items-center gap-3">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                  <span className="t-label">Approve now</span>
                </label>
              )}
            />
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={add.isPending} aria-busy={add.isPending}>
              {add.isPending ? <Spinner /> : null}
              {add.isPending ? 'Adding…' : 'Add fact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
