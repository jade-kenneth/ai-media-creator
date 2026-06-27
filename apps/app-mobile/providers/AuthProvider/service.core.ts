import { UserRole } from '@/react-query/generated__types';
import { client } from '@/react-query/graphql-client';
import { VALIDATE_SESSION_QUERY } from '@/react-query/graphql/auth';
import axios, { isAxiosError } from 'axios';
import { store } from './store';

export interface Token {
  accessToken: string;
  refreshToken: string | null | undefined;
}

export interface RefreshSession {
  refreshToken: string;
}
export interface ValidateSessionInput {
  accessToken: string;
}

export interface ValidateSessionResult {
  ok: boolean;
  status: 200 | 403 | 500;
}

export interface CreateSessionInput {
  user: {
    _id: string;
    role: UserRole;
  };
}
export interface AuthenticateInput {
  emailAddress: string;
  password: string;
  role: UserRole;
  turnstileToken: string;
}
export interface LoginWithGoogleInput {
  id: string;
  emailAddress?: string;
  displayName?: string;
  avatarUrl?: string;
  turnstileToken: string;
}

export async function refreshSession(
  input: RefreshSession,
): Promise<Token | null> {
  try {
    const response = await axios.post<Token>('/session/refresh', input, {
      baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
      headers: {
        Authorization: `Bearer ${input.refreshToken}`,
      },
    });

    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 401 || status === 403) {
        return null;
      }
    }

    console.error('Error refreshing session:', error);
    return null;
  }
}

export async function validateSession(): Promise<ValidateSessionResult> {
  try {
    const { accessToken } = await store.get();

    if (!accessToken) {
      return {
        ok: false,
        status: 403,
      };
    }

    const response = await client.request(VALIDATE_SESSION_QUERY, undefined, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const isAuthError =
        response.error.name === 'UnauthorizedError' ||
        response.error.name === 'SessionTimeoutError' ||
        response.error.name === 'DuplicateSessionError' ||
        response.error.name === 'ForbiddenError';

      return {
        ok: false,
        status: isAuthError ? 403 : 500,
      };
    }
    return {
      ok: true,
      status: 200,
    };
  } catch {
    return {
      ok: false,
      status: 500,
    };
  }
}

export async function logoutSession(input: RefreshSession) {
  try {
    await axios.post(
      '/session/logout',
      {},
      {
        baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
        headers: {
          Authorization: `Bearer ${input.refreshToken}`,
        },
      },
    );
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
}

export async function __loginWithGoogle(input: LoginWithGoogleInput) {
  try {
    const response = await axios.post<Token & { role: UserRole }>(
      '/session/authenticate/google',
      input,
      {
        baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
        // headers: {
        //   [TURNSTILE_TOKEN_HEADER]: input.turnstileToken,
        // },
      },
    );

    return response.data;
  } catch (error) {
    console.error('Error authenticating google session:', error);
    throw error;
  }
}
