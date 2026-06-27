import {
  useEnvironmentContext,
  useFieldContext,
  useLocaleContext,
  type HTMLArkProps,
} from '@ark-ui/react';
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
import { useEffect, useId, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { useControllableState } from '~/hooks/useControllableState';
import { dataAttr } from '~/utils/dataAttr';
import { parts } from './Wysiwyg.anatomy';

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

export interface UseWysiwygProps {
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

export interface UseWysiwygReturn {
  value: string;
  setValue(value: string): void;
  editor: Editor | null;
  editorState: EditorState | null;
  getBoldTriggerProps(): HTMLArkProps<'button'>;
  getBulletListTriggerProps(): HTMLArkProps<'button'>;
  getControlProps(): HTMLArkProps<'div'>;
  getContentProps(): HTMLArkProps<'div'>;
  getHardBreakTriggerProps(): HTMLArkProps<'button'>;
  getHeadingTriggerProps(props: HeadingTriggerProps): HTMLArkProps<'button'>;
  getImageTriggerProps(): HTMLArkProps<'button'>;
  getImageHiddenInputProps(): HTMLArkProps<'input'>;
  getItalicTriggerProps(): HTMLArkProps<'button'>;
  getLinkTriggerProps(): HTMLArkProps<'button'>;
  getOrderedListTriggerProps(): HTMLArkProps<'button'>;
  getRootProps(): HTMLArkProps<'div'>;
  getStrikeTriggerProps(): HTMLArkProps<'button'>;
  getUnderlineTriggerProps(): HTMLArkProps<'button'>;
  getUndoTriggerProps(): HTMLArkProps<'button'>;
  getRedoTriggerProps(): HTMLArkProps<'button'>;
  getBlockquoteTriggerProps(): HTMLArkProps<'button'>;
  getBubbleMenuProps(): HTMLArkProps<'div'>;
  getTextAlignTriggerProps(props: TextAlignProps): HTMLArkProps<'button'>;
  getCodeBlockTriggerProps(): HTMLArkProps<'button'>;
  getFloatingMenuProps(): HTMLArkProps<'div'>;
  getCharactersCountProps(): HTMLArkProps<'span'>;
}

export function useWysiwyg(props: UseWysiwygProps): UseWysiwygReturn {
  const uid = useId();
  const id = props.id ?? uid;
  const ids = {
    boldTrigger: `wysiwyg:${id}::bold-trigger`,
    bulletListTrigger: `wysiwyg:${id}::bullet-list-trigger`,
    control: `wysiwyg:${id}::control`,
    content: `wysiwyg:${id}::content`,
    hardBreakTrigger: `wysiwyg:${id}::hard-break-trigger`,
    headingTrigger: `wysiwyg:${id}::heading-trigger`,
    imageTrigger: `wysiwyg:${id}::image-trigger`,
    imageHiddenInput: `wysiwyg:${id}::image-hidden-input`,
    italicTrigger: `wysiwyg:${id}::italic-trigger`,
    linkTrigger: `wysiwyg:${id}::link-trigger`,
    orderedListTrigger: `wysiwyg:${id}::ordered-list-trigger`,
    root: `wysiwyg:${id}::root`,
    strikeTrigger: `wysiwyg:${id}::strike-trigger`,
    underlineTrigger: `wysiwyg:${id}::underline-trigger`,
    undoTrigger: `wysiwyg:${id}::undo-trigger`,
    redoTrigger: `wysiwyg:${id}::redo-trigger`,
    blockquoteTrigger: `wysiwyg:${id}::blockquote-trigger`,
    bubbleMenu: `wysiwyg:${id}::bubble-menu`,
    textAlignTrigger: `wysiwyg:${id}::text-align-trigger`,
    codeBlockTrigger: `wysiwyg:${id}::code-block-trigger`,
    floatingMenu: `wysiwyg:${id}::floating-menu`,
    charactersCount: `wysiwyg:${id}::character-count`,
    ...props.ids,
  } satisfies ElementIds;

  const field = useFieldContext();
  const locale = useLocaleContext();
  const environment = useEnvironmentContext();

  const [value, setValue] = useControllableState({
    value: props.value,
    defaultValue: props.defaultValue ?? '',
    onChange: props.onValueChange
      ? (value) => props.onValueChange?.({ value })
      : undefined,
  });

  const [focused, setFocused] = useState(false);
  const setFocusedDebounce = useDebouncedCallback(setFocused, 150);

  const [imageHiddenInput, setImageHiddenInput] =
    useState<HTMLInputElement | null>(null);

  useEffect(() => {
    const input = environment
      .getDocument()
      .getElementById(ids.imageHiddenInput) as HTMLInputElement | null;
    setImageHiddenInput(input);
  }, [environment, ids.imageHiddenInput]);

  const limit = props.limit != null && props.limit > 0 ? props.limit : null;
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
        limit,
      }),
      Placeholder.configure({
        placeholder: props.placeholder,
      }),
      Link.configure({
        autolink: true,
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
    onUpdate(ctx) {
      setValue(ctx.editor.getHTML());
    },
    editable:
      !props.readOnly /* readOnly set */ &&
      !field?.readOnly /* readOnly set on field */ &&
      !props.disabled /* disabled set */ &&
      !field?.disabled /* disabled set on field */,
    editorProps: {
      attributes: {
        id: field?.ids.control,
        dir: locale.dir,
        style: 'outline:none;',
        spellCheck: props.spellCheck ? 'true' : 'false',
        ...(props.name && {
          name: props.name,
        }),
        ...((props.disabled || field?.disabled) && {
          'data-disabled': '',
        }),
        ...((props.readOnly || field?.readOnly) && {
          'data-readonly': '',
        }),
        ...((props.required || field?.required) && {
          'data-required': '',
        }),
        ...((props.invalid || field?.invalid) && {
          'data-invalid': '',
        }),
        ...(field?.ariaDescribedby && {
          'aria-describedby': field?.ariaDescribedby,
        }),
      },
    },
    onFocus() {
      setFocusedDebounce(true);
    },
    onBlur() {
      setFocusedDebounce(false);
    },
    immediatelyRender: false,
  });

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

  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      const current = editor.getHTML();
      const isEmpty = current === '<p></p>' && !value;
      if (!isEmpty && value !== current) {
        editor.commands.setContent(value || '', { emitUpdate: false });
      }
    }
  }, [editor, value]);

  function getBoldTriggerProps(): HTMLArkProps<'button'> & {
    [key: string]: any;
  } {
    return {
      id: ids.boldTrigger,
      dir: locale.dir,
      type: 'button',
      onClick() {
        editor?.chain().focus().toggleBold().run();
      },
      disabled:
        props.disabled ||
        field?.disabled ||
        !editor?.can().chain().toggleBold().run(),
      ...parts.boldTrigger.attrs,
      'data-focus': dataAttr(focused),
      'data-pressed': dataAttr(editor?.isActive('bold')),
      'data-invalid': dataAttr(field?.invalid || props.invalid),
      'data-readonly': dataAttr(field?.readOnly || props.readOnly),
      'data-required': dataAttr(field?.required || props.required),
      'data-disabled': dataAttr(
        field?.disabled ||
          props.disabled ||
          !editor?.can().chain().toggleBold().run(),
      ),
      'aria-label': 'Bold',
    };
  }

  function getBulletListTriggerProps(): HTMLArkProps<'button'> & {
    [key: string]: any;
  } {
    return {
      id: ids.bulletListTrigger,
      dir: locale.dir,
      type: 'button',
      onClick() {
        editor?.chain().focus().toggleBulletList().run();
      },
      disabled:
        field?.disabled ||
        props.disabled ||
        !editor?.can().chain().toggleBulletList().run(),
      ...parts.bulletListTrigger.attrs,
      'data-focus': dataAttr(focused),
      'data-pressed': dataAttr(editor?.isActive('bulletList')),
      'data-invalid': dataAttr(field?.invalid || props.invalid),
      'data-readonly': dataAttr(field?.readOnly || props.readOnly),
      'data-required': dataAttr(field?.required || props.required),
      'data-disabled': dataAttr(
        field?.disabled ||
          props.disabled ||
          !editor?.can().chain().toggleBulletList().run(),
      ),
      'aria-label': 'Bullet List',
    };
  }

  function getControlProps(): HTMLArkProps<'div'> & {
    [key: string]: any;
  } {
    return {
      id: ids.control,
      dir: locale.dir,
      ...parts.control.attrs,
      'data-focus': dataAttr(focused),
      'data-invalid': dataAttr(field?.invalid || props.invalid),
      'data-disabled': dataAttr(field?.disabled || props.disabled),
      'data-required': dataAttr(field?.required || props.required),
      'data-readonly': dataAttr(field?.readOnly || props.readOnly),
    };
  }

  function getContentProps(): HTMLArkProps<'div'> & {
    [key: string]: any;
  } {
    return {
      id: ids.content,
      dir: locale.dir,
      ...parts.content.attrs,
      'data-focus': dataAttr(focused),
      'data-invalid': dataAttr(field?.invalid || props.invalid),
      'data-disabled': dataAttr(field?.disabled || props.disabled),
      'data-required': dataAttr(field?.required || props.required),
      'data-readonly': dataAttr(field?.readOnly || props.readOnly),
    };
  }

  function getHardBreakTriggerProps(): HTMLArkProps<'button'> & {
    [key: string]: any;
  } {
    return {
      id: ids.hardBreakTrigger,
      dir: locale.dir,
      type: 'button',
      onClick() {
        editor?.chain().focus().setHardBreak().run();
      },
      disabled:
        field?.disabled ||
        props.disabled ||
        !editor?.can().chain().setHardBreak().run(),
      ...parts.hardBreakTrigger.attrs,
      'data-focus': dataAttr(focused),
      'data-invalid': dataAttr(field?.invalid || props.invalid),
      'data-readonly': dataAttr(field?.readOnly || props.readOnly),
      'data-required': dataAttr(field?.required || props.required),
      'data-disabled': dataAttr(
        field?.disabled ||
          props.disabled ||
          !editor?.can().chain().setHardBreak().run(),
      ),
      'aria-label': 'Hard Break',
    };
  }

  function getHeadingTriggerProps(
    headingProps: HeadingTriggerProps,
  ): HTMLArkProps<'button'> & {
    [key: string]: any;
  } {
    return {
      id: ids.headingTrigger,
      dir: locale.dir,
      type: 'button',
      onClick() {
        editor?.chain().focus().toggleHeading(headingProps).run();
      },
      disabled:
        field?.disabled ||
        props.disabled ||
        !editor?.can().chain().toggleHeading(headingProps).run(),
      ...parts.headingTrigger.attrs,
      'data-level': headingProps.level,
      'data-focus': dataAttr(focused),
      'data-pressed': dataAttr(editor?.isActive('heading', headingProps)),
      'data-invalid': dataAttr(field?.invalid || props.invalid),
      'data-readonly': dataAttr(field?.readOnly || props.readOnly),
      'data-required': dataAttr(field?.required || props.required),
      'data-disabled': dataAttr(
        field?.disabled ||
          props.disabled ||
          !editor?.can().chain().toggleHeading(headingProps).run(),
      ),
      'aria-label': `Heading ${headingProps.level}`,
    };
  }

  function getImageHiddenInputProps(): HTMLArkProps<'input'> {
    return {
      id: ids.imageHiddenInput,
      type: 'file',
      accept: 'image/*',
      style: {
        width: '0px',
        height: '0px',
        display: 'none',
        visibility: 'hidden',
      },
      async onChange(event) {
        if (!event.target.files?.length) return;
        console.error('NOT IMPLEMENTED');
      },
    };
  }

  function getImageTriggerProps(): HTMLArkProps<'button'> & {
    [key: string]: any;
  } {
    return {
      id: ids.imageTrigger,
      dir: locale.dir,
      type: 'button',
      onClick() {
        if (!imageHiddenInput) {
          console.error('Image input not found');
          return;
        }

        imageHiddenInput.click();
      },
      disabled: field?.disabled || props.disabled,
      ...parts.imageTrigger.attrs,
      'data-focus': dataAttr(focused),
      'data-invalid': dataAttr(field?.invalid || props.invalid),
      'data-readonly': dataAttr(field?.readOnly || props.readOnly),
      'data-required': dataAttr(field?.required || props.required),
      'data-disabled': dataAttr(field?.disabled || props.disabled),
      'aria-label': 'Image',
    };
  }

  function getItalicTriggerProps(): HTMLArkProps<'button'> & {
    [key: string]: any;
  } {
    return {
      id: ids.italicTrigger,
      dir: locale.dir,
      type: 'button',
      onClick() {
        editor?.chain().focus().toggleItalic().run();
      },
      disabled:
        field?.disabled ||
        props.disabled ||
        !editor?.can().chain().toggleItalic().run(),
      ...parts.italicTrigger.attrs,
      'data-focus': dataAttr(focused),
      'data-pressed': dataAttr(editor?.isActive('italic')),
      'data-invalid': dataAttr(field?.invalid || props.invalid),
      'data-readonly': dataAttr(field?.readOnly || props.readOnly),
      'data-required': dataAttr(field?.required || props.required),
      'data-disabled': dataAttr(
        field?.disabled ||
          props.disabled ||
          !editor?.can().chain().toggleItalic().run(),
      ),
      'aria-label': 'Italic',
    };
  }

  function getLinkTriggerProps(): HTMLArkProps<'button'> & {
    [key: string]: any;
  } {
    return {
      id: ids.linkTrigger,
      dir: locale.dir,
      type: 'button',
      onClick() {
        if (!editor) return;

        if (editor.isActive('link')) {
          return editor.chain().focus().unsetLink().run();
        }

        const prevUrl = editor.getAttributes('link').href;
        const nextUrl = window.prompt('URL', prevUrl);

        if (nextUrl === null) return;
        if (nextUrl === '') {
          return editor
            .chain()
            .focus()
            .extendMarkRange('link')
            .unsetLink()
            .run();
        }

        try {
          editor
            .chain()
            .focus()
            .extendMarkRange('link')
            .setLink({ href: nextUrl })
            .run();
        } catch {
          // ignore?
        }
      },
      ...parts.linkTrigger.attrs,
      'data-focus': dataAttr(focused),
      'data-pressed': dataAttr(editor?.isActive('link')),
      'data-invalid': dataAttr(field?.invalid || props.invalid),
      'data-readonly': dataAttr(field?.readOnly || props.readOnly),
      'data-required': dataAttr(field?.required || props.required),
      'data-disabled': dataAttr(field?.disabled || props.disabled),
      'aria-label': 'Link',
    };
  }

  function getOrderedListTriggerProps(): HTMLArkProps<'button'> & {
    [key: string]: any;
  } {
    return {
      id: ids.orderedListTrigger,
      dir: locale.dir,
      type: 'button',
      onClick() {
        editor?.chain().focus().toggleOrderedList().run();
      },
      disabled:
        field?.disabled ||
        props.disabled ||
        !editor?.can().chain().toggleOrderedList().run(),
      ...parts.orderedListTrigger.attrs,
      'data-focus': dataAttr(focused),
      'data-pressed': dataAttr(editor?.isActive('orderedList')),
      'data-invalid': dataAttr(field?.invalid || props.invalid),
      'data-readonly': dataAttr(field?.readOnly || props.readOnly),
      'data-required': dataAttr(field?.required || props.required),
      'data-disabled': dataAttr(
        field?.disabled ||
          props.disabled ||
          !editor?.can().chain().toggleOrderedList().run(),
      ),
      'aria-label': 'Ordered List',
    };
  }

  function getRootProps(): HTMLArkProps<'div'> & {
    [key: string]: any;
  } {
    return {
      id: ids.root,
      dir: locale.dir,
      ...parts.root.attrs,
      'data-focus': dataAttr(focused),
      'data-invalid': dataAttr(field?.invalid || props.invalid),
      'data-readonly': dataAttr(field?.readOnly || props.readOnly),
      'data-disabled': dataAttr(field?.disabled || props.disabled),
      'data-required': dataAttr(field?.required || props.required),
    };
  }

  function getStrikeTriggerProps(): HTMLArkProps<'button'> & {
    [key: string]: any;
  } {
    return {
      id: ids.strikeTrigger,
      dir: locale.dir,
      type: 'button',
      onClick() {
        editor?.chain().focus().toggleStrike().run();
      },
      disabled:
        field?.disabled ||
        props.disabled ||
        !editor?.can().chain().toggleStrike().run(),
      ...parts.strikeTrigger.attrs,
      'data-focus': dataAttr(focused),
      'data-pressed': dataAttr(editor?.isActive('strike')),
      'data-invalid': dataAttr(field?.invalid || props.invalid),
      'data-readonly': dataAttr(field?.readOnly || props.readOnly),
      'data-required': dataAttr(field?.required || props.required),
      'data-disabled': dataAttr(
        field?.disabled ||
          props.disabled ||
          !editor?.can().chain().toggleStrike().run(),
      ),
      'aria-label': 'Strike',
    };
  }

  function getUnderlineTriggerProps(): HTMLArkProps<'button'> & {
    [key: string]: any;
  } {
    return {
      id: ids.underlineTrigger,
      dir: locale.dir,
      type: 'button',
      onClick() {
        editor?.chain().focus().toggleUnderline().run();
      },
      disabled:
        field?.disabled ||
        props.disabled ||
        !editor?.can().chain().toggleUnderline().run(),
      ...parts.underlineTrigger.attrs,
      'data-focus': dataAttr(focused),
      'data-pressed': dataAttr(editor?.isActive('underline')),
      'data-invalid': dataAttr(field?.invalid || props.invalid),
      'data-readonly': dataAttr(field?.readOnly || props.readOnly),
      'data-required': dataAttr(field?.required || props.required),
      'data-disabled': dataAttr(
        field?.disabled ||
          props.disabled ||
          !editor?.can().chain().toggleUnderline().run(),
      ),
      'aria-label': 'Underline',
    };
  }

  function getUndoTriggerProps(): HTMLArkProps<'button'> & {
    [key: string]: any;
  } {
    return {
      id: ids.undoTrigger,
      dir: locale.dir,
      type: 'button',
      onClick() {
        editor?.chain().focus().undo().run();
      },
      disabled:
        field?.disabled ||
        props.disabled ||
        !editor?.can().chain().undo().run() /**/,
      ...parts.undoTrigger.attrs,
      'data-focus': dataAttr(focused),
      'data-invalid': dataAttr(field?.invalid || props.invalid),
      'data-readonly': dataAttr(field?.readOnly || props.readOnly),
      'data-required': dataAttr(field?.required || props.required),
      'data-disabled': dataAttr(
        field?.disabled ||
          props.disabled ||
          !editor?.can().chain().undo().run(),
      ),
      'aria-label': 'Undo',
    };
  }

  function getRedoTriggerProps(): HTMLArkProps<'button'> & {
    [key: string]: any;
  } {
    return {
      id: ids.redoTrigger,
      dir: locale.dir,
      type: 'button',
      onClick() {
        editor?.chain().focus().redo().run();
      },
      disabled:
        field?.disabled ||
        props.disabled ||
        !editor?.can().chain().redo().run() /**/,
      ...parts.redoTrigger.attrs,
      'data-focus': dataAttr(focused),
      'data-invalid': dataAttr(field?.invalid || props.invalid),
      'data-readonly': dataAttr(field?.readOnly || props.readOnly),
      'data-required': dataAttr(field?.required || props.required),
      'data-disabled': dataAttr(
        field?.disabled ||
          props.disabled ||
          !editor?.can().chain().redo().run(),
      ),
      'aria-label': 'Redo',
    };
  }

  function getBlockquoteTriggerProps(): HTMLArkProps<'button'> & {
    [key: string]: any;
  } {
    return {
      id: ids.blockquoteTrigger,
      dir: locale.dir,
      type: 'button',
      onClick() {
        editor?.chain().focus().toggleBlockquote().run();
      },
      disabled:
        field?.disabled ||
        props.disabled ||
        !editor?.can().chain().toggleBlockquote().run(),
      ...parts.blockquoteTrigger.attrs,
      'data-focus': dataAttr(focused),
      'data-pressed': dataAttr(editor?.isActive('blockquote')),
      'data-invalid': dataAttr(field?.invalid || props.invalid),
      'data-readonly': dataAttr(field?.readOnly || props.readOnly),
      'data-required': dataAttr(field?.required || props.required),
      'data-disabled': dataAttr(
        field?.disabled ||
          props.disabled ||
          !editor?.can().chain().toggleBlockquote().run(),
      ),
      'aria-label': 'Blockquote',
    };
  }

  function getBubbleMenuProps(): HTMLArkProps<'div'> & {
    [key: string]: any;
  } {
    return {
      id: ids.bubbleMenu,
      dir: locale.dir,
      ...parts.bubbleMenu.attrs,
      'data-focus': dataAttr(focused),
      'data-invalid': dataAttr(field?.invalid || props.invalid),
      'data-disabled': dataAttr(field?.disabled || props.disabled),
      'data-required': dataAttr(field?.required || props.required),
      'data-readonly': dataAttr(field?.readOnly || props.readOnly),
    };
  }

  function getTextAlignTriggerProps(
    textAlignProps: TextAlignProps,
  ): HTMLArkProps<'button'> & {
    [key: string]: any;
  } {
    return {
      id: ids.textAlignTrigger,
      dir: locale.dir,
      type: 'button',
      onClick() {
        editor?.chain().focus().setTextAlign(textAlignProps.textAlign).run();
      },
      disabled:
        field?.disabled ||
        props.disabled ||
        !editor?.can().chain().setTextAlign(textAlignProps.textAlign).run(),
      ...parts.textAlignTrigger.attrs,
      'data-focus': dataAttr(focused),
      'data-pressed': dataAttr(editor?.isActive('textAlign', props)),
      'data-invalid': dataAttr(field?.invalid || props.invalid),
      'data-readonly': dataAttr(field?.readOnly || props.readOnly),
      'data-required': dataAttr(field?.required || props.required),
      'data-disabled': dataAttr(
        field?.disabled ||
          props.disabled ||
          !editor?.can().chain().setTextAlign(textAlignProps.textAlign).run(),
      ),
      'aria-label': `Text Align ${textAlignProps.textAlign}`,
    };
  }

  function getCodeBlockTriggerProps(): HTMLArkProps<'button'> & {
    [key: string]: any;
  } {
    return {
      id: ids.codeBlockTrigger,
      dir: locale.dir,
      type: 'button',
      onClick() {
        editor?.chain().focus().toggleCodeBlock().run();
      },
      disabled:
        field?.disabled ||
        props.disabled ||
        !editor?.can().chain().toggleCodeBlock().run(),

      ...parts.codeBlockTrigger.attrs,
      'data-focus': dataAttr(focused),
      'data-pressed': dataAttr(editor?.isActive('codeBlock')),
      'data-invalid': dataAttr(field?.invalid || props.invalid),
      'data-readonly': dataAttr(field?.readOnly || props.readOnly),
      'data-required': dataAttr(field?.required || props.required),
      'data-disabled': dataAttr(
        field?.disabled ||
          props.disabled ||
          !editor?.can().chain().toggleCodeBlock().run(),
      ),
      'aria-label': 'Code Block',
    };
  }

  function getFloatingMenuProps(): HTMLArkProps<'div'> & {
    [key: string]: any;
  } {
    return {
      id: ids.floatingMenu,
      dir: locale.dir,
      ...parts.floatingMenu.attrs,
      'data-focus': dataAttr(focused),
      'data-invalid': dataAttr(field?.invalid || props.invalid),
      'data-disabled': dataAttr(field?.disabled || props.disabled),
      'data-required': dataAttr(field?.required || props.required),
      'data-readonly': dataAttr(field?.readOnly || props.readOnly),
    };
  }

  function getCharactersCountProps(): HTMLArkProps<'span'> & {
    [key: string]: any;
  } {
    const count = editorState?.charactersCount ?? null;

    return {
      id: ids.charactersCount,
      dir: locale.dir,
      ...parts.charactersCount.attrs,
      'data-focus': dataAttr(focused),
      'data-invalid': dataAttr(field?.invalid || props.invalid),
      'data-disabled': dataAttr(field?.disabled || props.disabled),
      'data-required': dataAttr(field?.required || props.required),
      'data-readonly': dataAttr(field?.readOnly || props.readOnly),
      hidden: limit == null || count == null,
      children: limit == null || count == null ? null : `${count}/${limit}`,
    };
  }

  return {
    value,
    setValue,
    editor,
    editorState,
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
