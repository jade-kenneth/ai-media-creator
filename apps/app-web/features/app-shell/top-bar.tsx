'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { BrandMark, Wordmark } from '@/components/brand/brand-mark';
import { cn } from '@/lib/utils';

import { AccountMenu } from './account-menu';
import { CreditsPopover } from './credits-popover';

/** The 60px sticky top bar (Design Reference §3). */
export function TopBar() {
  const pathname = usePathname();
  const onProjects = pathname === '/projects';

  return (
    <header className="sticky top-0 z-40 h-15 border-b border-border bg-surface">
      <div className="flex h-full items-center gap-4 px-6 max-sm:px-4">
        <Link
          href="/projects"
          aria-label="AI Creation Platform, go to projects"
          className="flex items-center gap-2 rounded-sm text-ink"
        >
          <BrandMark />
          <Wordmark className="max-sm:hidden" />
        </Link>
        <nav aria-label="Primary">
          <Link
            href="/projects"
            aria-current={onProjects ? 'page' : undefined}
            className={cn(
              't-label flex h-8 items-center rounded-sm px-3 text-ink hover:bg-surface-hover max-lg:h-10',
              onProjects && 'bg-surface-sunken',
            )}
          >
            Projects
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <CreditsPopover />
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
