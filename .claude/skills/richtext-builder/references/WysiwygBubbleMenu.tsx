import type { HTMLArkProps } from '@ark-ui/react';
import { ark } from '@ark-ui/react/factory';
import { mergeProps } from '@ark-ui/react/utils';
import { BubbleMenu as TiptapBubbleMenu } from '@tiptap/react/menus';
import { forwardRef, useMemo } from 'react';
import { useWysiwygContext } from './useWysiwygContext';

export interface WysiwygBubbleMenuProps
  extends Omit<HTMLArkProps<'div'>, 'asChild'> {}

export const BubbleMenu = forwardRef<HTMLDivElement, WysiwygBubbleMenuProps>(
  ({ children, ...props }, ref) => {
    const wysiwyg = useWysiwygContext();

    const mergedProps = useMemo(
      () => mergeProps(wysiwyg.getBubbleMenuProps(), props),
      [props, wysiwyg],
    );

    return (
      <ark.div ref={ref} {...mergedProps} asChild>
        <TiptapBubbleMenu editor={wysiwyg.editor ?? undefined}>
          {children}
        </TiptapBubbleMenu>
      </ark.div>
    );
  },
);

BubbleMenu.displayName = 'WysiwygBubbleMenu';
