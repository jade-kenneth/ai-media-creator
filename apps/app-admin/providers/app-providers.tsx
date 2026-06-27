'use client';

import { ThemeProvider } from 'next-themes';
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
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryProvider>
        <TooltipProvider delayDuration={150}>
          <AuthProvider>{children}</AuthProvider>
          <Toaster closeButton position="top-right" />
        </TooltipProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
