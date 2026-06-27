/** commit */
'use client';

import { forwardRef } from 'react';

import { cn } from '@/utils';

import { useRichTextContext } from './useRichTextContext';

export type RichTextCharactersCountProps = React.ComponentPropsWithRef<'span'>;

export const CharactersCount = forwardRef<
  HTMLSpanElement,
  RichTextCharactersCountProps
>(({ className, ...props }, ref) => {
  const richText = useRichTextContext();
  const countProps = richText.getCharactersCountProps();

  return (
    <span
      ref={ref}
      {...countProps}
      {...props}
      className={cn(countProps.className, className)}
    />
  );
});

CharactersCount.displayName = 'RichTextCharactersCount';
