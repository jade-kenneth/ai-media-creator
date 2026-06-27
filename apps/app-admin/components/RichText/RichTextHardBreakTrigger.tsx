/** commit */
'use client';

import { CornerDownLeft } from 'lucide-react';
import { forwardRef } from 'react';

import { RichTextTriggerButton } from './RichTextTriggerButton';
import { useRichTextContext } from './useRichTextContext';

export type RichTextHardBreakTriggerProps =
  React.ComponentPropsWithRef<'button'>;

export const HardBreakTrigger = forwardRef<
  HTMLButtonElement,
  RichTextHardBreakTriggerProps
>(({ className, children, ...props }, ref) => {
  const richText = useRichTextContext();
  const triggerProps = richText.getHardBreakTriggerProps();

  return (
    <RichTextTriggerButton
      ref={ref}
      {...triggerProps}
      {...props}
      className={className}
    >
      {children ?? <CornerDownLeft className="size-4" />}
    </RichTextTriggerButton>
  );
});

HardBreakTrigger.displayName = 'RichTextHardBreakTrigger';
