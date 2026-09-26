import { FilmIcon } from 'lucide-react';
import Image from 'next/image';

import { cn } from '@/lib/utils';
import { AssetKind } from '@/react-query/generated__types';
import type { ProjectAsset } from '@/react-query/assets/assets-operations';

/**
 * What a scene or upload shows: a photo, a clip's first frame with its
 * duration pill, a text card on the dark stage, or the empty-media tile
 * (Design Reference §1.5: real media only).
 */
export function MediaThumb({
  asset,
  textCard,
  className,
  sizes = '120px',
}: {
  asset?: ProjectAsset | null;
  /** Renders the text card with this on-screen text. */
  textCard?: string | null;
  className?: string;
  sizes?: string;
}) {
  if (textCard !== undefined && textCard !== null) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-stage p-3 text-center',
          className,
        )}
      >
        <span className="t-label line-clamp-4 text-stage-ink">
          {textCard || 'Text card'}
        </span>
      </div>
    );
  }

  if (!asset?.previewUrl) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-surface-sunken',
          className,
        )}
      >
        <FilmIcon aria-hidden="true" className="size-5 text-ink-3" strokeWidth={1.75} />
      </div>
    );
  }

  const isClip = asset.kind === AssetKind.Clip;

  return (
    <div className={cn('relative overflow-hidden bg-surface-sunken', className)}>
      {isClip ? (
        // The first frame stands in for a poster; the clip never autoplays.
        <video
          src={`${asset.previewUrl}#t=0.1`}
          preload="metadata"
          muted
          playsInline
          aria-hidden="true"
          className="size-full object-cover"
        />
      ) : (
        <Image
          src={asset.previewUrl}
          alt=""
          fill
          unoptimized
          sizes={sizes}
          className="object-cover"
        />
      )}
      {isClip && asset.durationSeconds ? (
        <span className="t-caption absolute bottom-2 left-2 rounded-full bg-black/70 px-2 font-mono text-white">
          {Math.round(asset.durationSeconds)} s
        </span>
      ) : null}
    </div>
  );
}
