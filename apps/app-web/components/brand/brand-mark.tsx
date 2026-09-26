import { cn } from '@/lib/utils';

/**
 * The working mark (Design Reference §1): an ink square with a white playhead
 * bar and a flare dot. The parent brand is undecided (open decision 1); this
 * is the only place the mark is drawn.
 */
export function BrandMark({
  variant = 'default',
  className,
}: {
  variant?: 'default' | 'stage';
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn('size-6 shrink-0', className)}
    >
      <rect
        x="0.5"
        y="0.5"
        width="23"
        height="23"
        rx="5.5"
        className={
          variant === 'stage'
            ? 'fill-stage-surface stroke-stage-border'
            : 'fill-ink stroke-ink'
        }
      />
      <rect x="8" y="7" width="2" height="10" rx="1" className="fill-white" />
      <circle cx="15" cy="12" r="4" className="fill-flare" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('text-body leading-5 font-bold tracking-tight', className)}>
      AI Creation Platform
    </span>
  );
}
