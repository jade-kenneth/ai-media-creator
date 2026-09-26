'use client';

import * as SwitchPrimitive from '@radix-ui/react-switch';
import * as React from 'react';

import { cn } from '@/utils';

/**
 * 36 × 20px track, `--border-strong` off and `--ink` on, with a 16px white
 * thumb (components-states.md, Batch 2 components). The label sits to its
 * left and names it; `role="switch"` comes from Radix.
 */
function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer relative inline-flex h-5 w-9 shrink-0 items-center rounded-full outline-none transition-colors duration-120 after:absolute after:-inset-x-2 after:-inset-y-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus data-checked:bg-ink data-unchecked:bg-border-strong data-disabled:cursor-not-allowed data-disabled:opacity-60',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-4 rounded-full bg-white shadow-e1 transition-transform duration-120 ease-out data-checked:translate-x-4.5 data-unchecked:translate-x-0.5 motion-reduce:transition-none"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
