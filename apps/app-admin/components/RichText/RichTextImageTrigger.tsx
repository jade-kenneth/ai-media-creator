/** commit */
'use client';

import { ImagePlus } from 'lucide-react';
import { forwardRef } from 'react';

import { cn } from '@/utils';

import { RichTextTriggerButton } from './RichTextTriggerButton';
import { useRichTextContext } from './useRichTextContext';

export type RichTextImageTriggerProps = React.ComponentPropsWithRef<'label'>;

export const ImageTrigger = forwardRef<
  HTMLLabelElement,
  RichTextImageTriggerProps
>(({ className, children, ...props }, ref) => {
  const richText = useRichTextContext();
  const triggerProps = richText.getImageTriggerProps();
  const isDisabled = Boolean(triggerProps.disabled);
  const ariaLabel =
    typeof triggerProps['aria-label'] === 'string'
      ? triggerProps['aria-label']
      : undefined;

  return (
    <RichTextTriggerButton
      asChild
      className={cn(isDisabled && 'pointer-events-none opacity-50', className)}
    >
      <label
        ref={ref}
        id={triggerProps.id}
        htmlFor={richText.ids.imageHiddenInput}
        aria-label={ariaLabel}
        aria-disabled={isDisabled || undefined}
        data-disabled={isDisabled ? '' : undefined}
        {...props}
      >
        {children ?? <ImagePlus className="size-4" />}
      </label>
    </RichTextTriggerButton>
  );
});

ImageTrigger.displayName = 'RichTextImageTrigger';
