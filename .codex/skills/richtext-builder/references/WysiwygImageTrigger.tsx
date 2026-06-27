import type { HTMLArkProps } from '@ark-ui/react';
import { ark } from '@ark-ui/react/factory';
import { mergeProps } from '@ark-ui/react/utils';
import { forwardRef, useMemo } from 'react';
import { useWysiwygContext } from './useWysiwygContext';

export interface WysiwygImageTriggerProps extends HTMLArkProps<'button'> {}

export const ImageTrigger = forwardRef<
  HTMLButtonElement,
  WysiwygImageTriggerProps
>((props, ref) => {
  const wysiwyg = useWysiwygContext();

  const mergedProps = useMemo(
    () => mergeProps(wysiwyg.getImageTriggerProps(), props),
    [props, wysiwyg],
  );

  return <ark.button ref={ref} {...mergedProps} />;
});

ImageTrigger.displayName = 'WysiwygImageTrigger';
