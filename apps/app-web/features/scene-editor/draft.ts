import {
  VoiceSource,
  type SceneTransition,
  type CaptionStyle,
  type UpdateVideoEditInput,
} from '@/react-query/generated__types';
import type { VideoEdit } from '@/react-query/video-edits/video-edits-operations';

/** Whether a clip scene plays the clip's own sound, and how loud. */
export interface ClipSoundValue {
  on: boolean;
  levelPercent: number;
}

/** Edits not yet saved; the preview shows the video with them applied. */
export interface EditDraft {
  order?: string[];
  text: Record<string, string>;
  durations: Record<string, number>;
  transitions: Record<string, SceneTransition>;
  clipSounds: Record<string, ClipSoundValue>;
  captions: Record<string, string>;
  captionsEnabled?: boolean;
  captionStyle?: CaptionStyle;
  musicLevel?: number;
  endCard?: boolean;
  /** A story's end line (§3.23), shown under its title on the end card. */
  endLine?: string;
}

export const EMPTY_DRAFT: EditDraft = {
  text: {},
  durations: {},
  transitions: {},
  clipSounds: {},
  captions: {},
};

/** Scene lengths follow the script (and can change) without a voice track. */
export function scriptTimed(source: VoiceSource): boolean {
  return source === VoiceSource.None || source === VoiceSource.Scene;
}

/** Autosave patch keys; flat so separate edits merge while a save waits. */
export type EditPatch = {
  order?: string[];
  captionsEnabled?: boolean;
  captionStyle?: CaptionStyle;
  musicLevel?: number;
  endCard?: boolean;
  endLine?: string;
} & Partial<Record<`text:${string}` | `caption:${string}`, string>> &
  Partial<Record<`duration:${string}`, number>> &
  Partial<Record<`transition:${string}`, SceneTransition>> &
  Partial<Record<`sound:${string}`, ClipSoundValue>>;

/** Patches for one scene's on-screen text, duration, or one caption line. */
export function textPatch(sceneId: string, text: string): EditPatch {
  const patch: Partial<Record<`text:${string}`, string>> = {};
  patch[`text:${sceneId}`] = text;
  return patch;
}

export function durationPatch(sceneId: string, seconds: number): EditPatch {
  const patch: Partial<Record<`duration:${string}`, number>> = {};
  patch[`duration:${sceneId}`] = seconds;
  return patch;
}

export function transitionPatch(
  sceneId: string,
  transitionIn: SceneTransition,
): EditPatch {
  const patch: Partial<Record<`transition:${string}`, SceneTransition>> = {};
  patch[`transition:${sceneId}`] = transitionIn;
  return patch;
}

export function clipSoundPatch(
  sceneId: string,
  sound: ClipSoundValue,
): EditPatch {
  const patch: Partial<Record<`sound:${string}`, ClipSoundValue>> = {};
  patch[`sound:${sceneId}`] = sound;
  return patch;
}

export function captionPatch(lineId: string, text: string): EditPatch {
  const patch: Partial<Record<`caption:${string}`, string>> = {};
  patch[`caption:${lineId}`] = text;
  return patch;
}

export function toInput(
  projectId: string,
  patch: EditPatch,
): UpdateVideoEditInput {
  const entries = Object.entries(patch) as [string, unknown][];
  const pick = (prefix: string) =>
    entries
      .filter(([key]) => key.startsWith(prefix))
      .map(([key, value]) => [key.slice(prefix.length), value] as const);
  const sceneText = pick('text:').map(([sceneId, onScreenText]) => ({
    sceneId,
    onScreenText: String(onScreenText),
  }));
  const sceneDurations = pick('duration:').map(
    ([sceneId, durationSeconds]) => ({
      sceneId,
      durationSeconds: Number(durationSeconds),
    }),
  );
  const sceneTransitions = pick('transition:').map(
    ([sceneId, transitionIn]) => ({
      sceneId,
      transitionIn: transitionIn as SceneTransition,
    }),
  );
  const clipSounds = pick('sound:').map(([sceneId, sound]) => ({
    sceneId,
    ...(sound as ClipSoundValue),
  }));
  const lines = pick('caption:').map(([id, text]) => ({
    id,
    text: String(text),
  }));
  const captions =
    lines.length || patch.captionsEnabled !== undefined || patch.captionStyle
      ? {
          ...(lines.length ? { lines } : {}),
          ...(patch.captionsEnabled !== undefined
            ? { enabled: patch.captionsEnabled }
            : {}),
          ...(patch.captionStyle ? { style: patch.captionStyle } : {}),
        }
      : undefined;

  return {
    projectId,
    ...(patch.order ? { sceneOrder: patch.order } : {}),
    ...(sceneText.length ? { sceneText } : {}),
    ...(sceneDurations.length ? { sceneDurations } : {}),
    ...(sceneTransitions.length ? { sceneTransitions } : {}),
    ...(clipSounds.length ? { clipSounds } : {}),
    ...(captions ? { captions } : {}),
    ...(patch.musicLevel !== undefined
      ? { musicLevelPercent: patch.musicLevel }
      : {}),
    ...(patch.endCard !== undefined ? { endCardEnabled: patch.endCard } : {}),
    ...(patch.endLine !== undefined ? { endLine: patch.endLine } : {}),
  };
}

