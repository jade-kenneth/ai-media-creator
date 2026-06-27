/** commit */
'use client';

import { Code2 } from 'lucide-react';
import { forwardRef } from 'react';

import { RichTextTriggerButton } from './RichTextTriggerButton';
import { useRichTextContext } from './useRichTextContext';

export type RichTextCodeBlockTriggerProps =
  React.ComponentPropsWithRef<'button'>;

export const CodeBlockTrigger = forwardRef<
  HTMLButtonElement,
  RichTextCodeBlockTriggerProps
>(({ className, children, ...props }, ref) => {
  const richText = useRichTextContext();
  const triggerProps = richText.getCodeBlockTriggerProps();

  return (
    <RichTextTriggerButton
      ref={ref}
      active={Boolean(triggerProps['aria-pressed'])}
      {...triggerProps}
      {...props}
      className={className}
    >
      {children ?? <Code2 className="size-4" />}
    </RichTextTriggerButton>
  );
});

CodeBlockTrigger.displayName = 'RichTextCodeBlockTrigger';
