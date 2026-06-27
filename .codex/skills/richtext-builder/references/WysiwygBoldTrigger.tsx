import type { HTMLArkProps } from '@ark-ui/react';
import { ark } from '@ark-ui/react/factory';
import { mergeProps } from '@ark-ui/react/utils';
import { forwardRef, useMemo } from 'react';
import { useWysiwygContext } from './useWysiwygContext';

export interface WysiwygBoldTriggerProps extends HTMLArkProps<'button'> {}

export const BoldTrigger = forwardRef<
  HTMLButtonElement,
  WysiwygBoldTriggerProps
>((props, ref) => {
  const wysiwyg = useWysiwygContext();

  const mergedProps = useMemo(
    () => mergeProps(wysiwyg.getBoldTriggerProps(), props),
    [props, wysiwyg],
  );

  return <ark.button ref={ref} {...mergedProps} />;
});

BoldTrigger.displayName = 'WysiwygBoldTrigger';
