/** commit */
'use client';

import { Underline } from 'lucide-react';
import { forwardRef } from 'react';

import { RichTextTriggerButton } from './RichTextTriggerButton';
import { useRichTextContext } from './useRichTextContext';

export type RichTextUnderlineTriggerProps =
  React.ComponentPropsWithRef<'button'>;

export const UnderlineTrigger = forwardRef<
  HTMLButtonElement,
  RichTextUnderlineTriggerProps
>(({ className, children, ...props }, ref) => {
  const richText = useRichTextContext();
  const triggerProps = richText.getUnderlineTriggerProps();

  return (
    <RichTextTriggerButton
      ref={ref}
      active={Boolean(triggerProps['aria-pressed'])}
      {...triggerProps}
      {...props}
      className={className}
    >
      {children ?? <Underline className="size-4" />}
    </RichTextTriggerButton>
  );
});

UnderlineTrigger.displayName = 'RichTextUnderlineTrigger';
