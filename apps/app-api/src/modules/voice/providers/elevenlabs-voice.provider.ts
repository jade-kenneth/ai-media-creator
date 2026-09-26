import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';
import {
  VOICE_PROVIDER_TIMEOUT_MS,
  voiceProviderErrors,
  type AlignmentResult,
  type SpeechRequest,
  type SpeechResult,
  type VoiceInfo,
  type VoiceProvider,
} from '../voice.types';

const API_BASE = 'https://api.elevenlabs.io';

const voiceResponse = z.object({
  voice_id: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  preview_url: z.string().nullish(),
  labels: z.record(z.string(), z.string()).nullish(),
});

const alignmentTimes = z.object({
  characters: z.array(z.string()),
  character_start_times_seconds: z.array(z.number()),
  character_end_times_seconds: z.array(z.number()),
});

const speechResponse = z.object({
  audio_base64: z.string().min(1),
  alignment: alignmentTimes,
});

const alignmentResponse = z.object({
  words: z.array(
    z.object({ text: z.string(), start: z.number(), end: z.number() }),
  ),
  loss: z.number(),
});

/**
 * ElevenLabs over its REST API (checked against the API reference on
 * 2026-09-24): voices, text-to-speech with character timestamps, and forced
 * alignment for creator recordings. Responses are validated before use.
 */
@Injectable()
export class ElevenLabsVoiceProvider implements VoiceProvider {
  private readonly logger = new Logger(ElevenLabsVoiceProvider.name);

  constructor(private readonly configService: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.apiKey() && this.modelId());
  }

  async getVoice(voiceId: string): Promise<VoiceInfo> {
    const body = await this.request(
      `/v1/voices/${encodeURIComponent(voiceId)}`,
      { method: 'GET' },
    );
    const voice = parse(voiceResponse, body);
    const labels = voice.labels ?? {};
    const descriptor = [labels.description ?? labels.descriptive, labels.accent]
      .filter((part): part is string => Boolean(part))
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' · ');

    return {
      id: voice.voice_id,
      name: voice.name,
      descriptor: descriptor || voice.description?.slice(0, 60) || '',
      sampleUrl: voice.preview_url ?? null,
    };
  }

  async speak(request: SpeechRequest): Promise<SpeechResult> {
    const body = await this.request(
      `/v1/text-to-speech/${encodeURIComponent(request.voiceId)}/with-timestamps?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: request.text,
          model_id: this.modelId(),
          voice_settings: { speed: request.speed },
          ...(request.previousText
            ? { previous_text: request.previousText }
            : {}),
          ...(request.nextText ? { next_text: request.nextText } : {}),
        }),
      },
    );
    const speech = parse(speechResponse, body);
    const { alignment } = speech;

    return {
      audio: Buffer.from(speech.audio_base64, 'base64'),
      characters: alignment.characters.map((text, index) => ({
        text,
        start: alignment.character_start_times_seconds[index] ?? 0,
        end: alignment.character_end_times_seconds[index] ?? 0,
      })),
    };
  }

  async align(
    audio: Buffer,
    fileName: string,
    text: string,
  ): Promise<AlignmentResult> {
    const form = new FormData();

    form.append('file', new Blob([new Uint8Array(audio)]), fileName);
    form.append('text', text);

    const body = await this.request('/v1/forced-alignment', {
      method: 'POST',
      body: form,
    });

    return parse(alignmentResponse, body);
  }

  private async request(path: string, init: RequestInit): Promise<unknown> {
    const apiKey = this.apiKey();

    if (!apiKey || !this.modelId()) throw voiceProviderErrors.notConfigured();

    let response: Response;

    try {
      response = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers: { ...init.headers, 'xi-api-key': apiKey },
        signal: AbortSignal.timeout(VOICE_PROVIDER_TIMEOUT_MS),
      });
    } catch (error) {
      if ((error as Error).name === 'TimeoutError') {
        throw voiceProviderErrors.timeout();
      }
      this.logger.warn(`Voice request failed: ${(error as Error).message}`);
      throw voiceProviderErrors.rejected();
    }

    if (!response.ok) {
      this.logger.warn(
        `Voice service answered ${response.status} for ${path.split('?')[0]}.`,
      );
      throw voiceProviderErrors.rejected();
    }

    return response.json();
  }

  private apiKey(): string | undefined {
    return this.configService.get<string>('ELEVENLABS_API_KEY');
  }

  private modelId(): string | undefined {
    return this.configService.get<string>('ELEVENLABS_MODEL_ID');
  }
}

function parse<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);

  // A response we can't read is treated like a refusal: nothing is stored.
  if (!result.success) throw voiceProviderErrors.rejected();

  return result.data;
}
