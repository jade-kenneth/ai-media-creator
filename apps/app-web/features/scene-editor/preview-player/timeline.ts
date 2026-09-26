import {
  AssetKind,
  PhotoMotion,
  SceneMediaKind,
  VoiceSource,
  SceneTransition,
} from '@/react-query/generated__types';
import { studioOf } from '@/lib/studios';
import type { VideoEdit } from '@/react-query/video-edits/video-edits-operations';

export interface TimelineScene {
  sceneId: string;
  order: number;
  startMs: number;
  endMs: number;
  onScreenText: string;
  transitionIn: SceneTransition;
  /** Includes the outgoing tail used by the next scene's overlap. */
  playEndMs: number;
  textCard: boolean;
  media: {
    url: string;
    isClip: boolean;
    slowZoom: boolean;
    clipStartSeconds: number;
    /** A clip that plays its own sound, at this volume (0–1); null when silent. */
    soundVolume: number | null;
  } | null;
}

export interface TimelineVoice {
  url: string;
  /** Where on the video's timeline this part plays. */
  startMs: number;
  endMs: number;
  /** Where it starts within its audio file. */
  offsetMs: number;
}

export interface Timeline {
  scenes: TimelineScene[];
  voice: TimelineVoice[];
  endCard: {
    startMs: number;
    endMs: number;
    title: string;
    /** The call to action, or a story's end line (§3.23). */
    cta: string | null;
  } | null;
  totalMs: number;
}

/**
 * The live preview's timeline, in edit order: scenes, then the end card. Each
 * scene's voice segment plays in its window, so reordering moves the voice
 * with its scene. The render is the source of truth; this mirrors it.
 */
export function buildTimeline(video: VideoEdit): Timeline {
  const segments = new Map(
    (video.readiness.voiceSettled &&
    (video.voice.source === VoiceSource.Ai ||
      video.voice.source === VoiceSource.Recording)
      ? (video.voice.track?.segments ?? [])
      : []
    ).map((segment) => [segment.sceneId, segment]),
  );
  const voice: TimelineVoice[] = [];
  const scenes = video.scenes.map((scene): TimelineScene => {
    const startMs = scene.startSeconds * 1000;
    const endMs = startMs + scene.durationSeconds * 1000;
    const segment = segments.get(scene.sceneId);
    const asset = scene.media?.asset;

    if (segment?.audioUrl) {
      voice.push({
        url: segment.audioUrl,
        startMs,
        endMs: Math.min(endMs, startMs + segment.durationMs),
        offsetMs: segment.offsetMs,
      });
    }

    return {
      sceneId: scene.sceneId,
      order: scene.order,
      startMs,
      endMs,
      onScreenText: scene.onScreenText,
      transitionIn:
        scene.order === 1 ? SceneTransition.Cut : scene.transitionIn,
      playEndMs: endMs,
      textCard: scene.media?.kind === SceneMediaKind.TextCard,
      media:
        asset?.previewUrl && scene.media?.kind === SceneMediaKind.Asset
          ? {
              url: asset.previewUrl,
              isClip: asset.kind === AssetKind.Clip,
              slowZoom: scene.media.motion === PhotoMotion.SlowZoom,
              clipStartSeconds: scene.media.clipStartSeconds,
              soundVolume:
                asset.kind === AssetKind.Clip &&
                scene.clipSound.on &&
                scene.clipSound.levelPercent > 0
                  ? scene.clipSound.levelPercent / 100
                  : null,
            }
          : null,
    };
  });
  scenes.forEach((scene, index) => {
    const next = scenes[index + 1];
    scene.playEndMs =
      scene.endMs +
      (next?.transitionIn === SceneTransition.Whip
        ? 250
        : next?.transitionIn === SceneTransition.Dissolve
          ? 400
          : 0);
  });
  const scenesMs = video.totalSeconds * 1000;
  // The studio picks the card's lines: product and CTA, or title and end line.
  const lines = studioOf(video.studio).edit.endCardLines(video.endCard);
  const endCard = video.endCard.enabled
    ? {
        startMs: scenesMs,
        endMs: scenesMs + video.endCard.durationSeconds * 1000,
        title: lines.title,
        cta: lines.line,
      }
    : null;

  return { scenes, voice, endCard, totalMs: endCard?.endMs ?? scenesMs };
}

export interface TimelineTransition {
  incoming: TimelineScene;
  outgoing: TimelineScene | null;
  kind: SceneTransition;
  progress: number;
}

export function transitionAt(
  timeline: Timeline,
  ms: number,
  reducedMotion: boolean,
): TimelineTransition | null {
  const incoming = sceneAt(timeline, ms);
  if (!incoming) return null;

  const index = timeline.scenes.findIndex(
    (scene) => scene.sceneId === incoming.sceneId,
  );
  const elapsed = ms - incoming.startMs;
  const kind =
    index === 0 ||
    (reducedMotion &&
      (incoming.transitionIn === SceneTransition.PunchIn ||
        incoming.transitionIn === SceneTransition.Whip))
      ? SceneTransition.Cut
      : incoming.transitionIn;
  const duration =
    kind === SceneTransition.PunchIn
      ? 300
      : kind === SceneTransition.Whip
        ? 250
        : kind === SceneTransition.Dissolve
          ? 400
          : 0;

  return {
    incoming,
    outgoing:
      (kind === SceneTransition.Whip || kind === SceneTransition.Dissolve) &&
      elapsed < duration
        ? (timeline.scenes[index - 1] ?? null)
        : null,
    kind,
    progress: duration ? Math.max(0, Math.min(1, elapsed / duration)) : 1,
  };
}

export function sceneAt(timeline: Timeline, ms: number): TimelineScene | null {
  return (
    timeline.scenes.find((scene) => ms >= scene.startMs && ms < scene.endMs) ??
    null
  );
}

export function voiceAt(timeline: Timeline, ms: number): TimelineVoice | null {
  return (
    timeline.voice.find((part) => ms >= part.startMs && ms < part.endMs) ?? null
  );
}
