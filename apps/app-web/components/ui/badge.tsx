import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from '@radix-ui/react-slot';
import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * A 22px pill with a 6px leading dot (design/system/components-states.md).
 * `dot={false}` is the no-dot variant used for fact chips and language tags.
 * Every status badge carries text; colour is never the only signal.
 */
const badgeVariants = cva(
  'group/badge inline-flex h-5.5 w-fit max-w-full shrink-0 items-center gap-1.5 overflow-hidden rounded-full border px-2 text-caption font-medium whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:size-3',
  {
    variants: {
      variant: {
        neutral: 'border-border bg-surface-sunken text-ink-2',
        success: 'border-success-border bg-success-soft text-success',
        warning: 'border-warning-border bg-warning-soft text-warning',
        danger: 'border-danger-border bg-danger-soft text-danger',
        info: 'border-info-border bg-info-soft text-info',
        ink: 'border-ink bg-ink text-white',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  },
);

function Badge({
  className,
  variant = 'neutral',
  dot = true,
  asChild = false,
  children,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean; dot?: boolean }) {
  const Comp = asChild ? Slot : 'span';

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    >
      {dot ? (
        <span
          aria-hidden="true"
          className="size-1.5 shrink-0 rounded-full bg-current"
        />
      ) : null}
      {children}
    </Comp>
  );
}

export { Badge, badgeVariants };
