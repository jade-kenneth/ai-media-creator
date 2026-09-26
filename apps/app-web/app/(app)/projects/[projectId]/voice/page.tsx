import type { Metadata } from 'next';

import { VoicePage } from '@/features/voice-studio/voice-page';

export const metadata: Metadata = { title: 'Voice' };

export default function Page() {
  return <VoicePage />;
}
