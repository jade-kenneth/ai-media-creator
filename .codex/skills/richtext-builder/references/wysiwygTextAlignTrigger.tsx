import type { Assign, HTMLArkProps } from '@ark-ui/react';
import { ark } from '@ark-ui/react/factory';
import { mergeProps } from '@ark-ui/react/utils';
import { forwardRef, useMemo } from 'react';
import { splitProps } from '~/utils/splitProps';
import type { TextAlignProps } from './useWysiwyg';
import { useWysiwygContext } from './useWysiwygContext';

export interface WysiwygTextAlignTriggerProps
  extends Assign<HTMLArkProps<'button'>, TextAlignProps> {}

export const TextAlignTrigger = forwardRef<
  HTMLButtonElement,
  WysiwygTextAlignTriggerProps
>((props, ref) => {
  const wysiwyg = useWysiwygContext();

  const [textAlignProps, localProps] = useMemo(
    () => splitProps(props, ['textAlign']),
    [props],
  );

  const mergedProps = useMemo(
    () =>
      mergeProps(wysiwyg.getTextAlignTriggerProps(textAlignProps), localProps),
    [localProps, textAlignProps, wysiwyg],
  );

  return <ark.button ref={ref} {...mergedProps} />;
});

TextAlignTrigger.displayName = 'TextAlignTrigger';
