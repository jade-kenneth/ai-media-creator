import type { HTMLArkProps } from '@ark-ui/react';
import { ark } from '@ark-ui/react/factory';
import { mergeProps } from '@ark-ui/react/utils';
import { forwardRef, useMemo } from 'react';
import { useWysiwygContext } from './useWysiwygContext';

export interface WysiwygImageHiddenInputProps extends HTMLArkProps<'input'> {}

export const ImageHiddenInput = forwardRef<
  HTMLInputElement,
  WysiwygImageHiddenInputProps
>((props, ref) => {
  const wysiwyg = useWysiwygContext();
  const mergedProps = useMemo(
    () => mergeProps(wysiwyg.getImageHiddenInputProps(), props),
    [props, wysiwyg],
  );

  return <ark.input ref={ref} {...mergedProps} />;
});

ImageHiddenInput.displayName = 'WysiwygImageHiddenInput';
