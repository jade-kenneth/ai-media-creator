import type { HTMLArkProps } from '@ark-ui/react';
import { ark } from '@ark-ui/react/factory';
import { mergeProps } from '@ark-ui/react/utils';
import { forwardRef, useMemo } from 'react';
import { useWysiwygContext } from './useWysiwygContext';

export interface WysiwygCharactersCountProps extends HTMLArkProps<'span'> {}

export const CharactersCount = forwardRef<
  HTMLSpanElement,
  WysiwygCharactersCountProps
>((props, ref) => {
  const wysiwyg = useWysiwygContext();

  const mergedProps = useMemo(
    () => mergeProps(wysiwyg.getCharactersCountProps(), props),
    [props, wysiwyg],
  );

  return <ark.span ref={ref} {...mergedProps} />;
});

CharactersCount.displayName = 'WysiwygCharactersCount';
