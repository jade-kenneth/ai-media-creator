/** commit */
'use client';

import { forwardRef } from 'react';

import { useRichTextContext } from './useRichTextContext';

export type RichTextImageHiddenInputProps =
  React.ComponentPropsWithRef<'input'>;

export const ImageHiddenInput = forwardRef<
  HTMLInputElement,
  RichTextImageHiddenInputProps
>((props, ref) => {
  const richText = useRichTextContext();
  const inputProps = richText.getImageHiddenInputProps();

  return <input ref={ref} {...inputProps} {...props} />;
});

ImageHiddenInput.displayName = 'RichTextImageHiddenInput';
