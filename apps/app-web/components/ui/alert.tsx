import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/**
 * The design's banner (design/system/components-states.md#banners): icon,
 * a bold lead sentence plus detail, and optional right-aligned actions that
 * wrap under the message below 640px. Use role="alert" for errors that follow
 * an action and role="status" for passive notices.
 */
const alertVariants = cva(
  "group/alert flex w-full flex-wrap items-start gap-x-3 gap-y-2 rounded-md border px-4 py-3 text-left text-small [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        info: 'border-info-border bg-info-soft text-ink [&>svg]:text-info',
        success:
          'border-success-border bg-success-soft text-ink [&>svg]:text-success',
        warning:
          'border-warning-border bg-warning-soft text-ink [&>svg]:text-warning',
        danger: 'border-danger-border bg-danger-soft text-ink [&>svg]:text-danger',
      },
      edge: {
        rounded: '',
        flush: 'rounded-none border-x-0 border-t-0',
      },
    },
    defaultVariants: {
      variant: 'info',
      edge: 'rounded',
    },
  },
);

function Alert({
  className,
  variant,
  edge,
  role = 'status',
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role={role}
      className={cn(alertVariants({ variant, edge }), className)}
      {...props}
    />
  );
}

/** Wraps the lead sentence and detail so actions can sit to the right. */
function AlertContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-content"
      className={cn('min-w-0 flex-1 basis-60', className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="alert-title"
      className={cn('font-semibold text-ink', className)}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="alert-description"
      className={cn('text-ink-2 [&_a]:underline', className)}
      {...props}
    />
  );
}

function AlertAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-action"
      className={cn(
        'flex w-full shrink-0 flex-wrap items-center gap-2 pl-7 sm:ml-auto sm:w-auto sm:pl-0',
        className,
      )}
      {...props}
    />
  );
}

export { Alert, AlertContent, AlertTitle, AlertDescription, AlertAction };
