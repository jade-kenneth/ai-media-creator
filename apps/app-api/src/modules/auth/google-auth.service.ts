import { Injectable, Logger } from '@nestjs/common';
import {
  ConflictError,
  InvalidCredentialsError,
} from 'src/common/errors/app.error';
import type { AuthPayload, User } from '../../graphql/generated/graphql';
import { SessionsService } from '../sessions/sessions.service';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import {
  GoogleIdentityService,
  type GoogleIdentity,
} from './google-identity.service';
import type { AuthenticatedUser } from './types/auth-context';

@Injectable()
export class GoogleAuthService {
  private readonly logger = new Logger(GoogleAuthService.name);

  constructor(
    private readonly googleIdentityService: GoogleIdentityService,
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Signs in the account that owns the verified Google subject.
   *
   * An account is matched by its stored subject first. Failing that, a Google
   * address that Google itself reports as verified may adopt the matching
   * account on first use. Sign-in never provisions an account: registration
   * stays explicit so an account always lands in an organization.
   */
  async loginWithGoogle(idToken: string): Promise<AuthPayload> {
    const identity = await this.googleIdentityService.verifyIdToken(idToken);
    const userRecord = await this.resolveAccount(identity);

    if (!userRecord) {
      throw new InvalidCredentialsError(
        'No account is linked to this Google account.',
      );
    }

    if (!userRecord.isActive) {
      throw new InvalidCredentialsError('This account is inactive.');
    }

    const jti = crypto.randomUUID();

    await this.sessionsService.createSession({
      accountId: userRecord.id,
      jti,
      organizationId: userRecord.organizationId ?? null,
      dateTimeCreated: new Date(),
      dateTimeLastRefreshed: new Date(),
    });

    const user = await this.usersService.findById(userRecord.id);

    if (!user) {
      throw new InvalidCredentialsError('Google sign-in failed.');
    }

    return this.authService.buildAuthPayloadForUser(user, jti);
  }

  async linkGoogleAccount(
    currentUser: AuthenticatedUser,
    idToken: string,
  ): Promise<User> {
    const identity = await this.googleIdentityService.verifyIdToken(idToken);
    const existing = await this.usersService.findRecordByGoogleSub(
      identity.sub,
    );

    if (existing && existing.id !== currentUser.id) {
      throw new ConflictError(
        'This Google account is already linked to another account.',
      );
    }

    if (!existing) {
      await this.claimGoogleSub(currentUser.id, identity.sub);
    }

    return this.requireUser(currentUser.id);
  }

  async unlinkGoogleAccount(currentUser: AuthenticatedUser): Promise<User> {
    await this.usersService.unlinkGoogleSub(currentUser.id);

    return this.requireUser(currentUser.id);
  }

  private async resolveAccount(identity: GoogleIdentity) {
    const linked = await this.usersService.findRecordByGoogleSub(identity.sub);

    if (linked) {
      return linked;
    }

    if (!identity.email || !identity.emailVerified) {
      return null;
    }

    const byEmail = await this.usersService.findRecordByEmail(identity.email);

    if (!byEmail || byEmail.googleSub) {
      return null;
    }

    await this.claimGoogleSub(byEmail.id, identity.sub);

    return byEmail;
  }

  private async claimGoogleSub(
    userId: string,
    googleSub: string,
  ): Promise<void> {
    let claimed: boolean;

    try {
      claimed = await this.usersService.linkGoogleSub(userId, googleSub);
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictError(
          'This Google account is already linked to another account.',
        );
      }

      throw error;
    }

    if (!claimed) {
      this.logger.warn(
        'Refused to rebind an account that is already linked to Google.',
      );
      throw new ConflictError(
        'This account is already linked to a different Google account.',
      );
    }
  }

  private async requireUser(id: string): Promise<User> {
    const user = await this.usersService.findById(id);

    if (!user) {
      throw new InvalidCredentialsError('Google sign-in failed.');
    }

    return user;
  }
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 11000
  );
}
