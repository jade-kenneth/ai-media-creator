export type AuthRedirectReason =
  | 'session-expired'
  | 'signed-out'
  | 'unauthorized'
  | 'unauthenticated'
  | 'duplicate_session'
  | 'server-error'
  | 'not-found'
  | 'login';

/** The sign-in banner a redirect reason maps to (Design Reference §5.2). */
export type SignInReason = 'expired' | 'signed-out';

export const SIGN_IN_PATH = '/sign-in';
export const DEFAULT_AUTHENTICATED_REDIRECT_PATH = '/projects';

type SearchParamsReader = Pick<URLSearchParams, 'get'>;
type SearchParamsStringifier = Pick<URLSearchParams, 'toString'>;

/**
 * Only same-origin paths are allowed as a return target: a single leading
 * slash, never `//host` or `/\host`, which browsers treat as another origin.
 */
export function getSafeRedirectPath(path?: string | null) {
  if (!path) return null;
  if (!path.startsWith('/')) return null;
  if (path.startsWith('//') || path.startsWith('/\\')) return null;
  if (path.startsWith(SIGN_IN_PATH)) return null;

  return path;
}

function toSignInReason(reason: AuthRedirectReason): SignInReason | null {
  if (reason === 'session-expired' || reason === 'duplicate_session') {
    return 'expired';
  }

  if (reason === 'signed-out') return 'signed-out';

  return null;
}

export function buildLoginRedirectUrl(
  reason: AuthRedirectReason,
  nextPath?: string | null,
) {
  const searchParams = new URLSearchParams();
  const signInReason = toSignInReason(reason);
  const returnTo = getSafeRedirectPath(nextPath);

  if (returnTo) searchParams.set('returnTo', returnTo);
  if (signInReason) searchParams.set('reason', signInReason);

  const query = searchParams.toString();

  return query ? `${SIGN_IN_PATH}?${query}` : SIGN_IN_PATH;
}

export function getPostLoginRedirectPath(
  searchParams: SearchParamsReader,
  fallback = DEFAULT_AUTHENTICATED_REDIRECT_PATH,
) {
  return getSafeRedirectPath(searchParams.get('returnTo')) ?? fallback;
}

export function buildCurrentPath(
  pathname: string,
  searchParams?: SearchParamsStringifier | null,
) {
  const query = searchParams?.toString();
  if (!query) return pathname;

  return `${pathname}?${query}`;
}

export function redirectToPath(path: string) {
  if (typeof window === 'undefined') return;

  window.location.replace(path);
}

export function redirectToLogin(
  reason: AuthRedirectReason,
  nextPath?: string | null,
) {
  const path = buildLoginRedirectUrl(reason, nextPath);
  redirectToPath(path);
}

export function redirectAfterLogin(nextPath?: string | null) {
  redirectToPath(
    getSafeRedirectPath(nextPath) ?? DEFAULT_AUTHENTICATED_REDIRECT_PATH,
  );
}
