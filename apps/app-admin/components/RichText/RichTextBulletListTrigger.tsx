/** commit */
'use client';

import { List } from 'lucide-react';
import { forwardRef } from 'react';

import { RichTextTriggerButton } from './RichTextTriggerButton';
import { useRichTextContext } from './useRichTextContext';

export type RichTextBulletListTriggerProps =
  React.ComponentPropsWithRef<'button'>;

export const BulletListTrigger = forwardRef<
  HTMLButtonElement,
  RichTextBulletListTriggerProps
>(({ className, children, ...props }, ref) => {
  const richText = useRichTextContext();
  const triggerProps = richText.getBulletListTriggerProps();

  return (
    <RichTextTriggerButton
      ref={ref}
      active={Boolean(triggerProps['aria-pressed'])}
      {...triggerProps}
      {...props}
      className={className}
    >
      {children ?? <List className="size-4" />}
    </RichTextTriggerButton>
  );
});

BulletListTrigger.displayName = 'RichTextBulletListTrigger';
