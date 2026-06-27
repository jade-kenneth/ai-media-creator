import type { HTMLArkProps } from '@ark-ui/react';
import { ark } from '@ark-ui/react/factory';
import { mergeProps } from '@ark-ui/react/utils';
import { forwardRef, useMemo } from 'react';
import { useWysiwygContext } from './useWysiwygContext';

export interface WysiwygUnderlineTriggerProps extends HTMLArkProps<'button'> {}

export const UnderlineTrigger = forwardRef<
  HTMLButtonElement,
  WysiwygUnderlineTriggerProps
>((props, ref) => {
  const wysiwyg = useWysiwygContext();
  const mergedProps = useMemo(
    () => mergeProps(wysiwyg.getUnderlineTriggerProps(), props),
    [props, wysiwyg],
  );

  return <ark.button ref={ref} {...mergedProps} />;
});

UnderlineTrigger.displayName = 'WysiwygUnderlineTrigger';
