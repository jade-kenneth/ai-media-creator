import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import {
  ConflictError,
  InvalidCredentialsError,
} from 'src/common/errors/app.error';
import {
  UserRole,
  type AuthPayload,
  type User,
} from '../../graphql/generated/graphql';
import { CreditsService } from '../credits/credits.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { SessionsService } from '../sessions/sessions.service';
import type { UserRecord } from '../users/repositories/users.repository';
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
    private readonly organizationsService: OrganizationsService,
    private readonly creditsService: CreditsService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Signs in the account that owns the verified Google subject.
   *
   * An account is matched by its stored subject first. Failing that, a Google
   * address that Google itself reports as verified may adopt the matching
   * account on first use. A verified Google identity with no account is
   * provisioned as a creator: the account, a personal workspace and the
   * starter credits (Google is the only sign-in method; open decision 12).
   */
  async loginWithGoogle(idToken: string): Promise<AuthPayload> {
    const identity = await this.googleIdentityService.verifyIdToken(idToken);
    const userRecord =
      (await this.resolveAccount(identity)) ??
      (await this.provisionCreator(identity));

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

  /**
   * Creates a creator for a verified Google identity that matches no account.
   * The password hash is random and never disclosed, so the account can only
   * sign in with Google. A concurrent first sign-in that wins the unique email
   * index is resolved by looking the account up again.
   */
  private async provisionCreator(
    identity: GoogleIdentity,
  ): Promise<UserRecord | null> {
    if (!identity.email || !identity.emailVerified) {
      return null;
    }

    // An account already holds this email but is linked to another Google
    // subject: never create a second account for it.
    if (await this.usersService.findRecordByEmail(identity.email)) {
      return null;
    }

    const firstName = identity.firstName?.trim() || null;
    const workspace = await this.organizationsService.createPersonalWorkspace(
      firstName ? `${firstName}'s workspace` : 'My workspace',
    );
    const unusablePasswordHash = await bcrypt.hash(
      randomBytes(32).toString('hex'),
      10,
    );

    try {
      await this.usersService.createUser({
        email: identity.email,
        passwordHash: unusablePasswordHash,
        role: UserRole.USER,
        isActive: true,
        organizationId: workspace.id,
        firstName,
        lastName: identity.lastName?.trim() || null,
      });
    } catch (error) {
      await this.organizationsService
        .deactivate(workspace.id)
        .catch(() => undefined);

      if (isDuplicateKeyError(error)) {
        return this.resolveAccount(identity);
      }

      throw error;
    }

    const created = await this.usersService.findRecordByEmail(identity.email);

    if (!created) return null;

    await this.claimGoogleSub(created.id, identity.sub);
    await this.creditsService.grant(
      { ownerId: created.id, organizationId: workspace.id },
      this.configService.get<number>('STARTER_CREDITS') ?? 0,
      'Starter credits',
    );

    return this.usersService.findRecordByEmail(identity.email);
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
