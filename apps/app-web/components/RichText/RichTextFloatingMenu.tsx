/** commit */
'use client';

import { FloatingMenu as TiptapFloatingMenu } from '@tiptap/react/menus';
import { forwardRef } from 'react';

import { cn } from '@/utils';

import { useRichTextContext } from './useRichTextContext';

export interface RichTextFloatingMenuProps extends Omit<
  React.ComponentPropsWithRef<'div'>,
  'children'
> {
  children?: React.ReactNode;
}

export const FloatingMenu = forwardRef<
  HTMLDivElement,
  RichTextFloatingMenuProps
>(({ className, children, ...props }, ref) => {
  const richText = useRichTextContext();
  const floatingMenuProps = richText.getFloatingMenuProps();

  if (!richText.editor) {
    return null;
  }

  return (
    <TiptapFloatingMenu
      editor={richText.editor}
      options={{
        placement: 'top-start',
      }}
    >
      <div
        ref={ref}
        {...floatingMenuProps}
        {...props}
        className={cn(floatingMenuProps.className, className)}
      >
        {children}
      </div>
    </TiptapFloatingMenu>
  );
});

FloatingMenu.displayName = 'RichTextFloatingMenu';
