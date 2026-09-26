'use client';

import { PauseIcon, PlayIcon, Volume2Icon, VolumeXIcon } from 'lucide-react';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';

import { claimPlayback, releasePlayback } from '@/components/core/audio-player';
import { Spinner } from '@/components/ui/spinner';
import { useMediaQuery } from '@/hooks/use-media-query';
import { clipPlaybackRate } from '@/lib/studio/clip-rate';
import { cn } from '@/lib/utils';
import { CaptionStyle, SceneTransition } from '@/react-query/generated__types';
import type { VideoEdit } from '@/react-query/video-edits/video-edits-operations';
import { formatTimecode } from '@/utils/date';

import {
  buildTimeline,
  sceneAt,
  transitionAt,
  voiceAt,
  type TimelineScene,
} from './timeline';

const ZOOM_TO = 1.08;
const MUSIC_FADE_MS = 1000;
/** Re-sync media that drifts further than this from the clock. */
const DRIFT_S = 0.25;

export interface PreviewPlayerHandle {
  seekTo: (ms: number) => void;
}

/**
 * The live 9:16 preview on the dark stage (Design Reference §5.14): media,
 * on-screen text, captions, voice, clip sound, music at its level and the end
 * card, in edit order, driven by one clock. It's a preview; the render is the
 * result.
 */
export const PreviewPlayer = forwardRef<
  PreviewPlayerHandle,
  { video: VideoEdit; onSceneChange?: (sceneId: string | null) => void }
