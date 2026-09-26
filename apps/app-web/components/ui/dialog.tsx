'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { XIcon } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Dialog per design/system/components-states.md#dialogs: 480px, 14px radius,
 * e3, rgba(14,14,18,.48) backdrop; a bottom sheet with stacked full-width
 * actions below 640px. Motion per motion.md: enter 180ms (sheet 280ms drawer
 * curve), exit 120ms opacity. Radix traps and restores focus; Escape cancels.
 */
function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        'fixed inset-0 isolate z-50 bg-scrim data-open:animate-in data-open:fade-in-0 data-open:duration-180 data-closed:animate-out data-closed:fade-out-0 data-closed:duration-120',
        className,
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          'fixed z-50 flex flex-col overflow-hidden bg-surface text-ink shadow-e3 outline-none',
          // ≥ 640px: centred dialog
          'sm:top-1/2 sm:left-1/2 sm:max-h-[calc(100dvh-4rem)] sm:w-120 sm:max-w-[calc(100%-2rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:data-open:zoom-in-97',
          // < 640px: bottom sheet
          'inset-x-0 bottom-0 max-h-[90dvh] rounded-t-lg pb-[env(safe-area-inset-bottom)] max-sm:data-open:slide-in-from-bottom max-sm:data-open:duration-280 max-sm:data-open:ease-drawer max-sm:data-closed:slide-out-to-bottom',
          'data-open:animate-in data-open:fade-in-0 data-open:duration-180 data-open:ease-out data-closed:animate-out data-closed:fade-out-0 data-closed:duration-120',
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<'div'> & { showCloseButton?: boolean }) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        'flex shrink-0 items-start justify-between gap-4 px-6 pt-5 pb-3 max-sm:px-4',
        className,
      )}
      {...props}
    >
      <div className="flex min-w-0 flex-col gap-1">{children}</div>
      {showCloseButton ? (
        <DialogPrimitive.Close asChild>
          <Button variant="ghost" size="icon" className="-mt-1 -mr-2">
            <XIcon />
            <span className="sr-only">Close</span>
          </Button>
        </DialogPrimitive.Close>
      ) : null}
    </div>
  );
}

function DialogBody({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-body"
      className={cn(
        'flex min-h-0 flex-col gap-5 overflow-y-auto px-6 pb-6 max-sm:px-4',
        className,
      )}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'flex shrink-0 flex-col-reverse gap-2 border-t border-border bg-canvas px-6 py-4 max-sm:px-4 sm:flex-row sm:justify-end sm:gap-3 max-sm:[&>*]:w-full',
        className,
      )}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('t-h2 text-ink', className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('t-sm text-ink-2', className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
