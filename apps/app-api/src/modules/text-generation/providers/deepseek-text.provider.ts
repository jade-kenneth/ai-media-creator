import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  TEXT_PROVIDER_TIMEOUT_MS,
  parseJsonOutput,
  textProviderErrors,
  type TextGenerationMessage,
  type TextGenerationRequest,
  type TextProvider,
} from '../text-generation.types';

const DEEPSEEK_CHAT_COMPLETIONS_URL =
  'https://api.deepseek.com/chat/completions';
// Set explicitly so a long draft is not cut off by a small default cap.
const MAX_OUTPUT_TOKENS = 16_000;

/**
 * DeepSeek's JSON mode (`json_object`) guarantees valid JSON but takes no
 * schema, so the schema travels in the prompt (which must mention "json").
 * The callers' Zod parse stays the authority on the output's shape.
 */
function withSchemaInstructions(
  request: TextGenerationRequest,
): TextGenerationMessage[] {
  return [
    ...request.messages,
    {
      role: 'system',
      content: [
        `Reply with a single json object (${request.schemaName}) and nothing else.`,
        'It must follow this JSON schema exactly, with every required property present:',
        JSON.stringify(request.schema),
      ].join('\n'),
    },
  ];
}

@Injectable()
export class DeepSeekTextProvider implements TextProvider {
  readonly name = 'deepseek' as const;
  private readonly logger = new Logger(DeepSeekTextProvider.name);

  constructor(private readonly configService: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(
      this.configService.get<string>('DEEPSEEK_API_KEY') &&
      this.configService.get<string>('DEEPSEEK_TEXT_MODEL'),
    );
  }

  async generateJson(request: TextGenerationRequest): Promise<unknown> {
    const apiKey = this.configService.get<string>('DEEPSEEK_API_KEY');
    const model = this.configService.get<string>('DEEPSEEK_TEXT_MODEL');

    if (!apiKey || !model) throw textProviderErrors.notConfigured();

    let response: Response;

    try {
      response = await fetch(DEEPSEEK_CHAT_COMPLETIONS_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: withSchemaInstructions(request),
          response_format: { type: 'json_object' },
          max_tokens: MAX_OUTPUT_TOKENS,
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

    // 402 is an exhausted account balance: an operator problem, like a bad key.
    if ([401, 402, 403].includes(response.status)) {
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
        finish_reason?: string | null;
        message?: { content?: string | null };
      }>;
    } | null;
    const choice = body?.choices?.[0];

    if (choice?.finish_reason === 'content_filter') {
      throw textProviderErrors.rejected();
    }

    if (choice?.finish_reason === 'length') {
      throw textProviderErrors.invalidOutput();
    }

    return parseJsonOutput(choice?.message?.content);
  }
}