>(function PreviewPlayer({ video, onSceneChange }, ref) {
  const timeline = useMemo(() => buildTimeline(video), [video]);
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [playing, setPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(false);
  const voiceRef = useRef<HTMLAudioElement>(null);
  const musicRef = useRef<HTMLAudioElement>(null);
  const clock = useRef({ startedAt: 0, from: 0 });
  const position = Math.min(positionMs, timeline.totalMs);
  const scene = sceneAt(timeline, position);
  const onEndCard =
    !scene &&
    Boolean(timeline.endCard) &&
    position >= (timeline.endCard?.startMs ?? 0);

  const stop = useCallback(() => {
    setPlaying(false);
    voiceRef.current?.pause();
    musicRef.current?.pause();
  }, []);

  useEffect(() => () => releasePlayback(stop), [stop]);

  useImperativeHandle(ref, () => ({
    seekTo: (ms: number) => {
      clock.current = { startedAt: performance.now(), from: ms };
      setPositionMs(ms);
    },
  }));

  const sceneId = scene?.sceneId ?? null;
  useEffect(() => {
    onSceneChange?.(sceneId);
  }, [onSceneChange, sceneId]);

  // The clock: one source of time for every layer.
  useEffect(() => {
    if (!playing) return;

    let frame = 0;
    const tick = () => {
      const now =
        clock.current.from + (performance.now() - clock.current.startedAt);

      if (now >= timeline.totalMs) {
        setPositionMs(timeline.totalMs);
        stop();
        releasePlayback(stop);
        return;
      }
      setPositionMs(now);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, stop, timeline.totalMs]);

  // Voice: the part for the current scene, kept in step with the clock.
  const voicePart = voiceAt(timeline, position);
  useEffect(() => {
    const element = voiceRef.current;
    if (!element) return;

    if (!playing || !voicePart) {
      element.pause();
      return;
    }

    const expected =
      (voicePart.offsetMs + (position - voicePart.startMs)) / 1000;

    if (element.getAttribute('src') !== voicePart.url) {
      element.src = voicePart.url;
      element.currentTime = expected;
    } else if (Math.abs(element.currentTime - expected) > DRIFT_S) {
      element.currentTime = expected;
    }
    element.muted = muted;
    if (element.paused) void element.play().catch(() => undefined);
  }, [muted, playing, position, voicePart]);

  // Music: loops under the voice at its level, fading over the last second.
  const musicUrl = video.music.asset?.previewUrl ?? null;
  useEffect(() => {
    const element = musicRef.current;
    if (!element || !musicUrl) return;

    if (!playing) {
      element.pause();
      return;
    }

    const remaining = timeline.totalMs - position;
    const fade = Math.max(0, Math.min(1, remaining / MUSIC_FADE_MS));

    element.volume = (video.music.levelPercent / 100) * fade;
    element.muted = muted;
    if (element.paused) {
      element.currentTime = (position / 1000) % (element.duration || Infinity);
      void element.play().catch(() => undefined);
    }
  }, [
    musicUrl,
    muted,
    playing,
    position,
    timeline.totalMs,
    video.music.levelPercent,
  ]);

  const play = () => {
    const from = position >= timeline.totalMs ? 0 : position;

    claimPlayback(stop);
    clock.current = { startedAt: performance.now(), from };
    setPositionMs(from);
    setPlaying(true);
  };

  const caption = video.captions.enabled
    ? video.captions.lines.find(
        (line) => position >= line.startMs && position < line.endMs,
      )
    : undefined;
  const activeTransition = transitionAt(timeline, position, reducedMotion);
  const outgoing = activeTransition?.outgoing ?? null;
  const easedPunch = activeTransition
    ? cubicBezierProgress(activeTransition.progress, 0.23, 1, 0.32, 1)
    : 1;
  const easedWhip = activeTransition
    ? cubicBezierProgress(activeTransition.progress, 0.77, 0, 0.175, 1)
    : 1;
  const incomingStyle: CSSProperties =
    activeTransition?.kind === SceneTransition.PunchIn
      ? { transform: `scale(${1.15 - 0.15 * easedPunch})` }
      : activeTransition?.kind === SceneTransition.Whip && outgoing
        ? { transform: `translateX(${(1 - easedWhip) * 100}%)` }
        : activeTransition?.kind === SceneTransition.Dissolve && outgoing
          ? { opacity: activeTransition.progress }
          : {};
  const outgoingStyle: CSSProperties =
    activeTransition?.kind === SceneTransition.Whip
      ? { transform: `translateX(${-easedWhip * 100}%)` }
      : { opacity: 1 - (activeTransition?.progress ?? 1) };

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-stage p-4">
      <div
        className="relative mx-auto aspect-9/16 w-full max-w-82 overflow-hidden rounded-md border border-stage-border bg-stage-surface"
        aria-label="Video preview"
        role="img"
      >
        {outgoing ? (
          <SceneLayer
            scene={outgoing}
            position={position}
            playing={playing}
            // Like the render, a scene's sound stops at its cut.
            audible={false}
            reducedMotion={reducedMotion}
            style={outgoingStyle}
            onLoading={setLoading}
          />
        ) : null}
        {scene ? (
          <SceneLayer
            key={scene.sceneId}
            scene={scene}
            position={position}
            playing={playing}
            audible={!muted}
            reducedMotion={reducedMotion}
            style={incomingStyle}
            onLoading={setLoading}
          />
        ) : onEndCard && timeline.endCard ? (
          <div className="flex size-full flex-col items-center justify-center gap-2 bg-stage p-6 text-center">
            <p className="t-h2 text-stage-ink">{timeline.endCard.title}</p>
            {timeline.endCard.cta ? (
              <p className="t-sm text-stage-ink-2">{timeline.endCard.cta}</p>
            ) : null}
          </div>
        ) : (
          <div className="size-full bg-surface-sunken" />
        )}

        {scene && !scene.textCard && scene.onScreenText ? (
          <p className="absolute top-[14%] left-1/2 max-w-[86%] -translate-x-1/2 rounded-sm bg-black/72 px-2.5 py-1.5 text-center text-xl leading-6.5 font-bold text-white">
            {scene.onScreenText}
          </p>
        ) : null}

        {caption ? (
          <p
            className={cn(
              'absolute bottom-[22%] left-1/2 max-w-[86%] -translate-x-1/2 text-center text-hook leading-5.5 font-semibold whitespace-pre-line text-white',
              video.captions.style === CaptionStyle.Boxed
                ? 'rounded-sm bg-black/72 px-2 py-1'
                : '[text-shadow:0_1px_3px_rgba(0,0,0,0.6)]',
            )}
          >
            {video.captions.style === CaptionStyle.WordHighlight &&
            caption.words.length
              ? caption.text.split('\n').map((row, rowIndex, rows) => {
                  const before = rows
                    .slice(0, rowIndex)
                    .join(' ')
                    .split(/\s+/)
                    .filter(Boolean).length;

                  return (
                    <span key={rowIndex} className="block">
                      {row.split(/\s+/).map((word, wordIndex) => {
                        const timed = caption.words[before + wordIndex];
                        const speaking =
                          timed &&
                          position >= timed.startMs &&
                          position < timed.endMs;

                        return (
                          <span
                            key={wordIndex}
                            className={
                              speaking ? 'text-stage-flare' : undefined
                            }
                          >
                            {wordIndex ? ' ' : ''}
                            {word}
                          </span>
                        );
                      })}
                    </span>
                  );
                })
              : caption.text}
          </p>
        ) : null}

        {loading && playing ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Spinner className="size-5 text-stage-ink-2" />
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            if (playing) {
              stop();
              releasePlayback(stop);
            } else {
              play();
            }
          }}
          aria-label={playing ? 'Pause preview' : 'Play preview'}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-stage-ink text-stage transition-transform duration-140 active:scale-97 motion-reduce:active:scale-100"
        >
          {playing ? (
            <PauseIcon className="size-4" />
          ) : (
            <PlayIcon className="size-4" />
          )}
        </button>
        <div className="relative min-w-0 flex-1">
          {timeline.scenes.slice(1).map((item) => (
            <span
              key={item.sceneId}
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 h-3 w-0.5 -translate-y-1/2 bg-stage-ink-2"
              style={{
                left: `${(item.startMs / Math.max(1, timeline.totalMs)) * 100}%`,
              }}
            />
          ))}
          <input
            type="range"
            min={0}
            max={Math.max(1, timeline.totalMs)}
            step={100}
            value={position}
            aria-label="Preview position"
            aria-valuetext={`${formatTimecode(position / 1000)} of ${formatTimecode(timeline.totalMs / 1000)}${scene ? `, scene ${scene.order}` : ''}`}
            onChange={(event) => {
              const ms = Number(event.target.value);
              clock.current = { startedAt: performance.now(), from: ms };
              setPositionMs(ms);
            }}
            className="h-6 w-full cursor-pointer accent-stage-ink"
          />
        </div>
        <span className="t-mono shrink-0 text-stage-ink-2">
          {formatTimecode(position / 1000)} /{' '}
          {formatTimecode(timeline.totalMs / 1000)}
        </span>
        <button
          type="button"
          onClick={() => setMuted((value) => !value)}
          aria-label={muted ? 'Unmute preview' : 'Mute preview'}
          aria-pressed={muted}
          className="flex size-9 shrink-0 items-center justify-center rounded-sm text-stage-ink-2 hover:text-stage-ink lg:size-8"
        >
          {muted ? (
            <VolumeXIcon className="size-4" />
          ) : (
            <Volume2Icon className="size-4" />
          )}
        </button>
      </div>
      <p className="t-caption text-stage-ink-2">
        Live preview. Text in the exported video can wrap slightly differently.
      </p>

      <audio ref={voiceRef} preload="auto" className="hidden" />
      {musicUrl ? (
        <audio
          ref={musicRef}
          src={musicUrl}
          loop
          preload="auto"
          className="hidden"
        />
      ) : null}
    </div>
  );
});

