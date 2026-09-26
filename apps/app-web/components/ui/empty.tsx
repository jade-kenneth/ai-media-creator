import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/**
 * Empty and route-error states (design/system/components-states.md#empty-states):
 * a 56px tile with an icon, an h2-sized title, one sentence (max 420px) and
 * one primary action with an optional secondary.
 */
function Empty({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty"
      className={cn(
        'flex w-full min-w-0 flex-col items-center justify-center gap-5 text-center',
        className,
      )}
      {...props}
    />
  );
}

function EmptyHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty-header"
      className={cn('flex max-w-md flex-col items-center gap-2', className)}
      {...props}
    />
  );
}

const emptyMediaVariants = cva(
  "mb-2 flex size-14 shrink-0 items-center justify-center rounded-lg [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-6",
  {
    variants: {
      variant: {
        flare: 'bg-flare-soft text-flare-text',
        neutral: 'bg-surface-sunken text-ink-2',
      },
    },
    defaultVariants: {
      variant: 'flare',
    },
  },
);

function EmptyMedia({
  className,
  variant = 'flare',
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof emptyMediaVariants>) {
  return (
    <div
      data-slot="empty-icon"
      data-variant={variant}
      aria-hidden="true"
      className={cn(emptyMediaVariants({ variant, className }))}
      {...props}
    />
  );
}

function EmptyTitle({
  className,
  as: Heading = 'h2',
  ...props
}: React.ComponentProps<'h2'> & { as?: 'h1' | 'h2' | 'h3' }) {
  return (
    <Heading
      data-slot="empty-title"
      className={cn('t-h2 text-ink', className)}
      {...props}
    />
  );
}

function EmptyDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="empty-description"
      className={cn('t-body max-w-105 text-ink-2', className)}
      {...props}
    />
  );
}

function EmptyContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty-content"
      className={cn(
        'flex w-full min-w-0 flex-wrap items-center justify-center gap-3',
        className,
      )}
      {...props}
    />
  );
}

export {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
};
