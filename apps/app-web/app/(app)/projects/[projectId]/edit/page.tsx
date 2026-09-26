import type { Metadata } from 'next';

import { SceneEditorPage } from '@/features/scene-editor/scene-editor-page';

export const metadata: Metadata = { title: 'Edit & preview' };

export default function Page() {
  return <SceneEditorPage />;
}
