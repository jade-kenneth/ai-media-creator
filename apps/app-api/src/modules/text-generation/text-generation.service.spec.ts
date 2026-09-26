import type { ConfigService } from '@nestjs/config';
import { GenerationFailureCode } from 'src/graphql/generated/graphql';
import { GenerationJobError } from '../generation-jobs/generation-jobs.types';
import { AnthropicTextProvider } from './providers/anthropic-text.provider';
import { DeepSeekTextProvider } from './providers/deepseek-text.provider';
import { MiniMaxTextProvider } from './providers/minimax-text.provider';
import { OpenAiTextProvider } from './providers/openai-text.provider';
import { TextGenerationService } from './text-generation.service';

function config(env: Record<string, unknown>) {
  return { get: (key: string) => env[key] } as unknown as ConfigService;
}

function service(env: Record<string, unknown>) {
  const configService = config(env);
  return new TextGenerationService(
    configService,
    new OpenAiTextProvider(configService),
    new AnthropicTextProvider(configService),
    new DeepSeekTextProvider(configService),
    new MiniMaxTextProvider(configService),
  );
}

const request = {
  schemaName: 'test',
  schema: { type: 'object' },
  messages: [
    { role: 'system' as const, content: 'rules' },
    { role: 'user' as const, content: 'hi' },
  ],
};
const openAi = {
  OPENAI_API_KEY: 'test-key',
  OPENAI_TEXT_MODEL: 'test-model',
};
const anthropic = {
  ANTHROPIC_API_KEY: 'test-key',
  ANTHROPIC_TEXT_MODEL: 'claude-opus-5',
};
const deepSeek = {
  DEEPSEEK_API_KEY: 'test-key',
  DEEPSEEK_TEXT_MODEL: 'deepseek-v4-pro',
};
const miniMax = {
  MINIMAX_TEXT_API_KEY: 'test-subscription-key',
  MINIMAX_TEXT_MODEL: 'MiniMax-M3',
};

function openAiResponse(content: string, finishReason = 'stop') {
  return new Response(
    JSON.stringify({
      choices: [{ finish_reason: finishReason, message: { content } }],
    }),
    { status: 200 },
  );
}

function anthropicResponse(text: string, stopReason = 'end_turn') {
  return new Response(
    JSON.stringify({
      id: 'msg_1',
      type: 'message',
      role: 'assistant',
      model: 'claude-opus-5',
      content: [{ type: 'text', text }],
      stop_reason: stopReason,
      stop_sequence: null,
      usage: { input_tokens: 1, output_tokens: 1 },
    }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  );
}

async function failureCode(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    return (error as GenerationJobError).code;
  }
  return null;
}

