import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Card per the Design Reference: white surface, 1px border, 14px radius. The
 * header is separated from the body by a border; padding is 24px (16px below
 * 640px).
 */
function Card({ className, ...props }: React.ComponentProps<'section'>) {
  return (
    <section
      data-slot="card"
      className={cn(
        'flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-surface text-ink',
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        'flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border px-6 py-4 max-sm:px-4',
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({
  className,
  as: Heading = 'h2',
  ...props
}: React.ComponentProps<'h2'> & { as?: 'h2' | 'h3' }) {
  return (
    <Heading
      data-slot="card-title"
      className={cn('t-h3 text-ink', className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="card-description"
      className={cn('t-sm text-ink-2', className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn('ml-auto flex items-center gap-2', className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-content"
      className={cn('flex flex-col gap-6 p-6 max-sm:p-4', className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        'flex items-center gap-2 border-t border-border px-4 py-2',
        className,
      )}
      {...props}
    />
  );
}

export {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
};
