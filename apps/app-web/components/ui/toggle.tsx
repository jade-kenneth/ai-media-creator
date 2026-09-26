'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import * as TogglePrimitive from '@radix-ui/react-toggle';

import { cn } from '@/lib/utils';

/**
 * Chips and segments per design/system/components-states.md.
 * - chip: 32px (40px below 1024px) pill; selected is the ink fill.
 * - segment: a button inside the sunken segment track; selected is white + e1.
 * Selection is announced by the radio/pressed state, and shown by shape as well
 * as colour (chips add a check glyph in ChoiceGroup; segments rise).
 */
const toggleVariants = cva(
  "group/toggle inline-flex shrink-0 items-center justify-center gap-1.5 font-medium whitespace-nowrap transition-colors duration-120 outline-none select-none disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      variant: {
        default:
          'rounded-md bg-transparent text-small text-ink hover:bg-surface-hover data-[state=on]:bg-surface-sunken',
        chip: 'rounded-full border border-border-strong bg-surface px-3.5 text-small text-ink hover:border-ink-3 data-[state=on]:border-ink data-[state=on]:bg-ink data-[state=on]:text-white',
        segment:
          'rounded-sm px-3 text-small text-ink-2 hover:text-ink data-[state=on]:bg-surface data-[state=on]:text-ink data-[state=on]:shadow-e1',
      },
      size: {
        default: 'h-10 min-w-10 lg:h-8 lg:min-w-8',
        sm: 'h-9 min-w-9 lg:h-7 lg:min-w-7',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant = 'default', size = 'default', ...props }, ref) => {
  return (
    <TogglePrimitive.Root
      ref={ref}
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  );
});

Toggle.displayName = TogglePrimitive.Root.displayName;

export { Toggle, toggleVariants };
