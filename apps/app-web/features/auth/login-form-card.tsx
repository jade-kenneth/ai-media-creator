'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, LoaderCircle, ShieldCheck } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSession } from '@/providers/AuthProvider';
import { store } from '@/providers/AuthProvider/store';
import { useLoginMutation } from '@/react-query/auth/auth-operations';
import { UserRole } from '@/react-query/generated__types';
import {
  type AuthRedirectReason,
  DEFAULT_AUTHENTICATED_REDIRECT_PATH,
  getPostLoginRedirectPath,
  redirectAfterLogin,
  redirectToLogin,
  redirectToPath,
} from '@/react-query/session';
import { cn } from '@/utils';

type LoginFormValues = {
  email: string;
  password: string;
};

const ALLOWED_ROLES = [UserRole.Admin, UserRole.SuperAdmin];

export function LoginFormCard() {
  const searchParams = useSearchParams();
  const session = useSession();
  const t = useTranslations('Login');
  const loginSchema = useMemo(
    () =>
      z.object({
        email: z.email(t('validEmail')).min(1, t('emailRequired')),
        password: z.string().refine((value) => value.trim().length > 0, {
          message: t('passwordRequired'),
        }),
      }),
    [t],
  );
  const [invalidCredentialsError, setInvalidCredentialsError] = useState<
    string | null
  >(null);
  const destination = getPostLoginRedirectPath(searchParams);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const loginMutation = useLoginMutation({
    onSuccess: async (data) => {
      const isAllowedRole = ALLOWED_ROLES.includes(data.login.user.role);

      if (!isAllowedRole || !data.login.user.isActive) {
        await store.clearSession();
        redirectToLogin('unauthorized');
        return;
      }

      await store.set({
        accessToken: data.login.accessToken,
        refreshToken: data.login.refreshToken,
        role: data.login.user.role,
      });

      if (
        data.login.user.role === UserRole.SuperAdmin &&
        destination === DEFAULT_AUTHENTICATED_REDIRECT_PATH
      ) {
        redirectToPath('/super-admin/dashboard');
        return;
      }

      redirectAfterLogin(destination);
    },
    onError: (error) => {
      if (error.name === 'InvalidCredentialsError') {
        setInvalidCredentialsError(t('invalidCredentials'));
      }
    },
  });

  useEffect(() => {
    if (session.status !== 'authenticated') return;
    redirectAfterLogin(destination);
  }, [destination, session.status]);

  const reason = searchParams.get('reason') as AuthRedirectReason | null;
  const {
    formState: { errors },
    register,
  } = form;
  const isSubmitting = loginMutation.isPending || session.status === 'loading';

  function handleSubmit(values: LoginFormValues) {
    setInvalidCredentialsError(null);
    loginMutation.mutate({
      input: {
        email: values.email.trim(),
        password: values.password,
      },
    });
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Admin sign in</CardTitle>
        <CardDescription>{t('authorizedAccount')}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div aria-live="polite" className="sr-only">
          {isSubmitting
            ? t('signingInSecurely')
            : errors.email || errors.password
              ? t('reviewFields')
              : ''}
        </div>

        <Notice reason={reason} />

        {invalidCredentialsError ? (
          <div
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {invalidCredentialsError}
          </div>
        ) : null}

        <form
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit(handleSubmit)}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">{t('email')}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              inputMode="email"
              placeholder="admin@example.com"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : undefined}
              {...register('email')}
            />
            {errors.email ? (
              <p
                id="email-error"
                role="alert"
                className="text-xs text-destructive"
              >
                {errors.email.message}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">{t('password')}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder={t('enterPassword')}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'password-error' : undefined}
              {...register('password')}
            />
            {errors.password ? (
              <p
                id="password-error"
                role="alert"
                className="text-xs text-destructive"
              >
                {errors.password.message}
              </p>
            ) : null}
          </div>

          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <LoaderCircle
                  data-icon="inline-start"
                  className="animate-spin"
                />
                {t('signingIn')}
              </>
            ) : (
              <>
                {t('signIn')}
                <ArrowRight data-icon="inline-end" />
              </>
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        <ShieldCheck aria-hidden="true" className="mr-2" />
        {t('authorizedOnly')}
      </CardFooter>
    </Card>
  );
}

function Notice({ reason }: { reason: AuthRedirectReason | null }) {
  const t = useTranslations('Login');
  if (!reason) return null;

  const content = {
    'session-expired': t('noticeSessionExpired'),
    unauthenticated: t('noticeUnauthenticated'),
    unauthorized: t('noticeUnauthorized'),
    'signed-out': t('noticeSignedOut'),
    duplicate_session: t('noticeDuplicateSession'),
    'server-error': t('noticeServerError'),
    'not-found': t('noticeNotFound'),
    login: t('noticeLogin'),
  }[reason];
  const isError =
    reason === 'unauthorized' ||
    reason === 'duplicate_session' ||
    reason === 'server-error';

  return (
    <div
      role="status"
      className={cn(
        'rounded-md border bg-muted px-4 py-3 text-sm text-muted-foreground',
        isError && 'border-destructive/30 bg-destructive/10 text-destructive',
      )}
    >
      {content}
    </div>
  );
}
