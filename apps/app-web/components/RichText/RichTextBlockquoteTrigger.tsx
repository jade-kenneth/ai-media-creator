/** commit */
'use client';

import { TextQuote } from 'lucide-react';
import { forwardRef } from 'react';

import { RichTextTriggerButton } from './RichTextTriggerButton';
import { useRichTextContext } from './useRichTextContext';

export type RichTextBlockquoteTriggerProps =
  React.ComponentPropsWithRef<'button'>;

export const BlockquoteTrigger = forwardRef<
  HTMLButtonElement,
  RichTextBlockquoteTriggerProps
>(({ className, children, ...props }, ref) => {
  const richText = useRichTextContext();
  const triggerProps = richText.getBlockquoteTriggerProps();

  return (
    <RichTextTriggerButton
      ref={ref}
      active={Boolean(triggerProps['aria-pressed'])}
      {...triggerProps}
      {...props}
      className={className}
    >
      {children ?? <TextQuote className="size-4" />}
    </RichTextTriggerButton>
  );
});

BlockquoteTrigger.displayName = 'RichTextBlockquoteTrigger';
