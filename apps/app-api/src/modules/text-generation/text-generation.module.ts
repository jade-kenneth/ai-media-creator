import { Module } from '@nestjs/common';
import { AnthropicTextProvider } from './providers/anthropic-text.provider';
import { DeepSeekTextProvider } from './providers/deepseek-text.provider';
import { MiniMaxTextProvider } from './providers/minimax-text.provider';
import { OpenAiTextProvider } from './providers/openai-text.provider';
import { TextGenerationService } from './text-generation.service';

@Module({
  providers: [
    OpenAiTextProvider,
    AnthropicTextProvider,
    DeepSeekTextProvider,
    MiniMaxTextProvider,
    TextGenerationService,
  ],
  exports: [TextGenerationService],
})
export class TextGenerationModule {}
