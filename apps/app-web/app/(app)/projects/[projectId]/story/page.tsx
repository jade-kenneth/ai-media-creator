import type { Metadata } from 'next';

import { StoryPage } from '@/features/story-setup/story-page';

export const metadata: Metadata = { title: 'Story' };

export default function Page() {
  return <StoryPage />;
}
