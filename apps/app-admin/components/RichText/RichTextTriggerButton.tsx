/** commit */
'use client';

import { forwardRef } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/utils';

type RichTextTriggerButtonProps = React.ComponentPropsWithRef<'button'> & {
  active?: boolean;
  asChild?: boolean;
};

export const RichTextTriggerButton = forwardRef<
  HTMLButtonElement,
  RichTextTriggerButtonProps
>(({ active = false, className, asChild, ...props }, ref) => {
  return (
    <Button
      ref={ref}
      asChild={asChild}
      type="button"
      variant="outline"
      size="icon-sm"
      aria-pressed={active}
      className={cn(
        'shrink-0',
        active && 'bg-muted text-foreground',
        className,
      )}
      {...props}
    />
  );
});

RichTextTriggerButton.displayName = 'RichTextTriggerButton';