describe('TextGenerationService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('fails as not configured without any provider', async () => {
    expect(service({}).isConfigured()).toBe(false);
    expect(await failureCode(service({}).generateJson(request))).toBe(
      GenerationFailureCode.PROVIDER_NOT_CONFIGURED,
    );
  });

  it('uses whichever provider is configured', async () => {
    const fetchMock = jest.fn(async () => anthropicResponse('{"ok":true}'));
    global.fetch = fetchMock as typeof fetch;

    await expect(service(anthropic).generateJson(request)).resolves.toEqual({
      ok: true,
    });
    expect(String((fetchMock.mock.calls[0] as unknown[])[0])).toContain(
      'api.anthropic.com',
    );
  });

  it('follows TEXT_PROVIDER when both are configured', async () => {
    const fetchMock = jest.fn(async () => openAiResponse('{"ok":true}'));
    global.fetch = fetchMock as typeof fetch;

    await service({
      ...openAi,
      ...anthropic,
      TEXT_PROVIDER: 'openai',
    }).generateJson(request);
    expect(String((fetchMock.mock.calls[0] as unknown[])[0])).toContain(
      'api.openai.com',
    );
  });

  it('follows TEXT_PROVIDER to DeepSeek', async () => {
    const fetchMock = jest.fn(async () => openAiResponse('{"ok":true}'));
    global.fetch = fetchMock as typeof fetch;

    await service({
      ...openAi,
      ...deepSeek,
      TEXT_PROVIDER: 'deepseek',
    }).generateJson(request);
    expect(String((fetchMock.mock.calls[0] as unknown[])[0])).toContain(
      'api.deepseek.com',
    );
  });

  it('is not configured when TEXT_PROVIDER names an unconfigured provider', () => {
    expect(
      service({ ...openAi, TEXT_PROVIDER: 'anthropic' }).isConfigured(),
    ).toBe(false);
  });

  describe('fallback', () => {
    const primaryAndFallback = {
      ...anthropic,
      ...deepSeek,
      TEXT_PROVIDER: 'anthropic',
      TEXT_FALLBACK_PROVIDER: 'deepseek',
    };

    function hosts(fetchMock: jest.Mock) {
      return fetchMock.mock.calls.map(
        (call: unknown[]) => new URL(String(call[0])).host,
      );
    }

    it('retries on the fallback when the primary fails', async () => {
      const fetchMock = jest.fn(async (input: unknown) =>
        String(input).includes('anthropic')
          ? new Response('{}', { status: 529 })
          : openAiResponse('{"ok":true}'),
      );
      global.fetch = fetchMock as typeof fetch;

      await expect(
        service(primaryAndFallback).generateJson(request),
      ).resolves.toEqual({ ok: true });
      expect(hosts(fetchMock)).toEqual([
        'api.anthropic.com',
        'api.deepseek.com',
      ]);
    });

    it('falls back when Anthropic reports an exhausted credit balance', async () => {
      const fetchMock = jest.fn(async (input: unknown) =>
        String(input).includes('anthropic')
          ? new Response(
              JSON.stringify({
                type: 'error',
                error: {
                  type: 'invalid_request_error',
                  message:
                    'Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing to purchase credits.',
                },
              }),
              { status: 400, headers: { 'content-type': 'application/json' } },
            )
          : openAiResponse('{"ok":true}'),
      );
      global.fetch = fetchMock as typeof fetch;

      await expect(
        service(primaryAndFallback).generateJson(request),
      ).resolves.toEqual({ ok: true });
      expect(hosts(fetchMock)).toEqual([
        'api.anthropic.com',
        'api.deepseek.com',
      ]);
    });

    it('tries an ordered MiniMax fallback after Anthropic and DeepSeek fail', async () => {
      const fetchMock = jest.fn(async (input: unknown) => {
        const host = new URL(String(input)).host;

        if (host === 'api.anthropic.com') {
          return new Response('{}', { status: 529 });
        }
        if (host === 'api.deepseek.com') {
          return new Response('{}', { status: 500 });
        }
        return anthropicResponse('{"ok":true}');
      });
      global.fetch = fetchMock as typeof fetch;

      await expect(
        service({
          ...primaryAndFallback,
          ...miniMax,
          TEXT_FALLBACK_PROVIDERS: ['deepseek', 'minimax'],
        }).generateJson(request),
      ).resolves.toEqual({ ok: true });
      expect(hosts(fetchMock)).toEqual([
        'api.anthropic.com',
        'api.deepseek.com',
        'api.minimax.io',
      ]);
    });

    it('does not retry a request the primary declined', async () => {
      const fetchMock = jest.fn(async () => anthropicResponse('', 'refusal'));
      global.fetch = fetchMock as typeof fetch;

      expect(
        await failureCode(service(primaryAndFallback).generateJson(request)),
      ).toBe(GenerationFailureCode.PROVIDER_REJECTED);
      expect(hosts(fetchMock)).toEqual(['api.anthropic.com']);
    });

    it('surfaces the fallback failure when both fail', async () => {
      global.fetch = jest.fn(
        async () => new Response('{}', { status: 500 }),
      ) as typeof fetch;

      expect(
        await failureCode(service(primaryAndFallback).generateJson(request)),
      ).toBe(GenerationFailureCode.INTERNAL);
    });

    it('uses the fallback when the primary is not set up', async () => {
      const fetchMock = jest.fn(async () => openAiResponse('{"ok":true}'));
      global.fetch = fetchMock as typeof fetch;
      const env = { ...primaryAndFallback, ANTHROPIC_API_KEY: undefined };

      expect(service(env).isConfigured()).toBe(true);
      await service(env).generateJson(request);
      expect(hosts(fetchMock)).toEqual(['api.deepseek.com']);
    });

    it('calls a provider once when it is both primary and fallback', async () => {
      const fetchMock = jest.fn(
        async () => new Response('{}', { status: 500 }),
      );
      global.fetch = fetchMock as typeof fetch;

      await failureCode(
        service({
          ...deepSeek,
          TEXT_PROVIDER: 'deepseek',
          TEXT_FALLBACK_PROVIDER: 'deepseek',
        }).generateJson(request),
      );
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('OpenAI', () => {
    it('returns the parsed JSON content', async () => {
      global.fetch = jest.fn(async () =>
        openAiResponse('{"ok":true}'),
      ) as typeof fetch;

      await expect(service(openAi).generateJson(request)).resolves.toEqual({
        ok: true,
      });
    });

    it('maps a timeout, a rejection and unusable output to their codes', async () => {
      global.fetch = jest.fn(async () => {
        throw Object.assign(new Error('timeout'), { name: 'TimeoutError' });
      }) as typeof fetch;
      expect(await failureCode(service(openAi).generateJson(request))).toBe(
        GenerationFailureCode.PROVIDER_TIMEOUT,
      );

      global.fetch = jest.fn(
        async () => new Response('{}', { status: 400 }),
      ) as typeof fetch;
      expect(await failureCode(service(openAi).generateJson(request))).toBe(
        GenerationFailureCode.PROVIDER_REJECTED,
      );

      global.fetch = jest.fn(async () =>
        openAiResponse('not json'),
      ) as typeof fetch;
      expect(await failureCode(service(openAi).generateJson(request))).toBe(
        GenerationFailureCode.INVALID_OUTPUT,
      );
    });
  });

  describe('Anthropic', () => {
    it('sends system text top-level with a JSON schema output format', async () => {
      const fetchMock = jest.fn(async () => anthropicResponse('{"ok":true}'));
      global.fetch = fetchMock as typeof fetch;

      await service(anthropic).generateJson(request);

      const init = (fetchMock.mock.calls[0] as unknown[])[1] as RequestInit;
      const body = JSON.parse(String(init.body)) as Record<string, unknown>;
      expect(body).toMatchObject({
        model: 'claude-opus-5',
        system: 'rules',
        messages: [{ role: 'user', content: 'hi' }],
        output_config: {
          format: { type: 'json_schema', schema: { type: 'object' } },
        },
        fallbacks: 'default',
      });
    });

    it('normalizes unsupported nested minItems constraints without mutating the domain schema', async () => {
      const fetchMock = jest.fn(async () => anthropicResponse('{"ok":true}'));
      global.fetch = fetchMock as typeof fetch;
      const constrainedRequest = {
        ...request,
        schema: {
          type: 'object',
          properties: {
            groups: {
              type: 'array',
              minItems: 3,
              maxItems: 3,
              items: {
                type: 'object',
                properties: {
                  values: { type: 'array', minItems: 5, maxItems: 7 },
                },
              },
            },
          },
        },
      };

      await service(anthropic).generateJson(constrainedRequest);

      const init = (fetchMock.mock.calls[0] as unknown[])[1] as RequestInit;
      const body = JSON.parse(String(init.body)) as Record<string, unknown>;
      expect(body).toMatchObject({
        output_config: {
          format: {
            schema: {
              properties: {
                groups: {
                  minItems: 1,
                  items: {
                    properties: { values: { minItems: 1 } },
                  },
                },
              },
            },
          },
        },
      });
      expect(JSON.stringify(body)).not.toContain('maxItems');
      expect(constrainedRequest.schema.properties.groups.minItems).toBe(3);
      expect(constrainedRequest.schema.properties.groups.maxItems).toBe(3);
      expect(
        constrainedRequest.schema.properties.groups.items.properties.values
          .minItems,
      ).toBe(5);
      expect(
        constrainedRequest.schema.properties.groups.items.properties.values
          .maxItems,
      ).toBe(7);
    });

    it('maps a refusal, a bad key and truncated output to their codes', async () => {
      global.fetch = jest.fn(async () =>
        anthropicResponse('', 'refusal'),
      ) as typeof fetch;
      expect(await failureCode(service(anthropic).generateJson(request))).toBe(
        GenerationFailureCode.PROVIDER_REJECTED,
      );

      global.fetch = jest.fn(
        async () =>
          new Response(
            JSON.stringify({
              type: 'error',
              error: { type: 'authentication_error', message: 'bad key' },
            }),
            { status: 401, headers: { 'content-type': 'application/json' } },
          ),
      ) as typeof fetch;
      expect(await failureCode(service(anthropic).generateJson(request))).toBe(
        GenerationFailureCode.PROVIDER_NOT_CONFIGURED,
      );

      global.fetch = jest.fn(async () =>
        anthropicResponse('{"ok":', 'max_tokens'),
      ) as typeof fetch;
      expect(await failureCode(service(anthropic).generateJson(request))).toBe(
        GenerationFailureCode.INVALID_OUTPUT,
      );
    });
  });

  describe('DeepSeek', () => {
    it('sends JSON mode with the schema in the prompt', async () => {
      const fetchMock = jest.fn(async () => openAiResponse('{"ok":true}'));
      global.fetch = fetchMock as typeof fetch;

      await expect(service(deepSeek).generateJson(request)).resolves.toEqual({
        ok: true,
      });

      const init = (fetchMock.mock.calls[0] as unknown[])[1] as RequestInit;
      const body = JSON.parse(String(init.body)) as {
        model: string;
        response_format: unknown;
        messages: Array<{ role: string; content: string }>;
      };
      expect(body.model).toBe('deepseek-v4-pro');
      expect(body.response_format).toEqual({ type: 'json_object' });
      expect(body.messages.slice(0, 2)).toEqual(request.messages);
      expect(body.messages[2].role).toBe('system');
      expect(body.messages[2].content).toContain('json');
      expect(body.messages[2].content).toContain('{"type":"object"}');
    });

    it('maps a bad key, empty balance, filter, truncation and empty output to their codes', async () => {
      for (const status of [401, 402]) {
        global.fetch = jest.fn(
          async () => new Response('{}', { status }),
        ) as typeof fetch;
        expect(await failureCode(service(deepSeek).generateJson(request))).toBe(
          GenerationFailureCode.PROVIDER_NOT_CONFIGURED,
        );
      }

      global.fetch = jest.fn(async () =>
        openAiResponse('', 'content_filter'),
      ) as typeof fetch;
      expect(await failureCode(service(deepSeek).generateJson(request))).toBe(
        GenerationFailureCode.PROVIDER_REJECTED,
      );

      global.fetch = jest.fn(async () =>
        openAiResponse('{"ok":', 'length'),
      ) as typeof fetch;
      expect(await failureCode(service(deepSeek).generateJson(request))).toBe(
        GenerationFailureCode.INVALID_OUTPUT,
      );

      global.fetch = jest.fn(async () => openAiResponse('')) as typeof fetch;
      expect(await failureCode(service(deepSeek).generateJson(request))).toBe(
        GenerationFailureCode.INVALID_OUTPUT,
      );
    });
  });

  describe('MiniMax', () => {
    it('uses the Token Plan endpoint with schema instructions', async () => {
      const fetchMock = jest.fn(async () => anthropicResponse('{"ok":true}'));
      global.fetch = fetchMock as typeof fetch;

      await expect(service(miniMax).generateJson(request)).resolves.toEqual({
        ok: true,
      });

      expect(String((fetchMock.mock.calls[0] as unknown[])[0])).toContain(
        'api.minimax.io/anthropic/v1/messages',
      );
      const init = (fetchMock.mock.calls[0] as unknown[])[1] as RequestInit;
      const body = JSON.parse(String(init.body)) as {
        model: string;
        system: string;
        messages: Array<{ role: string; content: string }>;
      };
      expect(body.model).toBe('MiniMax-M3');
      expect(body.messages).toEqual([{ role: 'user', content: 'hi' }]);
      expect(body.system).toContain('rules');
      expect(body.system).toContain('single JSON object');
      expect(body.system).toContain('{"type":"object"}');
    });

    it('maps a bad key, refusal and truncated output to their codes', async () => {
      global.fetch = jest.fn(
        async () =>
          new Response(
            JSON.stringify({
              type: 'error',
              error: { type: 'authentication_error', message: 'bad key' },
            }),
            { status: 401, headers: { 'content-type': 'application/json' } },
          ),
      ) as typeof fetch;
      expect(await failureCode(service(miniMax).generateJson(request))).toBe(
        GenerationFailureCode.PROVIDER_NOT_CONFIGURED,
      );

      global.fetch = jest.fn(async () =>
        anthropicResponse('', 'refusal'),
      ) as typeof fetch;
      expect(await failureCode(service(miniMax).generateJson(request))).toBe(
        GenerationFailureCode.PROVIDER_REJECTED,
      );

      global.fetch = jest.fn(async () =>
        anthropicResponse('{"ok":', 'max_tokens'),
      ) as typeof fetch;
      expect(await failureCode(service(miniMax).generateJson(request))).toBe(
        GenerationFailureCode.INVALID_OUTPUT,
      );
    });
  });
});
