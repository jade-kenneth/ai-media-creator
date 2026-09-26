import { store } from '@/providers/AuthProvider/store';
import type {
  GraphqlRequestError,
  GraphqlRequestErrorName,
  GraphqlRequestResult,
} from './graphql-client';
import { AuthRedirectReason, redirectToLogin } from './session';

const errorRedirect: Partial<
  Record<GraphqlRequestErrorName, AuthRedirectReason>
> = {
  UnauthorizedError: 'session-expired',
  DuplicateSessionError: 'duplicate_session',
  SessionTimeoutError: 'session-expired',
};

export function explainGraphqlErrorMessage(
  error: Pick<GraphqlRequestError, 'message'> | Error | null | undefined,
  fallbackMessage = 'Something went wrong. Try again.',
) {
  return error?.message ?? fallbackMessage;
}

export function handleUnauthenticatedError(
  error: GraphqlRequestError,
  nextPath?: string | null,
) {
  if (typeof window === 'undefined') return false;

  if (errorRedirect[error.name] === undefined) return false;

  const redirectPath =
    nextPath ?? `${window.location.pathname}${window.location.search}`;

  // Clear the server-invalidated session before redirecting. Without this the
  // stale access token survives in storage, getSession() still reports
  // 'authenticated' (server-side validation is disabled), and the login page
  // immediately bounces back to the callback route — which fails the same way,
  // producing an infinite login ⇄ dashboard loop (e.g. on DUPLICATE_SESSION).
  // clearSession() writes to localStorage synchronously, so storage is cleared
  // before the redirect navigates away.
  void store.clearSession();

  redirectToLogin(errorRedirect[error.name] ?? 'login', redirectPath);

  return true;
}

/**
 * Returns a GraphQL result's data or throws an Error whose `name` is the
 * mapped error name (for example `NotFoundError`, `ConflictError`) and whose
 * `message` is the API's user-safe message.
 */
export function unwrapGraphqlResult<Data extends Record<string, unknown>>(
  result: GraphqlRequestResult<Data>,
): Data {
  if (result.ok) return result.data;

  const error = new Error(result.error.message);
  error.name = result.error.name;

  throw error;
}
