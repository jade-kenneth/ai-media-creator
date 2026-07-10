import * as services from './service.core';
import { store } from './store';
import type { Session } from './type';

export async function getSession(): Promise<Session> {
  const { accessToken, refreshToken, role } = await store.get();

  if (!role) {
    await store.clearSession();
    return { status: 'unauthenticated' };
  }

  if (accessToken) {
    return {
      status: 'authenticated',
      accessToken,
      refreshToken,
      role,
    };
  }

  if (!refreshToken) {
    await store.clearSession();
    return { status: 'unauthenticated' };
  }

  const refreshedSession = await services.refreshSession({ refreshToken });

  if (!refreshedSession) {
    await store.clearSession();
    return { status: 'unauthenticated' };
  }

  await store.set({
    accessToken: refreshedSession.accessToken,
    refreshToken: refreshedSession.refreshToken ?? undefined,
  });

  return {
    status: 'authenticated',
    accessToken: refreshedSession.accessToken,
    refreshToken: refreshedSession.refreshToken,
    role,
  };
}

export async function logout() {
  try {
    const { refreshToken } = await store.get();

    if (refreshToken) {
      await services.logoutSession({ refreshToken });
    }
  } catch {
    // Local session cleanup must still complete when the API is unavailable.
  } finally {
    await store.clearSession();
  }
}
