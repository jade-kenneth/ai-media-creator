import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Types } from 'mongoose';
import type { StringValue } from 'ms';
import { randomInt } from 'node:crypto';
import {
  ConflictError,
  InvalidCredentialsError,
  ValidationError,
} from 'src/common/errors/app.error';
import { TOKENS } from 'src/types/tokens';
import {
  ResetCodeStatus,
  UserRole,
  type AuthPayload,
  type LoginInput,
  type PasswordResetCodeResult,
  type PasswordResetRequestResult,
  type RegisterUserInput,
  type ResetPasswordInput,
  type UpdateMyProfileInput,
  type User,
} from '../../graphql/generated/graphql';
import { MailService } from '../mail/mail.service';
import { renderPasswordResetEmail } from '../mail/templates/password-reset.template';
import { OrganizationsService } from '../organizations/organizations.service';
import { SessionsService } from '../sessions/sessions.service';
import { normalizeEmail, UsersService } from '../users/users.service';
import type {
  AuthSecurityRecord,
  AuthSecurityRepository,
} from './repositories/auth-security.repository';
import type { AuthenticatedUser, JwtPayload } from './types/auth-context';
import { TokenType } from './types/auth-context';

const PASSWORD_SALT_ROUNDS = 10;
const TOKEN_TYPE = 'Bearer';
const RESET_COOLDOWN_MS = 30 * 1000;
const RESET_TTL_MS = 15 * 60 * 1000;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly organizationsService: OrganizationsService,
    private readonly mailService: MailService,
    @Inject(TOKENS.AUTH_SECURITY_REPOSITORY)
    private readonly authSecurityRepository: AuthSecurityRepository,
  ) {}

  async registerUser(input: RegisterUserInput): Promise<AuthPayload> {
    validateRegisterUserInput(input);

    const organization = await this.organizationsService.findBySlug(
      input.organizationSlug,
    );

    if (!organization || !organization.isActive) {
      throw new ConflictError('Organization not found or inactive.');
    }

    if (await this.usersService.existsByEmail(input.email)) {
      throw new ConflictError('Email already exists.');
    }

    const passwordHash = await bcrypt.hash(
      input.password,
      PASSWORD_SALT_ROUNDS,
    );
    const user = await this.createUserAccount({
      email: input.email,
      passwordHash,
      organizationId: organization.id,
      firstName: input.firstName,
      lastName: input.lastName,
    });
    const jti = crypto.randomUUID();

    try {
      await this.sessionsService.createSession({
        accountId: user.id,
        jti,
        dateTimeCreated: new Date(),
        dateTimeLastRefreshed: new Date(),
      });
    } catch (error) {
      await this.usersService.deleteById(user.id).catch(() => undefined);
      throw error;
    }

    return this.buildAuthPayload(user, jti, organization.slug);
  }

  async login(input: LoginInput): Promise<AuthPayload> {
    const userRecord = await this.usersService.findRecordByEmail(input.email);

    if (!userRecord) {
      throw new InvalidCredentialsError();
    }

    const isPasswordValid = await bcrypt.compare(
      input.password,
      userRecord.passwordHash,
    );

    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    if (!userRecord.isActive) {
      throw new UnauthorizedException('User account is inactive.');
    }

    let tenantSlug: string | undefined;

    if (input.organizationSlug) {
      const selectedOrganization = await this.organizationsService.findBySlug(
        input.organizationSlug,
      );

      if (!selectedOrganization || !selectedOrganization.isActive) {
        throw new ForbiddenException('Organization not found or inactive.');
      }

      if (userRecord.organizationId !== selectedOrganization.id.toString()) {
        throw new ForbiddenException(
          'User is not affiliated with this organization.',
        );
      }

      tenantSlug = selectedOrganization.slug;
    } else if (userRecord.organizationId) {
      const organization = await this.organizationsService.findByIdOrNull(
        userRecord.organizationId,
      );

      if (!organization?.isActive) {
        throw new ForbiddenException('Organization not found or inactive.');
      }

      tenantSlug = organization.slug;
    }

    const user = await this.usersService.findById(userRecord.id);

    if (!user) {
      throw new UnauthorizedException('Authentication required.');
    }

    await this.sessionsService.deleteSessionsByAccountId(user.id);

    const jti = crypto.randomUUID();

    await this.sessionsService.createSession({
      accountId: user.id,
      jti,
      dateTimeCreated: new Date(),
      dateTimeLastRefreshed: new Date(),
    });

    return this.buildAuthPayload(user, jti, tenantSlug);
  }

  async requestPasswordReset(
    rawEmail: string,
  ): Promise<PasswordResetRequestResult> {
    const email = normalizeEmail(rawEmail);
    const neutralResult = {
      accepted: true,
      message: `If an account exists for ${email}, we've sent it a 6-digit code.`,
    };
    const security = await this.findSecurity(email);
    const now = new Date();

    if (
      security?.lastResetSentAt &&
      now.getTime() - security.lastResetSentAt.getTime() < RESET_COOLDOWN_MS
    ) {
      return neutralResult;
    }

    const user = await this.usersService.findRecordByEmail(email);

    if (!user) {
      return neutralResult;
    }

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const resetCodeHash = await bcrypt.hash(code, PASSWORD_SALT_ROUNDS);
    const productName =
      this.configService.getOrThrow<string>('BREVO_SENDER_NAME');
    const resetEmail = renderPasswordResetEmail({ code, productName });

    try {
      await this.mailService.sendEmail(
        email,
        resetEmail.subject,
        resetEmail.html,
      );
      await this.saveSecurity(email, security, {
        resetCodeHash,
        resetCodeExpiresAt: new Date(now.getTime() + RESET_TTL_MS),
        resetCodeUsedAt: null,
        lastResetSentAt: now,
      });
    } catch (error) {
      this.logger.error(
        'Password reset email could not be delivered.',
        error instanceof Error ? error.stack : undefined,
      );
    }

    return neutralResult;
  }

  async verifyResetCode(
    rawEmail: string,
    code: string,
  ): Promise<PasswordResetCodeResult> {
    const security = await this.findSecurity(normalizeEmail(rawEmail));

    if (
      !security?.resetCodeHash ||
      !security.resetCodeExpiresAt ||
      security.resetCodeUsedAt
    ) {
      return { status: ResetCodeStatus.INVALID };
    }

    if (security.resetCodeExpiresAt <= new Date()) {
      return { status: ResetCodeStatus.EXPIRED };
    }

    return {
      status: (await bcrypt.compare(code, security.resetCodeHash))
        ? ResetCodeStatus.VALID
        : ResetCodeStatus.INVALID,
    };
  }

  async resetPassword(input: ResetPasswordInput): Promise<boolean> {
    if (input.newPassword.length < 8) {
      throw new ValidationError('Use at least 8 characters.', {
        field: 'input.newPassword',
      });
    }

    const email = normalizeEmail(input.email);
    const verification = await this.verifyResetCode(email, input.code);

    if (verification.status !== ResetCodeStatus.VALID) {
      throw new ValidationError(
        verification.status === ResetCodeStatus.EXPIRED
          ? 'This code has expired. Request a new one below.'
          : "That code doesn't match. Check your email and try again.",
        { field: 'input.code' },
      );
    }

    const [user, security] = await Promise.all([
      this.usersService.findRecordByEmail(email),
      this.findSecurity(email),
    ]);

    if (!user || !security) {
      throw new ValidationError(
        "That code doesn't match. Check your email and try again.",
        { field: 'input.code' },
      );
    }

    const passwordHash = await bcrypt.hash(
      input.newPassword,
      PASSWORD_SALT_ROUNDS,
    );
    await this.usersService.updatePasswordHash(user.id, passwordHash);
    await this.authSecurityRepository.update(
      { id: security.id },
      { resetCodeUsedAt: new Date(), updatedAt: new Date() },
    );
    await this.sessionsService.deleteSessionsByAccountId(user.id);

    return true;
  }

  async me(currentUser: AuthenticatedUser): Promise<User> {
    const user = await this.usersService.findById(currentUser.id);

    if (!user) {
      throw new UnauthorizedException('Authentication required.');
    }

    return user;
  }

  async updateMyProfile(
    currentUser: AuthenticatedUser,
    input: UpdateMyProfileInput,
  ): Promise<User> {
    return this.usersService.updateMyProfile(currentUser.id, input);
  }

  async buildAuthPayloadForUser(user: User, jti: string): Promise<AuthPayload> {
    let tenantSlug: string | undefined;

    if (user.organizationId) {
      const organization = await this.organizationsService.findByIdOrNull(
        user.organizationId,
      );
      tenantSlug = organization?.slug;
    }

    return this.buildAuthPayload(user, jti, tenantSlug);
  }

  async logout(currentUser: AuthenticatedUser): Promise<boolean> {
    return this.sessionsService.deleteSessionByJti(currentUser.jti);
  }

  async deleteSecurityForEmail(email: string): Promise<void> {
    await this.authSecurityRepository.delete({ email: normalizeEmail(email) });
  }

  private async createUserAccount(input: {
    email: string;
    passwordHash: string;
    organizationId: string;
    firstName?: string | null;
    lastName?: string | null;
  }): Promise<User> {
    try {
      return await this.usersService.createUser({
        ...input,
        role: UserRole.USER,
        isActive: true,
      });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictError('Email already exists.');
      }

      throw error;
    }
  }

  private async buildAuthPayload(
    user: User,
    jti: string,
    tenantSlug?: string,
  ): Promise<AuthPayload> {
    const { accessToken, refreshToken } = await this.buildTokenPair(
      user,
      jti,
      tenantSlug,
    );
    const decodedAccessToken = this.jwtService.decode(accessToken);

    return {
      accessToken,
      refreshToken,
      tokenType: TOKEN_TYPE,
      expiresIn: getTokenLifetimeInSeconds(decodedAccessToken),
      user,
    };
  }

  async buildTokenPair(
    user: User,
    jti: string,
    tenantSlug?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessTokenExpiration =
      this.configService.get<string>('JWT_EXPIRATION');
    const refreshTokenExpiration = this.configService.get<string>(
      'JWT_REFRESH_EXPIRATION',
    );

    if (!accessTokenExpiration) {
      throw new Error('JWT_EXPIRATION is not configured.');
    }

    if (!refreshTokenExpiration) {
      throw new Error('JWT_REFRESH_EXPIRATION is not configured.');
    }

    const accessToken = await this.jwtService.signAsync(
      toJwtPayload(user, TokenType.ACCESS, jti, tenantSlug),
      {
        expiresIn: parseJwtExpiration(accessTokenExpiration),
      },
    );
    const refreshToken = await this.jwtService.signAsync(
      toJwtPayload(user, TokenType.REFRESH, jti, tenantSlug),
      {
        expiresIn: parseJwtExpiration(refreshTokenExpiration),
      },
    );

    return { accessToken, refreshToken };
  }

  private async findSecurity(
    email: string,
  ): Promise<AuthSecurityRecord | null> {
    if (!(await this.authSecurityRepository.exists({ email }))) {
      return null;
    }

    return this.authSecurityRepository.find({ email });
  }

  private async saveSecurity(
    email: string,
    security: AuthSecurityRecord | null,
    patch: Partial<AuthSecurityRecord>,
  ): Promise<void> {
    const now = new Date();

    if (security) {
      await this.authSecurityRepository.update(
        { id: security.id },
        { ...patch, updatedAt: now },
      );
      return;
    }

    await this.authSecurityRepository.create({
      id: new Types.ObjectId().toHexString(),
      email,
      loginFailures: 0,
      failureWindowStartedAt: null,
      blockedUntil: null,
      resetCodeHash: null,
      resetCodeExpiresAt: null,
      resetCodeUsedAt: null,
      lastResetSentAt: null,
      createdAt: now,
      updatedAt: now,
      ...patch,
    });
  }
}

function parseJwtExpiration(value: string): number | StringValue {
  if (/^\d+$/.test(value)) {
    return Number(value);
  }

  return value as StringValue;
}

function validateRegisterUserInput(input: RegisterUserInput): void {
  if (input.password !== input.confirmPassword) {
    throw new ValidationError('Passwords do not match.', {
      field: 'confirmPassword',
    });
  }
}

function toJwtPayload(
  user: User,
  type: TokenType,
  jti: string,
  tenantSlug?: string,
): JwtPayload {
  return {
    sub: user.id,
    email: user.email,
    role: user.role,
    type,
    jti,
    ...(tenantSlug && { tenantSlug }),
  };
}

function getTokenLifetimeInSeconds(token: unknown): number {
  if (!isJwtClaims(token)) {
    throw new Error('Unable to determine token expiration.');
  }

  return token.exp - token.iat;
}

function isJwtClaims(value: unknown): value is { exp: number; iat: number } {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return (
    'exp' in value &&
    typeof value.exp === 'number' &&
    'iat' in value &&
    typeof value.iat === 'number'
  );
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 11000
  );
}
