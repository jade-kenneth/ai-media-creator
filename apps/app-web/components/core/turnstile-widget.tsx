'use client';

import Script from 'next/script';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

const TURNSTILE_SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

// Local development skips the challenge; the API does the same while its
// NODE_ENV is development.
export const turnstileSiteKey =
  process.env.NODE_ENV === 'development'
    ? undefined
    : process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY;

export type TurnstileWidgetHandle = {
  /** Clears the solved challenge so the next attempt gets a fresh token. */
  reset: () => void;
};

type TurnstileWidgetProps = {
  action: string;
  className?: string;
  onTokenChange: (token: string | null) => void;
  theme?: 'auto' | 'light' | 'dark';
};

/**
 * Renders the Cloudflare Turnstile challenge and reports its token.
 *
 * Renders nothing when no site key is configured or under `next dev`, which
 * keeps local development working without a Cloudflare challenge.
 */
export const TurnstileWidget = forwardRef<
  TurnstileWidgetHandle,
  TurnstileWidgetProps
>(function TurnstileWidget(
  { action, className, onTokenChange, theme = 'auto' },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isScriptReady, setIsScriptReady] = useState(false);

  const handleTokenChange = useCallback(onTokenChange, [onTokenChange]);

  useImperativeHandle(
    ref,
    () => ({
      reset() {
        if (!widgetIdRef.current || !window.turnstile) return;

        handleTokenChange(null);
        window.turnstile.reset(widgetIdRef.current);
      },
    }),
    [handleTokenChange],
  );

  useEffect(() => {
    const container = containerRef.current;

    if (!turnstileSiteKey || !isScriptReady || !container) return;
    if (widgetIdRef.current) return;

    widgetIdRef.current =
      window.turnstile?.render(container, {
        action,
        sitekey: turnstileSiteKey,
        theme,
        callback: (token) => handleTokenChange(token),
        'error-callback': () => handleTokenChange(null),
        'expired-callback': () => handleTokenChange(null),
      }) ?? null;

    return () => {
      if (widgetIdRef.current) {
        window.turnstile?.remove?.(widgetIdRef.current);
        widgetIdRef.current = null;
      }

      container.innerHTML = '';
      handleTokenChange(null);
    };
  }, [action, handleTokenChange, isScriptReady, theme]);

  if (!turnstileSiteKey) return null;

  return (
    <>
      <Script
        src={TURNSTILE_SCRIPT_SRC}
        strategy="afterInteractive"
        onReady={() => setIsScriptReady(true)}
      />
      <div ref={containerRef} className={className} />
    </>
  );
});
