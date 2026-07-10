/** commit */
'use client';

import { Editor } from '@tiptap/react';
import { forwardRef, useEffect } from 'react';

import { cn } from '@/utils';

import { useRichText, type UseRichTextProps } from './useRichText';
import { RichTextProvider } from './useRichTextContext';

export interface RichTextProps
  extends
    Omit<React.ComponentPropsWithRef<'div'>, keyof UseRichTextProps>,
    UseRichTextProps {
  editorRef?: React.MutableRefObject<Editor | null>;
}

export const Root = forwardRef<HTMLDivElement, RichTextProps>((props, ref) => {
  const {
    editorRef,
    defaultValue,
    disabled,
    id,
    ids,
    invalid,
    name,
    onImageUpload,
    onValueChange,
    placeholder,
    readOnly,
    required,
    spellCheck,
    value,
    limit,
    className,
    children,
    ...localProps
  } = props;

  const richText = useRichText({
    defaultValue,
    disabled,
    id,
    ids,
    invalid,
    name,
    onImageUpload,
    onValueChange,
    placeholder,
    readOnly,
    required,
    spellCheck,
    value,
    limit,
  });

  useEffect(() => {
    if (editorRef) {
      editorRef.current = richText.editor;
    }
  }, [editorRef, richText.editor]);

  const rootProps = richText.getRootProps();

  return (
    <RichTextProvider value={richText}>
      <div
        ref={ref}
        {...rootProps}
        {...localProps}
        className={cn(rootProps.className, className)}
      >
        {children}
      </div>
    </RichTextProvider>
  );
});

Root.displayName = 'RichTextRoot';
