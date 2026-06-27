/** commit */
'use client';

import { BubbleMenu as TiptapBubbleMenu } from '@tiptap/react/menus';
import { forwardRef } from 'react';

import { cn } from '@/utils';

import { useRichTextContext } from './useRichTextContext';

export interface RichTextBubbleMenuProps extends Omit<
  React.ComponentPropsWithRef<'div'>,
  'children'
> {
  children?: React.ReactNode;
}

export const BubbleMenu = forwardRef<HTMLDivElement, RichTextBubbleMenuProps>(
  ({ className, children, ...props }, ref) => {
    const richText = useRichTextContext();
    const bubbleMenuProps = richText.getBubbleMenuProps();

    if (!richText.editor) {
      return null;
    }

    return (
      <TiptapBubbleMenu editor={richText.editor}>
        <div
          ref={ref}
          {...bubbleMenuProps}
          {...props}
          className={cn(bubbleMenuProps.className, className)}
        >
          {children}
        </div>
      </TiptapBubbleMenu>
    );
  },
);

BubbleMenu.displayName = 'RichTextBubbleMenu';
