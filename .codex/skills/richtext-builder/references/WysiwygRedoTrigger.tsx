import type { HTMLArkProps } from '@ark-ui/react';
import { ark } from '@ark-ui/react/factory';
import { mergeProps } from '@ark-ui/react/utils';
import { forwardRef, useMemo } from 'react';
import { useWysiwygContext } from './useWysiwygContext';

export interface WysiwygRedoTriggerProps extends HTMLArkProps<'button'> {}

export const RedoTrigger = forwardRef<
  HTMLButtonElement,
  WysiwygRedoTriggerProps
>((props, ref) => {
  const richTextEditor = useWysiwygContext();

  const mergedProps = useMemo(
    () => mergeProps(richTextEditor.getRedoTriggerProps(), props),
    [props, richTextEditor],
  );

  return <ark.button ref={ref} {...mergedProps} />;
});

RedoTrigger.displayName = 'WysiwygRedoTrigger';
