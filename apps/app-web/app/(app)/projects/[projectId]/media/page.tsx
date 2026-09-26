import type { Metadata } from 'next';

import { MediaPage } from '@/features/media-mapping/media-page';

export const metadata: Metadata = { title: 'Media' };

export default function Page() {
  return <MediaPage />;
}
