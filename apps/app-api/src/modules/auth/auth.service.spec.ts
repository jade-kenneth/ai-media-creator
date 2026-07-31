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
  it('returns the same neutral payload without persisting unknown accounts', async () => {
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
    expect(
      unknown.authSecurityRepository.reserveResetRequest,
    ).not.toHaveBeenCalled();
    expect(coolingDown.mailService.sendEmail).not.toHaveBeenCalled();
  });

  it('releases a delivery reservation so a failed send can be retried', async () => {
    const fixture = createService({
      mailFailures: 1,
      userRecord: userRecord(),
    });

    await fixture.service.requestPasswordReset('user@example.com');
    await fixture.service.requestPasswordReset('user@example.com');

    expect(fixture.mailService.sendEmail).toHaveBeenCalledTimes(2);
    expect(
      fixture.authSecurityRepository.releaseResetRequest,
    ).toHaveBeenCalledTimes(1);
    expect(fixture.authSecurityRepository.storeResetCode).toHaveBeenCalledTimes(
      1,
    );
  });

  it('sends only one code for concurrent reset requests', async () => {
    const fixture = createService({ userRecord: userRecord() });

    await Promise.all([
      fixture.service.requestPasswordReset('user@example.com'),
      fixture.service.requestPasswordReset('user@example.com'),
    ]);

    expect(fixture.mailService.sendEmail).toHaveBeenCalledTimes(1);
    expect(
      fixture.authSecurityRepository.reserveResetRequest,
    ).toHaveBeenCalledTimes(2);
  });

  it('marks a reset code used, rejects its reuse, and revokes every session', async () => {
    const code = '123456';
    const resetCodeHash = await bcrypt.hash(code, 4);
    const fixture = createService({
      security: securityRecord({
        resetCodeExpiresAt: new Date(Date.now() + 60_000),
        resetCodeHash,
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

    expect(
      fixture.usersService.updatePasswordHashIfCurrent,
    ).toHaveBeenCalledWith('user-1', 'password-hash', expect.any(String));
    expect(
      fixture.sessionsService.deleteSessionsByAccountId,
    ).toHaveBeenCalledWith('user-1');
    await expect(
      fixture.service.verifyResetCode('user@example.com', code),
    ).resolves.toEqual({ status: ResetCodeStatus.INVALID });
  });

  it('only reports expiry after the submitted code matches', async () => {
    const code = '123456';
    const resetCodeHash = await bcrypt.hash(code, 4);
    const known = createService({
      security: securityRecord({
        resetCodeExpiresAt: new Date(Date.now() - 1),
        resetCodeHash,
      }),
    });
    const unknown = createService();

    await expect(
      known.service.verifyResetCode('user@example.com', 'wrong-code'),
    ).resolves.toEqual({ status: ResetCodeStatus.INVALID });
    await expect(
      unknown.service.verifyResetCode('user@example.com', 'wrong-code'),
    ).resolves.toEqual({ status: ResetCodeStatus.INVALID });
    await expect(
      known.service.verifyResetCode('user@example.com', code),
    ).resolves.toEqual({ status: ResetCodeStatus.EXPIRED });
  });

  it('invalidates a reset code after five incorrect attempts', async () => {
    const code = '123456';
    const resetCodeHash = await bcrypt.hash(code, 4);
    const fixture = createService({
      security: securityRecord({
        resetCodeExpiresAt: new Date(Date.now() + 60_000),
        resetCodeHash,
      }),
    });

    const attempts = await Promise.all(
      Array.from({ length: 5 }, () =>
        fixture.service.verifyResetCode('user@example.com', 'wrong-code'),
      ),
    );

    expect(attempts).toEqual(
      Array.from({ length: 5 }, () => ({ status: ResetCodeStatus.INVALID })),
    );

    await expect(
      fixture.service.verifyResetCode('user@example.com', code),
    ).resolves.toEqual({ status: ResetCodeStatus.INVALID });
    expect(
      fixture.authSecurityRepository.recordInvalidResetCodeAttempt,
    ).toHaveBeenCalledTimes(5);
  });

  it('allows only one concurrent reset to claim a code', async () => {
    const code = '123456';
    const resetCodeHash = await bcrypt.hash(code, 4);
    const fixture = createService({
      security: securityRecord({
        resetCodeExpiresAt: new Date(Date.now() + 60_000),
        resetCodeHash,
      }),
      userRecord: userRecord(),
    });

    const results = await Promise.allSettled([
      fixture.service.resetPassword({
        code,
        email: 'user@example.com',
        newPassword: 'first-password',
      }),
      fixture.service.resetPassword({
        code,
        email: 'user@example.com',
        newPassword: 'second-password',
      }),
    ]);

    expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(
      1,
    );
    expect(results.filter(({ status }) => status === 'rejected')).toHaveLength(
      1,
    );
    expect(
      fixture.sessionsService.deleteSessionsByAccountId,
    ).toHaveBeenCalledTimes(1);
  });

  it('restores the prior password and releases the code when revocation fails', async () => {
    const code = '123456';
    const resetCodeHash = await bcrypt.hash(code, 4);
    const fixture = createService({
      security: securityRecord({
        resetCodeExpiresAt: new Date(Date.now() + 60_000),
        resetCodeHash,
      }),
      sessionDeletionError: new Error('session store unavailable'),
      userRecord: userRecord(),
    });

    await expect(
      fixture.service.resetPassword({
        code,
        email: 'user@example.com',
        newPassword: 'new-password',
      }),
    ).rejects.toThrow('session store unavailable');

    expect(
      fixture.usersService.updatePasswordHashIfCurrent,
    ).toHaveBeenCalledTimes(2);
    expect(
      fixture.authSecurityRepository.releaseResetCodeClaim,
    ).toHaveBeenCalledTimes(1);
    await expect(
      fixture.service.verifyResetCode('user@example.com', code),
    ).resolves.toEqual({ status: ResetCodeStatus.VALID });
  });

  it('releases the code when the password compare-and-set fails before writing', async () => {
    const code = '123456';
    const resetCodeHash = await bcrypt.hash(code, 4);
    const fixture = createService({
      passwordUpdateError: new Error('user store unavailable'),
      security: securityRecord({
        resetCodeExpiresAt: new Date(Date.now() + 60_000),
        resetCodeHash,
      }),
      userRecord: userRecord(),
    });

    await expect(
      fixture.service.resetPassword({
        code,
        email: 'user@example.com',
        newPassword: 'new-password',
      }),
    ).rejects.toThrow('user store unavailable');

    expect(
      fixture.authSecurityRepository.releaseResetCodeClaim,
    ).toHaveBeenCalledTimes(1);
    await expect(
      fixture.service.verifyResetCode('user@example.com', code),
    ).resolves.toEqual({ status: ResetCodeStatus.VALID });
  });
});

describe('AuthService tenant login with security state', () => {
  it('does not create or mutate security rows for unknown emails', async () => {
    const fixture = createService();

    await expect(
      fixture.service.login({
        email: 'rotating-value@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toThrow();

    expect(
      fixture.authSecurityRepository.recordLoginFailure,
    ).not.toHaveBeenCalled();
    expect(fixture.authSecurityRepository.exists).not.toHaveBeenCalled();
  });

  it('reserves all five concurrent failed login attempts atomically', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 4);
    const fixture = createService({
      userRecord: userRecord({ passwordHash }),
    });

    const attempts = await Promise.allSettled(
      Array.from({ length: 5 }, () =>
        fixture.service.login({
          email: 'user@example.com',
          password: 'wrong-password',
        }),
      ),
    );

    expect(attempts.every(({ status }) => status === 'rejected')).toBe(true);
    expect(
      fixture.authSecurityRepository.recordLoginFailure,
    ).toHaveBeenCalledTimes(5);

    await expect(
      fixture.service.login({
        email: 'user@example.com',
        password: 'correct-password',
      }),
    ).rejects.toThrow('Too many attempts. Please wait a moment and try again.');
  });

  it('clears prior failures and keeps the selected organization in both tokens', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 4);
    const fixture = createService({
      security: securityRecord({
        failureWindowStartedAt: new Date(),
        loginFailures: 2,
      }),
      userRecord: userRecord({ passwordHash }),
    });

    await expect(
      fixture.service.login({
        email: ' USER@example.com ',
        organizationSlug: 'example-organization',
        password: 'correct-password',
      }),
    ).resolves.toMatchObject({
      user: { id: 'user-1', organizationId: 'organization-1' },
    });

    expect(fixture.organizationsService.findBySlug).toHaveBeenCalledWith(
      'example-organization',
    );
    expect(fixture.authSecurityRepository.update).toHaveBeenCalledWith(
      { id: 'security-1' },
      expect.objectContaining({
        blockedUntil: null,
        failureWindowStartedAt: null,
        loginFailures: 0,
      }),
    );
    expect(fixture.jwtService.signAsync).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ tenantSlug: 'example-organization' }),
      expect.any(Object),
    );
    expect(fixture.jwtService.signAsync).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ tenantSlug: 'example-organization' }),
      expect.any(Object),
    );
  });
});

