import { GenerationFailureCode } from 'src/graphql/generated/graphql';
import { GenerationJobError } from '../generation-jobs/generation-jobs.types';

export const VOICE_PROVIDER_TIMEOUT_MS = 60_000;

export interface VoiceInfo {
  id: string;
  name: string;
  /** Short description, e.g. “Warm · English and Filipino”. */
  descriptor: string;
  /** The provider's free preview clip. */
  sampleUrl: string | null;
}

/** A timed piece of text, in seconds from the start of its audio. */
export interface TimedText {
  text: string;
  start: number;
  end: number;
}

export interface SpeechRequest {
  voiceId: string;
  text: string;
  speed: number;
  /** Neighbouring narration, so scenes read as one continuous delivery. */
  previousText?: string;
  nextText?: string;
}

export interface SpeechResult {
  audio: Buffer;
  /** Per-character timing of the text that was spoken. */
  characters: TimedText[];
}

export interface AlignmentResult {
  words: TimedText[];
  /** The provider's average alignment loss (lower is closer). */
  loss: number;
}

/** One voice vendor. Keys stay server-side. */
export interface VoiceProvider {
  isConfigured(): boolean;
  getVoice(voiceId: string): Promise<VoiceInfo>;
  speak(request: SpeechRequest): Promise<SpeechResult>;
  align(
    audio: Buffer,
    fileName: string,
    text: string,
  ): Promise<AlignmentResult>;
}

export const voiceProviderErrors = {
  notConfigured: () =>
    new GenerationJobError(
      GenerationFailureCode.PROVIDER_NOT_CONFIGURED,
      'The voice service isn’t set up yet.',
    ),
  timeout: () =>
    new GenerationJobError(
      GenerationFailureCode.PROVIDER_TIMEOUT,
      'The voice service timed out after 60 seconds.',
    ),
  rejected: () =>
    new GenerationJobError(
      GenerationFailureCode.PROVIDER_REJECTED,
      'The voice service turned the request down.',
    ),
};
