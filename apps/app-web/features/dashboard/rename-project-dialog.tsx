'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { FieldError, FieldHint, FieldLabel } from '@/components/studio/field-label';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import {
  projectsQueryKeys,
  useRenameProjectMutation,
  type ProjectCard,
} from '@/react-query/projects/projects-operations';

const renameSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Add a project name.')
    .max(80, 'Use 80 characters or fewer.'),
});

type RenameValues = z.infer<typeof renameSchema>;

export function RenameProjectDialog({
  project,
  onOpenChange,
}: {
  project: ProjectCard | null;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const form = useForm<RenameValues>({
    resolver: zodResolver(renameSchema),
    defaultValues: { title: project?.title ?? '' },
  });

  useEffect(() => {
    if (project) form.reset({ title: project.title });
  }, [form, project]);

  const rename = useRenameProjectMutation({
    onSuccess: ({ renameProject }) => {
      queryClient.setQueryData(projectsQueryKeys.detail(renameProject.id), {
        project: renameProject,
      });
      void queryClient.invalidateQueries({ queryKey: projectsQueryKeys.lists });
      toast.success('Renamed.');
      onOpenChange(false);
    },
    onError: (error) => {
      form.setError('title', { message: error.message });
    },
  });

  const submit = form.handleSubmit((values) => {
    if (!project || rename.isPending) return;

    rename.mutate({ input: { id: project.id, title: values.title } });
  });

  const error = form.formState.errors.title?.message;

  return (
    <Dialog open={project !== null} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined}>
        <form onSubmit={submit} className="flex min-h-0 flex-col" noValidate>
          <DialogHeader>
            <DialogTitle>Rename project</DialogTitle>
          </DialogHeader>
          <DialogBody className="gap-1.5">
            <FieldLabel htmlFor="rename-project-title">Project name</FieldLabel>
            <Input
              id="rename-project-title"
              autoFocus
              onFocus={(event) => event.currentTarget.select()}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'rename-project-error' : 'rename-project-hint'}
              {...form.register('title')}
            />
            {error ? (
              <FieldError id="rename-project-error">{error}</FieldError>
            ) : (
              <FieldHint id="rename-project-hint">Up to 80 characters.</FieldHint>
            )}
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={rename.isPending} aria-busy={rename.isPending}>
              {rename.isPending ? <Spinner /> : null}
              {rename.isPending ? 'Saving…' : 'Save name'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
