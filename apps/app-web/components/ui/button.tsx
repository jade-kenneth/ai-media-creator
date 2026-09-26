import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from '@radix-ui/react-slot';

import { cn } from '@/lib/utils';

/**
 * Buttons per design/system/components-states.md: 40px (44px below 1024px),
 * small 32px (36px), 10px radius, press scale 0.97. Disabled buttons use the
 * sunken fill so the reason beside them stays the focus.
 */
const buttonVariants = cva(
  "press group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-transparent text-sm leading-5 font-medium whitespace-nowrap select-none disabled:cursor-not-allowed aria-disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-pressed disabled:border-transparent disabled:bg-surface-sunken disabled:text-ink-3 aria-disabled:bg-surface-sunken aria-disabled:text-ink-3',
        secondary:
          'border-border-strong bg-surface text-ink hover:bg-surface-hover active:bg-surface-sunken aria-expanded:bg-surface-hover disabled:bg-surface-sunken disabled:text-ink-3 aria-disabled:bg-surface-sunken aria-disabled:text-ink-3',
        outline:
          'border-border-strong bg-surface text-ink hover:bg-surface-hover active:bg-surface-sunken aria-expanded:bg-surface-hover disabled:bg-surface-sunken disabled:text-ink-3',
        ghost:
          'bg-transparent text-ink hover:bg-surface-hover aria-expanded:bg-surface-hover disabled:text-ink-3 disabled:hover:bg-transparent',
        destructive:
          'bg-danger text-white hover:bg-danger-hover disabled:bg-surface-sunken disabled:text-ink-3',
        link: 'h-auto! border-0 p-0! text-flare-text underline underline-offset-2 hover:no-underline',
      },
      size: {
        default:
          'h-11 px-4 has-data-[icon=inline-end]:pr-3.5 has-data-[icon=inline-start]:pl-3.5 lg:h-10',
        sm: 'h-9 gap-1.5 rounded-sm px-3 text-small lg:h-8',
        lg: 'h-12 px-5 text-body',
        xs: 'h-8 gap-1 rounded-sm px-2 text-xs lg:h-7',
        icon: 'size-10 lg:size-8',
        'icon-sm': 'size-9 rounded-sm lg:size-7',
        'icon-lg': 'size-11 lg:size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

/**
 * The cost segment on a paid button: a 1px divider, then the mono estimate.
 * The estimate is always visible before the click.
 */
function ButtonCost({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="button-cost"
      className={cn(
        'ml-1 flex items-center gap-2 self-stretch border-l border-current/25 pl-2.5 font-mono text-small tabular-nums opacity-90',
        className,
      )}
      {...props}
    />
  );
}

export { Button, ButtonCost, buttonVariants };
