'use client';

import type { ReactNode } from 'react';

import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

import { QueryProvider } from '@/providers/query-provider';
import { AuthProvider } from './AuthProvider';

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryProvider>
      <TooltipProvider delayDuration={150}>
        <AuthProvider>{children}</AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryProvider>
  );
}
