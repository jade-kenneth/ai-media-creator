import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Text field per design/system/components-states.md: 40px (44px below
 * 1024px), white fill, --border-strong, 10px radius; hover darkens the border;
 * focus uses a --focus border plus a 3px halo; errors turn the border danger.
 */
const fieldControlClass =
  'w-full min-w-0 rounded-md border border-border-strong bg-surface px-3 text-body text-ink transition-colors duration-120 outline-none placeholder:text-ink-3 hover:border-ink-3 focus:border-focus focus:ring-3 focus:ring-focus/20 focus-visible:outline-0 disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-ink-3 read-only:bg-canvas aria-invalid:border-danger aria-invalid:focus:ring-danger/15';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(fieldControlClass, 'h-11 lg:h-10', className)}
      {...props}
    />
  );
}

export { Input, fieldControlClass };
