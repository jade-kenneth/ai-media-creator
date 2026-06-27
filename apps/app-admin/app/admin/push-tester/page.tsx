import type { Metadata } from 'next';

import { PushTesterPageView } from '@/features/push-tester';

export const metadata: Metadata = {
  title: 'Push Notification Tester',
};

export default function PushTesterPage() {
  return <PushTesterPageView />;
}
