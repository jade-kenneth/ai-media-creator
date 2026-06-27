import type { HTMLArkProps } from '@ark-ui/react';
import { ark } from '@ark-ui/react/factory';
import { mergeProps } from '@ark-ui/react/utils';
import { EditorContent } from '@tiptap/react';
import { forwardRef, useMemo } from 'react';
import { useWysiwygContext } from './useWysiwygContext';

export interface WysiwygContentProps
  extends Omit<HTMLArkProps<'div'>, 'asChild' | 'children'> {}

export const Content = forwardRef<HTMLDivElement, WysiwygContentProps>(
  (props, ref) => {
    const wysiwyg = useWysiwygContext();

    const mergedProps = useMemo(
      () => mergeProps(wysiwyg.getContentProps(), props),
      [props, wysiwyg],
    );

    return (
      <ark.div ref={ref} {...mergedProps} asChild>
        <EditorContent editor={wysiwyg.editor} />
      </ark.div>
    );
  },
);

Content.displayName = 'WysiwygContent';
