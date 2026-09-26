import type { Metadata } from 'next';

import { BriefPage } from '@/features/creator-brief/brief-page';

export const metadata: Metadata = { title: 'Creator brief' };

export default function Page() {
  return <BriefPage />;
}
