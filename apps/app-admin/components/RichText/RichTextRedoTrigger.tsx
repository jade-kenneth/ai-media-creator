/** commit */
'use client';

import { Redo2 } from 'lucide-react';
import { forwardRef } from 'react';

import { RichTextTriggerButton } from './RichTextTriggerButton';
import { useRichTextContext } from './useRichTextContext';

export type RichTextRedoTriggerProps = React.ComponentPropsWithRef<'button'>;

export const RedoTrigger = forwardRef<
  HTMLButtonElement,
  RichTextRedoTriggerProps
>(({ className, children, ...props }, ref) => {
  const richText = useRichTextContext();
  const triggerProps = richText.getRedoTriggerProps();

  return (
    <RichTextTriggerButton
      ref={ref}
      {...triggerProps}
      {...props}
      className={className}
    >
      {children ?? <Redo2 className="size-4" />}
    </RichTextTriggerButton>
  );
});

RedoTrigger.displayName = 'RichTextRedoTrigger';