function createService(options?: {
  mailFailures?: number;
  passwordUpdateError?: Error;
  security?: AuthSecurityRecord;
  sessionDeletionError?: Error;
  userRecord?: ReturnType<typeof userRecord>;
}) {
  let currentSecurity = options?.security ?? null;
  let currentUser = options?.userRecord ?? null;
  let remainingMailFailures = options?.mailFailures ?? 0;
  let remainingPasswordUpdateErrors = options?.passwordUpdateError ? 1 : 0;
  const authSecurityRepository = {
    claimResetCode: jest.fn(
      async (input: {
        id: string;
        resetCodeHash: string;
        claimId: string;
        failureLimit: number;
        now: Date;
      }) => {
        if (
          !currentSecurity ||
          currentSecurity.id !== input.id ||
          currentSecurity.resetCodeHash !== input.resetCodeHash ||
          currentSecurity.resetCodeUsedAt ||
          currentSecurity.resetCodeClaimId ||
          !currentSecurity.resetCodeExpiresAt ||
          currentSecurity.resetCodeExpiresAt <= input.now ||
          currentSecurity.resetCodeFailures >= input.failureLimit
        ) {
          return false;
        }

        currentSecurity = {
          ...currentSecurity,
          resetCodeClaimId: input.claimId,
          resetCodeClaimedAt: input.now,
        };
        return true;
      },
    ),
    create: jest.fn(),
    delete: jest.fn().mockResolvedValue(undefined),
    exists: jest.fn(async () => currentSecurity !== null),
    finalizeResetCodeClaim: jest.fn(
      async (id: string, claimId: string, now: Date) => {
        if (
          !currentSecurity ||
          currentSecurity.id !== id ||
          currentSecurity.resetCodeClaimId !== claimId
        ) {
          return false;
        }

        currentSecurity = {
          ...currentSecurity,
          resetCodeClaimId: null,
          resetCodeClaimedAt: null,
          resetCodeExpiresAt: null,
          resetCodeFailures: 0,
          resetCodeHash: null,
          resetCodeUsedAt: now,
        };
        return true;
      },
    ),
    find: jest.fn(async () => currentSecurity),
    recordInvalidResetCodeAttempt: jest.fn(
      async (input: {
        id: string;
        resetCodeHash: string;
        limit: number;
        now: Date;
      }) => {
        if (
          !currentSecurity ||
          currentSecurity.id !== input.id ||
          currentSecurity.resetCodeHash !== input.resetCodeHash ||
          currentSecurity.resetCodeUsedAt ||
          currentSecurity.resetCodeClaimId
        ) {
          return;
        }

        const resetCodeFailures = currentSecurity.resetCodeFailures + 1;
        currentSecurity = {
          ...currentSecurity,
          resetCodeFailures,
          resetCodeUsedAt: resetCodeFailures >= input.limit ? input.now : null,
        };
      },
    ),
    recordLoginFailure: jest.fn(
      async (input: {
        email: string;
        now: Date;
        windowStartsAfter: Date;
        limit: number;
        blockedUntil: Date;
      }) => {
        const withinWindow = Boolean(
          currentSecurity?.failureWindowStartedAt &&
          currentSecurity.failureWindowStartedAt > input.windowStartsAfter,
        );
        const loginFailures = withinWindow
          ? (currentSecurity?.loginFailures ?? 0) + 1
          : 1;
        currentSecurity = securityRecord({
          ...currentSecurity,
          email: input.email,
          loginFailures,
          failureWindowStartedAt: withinWindow
            ? currentSecurity?.failureWindowStartedAt
            : input.now,
          blockedUntil:
            loginFailures >= input.limit ? input.blockedUntil : null,
        });
      },
    ),
    releaseResetCodeClaim: jest.fn(async (id: string, claimId: string) => {
      if (
        currentSecurity?.id === id &&
        currentSecurity.resetCodeClaimId === claimId
      ) {
        currentSecurity = {
          ...currentSecurity,
          resetCodeClaimId: null,
          resetCodeClaimedAt: null,
        };
      }
    }),
    releaseResetRequest: jest.fn(
      async (reservationId: string, email: string) => {
        if (
          currentSecurity?.email === email &&
          currentSecurity.resetRequestReservationId === reservationId
        ) {
          currentSecurity = {
            ...currentSecurity,
            lastResetSentAt: null,
            resetRequestReservationId: null,
          };
        }
      },
    ),
    reserveResetRequest: jest.fn(
      async (input: {
        email: string;
        now: Date;
        eligibleBefore: Date;
        reservationId: string;
      }) => {
        if (
          currentSecurity?.resetCodeClaimId ||
          (currentSecurity?.lastResetSentAt &&
            currentSecurity.lastResetSentAt >= input.eligibleBefore)
        ) {
          return false;
        }

        currentSecurity = securityRecord({
          ...currentSecurity,
          email: input.email,
          lastResetSentAt: input.now,
          resetRequestReservationId: input.reservationId,
        });
        return true;
      },
    ),
    storeResetCode: jest.fn(
      async (input: {
        email: string;
        reservationId: string;
        resetCodeHash: string;
        resetCodeExpiresAt: Date;
        now: Date;
      }) => {
        if (
          currentSecurity?.email !== input.email ||
          currentSecurity.resetRequestReservationId !== input.reservationId
        ) {
          return false;
        }

        currentSecurity = {
          ...currentSecurity,
          resetCodeClaimId: null,
          resetCodeClaimedAt: null,
          resetCodeExpiresAt: input.resetCodeExpiresAt,
          resetCodeFailures: 0,
          resetCodeHash: input.resetCodeHash,
          resetCodeUsedAt: null,
          resetRequestReservationId: null,
          updatedAt: input.now,
        };
        return true;
      },
    ),
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
    findById: jest.fn(async () => (currentUser ? toUser(currentUser) : null)),
    findRecordByEmail: jest.fn(async () => currentUser),
    updatePasswordHash: jest.fn().mockResolvedValue(undefined),
    updatePasswordHashIfCurrent: jest.fn(
      async (id: string, currentPasswordHash: string, passwordHash: string) => {
        if (remainingPasswordUpdateErrors > 0) {
          remainingPasswordUpdateErrors -= 1;
          throw options?.passwordUpdateError;
        }

        if (
          !currentUser ||
          currentUser.id !== id ||
          currentUser.passwordHash !== currentPasswordHash
        ) {
          return false;
        }

        currentUser = { ...currentUser, passwordHash };
        return true;
      },
    ),
  };
  const sessionsService = {
    createSession: jest.fn().mockResolvedValue(undefined),
    deleteSessionsByAccountId: options?.sessionDeletionError
      ? jest.fn().mockRejectedValue(options.sessionDeletionError)
      : jest.fn().mockResolvedValue(undefined),
  };
  const organizationsService = {
    findBySlug: jest.fn(async () => ({
      id: 'organization-1',
      isActive: true,
      slug: 'example-organization',
    })),
  };
  const mailService = {
    sendEmail: jest.fn(async () => {
      if (remainingMailFailures > 0) {
        remainingMailFailures -= 1;
        throw new Error('mail unavailable');
      }
    }),
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
    resetCodeClaimedAt: null,
    resetCodeClaimId: null,
    resetCodeExpiresAt: null,
    resetCodeFailures: 0,
    resetCodeHash: null,
    resetCodeUsedAt: null,
    resetRequestReservationId: null,
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
