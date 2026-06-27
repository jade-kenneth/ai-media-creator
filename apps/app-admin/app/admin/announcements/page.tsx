import type { Metadata } from 'next';

import { AnnouncementsPageView } from '@/features/announcements';

export const metadata: Metadata = {
  title: 'Announcements',
};

export default function AnnouncementsPage() {
  return <AnnouncementsPageView />;
}
