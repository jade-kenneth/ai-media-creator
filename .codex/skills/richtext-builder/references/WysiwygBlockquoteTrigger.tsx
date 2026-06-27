import type { HTMLArkProps } from '@ark-ui/react';
import { ark } from '@ark-ui/react/factory';
import { mergeProps } from '@ark-ui/react/utils';
import { forwardRef, useMemo } from 'react';
import { useWysiwygContext } from './useWysiwygContext';

export interface WysiwygBlockquoteTriggerProps extends HTMLArkProps<'button'> {}

export const BlockquoteTrigger = forwardRef<
  HTMLButtonElement,
  WysiwygBlockquoteTriggerProps
>((props, ref) => {
  const wysiwyg = useWysiwygContext();

  const mergedProps = useMemo(
    () => mergeProps(wysiwyg.getBlockquoteTriggerProps(), props),
    [props, wysiwyg],
  );

  return <ark.button ref={ref} {...mergedProps} />;
});

BlockquoteTrigger.displayName = 'WysiwygBlockquoteTrigger';
