'use client';

import type { ReactNode } from 'react';

import { SuperAdminShell } from '@/features/super-admin-shell';
import { withSuperAdminGuard } from '@/features/auth';

type SuperAdminLayoutProps = {
  children: ReactNode;
};

function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  return <SuperAdminShell>{children}</SuperAdminShell>;
}

export default withSuperAdminGuard(SuperAdminLayout);
