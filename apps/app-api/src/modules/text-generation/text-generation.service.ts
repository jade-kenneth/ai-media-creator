import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenerationFailureCode } from 'src/graphql/generated/graphql';
import { GenerationJobError } from '../generation-jobs/generation-jobs.types';
import { AnthropicTextProvider } from './providers/anthropic-text.provider';
import { DeepSeekTextProvider } from './providers/deepseek-text.provider';
import { MiniMaxTextProvider } from './providers/minimax-text.provider';
import { OpenAiTextProvider } from './providers/openai-text.provider';
import {
  textProviderErrors,
  type TextGenerationRequest,
  type TextProvider,
  type TextProviderName,
} from './text-generation.types';

export type {
  TextGenerationMessage,
  TextGenerationRequest,
} from './text-generation.types';

/**
 * A declined request is not retried elsewhere: routing it to another model
 * would work around that model's refusal. Every other failure can be.
 */
const NO_FALLBACK_CODES = new Set([GenerationFailureCode.PROVIDER_REJECTED]);

/**
 * The one entry point between the product and a text model (brief §7: a small
 * adapter). TEXT_PROVIDER picks the primary when several are configured;
 * TEXT_FALLBACK_PROVIDERS supplies an ordered fallback chain. The singular
 * TEXT_FALLBACK_PROVIDER remains supported as a one-item legacy chain. Output
 * is returned as parsed, untrusted JSON; callers coerce it.
 */
@Injectable()
export class TextGenerationService {
  private readonly logger = new Logger(TextGenerationService.name);
  private readonly providers: Record<TextProviderName, TextProvider>;

  constructor(
    private readonly configService: ConfigService,
    openAi: OpenAiTextProvider,
    anthropic: AnthropicTextProvider,
    deepSeek: DeepSeekTextProvider,
    miniMax: MiniMaxTextProvider,
  ) {
    this.providers = {
      openai: openAi,
      anthropic,
      deepseek: deepSeek,
      minimax: miniMax,
    };
  }

  isConfigured(): boolean {
    return this.providerChain().length > 0;
  }

  async generateJson(request: TextGenerationRequest): Promise<unknown> {
    const providers = this.providerChain();
    const primary = providers[0];

    if (!primary) throw textProviderErrors.notConfigured();

    for (const [index, provider] of providers.entries()) {
      try {
        return await provider.generateJson(request);
      } catch (error) {
        const code =
          error instanceof GenerationJobError
            ? error.code
            : GenerationFailureCode.INTERNAL;
        const fallback = providers[index + 1];

        if (!fallback || NO_FALLBACK_CODES.has(code)) throw error;

        this.logger.warn(
          `Text provider ${provider.name} failed (${code}); falling back to ${fallback.name}.`,
        );
      }
    }

    throw textProviderErrors.notConfigured();
  }

  /** The configured providers to try, in order, with duplicates removed. */
  private providerChain(): TextProvider[] {
    const preferred = this.configService.get<TextProviderName>('TEXT_PROVIDER');
    const configuredFallbacks =
      this.configService.get<TextProviderName[]>('TEXT_FALLBACK_PROVIDERS') ??
      [];
    const legacyFallback = this.configService.get<TextProviderName>(
      'TEXT_FALLBACK_PROVIDER',
    );
    const primary = preferred
      ? this.providers[preferred]
      : [
          this.providers.openai,
          this.providers.anthropic,
          this.providers.deepseek,
          this.providers.minimax,
        ].find((provider) => provider.isConfigured());
    const fallbackNames =
      configuredFallbacks.length > 0
        ? configuredFallbacks
        : legacyFallback
          ? [legacyFallback]
          : [];

    return [
      primary,
      ...fallbackNames.map((name) => this.providers[name]),
    ].filter(
      (provider, index, chain): provider is TextProvider =>
        provider !== undefined &&
        provider.isConfigured() &&
        chain.indexOf(provider) === index,
    );
  }
}
