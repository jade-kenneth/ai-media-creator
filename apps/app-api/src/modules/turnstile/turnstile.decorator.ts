import { SetMetadata } from '@nestjs/common';
import { TURNSTILE_ACTION_KEY } from './turnstile.constants';

/**
 * Requires a valid Cloudflare Turnstile token on the decorated handler. The
 * action must match the `action` the widget was rendered with, so a token
 * minted for one flow cannot be replayed against another.
 */
export const TurnstileProtected = (action: string) =>
  SetMetadata(TURNSTILE_ACTION_KEY, action);
