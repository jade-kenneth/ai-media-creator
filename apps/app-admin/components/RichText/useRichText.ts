/** commit */
'use client';

import Blockquote from '@tiptap/extension-blockquote';
import Bold from '@tiptap/extension-bold';
import BubbleMenu from '@tiptap/extension-bubble-menu';
import BulletList from '@tiptap/extension-bullet-list';
import CodeBlock from '@tiptap/extension-code-block';
import Document from '@tiptap/extension-document';
import HardBreak from '@tiptap/extension-hard-break';
import Heading from '@tiptap/extension-heading';
import History from '@tiptap/extension-history';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import Image from '@tiptap/extension-image';
import Italic from '@tiptap/extension-italic';
import Link from '@tiptap/extension-link';
import ListItem from '@tiptap/extension-list-item';
import OrderedList from '@tiptap/extension-ordered-list';
import Paragraph from '@tiptap/extension-paragraph';
import Placeholder from '@tiptap/extension-placeholder';
import Strike from '@tiptap/extension-strike';
import Text from '@tiptap/extension-text';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { CharacterCount } from '@tiptap/extensions';
import { Editor, useEditor, useEditorState } from '@tiptap/react';
import { useEffect, useId, useMemo, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

import {
  useControllableState,
  type UseControllableStateProps,
} from '@/hooks/use-controllable-state';
import { cn } from '@/utils';

export interface ElementIds {
  boldTrigger?: string;
  bulletListTrigger?: string;
  control?: string;
  content?: string;
  hardBreakTrigger?: string;
  headingTrigger?: string;
  imageHiddenInput?: string;
  imageTrigger?: string;
  italicTrigger?: string;
  linkTrigger?: string;
  orderedListTrigger?: string;
  root?: string;
  strikeTrigger?: string;
  underlineTrigger?: string;
  undoTrigger?: string;
  redoTrigger?: string;
  blockquoteTrigger?: string;
  bubbleMenu?: string;
  textAlignTrigger?: string;
  codeBlockTrigger?: string;
  floatingMenu?: string;
  charactersCount?: string;
}

export interface ValueChangeDetails {
  value: string;
}

export interface UseRichTextProps {
  id?: string;
  ids?: ElementIds;
  name?: string;
  value?: string;
  onValueChange?: (detail: ValueChangeDetails) => void;
  defaultValue?: string;
  placeholder?: string;
  readOnly?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  required?: boolean;
  spellCheck?: boolean;
  limit?: number;
  onImageUpload?: (file: File) => Promise<string> | string;
}

export interface HeadingTriggerProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface TextAlignProps {
  textAlign: 'left' | 'center' | 'right' | 'justify';
}

export interface EditorState {
  wordsCount: number;
  charactersCount: number;
}

type RootProps = React.ComponentPropsWithRef<'div'>;
type ButtonProps = React.ComponentPropsWithRef<'button'>;
type InputProps = React.ComponentPropsWithRef<'input'>;
type SpanProps = React.ComponentPropsWithRef<'span'>;

export interface UseRichTextReturn {
  value: string;
  setValue(value: string): void;
  editor: Editor | null;
  editorState: EditorState | null;
  ids: ElementIds;
  getBoldTriggerProps(): ButtonProps;
  getBulletListTriggerProps(): ButtonProps;
  getControlProps(): RootProps;
  getContentProps(): RootProps;
  getHardBreakTriggerProps(): ButtonProps;
  getHeadingTriggerProps(props: HeadingTriggerProps): ButtonProps;
  getImageTriggerProps(): ButtonProps;
  getImageHiddenInputProps(): InputProps;
  getItalicTriggerProps(): ButtonProps;
  getLinkTriggerProps(): ButtonProps;
  getOrderedListTriggerProps(): ButtonProps;
  getRootProps(): RootProps;
  getStrikeTriggerProps(): ButtonProps;
  getUnderlineTriggerProps(): ButtonProps;
  getUndoTriggerProps(): ButtonProps;
  getRedoTriggerProps(): ButtonProps;
  getBlockquoteTriggerProps(): ButtonProps;
  getBubbleMenuProps(): RootProps;
  getTextAlignTriggerProps(props: TextAlignProps): ButtonProps;
  getCodeBlockTriggerProps(): ButtonProps;
  getFloatingMenuProps(): RootProps;
  getCharactersCountProps(): SpanProps;
}

function dataAttr(value: boolean | undefined) {
  return value ? '' : undefined;
}

async function fileToDataUrl(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('Unable to read the selected image.'));
    };

    reader.onerror = () => {
      reject(new Error('Unable to read the selected image.'));
    };

    reader.readAsDataURL(file);
  });
}

