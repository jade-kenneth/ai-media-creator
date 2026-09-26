import type { Metadata } from 'next';

import { FactsPage } from '@/features/fact-review/facts-page';

export const metadata: Metadata = { title: 'Facts' };

export default function Page() {
  return <FactsPage />;
}