/**
 * The video with unsaved edits applied: new order and text, durations when
 * the script sets scene lengths, clip sound, caption wording, and times
 * recomputed so captions move (and, from the spoken lines, stretch) with
 * their scenes.
 */
export function applyDraft(video: VideoEdit, draft: EditDraft): VideoEdit {
  const byId = new Map(video.scenes.map((scene) => [scene.sceneId, scene]));
  const orderIds =
    draft.order && draft.order.every((id) => byId.has(id))
      ? draft.order
      : video.scenes.map((scene) => scene.sceneId);
  const silent = video.voice.source === VoiceSource.None;
  const timedByScript = scriptTimed(video.voice.source);
  let start = 0;
  const scenes = orderIds.map((id, index) => {
    const scene = byId.get(id)!;
    const durationSeconds = timedByScript
      ? (draft.durations[id] ?? scene.durationSeconds)
      : scene.durationSeconds;
    const mapped = {
      ...scene,
      order: index + 1,
      startSeconds: start,
      durationSeconds,
      onScreenText: draft.text[id] ?? scene.onScreenText,
      transitionIn: draft.transitions[id] ?? scene.transitionIn,
      clipSound: draft.clipSounds[id] ?? scene.clipSound,
    };
    start += durationSeconds;
    return mapped;
  });
  const newStart = new Map(
    scenes.map((scene) => [scene.sceneId, scene.startSeconds * 1000]),
  );
  const oldStart = new Map(
    video.scenes.map((scene) => [scene.sceneId, scene.startSeconds * 1000]),
  );
  // Captions from the spoken lines share their scene's time, so they stretch
  // with a new length until the server rebuilds them.
  const stretch = new Map(
    scenes.map((scene) => [
      scene.sceneId,
      timedByScript
        ? scene.durationSeconds /
          Math.max(1, byId.get(scene.sceneId)!.durationSeconds)
        : 1,
    ]),
  );
  const lines = silent
    ? scenes
        .filter((scene) => scene.onScreenText.trim())
        .map((scene) => ({
          id: `${scene.sceneId}-text`,
          sceneId: scene.sceneId,
          startMs: scene.startSeconds * 1000,
          endMs: (scene.startSeconds + scene.durationSeconds) * 1000,
          text: scene.onScreenText.trim(),
          edited: false,
          words: [],
          flags: [],
        }))
    : video.captions.lines
        .map((line) => {
          const from = oldStart.get(line.sceneId) ?? 0;
          const to = newStart.get(line.sceneId) ?? 0;
          const scale = stretch.get(line.sceneId) ?? 1;
          const place = (ms: number) => Math.round(to + (ms - from) * scale);

          return {
            ...line,
            text: draft.captions[line.id] ?? line.text,
            startMs: place(line.startMs),
            endMs: place(line.endMs),
            words: line.words.map((word) => ({
              ...word,
              startMs: place(word.startMs),
              endMs: place(word.endMs),
            })),
          };
        })
        .sort((a, b) => a.startMs - b.startMs);

  return {
    ...video,
    scenes,
    totalSeconds: start,
    captions: {
      ...video.captions,
      enabled: draft.captionsEnabled ?? video.captions.enabled,
      style: draft.captionStyle ?? video.captions.style,
      lines,
    },
    music: {
      ...video.music,
      levelPercent: draft.musicLevel ?? video.music.levelPercent,
    },
    endCard: {
      ...video.endCard,
      enabled: draft.endCard ?? video.endCard.enabled,
      endLine: draft.endLine ?? video.endCard.endLine,
    },
  };
}

/** Client feedback for a caption; the API applies the same rule. */
export function captionError(text: string): string | null {
  const rows = text
    .split('\n')
    .map((row) => row.trim())
    .filter(Boolean);

  if (!rows.length || rows.length > 2) return 'Keep each caption to 2 lines.';
  if (rows.some((row) => row.length > 32))
    return 'Use 32 characters or fewer per line.';
  return null;
}
