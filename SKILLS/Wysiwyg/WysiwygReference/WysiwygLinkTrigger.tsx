import type { HTMLArkProps } from '@ark-ui/react';
import { ark } from '@ark-ui/react/factory';
import { mergeProps } from '@ark-ui/react/utils';
import { forwardRef, useMemo } from 'react';
import { useWysiwygContext } from './useWysiwygContext';

export interface WysiwygLinkTriggerProps extends HTMLArkProps<'button'> {}

export const LinkTrigger = forwardRef<
  HTMLButtonElement,
  WysiwygLinkTriggerProps
>((props, ref) => {
  const wysiwyg = useWysiwygContext();

  const mergedProps = useMemo(
    () => mergeProps(wysiwyg.getLinkTriggerProps(), props),
    [props, wysiwyg],
  );

  return <ark.button ref={ref} {...mergedProps} />;
});

LinkTrigger.displayName = 'WysiwygLinkTrigger';
