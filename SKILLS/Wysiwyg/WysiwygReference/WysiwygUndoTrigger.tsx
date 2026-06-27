import type { HTMLArkProps } from '@ark-ui/react';
import { ark } from '@ark-ui/react/factory';
import { mergeProps } from '@ark-ui/react/utils';
import { forwardRef, useMemo } from 'react';
import { useWysiwygContext } from './useWysiwygContext';

export interface WysiwygUndoTriggerProps extends HTMLArkProps<'button'> {}

export const UndoTrigger = forwardRef<
  HTMLButtonElement,
  WysiwygUndoTriggerProps
>((props, ref) => {
  const wysiwyg = useWysiwygContext();
  const mergedProps = useMemo(
    () => mergeProps(wysiwyg.getUndoTriggerProps(), props),
    [props, wysiwyg],
  );

  return <ark.button ref={ref} {...mergedProps} />;
});

UndoTrigger.displayName = 'WysiwygUndoTrigger';
