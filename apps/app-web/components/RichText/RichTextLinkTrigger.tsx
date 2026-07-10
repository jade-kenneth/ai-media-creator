/** commit */
'use client';

import { Link2 } from 'lucide-react';
import { forwardRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import { RichTextTriggerButton } from './RichTextTriggerButton';
import { useRichTextContext } from './useRichTextContext';

export type RichTextLinkTriggerProps = React.ComponentPropsWithRef<'button'>;

function normalizeUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return '';
  }

  try {
    return new URL(trimmed).toString();
  } catch {
    try {
      return new URL(`https://${trimmed}`).toString();
    } catch {
      return null;
    }
  }
}

export const LinkTrigger = forwardRef<
  HTMLButtonElement,
  RichTextLinkTriggerProps
>(({ className, children, ...props }, ref) => {
  const richText = useRichTextContext();
  const triggerProps = richText.getLinkTriggerProps();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setUrl(richText.editor?.getAttributes('link').href ?? '');
    }

    setOpen(nextOpen);
  }

  function handleSave() {
    const editor = richText.editor;

    if (!editor) {
      return;
    }

    const nextUrl = normalizeUrl(url);

    if (nextUrl === null) {
      toast.error('Enter a valid URL.');
      return;
    }

    if (!nextUrl) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      setOpen(false);
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: nextUrl })
      .run();
    setOpen(false);
  }

  function handleRemove() {
    richText.editor?.chain().focus().extendMarkRange('link').unsetLink().run();
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <RichTextTriggerButton
          ref={ref}
          active={Boolean(triggerProps['aria-pressed'])}
          {...triggerProps}
          {...props}
          className={className}
        >
          {children ?? <Link2 className="size-4" />}
        </RichTextTriggerButton>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">Insert link</p>
            <p className="text-xs text-muted-foreground">
              Paste the full URL. Leaving this empty removes the current link.
            </p>
          </div>
          <Input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com"
            autoFocus
          />
          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={!richText.editor?.isActive('link')}
            >
              Remove
            </Button>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="button" size="sm" onClick={handleSave}>
                Apply
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
});

LinkTrigger.displayName = 'RichTextLinkTrigger';
