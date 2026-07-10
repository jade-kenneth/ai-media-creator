import type { LucideIcon } from 'lucide-react';
import { Building2, LayoutDashboard, UserX, Users } from 'lucide-react';

export const SUPER_ADMIN_NAME = 'Super Admin';

export type SuperAdminNavItem = {
  href: string;
  labelKey: string;
  descriptionKey: string;
  icon: LucideIcon;
};

export const SUPER_ADMIN_NAV_ITEMS: SuperAdminNavItem[] = [
  {
    href: '/super-admin/dashboard',
    labelKey: 'superAdmin',
    descriptionKey: 'dashboardDescription',
    icon: LayoutDashboard,
  },
  {
    href: '/super-admin/organizations',
    labelKey: 'organizations',
    descriptionKey: 'organizationsDescription',
    icon: Building2,
  },
  {
    href: '/super-admin/admin-accounts',
    labelKey: 'adminAccounts',
    descriptionKey: 'adminAccountsDescription',
    icon: Users,
  },
  {
    href: '/super-admin/account-deletion-requests',
    labelKey: 'deletionRequests',
    descriptionKey: 'deletionRequestsDescription',
    icon: UserX,
  },
];

export const SUPER_ADMIN_PAGE_DETAILS = {
  '/super-admin/dashboard': {
    titleKey: 'superAdmin',
    descriptionKey: 'pageDashboard',
  },
  '/super-admin/organizations': {
    titleKey: 'organizations',
    descriptionKey: 'pageOrganizations',
  },
  '/super-admin/admin-accounts': {
    titleKey: 'adminAccounts',
    descriptionKey: 'pageAdminAccounts',
  },
  '/super-admin/account-deletion-requests': {
    titleKey: 'deletionRequests',
    descriptionKey: 'pageDeletionRequests',
  },
} as const;
