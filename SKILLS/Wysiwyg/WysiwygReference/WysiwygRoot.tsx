import type { Assign, HTMLArkProps } from '@ark-ui/react';
import { ark } from '@ark-ui/react/factory';
import { mergeProps } from '@ark-ui/react/utils';
import { Editor } from '@tiptap/react';
import { forwardRef, useEffect, useMemo } from 'react';
import { splitProps } from '~/utils/splitProps';
import { useWysiwyg, type UseWysiwygProps } from './useWysiwyg';
import { WysiwygProvider } from './useWysiwygContext';

export interface WysiwygProps
  extends Assign<HTMLArkProps<'div'>, UseWysiwygProps> {
  editorRef?: React.RefObject<Editor | null>;
}

export const Root = forwardRef<HTMLDivElement, WysiwygProps>((props, ref) => {
  const { editorRef, ...restProps } = props;

  const [useWysiwygProps, localProps] = useMemo(
    () =>
      splitProps(restProps, [
        'defaultValue',
        'disabled',
        'id',
        'ids',
        'invalid',
        'name',
        'onValueChange',
        'placeholder',
        'readOnly',
        'required',
        'spellCheck',
        'value',
        'limit',
      ]),
    [restProps],
  );

  const wysiwyg = useWysiwyg(useWysiwygProps);

  useEffect(() => {
    if (editorRef) editorRef.current = wysiwyg.editor;
  }, [editorRef, wysiwyg.editor]);

  const mergedProps = useMemo(
    () => mergeProps(wysiwyg.getRootProps(), localProps),
    [localProps, wysiwyg],
  );

  return (
    <WysiwygProvider value={wysiwyg}>
      <ark.div ref={ref} {...mergedProps} />
    </WysiwygProvider>
  );
});

Root.displayName = 'WysiwygRoot';
