'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Palette,
  Save,
  ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { explainGraphqlErrorMessage } from '@/react-query/graphql-error';
import {
  organizationsQueryKeys,
  useCreateOrganizationMutation,
} from '@/react-query/organizations/organizations-operations';

const schema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.'),
  slug: z
    .string()
    .trim()
    .min(2, 'Organization ID must be at least 2 characters.')
    .regex(
      /^[a-z0-9-]+$/,
      'Organization ID may only contain lowercase letters, numbers, and hyphens.',
    ),
  adminEmail: z.string().trim().email('Enter a valid email address.'),
  adminPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters.'),
  contactNumber: z.string().trim().max(40).optional(),
  address: z.string().trim().max(300).optional(),
  logoUrl: z.url({ error: 'Enter a valid URL.' }).or(z.literal('')),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Enter a valid hex color (e.g. #1B4FD8).')
    .or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

type CreateOrganizationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type FieldErrorProps = {
  children?: string;
  id: string;
};

function FieldError({ children, id }: FieldErrorProps) {
  if (!children) {
    return null;
  }

  return (
    <p className="text-xs text-destructive" id={id} role="alert">
      {children}
    </p>
  );
}

export function CreateOrganizationDialog({
  open,
  onOpenChange,
}: CreateOrganizationDialogProps) {
  const queryClient = useQueryClient();
  const createMutation = useCreateOrganizationMutation();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      slug: '',
      adminEmail: '',
      adminPassword: '',
      contactNumber: '',
      address: '',
      logoUrl: '',
      primaryColor: '#000000',
    },
  });

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setValue,
  } = form;
  const primaryColorValue = useWatch({ control, name: 'primaryColor' });
  const colorPickerValue = /^#[0-9A-Fa-f]{6}$/.test(primaryColorValue)
    ? primaryColorValue
    : '#000000';
  const organizationNameValue = useWatch({ control, name: 'name' }).trim();
  const slugValue = useWatch({ control, name: 'slug' }).trim();
  const adminEmailValue = useWatch({ control, name: 'adminEmail' }).trim();

  async function handleFormSubmit(values: FormValues) {
    try {
      await createMutation.mutateAsync({
        input: {
          name: values.name.trim(),
          slug: values.slug.trim(),
          adminEmail: values.adminEmail.trim(),
          adminPassword: values.adminPassword,
          contactNumber: values.contactNumber?.trim() || undefined,
          address: values.address?.trim() || undefined,
          logoUrl: values.logoUrl.trim() || undefined,
          primaryColor: values.primaryColor.trim() || undefined,
        },
      });

      await queryClient.invalidateQueries({
        queryKey: organizationsQueryKeys.all,
      });

      toast.success('Organization created successfully');
      onOpenChange(false);
      reset();
      setIsPasswordVisible(false);
    } catch (error) {
      toast.error(
        explainGraphqlErrorMessage(
          error instanceof Error ? error : undefined,
          'Unable to create the organization right now.',
        ),
      );
    }
  }

  const isSubmitting = createMutation.isPending;

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
          <div className="flex items-start gap-3 pr-8">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-muted">
              <Building2 className="size-5 text-muted-foreground" />
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <DialogTitle>Create Organization</DialogTitle>
              <DialogDescription>
                Set up a tenant profile, app branding, and the first admin
                account.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          className="flex flex-col gap-5 px-6 py-5"
          onSubmit={handleSubmit(handleFormSubmit)}
        >
          <div className="rounded-lg border border-border/70 bg-muted/20 p-4">
            <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="flex min-w-0 flex-col gap-1">
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  New tenant
                </p>
                <p className="truncate text-base font-medium text-foreground">
                  {organizationNameValue || 'Organization name'}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {slugValue ? `/${slugValue}` : 'Organization ID appears here'}
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-background px-3 py-2">
                <span
                  className="size-6 shrink-0 rounded-md border border-border/70"
                  style={{ backgroundColor: colorPickerValue }}
                  aria-hidden
                />
                <div className="flex min-w-0 flex-col">
                  <span className="text-xs text-muted-foreground">
                    Primary color
                  </span>
                  <span className="font-mono text-xs text-foreground">
                    {colorPickerValue.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <section className="flex flex-col gap-4 rounded-xl border border-border/70 px-4 py-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground">
                Organization details
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="organization-name">Name</Label>
                <Input
                  id="organization-name"
                  placeholder="e.g. Acme Inc."
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={
                    errors.name ? 'organization-name-error' : undefined
                  }
                  disabled={isSubmitting}
                  {...register('name')}
                />
                <FieldError id="organization-name-error">
                  {errors.name?.message}
                </FieldError>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="organization-slug">Organization ID</Label>
                <Input
                  id="organization-slug"
                  placeholder="e.g. org-bantigue"
                  aria-invalid={Boolean(errors.slug)}
                  aria-describedby={
                    errors.slug ? 'organization-slug-error' : 'organization-slug-help'
                  }
                  disabled={isSubmitting}
                  {...register('slug')}
                />
                {errors.slug ? (
                  <FieldError id="organization-slug-error">
                    {errors.slug.message}
                  </FieldError>
                ) : (
                  <p
                    className="text-xs leading-relaxed text-muted-foreground"
                    id="organization-slug-help"
                  >
                    Permanent lowercase ID using letters, numbers, and hyphens.
                  </p>
                )}
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="organization-contact">
                  Contact number
                  <span className="font-normal text-muted-foreground">
                    optional
                  </span>
                </Label>
                <Input
                  id="organization-contact"
                  placeholder="e.g. 09xx-xxx-xxxx"
                  aria-invalid={Boolean(errors.contactNumber)}
                  aria-describedby={
                    errors.contactNumber
                      ? 'organization-contact-error'
                      : undefined
                  }
                  disabled={isSubmitting}
                  {...register('contactNumber')}
                />
                <FieldError id="organization-contact-error">
                  {errors.contactNumber?.message}
                </FieldError>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="organization-address">
                  Address
                  <span className="font-normal text-muted-foreground">
                    optional
                  </span>
                </Label>
                <Input
                  id="organization-address"
                  placeholder="e.g. Org. Hall, Purok 1"
                  aria-invalid={Boolean(errors.address)}
                  aria-describedby={
                    errors.address ? 'organization-address-error' : undefined
                  }
                  disabled={isSubmitting}
                  {...register('address')}
                />
                <FieldError id="organization-address-error">
                  {errors.address?.message}
                </FieldError>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-4 rounded-xl border border-border/70 px-4 py-4">
            <div className="flex items-center gap-2">
              <Palette className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground">Branding</h3>
            </div>

            <Controller
              control={control}
              name="logoUrl"
              render={({ field }) => (
                <ImageUploadField
                  id="organization-logo-url"
                  label="Logo"
                  value={field.value}
                  onChange={field.onChange}
                  errorMessage={errors.logoUrl?.message}
                  disabled={isSubmitting}
                  uploadPathPrefix="organizations/logos"
                />
              )}
            />

            <Separator />

            <div className="flex flex-col gap-2">
              <Label htmlFor="organization-primary-color">Primary color</Label>
              <div className="grid gap-2 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                <Input
                  type="color"
                  value={colorPickerValue}
                  aria-label="Pick primary color"
                  className="h-10 w-full cursor-pointer p-1 sm:w-14"
                  disabled={isSubmitting}
                  onChange={(event) => {
                    setValue('primaryColor', event.target.value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                />
                <Input
                  id="organization-primary-color"
                  placeholder="#1B4FD8"
                  aria-invalid={Boolean(errors.primaryColor)}
                  aria-describedby={
                    errors.primaryColor
                      ? 'organization-primary-color-error'
                      : 'organization-primary-color-help'
                  }
                  className="font-mono"
                  disabled={isSubmitting}
                  {...register('primaryColor')}
                />
                <div className="flex items-center gap-2 rounded-md border border-border/70 bg-muted/20 px-3 py-2">
                  <span
                    className="size-5 shrink-0 rounded border border-border/70"
                    style={{ backgroundColor: colorPickerValue }}
                    aria-hidden
                  />
                  <span className="font-mono text-xs text-muted-foreground">
                    Preview
                  </span>
                </div>
              </div>
              {errors.primaryColor ? (
                <FieldError id="organization-primary-color-error">
                  {errors.primaryColor.message}
                </FieldError>
              ) : (
                <p
                  className="text-xs leading-relaxed text-muted-foreground"
                  id="organization-primary-color-help"
                >
                  Used by the mobile app and tenant controls for this organization.
                </p>
              )}
            </div>
          </section>

          <section className="flex flex-col gap-4 rounded-xl border border-border/70 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <KeyRound className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-medium text-foreground">
                  Admin account
                </h3>
              </div>
              <p className="hidden truncate text-xs text-muted-foreground sm:block">
                {adminEmailValue || 'First admin login'}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="organization-admin-email">Email</Label>
                <Input
                  id="organization-admin-email"
                  type="email"
                  placeholder="admin@organization.gov.ph"
                  aria-invalid={Boolean(errors.adminEmail)}
                  aria-describedby={
                    errors.adminEmail
                      ? 'organization-admin-email-error'
                      : undefined
                  }
                  disabled={isSubmitting}
                  {...register('adminEmail')}
                />
                <FieldError id="organization-admin-email-error">
                  {errors.adminEmail?.message}
                </FieldError>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="organization-admin-password">Password</Label>
                <div className="flex gap-2">
                  <Input
                    id="organization-admin-password"
                    type={isPasswordVisible ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    aria-invalid={Boolean(errors.adminPassword)}
                    aria-describedby={
                      errors.adminPassword
                        ? 'organization-admin-password-error'
                        : undefined
                    }
                    disabled={isSubmitting}
                    {...register('adminPassword')}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-lg"
                    aria-label={
                      isPasswordVisible ? 'Hide password' : 'Show password'
                    }
                    disabled={isSubmitting}
                    onClick={() =>
                      setIsPasswordVisible((currentValue) => !currentValue)
                    }
                  >
                    {isPasswordVisible ? <EyeOff /> : <Eye />}
                  </Button>
                </div>
                <FieldError id="organization-admin-password-error">
                  {errors.adminPassword?.message}
                </FieldError>
              </div>
            </div>
          </section>

          <DialogFooter className="-mx-6 -mb-5 border-t border-border/70 bg-muted/40 px-6 py-4">
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
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save data-icon="inline-start" />
                  Create organization
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