function SceneLayer({
  scene,
  position,
  playing,
  audible,
  reducedMotion,
  style,
  onLoading,
}: {
  scene: TimelineScene;
  position: number;
  playing: boolean;
  /** Whether a clip with its sound on may be heard (not muted, not outgoing). */
  audible: boolean;
  reducedMotion: boolean;
  style: CSSProperties;
  onLoading: (loading: boolean) => void;
}) {
  const clipRef = useRef<HTMLVideoElement>(null);
  const zoom =
    scene.media?.slowZoom && !reducedMotion
      ? 1 +
        (ZOOM_TO - 1) *
          Math.max(
            0,
            Math.min(
              1,
              (position - scene.startMs) /
                Math.max(1, scene.playEndMs - scene.startMs),
            ),
          )
      : 1;

  useEffect(() => {
    const element = clipRef.current;
    if (!element || !scene.media?.isClip) return;

    const clipEnd = Number.isFinite(element.duration)
      ? element.duration
      : Infinity;
    const sound = scene.media.soundVolume;
    // A clip shorter than its scene plays slower so it lasts the scene; one
    // with its sound on plays at normal speed and holds its last frame.
    const rate =
      sound === null
        ? clipPlaybackRate(
            clipEnd - scene.media.clipStartSeconds,
            (scene.playEndMs - scene.startMs) / 1000,
          )
        : 1;

    element.muted = sound === null || !audible;
    if (sound !== null) element.volume = sound;
    const expected =
      scene.media.clipStartSeconds + ((position - scene.startMs) / 1000) * rate;
    const target = Math.min(Math.max(0, expected), Math.max(0, clipEnd - 0.05));

    if (element.playbackRate !== rate) element.playbackRate = rate;
    if (Math.abs(element.currentTime - target) > DRIFT_S) {
      element.currentTime = target;
    }
    if (playing && position < scene.playEndMs && expected < clipEnd) {
      if (element.paused) void element.play().catch(() => undefined);
    } else {
      element.pause();
    }
  }, [audible, playing, position, scene]);

  return (
    <div
      className="absolute inset-0 overflow-hidden will-change-transform"
      style={style}
      aria-hidden="true"
    >
      {scene.textCard ? (
        <div className="flex size-full items-center justify-center bg-stage p-6 text-center">
          <p className="text-xl leading-6.5 font-bold text-white">
            {scene.onScreenText}
          </p>
        </div>
      ) : scene.media?.isClip ? (
        <video
          ref={clipRef}
          src={scene.media.url}
          muted
          playsInline
          preload="auto"
          onWaiting={() => onLoading(true)}
          onCanPlay={() => onLoading(false)}
          className="size-full object-cover"
        />
      ) : scene.media ? (
        // eslint-disable-next-line @next/next/no-img-element -- signed preview URL
        <img
          src={scene.media.url}
          alt=""
          className="size-full object-cover"
          style={{ transform: `scale(${zoom})` }}
        />
      ) : (
        <div className="size-full bg-surface-sunken" />
      )}
    </div>
  );
}

/** Evaluates the design token's cubic-bezier curve for a clock progress. */
function cubicBezierProgress(
  progress: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const sample = (t: number, a: number, b: number) =>
    3 * (1 - t) * (1 - t) * t * a + 3 * (1 - t) * t * t * b + t * t * t;
  let low = 0;
  let high = 1;

  for (let index = 0; index < 10; index += 1) {
    const mid = (low + high) / 2;
    if (sample(mid, x1, x2) < progress) low = mid;
    else high = mid;
  }

  return sample((low + high) / 2, y1, y2);
}
