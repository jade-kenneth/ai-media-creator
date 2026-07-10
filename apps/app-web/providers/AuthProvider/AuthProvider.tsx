'use client';

import { invariant } from 'es-toolkit';
import { PropsWithChildren, useContext, useEffect } from 'react';
import { Session__Authenticated } from './type';
import { AuthContext, useAuth } from './useAuth';
export const AuthProvider = ({ children }: PropsWithChildren) => {
  const { session } = useAuth();

  return (
    <AuthContext.Provider value={{ session }}>{children}</AuthContext.Provider>
  );
};

export interface UseSessionConfig {
  onAuthenticated?(session: Session__Authenticated): void;
}

export function useSession(config?: UseSessionConfig) {
  const context = useContext(AuthContext);

  invariant(context, "'useSession' must be used within 'AuthProvider'");

  useEffect(() => {
    if (!context?.session) return;
    if (context.session.status === 'authenticated') {
      config?.onAuthenticated?.(context.session);
    }
  }, [config, context?.session]);

  return context.session;
}
