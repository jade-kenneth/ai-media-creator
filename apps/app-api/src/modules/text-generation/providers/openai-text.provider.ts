import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  TEXT_PROVIDER_TIMEOUT_MS,
  parseJsonOutput,
  textProviderErrors,
  type TextGenerationRequest,
  type TextProvider,
} from '../text-generation.types';

const OPENAI_CHAT_COMPLETIONS_URL =
  'https://api.openai.com/v1/chat/completions';

@Injectable()
export class OpenAiTextProvider implements TextProvider {
  readonly name = 'openai' as const;
  private readonly logger = new Logger(OpenAiTextProvider.name);

  constructor(private readonly configService: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(
      this.configService.get<string>('OPENAI_API_KEY') &&
      this.configService.get<string>('OPENAI_TEXT_MODEL'),
    );
  }

  async generateJson(request: TextGenerationRequest): Promise<unknown> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    const model = this.configService.get<string>('OPENAI_TEXT_MODEL');

    if (!apiKey || !model) throw textProviderErrors.notConfigured();

    let response: Response;

    try {
      response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: request.messages,
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: request.schemaName,
              strict: true,
              schema: request.schema,
            },
          },
        }),
        signal: AbortSignal.timeout(TEXT_PROVIDER_TIMEOUT_MS),
      });
    } catch (error) {
      const name = (error as { name?: string }).name;

      if (name === 'TimeoutError' || name === 'AbortError') {
        throw textProviderErrors.timeout();
      }

      this.logger.error('Text provider request failed.', error as Error);
      throw textProviderErrors.internal();
    }

    if (response.status === 401 || response.status === 403) {
      throw textProviderErrors.notConfigured();
    }

    if (response.status >= 400 && response.status < 500) {
      this.logger.warn(
        `Text provider rejected a request (${response.status}).`,
      );
      throw textProviderErrors.rejected();
    }

    if (!response.ok) {
      this.logger.warn(`Text provider error (${response.status}).`);
      throw textProviderErrors.internal();
    }

    const body = (await response.json().catch(() => null)) as {
      choices?: Array<{
        message?: { content?: string | null; refusal?: string | null };
      }>;
    } | null;
    const message = body?.choices?.[0]?.message;

    if (message?.refusal) throw textProviderErrors.rejected();

    return parseJsonOutput(message?.content);
  }
}
