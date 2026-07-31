import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef } from 'react';

// Lets the in-app browser hand the result back to the app after the redirect.
WebBrowser.maybeCompleteAuthSession();

const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

export const isGoogleSignInConfigured = Boolean(
  androidClientId || iosClientId || webClientId,
);

type UseGoogleSignInOptions = {
  /**
   * Receives the Google ID token. Pass it to the API untouched — the API
   * verifies its signature and audience. Never decode it here and send the
   * profile instead.
   */
  onIdToken: (idToken: string) => void;
  onError?: (error: Error) => void;
};

/**
 * Runs the native Google sign-in flow and yields an OIDC ID token.
 *
 * `promptAsync` is null while the request is still being prepared or when no
 * client id is configured, so callers can hide the button instead of showing
 * one that cannot work.
 */
export function useGoogleSignIn({ onIdToken, onError }: UseGoogleSignInOptions) {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    androidClientId,
    iosClientId,
    webClientId,
  });
  const callbacksRef = useRef({ onIdToken, onError });

  useEffect(() => {
    callbacksRef.current = { onIdToken, onError };
  }, [onIdToken, onError]);

  useEffect(() => {
    if (!response) return;

    if (response.type === 'success') {
      const idToken = response.params?.id_token;

      if (idToken) {
        callbacksRef.current.onIdToken(idToken);
        return;
      }

      callbacksRef.current.onError?.(
        new Error('Google sign-in did not return an ID token.'),
      );
      return;
    }

    if (response.type === 'error') {
      callbacksRef.current.onError?.(
        response.error ?? new Error('Google sign-in failed.'),
      );
    }
  }, [response]);

  return {
    isAvailable: isGoogleSignInConfigured && Boolean(request),
    promptAsync,
  };
}
