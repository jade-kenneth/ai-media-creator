'use client';

import { Button } from '@/components/ui/button';
import { CardFooter } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Heading1, Smile, TextCursorInput } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { RichText, type RichTextProps } from '@/components/RichText';
import { store } from '@/providers/AuthProvider/store';
import { cn } from '@/utils';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const COMMON_EDITOR_EMOJIS = [
  '😀',
  '😁',
  '😂',
  '😊',
  '😍',
  '😎',
  '🤝',
  '🙏',
  '👏',
  '👍',
  '👋',
  '🎉',
  '✨',
  '📣',
  '📌',
  '📅',
  '📍',
  '⚠️',
  '✅',
  '❗',
];

type PresignedUploadResponse = {
  key: string;
  uploadUrl: string;
  publicUrl: string | null;
};

export interface RichTextFieldProps extends Omit<
  RichTextProps,
  'editorRef' | 'id' | 'onChange' | 'onImageUpload' | 'onValueChange'
> {
  enableImageUpload?: boolean;
  showToolbar?: boolean;
  id: string;
  label: string;
  errorMessage?: string;
  helperText?: string;
  maxFileSizeBytes?: number;
  onChange?: (value: string) => void;
  uploadPathPrefix?: string;
}

async function uploadEditorImage(
  file: File,
  uploadPathPrefix: string,
  maxFileSizeBytes: number,
) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select an image file.');
  }

  if (file.size > maxFileSizeBytes) {
    const limitMb = Math.round(maxFileSizeBytes / (1024 * 1024));
    throw new Error(`Image must be smaller than ${limitMb} MB.`);
  }

  const graphqlUrl =
    process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'http://localhost:3001/graphql';
  const apiBaseUrl = graphqlUrl.replace(/\/graphql\/?$/, '');
  const auth = await store.get('accessToken');
  const key = `${uploadPathPrefix.replace(/^\/+|\/+$/g, '')}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;

  const presignedResponse = await fetch(
    `${apiBaseUrl}/files/presigned-upload-url?expiresInSeconds=900`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
      },
      body: JSON.stringify({
        key,
        contentType: file.type,
      }),
    },
  );

  if (!presignedResponse.ok) {
    throw new Error('Unable to prepare image upload.');
  }

  const presignedData =
    (await presignedResponse.json()) as PresignedUploadResponse;
  const uploadResponse = await fetch(presignedData.uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error('Image upload failed.');
  }

  return presignedData.publicUrl ?? presignedData.uploadUrl.split('?')[0];
}

function ToolbarButton(props: { children: React.ReactElement; label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{props.children}</TooltipTrigger>
      <TooltipContent sideOffset={6}>{props.label}</TooltipContent>
    </Tooltip>
  );
}

function EmojiPickerButton(props: {
  disabled?: boolean;
  onSelectEmoji: (emoji: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={props.disabled}
              className="min-w-0 shrink-0"
              aria-label="Insert emoji"
              onMouseDown={(event) => {
                event.preventDefault();
              }}
            >
              <Smile className="size-4" />
              <span className="hidden md:inline">Emoji</span>
              <span className="sr-only">Emoji</span>
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent sideOffset={6}>Insert emoji</TooltipContent>
      </Tooltip>

      <PopoverContent align="start" className="w-72 gap-3 p-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Insert emoji</p>
          <p className="text-xs text-muted-foreground">
            Pick one to insert at the current cursor position.
          </p>
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          {COMMON_EDITOR_EMOJIS.map((emoji) => (
            <Button
              key={emoji}
              type="button"
              variant="ghost"
              size="sm"
              className="h-10 text-lg"
              onMouseDown={(event) => {
                event.preventDefault();
              }}
              onClick={() => {
                props.onSelectEmoji(emoji);
                setOpen(false);
              }}
            >
              <span aria-hidden>{emoji}</span>
              <span className="sr-only">Insert {emoji}</span>
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function RichTextField({
  id,
  label,
  errorMessage,
  helperText,
  onChange,
  uploadPathPrefix = 'editor',
  maxFileSizeBytes = MAX_FILE_SIZE_BYTES,
  enableImageUpload = true,
  showToolbar = true,
  value,
  defaultValue,
  disabled,
  invalid,
  limit = 5000,
  placeholder = 'Write your content here',
  ...props
}: RichTextFieldProps) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label className="text-sm font-medium" htmlFor={id}>
        {label}
      </label>

      <RichText.Root
        className="w-full"
        id={id}
        ids={{
          content: id,
        }}
        value={value}
        defaultValue={defaultValue}
        disabled={disabled}
        invalid={invalid ?? Boolean(errorMessage)}
        limit={limit}
        placeholder={placeholder}
        onValueChange={(detail) => onChange?.(detail.value)}
        onImageUpload={
          enableImageUpload
            ? async (file) => {
                try {
                  const uploadedUrl = await uploadEditorImage(
                    file,
                    uploadPathPrefix,
                    maxFileSizeBytes,
                  );
                  toast.success('Image uploaded successfully.');
                  return uploadedUrl;
                } catch (error) {
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : 'Unable to upload image right now.',
                  );
                  throw error;
                }
              }
            : undefined
        }
        {...props}
      >
        {showToolbar ? (
          <>
            <RichText.Control>
              <TooltipProvider>
                <ScrollArea className="w-full">
                  <div className="flex min-h-8 w-full min-w-0 flex-wrap items-center gap-1">
                    <RichText.Context>
                      {({ editor }) => {
                        const headingLabel = editor?.isActive('heading')
                          ? `H${editor.getAttributes('heading').level ?? 1}`
                          : 'Headings';
                        const activeTextAlign = editor?.isActive({
                          textAlign: 'justify',
                        })
                          ? 'Justify'
                          : editor?.isActive({
                                textAlign: 'right',
                              })
                            ? 'Right'
                            : editor?.isActive({
                                  textAlign: 'center',
                                })
                              ? 'Center'
                              : 'Left';

                        return (
                          <>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={disabled || props.readOnly}
                                  className="min-w-0 shrink-0"
                                >
                                  <Heading1 className="size-4" />
                                  <span className="hidden md:inline">
                                    {headingLabel}
                                  </span>
                                  <span className="sr-only">
                                    {headingLabel}
                                  </span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="start"
                                className="w-44"
                              >
                                {[1, 2, 3, 4, 5, 6].map((level) => (
                                  <DropdownMenuItem
                                    key={level}
                                    onSelect={(event) => {
                                      event.preventDefault();
                                      editor
                                        ?.chain()
                                        .focus()
                                        .toggleHeading({
                                          level: level as 1 | 2 | 3 | 4 | 5 | 6,
                                        })
                                        .run();
                                    }}
                                  >
                                    Heading {level}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={disabled || props.readOnly}
                                  className="min-w-0 shrink-0"
                                >
                                  <TextCursorInput className="size-4" />
                                  <span className="hidden md:inline">
                                    {activeTextAlign}
                                  </span>
                                  <span className="sr-only">
                                    Text align {activeTextAlign}
                                  </span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="start"
                                className="w-40"
                              >
                                {[
                                  ['Left', 'left'],
                                  ['Center', 'center'],
                                  ['Right', 'right'],
                                  ['Justify', 'justify'],
                                ].map(([label, textAlign]) => (
                                  <DropdownMenuItem
                                    key={textAlign}
                                    onSelect={(event) => {
                                      event.preventDefault();
                                      editor
                                        ?.chain()
                                        .focus()
                                        .setTextAlign(
                                          textAlign as
                                            | 'left'
                                            | 'center'
                                            | 'right'
                                            | 'justify',
                                        )
                                        .run();
                                    }}
                                  >
                                    {label}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </>
                        );
                      }}
                    </RichText.Context>

                    <Separator
                      orientation="vertical"
                      className="mx-1 hidden h-5 sm:block"
                    />

                    <ToolbarButton label="Bold">
                      <RichText.BoldTrigger />
                    </ToolbarButton>
                    <ToolbarButton label="Italic">
                      <RichText.ItalicTrigger />
                    </ToolbarButton>
                    <ToolbarButton label="Underline">
                      <RichText.UnderlineTrigger />
                    </ToolbarButton>
                    <ToolbarButton label="Strike">
                      <RichText.StrikeTrigger />
                    </ToolbarButton>

                    <Separator
                      orientation="vertical"
                      className="mx-1 hidden h-5 sm:block"
                    />

                    <ToolbarButton label="Bullet list">
                      <RichText.BulletListTrigger />
                    </ToolbarButton>
                    <ToolbarButton label="Ordered list">
                      <RichText.OrderedListTrigger />
                    </ToolbarButton>
                    <ToolbarButton label="Blockquote">
                      <RichText.BlockquoteTrigger />
                    </ToolbarButton>
                    <ToolbarButton label="Code block">
                      <RichText.CodeBlockTrigger />
                    </ToolbarButton>
                    <ToolbarButton label="Hard break">
                      <RichText.HardBreakTrigger />
                    </ToolbarButton>

                    <Separator
                      orientation="vertical"
                      className="mx-1 hidden h-5 sm:block"
                    />

                    <ToolbarButton label="Insert link">
                      <RichText.LinkTrigger />
                    </ToolbarButton>
                    {enableImageUpload ? (
                      <ToolbarButton label="Insert image">
                        <RichText.ImageTrigger />
                      </ToolbarButton>
                    ) : null}
                    <RichText.Context>
                      {({ editor }) => (
                        <EmojiPickerButton
                          disabled={disabled || props.readOnly || !editor}
                          onSelectEmoji={(emoji) => {
                            editor?.chain().focus().insertContent(emoji).run();
                          }}
                        />
                      )}
                    </RichText.Context>

                    <Separator
                      orientation="vertical"
                      className="mx-1 hidden h-5 sm:block"
                    />

                    <ToolbarButton label="Undo">
                      <RichText.UndoTrigger />
                    </ToolbarButton>
                    <ToolbarButton label="Redo">
                      <RichText.RedoTrigger />
                    </ToolbarButton>
                  </div>
                </ScrollArea>
              </TooltipProvider>
            </RichText.Control>

            <RichText.BubbleMenu>
              <ToolbarButton label="Bold">
                <RichText.BoldTrigger />
              </ToolbarButton>
              <ToolbarButton label="Italic">
                <RichText.ItalicTrigger />
              </ToolbarButton>
              <ToolbarButton label="Underline">
                <RichText.UnderlineTrigger />
              </ToolbarButton>
              <ToolbarButton label="Insert link">
                <RichText.LinkTrigger />
              </ToolbarButton>
            </RichText.BubbleMenu>
          </>
        ) : null}

        <RichText.Content />
        {enableImageUpload ? <RichText.ImageHiddenInput /> : null}

        <CardFooter className="flex-col items-start gap-2 border-t border-border/70 bg-muted/10 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <p
            className={cn(
              'text-xs text-muted-foreground',
              !helperText && 'invisible',
            )}
          >
            {helperText ??
              (showToolbar
                ? 'Use the toolbar to format text, links, images, and emoji.'
                : 'Write your content here.')}
          </p>
          <RichText.CharactersCount />
        </CardFooter>
      </RichText.Root>

      {errorMessage ? (
        <p className="text-xs text-destructive" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}

/** commit */
