import axios from 'axios';

export interface Token {
  accessToken: string;
  refreshToken: string | null | undefined;
}

export interface RefreshSession {
  refreshToken: string;
}

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_GRAPHQL_URL?.replace(/\/graphql\/?$/, '') ??
  'http://localhost:3001';

export async function refreshSession(
  input: RefreshSession,
): Promise<Token | null> {
  try {
    const response = await axios.post<Token>('/session/refresh', input, {
      baseURL: apiBaseUrl,
      headers: {
        Authorization: `Bearer ${input.refreshToken}`,
      },
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 401 || status === 403) {
        return null;
      }
    }

    console.error('Error refreshing session:', error);
    return null;
  }
}

export async function logoutSession(input: RefreshSession) {
  await axios.post(
    '/session/logout',
    {},
    {
      baseURL: apiBaseUrl,
      headers: {
        Authorization: `Bearer ${input.refreshToken}`,
      },
    },
  );
}
