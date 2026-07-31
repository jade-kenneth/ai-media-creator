import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import {
  ExternalServiceError,
  InvalidCredentialsError,
} from 'src/common/errors/app.error';

const GOOGLE_ISSUERS = ['accounts.google.com', 'https://accounts.google.com'];

export interface GoogleIdentity {
  sub: string;
  email: string | null;
  emailVerified: boolean;
  firstName: string | null;
  lastName: string | null;
}

/**
 * Turns a Google-issued ID token into a trusted identity.
 *
 * The token is verified against Google's published signing keys and its
 * audience is constrained to this project's own OAuth client IDs, so a token
 * minted for some other application cannot be replayed here. Never accept a
 * bare `sub`, profile payload, or userinfo response from a client as proof of
 * identity — only a token that survives this check.
 */
@Injectable()
export class GoogleIdentityService {
  private readonly logger = new Logger(GoogleIdentityService.name);

  constructor(private readonly configService: ConfigService) {}

  get isEnabled(): boolean {
    return this.configService.get<boolean>('GOOGLE_OAUTH_ENABLED') === true;
  }

  assertEnabled(): void {
    if (!this.isEnabled) {
      throw new ExternalServiceError('Google sign-in is not configured.');
    }
  }

  async verifyIdToken(idToken: string): Promise<GoogleIdentity> {
    this.assertEnabled();

    const token = idToken.trim();

    if (!token) {
      throw new InvalidCredentialsError('Google sign-in failed.');
    }

    const audience =
      this.configService.get<string[]>('GOOGLE_OAUTH_CLIENT_IDS') ?? [];

    if (audience.length === 0) {
      throw new ExternalServiceError('Google sign-in is not configured.');
    }

    const payload = await this.readVerifiedPayload(token, audience);

    if (!payload?.sub || !GOOGLE_ISSUERS.includes(payload.iss)) {
      throw new InvalidCredentialsError('Google sign-in failed.');
    }

    return {
      sub: payload.sub,
      email: payload.email?.trim().toLowerCase() ?? null,
      emailVerified: payload.email_verified === true,
      firstName: payload.given_name?.trim() || null,
      lastName: payload.family_name?.trim() || null,
    };
  }

  private async readVerifiedPayload(idToken: string, audience: string[]) {
    try {
      const ticket = await new google.auth.OAuth2().verifyIdToken({
        idToken,
        audience,
      });

      return ticket.getPayload();
    } catch (error) {
      this.logger.warn('Rejected a Google ID token that failed verification.');
      this.logger.debug(error);
      throw new InvalidCredentialsError('Google sign-in failed.');
    }
  }
}
