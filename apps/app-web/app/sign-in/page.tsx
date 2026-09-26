import type { Metadata } from 'next';
import { Suspense } from 'react';

import { SignInPage } from '@/features/sign-in/sign-in-page';

export const metadata: Metadata = {
  title: 'Sign in',
};

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-canvas" />}>
      <SignInPage />
    </Suspense>
  );
}
