/** commit */
'use client';

import { EditorContent } from '@tiptap/react';
import { forwardRef } from 'react';

import { cn } from '@/utils';

import { useRichTextContext } from './useRichTextContext';

export type RichTextContentProps = Omit<
  React.ComponentPropsWithRef<'div'>,
  'children'
>;

export const Content = forwardRef<HTMLDivElement, RichTextContentProps>(
  ({ className, ...props }, ref) => {
    const richText = useRichTextContext();
    const contentProps = richText.getContentProps();

    return (
      <div
        ref={ref}
        {...contentProps}
        {...props}
        className={cn(contentProps.className, className)}
      >
        <EditorContent editor={richText.editor} />
      </div>
    );
  },
);

Content.displayName = 'RichTextContent';
