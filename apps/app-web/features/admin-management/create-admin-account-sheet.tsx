'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, Loader2, Save, ShieldPlus } from 'lucide-react';
import { useState } from 'react';
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
  adminAccountsQueryKeys,
  useCreateAdminAccountMutation,
} from '@/react-query/admin-management/admin-management-operations';
import type { OrganizationRecord } from '@/react-query/organizations/organizations-operations';
import { explainGraphqlErrorMessage } from '@/react-query/graphql-error';

const schema = z.object({
  firstName: z.string().trim().min(1, 'First name is required.'),
  lastName: z.string().trim().min(1, 'Last name is required.'),
  email: z.string().trim().email('Enter a valid email address.'),
  position: z.string().trim().min(1, 'Position is required.'),
  organizationId: z.string().trim().min(1, 'Select a organization.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

type FormValues = z.infer<typeof schema>;

type CreateAdminAccountSheetProps = {
  organizations: OrganizationRecord[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function FieldError({ children, id }: { children?: string; id: string }) {
  if (!children) return null;

  return (
    <p className="text-xs text-destructive" id={id} role="alert">
      {children}
    </p>
  );
}

export function CreateAdminAccountSheet({
  organizations,
  open,
  onOpenChange,
}: CreateAdminAccountSheetProps) {
  const queryClient = useQueryClient();
  const createMutation = useCreateAdminAccountMutation();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      position: '',
      organizationId: '',
      password: '',
    },
  });

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = form;

  async function handleFormSubmit(values: FormValues) {
    try {
      await createMutation.mutateAsync({
        input: {
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          email: values.email.trim(),
          position: values.position.trim(),
          organizationId: values.organizationId,
          password: values.password,
        },
      });

      await queryClient.invalidateQueries({
        queryKey: adminAccountsQueryKeys.all,
      });

      toast.success('Admin account created successfully');
      onOpenChange(false);
      reset();
      setIsPasswordVisible(false);
    } catch (error) {
      toast.error(
        explainGraphqlErrorMessage(
          error instanceof Error ? error : undefined,
          'Unable to create the admin account right now.',
        ),
      );
    }
  }

  const isSubmitting = createMutation.isPending;

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
              <ShieldPlus className="size-5 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <SheetTitle>Create Admin Account</SheetTitle>
              <SheetDescription>
                Add a organization admin with a verified profile and ready-to-use
                access.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form
          className="flex flex-col gap-5 px-6 py-5"
          onSubmit={handleSubmit(handleFormSubmit)}
        >
          <section className="space-y-4 rounded-xl border border-border/70 px-4 py-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Profile details
              </p>
              <p className="text-sm text-muted-foreground">
                These details appear in the superadmin account roster.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="create-admin-first-name">First name</Label>
                <Input
                  id="create-admin-first-name"
                  aria-invalid={Boolean(errors.firstName)}
                  aria-describedby={
                    errors.firstName
                      ? 'create-admin-first-name-error'
                      : undefined
                  }
                  disabled={isSubmitting}
                  placeholder="e.g. Maria"
                  {...register('firstName')}
                />
                <FieldError id="create-admin-first-name-error">
                  {errors.firstName?.message}
                </FieldError>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-admin-last-name">Last name</Label>
                <Input
                  id="create-admin-last-name"
                  aria-invalid={Boolean(errors.lastName)}
                  aria-describedby={
                    errors.lastName ? 'create-admin-last-name-error' : undefined
                  }
                  disabled={isSubmitting}
                  placeholder="e.g. Santos"
                  {...register('lastName')}
                />
                <FieldError id="create-admin-last-name-error">
                  {errors.lastName?.message}
                </FieldError>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-admin-position">
                Position in organization
              </Label>
              <Input
                id="create-admin-position"
                aria-invalid={Boolean(errors.position)}
                aria-describedby={
                  errors.position ? 'create-admin-position-error' : undefined
                }
                disabled={isSubmitting}
                placeholder="e.g. Organization Secretary"
                {...register('position')}
              />
              <FieldError id="create-admin-position-error">
                {errors.position?.message}
              </FieldError>
            </div>
          </section>

          <section className="space-y-4 rounded-xl border border-border/70 px-4 py-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Access details
              </p>
              <p className="text-sm text-muted-foreground">
                Email and password are used for admin sign-in.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-admin-email">Email</Label>
              <Input
                id="create-admin-email"
                type="email"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={
                  errors.email ? 'create-admin-email-error' : undefined
                }
                disabled={isSubmitting}
                placeholder="name@organization.gov.ph"
                {...register('email')}
              />
              <FieldError id="create-admin-email-error">
                {errors.email?.message}
              </FieldError>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-admin-organization">Organization</Label>
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
                      id="create-admin-organization"
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
              <FieldError id="create-admin-organization-error">
                {errors.organizationId?.message}
              </FieldError>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-admin-password">Password</Label>
              <div className="relative">
                <Input
                  id="create-admin-password"
                  type={isPasswordVisible ? 'text' : 'password'}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={
                    errors.password ? 'create-admin-password-error' : undefined
                  }
                  disabled={isSubmitting}
                  placeholder="At least 8 characters"
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
              <FieldError id="create-admin-password-error">
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
              <Button
                type="submit"
                disabled={isSubmitting || organizations.length === 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    Create admin
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
