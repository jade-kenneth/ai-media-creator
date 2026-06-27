import type { Assign, HTMLArkProps } from '@ark-ui/react';
import { ark } from '@ark-ui/react/factory';
import { mergeProps } from '@ark-ui/react/utils';
import { forwardRef, useMemo } from 'react';
import { splitProps } from '~/utils/splitProps';
import type { HeadingTriggerProps } from './useWysiwyg';
import { useWysiwygContext } from './useWysiwygContext';

export interface WysiwygHeadingTriggerProps
  extends Assign<HTMLArkProps<'button'>, HeadingTriggerProps> {}

export const HeadingTrigger = forwardRef<
  HTMLButtonElement,
  WysiwygHeadingTriggerProps
>((props, ref) => {
  const wysiwyg = useWysiwygContext();

  const [headingTriggerProps, localProps] = useMemo(
    () => splitProps(props, ['level']),
    [props],
  );

  const mergedProps = mergeProps(
    wysiwyg.getHeadingTriggerProps(headingTriggerProps),
    localProps,
  );

  return <ark.button ref={ref} {...mergedProps} />;
});

HeadingTrigger.displayName = 'Wysiwyg.HeadingTrigger';
