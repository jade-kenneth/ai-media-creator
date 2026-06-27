import { GraphqlRequestError, GraphqlRequestErrorName } from './graphql-client';
import { AuthRedirectReason, redirectToLogin } from './session';

const errorRedirect: Partial<
  Record<GraphqlRequestErrorName, AuthRedirectReason>
> = {
  UnauthorizedError: 'session-expired',
  ForbiddenError: 'unauthorized',
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
  if (errorRedirect[error.name] === undefined) return false;

  const redirectPath = nextPath ?? '/';

  redirectToLogin(errorRedirect[error.name] ?? 'login', redirectPath);

  return true;
}
