'use client';

import { LockIcon, SearchIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { useAccountName } from '@/features/app-shell/account-menu';
import { logout } from '@/providers/AuthProvider';
import { buildLoginRedirectUrl, redirectToPath } from '@/react-query/session';

export function ProjectNotFound() {
  return (
    <main className="flex justify-center px-4 pt-24">
      <Empty className="max-w-110">
        <EmptyHeader>
          <EmptyMedia variant="neutral">
            <SearchIcon strokeWidth={1.75} />
          </EmptyMedia>
          <EmptyTitle as="h1">We can’t find that project</EmptyTitle>
          <EmptyDescription>
            It may have been removed, or the link is wrong.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href="/projects">Back to projects</Link>
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  );
}

export function ProjectNoAccess() {
  const pathname = usePathname();
  const account = useAccountName();
  const [switching, setSwitching] = useState(false);

  async function switchAccount() {
    if (switching) return;
    setSwitching(true);
    await logout();
    redirectToPath(buildLoginRedirectUrl('login', pathname));
  }

  return (
    <main className="flex justify-center px-4 pt-24">
      <Empty className="max-w-110">
        <EmptyHeader>
          <EmptyMedia variant="neutral">
            <LockIcon strokeWidth={1.75} />
          </EmptyMedia>
          <EmptyTitle as="h1">You don’t have access to this project</EmptyTitle>
          <EmptyDescription>
            You’re signed in as {account.email}. This project belongs to another
            account.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href="/projects">Back to my projects</Link>
          </Button>
          <Button variant="secondary" onClick={() => void switchAccount()} disabled={switching}>
            {switching ? <Spinner /> : null}
            Switch account
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  );
}

export function ProjectLoading() {
  return (
    <div
      className="lg:grid lg:grid-cols-[var(--rail-w)_1fr]"
      aria-busy="true"
      aria-label="Loading project"
    >
      <div className="flex flex-col gap-3 border-r border-border bg-surface px-4 py-5 max-lg:hidden lg:h-[calc(100dvh-var(--topbar-h))]">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-40" />
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-8 w-full rounded-md" />
        ))}
      </div>
      <div className="flex flex-col gap-4 px-8 pt-7 max-lg:px-4">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-7 w-50" />
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-30 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
