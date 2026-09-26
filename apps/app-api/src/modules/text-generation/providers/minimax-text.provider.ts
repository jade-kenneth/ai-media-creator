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

const MINIMAX_ANTHROPIC_BASE_URL = 'https://api.minimax.io/anthropic';
const MAX_OUTPUT_TOKENS = 16_000;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * MiniMax recommends its Anthropic-compatible endpoint for M-series models.
 * That transport does not document structured outputs, so the schema stays in
 * the system instruction and the handler's domain schema remains authoritative.
 */
@Injectable()
export class MiniMaxTextProvider implements TextProvider {
  readonly name = 'minimax' as const;
  private readonly logger = new Logger(MiniMaxTextProvider.name);
  private client: Anthropic | null = null;

  constructor(private readonly configService: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(
      this.configService.get<string>('MINIMAX_TEXT_API_KEY') &&
      this.configService.get<string>('MINIMAX_TEXT_MODEL'),
    );
  }

  async generateJson(request: TextGenerationRequest): Promise<unknown> {
    const apiKey = this.configService.get<string>('MINIMAX_TEXT_API_KEY');
    const model = this.configService.get<string>('MINIMAX_TEXT_MODEL');

    if (!apiKey || !model) throw textProviderErrors.notConfigured();

    this.client ??= new Anthropic({
      apiKey,
      baseURL: MINIMAX_ANTHROPIC_BASE_URL,
      timeout: TEXT_PROVIDER_TIMEOUT_MS,
      maxRetries: 0,
    });

    const system = [
      ...request.messages
        .filter((message) => message.role === 'system')
        .map((message) => message.content),
      `Reply with a single JSON object (${request.schemaName}) and nothing else.`,
      'It must follow this JSON schema exactly, with every required property present:',
      JSON.stringify(request.schema),
    ].join('\n\n');
    const messages = request.messages
      .filter((message) => message.role === 'user')
      .map((message) => ({ role: 'user' as const, content: message.content }));

    let response: Anthropic.Message;

    try {
      response = await this.client.messages.create({
        model,
        max_tokens: MAX_OUTPUT_TOKENS,
        system,
        messages,
      });
    } catch (error) {
      throw this.mapError(error);
    }

    if ((response.stop_reason as string | null) === 'refusal') {
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
      isObject(error.error) &&
      isObject(error.error.error)
        ? error.error.error
        : null;
    const responseMessage = responseError?.message;
    const billingFailure =
      error instanceof Anthropic.APIError &&
      (error.status === 402 ||
        responseError?.type === 'billing_error' ||
        (typeof responseMessage === 'string' &&
          /balance|billing|credits?|quota|subscription/i.test(
            responseMessage,
          )));

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
