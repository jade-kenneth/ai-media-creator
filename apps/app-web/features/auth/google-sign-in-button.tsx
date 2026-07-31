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
  disabled?: boolean;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
};

/**
 * Renders Google's own sign-in button through Google Identity Services.
 *
 * Renders nothing when no client id is configured, so the login screen still
 * works with password sign-in alone.
 */
export function GoogleSignInButton({
  onCredential,
  disabled = false,
  text = 'signin_with',
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
      text,
    });

    return () => {
      window.google?.accounts.id.disableAutoSelect();
      container.innerHTML = '';
    };
  }, [isScriptReady, text]);

  if (!googleClientId) return null;

  return (
    <>
      <Script
        src={GOOGLE_IDENTITY_SCRIPT_SRC}
        strategy="afterInteractive"
        onReady={() => setIsScriptReady(true)}
      />
      <div
        id={containerId}
        ref={containerRef}
        aria-disabled={disabled}
        className={disabled ? 'pointer-events-none opacity-60' : undefined}
      />
    </>
  );
}
