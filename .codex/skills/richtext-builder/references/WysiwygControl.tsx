import { ark, type HTMLArkProps } from '@ark-ui/react';
import { mergeProps } from '@ark-ui/react/utils';
import { forwardRef, useMemo } from 'react';
import { useWysiwygContext } from './useWysiwygContext';

export interface WysiwygControlProps extends HTMLArkProps<'div'> {}

export const Control = forwardRef<HTMLDivElement, WysiwygControlProps>(
  (props, ref) => {
    const wysiwyg = useWysiwygContext();

    const mergedProps = useMemo(
      () => mergeProps(wysiwyg.getControlProps(), props),
      [props, wysiwyg],
    );

    return <ark.div ref={ref} {...mergedProps} />;
  },
);

Control.displayName = 'WysiwygControl';
