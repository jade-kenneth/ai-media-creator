import { UserRole } from '../../graphql/generated/graphql';
import type { SessionsService } from '../sessions/sessions.service';
import type { UsersService } from '../users/users.service';
import type { AuthService } from './auth.service';
import { GoogleAuthService } from './google-auth.service';
import type {
  GoogleIdentity,
  GoogleIdentityService,
} from './google-identity.service';
import type { AuthenticatedUser } from './types/auth-context';

describe('GoogleAuthService', () => {
  it('refuses to sign in when no account owns the Google subject', async () => {
    const fixture = createService({ identity: identity({ email: null }) });

    await expect(
      fixture.service.loginWithGoogle('id-token'),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    expect(fixture.sessionsService.createSession).not.toHaveBeenCalled();
  });

  it('signs in the account already linked to the subject', async () => {
    const fixture = createService({ bySub: userRecord() });

    await expect(fixture.service.loginWithGoogle('id-token')).resolves.toEqual({
      accessToken: 'access',
    });
    expect(fixture.usersService.linkGoogleSub).not.toHaveBeenCalled();
    expect(fixture.sessionsService.createSession).toHaveBeenCalled();
  });

  it('adopts a matching account only when Google reports the email verified', async () => {
    const fixture = createService({ byEmail: userRecord() });

    await expect(fixture.service.loginWithGoogle('id-token')).resolves.toEqual({
      accessToken: 'access',
    });
    expect(fixture.usersService.linkGoogleSub).toHaveBeenCalledWith(
      'user-1',
      'google-sub-1',
    );
  });

  it('never adopts an account from an unverified Google email', async () => {
    const fixture = createService({
      byEmail: userRecord(),
      identity: identity({ emailVerified: false }),
    });

    await expect(
      fixture.service.loginWithGoogle('id-token'),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    expect(fixture.usersService.linkGoogleSub).not.toHaveBeenCalled();
  });

  it('never adopts an account that is already linked to a different subject', async () => {
    const fixture = createService({
      byEmail: userRecord({ googleSub: 'other-google-sub' }),
    });

    await expect(
      fixture.service.loginWithGoogle('id-token'),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    expect(fixture.usersService.linkGoogleSub).not.toHaveBeenCalled();
  });

  it('refuses to sign in an inactive account', async () => {
    const fixture = createService({ bySub: userRecord({ isActive: false }) });

    await expect(
      fixture.service.loginWithGoogle('id-token'),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    expect(fixture.sessionsService.createSession).not.toHaveBeenCalled();
  });

  it('rejects linking a subject another account already owns', async () => {
    const fixture = createService({ bySub: userRecord({ id: 'user-2' }) });

    await expect(
      fixture.service.linkGoogleAccount(currentUser(), 'id-token'),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    expect(fixture.usersService.linkGoogleSub).not.toHaveBeenCalled();
  });

  it('rejects rebinding an account that is already linked', async () => {
    const fixture = createService({ linkGoogleSub: false });

    await expect(
      fixture.service.linkGoogleAccount(currentUser(), 'id-token'),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it('is a no-op link when the account already owns the subject', async () => {
    const fixture = createService({ bySub: userRecord() });

    await expect(
      fixture.service.linkGoogleAccount(currentUser(), 'id-token'),
    ).resolves.toMatchObject({ id: 'user-1' });
    expect(fixture.usersService.linkGoogleSub).not.toHaveBeenCalled();
  });
});

function createService({
  bySub = null,
  byEmail = null,
  identity: googleIdentity = identity(),
  linkGoogleSub = true,
}: {
  bySub?: ReturnType<typeof userRecord> | null;
  byEmail?: ReturnType<typeof userRecord> | null;
  identity?: GoogleIdentity;
  linkGoogleSub?: boolean;
} = {}) {
  const googleIdentityService = {
    verifyIdToken: jest.fn().mockResolvedValue(googleIdentity),
  } as unknown as GoogleIdentityService;

  const usersService = {
    findRecordByGoogleSub: jest.fn().mockResolvedValue(bySub),
    findRecordByEmail: jest.fn().mockResolvedValue(byEmail),
    findById: jest.fn().mockResolvedValue({ id: 'user-1' }),
    linkGoogleSub: jest.fn().mockResolvedValue(linkGoogleSub),
    unlinkGoogleSub: jest.fn().mockResolvedValue(true),
  } as unknown as jest.Mocked<UsersService>;

  const sessionsService = {
    createSession: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<SessionsService>;

  const authService = {
    buildAuthPayloadForUser: jest.fn().mockResolvedValue({
      accessToken: 'access',
    }),
  } as unknown as jest.Mocked<AuthService>;

  return {
    service: new GoogleAuthService(
      googleIdentityService,
      usersService,
      sessionsService,
      authService,
    ),
    usersService,
    sessionsService,
    authService,
  };
}

function identity(overrides: Partial<GoogleIdentity> = {}): GoogleIdentity {
  return {
    sub: 'google-sub-1',
    email: 'user@example.com',
    emailVerified: true,
    firstName: 'Ada',
    lastName: 'Lovelace',
    ...overrides,
  };
}

function userRecord(
  overrides: Partial<{
    id: string;
    isActive: boolean;
    googleSub: string | null;
  }> = {},
) {
  return {
    id: 'user-1',
    email: 'user@example.com',
    role: UserRole.USER,
    isActive: true,
    googleSub: null,
    ...overrides,
  };
}

function currentUser(): AuthenticatedUser {
  return {
    id: 'user-1',
    email: 'user@example.com',
    role: UserRole.USER,
    isActive: true,
    jti: 'jti-1',
  };
}
