import { ConfigService } from '@nestjs/config';
import {
  ExternalServiceError,
  TurnstileVerificationError,
  ValidationError,
} from 'src/common/errors/app.error';
import { TurnstileService, type TurnstileRequest } from './turnstile.service';

describe('TurnstileService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('skips verification entirely while Turnstile is disabled', async () => {
    const fetchMock = mockSiteverify({ success: true, action: 'login' });
    const service = createService({ enabled: false });

    await expect(
      service.assertVerified(request(), { action: 'login' }),
    ).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects a request with no token before calling Cloudflare', async () => {
    const fetchMock = mockSiteverify({ success: true, action: 'login' });
    const service = createService();

    await expect(
      service.assertVerified(request({ headers: {} }), { action: 'login' }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('accepts a token whose action matches and forwards the client ip', async () => {
    const fetchMock = mockSiteverify({ success: true, action: 'login' });
    const service = createService();

    await expect(
      service.assertVerified(
        request({
          headers: {
            'x-turnstile-token': 'token-value',
            'x-forwarded-for': '203.0.113.7, 198.51.100.1',
          },
        }),
        { action: 'login' },
      ),
    ).resolves.toBeUndefined();

    const body = fetchMock.mock.calls[0]?.[1]?.body as URLSearchParams;
    expect(body.get('secret')).toBe('secret-key');
    expect(body.get('response')).toBe('token-value');
    expect(body.get('remoteip')).toBe('203.0.113.7');
  });

  it('rejects a token minted for a different action', async () => {
    const service = createService();
    mockSiteverify({ success: true, action: 'signup' });

    await expect(
      service.assertVerified(request(), { action: 'login' }),
    ).rejects.toMatchObject({
      code: 'TURNSTILE_VERIFICATION_FAILED',
      details: { reason: 'ACTION_MISMATCH' },
    });
  });

  it('rejects a challenge Cloudflare did not accept', async () => {
    const service = createService();
    mockSiteverify({
      success: false,
      'error-codes': ['invalid-input-response'],
    });

    await expect(
      service.assertVerified(request(), { action: 'login' }),
    ).rejects.toBeInstanceOf(TurnstileVerificationError);
  });

  it('surfaces an upstream failure rather than letting the request through', async () => {
    const service = createService();
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'));
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(
      service.assertVerified(request(), { action: 'login' }),
    ).rejects.toBeInstanceOf(ExternalServiceError);
  });

  it('reads the token from the request body when no header is present', async () => {
    const fetchMock = mockSiteverify({ success: true, action: 'login' });
    const service = createService();

    await service.assertVerified(
      request({ headers: {}, body: { turnstileToken: 'body-token' } }),
      { action: 'login' },
    );

    const body = fetchMock.mock.calls[0]?.[1]?.body as URLSearchParams;
    expect(body.get('response')).toBe('body-token');
  });
});

function createService({ enabled = true }: { enabled?: boolean } = {}) {
  const configService = {
    get: (key: string) =>
      ({
        TURNSTILE_ENABLED: enabled,
        CLOUDFLARE_TURNSTILE_SECRET_KEY: 'secret-key',
      })[key],
  } as unknown as ConfigService;

  return new TurnstileService(configService);
}

function mockSiteverify(payload: Record<string, unknown>) {
  const fetchMock = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ 'error-codes': [], ...payload }),
  });

  global.fetch = fetchMock as unknown as typeof fetch;

  return fetchMock;
}

function request(overrides: Partial<TurnstileRequest> = {}): TurnstileRequest {
  return {
    headers: { 'x-turnstile-token': 'token-value' },
    ip: '198.51.100.10',
    ...overrides,
  };
}
