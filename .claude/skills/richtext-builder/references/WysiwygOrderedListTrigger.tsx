import type { HTMLArkProps } from '@ark-ui/react';
import { ark } from '@ark-ui/react/factory';
import { mergeProps } from '@ark-ui/react/utils';
import { forwardRef, useMemo } from 'react';
import { useWysiwygContext } from './useWysiwygContext';

export interface WysiwygOrderedListTriggerProps
  extends HTMLArkProps<'button'> {}

export const OrderedListTrigger = forwardRef<
  HTMLButtonElement,
  WysiwygOrderedListTriggerProps
>((props, ref) => {
  const wysiwyg = useWysiwygContext();

  const mergedProps = useMemo(
    () => mergeProps(wysiwyg.getOrderedListTriggerProps(), props),
    [props, wysiwyg],
  );

  return <ark.button ref={ref} {...mergedProps} />;
});

OrderedListTrigger.displayName = 'OrderedListTrigger';
