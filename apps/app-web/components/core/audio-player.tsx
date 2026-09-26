'use client';

import { PauseIcon, PlayIcon, SquareIcon } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { formatTimecode } from '@/utils/date';

/** Only one audio source plays on the page at a time. */
let stopCurrent: (() => void) | null = null;

export function claimPlayback(stop: () => void) {
  if (stopCurrent && stopCurrent !== stop) stopCurrent();
  stopCurrent = stop;
}

export function releasePlayback(stop: () => void) {
  if (stopCurrent === stop) stopCurrent = null;
}

export interface AudioSegment {
  url: string | null;
  /** Where this part starts within its file. */
  offsetMs: number;
  durationMs: number;
}

/**
 * Plays a voiceover made of per-scene segments as one timeline: a 40px round
 * play/pause button, a scrubber and the time (components-states.md#audio-player).
 * Segments may be separate files or ranges of one recording.
 */
export function AudioPlayer({
  segments,
  label,
  className,
}: {
  segments: AudioSegment[];
  /** Names the player for assistive tech, e.g. “Voiceover”. */
  label: string;
  className?: string;
}) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const segmentIndex = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const totalMs = segments.reduce((total, segment) => total + segment.durationMs, 0);
  const starts = segments.reduce<number[]>(
    (list, segment, index) => [...list, index ? list[index - 1] + segments[index - 1].durationMs : 0],
    [],
  );
  const scrubberId = useId();

  const stop = useCallback(() => {
    audio.current?.pause();
    setPlaying(false);
  }, []);

  useEffect(() => () => {
    stop();
    releasePlayback(stop);
  }, [stop]);

  const load = useCallback(
    (index: number, withinMs: number) => {
      const segment = segments[index];
      const element = (audio.current ??= new Audio());

      segmentIndex.current = index;
      if (segment?.url && element.src !== segment.url) element.src = segment.url;
      element.currentTime = ((segment?.offsetMs ?? 0) + withinMs) / 1000;
    },
    [segments],
  );

  // While playing, follow the audio each frame and move across segments.
  useEffect(() => {
    if (!playing) return;

    let frame = 0;
    const follow = () => {
      const element = audio.current;
      const index = segmentIndex.current;
      const segment = segments[index];

      if (!element || !segment) return;

      const withinMs = element.currentTime * 1000 - segment.offsetMs;

      if (withinMs >= segment.durationMs || element.ended) {
        if (index + 1 < segments.length) {
          load(index + 1, 0);
          void element.play();
        } else {
          stop();
          releasePlayback(stop);
          setPositionMs(totalMs);
          return;
        }
      } else {
        setPositionMs(starts[index] + Math.max(0, withinMs));
      }

      frame = requestAnimationFrame(follow);
    };

    frame = requestAnimationFrame(follow);

    return () => cancelAnimationFrame(frame);
  }, [load, playing, segments, starts, stop, totalMs]);

  const play = async () => {
    if (!segments.length) return;

    const from = positionMs >= totalMs ? 0 : positionMs;
    const index = Math.max(0, starts.findLastIndex((start) => start <= from));

    claimPlayback(stop);
    load(index, from - starts[index]);
    setPlaying(true);
    try {
      await audio.current?.play();
    } catch {
      stop();
    }
  };

  const seek = (ms: number) => {
    const index = Math.max(0, starts.findLastIndex((start) => start <= ms));

    setPositionMs(ms);
    if (playing) load(index, ms - starts[index]);
  };

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Button
        type="button"
        variant="secondary"
        size="icon-lg"
        className="shrink-0 rounded-full"
        disabled={!segments.some((segment) => segment.url)}
        aria-label={playing ? `Pause ${label.toLowerCase()}` : `Play ${label.toLowerCase()}`}
        onClick={() => {
          if (playing) {
            stop();
            releasePlayback(stop);
          } else {
            void play();
          }
        }}
      >
        {playing ? <PauseIcon /> : <PlayIcon />}
      </Button>
      <input
        id={scrubberId}
        type="range"
        min={0}
        max={Math.max(totalMs, 1)}
        step={100}
        value={Math.min(positionMs, totalMs)}
        aria-label={`${label} position`}
        aria-valuetext={`${formatTimecode(positionMs / 1000)} of ${formatTimecode(totalMs / 1000)}`}
        onChange={(event) => seek(Number(event.target.value))}
        className="h-6 min-w-0 flex-1 cursor-pointer accent-ink"
      />
      <span className="t-mono shrink-0 text-ink-2">
        {formatTimecode(positionMs / 1000)} / {formatTimecode(totalMs / 1000)}
      </span>
    </div>
  );
}

/** A 32px play/stop button for a short sample (voice previews, music). */
export function SampleButton({
  url,
  label,
  disabled,
}: {
  url: string | null;
  /** e.g. “sample of Ava”, read as “Play sample of Ava”. */
  label: string;
  disabled?: boolean;
}) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'playing'>('idle');

  const stop = useCallback(() => {
    audio.current?.pause();
    if (audio.current) audio.current.currentTime = 0;
    setState('idle');
  }, []);

  useEffect(() => () => {
    stop();
    releasePlayback(stop);
  }, [stop]);

  const start = async () => {
    if (!url) return;

    const element = (audio.current ??= new Audio(url));

    element.onended = () => {
      setState('idle');
      releasePlayback(stop);
    };
    claimPlayback(stop);
    setState('loading');
    try {
      await element.play();
      setState('playing');
    } catch {
      setState('idle');
      releasePlayback(stop);
    }
  };

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon-sm"
      disabled={disabled || !url}
      aria-label={`${state === 'playing' ? 'Stop' : 'Play'} ${label}`}
      onClick={(event) => {
        event.stopPropagation();
        if (state === 'idle') {
          void start();
        } else {
          stop();
          releasePlayback(stop);
        }
      }}
    >
      {state === 'loading' ? <Spinner /> : state === 'playing' ? <SquareIcon /> : <PlayIcon />}
    </Button>
  );
}
