'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import { useSession } from '@/providers/AuthProvider';
import { store } from '@/providers/AuthProvider/store';
import { useLoginMutation } from '@/react-query/auth/auth-operations';
import { UserRole } from '@/react-query/generated__types';
import {
  AuthRedirectReason,
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

  const [showPassword, setShowPassword] = useState(false);
  const [invalidCredentialsError, setInvalidCredentialsError] = useState<
    string | null
  >(null);
  const destination = getPostLoginRedirectPath(searchParams);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
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
        redirectToPath('/super-admin/organizations');
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

  const reason = searchParams.get('reason') as AuthRedirectReason;

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
    <Card className="w-full max-w-md border border-slate-200 bg-white/90 text-slate-950 shadow-[0_30px_70px_-36px_rgba(15,23,42,0.35)] backdrop-blur-xl">
      <CardHeader className="space-y-1 border-b border-slate-200 px-6 pt-6 pb-5">
        <div className="flex items-center justify-center gap-4">
          <Image
            src="/images/logo.png"
            alt="Organization logo"
            width={100}
            height={64}
            className="rounded-md object-contain"
          />
        </div>
        <p className="text-center text-sm leading-6 text-slate-600">
          {t('authorizedAccount')}
        </p>
      </CardHeader>
      <CardContent className="space-y-5 px-6 pt-5 pb-6">
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
            className="w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {invalidCredentialsError}
          </div>
        ) : null}

        <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-slate-800"
              htmlFor="email"
            >
              {t('email')}
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                inputMode="email"
                placeholder="admin@bantigue.com"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'email-error' : undefined}
                className="h-11 rounded-2xl border-slate-200 bg-white pl-9 text-slate-900 placeholder:text-slate-400 shadow-sm transition-colors duration-200 focus-visible:border-sky-500 focus-visible:ring-2 focus-visible:ring-sky-200"
                {...register('email')}
              />
            </div>
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

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-slate-800"
              htmlFor="password"
            >
              {t('password')}
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder={t('enterPassword')}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={
                  errors.password ? 'password-error' : undefined
                }
                className="h-11 rounded-2xl border-slate-200 bg-white px-9 text-slate-900 placeholder:text-slate-400 shadow-sm transition-colors duration-200 focus-visible:border-sky-500 focus-visible:ring-2 focus-visible:ring-sky-200"
                {...register('password')}
              />
              <button
                type="button"
                aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer rounded-lg p-1 text-slate-500 transition-colors duration-200 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
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

          <Button
            type="submit"
            size="lg"
            className="h-11 w-full rounded-2xl bg-sky-500 text-white shadow-[0_16px_30px_-18px_rgba(2,132,199,0.95)] transition-all duration-200 hover:bg-sky-400 focus-visible:ring-2 focus-visible:ring-sky-300/35"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              t('signingIn')
            ) : (
              <>
                {t('signIn')}
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </form>

        <div className="flex w-fit items-center gap-2 font-medium text-slate-700">
          <ShieldCheck className="size-3.5 text-sky-600" />
          {t('authorizedOnly')}
        </div>
      </CardContent>
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
  const tone =
    reason === 'signed-out'
      ? 'success'
      : reason === 'unauthorized' ||
          reason === 'duplicate_session' ||
          reason === 'server-error'
        ? 'warning'
        : 'info';

  return (
    <div
      className={cn(
        'w-full rounded-2xl border px-4 py-3 text-sm',
        tone === 'info' && 'border-sky-200 bg-sky-50 text-sky-700',
        tone === 'warning' &&
          'border-amber-200 bg-amber-50 text-amber-700',
        tone === 'success' &&
          'border-emerald-200 bg-emerald-50 text-emerald-700',
      )}
    >
      {content}
    </div>
  );
}
