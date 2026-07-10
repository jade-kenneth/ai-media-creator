/** commit */
'use client';

import { Strikethrough } from 'lucide-react';
import { forwardRef } from 'react';

import { RichTextTriggerButton } from './RichTextTriggerButton';
import { useRichTextContext } from './useRichTextContext';

export type RichTextStrikeTriggerProps = React.ComponentPropsWithRef<'button'>;

export const StrikeTrigger = forwardRef<
  HTMLButtonElement,
  RichTextStrikeTriggerProps
>(({ className, children, ...props }, ref) => {
  const richText = useRichTextContext();
  const triggerProps = richText.getStrikeTriggerProps();

  return (
    <RichTextTriggerButton
      ref={ref}
      active={Boolean(triggerProps['aria-pressed'])}
      {...triggerProps}
      {...props}
      className={className}
    >
      {children ?? <Strikethrough className="size-4" />}
    </RichTextTriggerButton>
  );
});

StrikeTrigger.displayName = 'RichTextStrikeTrigger';
