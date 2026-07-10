'use client';

import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { CSSProperties, ReactNode } from 'react';
import { useMemo } from 'react';

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { ThemeToggle } from '@/features/admin-shell/theme-toggle';
import { LanguageSwitcher } from '@/features/admin-shell/language-switcher';
import { UserMenu } from '@/features/admin-shell/user-menu';
import { SUPER_ADMIN_PAGE_DETAILS } from './super-admin-config';
import { SuperAdminSidebar } from './super-admin-sidebar';

type SuperAdminShellProps = {
  children: ReactNode;
};

const sidebarStyle = {
  '--sidebar-width': '15rem',
  '--sidebar-width-icon': '3.5rem',
} as CSSProperties;

const fallbackPage = {
  titleKey: 'superAdmin',
  descriptionKey: 'description',
};

export function SuperAdminShell({ children }: SuperAdminShellProps) {
  const pathname = usePathname();
  const t = useTranslations('SuperAdminShell');

  const page = useMemo(() => {
    return (
      SUPER_ADMIN_PAGE_DETAILS[
        pathname as keyof typeof SUPER_ADMIN_PAGE_DETAILS
      ] ?? fallbackPage
    );
  }, [pathname]);

  return (
    <SidebarProvider defaultOpen style={sidebarStyle}>
      <SuperAdminSidebar />
      <SidebarInset className="min-h-dvh min-w-0 bg-transparent">
        <header className="sticky top-0 z-40 px-4 pt-4 backdrop-blur-xl md:px-6">
          <div className="mx-auto w-full max-w-screen-2xl">
            <div className="admin-surface flex min-h-[76px] items-center justify-between gap-4 px-4 py-3 sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <SidebarTrigger className="md:hidden" />
                <div className="min-w-0 space-y-1">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground sm:text-base">
                      {t(page.titleKey)}
                    </p>
                    <p className="hidden truncate text-sm text-muted-foreground lg:block">
                      {t(page.descriptionKey)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <LanguageSwitcher />
                <ThemeToggle />
                <UserMenu />
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-screen-2xl flex-1 flex-col px-4 pb-6 pt-4 md:px-6 md:pb-8 md:pt-5">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
