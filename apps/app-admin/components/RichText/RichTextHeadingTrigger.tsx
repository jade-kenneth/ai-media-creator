/** commit */
'use client';

import { forwardRef } from 'react';

import { RichTextTriggerButton } from './RichTextTriggerButton';
import type { HeadingTriggerProps } from './useRichText';
import { useRichTextContext } from './useRichTextContext';

export interface RichTextHeadingTriggerProps
  extends
    Omit<React.ComponentPropsWithRef<'button'>, keyof HeadingTriggerProps>,
    HeadingTriggerProps {}

export const HeadingTrigger = forwardRef<
  HTMLButtonElement,
  RichTextHeadingTriggerProps
>(({ className, children, level, ...props }, ref) => {
  const richText = useRichTextContext();
  const triggerProps = richText.getHeadingTriggerProps({
    level,
  });

  return (
    <RichTextTriggerButton
      ref={ref}
      active={Boolean(triggerProps['aria-pressed'])}
      {...triggerProps}
      {...props}
      className={className}
    >
      {children ?? `H${level}`}
    </RichTextTriggerButton>
  );
});

HeadingTrigger.displayName = 'RichTextHeadingTrigger';
