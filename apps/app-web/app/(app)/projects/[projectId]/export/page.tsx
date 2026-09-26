import type { Metadata } from 'next';

import { ExportPage } from '@/features/export/export-page';

export const metadata: Metadata = { title: 'Export video' };

export default function Page() {
  return <ExportPage />;
}
