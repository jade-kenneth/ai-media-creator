import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {
  ResetCodeStatus,
  UserRole,
  type User,
} from '../../graphql/generated/graphql';
import type {
  AuthSecurityRecord,
  AuthSecurityRepository,
} from './repositories/auth-security.repository';
import { AuthService } from './auth.service';

describe('AuthService password reset security', () => {
  it('returns the same neutral payload for known, unknown, and cooling-down emails', async () => {
    const known = createService({ userRecord: userRecord() });
    const unknown = createService();
    const coolingDown = createService({
      security: securityRecord({ lastResetSentAt: new Date() }),
      userRecord: userRecord(),
    });

    const [knownResult, unknownResult, coolingDownResult] = await Promise.all([
      known.service.requestPasswordReset(' User@Example.com '),
      unknown.service.requestPasswordReset(' User@Example.com '),
      coolingDown.service.requestPasswordReset(' User@Example.com '),
    ]);

    expect(knownResult).toEqual(unknownResult);
    expect(knownResult).toEqual(coolingDownResult);
    expect(knownResult).toEqual({
      accepted: true,
      message:
        "If an account exists for user@example.com, we've sent it a 6-digit code.",
    });
    expect(known.mailService.sendEmail).toHaveBeenCalledWith(
      'user@example.com',
      'Your Example Product password reset code',
      expect.stringContaining('It expires in 15 minutes.'),
    );
    expect(unknown.mailService.sendEmail).not.toHaveBeenCalled();
    expect(coolingDown.mailService.sendEmail).not.toHaveBeenCalled();
  });

  it('marks a reset code used, rejects its reuse, and revokes every session', async () => {
    const code = '123456';
    const passwordHash = await bcrypt.hash(code, 4);
    const fixture = createService({
      security: securityRecord({
        resetCodeExpiresAt: new Date(Date.now() + 60_000),
        resetCodeHash: passwordHash,
      }),
      userRecord: userRecord(),
    });

    await expect(
      fixture.service.resetPassword({
        code,
        email: 'USER@example.com',
        newPassword: 'new-password',
      }),
    ).resolves.toBe(true);

    expect(fixture.usersService.updatePasswordHash).toHaveBeenCalledWith(
      'user-1',
      expect.any(String),
    );
    expect(
      fixture.sessionsService.deleteSessionsByAccountId,
    ).toHaveBeenCalledWith('user-1');
    await expect(
      fixture.service.verifyResetCode('user@example.com', code),
    ).resolves.toEqual({ status: ResetCodeStatus.INVALID });
  });

  it('reports an expired reset code as expired rather than invalid', async () => {
    const fixture = createService({
      security: securityRecord({
        resetCodeExpiresAt: new Date(Date.now() - 1),
        resetCodeHash: 'unused-hash',
      }),
    });

    await expect(
      fixture.service.verifyResetCode('user@example.com', 'wrong-code'),
    ).resolves.toEqual({ status: ResetCodeStatus.EXPIRED });
  });
});

function createService(options?: {
  security?: AuthSecurityRecord;
  userRecord?: ReturnType<typeof userRecord>;
}) {
  let currentSecurity = options?.security ?? null;
  const authSecurityRepository = {
    create: jest.fn(async (record: AuthSecurityRecord) => {
      currentSecurity = record;
      return record;
    }),
    delete: jest.fn().mockResolvedValue(undefined),
    exists: jest.fn(async () => currentSecurity !== null),
    find: jest.fn(async () => currentSecurity),
    update: jest.fn(
      async (_filter: unknown, patch: Partial<AuthSecurityRecord>) => {
        if (currentSecurity) currentSecurity = { ...currentSecurity, ...patch };
      },
    ),
  };
  const jwtService = {
    decode: jest.fn(() => ({ exp: 120, iat: 0 })),
    signAsync: jest
      .fn()
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token'),
  };
  const configService = {
    get: jest.fn((name: string) => {
      const values: Record<string, string> = {
        JWT_EXPIRATION: '15m',
        JWT_REFRESH_EXPIRATION: '30d',
      };
      return values[name];
    }),
    getOrThrow: jest.fn((name: string) => {
      if (name === 'BREVO_SENDER_NAME') return 'Example Product';
      throw new Error(`${name} is not configured.`);
    }),
  };
  const usersService = {
    findById: jest.fn(async () =>
      options?.userRecord ? toUser(options.userRecord) : null,
    ),
    findRecordByEmail: jest.fn(async () => options?.userRecord ?? null),
    updatePasswordHash: jest.fn().mockResolvedValue(undefined),
  };
  const sessionsService = {
    createSession: jest.fn().mockResolvedValue(undefined),
    deleteSessionsByAccountId: jest.fn().mockResolvedValue(undefined),
  };
  const organizationsService = {
    findBySlug: jest.fn(async () => ({
      id: 'organization-1',
      isActive: true,
      slug: 'example-organization',
    })),
  };
  const mailService = {
    sendEmail: jest.fn().mockResolvedValue(undefined),
  };
  const service = new AuthService(
    jwtService as unknown as JwtService,
    configService as unknown as ConfigService,
    usersService as never,
    sessionsService as never,
    organizationsService as never,
    mailService as never,
    authSecurityRepository as unknown as AuthSecurityRepository,
  );

  return {
    authSecurityRepository,
    jwtService,
    mailService,
    organizationsService,
    service,
    sessionsService,
    usersService,
  };
}

function securityRecord(
  overrides: Partial<AuthSecurityRecord> = {},
): AuthSecurityRecord {
  const now = new Date('2026-07-31T00:00:00.000Z');

  return {
    blockedUntil: null,
    createdAt: now,
    email: 'user@example.com',
    failureWindowStartedAt: null,
    id: 'security-1',
    lastResetSentAt: null,
    loginFailures: 0,
    resetCodeExpiresAt: null,
    resetCodeHash: null,
    resetCodeUsedAt: null,
    updatedAt: now,
    ...overrides,
  };
}

function userRecord(overrides: Record<string, unknown> = {}) {
  const now = new Date('2026-07-31T00:00:00.000Z');

  return {
    createdAt: now,
    email: 'user@example.com',
    firstName: 'Example',
    id: 'user-1',
    isActive: true,
    lastName: 'User',
    organizationId: 'organization-1',
    passwordHash: 'password-hash',
    position: null,
    role: UserRole.USER,
    updatedAt: now,
    ...overrides,
  };
}

function toUser(record: ReturnType<typeof userRecord>): User {
  return {
    createdAt: record.createdAt,
    email: record.email,
    firstName: record.firstName,
    id: record.id,
    isActive: record.isActive,
    lastName: record.lastName,
    organizationId: record.organizationId,
    position: record.position,
    role: record.role,
    updatedAt: record.updatedAt,
  } as User;
}
