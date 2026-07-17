import { createContext, useEffect, useRef, useState } from 'react';

import { useGlobalStore } from '@/hooks/use-global-store';
import { getSession } from './service';
import { LazySession } from './types';

export interface UseAuthReturn {
  session: LazySession;
}

export const AuthContext = createContext<UseAuthReturn | null>(null);

export const useAuth = (): UseAuthReturn => {
  const [session, setSession] = useState<LazySession>({
    status: 'loading',
  });
  const globalStore = useGlobalStore((state) => state.authenticate);
  const isMountedRef = useRef(true);
  const isRefreshingRef = useRef(false);

  const fetchSession = async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;

    try {
      const nextSession = await getSession();

      if (!isMountedRef.current) return;

      globalStore.setIsAuthenticated(nextSession.status !== 'unauthenticated');
      setSession(nextSession);
    } catch {
      if (!isMountedRef.current) return;

      globalStore.setIsAuthenticated(false);
      setSession({ status: 'error' });
    } finally {
      isRefreshingRef.current = false;
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      void fetchSession();
    };

    void fetchSession();

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMountedRef.current = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return { session };
};
