import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ElevenLabsVoiceProvider } from './providers/elevenlabs-voice.provider';
import {
  voiceProviderErrors,
  type AlignmentResult,
  type SpeechRequest,
  type SpeechResult,
  type VoiceInfo,
} from './voice.types';

const VOICE_CACHE_MS = 60 * 60 * 1000;

/**
 * The one entry point between the product and a voice vendor. Only voices on
 * the configured allowlist (ELEVENLABS_VOICE_IDS) can be listed or used.
 */
@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);
  private cache: { voices: VoiceInfo[]; expiresAt: number } | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly provider: ElevenLabsVoiceProvider,
  ) {}

  isConfigured(): boolean {
    return this.provider.isConfigured() && this.allowlist().length > 0;
  }

  isAllowed(voiceId: string): boolean {
    return this.allowlist().includes(voiceId);
  }

  /** The allowlisted voices with their free samples; empty when not set up. */
  async listVoices(now = Date.now()): Promise<VoiceInfo[]> {
    if (!this.isConfigured()) return [];
    if (this.cache && this.cache.expiresAt > now) return this.cache.voices;

    const results = await Promise.allSettled(
      this.allowlist().map((id) => this.provider.getVoice(id)),
    );
    const voices = results.flatMap((result, index) => {
      if (result.status === 'fulfilled') return [result.value];
      this.logger.warn(`Voice ${this.allowlist()[index]} could not be loaded.`);
      return [];
    });

    // Cache only a complete list, so a passing outage isn't remembered.
    if (voices.length === this.allowlist().length) {
      this.cache = { voices, expiresAt: now + VOICE_CACHE_MS };
    }

    return voices;
  }

  async speak(request: SpeechRequest): Promise<SpeechResult> {
    if (!this.isConfigured()) throw voiceProviderErrors.notConfigured();
    if (!this.isAllowed(request.voiceId)) throw voiceProviderErrors.rejected();

    return this.provider.speak(request);
  }

  async align(
    audio: Buffer,
    fileName: string,
    text: string,
  ): Promise<AlignmentResult> {
    if (!this.isConfigured()) throw voiceProviderErrors.notConfigured();

    return this.provider.align(audio, fileName, text);
  }

  private allowlist(): string[] {
    return this.configService.get<string[]>('ELEVENLABS_VOICE_IDS') ?? [];
  }
}
