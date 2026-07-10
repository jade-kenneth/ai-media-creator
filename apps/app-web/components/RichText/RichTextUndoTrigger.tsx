/** commit */
'use client';

import { Undo2 } from 'lucide-react';
import { forwardRef } from 'react';

import { RichTextTriggerButton } from './RichTextTriggerButton';
import { useRichTextContext } from './useRichTextContext';

export type RichTextUndoTriggerProps = React.ComponentPropsWithRef<'button'>;

export const UndoTrigger = forwardRef<
  HTMLButtonElement,
  RichTextUndoTriggerProps
>(({ className, children, ...props }, ref) => {
  const richText = useRichTextContext();
  const triggerProps = richText.getUndoTriggerProps();

  return (
    <RichTextTriggerButton
      ref={ref}
      {...triggerProps}
      {...props}
      className={className}
    >
      {children ?? <Undo2 className="size-4" />}
    </RichTextTriggerButton>
  );
});

UndoTrigger.displayName = 'RichTextUndoTrigger';
