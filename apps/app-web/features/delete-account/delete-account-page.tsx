'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  UserX,
} from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSubmitAccountDeletionRequestMutation } from '@/react-query/account-deletion-requests/account-deletion-requests-operations';
import { useOrganizationsQuery } from '@/react-query/organizations/organizations-operations';
import { explainGraphqlErrorMessage } from '@/react-query/graphql-error';

const deleteAccountSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required'),
  email: z.string().trim().email('Enter a valid email address'),
  organizationId: z.string().min(1, 'Please select your organization'),
});

type DeleteAccountFormValues = z.infer<typeof deleteAccountSchema>;

export function DeleteAccountPageView() {
  const organizationsQuery = useOrganizationsQuery({
    filter: {
      isActive: true,
    },
  });
  const submitMutation = useSubmitAccountDeletionRequestMutation();

  const form = useForm<DeleteAccountFormValues>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: {
      fullName: '',
      email: '',
      organizationId: '',
    },
  });

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = form;

  async function handleFormSubmit(values: DeleteAccountFormValues) {
    try {
      await submitMutation.mutateAsync({
        input: {
          fullName: values.fullName.trim(),
          email: values.email.trim(),
          organizationId: values.organizationId,
        },
      });
    } catch {
      // Error state is rendered below from mutation.error.
    }
  }

  const submissionError = submitMutation.isError
    ? explainGraphqlErrorMessage(
        submitMutation.error,
        'Unable to submit your deletion request right now.',
      )
    : null;
  const organizations = organizationsQuery.data?.organizations ?? [];
  const isSubmitting = submitMutation.isPending;
  const isSuccess = submitMutation.isSuccess;

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#f8fafc]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#dbeafe_0%,rgba(219,234,254,0.2)_32%,transparent_65%)]" />
      <div className="absolute inset-x-0 top-0 h-72 bg-[linear-gradient(180deg,rgba(15,23,42,0.04)_0%,rgba(248,250,252,0)_100%)]" />

      <section className="relative z-10 flex min-h-dvh items-center justify-center px-4 py-10">
        <Card className="w-full max-w-2xl border-slate-200 bg-white/95 shadow-[0_32px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur">
          {isSuccess ? (
            <CardContent className="space-y-6 px-6 py-10 sm:px-8">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700">
                <CheckCircle2 className="size-7" />
              </div>
              <div className="space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
                  Request submitted
                </h1>
                <p className="text-sm leading-6 text-slate-600">
                  Your account deletion request has been recorded. Our team will
                  review it within a few business days.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
                Once approved, your user account and associated access will be
                permanently deleted.
              </div>
            </CardContent>
          ) : (
            <>
              <CardHeader className="space-y-4 border-b border-slate-200 px-6 py-6 sm:px-8">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                  <UserX className="size-6" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-2xl tracking-tight text-slate-950">
                    Request Account Deletion
                  </CardTitle>
                  <CardDescription className="max-w-xl text-sm leading-6 text-slate-600">
                    Submit this form if you want your user account and data
                    removed from the system. Use the same full name and email
                    address registered on your account.
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 px-6 py-6 sm:px-8">
                <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-950">
                        This action is irreversible.
                      </p>
                      <p className="text-sm leading-6 text-slate-600">
                        Once approved, your account and all associated data will
                        be permanently deleted.
                      </p>
                    </div>
                  </div>
                </div>

                <form
                  className="space-y-5"
                  onSubmit={handleSubmit(handleFormSubmit)}
                >
                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium text-slate-900"
                      htmlFor="delete-account-full-name"
                    >
                      Full Name
                    </label>
                    <Input
                      id="delete-account-full-name"
                      placeholder="Enter your full name"
                      aria-invalid={Boolean(errors.fullName)}
                      className="h-11 rounded-2xl border-slate-200"
                      {...register('fullName')}
                    />
                    {errors.fullName ? (
                      <p className="text-xs text-destructive" role="alert">
                        {errors.fullName.message}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500">
                        This should match the name on your registered account.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium text-slate-900"
                      htmlFor="delete-account-email"
                    >
                      Registered Email Address
                    </label>
                    <Input
                      id="delete-account-email"
                      type="email"
                      inputMode="email"
                      placeholder="you@example.com"
                      aria-invalid={Boolean(errors.email)}
                      className="h-11 rounded-2xl border-slate-200"
                      {...register('email')}
                    />
                    {errors.email ? (
                      <p className="text-xs text-destructive" role="alert">
                        {errors.email.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-900">
                      Organization
                    </label>
                    <Controller
                      control={control}
                      name="organizationId"
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={organizationsQuery.isLoading}
                        >
                          <SelectTrigger
                            className="h-11 rounded-2xl border-slate-200"
                            aria-invalid={Boolean(errors.organizationId)}
                          >
                            <SelectValue
                              placeholder={
                                organizationsQuery.isLoading
                                  ? 'Loading organizations...'
                                  : 'Select your organization'
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {organizations.map((organization) => (
                              <SelectItem
                                key={organization.id}
                                value={organization.id}
                              >
                                {organization.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.organizationId ? (
                      <p className="text-xs text-destructive" role="alert">
                        {errors.organizationId.message}
                      </p>
                    ) : organizationsQuery.isError ? (
                      <p className="text-xs text-destructive" role="alert">
                        {explainGraphqlErrorMessage(
                          organizationsQuery.error,
                          'Unable to load the organization list right now.',
                        )}
                      </p>
                    ) : null}
                  </div>

                  {submissionError ? (
                    <div
                      role="alert"
                      className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                    >
                      {submissionError}
                    </div>
                  ) : null}

                  <Button
                    type="submit"
                    size="lg"
                    variant="destructive"
                    className="h-11 w-full rounded-2xl"
                    disabled={isSubmitting || organizationsQuery.isLoading}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Submitting request...
                      </>
                    ) : (
                      <>
                        Submit Deletion Request
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </section>
    </main>
  );
}