export function useRichText(props: UseRichTextProps): UseRichTextReturn {
  const uid = useId();
  const id = props.id ?? uid;
  const ids = useMemo(
    () =>
      ({
        boldTrigger: `rich-text:${id}::bold-trigger`,
        bulletListTrigger: `rich-text:${id}::bullet-list-trigger`,
        control: `rich-text:${id}::control`,
        content: `rich-text:${id}::content`,
        hardBreakTrigger: `rich-text:${id}::hard-break-trigger`,
        headingTrigger: `rich-text:${id}::heading-trigger`,
        imageTrigger: `rich-text:${id}::image-trigger`,
        imageHiddenInput: `rich-text:${id}::image-hidden-input`,
        italicTrigger: `rich-text:${id}::italic-trigger`,
        linkTrigger: `rich-text:${id}::link-trigger`,
        orderedListTrigger: `rich-text:${id}::ordered-list-trigger`,
        root: `rich-text:${id}::root`,
        strikeTrigger: `rich-text:${id}::strike-trigger`,
        underlineTrigger: `rich-text:${id}::underline-trigger`,
        undoTrigger: `rich-text:${id}::undo-trigger`,
        redoTrigger: `rich-text:${id}::redo-trigger`,
        blockquoteTrigger: `rich-text:${id}::blockquote-trigger`,
        bubbleMenu: `rich-text:${id}::bubble-menu`,
        textAlignTrigger: `rich-text:${id}::text-align-trigger`,
        codeBlockTrigger: `rich-text:${id}::code-block-trigger`,
        floatingMenu: `rich-text:${id}::floating-menu`,
        charactersCount: `rich-text:${id}::characters-count`,
        ...props.ids,
      }) satisfies ElementIds,
    [id, props.ids],
  );

  const controllableStateProps: UseControllableStateProps<string> = {
    value: props.value,
    defaultValue: props.defaultValue ?? '',
    onChange: props.onValueChange
      ? (value) => props.onValueChange?.({ value })
      : undefined,
  };

  const [value, setValue] = useControllableState(controllableStateProps);
  const [focused, setFocused] = useState(false);
  const setFocusedDebounced = useDebouncedCallback(setFocused, 150);
  const limit = props.limit != null && props.limit > 0 ? props.limit : null;
  const isDisabled = Boolean(props.disabled);
  const isReadOnly = Boolean(props.readOnly);
  const isInvalid = Boolean(props.invalid);
  const isRequired = Boolean(props.required);
  const isEditable = !isDisabled && !isReadOnly;

  const editor = useEditor({
    extensions: [
      Document,
      Text,
      Paragraph,
      Heading,
      Bold,
      Italic,
      Underline,
      Strike,
      BulletList,
      OrderedList,
      ListItem,
      HardBreak,
      CharacterCount.configure({
        limit: limit ?? undefined,
      }),
      Placeholder.configure({
        placeholder: props.placeholder ?? '',
      }),
      Link.configure({
        autolink: true,
        openOnClick: false,
        protocols: ['http', 'https'],
      }),
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          alt: '',
          loading: 'lazy',
        },
      }),
      History,
      BubbleMenu,
      Blockquote,
      HorizontalRule,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      CodeBlock,
    ],
    content: value,
    editable: isEditable,
    editorProps: {
      attributes: {
        id: ids.content,
        class: 'tiptap',
        spellcheck: String(props.spellCheck ?? true),
        ...(props.name ? { name: props.name } : {}),
        ...(isDisabled ? { 'data-disabled': '' } : {}),
        ...(isReadOnly ? { 'data-readonly': '' } : {}),
        ...(isRequired ? { 'data-required': '' } : {}),
        ...(isInvalid ? { 'aria-invalid': 'true', 'data-invalid': '' } : {}),
      },
    },
    onUpdate(context) {
      setValue(context.editor.getHTML());
    },
    onFocus() {
      setFocusedDebounced(true);
    },
    onBlur() {
      setFocusedDebounced(false);
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.setEditable(isEditable);
  }, [editor, isEditable]);

  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      const current = editor.getHTML();
      const isEmpty = current === '<p></p>' && !value;

      if (!isEmpty && value !== current) {
        editor.commands.setContent(value || '', {
          emitUpdate: false,
        });
      }
    }
  }, [editor, value]);

  const editorState = useEditorState({
    editor,
    selector(context) {
      return {
        wordsCount: context.editor?.storage.characterCount.words() ?? 0,
        charactersCount:
          context.editor?.storage.characterCount.characters() ?? 0,
      };
    },
  });

  function getSharedStateData() {
    return {
      'data-focus': dataAttr(focused),
      'data-invalid': dataAttr(isInvalid),
      'data-readonly': dataAttr(isReadOnly),
      'data-required': dataAttr(isRequired),
      'data-disabled': dataAttr(isDisabled),
    };
  }

  function createTriggerProps(config: {
    id?: string;
    label: string;
    disabled?: boolean;
    pressed?: boolean;
    action?: () => void;
    onClick?: () => void;
    preserveSelectionOnMouseDown?: boolean;
  }): ButtonProps {
    return {
      id: config.id,
      type: 'button',
      disabled: config.disabled,
      onMouseDown(event) {
        if (!config.preserveSelectionOnMouseDown) {
          return;
        }

        event.preventDefault();

        if (config.action) {
          config.action();
        }
      },
      onClick(event) {
        if (
          config.action &&
          config.preserveSelectionOnMouseDown &&
          event.detail === 0
        ) {
          config.action();
          return;
        }

        config.onClick?.();
      },
      'aria-label': config.label,
      'aria-pressed': config.pressed,
      ...getSharedStateData(),
    };
  }

  function getRootProps(): RootProps {
    return {
      id: ids.root,
      'aria-invalid': isInvalid || undefined,
      className: cn(
        'w-full min-w-0 overflow-hidden rounded-xl border border-border/70 bg-card text-card-foreground shadow-xs',
        focused && 'ring-2 ring-ring/40',
        isInvalid && 'border-destructive/60 ring-2 ring-destructive/15',
        isDisabled && 'opacity-80',
      ),
      ...getSharedStateData(),
    };
  }

  function getControlProps(): RootProps {
    return {
      id: ids.control,
      className:
        'min-w-0 border-b border-border/70 bg-muted/15 px-2 py-2 sm:px-3 supports-[backdrop-filter]:bg-muted/10',
      ...getSharedStateData(),
    };
  }

  function getContentProps(): RootProps {
    return {
      className: cn(
        'bg-background',
        '[&_.tiptap]:min-h-52 [&_.tiptap]:px-3 [&_.tiptap]:py-3 [&_.tiptap]:text-sm [&_.tiptap]:leading-6 [&_.tiptap]:outline-none sm:[&_.tiptap]:min-h-56 sm:[&_.tiptap]:px-4',
        '[&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none [&_.tiptap_p.is-editor-empty:first-child::before]:float-left [&_.tiptap_p.is-editor-empty:first-child::before]:h-0 [&_.tiptap_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
        '[&_.tiptap_h1]:mt-4 [&_.tiptap_h1]:text-2xl [&_.tiptap_h1]:font-semibold',
        '[&_.tiptap_h2]:mt-4 [&_.tiptap_h2]:text-xl [&_.tiptap_h2]:font-semibold',
        '[&_.tiptap_h3]:mt-4 [&_.tiptap_h3]:text-lg [&_.tiptap_h3]:font-semibold',
        '[&_.tiptap_strong]:font-semibold',
        '[&_.tiptap_em]:italic',
        '[&_.tiptap_u]:underline',
        '[&_.tiptap_s]:line-through',
        '[&_.tiptap_blockquote]:my-3 [&_.tiptap_blockquote]:border-l-2 [&_.tiptap_blockquote]:border-border [&_.tiptap_blockquote]:pl-4 [&_.tiptap_blockquote]:text-muted-foreground',
        '[&_.tiptap_ul]:my-3 [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-6',
        '[&_.tiptap_ol]:my-3 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-6',
        '[&_.tiptap_pre]:my-3 [&_.tiptap_pre]:overflow-x-auto [&_.tiptap_pre]:rounded-lg [&_.tiptap_pre]:bg-zinc-950 [&_.tiptap_pre]:p-3 [&_.tiptap_pre]:font-mono [&_.tiptap_pre]:text-xs [&_.tiptap_pre]:text-zinc-50',
        '[&_.tiptap_img]:my-3 [&_.tiptap_img]:max-h-80 [&_.tiptap_img]:w-auto [&_.tiptap_img]:max-w-full [&_.tiptap_img]:rounded-lg [&_.tiptap_img]:border [&_.tiptap_img]:border-border/70',
        '[&_.tiptap_a]:text-primary [&_.tiptap_a]:underline [&_.tiptap_a]:underline-offset-4',
      ),
      ...getSharedStateData(),
    };
  }

  function getBoldTriggerProps(): ButtonProps {
    return createTriggerProps({
      id: ids.boldTrigger,
      label: 'Bold',
      pressed: editor?.isActive('bold'),
      disabled: isDisabled || isReadOnly || !editor,
      preserveSelectionOnMouseDown: true,
      action() {
        editor?.chain().focus().toggleBold().run();
      },
    });
  }

  function getItalicTriggerProps(): ButtonProps {
    return createTriggerProps({
      id: ids.italicTrigger,
      label: 'Italic',
      pressed: editor?.isActive('italic'),
      disabled: isDisabled || isReadOnly || !editor,
      preserveSelectionOnMouseDown: true,
      action() {
        editor?.chain().focus().toggleItalic().run();
      },
    });
  }

  function getUnderlineTriggerProps(): ButtonProps {
    return createTriggerProps({
      id: ids.underlineTrigger,
      label: 'Underline',
      pressed: editor?.isActive('underline'),
      disabled: isDisabled || isReadOnly || !editor,
      preserveSelectionOnMouseDown: true,
      action() {
        editor?.chain().focus().toggleUnderline().run();
      },
    });
  }

  function getStrikeTriggerProps(): ButtonProps {
    return createTriggerProps({
      id: ids.strikeTrigger,
      label: 'Strike',
      pressed: editor?.isActive('strike'),
      disabled: isDisabled || isReadOnly || !editor,
      preserveSelectionOnMouseDown: true,
      action() {
        editor?.chain().focus().toggleStrike().run();
      },
    });
  }

  function getHeadingTriggerProps(
    headingProps: HeadingTriggerProps,
  ): ButtonProps {
    return createTriggerProps({
      id: ids.headingTrigger,
      label: `Heading ${headingProps.level}`,
      pressed: editor?.isActive('heading', headingProps),
      disabled: isDisabled || isReadOnly || !editor,
      preserveSelectionOnMouseDown: true,
      action() {
        editor?.chain().focus().toggleHeading(headingProps).run();
      },
    });
  }

  function getBulletListTriggerProps(): ButtonProps {
    return createTriggerProps({
      id: ids.bulletListTrigger,
      label: 'Bullet list',
      pressed: editor?.isActive('bulletList'),
      disabled: isDisabled || isReadOnly || !editor,
      preserveSelectionOnMouseDown: true,
      action() {
        editor?.chain().focus().toggleBulletList().run();
      },
    });
  }

  function getOrderedListTriggerProps(): ButtonProps {
    return createTriggerProps({
      id: ids.orderedListTrigger,
      label: 'Ordered list',
      pressed: editor?.isActive('orderedList'),
      disabled: isDisabled || isReadOnly || !editor,
      preserveSelectionOnMouseDown: true,
      action() {
        editor?.chain().focus().toggleOrderedList().run();
      },
    });
  }

  function getBlockquoteTriggerProps(): ButtonProps {
    return createTriggerProps({
      id: ids.blockquoteTrigger,
      label: 'Blockquote',
      pressed: editor?.isActive('blockquote'),
      disabled: isDisabled || isReadOnly || !editor,
      preserveSelectionOnMouseDown: true,
      action() {
        editor?.chain().focus().toggleBlockquote().run();
      },
    });
  }

  function getCodeBlockTriggerProps(): ButtonProps {
    return createTriggerProps({
      id: ids.codeBlockTrigger,
      label: 'Code block',
      pressed: editor?.isActive('codeBlock'),
      disabled: isDisabled || isReadOnly || !editor,
      preserveSelectionOnMouseDown: true,
      action() {
        editor?.chain().focus().toggleCodeBlock().run();
      },
    });
  }

  function getHardBreakTriggerProps(): ButtonProps {
    return createTriggerProps({
      id: ids.hardBreakTrigger,
      label: 'Hard break',
      disabled: isDisabled || isReadOnly || !editor,
      preserveSelectionOnMouseDown: true,
      action() {
        editor?.chain().focus().setHardBreak().run();
      },
    });
  }

  function getLinkTriggerProps(): ButtonProps {
    return createTriggerProps({
      id: ids.linkTrigger,
      label: 'Link',
      pressed: editor?.isActive('link'),
      disabled: isDisabled || isReadOnly || !editor,
    });
  }

  function getImageHiddenInputProps(): InputProps {
    return {
      id: ids.imageHiddenInput,
      type: 'file',
      accept: 'image/*',
      className:
        'pointer-events-none absolute h-px w-px overflow-hidden whitespace-nowrap opacity-0',
      tabIndex: -1,
      'aria-hidden': 'true',
      disabled: isDisabled || isReadOnly,
      async onChange(event) {
        const file = event.target.files?.[0];

        if (!file || !editor) {
          return;
        }

        try {
          const src = props.onImageUpload
            ? await props.onImageUpload(file)
            : await fileToDataUrl(file);

          editor.chain().focus().setImage({ src }).run();
        } catch (error) {
          console.error(error);
        } finally {
          event.target.value = '';
        }
      },
    };
  }

  function getImageTriggerProps(): ButtonProps {
    return createTriggerProps({
      id: ids.imageTrigger,
      label: 'Image',
      disabled: isDisabled || isReadOnly,
      preserveSelectionOnMouseDown: false,
      onClick() {
        const input = document.getElementById(ids.imageHiddenInput ?? '') as
          | (HTMLInputElement & { showPicker?: () => void })
          | null;

        if (!input) {
          return;
        }

        if (typeof input.showPicker === 'function') {
          try {
            input.showPicker();
            return;
          } catch {
            // Some browsers expose showPicker() but reject it on visually hidden inputs.
          }
        }

        input.click();
      },
    });
  }

  function getTextAlignTriggerProps(
    textAlignProps: TextAlignProps,
  ): ButtonProps {
    return createTriggerProps({
      id: ids.textAlignTrigger,
      label: `Text align ${textAlignProps.textAlign}`,
      pressed: editor?.isActive({
        textAlign: textAlignProps.textAlign,
      }),
      disabled: isDisabled || isReadOnly || !editor,
      preserveSelectionOnMouseDown: true,
      action() {
        editor?.chain().focus().setTextAlign(textAlignProps.textAlign).run();
      },
    });
  }

  function getUndoTriggerProps(): ButtonProps {
    return createTriggerProps({
      id: ids.undoTrigger,
      label: 'Undo',
      disabled: isDisabled || isReadOnly || !editor,
      preserveSelectionOnMouseDown: true,
      action() {
        editor?.chain().focus().undo().run();
      },
    });
  }

  function getRedoTriggerProps(): ButtonProps {
    return createTriggerProps({
      id: ids.redoTrigger,
      label: 'Redo',
      disabled: isDisabled || isReadOnly || !editor,
      preserveSelectionOnMouseDown: true,
      action() {
        editor?.chain().focus().redo().run();
      },
    });
  }

  function getBubbleMenuProps(): RootProps {
    return {
      id: ids.bubbleMenu,
      className:
        'flex items-center gap-1 rounded-lg border border-border/70 bg-popover p-1 shadow-md',
      ...getSharedStateData(),
    };
  }

  function getFloatingMenuProps(): RootProps {
    return {
      id: ids.floatingMenu,
      className:
        'flex items-center gap-1 rounded-lg border border-border/70 bg-popover p-1 shadow-md',
      ...getSharedStateData(),
    };
  }

  function getCharactersCountProps(): SpanProps {
    const count = editorState?.charactersCount ?? null;

    return {
      id: ids.charactersCount,
      className: 'text-xs text-muted-foreground',
      hidden: limit == null || count == null,
      children: limit == null || count == null ? null : `${count}/${limit}`,
      ...getSharedStateData(),
    };
  }

  return {
    value,
    setValue,
    editor,
    editorState,
    ids,
    getBoldTriggerProps,
    getBulletListTriggerProps,
    getControlProps,
    getContentProps,
    getHardBreakTriggerProps,
    getHeadingTriggerProps,
    getImageTriggerProps,
    getImageHiddenInputProps,
    getItalicTriggerProps,
    getLinkTriggerProps,
    getOrderedListTriggerProps,
    getRootProps,
    getStrikeTriggerProps,
    getUnderlineTriggerProps,
    getUndoTriggerProps,
    getRedoTriggerProps,
    getBlockquoteTriggerProps,
    getBubbleMenuProps,
    getTextAlignTriggerProps,
    getCodeBlockTriggerProps,
    getFloatingMenuProps,
    getCharactersCountProps,
  };
}
