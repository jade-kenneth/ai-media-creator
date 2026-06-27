import type { HTMLArkProps } from '@ark-ui/react';
import { ark } from '@ark-ui/react/factory';
import { mergeProps } from '@ark-ui/react/utils';
import { forwardRef, useMemo } from 'react';
import { useWysiwygContext } from './useWysiwygContext';

export interface WysiwygBulletListTriggerProps extends HTMLArkProps<'button'> {}

export const BulletListTrigger = forwardRef<
  HTMLButtonElement,
  WysiwygBulletListTriggerProps
>((props, ref) => {
  const wysiwyg = useWysiwygContext();

  const mergedProps = useMemo(
    () => mergeProps(wysiwyg.getBulletListTriggerProps(), props),
    [props, wysiwyg],
  );

  return <ark.button ref={ref} {...mergedProps} />;
});

BulletListTrigger.displayName = 'WysiwygBulletListTrigger';
