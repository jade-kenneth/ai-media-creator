/** commit */
'use client';

import { Bold } from 'lucide-react';
import { forwardRef } from 'react';

import { RichTextTriggerButton } from './RichTextTriggerButton';
import { useRichTextContext } from './useRichTextContext';

export type RichTextBoldTriggerProps = React.ComponentPropsWithRef<'button'>;

export const BoldTrigger = forwardRef<
  HTMLButtonElement,
  RichTextBoldTriggerProps
>(({ className, children, ...props }, ref) => {
  const richText = useRichTextContext();
  const triggerProps = richText.getBoldTriggerProps();

  return (
    <RichTextTriggerButton
      ref={ref}
      active={Boolean(triggerProps['aria-pressed'])}
      {...triggerProps}
      {...props}
      className={className}
    >
      {children ?? <Bold className="size-4" />}
    </RichTextTriggerButton>
  );
});

BoldTrigger.displayName = 'RichTextBoldTrigger';
