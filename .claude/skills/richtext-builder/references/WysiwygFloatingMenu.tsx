import type { HTMLArkProps } from '@ark-ui/react';
import { ark } from '@ark-ui/react/factory';
import { mergeProps } from '@ark-ui/react/utils';
import { FloatingMenu as TiptapFloatingMenu } from '@tiptap/react/menus';
import { forwardRef, useMemo } from 'react';
import { useWysiwygContext } from './useWysiwygContext';

export interface WysiwygFloatingMenuProps
  extends Omit<HTMLArkProps<'div'>, 'asChild'> {}

export const FloatingMenu = forwardRef<
  HTMLDivElement,
  WysiwygFloatingMenuProps
>(({ children, ...props }, ref) => {
  const wysiwyg = useWysiwygContext();

  const mergedProps = useMemo(
    () => mergeProps(wysiwyg.getFloatingMenuProps(), props),
    [props, wysiwyg],
  );

  return (
    <ark.div ref={ref} {...mergedProps} asChild>
      <TiptapFloatingMenu
        editor={wysiwyg.editor}
        options={{
          placement: 'top-start',
        }}
      >
        {children}
      </TiptapFloatingMenu>
    </ark.div>
  );
});

FloatingMenu.displayName = 'WysiwygFloatingMenu';
