/**
 * Header the API reads the Cloudflare Turnstile token from. Kept beside the
 * GraphQL client so every caller sends the token the same way instead of
 * inventing a field on each mutation input.
 */
export const TURNSTILE_TOKEN_HEADER = 'x-turnstile-token';

export function turnstileHeaders(
  token?: string | null,
): Record<string, string> {
  return token ? { [TURNSTILE_TOKEN_HEADER]: token } : {};
}
