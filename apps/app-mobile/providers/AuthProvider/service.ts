import { z } from 'zod';

import type { LoginWithGoogleInput } from './service.core';
import * as services from './service.core';
import { store } from './store';
import { Session } from './type';

export async function getSession(): Promise<Session> {
  const { accessToken, refreshToken, role } = await store.get();

  if (!role) {
    await store.clearSession();
    return { status: 'unauthenticated' };
  }
  if (!accessToken) {
    if (!refreshToken) {
      await store.clearSession();
      return {
        status: 'unauthenticated',
      };
    }
    try {
      const session = await services.refreshSession({ refreshToken });

      if (!session) {
        await store.clearSession();
        return {
          status: 'unauthenticated',
        };
      }
      await store.set({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken ?? undefined,
      });
      return {
        status: 'authenticated',
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        role,
      };
    } catch {
      await store.clearSession();
      return {
        status: 'unauthenticated',
      };
    }
  }

  // try {
  //   const validation = await services.validateSession();

  //   if (!validation.ok) {
  //     await store.clearSession();

  //     return {
  //       status: 'unauthenticated',
  //     };
  //   }

  //   return {
  //     status: 'authenticated',
  //     accessToken,
  //     refreshToken,
  //     role,
  //   };
  // } catch {
  //   await store.clearSession();
  //   return {
  //     status: 'unauthenticated',
  //   };
  // }
  return {
    status: 'authenticated',
    accessToken,
    refreshToken,
    role,
  };
}

export async function loginWithGoogle(input: LoginWithGoogleInput) {
  const { accessToken, refreshToken, role } =
    await services.__loginWithGoogle(input);

  await store.set({
    accessToken,
    refreshToken,
    role,
  });
}

export async function logout() {
  try {
    const { refreshToken } = await store.get();
    if (refreshToken) {
      await services.logoutSession({ refreshToken });
    }
  } catch {
    /* empty */
  } finally {
    await store.clearSession();
  }
}

const GoogleUserInfoSchema = z.object({
  sub: z.string(),
  email: z.string().optional(),
  name: z.string().optional(),
  picture: z.string().optional(),
});

export type GoogleUserInfo = z.infer<typeof GoogleUserInfoSchema>;

export async function fetchGoogleUserInfo(
  accessToken: string,
): Promise<GoogleUserInfo> {
  if (!accessToken.trim()) {
    throw new Error('missing Google access token');
  }

  const userInfoResponse = await fetch(
    'https://www.googleapis.com/oauth2/v3/userinfo',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!userInfoResponse.ok) {
    throw new Error('failed to fetch Google account profile');
  }

  const responseData: unknown = await userInfoResponse.json();

  const parsed = GoogleUserInfoSchema.safeParse(responseData);

  if (!parsed.success) {
    throw new Error('invalid Google account profile response');
  }

  return parsed.data;
}
