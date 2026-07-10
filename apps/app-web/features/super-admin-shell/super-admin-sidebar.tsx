'use client';

import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAdminAccountDeletionRequestsCountQuery } from '@/react-query/account-deletion-requests/account-deletion-requests-operations';
import { AccountDeletionRequestStatus } from '@/react-query/generated__types';
import { cn } from '@/utils';
import { SUPER_ADMIN_NAME, SUPER_ADMIN_NAV_ITEMS } from './super-admin-config';

function SidebarCollapseButton() {
  const { state, toggleSidebar } = useSidebar();
  const t = useTranslations('Common');

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="justify-start rounded-[22px] border-sidebar-border bg-background/80 shadow-sm group-data-[collapsible=icon]:justify-center"
      onClick={toggleSidebar}
    >
      {state === 'collapsed' ? (
        <ChevronsRight className="size-4" />
      ) : (
        <ChevronsLeft className="size-4" />
      )}
      <span className="group-data-[collapsible=icon]:hidden">
        {state === 'collapsed' ? t('expandSidebar') : t('collapseSidebar')}
      </span>
    </Button>
  );
}

function SidebarFooterIdentity() {
  const { state } = useSidebar();
  const t = useTranslations('SuperAdminShell');

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-3 rounded-[22px] border border-sidebar-border bg-background/80 px-3 py-3 shadow-sm">
          <Avatar>
            <AvatarFallback>SA</AvatarFallback>
          </Avatar>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-medium text-sidebar-foreground">
              {SUPER_ADMIN_NAME}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {t('platformAdministrator')}
            </p>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="right" hidden={state !== 'collapsed'}>
        {SUPER_ADMIN_NAME}
      </TooltipContent>
    </Tooltip>
  );
}

export function SuperAdminSidebar() {
  const pathname = usePathname();
  const t = useTranslations('SuperAdminShell');
  const commonT = useTranslations('Common');
  const pendingDeletionRequestsQuery =
    useAdminAccountDeletionRequestsCountQuery({
      filter: {
        status: {
          equal: AccountDeletionRequestStatus.Pending,
        },
      },
    });
  const pendingDeletionRequestsCount =
    pendingDeletionRequestsQuery.data?.adminAccountDeletionRequests
      .totalCount ?? 0;

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border/70 bg-sidebar/95"
    >
      <SidebarHeader className="px-3 py-4">
        <div className="rounded-[28px] border border-sidebar-border bg-background/65 p-3 shadow-sm">
          <div className="flex items-center gap-3 px-1">
            <div className="flex size-10 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 shadow-sm">
              <span className="text-sm font-bold text-primary">SA</span>
            </div>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-semibold text-sidebar-foreground">
                Platform Console
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {t('superAdmin')}
              </p>
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-2">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="px-4 text-[11px] uppercase tracking-[0.22em] text-sidebar-foreground/60">
            {commonT('navigation')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2 px-0.5">
              {SUPER_ADMIN_NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      size="lg"
                      tooltip={t(item.labelKey)}
                      className="relative min-h-14 rounded-[22px] px-3 py-3 before:absolute before:top-3 before:bottom-3 before:left-0 before:w-[3px] before:rounded-full before:bg-primary before:opacity-0 hover:bg-sidebar-accent/75 data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:before:opacity-100 group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-0"
                    >
                      <Link href={item.href}>
                        <Icon className="mt-0.5 size-4" />
                        <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                          <p className="truncate text-sm font-medium">
                            {t(item.labelKey)}
                          </p>
                          <p
                            className={cn(
                              'truncate text-xs text-muted-foreground transition-colors',
                              isActive && 'text-primary/80',
                            )}
                          >
                            {t(item.descriptionKey)}
                          </p>
                        </div>
                      </Link>
                    </SidebarMenuButton>
                    {item.href === '/super-admin/account-deletion-requests' &&
                    pendingDeletionRequestsCount > 0 ? (
                      <SidebarMenuBadge
                        className={cn(
                          'bg-primary/10 text-[blue]',
                          isActive && 'bg-primary !text-white',
                        )}
                      >
                        {pendingDeletionRequestsCount > 99
                          ? '99+'
                          : pendingDeletionRequestsCount}
                      </SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/70 px-3 py-3">
        <SidebarFooterIdentity />
        <SidebarCollapseButton />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
