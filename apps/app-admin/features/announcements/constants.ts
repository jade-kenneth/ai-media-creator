import { AnnouncementCategory } from '@/react-query/generated__types';

export const ANNOUNCEMENT_PAGE_SIZE = 10;
export const ANNOUNCEMENT_SEARCH_LIMIT = 100;

export const announcementCategoryOptions = [
  {
    value: AnnouncementCategory.News,
    label: 'News',
  },
  {
    value: AnnouncementCategory.Event,
    label: 'Event',
  },
  {
    value: AnnouncementCategory.Emergency,
    label: 'Emergency',
  },
  {
    value: AnnouncementCategory.RoadClosure,
    label: 'Road Closure',
  },
  {
    value: AnnouncementCategory.PowerInterruption,
    label: 'Power Interruption',
  },
  {
    value: AnnouncementCategory.HealthAdvisory,
    label: 'Health Advisory',
  },
  {
    value: AnnouncementCategory.GeneralNotice,
    label: 'General Notice',
  },
] as const;

export type AnnouncementCategoryFilterValue =
  (typeof announcementCategoryOptions)[number]['value'];
