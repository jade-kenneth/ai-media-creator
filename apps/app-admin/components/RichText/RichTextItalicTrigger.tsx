/** commit */
'use client';

import { Italic } from 'lucide-react';
import { forwardRef } from 'react';

import { RichTextTriggerButton } from './RichTextTriggerButton';
import { useRichTextContext } from './useRichTextContext';

export type RichTextItalicTriggerProps = React.ComponentPropsWithRef<'button'>;

export const ItalicTrigger = forwardRef<
  HTMLButtonElement,
  RichTextItalicTriggerProps
>(({ className, children, ...props }, ref) => {
  const richText = useRichTextContext();
  const triggerProps = richText.getItalicTriggerProps();

  return (
    <RichTextTriggerButton
      ref={ref}
      active={Boolean(triggerProps['aria-pressed'])}
      {...triggerProps}
      {...props}
      className={className}
    >
      {children ?? <Italic className="size-4" />}
    </RichTextTriggerButton>
  );
});

ItalicTrigger.displayName = 'RichTextItalicTrigger';
