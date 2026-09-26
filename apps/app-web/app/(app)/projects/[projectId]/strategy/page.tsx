import type { Metadata } from 'next';

import { StrategyPage } from '@/features/strategy/strategy-page';

export const metadata: Metadata = { title: 'Strategy' };

export default function Page() {
  return <StrategyPage />;
}
