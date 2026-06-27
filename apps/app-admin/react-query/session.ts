export type AuthRedirectReason =
  | 'session-expired'
  | 'signed-out'
  | 'unauthorized'
  | 'unauthenticated'
  | 'duplicate_session'
  | 'server-error'
  | 'not-found'
  | 'login';

export const DEFAULT_AUTHENTICATED_REDIRECT_PATH = '/admin/dashboard';

type SearchParamsReader = Pick<URLSearchParams, 'get'>;
type SearchParamsStringifier = Pick<URLSearchParams, 'toString'>;

export function getSafeRedirectPath(path?: string | null) {
  if (!path) return null;
  if (!path.startsWith('/')) return null;

  return path;
}

export function buildLoginRedirectUrl(
  reason: AuthRedirectReason,
  nextPath?: string | null,
) {
  const searchParams = new URLSearchParams();

  searchParams.set('reason', reason);

  const callback = getSafeRedirectPath(nextPath);

  if (callback) searchParams.set('callback', callback);

  return `/login?${searchParams.toString()}`;
}

export function getPostLoginRedirectPath(
  searchParams: SearchParamsReader,
  fallback = DEFAULT_AUTHENTICATED_REDIRECT_PATH,
) {
  const callback = searchParams.get('callback');
  const next = searchParams.get('next');

  const safePath = getSafeRedirectPath(callback) ?? getSafeRedirectPath(next);
  if (safePath) return safePath;

  return fallback;
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
  const safePath = getSafeRedirectPath(nextPath);
  if (safePath) {
    redirectToPath(safePath);
    return;
  }

  redirectToPath(DEFAULT_AUTHENTICATED_REDIRECT_PATH);
}
