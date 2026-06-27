'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Save } from 'lucide-react';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { ImageUploadField, RichTextField } from '@/components/core';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  announcementsQueryKeys,
  useCreateAnnouncementMutation,
  useUpdateAnnouncementMutation,
  type AnnouncementRecord,
} from '@/react-query/announcements/announcements-operations';
import { AnnouncementCategory } from '@/react-query/generated__types';
import { explainGraphqlErrorMessage } from '@/react-query/graphql-error';

import { announcementCategoryOptions } from './constants';

const announcementContentMinLengthMessage =
  'Content must be at least 10 characters.';

const announcementFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters.')
    .max(200, 'Title must be 200 characters or fewer.'),
  content: z
    .string()
    .trim()
    .refine(
      (value) =>
        value
          .replace(/<[^>]*>/g, ' ')
          .replace(/&nbsp;/gi, ' ')
          .replace(/\s+/g, ' ')
          .trim().length >= 10,
      announcementContentMinLengthMessage,
    ),
  category: z.nativeEnum(AnnouncementCategory),
  coverImageUrl: z
    .string()
    .trim()
    .refine(
      (value) => {
        if (value.length === 0) {
          return true;
        }

        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      },
      {
        message: 'Enter a valid URL or leave this blank.',
      },
    ),
  isPublished: z.boolean(),
  isPinned: z.boolean(),
});

type AnnouncementFormValues = z.infer<typeof announcementFormSchema>;

function getDefaultValues(
  announcement?: AnnouncementRecord | null,
): AnnouncementFormValues {
  return {
    title: announcement?.title ?? '',
    content: announcement?.content ?? '',
    category: announcement?.category ?? AnnouncementCategory.News,
    coverImageUrl: announcement?.coverImageUrl ?? '',
    isPublished: announcement?.isPublished ?? false,
    isPinned: announcement?.isPinned ?? false,
  };
}

type AnnouncementFormDialogProps = {
  announcement?: AnnouncementRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AnnouncementFormDialog({
  announcement,
  open,
  onOpenChange,
}: AnnouncementFormDialogProps) {
  const queryClient = useQueryClient();
  const createAnnouncementMutation = useCreateAnnouncementMutation();
  const updateAnnouncementMutation = useUpdateAnnouncementMutation();
  const isEditing = Boolean(announcement);

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementFormSchema),
    defaultValues: getDefaultValues(announcement),
  });

  useEffect(() => {
    form.reset(getDefaultValues(announcement));
  }, [announcement, form, open]);

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = form;

  const isSubmitting =
    createAnnouncementMutation.isPending ||
    updateAnnouncementMutation.isPending;

  async function handleFormSubmit(values: AnnouncementFormValues) {
    const input = {
      title: values.title.trim(),
      content: values.content.trim(),
      category: values.category,
      coverImageUrl: values.coverImageUrl.trim() || undefined,
      isPublished: values.isPublished,
      isPinned: values.isPinned,
    };

    try {
      if (announcement) {
        await updateAnnouncementMutation.mutateAsync({
          id: announcement.id,
          input,
        });
      } else {
        await createAnnouncementMutation.mutateAsync({
          input,
        });
      }

      await queryClient.invalidateQueries({
        queryKey: announcementsQueryKeys.all,
      });

      if (announcement) {
        toast.success('Announcement updated successfully');
      } else if (input.isPublished) {
        toast.success('Announcement published');
      } else {
        toast.success('Announcement saved as draft');
      }
      onOpenChange(false);
      form.reset(getDefaultValues(null));
    } catch (error) {
      toast.error(
        explainGraphqlErrorMessage(
          error instanceof Error ? error : undefined,
          'Unable to save the announcement right now.',
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
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-3xl gap-0 overflow-y-auto p-0 sm:max-w-3xl">
        <DialogHeader className="space-y-2 border-b border-border/70 px-6 py-5">
          <DialogTitle>
            {isEditing ? 'Edit Announcement' : 'Create Announcement'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the message, category, and visibility settings before saving your changes.'
              : 'Draft a community update and decide whether it should go live right away.'}
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4 px-4 py-5 sm:px-6"
          onSubmit={handleSubmit(handleFormSubmit)}
        >
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="announcement-title">
              Title
            </label>
            <Input
              id="announcement-title"
              placeholder="Enter the announcement title"
              aria-invalid={Boolean(errors.title)}
              {...register('title')}
            />
            {errors.title ? (
              <p className="text-xs text-destructive" role="alert">
                {errors.title.message}
              </p>
            ) : null}
          </div>

          <Controller
            control={control}
            name="content"
            render={({ field }) => (
              <RichTextField
                id="announcement-content"
                label="Content"
                value={field.value}
                onChange={field.onChange}
                enableImageUpload={false}
                errorMessage={errors.content?.message}
                disabled={isSubmitting}
                placeholder="Write the full announcement content"
                helperText="Format the announcement with headings, lists, and links."
                uploadPathPrefix="announcements"
                limit={5000}
              />
            )}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) =>
                    field.onChange(value as AnnouncementCategory)
                  }
                >
                  <SelectTrigger aria-invalid={Boolean(errors.category)}>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {announcementCategoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.category ? (
              <p className="text-xs text-destructive" role="alert">
                {errors.category.message}
              </p>
            ) : null}
          </div>

          <Controller
            control={control}
            name="coverImageUrl"
            render={({ field }) => (
              <ImageUploadField
                id="announcement-cover-image-url"
                label="Cover Image URL"
                value={field.value}
                onChange={field.onChange}
                errorMessage={errors.coverImageUrl?.message}
                disabled={isSubmitting}
                uploadPathPrefix="announcements"
              />
            )}
          />

          <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-muted/25 p-4 sm:flex-row sm:gap-6">
            <Controller
              control={control}
              name="isPublished"
              render={({ field }) => (
                <div className="flex flex-1 items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Publish immediately</p>
                    <p className="text-xs leading-5 text-muted-foreground">
                      Makes the announcement live and may send a push
                      notification to members on mobile. Drafts are not sent.
                    </p>
                  </div>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    aria-label="Publish immediately"
                  />
                </div>
              )}
            />

            <Controller
              control={control}
              name="isPinned"
              render={({ field }) => (
                <div className="flex flex-1 items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Pin to top</p>
                    <p className="text-xs leading-5 text-muted-foreground">
                      Keep this announcement at the top of the public feed.
                    </p>
                  </div>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    aria-label="Pin to top"
                  />
                </div>
              )}
            />
          </div>

          <DialogFooter className="mt-5">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {isEditing ? 'Saving...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  {isEditing ? 'Save Changes' : 'Create'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
