/**
 * Header the clients send the Cloudflare Turnstile token on. The fallback is
 * the name Cloudflare's own form integration uses, kept so a plain HTML form
 * post works without a bespoke client.
 */
export const TURNSTILE_TOKEN_HEADER = 'x-turnstile-token';
export const TURNSTILE_FALLBACK_HEADER = 'cf-turnstile-response';

export const TURNSTILE_ACTION_KEY = 'turnstileAction';
