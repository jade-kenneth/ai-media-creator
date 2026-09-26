import { Loader2Icon } from 'lucide-react';

import { cn } from '@/lib/utils';

/** Decorative by default: the busy control or region carries the announcement. */
function Spinner({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <Loader2Icon
      data-slot="spinner"
      aria-hidden="true"
      className={cn('size-4 animate-spin', className)}
      {...props}
    />
  );
}

export { Spinner };
