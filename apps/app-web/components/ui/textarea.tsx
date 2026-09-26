import * as React from 'react';

import { cn } from '@/lib/utils';

import { fieldControlClass } from './input';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        fieldControlClass,
        'field-sizing-content min-h-20 resize-y py-2',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
