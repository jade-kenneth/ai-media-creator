import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { StringValue } from 'ms';
import {
  ConflictError,
  InvalidCredentialsError,
  NotAffiliatedMemberError,
  ValidationError,
} from 'src/common/errors/app.error';
import {
  RegistrationStatus,
  UserRole,
  type AuthPayload,
  type LoginInput,
  type RegisterMemberInput,
  type User,
} from '../../graphql/generated/graphql';
import { OrganizationsService } from '../organizations/organizations.service';
import {
  REGISTRATION_EVENTS,
  RegistrationSubmittedEvent,
} from '../members/events/registration.events';
import { MembersService } from '../members/members.service';
import { SessionsService } from '../sessions/sessions.service';
import { UsersService } from '../users/users.service';
import { assertMemberCanAuthenticate } from './registration-approval';
import type { AuthenticatedUser, JwtPayload } from './types/auth-context';
import { TokenType } from './types/auth-context';
const PASSWORD_SALT_ROUNDS = 10;
const TOKEN_TYPE = 'Bearer';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly membersService: MembersService,
    private readonly sessionService: SessionsService,
    private readonly organizationsService: OrganizationsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async registerMember(input: RegisterMemberInput): Promise<AuthPayload> {
    validateRegistrationInput(input);

    const organization = await this.organizationsService.findBySlug(input.organizationSlug);

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

    const user = await this.createMemberUser(
      input.email,
      passwordHash,
      organization.id,
    );

    try {
      await this.membersService.createProfile({
        userId: user.id,
        organizationId: organization.id,
        firstName: input.firstName,
        lastName: input.lastName,
        contactNumber: input.contactNumber,
      });
    } catch (error) {
      await this.usersService.deleteById(user.id).catch(() => undefined);
      throw error;
    }

    this.eventEmitter.emit(
      REGISTRATION_EVENTS.SUBMITTED,
      new RegistrationSubmittedEvent(
        organization.id,
        organization.name,
        input.firstName,
        input.lastName,
        input.email,
      ),
    );

    const jti = crypto.randomUUID();
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

    assertMemberCanAuthenticate(userRecord);

    if (userRecord.role !== UserRole.MEMBER && !userRecord.isActive) {
      throw new UnauthorizedException('User account is inactive.');
    }

    if (input.organizationSlug && userRecord.organizationId != null) {
      const selectedOrganization = await this.organizationsService.findBySlug(
        input.organizationSlug,
      );

      if (!selectedOrganization || !selectedOrganization.isActive) {
        throw new ForbiddenException('Organization not found or inactive.');
      }

      if (userRecord.organizationId !== selectedOrganization.id.toString()) {
        throw new NotAffiliatedMemberError();
      }
    }

    const user = await this.usersService.findById(userRecord.id);

    if (!user) {
      throw new UnauthorizedException('Authentication required.');
    }

    await this.sessionService.deleteSessionsByAccountId(user.id);

    const jti = crypto.randomUUID();

    await this.sessionService.createSession({
      accountId: user.id,
      jti,
      dateTimeCreated: new Date(),
      dateTimeLastRefreshed: new Date(),
    });

    let tenantSlug: string | undefined;

    if (userRecord.organizationId) {
      const organization = await this.organizationsService.findByIdOrNull(
        userRecord.organizationId,
      );
      tenantSlug = organization?.slug;
    }

    return this.buildAuthPayload(user, jti, tenantSlug);
  }

  async me(currentUser: AuthenticatedUser): Promise<User> {
    const user = await this.usersService.findById(currentUser.id);

    if (!user) {
      throw new UnauthorizedException('Authentication required.');
    }

    return user;
  }

  async buildAuthPayloadForUser(user: User, jti: string): Promise<AuthPayload> {
    let tenantSlug: string | undefined;
    if (user.organizationId) {
      const organization = await this.organizationsService.findByIdOrNull(user.organizationId);
      tenantSlug = organization?.slug;
    }
    return this.buildAuthPayload(user, jti, tenantSlug);
  }

  logout(): boolean {
    return true;
  }

  private async createMemberUser(
    email: string,
    passwordHash: string,
    organizationId: string,
  ): Promise<User> {
    try {
      return await this.usersService.createUser({
        email,
        passwordHash,
        role: UserRole.MEMBER,
        isActive: false,
        organizationId,
        registrationStatus: RegistrationStatus.pending_approval,
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
}

function parseJwtExpiration(value: string): number | StringValue {
  if (/^\d+$/.test(value)) {
    return Number(value);
  }

  return value as StringValue;
}

function validateRegistrationInput(input: RegisterMemberInput): void {
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
