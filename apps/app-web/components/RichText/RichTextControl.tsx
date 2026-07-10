/** commit */
'use client';

import { forwardRef } from 'react';

import { cn } from '@/utils';

import { useRichTextContext } from './useRichTextContext';

export type RichTextControlProps = React.ComponentPropsWithRef<'div'>;

export const Control = forwardRef<HTMLDivElement, RichTextControlProps>(
  ({ className, ...props }, ref) => {
    const richText = useRichTextContext();
    const controlProps = richText.getControlProps();

    return (
      <div
        ref={ref}
        {...controlProps}
        {...props}
        className={cn(controlProps.className, className)}
      />
    );
  },
);

Control.displayName = 'RichTextControl';
