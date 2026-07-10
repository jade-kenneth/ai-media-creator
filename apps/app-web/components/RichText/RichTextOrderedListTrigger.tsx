/** commit */
'use client';

import { ListOrdered } from 'lucide-react';
import { forwardRef } from 'react';

import { RichTextTriggerButton } from './RichTextTriggerButton';
import { useRichTextContext } from './useRichTextContext';

export type RichTextOrderedListTriggerProps =
  React.ComponentPropsWithRef<'button'>;

export const OrderedListTrigger = forwardRef<
  HTMLButtonElement,
  RichTextOrderedListTriggerProps
>(({ className, children, ...props }, ref) => {
  const richText = useRichTextContext();
  const triggerProps = richText.getOrderedListTriggerProps();

  return (
    <RichTextTriggerButton
      ref={ref}
      active={Boolean(triggerProps['aria-pressed'])}
      {...triggerProps}
      {...props}
      className={className}
    >
      {children ?? <ListOrdered className="size-4" />}
    </RichTextTriggerButton>
  );
});

OrderedListTrigger.displayName = 'RichTextOrderedListTrigger';
