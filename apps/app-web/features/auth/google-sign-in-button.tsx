'use client';

import Script from 'next/script';
import { useEffect, useId, useRef, useState } from 'react';

const GOOGLE_IDENTITY_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

export const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID;

type GoogleSignInButtonProps = {
  /**
   * Receives the Google ID token. Send it to the API untouched — the API is
   * what verifies it. Never decode it here and send the profile instead.
   */
  onCredential: (idToken: string) => void;
  /** Called when the Google script can't load (blocked or offline). */
  onUnavailable?: () => void;
  disabled?: boolean;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
  /** Rendered width in px; Google caps it at 400. */
  width?: number;
};

/**
 * Renders Google's own sign-in button through Google Identity Services. Its
 * look is Google's and is not restyled. Renders nothing when no client id is
 * configured; the caller shows the “unavailable” state.
 */
export function GoogleSignInButton({
  onCredential,
  onUnavailable,
  disabled = false,
  text = 'continue_with',
  width,
}: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onCredential);
  const [isScriptReady, setIsScriptReady] = useState(false);
  const containerId = useId();

  useEffect(() => {
    callbackRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    const container = containerRef.current;

    if (!googleClientId || !isScriptReady || !container) return;

    window.google?.accounts.id.initialize({
      client_id: googleClientId,
      callback: (response) => {
        if (response.credential) {
          callbackRef.current(response.credential);
        }
      },
      cancel_on_tap_outside: true,
    });

    window.google?.accounts.id.renderButton(container, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      shape: 'rectangular',
      logo_alignment: 'left',
      text,
      ...(width ? { width: Math.min(400, Math.max(200, Math.round(width))) } : {}),
    });

    return () => {
      window.google?.accounts.id.disableAutoSelect();
      container.innerHTML = '';
    };
  }, [isScriptReady, text, width]);

  if (!googleClientId) return null;

  return (
    <>
      <Script
        src={GOOGLE_IDENTITY_SCRIPT_SRC}
        strategy="afterInteractive"
        onReady={() => setIsScriptReady(true)}
        onError={() => onUnavailable?.()}
      />
      <div
        id={containerId}
        ref={containerRef}
        aria-disabled={disabled}
        inert={disabled}
        className="flex min-h-10 justify-center"
      />
    </>
  );
}
