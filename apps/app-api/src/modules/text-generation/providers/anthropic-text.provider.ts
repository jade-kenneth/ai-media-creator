import Anthropic from '@anthropic-ai/sdk';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  TEXT_PROVIDER_TIMEOUT_MS,
  parseJsonOutput,
  textProviderErrors,
  type TextGenerationRequest,
  type TextProvider,
} from '../text-generation.types';

const MAX_OUTPUT_TOKENS = 16_000;
// Models whose safety classifiers can decline a request. For these the API
// re-runs a declined request on its recommended fallback model server-side.
const SERVER_FALLBACK_MODELS = /^claude-(opus-5|fable-5|mythos-5)/;

function isSchemaObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeSchemaValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeSchemaValue);
  if (!isSchemaObject(value)) return value;

  return normalizeAnthropicSchema(value);
}

/** Anthropic accepts `minItems` only as zero/one and rejects `maxItems`. */
function normalizeAnthropicSchema(
  schema: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(schema).flatMap(([key, value]) => {
      if (key === 'maxItems') return [];

      return [
        [
          key,
          key === 'minItems' && typeof value === 'number' && value > 1
            ? 1
            : normalizeSchemaValue(value),
        ],
      ];
    }),
  );
}

@Injectable()
export class AnthropicTextProvider implements TextProvider {
  readonly name = 'anthropic' as const;
  private readonly logger = new Logger(AnthropicTextProvider.name);
  private client: Anthropic | null = null;

  constructor(private readonly configService: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(
      this.configService.get<string>('ANTHROPIC_API_KEY') &&
      this.configService.get<string>('ANTHROPIC_TEXT_MODEL'),
    );
  }

  async generateJson(request: TextGenerationRequest): Promise<unknown> {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    const model = this.configService.get<string>('ANTHROPIC_TEXT_MODEL');

    if (!apiKey || !model) throw textProviderErrors.notConfigured();

    this.client ??= new Anthropic({
      apiKey,
      timeout: TEXT_PROVIDER_TIMEOUT_MS,
      maxRetries: 0,
    });

    // The Messages API takes instructions in a top-level `system` field.
    const system = request.messages
      .filter((message) => message.role === 'system')
      .map((message) => message.content)
      .join('\n\n');
    const messages = request.messages
      .filter((message) => message.role === 'user')
      .map((message) => ({ role: 'user' as const, content: message.content }));
    const serverFallback = SERVER_FALLBACK_MODELS.test(model);

    let response: Anthropic.Beta.BetaMessage;

    try {
      response = await this.client.beta.messages.create({
        model,
        max_tokens: MAX_OUTPUT_TOKENS,
        ...(system ? { system } : {}),
        messages,
        output_config: {
          format: {
            type: 'json_schema',
            schema: normalizeAnthropicSchema(request.schema),
          },
        },
        ...(serverFallback
          ? {
              betas: ['server-side-fallback-2026-07-01'],
              fallbacks: 'default' as const,
            }
          : {}),
      });
    } catch (error) {
      throw this.mapError(error);
    }

    if (response.stop_reason === 'refusal') {
      throw textProviderErrors.rejected();
    }

    if (response.stop_reason === 'max_tokens') {
      throw textProviderErrors.invalidOutput();
    }

    const text = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('');

    return parseJsonOutput(text);
  }

  private mapError(error: unknown) {
    if (error instanceof Anthropic.APIConnectionTimeoutError) {
      return textProviderErrors.timeout();
    }

    const responseError =
      error instanceof Anthropic.APIError &&
      isSchemaObject(error.error) &&
      isSchemaObject(error.error.error)
        ? error.error.error
        : null;
    const responseMessage = responseError?.message;
    const billingFailure =
      responseError?.type === 'billing_error' ||
      (typeof responseMessage === 'string' &&
        /credit balance is too low|purchase credits|plans? (?:&|and) billing/i.test(
          responseMessage,
        ));

    if (
      error instanceof Anthropic.AuthenticationError ||
      error instanceof Anthropic.PermissionDeniedError ||
      billingFailure
    ) {
      return textProviderErrors.notConfigured();
    }

    if (
      error instanceof Anthropic.APIError &&
      error.status !== undefined &&
      error.status >= 400 &&
      error.status < 500 &&
      error.status !== 429
    ) {
      this.logger.warn(`Text provider rejected a request (${error.status}).`);
      return textProviderErrors.rejected();
    }

    this.logger.error('Text provider request failed.', error as Error);
    return textProviderErrors.internal();
  }
}
