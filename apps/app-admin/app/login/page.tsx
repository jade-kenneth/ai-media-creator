import type { Metadata } from 'next';

import { LoginPageView } from '@/features/auth';

export const metadata: Metadata = {
  title: 'Sign In',
};

export default function LoginPage() {
  return <LoginPageView />;
}
