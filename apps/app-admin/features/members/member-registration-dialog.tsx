'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Loader2, Save } from 'lucide-react';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSession } from '@/providers/AuthProvider';
import { useRegisterMemberMutation } from '@/react-query/auth/auth-operations';
import { dashboardQueryKeys } from '@/react-query/dashboard/dashboard-operations';
import {
  Gender,
  type RegisterMemberInput,
} from '@/react-query/generated__types';
import { explainGraphqlErrorMessage } from '@/react-query/graphql-error';
import { membersQueryKeys } from '@/react-query/members/members-operations';
import { getJwtTenantSlug } from '@/utils/jwt';
import { getPlainTextFromRichTextHtml } from '@/utils/rich-text';

import { memberGenderOptions } from './constants';

const NO_GENDER_VALUE = '__NONE__';

const memberRegistrationSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(2, 'First name must be at least 2 characters.')
      .max(80, 'First name must be 80 characters or fewer.'),
    lastName: z
      .string()
      .trim()
      .min(2, 'Last name must be at least 2 characters.')
      .max(80, 'Last name must be 80 characters or fewer.'),
    middleName: z
      .string()
      .trim()
      .max(80, 'Middle name must be 80 characters or fewer.'),
    birthdate: z.string().trim().min(1, 'Birthdate is required.'),
    gender: z.nativeEnum(Gender).optional(),
    email: z
      .string()
      .trim()
      .min(1, 'Email address is required.')
      .email('Enter a valid email address.')
      .max(160, 'Email address must be 160 characters or fewer.'),
    contactNumber: z
      .string()
      .trim()
      .min(7, 'Contact number must be at least 7 characters.')
      .max(40, 'Contact number must be 40 characters or fewer.'),
    address: z
      .string()
      .transform(getPlainTextFromRichTextHtml)
      .pipe(
        z
          .string()
          .min(5, 'Address must be at least 5 characters.')
          .max(240, 'Address must be 240 characters or fewer.'),
      ),
    purok: z.string().trim().max(80, 'Purok must be 80 characters or fewer.'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters.')
      .max(128, 'Password must be 128 characters or fewer.'),
    confirmPassword: z.string().min(1, 'Confirm the password.'),
  })
  .superRefine((values, context) => {
    const birthdate = new Date(`${values.birthdate}T12:00:00`);

    if (Number.isNaN(birthdate.getTime())) {
      context.addIssue({
        code: 'custom',
        message: 'Birthdate must be valid.',
        path: ['birthdate'],
      });
    } else if (birthdate > new Date()) {
      context.addIssue({
        code: 'custom',
        message: 'Birthdate cannot be in the future.',
        path: ['birthdate'],
      });
    }

    if (values.password !== values.confirmPassword) {
      context.addIssue({
        code: 'custom',
        message: 'Passwords do not match.',
        path: ['confirmPassword'],
      });
    }
  });

type MemberRegistrationValues = z.infer<typeof memberRegistrationSchema>;

function getDefaultValues(): MemberRegistrationValues {
  return {
    firstName: '',
    lastName: '',
    middleName: '',
    birthdate: '',
    gender: undefined,
    email: '',
    contactNumber: '',
    address: '',
    purok: '',
    password: '',
    confirmPassword: '',
  };
}

function toRegisterMemberInput(
  values: MemberRegistrationValues,
): Omit<RegisterMemberInput, 'organizationSlug'> {
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    middleName: values.middleName.trim() || undefined,
    birthdate: new Date(`${values.birthdate}T12:00:00`).toISOString(),
    gender: values.gender,
    email: values.email.trim().toLowerCase(),
    contactNumber: values.contactNumber.trim(),
    address: values.address.trim(),
    purok: values.purok.trim() || undefined,
    password: values.password,
    confirmPassword: values.confirmPassword,
  };
}

type MemberRegistrationDialogProps = {
  onOpenChange: (open: boolean) => void;
  onRegistered?: () => void;
  open: boolean;
};

