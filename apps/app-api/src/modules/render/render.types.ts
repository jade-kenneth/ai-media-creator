import type {
  CaptionStyle,
  SceneTransition,
} from 'src/graphql/generated/graphql';
import { GenerationFailureCode } from 'src/graphql/generated/graphql';
import { GenerationJobError } from '../generation-jobs/generation-jobs.types';

export const RENDER_WIDTH = 1080;
export const RENDER_HEIGHT = 1920;
export const RENDER_FPS = 30;
/** A render that runs longer than this is stopped (Product Specification §3.16). */
export const RENDER_TIMEOUT_MS = 10 * 60 * 1000;

export interface RenderScene {
  durationMs: number;
  kind: 'photo' | 'clip' | 'text';
  /** Local file for a photo or clip. */
  file: string | null;
  slowZoom: boolean;
  clipStartSeconds: number;
  onScreenText: string;
  transitionIn: SceneTransition;
  /** A clip that plays its own sound, at this level (1–100); null otherwise. */
  sound: { levelPercent: number } | null;
}

/** Where a scene's voice comes from within its (local) audio file. */
export interface RenderVoicePart {
  file: string;
  offsetMs: number;
  durationMs: number;
}

export interface RenderCaption {
  startMs: number;
  endMs: number;
  /** Up to two lines separated by a newline. */
  text: string;
  words: { text: string; startMs: number; endMs: number }[];
}

export interface RenderPlan {
  scenes: RenderScene[];
  /** One entry per scene; null for a silent scene. */
  voice: (RenderVoicePart | null)[];
  captions: { enabled: boolean; style: CaptionStyle; lines: RenderCaption[] };
  music: { file: string; levelPercent: number } | null;
  endCard: { durationMs: number; title: string; cta: string | null } | null;
}

export interface RenderResult {
  videoPath: string;
  posterPath: string;
  durationMs: number;
  width: number;
  height: number;
  sizeBytes: number;
}

export const renderErrors = {
  timeout: () =>
    new GenerationJobError(
      GenerationFailureCode.RENDER_TIMEOUT,
      'Rendering took longer than 10 minutes.',
    ),
  missing: () =>
    new GenerationJobError(
      GenerationFailureCode.MEDIA_MISSING,
      'A photo, clip or track this video uses is missing.',
    ),
  unreadable: () =>
    new GenerationJobError(
      GenerationFailureCode.UNREADABLE_MEDIA,
      'A file this video uses couldn’t be read.',
    ),
};
