'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Building2, Check, Loader2, Save } from 'lucide-react';
import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { ImageUploadField } from '@/components/core/image-upload-field';
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
import { Switch } from '@/components/ui/switch';
import { explainGraphqlErrorMessage } from '@/react-query/graphql-error';
import {
  type OrganizationRecord,
  organizationsQueryKeys,
  useUpdateOrganizationMutation,
} from '@/react-query/organizations/organizations-operations';
import { FEATURE_FLAGS, type FeatureFlag } from '@/utils/feature-flags';

const schema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.'),
  contactNumber: z.string().trim().max(40).optional(),
  address: z.string().trim().max(300).optional(),
  logoUrl: z.url({ error: 'Enter a valid URL.' }).or(z.literal('')),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Enter a valid hex color (e.g. #1B4FD8).')
    .or(z.literal('')),
  features: z.array(z.string()),
});

type FormValues = z.infer<typeof schema>;

function getDefaultValues(organization?: OrganizationRecord | null): FormValues {
  return {
    name: organization?.name ?? '',
    contactNumber: organization?.contactNumber ?? '',
    address: organization?.address ?? '',
    logoUrl: organization?.logoUrl ?? '',
    primaryColor: organization?.primaryColor ?? '#000000',
    features: organization?.features ?? [],
  };
}

const FEATURE_TOGGLES: Array<{
  flag: FeatureFlag;
  label: string;
  description: string;
}> = [
  {
    flag: FEATURE_FLAGS.MOBILE_AUTH,
    label: 'Mobile Authentication',
    description: 'Enable member login, registration, and pending status flow.',
  },
  {
    flag: FEATURE_FLAGS.MEMBER_PROFILE,
    label: 'Member Profile',
    description: 'Show Profile tab and profile editing on mobile.',
  },
  {
    flag: FEATURE_FLAGS.MOBILE_REQUESTS,
    label: 'Mobile Requests',
    description: 'Show request list and request creation on mobile.',
  },
  {
    flag: FEATURE_FLAGS.OFFICIALS,
    label: 'Officials',
    description: 'Show Officials in the admin sidebar and mobile tab bar.',
  },
  {
    flag: FEATURE_FLAGS.ADMIN_MEMBERS,
    label: 'Admin Members',
    description: 'Show Members page and sidebar navigation item.',
  },
  {
    flag: FEATURE_FLAGS.ADMIN_REQUESTS,
    label: 'Admin Requests',
    description: 'Show Requests page and sidebar navigation item.',
  },
  {
    flag: FEATURE_FLAGS.ADMIN_GALLERY,
    label: 'Admin Gallery',
    description: 'Show the Gallery page and sidebar navigation item in the admin dashboard.',
  },
  {
    flag: FEATURE_FLAGS.MOBILE_GALLERY,
    label: 'Mobile Gallery',
    description: 'Show the Gallery tab in the mobile app.',
  },
  {
    flag: FEATURE_FLAGS.COMMUNITY_POLLS,
    label: 'Community Polls',
    description: 'Allow admins to create polls and members to vote via the mobile app.',
  },
];

