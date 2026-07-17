import { createContext, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, DeviceEventEmitter } from 'react-native';

import { AUTH_STATE_CHANGE_EVENT } from '@/utils/constants';

import { getSession } from './service';

import type { LazySession } from './types';

export interface UseAuthReturn {
  session: LazySession;
}

export const AuthContext = createContext<UseAuthReturn | null>(null);

export const useAuth = (): UseAuthReturn => {
  const [session, setSession] = useState<LazySession>({
    status: 'loading',
  });
  const isMountedRef = useRef(true);
  const isRefreshingRef = useRef(false);
  const pendingRefreshRef = useRef(false);

  const fetchSession = async () => {
    // If a refresh is already in progress, mark that another one is needed
    // so we re-fetch once the current call finishes. This prevents auth state
    // change notifications (e.g. from login) from being silently dropped.
    if (isRefreshingRef.current) {
      pendingRefreshRef.current = true;
      return;
    }
    isRefreshingRef.current = true;

    try {
      const nextSession = await getSession();

      if (!isMountedRef.current) return;
      setSession(nextSession);
    } catch {
      if (!isMountedRef.current) return;
      setSession({ status: 'error' });
    } finally {
      isRefreshingRef.current = false;

      // A state change arrived while we were refreshing — run again.
      if (pendingRefreshRef.current && isMountedRef.current) {
        pendingRefreshRef.current = false;
        void fetchSession();
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState !== 'active') return;
      void fetchSession();
    };

    void fetchSession();

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );
    const authSubscription = DeviceEventEmitter.addListener(
      AUTH_STATE_CHANGE_EVENT,
      () => {
        void fetchSession();
      },
    );

    return () => {
      isMountedRef.current = false;
      subscription.remove();
      authSubscription.remove();
    };
  }, []);

  return { session };
};
