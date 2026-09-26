'use client';

import { CheckIcon, PauseIcon, PlayIcon } from 'lucide-react';
import { useEffect, useRef, useState, type RefObject } from 'react';

import { claimPlayback, releasePlayback } from '@/components/core/audio-player';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ProjectAsset } from '@/react-query/assets/assets-operations';

/** Only one clip plays at a time across the page. */
let playing: HTMLVideoElement | null = null;

/**
 * Playback for one AI clip. Clips play with their own sound (§3.22: the
 * service makes it with the picture, and a skit's lines are in it), once,
 * and never autoplay; the first frame stands in for a poster, as it does for
 * uploaded clips. Playing one stops any other sound on the page.
 */
function useClipPlayback() {
  const video = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const stop = useRef(() => video.current?.pause());

  useEffect(() => {
    const element = video.current;
    const stopThis = stop.current;
    return () => {
      if (playing === element) playing = null;
      releasePlayback(stopThis);
    };
  }, []);

  const toggle = () => {
    const element = video.current;
    if (!element) return;

    if (!element.paused) {
      element.pause();
      return;
    }
    if (playing && playing !== element) playing.pause();
    playing = element;
    claimPlayback(stop.current);
    void element.play().catch(() => setIsPlaying(false));
  };

  const events = {
    onPlay: () => setIsPlaying(true),
    onPause: () => setIsPlaying(false),
    onEnded: () => setIsPlaying(false),
  };

  return { video, isPlaying, toggle, events };
}

type PlaybackEvents = ReturnType<typeof useClipPlayback>['events'];

function ClipFrame({
  clip,
  videoRef,
  events,
}: {
  clip: ProjectAsset;
  videoRef: RefObject<HTMLVideoElement | null>;
  events: PlaybackEvents;
}) {
  return (
    <span className="block aspect-9/16 overflow-hidden rounded-md border border-stage-border bg-stage-surface">
      {clip.previewUrl ? (
        <video
          ref={videoRef}
          src={`${clip.previewUrl}#t=0.1`}
          playsInline
          preload="metadata"
          aria-hidden="true"
          tabIndex={-1}
          className="pointer-events-none size-full object-cover"
          {...events}
        />
      ) : null}
    </span>
  );
}

function PlayButton({
  clip,
  isPlaying,
  onToggle,
}: {
  clip: ProjectAsset;
  isPlaying: boolean;
  onToggle: () => void;
}) {
  const label = clip.aiClip?.label ?? '';

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      className="rounded-full"
      disabled={!clip.previewUrl}
      aria-pressed={isPlaying}
      onClick={onToggle}
    >
      {isPlaying ? (
        <PauseIcon aria-hidden="true" />
      ) : (
        <PlayIcon aria-hidden="true" />
      )}
      <span className="sr-only">
        {isPlaying ? `Pause clip ${label}` : `Play clip ${label}`}
      </span>
    </Button>
  );
}

/** A 9:16 AI clip with its play control, for the check dialog. */
export function ClipPlayer({
  clip,
  className,
}: {
  clip: ProjectAsset;
  className?: string;
}) {
  const { video, isPlaying, toggle, events } = useClipPlayback();

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <ClipFrame clip={clip} videoRef={video} events={events} />
      <PlayButton clip={clip} isPlaying={isPlaying} onToggle={toggle} />
    </div>
  );
}

/** One selectable clip in the Review view's radio group. */
export function ClipCard({
  clip,
  selected,
  tabbable,
  onSelect,
}: {
  clip: ProjectAsset;
  selected: boolean;
  tabbable: boolean;
  onSelect: () => void;
}) {
  const { video, isPlaying, toggle, events } = useClipPlayback();
  const label = clip.aiClip?.label ?? '';
  // The service returns slightly more than asked (6.59 s for 6); label the whole seconds.
  const seconds = Math.floor(clip.durationSeconds ?? 0);

  return (
    <div
      className={cn(
        'relative flex flex-col overflow-hidden rounded-lg border border-border bg-surface',
        selected && 'border-ink ring-1 ring-ink',
      )}
    >
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        aria-label={`Clip ${label}, ${seconds} seconds`}
        tabIndex={tabbable ? 0 : -1}
        data-option={clip.id}
        onClick={onSelect}
        className="flex flex-col gap-2 p-2 text-left"
      >
        <ClipFrame clip={clip} videoRef={video} events={events} />
        <span className="flex flex-wrap items-center gap-2">
          <span className="t-label">Clip {label}</span>
          <span className="t-mono t-caption text-ink-3">{seconds} s</span>
          <Badge dot={false}>AI clip</Badge>
        </span>
      </button>
      {selected ? (
        <span className="absolute top-3 right-3 flex size-5 items-center justify-center rounded-full bg-ink text-white">
          <CheckIcon
            aria-hidden="true"
            className="size-3.5"
            strokeWidth={2.5}
          />
        </span>
      ) : null}
      <div className="border-t border-border p-2">
        <PlayButton clip={clip} isPlaying={isPlaying} onToggle={toggle} />
      </div>
    </div>
  );
}
