import { WaitlistRole } from '@/react-query/generated__types';

export const WAITLIST_PAGE_SIZE = 20;

export const WAITLIST_ROLE_LABELS: Record<WaitlistRole, string> = {
  [WaitlistRole.Member]: 'Member',
  [WaitlistRole.OrganizationOfficial]: 'Official',
  [WaitlistRole.LguStaff]: 'Org Staff',
  [WaitlistRole.Other]: 'Other',
};

export const WAITLIST_ROLE_TABS = [
  {
    label: 'All',
    value: undefined,
  },
  {
    label: 'Member',
    value: WaitlistRole.Member,
  },
  {
    label: 'Official',
    value: WaitlistRole.OrganizationOfficial,
  },
  {
    label: 'Org Staff',
    value: WaitlistRole.LguStaff,
  },
  {
    label: 'Other',
    value: WaitlistRole.Other,
  },
] as const;
