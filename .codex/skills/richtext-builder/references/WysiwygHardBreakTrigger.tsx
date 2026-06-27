import type { HTMLArkProps } from '@ark-ui/react';
import { ark } from '@ark-ui/react/factory';
import { mergeProps } from '@ark-ui/react/utils';
import { forwardRef, useMemo } from 'react';
import { useWysiwygContext } from './useWysiwygContext';

export interface WysiwygHardBreakTriggerProps extends HTMLArkProps<'button'> {}

export const HardBreakTrigger = forwardRef<
  HTMLButtonElement,
  WysiwygHardBreakTriggerProps
>((props, ref) => {
  const wysiwyg = useWysiwygContext();

  const mergedProps = useMemo(
    () => mergeProps(wysiwyg.getHardBreakTriggerProps(), props),
    [props, wysiwyg],
  );

  return <ark.button ref={ref} {...mergedProps} />;
});

HardBreakTrigger.displayName = 'WysiwygHardBreakTrigger';
