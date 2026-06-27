import { useSession } from '@/hooks/use-session';
import { useMeQuery } from '@/react-query/auth/auth-operations';

export function useCurrentUser() {
  const session = useSession();
  const query = useMeQuery(undefined, {
    enabled: session.status === 'authenticated',
  });

  if (session.status !== 'authenticated') {
    throw new Error('Unauthenticated');
  }

  if (!query.data?.me) {
    throw new Error('Current user is not loaded');
  }

  return query.data.me;
}
