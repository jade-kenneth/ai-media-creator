import type { HTMLArkProps } from '@ark-ui/react';
import { ark } from '@ark-ui/react/factory';
import { mergeProps } from '@ark-ui/react/utils';
import { forwardRef, useMemo } from 'react';
import { useWysiwygContext } from './useWysiwygContext';

export interface WysiwygCodeBlockTriggerProps extends HTMLArkProps<'button'> {}

export const CodeBlockTrigger = forwardRef<
  HTMLButtonElement,
  WysiwygCodeBlockTriggerProps
>((props, ref) => {
  const wysiwyg = useWysiwygContext();

  const mergedProps = useMemo(
    () => mergeProps(wysiwyg.getCodeBlockTriggerProps(), props),
    [props, wysiwyg],
  );

  return <ark.button ref={ref} {...mergedProps} />;
});

CodeBlockTrigger.displayName = 'WysiwygCodeBlockTrigger';