type UpdateOrganizationDialogProps = {
  organization: OrganizationRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function UpdateOrganizationDialog({
  organization,
  open,
  onOpenChange,
}: UpdateOrganizationDialogProps) {
  const queryClient = useQueryClient();
  const updateMutation = useUpdateOrganizationMutation();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: getDefaultValues(organization),
  });

  useEffect(() => {
    form.reset(getDefaultValues(organization));
  }, [organization, form, open]);

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    setValue,
  } = form;
  const primaryColorValue = useWatch({ control, name: 'primaryColor' });
  const selectedFeatures = useWatch({ control, name: 'features' });
  const colorPickerValue = /^#[0-9A-Fa-f]{6}$/.test(primaryColorValue)
    ? primaryColorValue
    : '#000000';

  async function handleFormSubmit(values: FormValues) {
    if (!organization) return;

    try {
      await updateMutation.mutateAsync({
        id: organization.id,
        input: {
          name: values.name.trim(),
          contactNumber: values.contactNumber?.trim() || undefined,
          address: values.address?.trim() || undefined,
          logoUrl: values.logoUrl.trim() || undefined,
          primaryColor: values.primaryColor.trim() || undefined,
          features: values.features,
        },
      });

      await queryClient.invalidateQueries({
        queryKey: organizationsQueryKeys.all,
      });

      toast.success('Organization updated successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error(
        explainGraphqlErrorMessage(
          error instanceof Error ? error : undefined,
          'Unable to update the organization right now.',
        ),
      );
    }
  }

  const isSubmitting = updateMutation.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isSubmitting) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-4xl gap-0 overflow-y-auto p-0 sm:max-w-4xl">
        <DialogHeader className="border-b border-border/70 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-muted">
              <Building2 className="size-4 text-muted-foreground" />
            </div>
            <div className="space-y-0.5">
              <DialogTitle className="text-base">Edit Organization</DialogTitle>
              <DialogDescription className="text-xs">
                {organization?.name ?? 'Update details and save changes.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          className="space-y-5 px-6 py-5"
          onSubmit={handleSubmit(handleFormSubmit)}
        >
          {/* Basic Information */}
          <div className="space-y-4 rounded-xl border border-border/70 px-4 py-4">
            <p className="text-sm font-medium text-foreground">Basic information</p>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="edit-organization-name">
                Name
              </label>
              <Input
                id="edit-organization-name"
                placeholder="e.g. Acme Inc."
                aria-invalid={Boolean(errors.name)}
                {...register('name')}
              />
              {errors.name ? (
                <p className="text-xs text-destructive" role="alert">
                  {errors.name.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  htmlFor="edit-organization-contact"
                >
                  Contact number
                  <span className="ml-1 font-normal text-muted-foreground">(optional)</span>
                </label>
                <Input
                  id="edit-organization-contact"
                  placeholder="e.g. 09xx-xxx-xxxx"
                  aria-invalid={Boolean(errors.contactNumber)}
                  {...register('contactNumber')}
                />
                {errors.contactNumber ? (
                  <p className="text-xs text-destructive" role="alert">
                    {errors.contactNumber.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  htmlFor="edit-organization-address"
                >
                  Address
                  <span className="ml-1 font-normal text-muted-foreground">(optional)</span>
                </label>
                <Input
                  id="edit-organization-address"
                  placeholder="e.g. Org. Hall, Purok 1"
                  aria-invalid={Boolean(errors.address)}
                  {...register('address')}
                />
                {errors.address ? (
                  <p className="text-xs text-destructive" role="alert">
                    {errors.address.message}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {/* Branding */}
          <div className="space-y-4 rounded-xl border border-border/70 px-4 py-4">
            <p className="text-sm font-medium text-foreground">Branding</p>
            <Controller
              control={control}
              name="logoUrl"
              render={({ field }) => (
                <ImageUploadField
                  id="edit-organization-logo-url"
                  label="Logo"
                  value={field.value}
                  onChange={field.onChange}
                  errorMessage={errors.logoUrl?.message}
                  disabled={isSubmitting}
                  uploadPathPrefix="organizations/logos"
                />
              )}
            />

            <div className="space-y-2">
              <label
                className="text-sm font-medium"
                htmlFor="edit-organization-primary-color"
              >
                Primary color
              </label>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Input
                    type="color"
                    value={colorPickerValue}
                    aria-label="Pick primary color"
                    className="h-10 w-12 cursor-pointer rounded-md border border-border/70 p-1"
                    onChange={(event) => {
                      setValue('primaryColor', event.target.value, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                  />
                </div>
                <Input
                  id="edit-organization-primary-color"
                  placeholder="#1B4FD8"
                  aria-invalid={Boolean(errors.primaryColor)}
                  className="font-mono"
                  {...register('primaryColor')}
                />
                {/* Live preview strip */}
                <div
                  className="h-10 w-10 shrink-0 rounded-md border border-border/50 shadow-sm transition-colors"
                  style={{ backgroundColor: colorPickerValue }}
                  aria-hidden
                />
              </div>
              {errors.primaryColor ? (
                <p className="text-xs text-destructive" role="alert">
                  {errors.primaryColor.message}
                </p>
              ) : null}
            </div>
          </div>

          {/* Feature Flags */}
          <div className="space-y-3 rounded-xl border border-border/70 px-4 py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">Feature flags</p>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {(selectedFeatures ?? []).length} / {FEATURE_TOGGLES.length} on
              </span>
            </div>
            <div className="space-y-2">
              {FEATURE_TOGGLES.map((item) => {
                const isEnabled = (selectedFeatures ?? []).includes(item.flag);

                return (
                  <div
                    key={item.flag}
                    className={[
                      'flex items-start justify-between gap-4 rounded-lg border px-3 py-3 transition-colors',
                      isEnabled
                        ? 'border-primary/20 bg-primary/5'
                        : 'border-border/60 bg-transparent',
                    ].join(' ')}
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className={[
                          'text-sm font-medium leading-snug',
                          isEnabled ? 'text-foreground' : 'text-muted-foreground',
                        ].join(' ')}>
                          {item.label}
                        </p>
                        {isEnabled && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                            <Check className="size-2.5" />
                            On
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                      <p className="truncate font-mono text-[10px] text-muted-foreground/60">
                        {item.flag}
                      </p>
                    </div>
                    <Switch
                      checked={isEnabled}
                      disabled={isSubmitting}
                      onCheckedChange={(nextChecked) => {
                        const nextFeatures = nextChecked
                          ? [...(selectedFeatures ?? []), item.flag]
                          : (selectedFeatures ?? []).filter(
                              (flag) => flag !== item.flag,
                            );
                        setValue('features', nextFeatures, {
                          shouldDirty: true,
                        });
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter className="border-t border-border/70 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !organization}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  Save changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
