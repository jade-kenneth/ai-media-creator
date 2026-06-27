/** commit */
'use client';

import { AlignCenter, AlignJustify, AlignLeft, AlignRight } from 'lucide-react';
import { forwardRef } from 'react';

import { RichTextTriggerButton } from './RichTextTriggerButton';
import type { TextAlignProps } from './useRichText';
import { useRichTextContext } from './useRichTextContext';

export interface RichTextTextAlignTriggerProps
  extends
    Omit<React.ComponentPropsWithRef<'button'>, keyof TextAlignProps>,
    TextAlignProps {}

function TextAlignIcon(props: TextAlignProps) {
  switch (props.textAlign) {
    case 'center':
      return <AlignCenter className="size-4" />;
    case 'right':
      return <AlignRight className="size-4" />;
    case 'justify':
      return <AlignJustify className="size-4" />;
    default:
      return <AlignLeft className="size-4" />;
  }
}

export const TextAlignTrigger = forwardRef<
  HTMLButtonElement,
  RichTextTextAlignTriggerProps
>(({ className, children, textAlign, ...props }, ref) => {
  const richText = useRichTextContext();
  const triggerProps = richText.getTextAlignTriggerProps({
    textAlign,
  });

  return (
    <RichTextTriggerButton
      ref={ref}
      active={Boolean(triggerProps['aria-pressed'])}
      {...triggerProps}
      {...props}
      className={className}
    >
      {children ?? <TextAlignIcon textAlign={textAlign} />}
    </RichTextTriggerButton>
  );
});

TextAlignTrigger.displayName = 'RichTextTextAlignTrigger';
