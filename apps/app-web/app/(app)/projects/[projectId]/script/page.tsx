import type { Metadata } from 'next';

import { ScriptPage } from '@/features/script-studio/script-page';

export const metadata: Metadata = { title: 'Script' };

export default function Page() {
  return <ScriptPage />;
}
