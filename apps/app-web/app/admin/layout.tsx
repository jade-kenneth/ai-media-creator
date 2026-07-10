'use client';

import type { ReactNode } from 'react';

import { AdminShell } from '@/features/admin-shell';
import { withAuthGuard } from '@/features/auth';

type AdminLayoutProps = {
  children: ReactNode;
};

function AdminLayout({ children }: AdminLayoutProps) {
  return <AdminShell>{children}</AdminShell>;
}

export default withAuthGuard(AdminLayout);