export function MemberRegistrationDialog({
  onOpenChange,
  onRegistered,
  open,
}: MemberRegistrationDialogProps) {
  const queryClient = useQueryClient();
  const session = useSession();
  const tenantSlug =
    session.status === 'authenticated'
      ? (getJwtTenantSlug(session.accessToken) ?? '')
      : '';
  const registerMemberMutation = useRegisterMemberMutation();

  const form = useForm<MemberRegistrationValues>({
    resolver: zodResolver(memberRegistrationSchema),
    defaultValues: getDefaultValues(),
  });

  useEffect(() => {
    if (!open) {
      form.reset(getDefaultValues());
    }
  }, [form, open]);

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = form;

  const isSubmitting = registerMemberMutation.isPending;

  async function handleFormSubmit(values: MemberRegistrationValues) {
    try {
      await registerMemberMutation.mutateAsync({
        input: { ...toRegisterMemberInput(values), organizationSlug: tenantSlug },
      });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: membersQueryKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: dashboardQueryKeys.summary,
        }),
      ]);

      toast.success('Member registered successfully');
      onRegistered?.();
      onOpenChange(false);
      form.reset(getDefaultValues());
    } catch (error) {
      toast.error(
        explainGraphqlErrorMessage(
          error instanceof Error ? error : undefined,
          'Unable to register the member right now.',
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
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="shrink-0 space-y-2 border-b border-border/70 px-6 py-5">
          <DialogTitle>Register Member</DialogTitle>
          <DialogDescription>
            Create a member account and profile from the admin directory.
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={handleSubmit(handleFormSubmit)}
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  htmlFor="member-registration-first-name"
                >
                  First name
                </label>
                <Input
                  id="member-registration-first-name"
                  placeholder="Juan"
                  aria-invalid={Boolean(errors.firstName)}
                  {...register('firstName')}
                />
                {errors.firstName ? (
                  <p className="text-xs text-destructive" role="alert">
                    {errors.firstName.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  htmlFor="member-registration-middle-name"
                >
                  Middle name
                </label>
                <Input
                  id="member-registration-middle-name"
                  placeholder="Santos"
                  aria-invalid={Boolean(errors.middleName)}
                  {...register('middleName')}
                />
                {errors.middleName ? (
                  <p className="text-xs text-destructive" role="alert">
                    {errors.middleName.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  htmlFor="member-registration-last-name"
                >
                  Last name
                </label>
                <Input
                  id="member-registration-last-name"
                  placeholder="Dela Cruz"
                  aria-invalid={Boolean(errors.lastName)}
                  {...register('lastName')}
                />
                {errors.lastName ? (
                  <p className="text-xs text-destructive" role="alert">
                    {errors.lastName.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  htmlFor="member-registration-birthdate"
                >
                  Birthdate
                </label>
                <Input
                  id="member-registration-birthdate"
                  type="date"
                  max={format(new Date(), 'yyyy-MM-dd')}
                  aria-invalid={Boolean(errors.birthdate)}
                  {...register('birthdate')}
                />
                {errors.birthdate ? (
                  <p className="text-xs text-destructive" role="alert">
                    {errors.birthdate.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Gender</label>
                <Controller
                  control={control}
                  name="gender"
                  render={({ field }) => (
                    <Select
                      value={field.value ?? NO_GENDER_VALUE}
                      onValueChange={(value) => {
                        field.onChange(
                          value === NO_GENDER_VALUE
                            ? undefined
                            : (value as Gender),
                        );
                      }}
                    >
                      <SelectTrigger aria-invalid={Boolean(errors.gender)}>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_GENDER_VALUE}>
                          Not specified
                        </SelectItem>
                        {memberGenderOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.gender ? (
                  <p className="text-xs text-destructive" role="alert">
                    {errors.gender.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  htmlFor="member-registration-email"
                >
                  Email address
                </label>
                <Input
                  id="member-registration-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="member@organization.gov.ph"
                  aria-invalid={Boolean(errors.email)}
                  {...register('email')}
                />
                {errors.email ? (
                  <p className="text-xs text-destructive" role="alert">
                    {errors.email.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  htmlFor="member-registration-contact-number"
                >
                  Contact number
                </label>
                <Input
                  id="member-registration-contact-number"
                  inputMode="tel"
                  placeholder="09XXXXXXXXX"
                  aria-invalid={Boolean(errors.contactNumber)}
                  {...register('contactNumber')}
                />
                {errors.contactNumber ? (
                  <p className="text-xs text-destructive" role="alert">
                    {errors.contactNumber.message}
                  </p>
                ) : null}
              </div>
            </div>

            <Controller
              control={control}
              name="address"
              render={({ field }) => (
                <RichTextField
                  id="member-registration-address"
                  label="Address"
                  value={field.value}
                  onChange={field.onChange}
                  enableImageUpload={false}
                  placeholder="Enter the full address"
                  errorMessage={errors.address?.message}
                  disabled={isSubmitting}
                  limit={240}
                />
              )}
            />

            <div className="space-y-2">
              <label
                className="text-sm font-medium"
                htmlFor="member-registration-purok"
              >
                Purok
              </label>
              <Input
                id="member-registration-purok"
                placeholder="Optional purok or zone"
                aria-invalid={Boolean(errors.purok)}
                {...register('purok')}
              />
              {errors.purok ? (
                <p className="text-xs text-destructive" role="alert">
                  {errors.purok.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  htmlFor="member-registration-password"
                >
                  Password
                </label>
                <Input
                  id="member-registration-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Enter a secure password"
                  aria-invalid={Boolean(errors.password)}
                  {...register('password')}
                />
                {errors.password ? (
                  <p className="text-xs text-destructive" role="alert">
                    {errors.password.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  htmlFor="member-registration-confirm-password"
                >
                  Confirm password
                </label>
                <Input
                  id="member-registration-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Re-enter the password"
                  aria-invalid={Boolean(errors.confirmPassword)}
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword ? (
                  <p className="text-xs text-destructive" role="alert">
                    {errors.confirmPassword.message}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <DialogFooter className="mx-0 mb-0 shrink-0 border-t border-border/70 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  Register Member
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
