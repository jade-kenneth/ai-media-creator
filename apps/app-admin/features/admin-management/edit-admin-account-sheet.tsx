'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, Loader2, Save, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  type AdminAccountRecord,
  adminAccountsQueryKeys,
  useUpdateAdminAccountMutation,
} from '@/react-query/admin-management/admin-management-operations';
import type { OrganizationRecord } from '@/react-query/organizations/organizations-operations';
import { explainGraphqlErrorMessage } from '@/react-query/graphql-error';

const schema = z.object({
  firstName: z.string().trim().min(1, 'First name is required.'),
  lastName: z.string().trim().min(1, 'Last name is required.'),
  position: z.string().trim().min(1, 'Position is required.'),
  organizationId: z.string().trim().min(1, 'Select a organization.'),
  password: z
    .string()
    .refine((value) => value.length === 0 || value.length >= 8, {
      message: 'Password must be at least 8 characters.',
    }),
});

type FormValues = z.infer<typeof schema>;

type EditAdminAccountSheetProps = {
  adminAccount: AdminAccountRecord | null;
  organizations: OrganizationRecord[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function getDefaultValues(adminAccount: AdminAccountRecord | null): FormValues {
  return {
    firstName: adminAccount?.firstName ?? '',
    lastName: adminAccount?.lastName ?? '',
    position: adminAccount?.position ?? '',
    organizationId: adminAccount?.organizationId ?? '',
    password: '',
  };
}

function FieldError({ children, id }: { children?: string; id: string }) {
  if (!children) return null;

  return (
    <p className="text-xs text-destructive" id={id} role="alert">
      {children}
    </p>
  );
}

export function EditAdminAccountSheet({
  adminAccount,
  organizations,
  open,
  onOpenChange,
}: EditAdminAccountSheetProps) {
  const queryClient = useQueryClient();
  const updateMutation = useUpdateAdminAccountMutation();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: getDefaultValues(adminAccount),
  });

  useEffect(() => {
    form.reset(getDefaultValues(adminAccount));
    setIsPasswordVisible(false);
  }, [adminAccount, form, open]);

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = form;

  async function handleFormSubmit(values: FormValues) {
    if (!adminAccount) return;

    try {
      await updateMutation.mutateAsync({
        id: adminAccount.id,
        input: {
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          position: values.position.trim(),
          organizationId: values.organizationId,
          password: values.password.trim() || undefined,
        },
      });

      await queryClient.invalidateQueries({
        queryKey: adminAccountsQueryKeys.all,
      });

      toast.success('Admin account updated successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error(
        explainGraphqlErrorMessage(
          error instanceof Error ? error : undefined,
          'Unable to update the admin account right now.',
        ),
      );
    }
  }

  const isSubmitting = updateMutation.isPending;

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (isSubmitting) return;
        onOpenChange(nextOpen);
      }}
    >
      <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-border/70 px-6 py-5">
          <div className="flex items-start gap-3 pr-8">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-muted">
              <ShieldCheck className="size-5 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <SheetTitle>Edit Admin Account</SheetTitle>
              <SheetDescription>
                Update role details, assigned organization, or reset the password.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form
          className="flex flex-col gap-5 px-6 py-5"
          onSubmit={handleSubmit(handleFormSubmit)}
        >
          <section className="space-y-4 rounded-xl border border-border/70 px-4 py-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                {adminAccount?.email ?? '—'}
              </div>
              <p className="text-xs text-muted-foreground">
                Email stays fixed to avoid identity and login confusion.
              </p>
            </div>
          </section>

          <section className="space-y-4 rounded-xl border border-border/70 px-4 py-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Profile details
              </p>
              <p className="text-sm text-muted-foreground">
                Keep names and position aligned with the assigned organization role.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-admin-first-name">First name</Label>
                <Input
                  id="edit-admin-first-name"
                  aria-invalid={Boolean(errors.firstName)}
                  aria-describedby={
                    errors.firstName ? 'edit-admin-first-name-error' : undefined
                  }
                  disabled={isSubmitting}
                  {...register('firstName')}
                />
                <FieldError id="edit-admin-first-name-error">
                  {errors.firstName?.message}
                </FieldError>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-admin-last-name">Last name</Label>
                <Input
                  id="edit-admin-last-name"
                  aria-invalid={Boolean(errors.lastName)}
                  aria-describedby={
                    errors.lastName ? 'edit-admin-last-name-error' : undefined
                  }
                  disabled={isSubmitting}
                  {...register('lastName')}
                />
                <FieldError id="edit-admin-last-name-error">
                  {errors.lastName?.message}
                </FieldError>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-admin-position">Position in organization</Label>
              <Input
                id="edit-admin-position"
                aria-invalid={Boolean(errors.position)}
                aria-describedby={
                  errors.position ? 'edit-admin-position-error' : undefined
                }
                disabled={isSubmitting}
                {...register('position')}
              />
              <FieldError id="edit-admin-position-error">
                {errors.position?.message}
              </FieldError>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-admin-organization">Organization</Label>
              <Controller
                control={control}
                name="organizationId"
                render={({ field }) => (
                  <Select
                    disabled={isSubmitting}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <SelectTrigger
                      id="edit-admin-organization"
                      aria-invalid={Boolean(errors.organizationId)}
                    >
                      <SelectValue placeholder="Select a organization" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map((organization) => (
                        <SelectItem key={organization.id} value={organization.id}>
                          {organization.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError id="edit-admin-organization-error">
                {errors.organizationId?.message}
              </FieldError>
            </div>
          </section>

          <section className="space-y-4 rounded-xl border border-border/70 px-4 py-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Password reset
              </p>
              <p className="text-sm text-muted-foreground">
                Leave this blank to keep the current password.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-admin-password">New password</Label>
              <div className="relative">
                <Input
                  id="edit-admin-password"
                  type={isPasswordVisible ? 'text' : 'password'}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={
                    errors.password ? 'edit-admin-password-error' : undefined
                  }
                  disabled={isSubmitting}
                  placeholder="Optional"
                  className="pr-12"
                  {...register('password')}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="absolute top-1/2 right-1 -translate-y-1/2"
                  onClick={() => setIsPasswordVisible((value) => !value)}
                >
                  {isPasswordVisible ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                  <span className="sr-only">
                    {isPasswordVisible ? 'Hide password' : 'Show password'}
                  </span>
                </Button>
              </div>
              <FieldError id="edit-admin-password-error">
                {errors.password?.message}
              </FieldError>
            </div>
          </section>

          <Separator />

          <SheetFooter className="px-0 pt-0">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !adminAccount}>
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
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
