'use client';

import {
  CircleAlertIcon,
  CircleCheckIcon,
  TriangleAlertIcon,
  WifiOffIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

import { BrandMark, Wordmark } from '@/components/brand/brand-mark';
import {
  TurnstileWidget,
  turnstileSiteKey,
  type TurnstileWidgetHandle,
} from '@/components/core/turnstile-widget';
import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import {
  GoogleSignInButton,
  googleClientId,
} from '@/features/auth/google-sign-in-button';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { useSession } from '@/providers/AuthProvider';
import { store } from '@/providers/AuthProvider/store';
import { useLoginWithGoogleMutation } from '@/react-query/auth/auth-operations';
import {
  getPostLoginRedirectPath,
  redirectAfterLogin,
} from '@/react-query/session';

import { StagePanel } from './stage-panel';

type Problem = 'error' | 'inactive' | 'unavailable';

/** Sign in (Design Reference §5.2): Google is the only sign-in method. */
export function SignInPage() {
  const searchParams = useSearchParams();
  const session = useSession();
  const online = useOnlineStatus();
  const destination = getPostLoginRedirectPath(searchParams);
  const reason = searchParams.get('reason');
  const [problem, setProblem] = useState<Problem | null>(
    googleClientId ? null : 'unavailable',
  );
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);
  const columnRef = useRef<HTMLDivElement>(null);
  const [buttonWidth, setButtonWidth] = useState<number>();

  useEffect(() => {
    if (session.status === 'authenticated') redirectAfterLogin(destination);
  }, [destination, session.status]);

  useEffect(() => {
    const column = columnRef.current;
    if (!column) return;

    const measure = () => setButtonWidth(column.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(column);

    return () => observer.disconnect();
  }, []);

  const login = useLoginWithGoogleMutation({
    onSuccess: async ({ loginWithGoogle }) => {
      await store.set({
        accessToken: loginWithGoogle.accessToken,
        refreshToken: loginWithGoogle.refreshToken,
        role: loginWithGoogle.user.role,
      });
      redirectAfterLogin(destination);
    },
    onError: (error) => {
      // A Turnstile token is single use; the next attempt needs a new one.
      turnstileRef.current?.reset();
      setProblem(
        error.name === 'InvalidCredentialsError' &&
          error.message.toLowerCase().includes('inactive')
          ? 'inactive'
          : 'error',
      );
    },
  });

  const handleCredential = useCallback(
    (idToken: string) => {
      if (login.isPending) return;

      setProblem(null);
      login.mutate({ input: { idToken }, turnstileToken });
    },
    [login, turnstileToken],
  );

  const awaitingTurnstile = Boolean(turnstileSiteKey) && !turnstileToken;
  const inert = !online || login.isPending || login.isSuccess || awaitingTurnstile;

  return (
    <main className="grid min-h-dvh bg-canvas lg:grid-cols-[1.1fr_1fr]">
      <StagePanel />

      <div className="flex justify-center px-4 pt-16 pb-12 lg:items-center lg:px-12 lg:py-12">
        <div ref={columnRef} className="flex w-full max-w-100 flex-col">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <BrandMark />
            <Wordmark />
          </div>

          <SignInBanner
            online={online}
            problem={problem}
            reason={reason}
          />

          <h1 className="t-h1">Sign in to continue</h1>
          <p className="t-body mt-2 text-ink-2">
            Use your Google account. If this is your first time, we’ll set up
            your workspace automatically.
          </p>

          {turnstileSiteKey ? (
            <TurnstileWidget
              ref={turnstileRef}
              action="login"
              className="mt-6"
              onTokenChange={setTurnstileToken}
            />
          ) : null}

          <div className="relative mt-6">
            <GoogleSignInButton
              onCredential={handleCredential}
              onUnavailable={() => setProblem('unavailable')}
              disabled={inert}
              width={buttonWidth}
            />
            {!online || login.isPending || login.isSuccess ? (
              <div
                className="absolute inset-0 flex items-center justify-center gap-2 rounded-md bg-canvas/80"
                aria-live="polite"
              >
                {online ? (
                  <>
                    <Spinner className="text-ink-2" />
                    <span className="t-sm text-ink-2">Signing you in…</span>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>

          <p className="t-caption mt-4 text-ink-3">
            By continuing, you acknowledge our{' '}
            <Link
              href="/privacy-policy"
              className="text-flare-text underline underline-offset-2"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}

function SignInBanner({
  online,
  problem,
  reason,
}: {
  online: boolean;
  problem: Problem | null;
  reason: string | null;
}) {
  const banner = ((): {
    variant: 'info' | 'success' | 'warning' | 'danger';
    icon: ReactNode;
    title: string;
    detail?: string;
  } | null => {
    if (!online) {
      return {
        variant: 'warning',
        icon: <WifiOffIcon />,
        title: 'You’re offline.',
        detail: 'Connect to the internet to sign in.',
      };
    }
    if (problem === 'inactive') {
      return {
        variant: 'danger',
        icon: <CircleAlertIcon />,
        title: 'This account can’t sign in right now.',
        detail: 'Contact support if you think this is a mistake.',
      };
    }
    if (problem === 'error') {
      return {
        variant: 'danger',
        icon: <CircleAlertIcon />,
        title: 'Google sign-in didn’t finish.',
        detail:
          'Something went wrong on our side or Google’s. Try again in a moment.',
      };
    }
    if (problem === 'unavailable') {
      return {
        variant: 'warning',
        icon: <TriangleAlertIcon />,
        title: 'Google sign-in isn’t available right now.',
        detail: 'Check your connection or try again later.',
      };
    }
    if (reason === 'expired') {
      return {
        variant: 'warning',
        icon: <TriangleAlertIcon />,
        title: 'Your session ended.',
        detail: 'Sign in again to go back where you were.',
      };
    }
    if (reason === 'signed-out') {
      return {
        variant: 'success',
        icon: <CircleCheckIcon />,
        title: 'You’re signed out.',
      };
    }
    return null;
  })();

  if (!banner) return null;

  return (
    <Alert
      variant={banner.variant}
      role={banner.variant === 'danger' ? 'alert' : 'status'}
      className="mb-5"
    >
      {banner.icon}
      <AlertContent>
        <AlertTitle>{banner.title}</AlertTitle>
        {banner.detail ? (
          <>
            {' '}
            <AlertDescription>{banner.detail}</AlertDescription>
          </>
        ) : null}
      </AlertContent>
    </Alert>
  );
}
