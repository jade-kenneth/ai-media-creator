import { cn } from '@/lib/utils';

/** Sunken-tone block with a 1.4s shimmer (static under reduced motion). */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn('skeleton-shimmer rounded-sm', className)}
      {...props}
    />
  );
}

export { Skeleton };
