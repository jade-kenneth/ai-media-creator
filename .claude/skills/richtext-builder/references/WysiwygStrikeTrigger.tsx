import type { HTMLArkProps } from '@ark-ui/react';
import { ark } from '@ark-ui/react/factory';
import { mergeProps } from '@ark-ui/react/utils';
import { forwardRef, useMemo } from 'react';
import { useWysiwygContext } from './useWysiwygContext';

export interface WysiwygStrikeTriggerProps extends HTMLArkProps<'button'> {}

export const StrikeTrigger = forwardRef<
  HTMLButtonElement,
  WysiwygStrikeTriggerProps
>((props, ref) => {
  const wysiwyg = useWysiwygContext();

  const mergedProps = useMemo(
    () => mergeProps(wysiwyg.getStrikeTriggerProps(), props),
    [props, wysiwyg],
  );

  return <ark.button ref={ref} {...mergedProps} />;
});

StrikeTrigger.displayName = 'WysiwygStrikeTrigger';
