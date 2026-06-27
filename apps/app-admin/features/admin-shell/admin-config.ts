import type { LucideIcon } from 'lucide-react';
import { Bell, LayoutDashboard, Megaphone, Users } from 'lucide-react';

export const ADMIN_NAME = 'App Admin';
export const ADMIN_EMAIL = 'admin@example.com';

export type AdminNavItem = {
  href: string;
  labelKey: string;
  descriptionKey: string;
  icon: LucideIcon;
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    href: '/admin/dashboard',
    labelKey: 'dashboard',
    descriptionKey: 'dashboardDescription',
    icon: LayoutDashboard,
  },
  {
    href: '/admin/members',
    labelKey: 'members',
    descriptionKey: 'membersDescription',
    icon: Users,
  },
  {
    href: '/admin/announcements',
    labelKey: 'announcements',
    descriptionKey: 'announcementsDescription',
    icon: Megaphone,
  },
  {
    href: '/admin/push-tester',
    labelKey: 'pushTester',
    descriptionKey: 'pushTesterDescription',
    icon: Bell,
  },
];

export const ADMIN_PAGE_DETAILS = {
  '/admin/dashboard': {
    titleKey: 'dashboard',
    descriptionKey: 'pageDashboard',
  },
  '/admin/members': {
    titleKey: 'members',
    descriptionKey: 'pageMembers',
  },
  '/admin/announcements': {
    titleKey: 'announcements',
    descriptionKey: 'pageAnnouncements',
  },
  '/admin/push-tester': {
    titleKey: 'pushTester',
    descriptionKey: 'pagePushTester',
  },
} as const;

export function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
