'use client';

import { Building2, ChevronsLeft, ChevronsRight } from 'lucide-react';
import Image from 'next/image';
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
import {
  ADMIN_EMAIL,
  ADMIN_NAME,
  ADMIN_NAV_ITEMS,
  getInitials,
} from './admin-config';

import { useCurrentQuery } from '@/react-query/auth/auth-operations';
import { useOrganizationQuery } from '@/react-query/organizations/organizations-operations';
import { RegistrationStatus } from '@/react-query/generated__types';
import { useAdminMembersCountQuery } from '@/react-query/members/members-operations';
import { cn } from '@/utils';
import { FEATURE_FLAGS } from '@/utils/feature-flags';

function SidebarFooterIdentity() {
  const { state } = useSidebar();
  const user = useCurrentQuery();
  const email = user.data?.me.email ?? ADMIN_EMAIL;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-3 rounded-[22px] border border-sidebar-border bg-background/80 px-3 py-3 shadow-sm">
          <Avatar>
            <AvatarFallback>{getInitials(ADMIN_NAME)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-medium text-sidebar-foreground">
              {ADMIN_NAME}
            </p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="right" hidden={state !== 'collapsed'}>
        {email}
      </TooltipContent>
    </Tooltip>
  );
}

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

export function AdminSidebar() {
  const pathname = usePathname();
  const t = useTranslations('AdminShell');
  const commonT = useTranslations('Common');
  const currentUser = useCurrentQuery();
  const organizationId = currentUser.data?.me.organizationId;
  const organizationQuery = useOrganizationQuery(
    organizationId ? { id: organizationId } : undefined,
    { enabled: Boolean(organizationId) },
  );
  const organization = organizationQuery.data?.organization;
  const features = organization?.features ?? [];
  const isMembersEnabled = features.includes(FEATURE_FLAGS.ADMIN_MEMBERS);
  const isRequestsEnabled = features.includes(FEATURE_FLAGS.ADMIN_REQUESTS);
  const isOfficialsEnabled = features.includes(FEATURE_FLAGS.OFFICIALS);
  const isPollsEnabled = features.includes(FEATURE_FLAGS.COMMUNITY_POLLS);
  const isAdminGalleryEnabled = features.includes(FEATURE_FLAGS.ADMIN_GALLERY);
  const visibleNavItems = ADMIN_NAV_ITEMS.filter((item) => {
    if (item.href === '/admin/members') return isMembersEnabled;
    if (item.href === '/admin/requests') return isRequestsEnabled;
    if (item.href === '/admin/services') return isRequestsEnabled;
    if (item.href === '/admin/officials') return isOfficialsEnabled;
    if (item.href === '/admin/polls') return isPollsEnabled;
    if (item.href === '/admin/gallery') return isAdminGalleryEnabled;
    return true;
  });

  const pendingMembersQuery = useAdminMembersCountQuery(
    {
      filter: {
        registrationStatus: {
          equal: RegistrationStatus.PendingApproval,
        },
      },
    },
    { enabled: isMembersEnabled },
  );
  const pendingMembersCount =
    pendingMembersQuery.data?.adminMembers.totalCount ?? 0;

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border/70 bg-sidebar/95"
    >
      <SidebarHeader className="px-3 py-4">
        <div className="rounded-[28px] border border-sidebar-border bg-background/65 p-3 shadow-sm">
          <div className="flex items-center gap-3 px-1">
            <div className="flex size-10 items-center justify-center overflow-hidden rounded-2xl bg-primary/5 shadow-sm">
              {organization?.logoUrl ? (
                <Image
                  src={organization.logoUrl}
                  alt={`${organization.name} logo`}
                  width={40}
                  height={40}
                  sizes="40px"
                  unoptimized
                  className="size-10 object-cover"
                />
              ) : (
                <Building2 className="size-6 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              {organizationQuery.isLoading ? (
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
              ) : (
                <p className="truncate text-sm font-semibold text-sidebar-foreground">
                  {organization?.name ?? t('organization')}
                </p>
              )}
              <p className="truncate text-xs text-muted-foreground">
                {t('adminPortal')}
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
              {visibleNavItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      size="lg"
                      tooltip={t(item.labelKey)}
                      className="relative min-h-14 rounded-[22px] px-3 py-3 before:absolute before:top-3 before:bottom-3 before:left-0 before:w-0.75 before:rounded-full before:bg-primary before:opacity-0 hover:bg-sidebar-accent/75 data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:before:opacity-100 group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-0"
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
                    {item.href === '/admin/members' &&
                    pendingMembersCount > 0 ? (
                      <SidebarMenuBadge
                        className={cn(
                          'bg-primary/10 text-[blue]',
                          isActive && 'bg-primary text-white!',
                        )}
                      >
                        {pendingMembersCount > 99
                          ? '99+'
                          : pendingMembersCount}
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
