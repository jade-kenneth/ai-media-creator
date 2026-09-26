'use client';

import { CircleCheckIcon, InfoIcon, TriangleAlertIcon } from 'lucide-react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

import { Spinner } from '@/components/ui/spinner';

/**
 * Toasts per design/system/components-states.md#toasts: ink background, white
 * 14/20 text, a success-tinted check, ~3.6s, announced politely. Toasts only
 * confirm; errors that need action are banners. They sit 88px up when a
 * sticky footer bar is on screen (see --toast-bottom in globals.css).
 */
function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="bottom-right"
      duration={3600}
      gap={8}
      offset={{ bottom: 'var(--toast-bottom)', right: '24px' }}
      mobileOffset={{ bottom: 'var(--toast-bottom)', left: '16px', right: '16px' }}
      icons={{
        success: <CircleCheckIcon className="size-4 text-success-border" />,
        info: <InfoIcon className="size-4 text-info-border" />,
        warning: <TriangleAlertIcon className="size-4 text-warning-border" />,
        loading: <Spinner />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'flex w-full items-center gap-3 rounded-md bg-ink px-4 py-3 text-sm text-white shadow-e3 sm:w-90',
          title: 'font-medium',
          description: 'text-white/80',
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
